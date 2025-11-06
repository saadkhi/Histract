from django.shortcuts import render

# core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.vector_store import FAISSVectorStore
from core.models import ChatHistory, Message

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query')
        chat_id = request.data.get('chat_id')
        user = request.user
        store = FAISSVectorStore()

        # Create or get chat
        if not chat_id:
            chat = ChatHistory.objects.create(user=user)
            chat_id = chat.id
        else:
            chat = ChatHistory.objects.get(id=chat_id, user=user)

        # Save user message
        Message.objects.create(chat=chat, is_user=True, content=query)

        # RAG Search
        results = store.search(query, k=1, threshold=0.5)
        if results:
            response = results[0]['completion']
            needs_review = False
        else:
            response = "Sorry, I can only answer questions related to SQL and NoSQL databases."
            needs_review = True

        # Save bot message
        Message.objects.create(
            chat=chat, is_user=False, content=response, needs_review=needs_review
        )

        return Response({
            'response': response,
            'chat_id': chat_id
        })

