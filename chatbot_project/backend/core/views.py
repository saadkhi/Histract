from django.shortcuts import render

# core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.vector_store import FAISSVectorStore
from core.models import ChatHistory, Message
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

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


class ChatHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = None  # You'll need to create and specify a serializer
    permission_classes = [IsAuthenticated]
    queryset = ChatHistory.objects.none()  # Default empty queryset

    def get_queryset(self):
        return ChatHistory.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        chat = self.get_object()
        messages = chat.messages.all().order_by('timestamp')
        # You'll need to create and specify a MessageSerializer
        return Response([{
            'id': msg.id,
            'content': msg.content,
            'is_user': msg.is_user,
            'timestamp': msg.timestamp,
            'needs_review': msg.needs_review
        } for msg in messages])


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message_id = request.data.get('message_id')
        feedback = request.data.get('feedback')
        
        try:
            message = Message.objects.get(id=message_id, chat__user=request.user)
            message.feedback = feedback
            message.save()
            return Response({'status': 'feedback saved'}, status=status.HTTP_200_OK)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

