// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { Box, Container } from '@mui/material';
import API from '../api/client';

export default function Home() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);

  const loadChats = async () => {
    const res = await API.get('/chats/');
    setChats(res.data);
    if (res.data.length > 0 && !currentChat) {
      setCurrentChat(res.data[0]);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const createNewChat = async () => {
    const res = await API.post('/chats/', { title: 'New Chat' });
    setCurrentChat(res.data);
    loadChats();
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', p: 0 }}>
      <Sidebar
        chats={chats}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        createNewChat={createNewChat}
        reloadChats={loadChats}
      />
      <Box flex={1} bgcolor="#f5f5f5">
        {currentChat ? <ChatWindow chat={currentChat} /> : <Box p={3}>Select or create a chat</Box>}
      </Box>
    </Container>
  );
}