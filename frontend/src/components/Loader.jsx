import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MagnifyingGlass } from 'react-loader-spinner';

const Loader = () => {
  // State for cycling messages
  const messages = [
    'Analyzing claim...',
    'Searching sources...',
    'Verifying facts...',
    'Processing data...',
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cycle messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 3,
        padding: 2,
      }}
      role="status"
      aria-live="polite"
    >
      <MagnifyingGlass
        height="80"
        width="80"
        color="#0D6EFD"
        secondaryColor="#6C757D"
        radius="12.5"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
      />
      <Typography
        variant="body1"
        sx={{
          color: '#212529',
          fontWeight: 'medium',
          animation: 'fade 0.5s ease-in-out',
          '@keyframes fade': {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {messages[currentMessageIndex]}
      </Typography>
    </Box>
  );
};

export default Loader;