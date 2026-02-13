from fastapi import APIRouter, Depends, Form, HTTPException
from pydantic import BaseModel
from chat.assistant import answer_question

router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    role: str = "user"  # Default to "user" for non-admin access


@router.post("/ask")
async def ask_question(
    question: str = Form(...),
    role: str = Form(default="user")
):
    """
    Ask a question to the AI assistant based on the uploaded documents.
    Accepts form-data or JSON body.
    """
    try:
        if not question or not question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        result = await answer_question(question, role)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")


@router.post("/ask-json")
async def ask_question_json(request: ChatRequest):
    """
    Ask a question to the AI assistant (JSON version).
    Accepts only JSON body.
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        result = await answer_question(request.question, request.role)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")