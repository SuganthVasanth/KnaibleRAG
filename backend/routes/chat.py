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


from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from bson import ObjectId
from backend.database.mongo import save_chat_message, get_user_chat_history
from backend.utils.auth import get_current_user  # JWT helper

router = APIRouter()

# --------------------------
# Save chat message
# --------------------------
@router.post("/")
async def save_chat(
    message: str = Body(...),
    response: str = Body(...),
    documentId: str = Body(None),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    try:
        # Save chat in MongoDB
        chat_id = save_chat_message(user_id, message, response)

        # Optionally link to a document
        if documentId:
            from backend.database.mongo import chat_history_collection
            chat_history_collection.update_one(
                {"_id": ObjectId(chat_id.inserted_id)},
                {"$set": {"documentId": ObjectId(documentId)}}
            )

        return {"success": True, "chatId": str(chat_id.inserted_id)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chat: {str(e)}")


# --------------------------
# Get chat history
# --------------------------
@router.get("/")
async def get_chat_history(
    documentId: str = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    try:
        # Fetch all chats for this user
        chats = get_user_chat_history(user_id)

        # Filter by documentId if provided
        if documentId:
            chats = [c for c in chats if c.get("documentId") == documentId]

        return {"success": True, "chats": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")
