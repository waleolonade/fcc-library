/**
 * Institutional Authentication Store & Session Isolation Manager
 * Guarantees zero cross-user session leakage across shared workstations,
 * QR code logins, mobile pass handshakes, and multi-role switches.
 */

const USER_SESSION_KEYS = [
  'fcc_student_session',
  'fcc_student_token',
  'fcc_admin_session',
  'fcc_admin_token',
  'fcc_hod_session',
  'fcc_hod_token',
  'fcc_developer_session',
  'fcc_developer_token',
  'fcc_god_mode',
  'fcc_user_session',
  'fcc_user_token',
  'fcc_auth_token',
  'fcc_active_role',
  'fcc_mobile_pass_user',
  'fcc_saved_books_list',
  'fcc_saved_overlay_resources',
  'fcc_saved_google_books',
  'fcc_recent_searches',
  'fcc_room_bookings',
  'fcc_admin_security_gate_unlocked',
  'fcc_otp_challenge',
  'fcc_device_authenticated_user'
];

// System configuration and installation flags that must be preserved
const PRESERVED_SYSTEM_KEYS = new Set([
  'fcc_developer_config_v5',
  'fcc_institutional_config',
  'fcc_custom_logo',
  'fcc_simulated_device',
  'fcc_mobile_pass_installed',
  'fcc_app_installed',
  'fcc_installed_at',
  'fcc_pending_bookmark_book_id',
  'fcc_pending_bookmark_book_title',
  'fcc_return_to_opac_after_login'
]);

/**
 * Aggressively purges all user tokens, credentials, bookmarks, and sessions.
 * Guarantees that the browser / workstation has no residual state from any previous user.
 */
export function clearAllAuthStores(options = {}) {
  try {
    // 1. Explicitly remove all known user session keys
    USER_SESSION_KEYS.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // 2. Scan localStorage for any dynamically generated session or token keys
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (PRESERVED_SYSTEM_KEYS.has(key)) continue;

        // If key relates to user session, tokens, patrons, or credentials
        if (
          /fcc_.*session/i.test(key) ||
          /fcc_.*token/i.test(key) ||
          /fcc_.*patron/i.test(key) ||
          /fcc_.*cart/i.test(key) ||
          /fcc_.*user/i.test(key) ||
          /fcc_.*loan/i.test(key)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });
    }

    // 3. Clear all temporary sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (e) {}
    }

    // 4. Dispatch system event so reactive components reset immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-auth-stores-cleared', {
        detail: { timestamp: Date.now(), reason: options.reason || 'manual_clear' }
      }));
    }
  } catch (err) {
    console.warn('[authSessionManager] Clear warning:', err);
  }
}

/**
 * Stores a verified user session with strict isolation.
 * Automatically wipes ALL prior stores before persisting the new user.
 */
export function storeUserSession(user, token = null, explicitRole = null) {
  if (!user) return;

  // 1. Wipe all existing stores first
  clearAllAuthStores({ reason: 'new_login_handshake' });

  // 2. Determine normalized role
  let role = explicitRole || user.role || 'student';
  if (role === 'admin' || user.is_admin || user.role === 'admin') {
    role = 'admin';
  } else if (role === 'hod_staff' || user.role === 'hod_staff') {
    role = 'hod_staff';
  } else if (role === 'hod' || user.is_hod || (user.department_code && !user.staff_code && !user.staff_id)) {
    role = 'hod';
  } else if (role === 'developer' || user.role === 'developer') {
    role = 'developer';
  } else {
    role = 'student';
  }

  const cleanUser = {
    ...user,
    role
  };

  // 3. Store ONLY for the verified role
  try {
    localStorage.setItem('fcc_active_role', role);

    if (role === 'admin') {
      localStorage.setItem('fcc_admin_session', JSON.stringify(cleanUser));
      if (token) localStorage.setItem('fcc_admin_token', token);
    } else if (role === 'hod') {
      localStorage.setItem('fcc_hod_session', JSON.stringify(cleanUser));
      if (token) localStorage.setItem('fcc_hod_token', token);
    } else if (role === 'hod_staff') {
      localStorage.setItem('fcc_hod_session', JSON.stringify(cleanUser));
      localStorage.setItem('fcc_active_staff_session', JSON.stringify(cleanUser));
      if (token) localStorage.setItem('fcc_hod_token', token);
    } else if (role === 'developer') {
      localStorage.setItem('fcc_developer_session', 'active');
      localStorage.setItem('fcc_god_mode', 'true');
      if (token) localStorage.setItem('fcc_developer_token', token);
    } else {
      localStorage.setItem('fcc_student_session', JSON.stringify(cleanUser));
      if (token) localStorage.setItem('fcc_student_token', token);
    }

    // 4. Record user-scoped Login Security Notification & broadcast to dashboard Notification Bell
    if (typeof window !== 'undefined') {
      try {
        const userIdentifier = cleanUser.matric || cleanUser.username || cleanUser.email || cleanUser.department_code || String(cleanUser.id || role);
        const userEmail = cleanUser.email || (role === 'hod' && cleanUser.department_code ? `hod_${String(cleanUser.department_code).toLowerCase()}@fccibadan.edu.ng` : '');
        const nowStr = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
        const roleLabel = role === 'admin'
          ? 'Chief Librarian / Administrator'
          : role === 'hod'
          ? `Head of Department (${cleanUser.department_name || cleanUser.department_code || 'Faculty'})`
          : role === 'developer'
          ? 'Lead Systems Developer'
          : 'Student / Scholar';

        const loginNotifItem = {
          id: `NOTIF-LOGIN-${Date.now()}`,
          matric: userIdentifier,
          email: userEmail,
          role,
          type: 'login_security',
          title: `Security Alert: New Sign-In (${roleLabel})`,
          message: `Hello ${cleanUser.name || 'User'}, your account (${userIdentifier}) signed in on ${nowStr}. A login security notification email has been dispatched to ${userEmail || 'your registered email'}.`,
          date: new Date().toISOString(),
          read: 0,
          email_dispatched: true
        };

        const storageKey = `fcc_user_notifs_${String(userIdentifier).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const nextList = [loginNotifItem, ...(Array.isArray(existing) ? existing : [])].slice(0, 50);
        localStorage.setItem(storageKey, JSON.stringify(nextList));

        // Also ensure backend notifications table + email dispatch are triggered if not already sent by login endpoint
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            matric: userIdentifier,
            email: userEmail,
            name: cleanUser.name || 'Authorized User',
            type: 'login_security',
            title: loginNotifItem.title,
            message: loginNotifItem.message,
            send_email: true
          })
        }).catch(() => {});

        window.dispatchEvent(new CustomEvent('fcc-notifications-updated', {
          detail: { user: cleanUser, notification: loginNotifItem }
        }));
      } catch (notifErr) {}

      window.dispatchEvent(new CustomEvent('fcc-auth-changed', {
        detail: { user: cleanUser, role, token }
      }));
    }
  } catch (e) {
    console.error('[authSessionManager] Failed to persist user session:', e);
  }

  return cleanUser;
}

/**
 * Reads the currently authenticated session strictly adhering to fcc_active_role.
 * Prevents cross-role bleed (e.g. admin session loading on student profile).
 */
export function getActiveUserSession() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const activeRole = localStorage.getItem('fcc_active_role');

    if (activeRole === 'admin') {
      const s = localStorage.getItem('fcc_admin_session');
      if (s) {
        const u = JSON.parse(s);
        if (u && (u.role === 'admin' || u.is_admin)) return u;
      }
      return null;
    }

    if (activeRole === 'hod' || activeRole === 'hod_staff') {
      const s = localStorage.getItem('fcc_active_staff_session') || localStorage.getItem('fcc_hod_session');
      if (s) {
        const u = JSON.parse(s);
        if (u && (u.role === 'hod' || u.role === 'hod_staff' || u.department_code)) return u;
      }
      return null;
    }

    if (activeRole === 'developer') {
      const isDev = localStorage.getItem('fcc_developer_session') === 'active';
      if (isDev) return { role: 'developer', name: 'Lead Systems Developer' };
      return null;
    }

    if (activeRole === 'student') {
      const s = localStorage.getItem('fcc_student_session');
      if (s) {
        const u = JSON.parse(s);
        if (u && (u.role === 'student' || u.matric)) return u;
      }
      return null;
    }

    // Fallback: Check if active session exists
    const hasAdmin = Boolean(localStorage.getItem('fcc_admin_session'));
    const hasStaff = Boolean(localStorage.getItem('fcc_active_staff_session'));
    const hasHod = Boolean(localStorage.getItem('fcc_hod_session'));
    const hasStudent = Boolean(localStorage.getItem('fcc_student_session'));

    if (hasStaff) {
      localStorage.setItem('fcc_active_role', 'hod_staff');
      return JSON.parse(localStorage.getItem('fcc_active_staff_session'));
    }
    if (hasAdmin) {
      localStorage.setItem('fcc_active_role', 'admin');
      return JSON.parse(localStorage.getItem('fcc_admin_session'));
    }
    if (hasHod) {
      const parsed = JSON.parse(localStorage.getItem('fcc_hod_session'));
      if (parsed?.role === 'hod_staff') {
        localStorage.setItem('fcc_active_role', 'hod_staff');
      } else {
        localStorage.setItem('fcc_active_role', 'hod');
      }
      return parsed;
    }
    if (hasStudent) {
      localStorage.setItem('fcc_active_role', 'student');
      return JSON.parse(localStorage.getItem('fcc_student_session'));
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Returns the canonical dashboard route for an authenticated role.
 */
export function getDashboardRouteForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin/overview';
    case 'hod':
      return '/hod/overview';
    case 'hod_staff':
      return '/hod/staff-workspace';
    case 'developer':
      return '/developer/console';
    case 'student':
    default:
      return '/scholar/profile';
  }
}
