from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
from .vectorestore import load_vectorestore

router = APIRouter()


@router.post("/upload_docs")
async def upload_docs(
    file: UploadFile = File(...),
    role: str = Form(...),
):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: only admin has access")

    doc_id = str(uuid.uuid4())
   
    try:
        load_vectorestore([file], role, doc_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")

    return {"message": f"{file.filename} uploaded successfully", "doc_id": doc_id, "accessible_to": role}
