from qdrant_client import QdrantClient

qdrant = QdrantClient('localhost', port=6333)
collections = qdrant.get_collections().collections
print('Collections:', [c.name for c in collections])
if 'chatbot_embeddings' in [c.name for c in collections]:
    count = qdrant.count(collection_name='chatbot_embeddings').count
    print(f'Total points in chatbot_embeddings: {count}')
else:
    print('Collection chatbot_embeddings does not exist.')
