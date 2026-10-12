import React from 'react';
import ReactDOM from 'react-dom/client';
import { installStorageGuard } from './utils/safeStorage';
import App from './App.jsx';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import './index.css';

// Must run before any component touches localStorage
installStorageGuard();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
