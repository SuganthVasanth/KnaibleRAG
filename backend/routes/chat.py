# from fastapi import APIRouter, Body
# from fastapi.responses import JSONResponse
# from datetime import datetime
# from bson import ObjectId
# from backend.database.mongo import chat_history_collection

# router = APIRouter()

# # Save chat message
# @router.post("/chat")
# async def save_chat_message(
#     userId: str = Body(...),
#     message: str = Body(...),
#     response: str = Body(...),
#     documentId: str = Body(None)
# ):
#     try:
#         chat_doc = {
#             "userId": ObjectId(userId),
#             "message": message,
#             "response": response,
#             "timestamp": datetime.utcnow()
#         }
#         if documentId:
#             chat_doc["documentId"] = ObjectId(documentId)

#         result = chat_history_collection.insert_one(chat_doc)
#         return JSONResponse({"success": True, "chatId": str(result.inserted_id)})
#     except Exception as e:
#         return JSONResponse({"success": False, "error": str(e)}, status_code=500)

# # Get chat history
# @router.get("/chat")
# async def get_chat_history(userId: str, documentId: str = None):
#     try:
#         query = {"userId": ObjectId(userId)}
#         if documentId:
#             query["documentId"] = ObjectId(documentId)

#         chats = list(chat_history_collection.find(query).sort("timestamp", -1))
#         for c in chats:
#             c["_id"] = str(c["_id"])
#             c["userId"] = str(c["userId"])
#             if "documentId" in c and c["documentId"]:
#                 c["documentId"] = str(c["documentId"])

#         return JSONResponse({"success": True, "chats": chats})
#     except Exception as e:
#         return JSONResponse({"success": False, "error": str(e)}, status_code=500)

#Hiiiiiiiiiiii
# from fastapi import APIRouter, Body, Depends, HTTPException
# from fastapi.responses import JSONResponse
# from datetime import datetime
# from bson import ObjectId
# from backend.database.mongo import save_chat_message, get_user_chat_history
# from backend.utils.auth import get_current_user  # JWT helper

# router = APIRouter()

# # --------------------------
# # Save chat message
# # --------------------------
# @router.post("/")
# async def save_chat(
#     message: str = Body(...),
#     response: str = Body(...),
#     documentId: str = Body(None),
#     current_user: dict = Depends(get_current_user)
# ):
#     user_id = str(current_user["_id"])
#     try:
#         # Save chat in MongoDB
#         chat_id = save_chat_message(user_id, message, response)

#         # Optionally link to a document
#         if documentId:
#             from backend.database.mongo import chat_history_collection
#             chat_history_collection.update_one(
#                 {"_id": ObjectId(chat_id.inserted_id)},
#                 {"$set": {"documentId": ObjectId(documentId)}}
#             )

#         return {"success": True, "chatId": str(chat_id.inserted_id)}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")


# # --------------------------
# # Get chat history
# # --------------------------
# @router.get("/")
# async def get_chat_history(
#     documentId: str = None,
#     current_user: dict = Depends(get_current_user)
# ):
#     user_id = str(current_user["_id"])
#     try:
#         # Fetch all chats for this user
#         chats = get_user_chat_history(user_id)

#         # Filter by documentId if provided
#         if documentId:
#             chats = [c for c in chats if c.get("documentId") == documentId]

#         return {"success": True, "chats": chats}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from bson import ObjectId
from typing import Optional, List, Dict
import os

from backend.database.mongo import (
    save_chat_message,
    get_user_chat_history,
    documents_collection,  # Mongo collection for documents
)
from backend.utils.auth import get_current_user  # JWT helper

router = APIRouter()

UPLOAD_DIR = "./public/uploaded_files"


# Placeholder for actual retrieval-augmented generation logic
def rag_generate_answer(query: str, document_texts: List[str]) -> str:
    """
    Example RAG+LLM function: Takes a user query and document contents,
    performs semantic search + LLM inference, returns generated answer.
    Replace this stub with your actual RAG implementation.
    """
    # For example purpose, just concatenate document texts + query
    combined_context = "\n\n".join(document_texts)
    generated_answer = f"Answer to '{query}' based on documents:\n\n{combined_context[:500]}..."  
    return generated_answer


@router.post("/")
async def chat(
    message: str = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])

    try:
        # 1. Query user documents metadata from MongoDB
        docs_cursor = documents_collection.find({"userId": ObjectId(user_id)})
        docs = list(docs_cursor)

        if not docs:
            return JSONResponse(
                status_code=404,
                content={"error": "No documents found for user to answer query."}
            )

        # 2. Read document contents from disk
        document_texts = []
        sources = []
        for doc in docs:
            filename = doc.get("filename")
            # Construct full file path
            file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{filename}")

            if not os.path.isfile(file_path):
                continue

            # Read text content - assuming plain text or extract your own method for PDFs etc.
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text_content = f.read()
                    document_texts.append(text_content)
                    sources.append(filename)
            except Exception as e:
                # Log and skip files that fail to read
                print(f"Warning: failed to read {file_path}: {str(e)}")
                continue

        if not document_texts:
            return JSONResponse(
                status_code=404,
                content={"error": "User documents exist but none could be read."}
            )

        # 3. Use RAG and LLM to generate response based on document texts
        answer = rag_generate_answer(message, document_texts)

        # 4. Save chat history (user message + generated answer)
        chat_id = save_chat_message(user_id, message, answer)

        # 5. Return the answer and optionally the source document names
        return {
            "response": answer,
            "sources": sources,
            "chatId": str(chat_id.inserted_id),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


# Optionally keep existing save/get chat history endpoints if needed
# Save chat message
@router.post("/save")
async def save_chat(
    message: str = Body(...),
    response: str = Body(...),
    documentId: Optional[str] = Body(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    try:
        chat_id = save_chat_message(user_id, message, response)

        if documentId:
            from backend.database.mongo import chat_history_collection

            chat_history_collection.update_one(
                {"_id": ObjectId(chat_id.inserted_id)},
                {"$set": {"documentId": ObjectId(documentId)}},
            )

        return {"success": True, "chatId": str(chat_id.inserted_id)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")


# Get chat history
@router.get("/")
async def get_chat_history(
    documentId: Optional[str] = None, current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    try:
        chats = get_user_chat_history(user_id)

        if documentId:
            chats = [c for c in chats if c.get("documentId") == documentId]

        return {"success": True, "chats": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")
