from celery import shared_task
from groq import Groq  # Replace OpenAI with Groq
from core.vector_store import FAISSVectorStore
from core.models import Message
from django.conf import settings

@shared_task
def process_uncertain_queries():
    store = FAISSVectorStore()
    client = Groq(api_key=settings.GROQ_API_KEY)  # Use .env via settings

    uncertain = Message.objects.filter(is_user=True, needs_review=True)[:5]
    for msg in uncertain:
        if any(m['prompt'] == msg.content for m in store.metadata):
            continue

        try:
            # On-topic check + generation (ensures relevance for recursive learning)
            check_prompt = f"Is '{msg.content}' related to SQL or NoSQL databases? If yes, provide an accurate, concise response. If no, respond with 'OFF-TOPIC'."
            resp = client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Free, fast model (or "mixtral-8x7b-32768" for more power)
                messages=[{"role": "user", "content": check_prompt}],
                temperature=0.1,  # Low for factual responses
                max_tokens=300  # Cap for efficiency
            )
            full_response = resp.choices[0].message.content.strip()

            if 'OFF-TOPIC' in full_response.upper():
                print(f"Skipped off-topic: {msg.content[:50]}...")
                msg.needs_review = False
                msg.save()
                continue

            completion = full_response  # Use the generated response
            store.add(msg.content, completion, 'generated')
            msg.needs_review = False
            msg.save()
            print(f"Added new entry: {msg.content[:50]}...")

        except Exception as e:
            print(f"Groq Error: {e}. Skipping {msg.content[:50]}...")
            # Optional: Retry logic or queue for manual review