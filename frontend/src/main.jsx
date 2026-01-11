import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker.js';

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
registerServiceWorker();

// Initialize IndexedDB for offline storage
if ('indexedDB' in window) {
  import('./utils/offlineStorage.js').then(({ initDB }) => {
    initDB()
      .then(() => console.log('✅ IndexedDB initialized'))
      .catch((error) => console.error('❌ IndexedDB initialization failed:', error));
  });
}

// Log PWA installation status
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ App is running in standalone mode (PWA installed)');
} else {
  console.log('📱 App is running in browser mode');
}