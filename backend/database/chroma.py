import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path="./chroma_data")

# Use OpenAI embeddings instead of SentenceTransformer
embedding_function = embedding_functions.OpenAIEmbeddingFunction(
    api_key="YOUR_OPENAI_API_KEY",  # Replace with your actual key
    model_name="text-embedding-3-small"
)

def get_user_collection(user_id: str):
    collection_name = f"user_{user_id}"
    return client.get_or_create_collection(
        name=collection_name, 
        embedding_function=embedding_function
    )

def add_document_to_chroma(user_id: str, text_chunks: list, filename: str):
    collection = get_user_collection(user_id)
    ids = [f"{filename}_{i}" for i in range(len(text_chunks))]
    metadatas = [{"documentId": filename} for _ in text_chunks]
    collection.add(
        ids=ids,
        documents=text_chunks,
        metadatas=metadatas
    )

def query_document(user_id: str, query_text: str, top_k=3):
    collection = get_user_collection(user_id)
    return collection.query(
        query_texts=[query_text],
        n_results=top_k
    )

# import chromadb
# from chromadb.utils import embedding_functions

# client = chromadb.PersistentClient(path="./chroma_data")

# # Use ChromaDB's SentenceTransformer embedding function
# embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# def get_user_collection(user_id: str):
#     collection_name = f"user_{user_id}"
#     return client.get_or_create_collection(name=collection_name, embedding_function=embedding_function)

# def add_document_to_chroma(user_id: str, text_chunks: list, filename: str):
#     collection = get_user_collection(user_id)
#     ids = [f"{filename}_{i}" for i in range(len(text_chunks))]
#     metadatas = [{"documentId": filename} for _ in text_chunks]
#     collection.add(
#         ids=ids,
#         documents=text_chunks,
#         metadatas=metadatas
#     )

# def query_document(user_id: str, query_text: str, top_k=3):
#     collection = get_user_collection(user_id)
#     return collection.query(
#         query_texts=[query_text],
#         n_results=top_k
#     )
