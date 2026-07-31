import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerStartupServices } from './bootstrap';
import { StartupGuard } from './services/StartupGuard';

// 1. Register all core startup services
registerStartupServices();

// 2. Render React application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 3. Trigger StartupGuard singleton initialization sequence
StartupGuard.initialize();
