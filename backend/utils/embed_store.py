# embed_store.py
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.models import PointStruct, VectorParams, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
import uuid

qdrant = QdrantClient("localhost", port=6333)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def init_collection():
    """Initialize the global collection (create only if not exists)."""
    collections = qdrant.get_collections().collections
    collection_names = [c.name for c in collections]

    if "chatbot_embeddings" not in collection_names:
        qdrant.create_collection(
            collection_name="chatbot_embeddings",
            vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE)
        )
        print("Created new collection: chatbot_embeddings")
    else:
        print("Collection already exists — reusing existing data.")

def store_embeddings(user_id, api_key, texts):
    """Embed and store all chunks for a document."""
    vectors = embedder.encode(texts)
    print(vectors)
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vectors[i].tolist(),
            payload={
                "user_id": user_id,
                "api_key": api_key,
                "text": texts[i],
            },
        )
        for i in range(len(texts))
    ]

    qdrant.upsert(collection_name="chatbot_embeddings", points=points)
    # print(f"Stored {len(points)} chunks for {doc_id} (User: {user_id})")

def query_embeddings(api_key, query_text):
    """Retrieve top chunks for a given API key and list of documents."""

    query_vector = embedder.encode([query_text])[0]

    # Build filter
    filters = [
        FieldCondition(key="user_id", match=MatchValue(value=api_key))
    ]

    # if doc_ids:
    #     # Create OR filter for multiple doc_ids
    #     doc_conditions = [FieldCondition(key="doc_id", match=MatchValue(value=d)) for d in doc_ids]
    #     filters.append(Filter(should=doc_conditions))  # <- OR logic

    # Wrap all in a single must Filter
    final_filter = Filter(must=filters)

    # Search Qdrant
    results = qdrant.search(
        collection_name="chatbot_embeddings",
        query_vector=query_vector.tolist(),
        query_filter=final_filter,
        limit=3
    )

    # Extract text
    return [r.payload["text"] for r in results]
