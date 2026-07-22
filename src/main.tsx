import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { applyStoredTheme, getGuestSettings } from './shared/storage/guestSettings';
import './styles/globals.css';

const initialSettings = getGuestSettings();
applyStoredTheme(initialSettings);
document.documentElement.lang = initialSettings.language;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
