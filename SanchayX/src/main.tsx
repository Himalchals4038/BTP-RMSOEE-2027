import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Optimization 4: Progressive Web App Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[SanchayX PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SanchayX PWA] Service Worker registration failed:', err);
      });
  });
}

