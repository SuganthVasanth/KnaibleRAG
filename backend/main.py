# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from backend.routes import users

# app = FastAPI()

# # Allow Next.js frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Next.js dev server
#     allow_methods=["*"],
#     allow_headers=["*"]
# )

# # Include users router
# app.include_router(users.router, prefix="/api")
# from routes import documents



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import documents, chat, users

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]

# Add CORS Middleware here before your routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # whitelist your frontend origins
    allow_credentials=True,
    allow_methods=["*"],             # allow all HTTP methods
    allow_headers=["*"],             # allow all headers
)

# Include routers
app.include_router(users.router, prefix="/auth")  # Include user auth routes prefixed by /auth
# app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(documents.router, prefix="/documents", tags=["Documents"])