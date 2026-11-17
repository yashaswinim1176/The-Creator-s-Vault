import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely override window.alert to handle sandboxed iframe restriction exceptions
try {
  if (typeof window !== "undefined") {
    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      try {
        originalAlert(message);
      } catch (e) {
        console.warn("VAULT Alert Interceptor: Ignored blocked window.alert inside iframe environment:", message, e);
      }
    };
  }
} catch (e) {
  console.warn("VAULT: Could not patch window.alert: ", e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

