from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from bson import ObjectId
import secrets
from backend.database.mongo import save_api_key

router = APIRouter()

# -------------------------------
# 📄 Request Models
# -------------------------------
class DocumentInfo(BaseModel):
    filename: str
    path: str

class APIKeyRequest(BaseModel):
    userId: str
    documents: List[DocumentInfo]

# -------------------------------
# 🔑 Helper function
# -------------------------------
def generate_api_key():
    """Generate a secure random API key"""
    return f"kn_{secrets.token_hex(16)}"

# -------------------------------
# 🚀 API Route
# -------------------------------
@router.post("/generate-api-key")
async def generate_api_key_route(request: APIKeyRequest):
    # Validate ObjectId
    if not ObjectId.is_valid(request.userId):
        raise HTTPException(status_code=400, detail="Invalid userId format")

    user_object_id = ObjectId(request.userId)
    api_key = generate_api_key()

    # Convert Pydantic models to dictionaries
    documents = [{"filename": d.filename, "path": d.path} for d in request.documents]

    # Save to Mongo
    save_api_key(str(user_object_id), api_key, documents)

    return {
        "message": "API key generated successfully",
        "api_key": api_key,
        "documents": documents
    }
