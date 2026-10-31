import { installStorageGuard } from '../utils/safeStorage';
installStorageGuard();
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import FccAdminLibrary from '../fcc_admin_library/FccAdminLibrary.jsx';
import AdminLogin from '../auth/AdminLogin.jsx';
import '../index.css';

import { storeUserSession, clearAllAuthStores, getActiveUserSession } from '../utils/authSessionManager';

function AdminStandaloneApp() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const active = getActiveUserSession();
      if (active && active.role === 'admin') {
        return active;
      }
      const saved = localStorage.getItem('fcc_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (user) => {
    storeUserSession(user, user.token || 'jwt_admin_session_token', 'admin');
    setAdminUser(user);
  };

  const handleLogout = () => {
    clearAllAuthStores();
    setAdminUser(null);
    window.location.href = '/#/login';
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
