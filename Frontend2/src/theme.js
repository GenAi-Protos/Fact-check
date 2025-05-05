import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00aaff', // Blue accent similar to Grok's highlights
    },
    background: {
      default: '#1a1a1a', // Dark background
      paper: '#252525', // Slightly lighter for cards
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.95rem',
    },
  },
  components: {
    MuiTimeline: {
      styleOverrides: {
        root: {
          padding: '0',
        },
      },
    },
    MuiTimelineItem: {
      styleOverrides: {
        root: {
          minHeight: '60px',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

export default theme;