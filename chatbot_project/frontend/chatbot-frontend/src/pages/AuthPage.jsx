// src/pages/AuthPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Tabs, Tab } from '@mui/material';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) await login(username, password);
      else await register(username, password);
      navigate('/');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'Failed'));
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          SQL/NoSQL Chatbot
        </Typography>
        <Tabs value={isLogin ? 0 : 1} onChange={(_, v) => setIsLogin(v === 0)} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Username"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}