import asyncio
import os 
import time 
from pathlib import Path
from functools import lru_cache
import hashlib
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate




load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINCECONE_INDEX_NAME = os.getenv("PINCECONE_INDEX_NAME")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")


os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

pc = Pinecone(api_key=PINECONE_API_KEY)

index  = pc.Index(PINCECONE_INDEX_NAME)

# Global cached instances for better performance
embed_model = FastEmbedEmbeddings(
    model_name=EMBEDDING_MODEL,
    max_length=512,  # Limit input length for faster embedding
)

# Cache models at module level
_USER_CHAIN = None
_ADMIN_RAG_CHAIN = None
_RESPONSE_CACHE = {}  # Simple in-memory cache

def get_cache_key(question: str, role: str) -> str:
    """Generate cache key for question and role"""
    return hashlib.md5(f"{role}:{question.lower().strip()}".encode()).hexdigest()

def get_user_chain():
    global _USER_CHAIN
    if _USER_CHAIN is None:
        _USER_CHAIN = user_prompt | llm
    return _USER_CHAIN

def get_admin_rag_chain():
    global _ADMIN_RAG_CHAIN
    if _ADMIN_RAG_CHAIN is None:  
        _ADMIN_RAG_CHAIN = admin_prompt | llm
    return _ADMIN_RAG_CHAIN


#checking commit changes 



llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # Faster, more current model
    google_api_key=GOOGLE_API_KEY,
    temperature=0.2,  # Slightly lower for faster responses
    max_tokens=1000,  # Limit max tokens for speed
    request_timeout=30,  # Increased timeout
)

admin_prompt = PromptTemplate.from_template("""
You are a knowledgeable medical AI assistant for a healthcare platform called HealthFlow.

For greetings or casual conversation, respond warmly and offer to help with health-related questions.
For medical questions, use the provided context to give accurate, concise answers. You may also use your general medical knowledge to supplement the context when needed.
If the context does not contain relevant information for a medical question, provide a general answer based on your knowledge and mention that more specific details may not be available in the knowledge base.

Question: {question}
Context: {context}

Answer:""")

user_prompt = PromptTemplate.from_template("""
You are a helpful medical AI assistant for a healthcare platform called HealthFlow. 

For greetings or casual conversation, respond warmly and offer to help with health-related questions.
For medical questions, provide brief, accurate information and always recommend consulting healthcare professionals for specific concerns.
For non-medical questions, politely redirect to health-related topics.

Question: {question}
Answer:""")


# Simple check for casual/greeting messages that don't need RAG
GREETINGS = {"hi", "hello", "hey", "good morning", "good afternoon", "good evening", 
             "good night", "howdy", "greetings", "sup", "yo", "hola", "bonjour",
             "thanks", "thank you", "bye", "goodbye", "see you", "ok", "okay"}

def is_casual_message(question: str) -> bool:
    """Check if message is a simple greeting or casual conversation"""
    cleaned = question.lower().strip().rstrip("!?.,")
    return cleaned in GREETINGS or len(cleaned.split()) <= 2 and cleaned.split()[0] in GREETINGS

async def answer_question(question: str, role: str):
    # Check cache first for faster responses
    cache_key = get_cache_key(question, role)
    if cache_key in _RESPONSE_CACHE:
        return _RESPONSE_CACHE[cache_key]
    
    try:
        # Handle greetings/casual messages for ALL roles (no need to search books for "hi")
        if is_casual_message(question):
            final_answer = await asyncio.wait_for(
                asyncio.to_thread(get_user_chain().invoke, {"question": question}),
                timeout=30.0
            )
            result = {
                "answer": final_answer.content,
                "sources": []
            }
        # If user is not admin, act as a regular medical LLM without accessing sensitive data
        elif role.lower() != "admin":
            final_answer = await asyncio.wait_for(
                asyncio.to_thread(get_user_chain().invoke, {"question": question}),
                timeout=30.0
            )
            result = {
                "answer": final_answer.content,
                "sources": []
            }
        else:
            # Admin flow: use RAG with vector store  
            embedding = await asyncio.wait_for(
                asyncio.to_thread(embed_model.embed_query, question),
                timeout=15.0
            )
            
            results = await asyncio.wait_for(
                asyncio.to_thread(index.query, vector=embedding, top_k=5, include_metadata=True),
                timeout=15.0
            )
            
            filtered_context = []
            sources = set()
            
            for match in results["matches"]:
                # Only include results with a reasonable relevance score
                if match.get("score", 0) < 0.3:
                    continue
                metadata = match["metadata"]
                if metadata.get("role") == "admin":
                    filtered_context.append(metadata.get("text", ""))
                    sources.add(metadata.get("source"))
            
            # Use RAG chain with whatever context we found (even if empty, the prompt handles it)
            docs_text = "\n\n".join(filtered_context[:5])  # Join top 5 chunks with proper newlines
            
            final_answer = await asyncio.wait_for(
                asyncio.to_thread(get_admin_rag_chain().invoke, {"question": question, "context": docs_text}),
                timeout=45.0
            )
            
            result = {
                "answer": final_answer.content,
                "sources": list(sources)
            }
        
        # Cache the result (limit cache size to prevent memory issues)
        if len(_RESPONSE_CACHE) < 100:  # Simple cache size limit
            _RESPONSE_CACHE[cache_key] = result
        
        return result
    
    except asyncio.TimeoutError:
        result = {
            "answer": "Sorry, the request timed out. Please try again with a simpler question.",
            "sources": []
        }
        return result
    except Exception as e:
        result = {
            "answer": f"Sorry, an error occurred: {str(e)[:100]}...",
            "sources": []
        }
        return result