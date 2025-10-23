# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import List
# from bson import ObjectId
# import secrets
# from backend.database.mongo import save_api_key

# router = APIRouter()

# # -------------------------------
# # 📄 Request Models
# # -------------------------------
# class DocumentInfo(BaseModel):
#     filename: str
#     path: str

# class APIKeyRequest(BaseModel):
#     userId: str
#     documents: List[DocumentInfo]

# # -------------------------------
# # 🔑 Helper function
# # -------------------------------
# def generate_api_key():
#     """Generate a secure random API key"""
#     return f"kn_{secrets.token_hex(16)}"

# # -------------------------------
# # 🚀 API Route
# # -------------------------------
# @router.post("/generate-api-key")
# async def generate_api_key_route(request: APIKeyRequest):
#     # Validate ObjectId
#     if not ObjectId.is_valid(request.userId):
#         raise HTTPException(status_code=400, detail="Invalid userId format")

#     user_object_id = ObjectId(request.userId)
#     api_key = generate_api_key()

#     # Convert Pydantic models to dictionaries
#     documents = [{"filename": d.filename, "path": d.path} for d in request.documents]

#     # Save to Mongo
#     save_api_key(str(user_object_id), api_key, documents)

#     return {
#         "message": "API key generated successfully",
#         "api_key": api_key,
#         "documents": documents
#     }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from bson import ObjectId
import secrets
from backend.database.mongo import save_api_key
from backend.utils.extract_text import extract_text
from backend.utils.embed_store import store_embeddings, init_collection  # We'll use this
from backend.database.mongo import get_api_keys_by_user

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

@router.get("/user-api-keys/{user_id}")
async def get_user_api_keys(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    api_keys = get_api_keys_by_user(user_id)
    # Return only relevant fields
    return [{"key": k["key"], "documents": k["documents"], "createdAt": k["createdAt"]} for k in api_keys]

@router.post("/generate-api-key")
async def generate_api_key_route(request: APIKeyRequest):
    # Validate ObjectId
    if not ObjectId.is_valid(request.userId):
        raise HTTPException(status_code=400, detail="Invalid userId format")

    user_object_id = ObjectId(request.userId)
    api_key = generate_api_key()

    # Convert Pydantic models to dictionaries
    documents = [{"filename": d.filename, "path": d.path} for d in request.documents]

    # Save to MongoDB
    save_api_key(str(user_object_id), api_key, documents)

    # -------------------------------
    # Embed and store documents
    # -------------------------------
    for doc in documents:
        file_path = doc["path"]
        try:
            text = extract_text(file_path)  # Extract text from PDF/DOCX
            store_embeddings(str(user_object_id), api_key, [text])  # Wrap text in list
        except Exception as e:
            print(f"Failed to process {file_path}: {e}")


    return {
        "message": "API key generated successfully and documents embedded",
        "api_key": api_key,
        "documents": documents
    }
