// src/components/Sidebar.jsx
import { Box, List, ListItem, ListItemText, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function Sidebar({ chats, currentChat, setCurrentChat, createNewChat }) {
  return (
    <Box width={300} bgcolor="#2b2d31" color="white" display="flex" flexDirection="column">
      <Box p={2} borderBottom="1px solid #444">
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={createNewChat}>
          New Chat
        </Button>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {chats.map((chat) => (
          <ListItem
            button
            key={chat.id}
            selected={currentChat?.id === chat.id}
            onClick={() => setCurrentChat(chat)}
            sx={{
              bgcolor: currentChat?.id === chat.id ? '#3a3b3f' : 'transparent',
              '&:hover': { bgcolor: '#3a3b3f' },
            }}
          >
            <ListItemText primary={chat.title} secondary={`${chat.messages.length} messages`} />
          </ListItem>
        ))}
      </List>
      <Box p={2} borderTop="1px solid #444">
        <Typography variant="caption">FAISS + Groq Powered</Typography>
      </Box>
    </Box>
  );
}