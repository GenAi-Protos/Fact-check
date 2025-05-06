import React, { useState, useEffect } from 'react';
import { Box, Typography, SvgIcon } from '@mui/material';

// Gear icon SVG (simplified for loader)
const GearIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6zM13 3.5V5a1 1 0 01-2 0V3.5a1 1 0 012 0zM13 19.5V21a1 1 0 01-2 0v-1.5a1 1 0 012 0zM6.34 6.34a1 1 0 011.42 0l1.06 1.06a1 1 0 010 1.42 1 1 0 01-1.42 0L6.34 7.76a1 1 0 010-1.42zM15.24 15.24a1 1 0 010 1.42l-1.06 1.06a1 1 0 01-1.42 0 1 1 0 010-1.42l1.06-1.06a1 1 0 011.42 0zM3.5 11H5a1 1 0 010 2H3.5a1 1 0 010-2zM19 11h1.5a1 1 0 010 2H19a1 1 0 010-2zM6.34 15.24a1 1 0 010 1.42l-1.06 1.06a1 1 0 01-1.42 0 1 1 0 010-1.42l1.06-1.06a1 1 0 011.42 0zM15.24 6.34a1 1 0 011.42 0l1.06 1.06a1 1 0 010 1.42 1 1 0 01-1.42 0l-1.06-1.06a1 1 0 010-1.42z" />
  </SvgIcon>
);

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
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          position: 'relative',
        }}
      >
        {[0, 1, 2].map((index) => (
          <GearIcon
            key={index}
            sx={{
              fontSize: index === 1 ? 40 : 30, // Middle gear is larger
              color: index === 1 ? '#0D6EFD' : '#6C757D',
              animation: `spin ${2 + index * 0.5}s linear infinite`,
              transformOrigin: 'center',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              // Staggered animation direction
              animationDirection: index % 2 === 0 ? 'normal' : 'reverse',
            }}
          />
        ))}
      </Box>
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