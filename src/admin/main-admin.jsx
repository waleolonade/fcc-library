import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import FccAdminLibrary from '../fcc_admin_library/FccAdminLibrary.jsx';
import AdminLogin from '../auth/AdminLogin.jsx';
import '../index.css';

function AdminStandaloneApp() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fcc_admin_session');
      return saved ? JSON.parse(saved) : {
        role: 'admin',
        matric: 'FCC/STAFF/001',
        name: 'Dr. Mrs. A. Balogun',
        dept: 'Chief College Librarian'
      };
    } catch {
      return {
        role: 'admin',
        matric: 'FCC/STAFF/001',
        name: 'Dr. Mrs. A. Balogun',
        dept: 'Chief College Librarian'
      };
    }
  });

  const handleLogin = (user) => {
    setAdminUser(user);
    try {
      localStorage.setItem('fcc_admin_session', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('fcc_admin_session');
    } catch {}
  };

  if (!adminUser) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <FccAdminLibrary
      user={adminUser}
      onLogout={handleLogout}
      onSwitchToUserPortal={() => {
        window.location.href = '/#/scholar/catalog';
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <AdminStandaloneApp />
  </React.StrictMode>,
);
