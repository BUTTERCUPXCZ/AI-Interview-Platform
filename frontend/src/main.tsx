import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import axios from 'axios'

axios.defaults.withCredentials = true;

const queryclient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry failed queries by default
      refetchOnWindowFocus: false, // Don't refetch on window focus
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryclient}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
