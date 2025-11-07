// src/components/MessageBubble.jsx
import { Box, Typography, IconButton } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

export default function MessageBubble({ message, onFeedback }) {
  if (message.is_user) {
    return (
      <Box textAlign="right" mb={2}>
        <Box
          bgcolor="#1976d2"
          color="white"
          p={2}
          borderRadius={2}
          maxWidth="70%"
          display="inline-block"
        >
          <Typography>{message.content}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box textAlign="left" mb={2}>
      <Box
        bgcolor="#e0e0e0"
        p={2}
        borderRadius={2}
        maxWidth="70%"
        display="inline-block"
      >
        <Typography>{message.content}</Typography>
        <Box mt={1} display="flex" gap={1}>
          <IconButton size="small" onClick={() => onFeedback(1)}>
            <ThumbUpIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onFeedback(0)}>
            <ThumbDownIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}