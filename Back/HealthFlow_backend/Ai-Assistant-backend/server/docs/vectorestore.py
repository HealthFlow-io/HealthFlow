import os 
import time 
from pathlib import Path
from dotenv import load_dotenv
from tqdm.auto import tqdm
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings


load_dotenv()


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINCECONE_INDEX_NAME = os.getenv("PINCECONE_INDEX_NAME")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")




UPLOAD_DIR =  "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
pc =  Pinecone(api_key= PINECONE_API_KEY)
spec = ServerlessSpec(cloud='aws', region='us-east-1')
existing_index = [ i["name"] for i  in pc.list_indexes()]

if PINCECONE_INDEX_NAME not in existing_index:
    pc.create_index(
        name=PINCECONE_INDEX_NAME,
        dimension=384,  
        metric="cosine",
        spec=spec
    )
    while not pc.describe_index(PINCECONE_INDEX_NAME).status["ready"]:
        time.sleep(1)

index = pc.Index(PINCECONE_INDEX_NAME)



def load_vectorestore(uploaded_files,role:str,doc_id:str):
     # Use FastEmbed (ONNX Runtime) - lightweight, no torch/Rust needed this for those who  dont have rust  supported  when installing dependancies 
     embed_model = FastEmbedEmbeddings(
        model_name=EMBEDDING_MODEL
    )
     for file in uploaded_files:
        save_path = Path(UPLOAD_DIR)/file.filename
        with open(save_path,"wb") as f:
            f.write(file.file.read())
        loader= PyPDFLoader(str(save_path))
        documents  = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size =2000 ,chunk_overlap =200)
        chunks = splitter.split_documents(documents)
        
        texts =  [chunk.page_content  for chunk in  chunks]
        ids =[f"{doc_id}-{i}" for  i in range(len(chunks))]

        metadata = [
            {
                "source": file.filename,
                "doc_id": doc_id,
                "role": role,
                "page": chunk.metadata.get("page", 0),
                "text": chunk.page_content,
            }
            for i, chunk in enumerate(chunks)
        ]
        
        print(f"Embedding {len(texts)} chunk...")
        embeddings= embed_model.embed_documents(texts)
        
        print("Uploading to  pinecone")
        with tqdm(total = len(embeddings),desc="Upserting to  pinecone") as progress :
            index.upsert(vectors=zip(ids,embeddings,metadata))
            progress.update(len(embeddings))
        print(f"Upload completed for {file.filename}")

    
    