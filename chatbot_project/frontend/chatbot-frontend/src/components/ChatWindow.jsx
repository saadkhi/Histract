// src/components/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import API from '../../api/client';

export default function ChatWindow({ chat }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages(chat.messages);
    scrollToBottom();
  }, [chat]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { is_user: true, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/chat/', {
        query: input,
        chat_id: chat.id,
      });
      const botMsg = { is_user: false, content: res.data.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { is_user: false, content: 'Error sending message.' }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box flex={1} p={2} overflow="auto">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onFeedback={(rating) => {
            API.post('/feedback/', { message_id: msg.id, rating });
          }} />
        ))}
        {loading && (
          <Box textAlign="center" my={1}>
            <CircularProgress size={20} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      <Box p={2} borderTop="1px solid #ddd" bgcolor="white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Ask about SQL or NoSQL..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <IconButton type="submit" color="primary" disabled={loading}>
            <SendIcon />
          </IconButton>
        </form>
      </Box>
    </Box>
  );
}