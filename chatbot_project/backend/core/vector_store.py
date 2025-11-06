# core/vector_store.py
import faiss
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer
from django.conf import settings

class FAISSVectorStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = SentenceTransformer(settings.EMBEDDING_MODEL)
            cls._instance.index = None
            cls._instance.metadata = []
            cls._instance.load_or_create()
        return cls._instance

    def load_or_create(self):
        os.makedirs(settings.FAISS_INDEX_PATH.parent, exist_ok=True)
        if settings.FAISS_INDEX_PATH.exists():
            self.index = faiss.read_index(str(settings.FAISS_INDEX_PATH))
            with open(settings.FAISS_METADATA_PATH) as f:
                self.metadata = json.load(f)
        else:
            self.index = faiss.IndexFlatL2(settings.DIMENSION)  # or IVF
            self.metadata = []
            self.save()

    def add(self, prompt: str, completion: str, source: str = 'original'):
        if any(m['prompt'] == prompt for m in self.metadata):
            return  # Avoid duplicates
        emb = self.model.encode(prompt).astype('float32')
        self.index.add(np.array([emb]))
        self.metadata.append({
            "prompt": prompt,
            "completion": completion,
            "source": source
        })
        self.save()

    def search(self, query: str, k=1, threshold=0.5):
        query_emb = self.model.encode(query).astype('float32')
        D, I = self.index.search(np.array([query_emb]), k)
        results = []
        for dist, idx in zip(D[0], I[0]):
            if dist > threshold:
                continue
            meta = self.metadata[idx]
            results.append({**meta, "distance": float(dist)})
        return results

    def save(self):
        faiss.write_index(self.index, str(settings.FAISS_INDEX_PATH))
        with open(settings.FAISS_METADATA_PATH, 'w') as f:
            json.dump(self.metadata, f, indent=2)

    def get_all(self):
        return self.metadata