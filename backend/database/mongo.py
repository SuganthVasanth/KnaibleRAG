from pymongo import MongoClient
from bson import ObjectId
import gridfs

# Connect to your MongoDB instance
client = MongoClient("mongodb://localhost:27017")
db = client["RAGProject"]

# Collections
users_collection = db["Users"]
documents_collection = db["Documents"]
api_keys_collection = db["APIKeys"]
chat_history_collection = db["ChatHistory"]

# GridFS for storing files
fs = gridfs.GridFS(db)

# ============================================================
# 🧩 USER FUNCTIONS
# ============================================================

def get_user_by_email(email: str):
    """Find a user by email."""
    return users_collection.find_one({"email": email})


def create_user(email: str, hashed_password: str):
    """Insert new user."""
    return users_collection.insert_one({
        "email": email,
        "password": hashed_password
    })


# ============================================================
# 📄 DOCUMENT FUNCTIONS
# ============================================================

def save_document_metadata(user_id: str, filename: str, file_id: str, content_type: str):
    """Store document metadata in MongoDB."""
    doc = {
        "user_id": ObjectId(user_id),
        "filename": filename,
        "file_id": file_id,        # GridFS file ID
        "content_type": content_type,
    }
    return documents_collection.insert_one(doc)


def get_user_documents(user_id: str):
    """Fetch all documents uploaded by a user."""
    docs = list(documents_collection.find({"user_id": ObjectId(user_id)}))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["user_id"] = str(d["user_id"])
        d["file_id"] = str(d["file_id"])
    return docs


def get_file_from_gridfs(file_id: str):
    """Retrieve file content from GridFS using its ID."""
    return fs.get(ObjectId(file_id))


# ============================================================
# 💬 CHAT FUNCTIONS
# ============================================================

def save_chat_message(user_id: str, question: str, answer: str):
    """Store a chat message pair for a user."""
    chat = {
        "user_id": ObjectId(user_id),
        "question": question,
        "answer": answer
    }
    return chat_history_collection.insert_one(chat)


def get_user_chat_history(user_id: str):
    """Fetch all chat history for a given user."""
    chats = list(chat_history_collection.find({"user_id": ObjectId(user_id)}))
    for c in chats:
        c["_id"] = str(c["_id"])
        c["user_id"] = str(c["user_id"])
    return chats


# ============================================================
# 🔑 API KEY FUNCTIONS (OPTIONAL)
# ============================================================

def save_api_key(user_id: str, key: str, scope: str, expires_at: str):
    """Save a domain-specific API key for a user."""
    doc = {
        "user_id": ObjectId(user_id),
        "key": key,
        "scope": scope,
        "expires_at": expires_at
    }
    return api_keys_collection.insert_one(doc)


def get_user_api_keys(user_id: str):
    """Fetch API keys for a user."""
    keys = list(api_keys_collection.find({"user_id": ObjectId(user_id)}))
    for k in keys:
        k["_id"] = str(k["_id"])
        k["user_id"] = str(k["user_id"])
    return keys
