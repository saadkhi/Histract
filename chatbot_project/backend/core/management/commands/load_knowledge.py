# core/management/commands/load_knowledge.py
import json
from django.core.management.base import BaseCommand
from core.vector_store import FAISSVectorStore

class Command(BaseCommand):
    def handle(self, *args, **options):
        store = FAISSVectorStore()
        path = '/home/saad/Documents/chatbot_project/dataset.jsonl'
        with open(path) as f:
            for line in f:
                data = json.loads(line)
                store.add(data['prompt'], data['completion'], 'original')
        self.stdout.write(self.style.SUCCESS(f"Loaded {len(store.metadata)} entries into FAISS"))