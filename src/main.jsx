import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#0f172a' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
