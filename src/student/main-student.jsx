import React from 'react';
import ReactDOM from 'react-dom/client';
import StudentStandaloneApp from './StudentStandaloneApp.jsx';
import '../index.css';

ReactDOM.createRoot(document.getElementById('student-root')).render(
  <React.StrictMode>
    <StudentStandaloneApp />
  </React.StrictMode>,
);
