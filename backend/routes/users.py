from backend.utils.auth import create_access_token
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from backend.database.mongo import users_collection
from passlib.context import CryptContext
from fastapi.responses import JSONResponse

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models for request validation
class UserSignUp(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserSignIn(BaseModel):
    identifier: str  # username or email
    password: str

# Helper functions for password hashing
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# SIGN UP route
@router.post("/signup")
async def signup(user: UserSignUp):
    # Check existing user by email or username
    existing_user = users_collection.find_one({
        "$or": [{"email": user.email}, {"username": user.username}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Create user document with hashed password
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    
    result = users_collection.insert_one(user_dict)
    user_dict.pop("password")
    user_dict["_id"] = str(result.inserted_id)

    return JSONResponse({"success": True, "user": user_dict})

# SIGN IN route
# SIGN IN route with JWT
@router.post("/signin")
async def signin(signin_data: UserSignIn):
    # Find user by username or email
    user = users_collection.find_one({
        "$or": [{"email": signin_data.identifier}, {"username": signin_data.identifier}]
    })
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username/email or password")

    if not verify_password(signin_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid username/email or password")

    user_id = str(user["_id"])
    user["_id"] = user_id
    user.pop("password")  # do not return hashed password

    # Generate JWT token
    access_token = create_access_token({"user_id": user_id})

    return JSONResponse({
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    })
@router.get("/verify-token")
async def verify_token(token: str):
    from jose import jwt
    from backend.utils.auth import SECRET_KEY, ALGORITHM

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "payload": payload}
    except Exception as e:
        return {"valid": False, "error": str(e)}

