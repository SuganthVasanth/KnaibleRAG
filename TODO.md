# TODO: Integrate Document Upload with Vector DB

## Tasks
- [x] Update `KnaibleRAG/app/api/documents/upload/route.ts` to save the uploaded file to `public/uploaded_files` with filename `${userId}_${file.name}`.
- [x] After saving the file, create a FormData and POST to `http://127.0.0.1:8000/upload_and_embed` with:
  - user_id: actualUserId
  - api_key: from environment variable (e.g., process.env.GROQ_API_KEY or a fixed demo key)
  - doc_id: generated documentId
  - file: the saved file (read from filesystem)
- [x] Remove the existing text extraction and vector storage logic (since it's now handled by the vector service).
- [x] Update document status to "ready" after successful embedding.
- [x] Handle errors: if vector service call fails, set status to "error" or handle appropriately.
- [ ] Test the integration by uploading a file and verifying it's saved and embedded.

## Followup Steps
- [ ] Ensure vector service is running: `cd KnaibleRAG/vector && python app.py` (activate venv if needed).
- [ ] Test upload via frontend or API call.
- [ ] Verify file in `public/uploaded_files` and check Qdrant for embeddings.
