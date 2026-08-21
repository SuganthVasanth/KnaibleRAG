# KnaibleRAG: Secure API Key Generation & Retrieval-Augmented Generation (RAG) Platform

A production-grade web platform enabling secure, domain-specific API key generation powered by Retrieval-Augmented Generation (RAG) and open-source Large Language Models (LLMs). Built as a full-stack application featuring a Next.js frontend, a FastAPI backend, MongoDB for application metadata, and Qdrant for semantic vector search.

The platform allows developers and organizations to upload proprietary documents, index them, chat with their data via an interactive interface, and provision scoped API keys to query their custom knowledge bases externally from their own software.

---

## Features

### Phase 1 - Authentication & User Security
- **JWT-Based Authentication** - Secure registration, login, and token-based session management.
- **User Roles & Access Control** - Strict boundaries ensuring users can only access their own uploaded documents, chat histories, and generated API keys.
- **Password Hashing** - Secure credentials storage within MongoDB using industry-standard hashing.

### Phase 2 - Intelligent Document Processing
- **Multi-Format Document Upload** - Support for `.pdf`, `.docx`, and `.txt` files.
- **Robust Text Extraction** - Parsing pipeline utilizing `PyPDF2` and `python-docx` to clean and extract plain text.
- **Smart Text Chunking** - Automatic division of long texts into overlapping token-aware chunks (2000-character default) for optimal embedding and context retrieval.
- **Document Metadata Tracking** - Real-time processing status (Pending, Indexed, Failed) with MongoDB tracking.

### Phase 3 - Semantic Search & Vector Pipeline
- **Local Embeddings Generation** - Offline embedding calculations using `sentence-transformers` (`all-MiniLM-L6-v2`) to maintain data privacy.
- **Qdrant Vector Database Integration** - Fast, hardware-optimized vector collection management.
- **Hybrid Search & Filtering** - Retrieval query execution scoped strictly by `user_id` or `api_key` using Qdrant field matching, preventing cross-tenant data leaks.

### Phase 4 - Grounded Chat & LLM Integration
- **Context-Aware Prompt Engineering** - Dynamically injects semantic matches from uploaded documents into system prompts.
- **Groq LLM Execution** - Ultra-low-latency text generation powered by LLaMA 3.1 (`llama-3.1-8b-instant`).
- **Interactive Chat Interface** - Real-time rendering of grounded responses, persistent conversation history, and a frontend debug panel for tracing retrieved context chunks.

### Phase 5 - Scoped Developer APIs
- **API Key Lifecycle Management** - Dashboard interface to provision, view, and revoke custom API keys (`kn_...`).
- **Scope Customization** - Restrict API keys to specific uploaded files, ensuring granular data boundaries.
- **External Integration Endpoint** - Dedicated `/query_llm_api` endpoint secured with API key validation to deliver RAG-as-a-Service to external clients.

---

## Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS v3, Shadcn/ui | Premium user experience with fully responsive dashboards, interactive forms, and dynamic chat layouts. |
| **Backend** | FastAPI (Python 3.11+), Uvicorn | High-performance, asynchronous Python web framework for API routing and file handling. |
| **App Database** | MongoDB | Document database handling users, files metadata, scoped API keys, and chat histories. |
| **Vector DB** | Qdrant (Port 6333) | Vector similarity search engine for managing chunked document embeddings. |
| **Embedding Engine** | SentenceTransformers (`all-MiniLM-L6-v2`) | Local execution of lightweight 384-dimensional dense vector embeddings. |
| **LLM Provider** | Groq API | Grounded response generation leveraging LLaMA 3.1 models. |
| **Utilities** | PyPDF2, python-docx, tiktoken | Advanced text extractors and tokenization utilities. |

---

## Project Structure

```
KnaibleRAG/
├── app/                            # Next.js App Router (Frontend)
│   ├── api/                        # Next.js Route Handlers
│   │   └── chat/                   # Edge chat proxy
│   ├── auth/                       # Authentication pages
│   │   └── signin/
│   ├── chat/                       # Live grounded chat interface
│   ├── dashboard/                  # Main file, key, and usage console
│   ├── globals.css                 # Global Tailwind styles & UI variables
│   ├── layout.tsx                  # Root layout structure
│   ├── page.tsx                    # Landing Page
│   └── providers.tsx               # Context and theme providers
│
├── backend/                        # FastAPI Service (Backend)
│   ├── database/                   # DB Adapters
│   │   ├── mongo.py                # MongoDB collection definitions
│   │   └── chroma.py               # Legacy chroma configuration
│   ├── routes/                     # API Routers
│   │   ├── apikeys.py              # Key provisioning & token scopes
│   │   ├── chat.py                 # Core RAG querying
│   │   ├── documents.py            # File uploads & metadata indexing
│   │   └── users.py                # Authentication operations
│   ├── utils/                      # Helper Scripts
│   │   ├── auth.py                 # JWT validation & password utilities
│   │   ├── embed_store.py          # Qdrant client connection & embeddings store
│   │   └── extract_text.py         # PDF & DOCX parser
│   ├── main.py                     # Entry point (App configuration & routing)
│   ├── config.py                   # App Configuration
│   ├── requirements.txt            # Python Dependencies
│   └── .env                        # Local backend environment keys
│
├── components/                     # Reusable Shadcn UI Elements
├── contexts/                       # React Contexts (Auth, ChatState)
├── hooks/                          # Reusable custom React hooks
├── lib/                            # Frontend utility functions
├── public/                         # Static assets
└── styles/                         # Stylesheets
```

---

## Local Setup

### 1. Prerequisites
- **Node.js**: Version 18 or above
- **Python**: Version 3.9 or above
- **MongoDB**: Running locally at `mongodb://localhost:27017`
- **Qdrant**: Running locally at `localhost:6333` (e.g., via Docker)
  ```bash
  docker run -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
  ```

---

### 2. Backend Configuration & Setup

1. **Navigate to the Backend directory and set up a virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   ```

2. **Activate the Virtual Environment:**
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **Linux / macOS:**
     ```bash
     source .venv/bin/activate
     ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file inside the `backend/` directory:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MONGO_URI=mongodb://localhost:27017
   ```

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   * The API Documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 3. Frontend Configuration & Setup

1. **Navigate back to the project root directory and install node modules:**
   ```bash
   npm install
   ```

2. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

3. **Open the web application:**
   * Access the dashboard at: [http://localhost:3000](http://localhost:3000)

---

## Developer Integration: External API Key Usage

To utilize the grounded LLM from external clients using your generated API key:

### Request Format
```bash
curl -X POST "http://127.0.0.1:8000/query_llm_api" \
  -F "api_key=kn_your_api_key_here" \
  -F "query=What is the main conclusion of the quarterly financial statement?"
```

### Response Format
```json
{
  "llm_response": "The quarterly statement indicates a 12% revenue growth compared to the previous quarter. Operating expenses were reduced by 4%. The balance sheet shows liquid assets of $1.2M."
}
```

---

## Limitations
- **File Parsing Size**: Extremely large PDF files may experience processing latency.
- **Groq Free-Tier Rate Limits**: High-frequency queries may trigger rate-limiting responses depending on the API key tier.
- **Local Embedding Speed**: Generating embeddings on a CPU for hundreds of pages may take several seconds.
