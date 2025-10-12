# from fastapi import APIRouter, UploadFile, Form, File, Query, HTTPException
# from pydantic import BaseModel, Field
# from typing import List
# from bson import ObjectId
# from datetime import datetime
# from backend.database.mongo import fs, documents_collection


# # Pydantic custom type to validate and serialize ObjectId


# class Document(BaseModel):
#     id: str = Field(..., alias="_id")
#     filename: str
#     status: str

#     class Config:
#         allow_population_by_field_name = True
#         json_encoders = {ObjectId: str}
#         schema_extra = {
#             "example": {
#                 "id": "64ac1e5f3b9e8bbdddc2048a",
#                 "filename": "sample.pdf",
#                 "status": "ready"
#             }
#         }


# class DocumentsResponse(BaseModel):
#     documents: List[Document]


# router = APIRouter()


# @router.post("/upload", response_model=dict)
# async def upload_document(userId: str = Form(...), file: UploadFile = File(...)):
#     try:
#         file_id = fs.put(file.file, filename=file.filename)

#         # Helper to check if userId is a valid ObjectId
#         def is_valid_objectid(oid):
#             try:
#                 ObjectId(oid)
#                 return True
#             except Exception:
#                 return False

#         doc = {
#             "userId": ObjectId(userId) if is_valid_objectid(userId) else userId,
#             "filename": file.filename,
#             "fileId": file_id,
#             "uploadedAt": datetime.utcnow(),
#             "status": "ready",
#         }
#         result = documents_collection.insert_one(doc)

#         return {
#             "success": True,
#             "document": {
#                 "id": str(result.inserted_id),
#                 "filename": file.filename,
#                 "status": "ready",
#                 "vectorStored": False
#             }
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# @router.get("/", response_model=DocumentsResponse)
# async def get_documents(userId: str = Query(...)):
#     try:
#         # Helper to check if userId is a valid ObjectId
#         def is_valid_objectid(oid):
#             try:
#                 ObjectId(oid)
#                 return True
#             except Exception:
#                 return False

#         query = {"userId": ObjectId(userId)} if is_valid_objectid(userId) else {"userId": userId}
#         docs_cursor = documents_collection.find(
#             query,
#             {"_id": 1, "filename": 1, "status": 1}
#         )
#         docs = []
#         for doc in docs_cursor:
#             doc["_id"] = str(doc["_id"])
#             docs.append(doc)
#         return {"documents": docs}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


# from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
# from pydantic import BaseModel, Field
# from typing import List
# from bson import ObjectId
# from datetime import datetime
# from backend.database.mongo import fs, save_document_metadata, get_user_documents
# from backend.utils.auth import get_current_user  # JWT auth helper
# from backend.database.chroma import get_user_collection, add_document_to_chroma
# import PyPDF2
# import docx
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# import io

# # ================================
# # Pydantic Models
# # ================================
# class Document(BaseModel):
#     id: str = Field(..., alias="_id")
#     filename: str
#     status: str

#     class Config:
#         allow_population_by_field_name = True
#         json_encoders = {ObjectId: str}
#         schema_extra = {
#             "example": {
#                 "id": "64ac1e5f3b9e8bbdddc2048a",
#                 "filename": "sample.pdf",
#                 "status": "ready"
#             }
#         }

# class DocumentsResponse(BaseModel):
#     documents: List[Document]

# # ================================
# # Helper Functions
# # ================================
# def extract_text_from_file(file: UploadFile) -> str:
#     """Extract text from uploaded file based on its type."""
#     filename = file.filename.lower()
#     content = file.file.read()

#     if filename.endswith('.pdf'):
#         pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
#         text = ""
#         for page in pdf_reader.pages:
#             text += page.extract_text() + "\n"
#         return text.strip()

#     elif filename.endswith('.docx'):
#         doc = docx.Document(io.BytesIO(content))
#         text = ""
#         for para in doc.paragraphs:
#             text += para.text + "\n"
#         return text.strip()

#     elif filename.endswith('.txt'):
#         return content.decode('utf-8').strip()

#     else:
#         # For other types, try to decode as text
#         try:
#             return content.decode('utf-8').strip()
#         except UnicodeDecodeError:
#             raise HTTPException(status_code=400, detail="Unsupported file type")

# # ================================
# # Router
# # ================================
# router = APIRouter()


# # ================================
# # Upload Document
# # ================================
# @router.post("/upload", response_model=dict)
# async def upload_document(
#     file: UploadFile = File(...),
#     current_user: str = Depends(get_current_user)  # Automatically inject logged-in user
# ):
#     user_id = current_user
#     try:
#         # Extract text from file
#         text = extract_text_from_file(file)

#         # Chunk the text
#         splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
#         chunks = splitter.split_text(text)

#         # Save file to GridFS
#         file.file.seek(0)  # Reset file pointer after reading
#         file_id = fs.put(file.file, filename=file.filename, content_type=file.content_type)

#         # Save metadata in MongoDB
#         save_document_metadata(user_id, file.filename, file_id, file.content_type)

#         # Store chunks in ChromaDB
#         add_document_to_chroma(user_id, chunks, file.filename)

#         return {
#             "success": True,
#             "document": {
#                 "id": str(file_id),
#                 "filename": file.filename,
#                 "status": "ready",
#                 "vectorStored": True
#             }
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# # ================================
# # Get Documents
# # ================================
# @router.get("/", response_model=DocumentsResponse)
# async def get_documents(
#     current_user: str = Depends(get_current_user)  # Automatically inject logged-in user
# ):
#     user_id = current_user
#     try:
#         docs = get_user_documents(user_id)
#         return {"documents": docs}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


# # ================================
# # Search Documents
# # ================================
# @router.get("/search", response_model=dict)
# async def search_documents(
#     query: str = Query(...),
#     current_user: str = Depends(get_current_user)
# ):
#     user_id = current_user
#     try:
#         collection = get_user_collection(user_id)
#         results = collection.query(query_texts=[query], n_results=5)
#         chunks = []
#         for doc, metadata, distance in zip(results['documents'][0], results['metadatas'][0], results['distances'][0]):
#             chunks.append({
#                 "content": doc,
#                 "score": 1 - distance,  # Convert distance to similarity
#                 "documentId": metadata.get("documentId", ""),
#                 "preview": doc[:100] + "...",
#             })
#         return {"chunks": chunks}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
import os
from fastapi import APIRouter, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from bson import ObjectId
from backend.database.mongo import documents_collection  # your Mongo collection

# Define the public uploaded_files folder relative to backend root
PUBLIC_UPLOAD_DIR = "./public/uploaded_files"
os.makedirs(PUBLIC_UPLOAD_DIR, exist_ok=True)  # Ensure folder exists

# ================================
# Pydantic Models
# ================================
class Document(BaseModel):
    id: str = Field(..., alias="_id")
    filename: str
    status: str
    path: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class DocumentsResponse(BaseModel):
    documents: List[Document]

router = APIRouter()

# ================================
# Upload Document
# ================================
@router.post("/upload", response_model=dict)
async def upload_document(userId: str = Form(...), file: UploadFile = Form(...)):
    try:
        # Save file in public/uploaded_files folder
        file_location = os.path.join(PUBLIC_UPLOAD_DIR, f"{userId}_{file.filename}")
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Store relative path for frontend URLs (relative to /public)
        relative_path = f"/uploaded_files/{userId}_{file.filename}"

        # Prepare document metadata for MongoDB
        doc = {
            "userId": ObjectId(userId) if ObjectId.is_valid(userId) else userId,
            "filename": file.filename,
            "status": "ready",
            "uploadedAt": datetime.utcnow(),
            "path": relative_path
        }

        # Insert document into MongoDB
        result = documents_collection.insert_one(doc)

        return {
            "success": True,
            "document": {
                "id": str(result.inserted_id),
                "filename": file.filename,
                "status": "ready",
                "path": relative_path
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# ================================
# Get Documents for User
# ================================
@router.get("/", response_model=DocumentsResponse)
async def get_documents(userId: str):
    try:
        query = {"userId": ObjectId(userId)} if ObjectId.is_valid(userId) else {"userId": userId}

        docs_cursor = documents_collection.find(
            query,
            {"_id": 1, "filename": 1, "status": 1, "path": 1, "uploadedAt": 1}
        )

        documents = []
        for doc in docs_cursor:
            doc["_id"] = str(doc["_id"])
            if "uploadedAt" in doc and isinstance(doc["uploadedAt"], datetime):
                doc["uploadedAt"] = doc["uploadedAt"].isoformat()
            documents.append(doc)

        return {"documents": documents}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")
