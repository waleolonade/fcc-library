import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell, ShieldCheck, Mail, BookOpen, Check, CheckCheck, Trash2,
  X, Sparkles, Clock, AlertCircle, ExternalLink, RefreshCw,
  Send, Lock, Bookmark, Layers
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { getActiveUserSession } from '../utils/authSessionManager';
import { sounds } from '../utils/soundEffects';
import { navigateTo } from '../utils/router';

/**
 * Universal User-Scoped Notification Icon & Real-Time Notification Center
 * Mounted on every dashboard (Student, HOD, Admin, Developer, and OPAC).
 * Strictly filters notifications for the currently authenticated user and
 * displays Login Security Email dispatch confirmations.
 */
export default function UniversalNotificationCenter({
  user: propUser = null,
  role: propRole = null,
  accentColor = '#10b981',
  compact = false,
  onOpenFullNotificationsTab = null
}) {
  const [sessionUser, setSessionUser] = useState(() => propUser || getActiveUserSession());
  const activeUser = propUser || sessionUser;
  const activeRole = propRole || activeUser?.role || 'student';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'security' | 'library'
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [toastBanner, setToastBanner] = useState(null);
  const dropdownRef = useRef(null);

  // Compute canonical user identifiers for strict user-scoped notification lookup
  const userIdentifiers = useMemo(() => {
    if (!activeUser) return { primary: '', matric: '', email: '', deptCode: '', userId: '' };
    const matric = activeUser.matric || activeUser.username || (activeUser.department_code ? `HOD/${activeUser.department_code}/001` : '') || '';
    const email = activeUser.email || (activeUser.department_code ? `hod_${String(activeUser.department_code).toLowerCase()}@fccibadan.edu.ng` : '') || '';
    const deptCode = activeUser.department_code || '';
    const userId = String(activeUser.id || matric || email || activeRole);
    const primary = matric || email || deptCode || userId;
    return { primary, matric, email, deptCode, userId };
  }, [activeUser, activeRole]);

  const localCacheKey = useMemo(() => {
    const id = userIdentifiers.primary || 'guest';
    return `fcc_user_notifs_${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }, [userIdentifiers.primary]);

  // Listen to auth changes
  useEffect(() => {
    const handleAuthChange = (e) => {
      setSessionUser(e.detail?.user || getActiveUserSession());
    };
    window.addEventListener('fcc-auth-changed', handleAuthChange);
    return () => window.removeEventListener('fcc-auth-changed', handleAuthChange);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch notifications specifically for this user
  const fetchUserNotifications = async (silent = false) => {
    if (!userIdentifiers.primary) {
      setNotifications([]);
      return;
    }
    if (!silent) setIsLoading(true);

    let localList = [];
    try {
      const raw = localStorage.getItem(localCacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localList = parsed;
      }
    } catch (e) {}

    try {
      const qs = new URLSearchParams({
        matric: userIdentifiers.matric || userIdentifiers.primary,
        email: userIdentifiers.email || '',
        user_id: userIdentifiers.userId || '',
        role: activeRole || '',
        department_code: userIdentifiers.deptCode || ''
      }).toString();

      const res = await fetch(`${getApiBase()}/notifications?${qs}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const dbList = await res.json();
        if (Array.isArray(dbList)) {
          // Merge DB notifications + local notifications without duplicates
          const seenIds = new Set();
          const merged = [];

          [...dbList, ...localList].forEach(item => {
            if (!item) return;
            const key = item.id || `${item.title}-${item.date}`;
            if (seenIds.has(key)) return;
            seenIds.add(key);
            merged.push({
              ...item,
              read: Boolean(Number(item.read))
            });
          });

          merged.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          setNotifications(merged);
          try {
            localStorage.setItem(localCacheKey, JSON.stringify(merged.slice(0, 60)));
          } catch (e) {}
          if (!silent) setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      // Fallback to local cache
    }

    setNotifications(localList.map(n => ({ ...n, read: Boolean(Number(n.read)) })));
    if (!silent) setIsLoading(false);
  };

  useEffect(() => {
    fetchUserNotifications(false);
    const interval = setInterval(() => fetchUserNotifications(true), 20000);

    const handleLiveNotif = (e) => {
      fetchUserNotifications(true);
      if (e.detail?.notification) {
        setToastBanner(e.detail.notification);
        setTimeout(() => setToastBanner(null), 5500);
      }
    };
    window.addEventListener('fcc-notifications-updated', handleLiveNotif);
    return () => {
      clearInterval(interval);
      window.removeEventListener('fcc-notifications-updated', handleLiveNotif);
    };
  }, [userIdentifiers.primary, localCacheKey]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterTab === 'unread') return !n.read;
      if (filterTab === 'security') {
        return (n.type || '').includes('login') || (n.type || '').includes('security') || (n.title || '').toLowerCase().includes('sign-in') || (n.title || '').toLowerCase().includes('security');
      }
      if (filterTab === 'library') {
        return !(n.type || '').includes('login') && !(n.type || '').includes('security');
      }
      return true;
    });
  }, [notifications, filterTab]);

  const handleMarkAsRead = async (notifId) => {
    sounds.playClick();
    const updated = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifications(updated);
    try {
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetch(`${getApiBase()}/notifications/${encodeURIComponent(notifId)}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric: userIdentifiers.primary })
      });
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    sounds.playSuccessChime();
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetch(`${getApiBase()}/notifications/all/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric: userIdentifiers.primary })
      });
    } catch (e) {}
  };

  const handleDeleteNotification = async (notifId) => {
    sounds.playClick();
    const updated = notifications.filter(n => n.id !== notifId);
    setNotifications(updated);
    try {
      localStorage.setItem(localCacheKey, JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetch(`${getApiBase()}/notifications`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId, matric: userIdentifiers.primary })
      });
    } catch (e) {}
  };

  const handleDispatchLoginEmailAlertNow = async () => {
    if (!activeUser) return;
    setIsSendingTestAlert(true);
    sounds.playClick();
    const nowFormatted = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
    const targetEmail = userIdentifiers.email || 'librarian@fccibadanlibrary.com.ng';
    const title = `Login & Session Security Verification (${activeRole.toUpperCase()})`;
    const message = `Hello ${activeUser.name || 'Authorized User'}, this is an active login & security notification for your account (${userIdentifiers.primary}) at ${nowFormatted}. Email alert dispatched to ${targetEmail}.`;

    try {
      const res = await fetch(`${getApiBase()}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          matric: userIdentifiers.primary,
          email: targetEmail,
          name: activeUser.name || 'Authorized User',
          type: 'login_security',
          title,
          message,
          send_email: true
        })
      });
      const data = await res.json().catch(() => ({}));
      const newNotif = data?.notification || {
        id: `NOTIF-${Date.now()}`,
        matric: userIdentifiers.primary,
        type: 'login_security',
        title,
        message,
        date: new Date().toISOString(),
        read: false,
        email_dispatched: true
      };

      const next = [{ ...newNotif, read: false, email_dispatched: true }, ...notifications];
      setNotifications(next);
      try {
        localStorage.setItem(localCacheKey, JSON.stringify(next));
      } catch (e) {}
      sounds.playSuccessChime();
      setToastBanner({
        title: 'Login Email & Dashboard Notification Sent!',
        message: `Dispatched to ${targetEmail} and added to your Notification Center.`
      });
      setTimeout(() => setToastBanner(null), 5000);
    } catch (err) {
      // Fallback local notification
      const fallback = {
        id: `NOTIF-${Date.now()}`,
        matric: userIdentifiers.primary,
        type: 'login_security',
        title,
        message,
        date: new Date().toISOString(),
        read: false,
        email_dispatched: true
      };
      const next = [fallback, ...notifications];
      setNotifications(next);
      try {
        localStorage.setItem(localCacheKey, JSON.stringify(next));
      } catch (e) {}
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  const getNotifIcon = (type = '', title = '') => {
    const t = `${type} ${title}`.toLowerCase();
    if (t.includes('login') || t.includes('sign-in') || t.includes('security') || t.includes('2fa')) {
      return <ShieldCheck size={16} className="text-emerald-400" />;
    }
    if (t.includes('email') || t.includes('mail')) {
      return <Mail size={16} className="text-sky-400" />;
    }
    if (t.includes('bookmark') || t.includes('saved')) {
      return <Bookmark size={16} className="text-amber-400" />;
    }
    if (t.includes('journal') || t.includes('upload') || t.includes('book') || t.includes('catalog')) {
      return <BookOpen size={16} className="text-indigo-400" />;
    }
    return <Bell size={16} className="text-teal-400" />;
  };

  /**
   * Resolve the exact actionable route and CTA label for any notification
   * so clicking the notification leads the user directly to the page where
   * they can perform the required action.
   */
  const resolveNotificationAction = (notif) => {
    const roleLower = String(activeRole || 'student').toLowerCase();
    const rawType = String(notif?.type || notif?.category || '').toLowerCase();
    const rawTitle = String(notif?.title || '').toLowerCase();
    const rawMsg = String(notif?.message || '').toLowerCase();
    const combined = `${rawType} ${rawTitle} ${rawMsg}`;
    const rawActionUrl = String(notif?.action_url || notif?.actionUrl || '').trim();

    // 1. HOD Upload / Submission / Course Material Approval
    if (
      combined.includes('hod submission') ||
      combined.includes('ingestion') ||
      combined.includes('pending review') ||
      combined.includes('uploaded material') ||
      combined.includes('department upload') ||
      rawType.includes('upload') ||
      rawType.includes('submission')
    ) {
      if (roleLower === 'admin' || roleLower === 'super_admin' || roleLower === 'chief_librarian') {
        return { route: '/admin/hod-submissions', label: 'Review HOD Submission' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/submissions', label: 'Open Ingestion Pipeline' };
      }
      return { route: '/scholar/library_digital', label: 'View Department Materials' };
    }

    // 2. Academic Journals / Research Papers
    if (combined.includes('journal') || combined.includes('issn') || combined.includes('doi') || combined.includes('research paper')) {
      if (roleLower === 'hod') {
        return { route: '/hod/upload', label: 'Manage Academic Journals' };
      }
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/research', label: 'Open Research & Journals' };
      }
      return { route: '/scholar/research_journals', label: 'Open Academic Journals' };
    }

    // 3. Theses / Dissertations / Student Projects
    if (combined.includes('thesis') || combined.includes('theses') || combined.includes('dissertation') || combined.includes('hnd project')) {
      if (roleLower === 'hod') {
        return { route: '/hod/dissertations', label: 'Review Dissertations' };
      }
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/research', label: 'Open Theses Repository' };
      }
      return { route: '/scholar/research_hnd_projects', label: 'Open Student Projects & Theses' };
    }

    // 4. Bookmarks / Saved Items
    if (combined.includes('bookmark') || combined.includes('saved list')) {
      if (roleLower === 'student') {
        return { route: '/scholar/my_saved', label: 'Open Saved Bookmarks' };
      }
    }

    // 5. Overdue / Due Date / Borrowed Books / Loans / Returns
    if (
      combined.includes('overdue') ||
      combined.includes('due date') ||
      combined.includes('due soon') ||
      combined.includes('borrowed') ||
      combined.includes('checkout') ||
      combined.includes('return confirmed') ||
      rawType.includes('loan') ||
      rawType.includes('overdue') ||
      rawType.includes('due')
    ) {
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/circulation', label: 'Open Circulation Desk' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/reserves', label: 'Open Course Reserves' };
      }
      return { route: '/scholar/my_borrowed', label: 'Manage Borrowed Books' };
    }

    // 6. Reservations / Holds / Course Reserves
    if (combined.includes('reservation') || combined.includes('reserved') || combined.includes('course reserve') || combined.includes('hold')) {
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/circulation', label: 'Manage Reservations' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/reserves', label: 'Manage Course Reserves' };
      }
      return { route: '/scholar/my_reserved', label: 'View Reserved Books' };
    }

    // 7. Fines / Convocation Clearance / Patron Registry
    if (combined.includes('fine') || combined.includes('clearance') || combined.includes('convocation')) {
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/patrons', label: 'Manage Student Clearance' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/scholars', label: 'Approve Student Clearance' };
      }
      return { route: '/scholar/clearance', label: 'Open Clearance Status' };
    }

    // 8. Messages / Dispatch / Communications / Helpdesk
    if (
      combined.includes('message') ||
      combined.includes('dispatch') ||
      combined.includes('communication') ||
      combined.includes('helpdesk') ||
      combined.includes('announcement')
    ) {
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/comms', label: 'Open Communication Hub' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/communication', label: 'Open Tri-Party Dispatch' };
      }
      return { route: '/scholar/communication', label: 'Open Messages & Support' };
    }

    // 9. Developer Master Portal / System Configuration / API Updates
    if (
      rawType.includes('developer') ||
      combined.includes('developer master') ||
      combined.includes('architecture') ||
      combined.includes('api configuration') ||
      combined.includes('gora') ||
      combined.includes('inneai')
    ) {
      if (roleLower === 'developer') {
        return { route: '/developer', label: 'Open Developer Master Portal' };
      }
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/apis', label: 'Open API & System Settings' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/overview', label: 'Open Department Overview' };
      }
      return { route: '/scholar/home', label: 'Open Scholar Dashboard' };
    }

    // 10. Login Security / 2FA / Password / Profile
    if (
      combined.includes('login') ||
      combined.includes('sign-in') ||
      combined.includes('security') ||
      combined.includes('password') ||
      combined.includes('2fa') ||
      combined.includes('profile')
    ) {
      if (roleLower === 'developer') {
        return { route: '/developer', label: 'Review Developer Security' };
      }
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/settings', label: 'Review Admin Security Settings' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/settings', label: 'Open HOD Profile & Security' };
      }
      return { route: '/scholar/profile', label: 'Open Account Security & Profile' };
    }

    // 11. New Arrivals / Books / Catalog
    if (combined.includes('new arrival') || combined.includes('catalog') || combined.includes('book') || combined.includes('textbook')) {
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        return { route: '/admin/overview', label: 'Open Central Catalog' };
      }
      if (roleLower === 'hod') {
        return { route: '/hod/overview', label: 'Open Department Books' };
      }
      return { route: '/scholar/library_books', label: 'Browse Library Catalog' };
    }

    // 12. Explicit action_url if present and not generic
    if (rawActionUrl) {
      let cleaned = rawActionUrl;
      if (cleaned.includes('#/')) {
        cleaned = '/' + cleaned.split('#/')[1];
      } else {
        cleaned = cleaned.replace(/^#/, '');
      }
      if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
      if (cleaned !== '/student/notifications') {
        return { route: cleaned, label: 'Go to Action Page' };
      }
    }

    // 13. Role-based default actionable landing page
    if (roleLower === 'developer') return { route: '/developer', label: 'Open Developer Console' };
    if (roleLower === 'admin' || roleLower === 'super_admin') return { route: '/admin/overview', label: 'Open Admin Dashboard' };
    if (roleLower === 'hod') return { route: '/hod/overview', label: 'Open HOD Console' };
    return { route: '/scholar/home', label: 'Open Scholar Portal' };
  };

  /**
   * Handle clicking a notification card or toast banner:
   * marks it as read, closes the dropdown, and navigates directly to the actionable page.
   */
  const handleNotificationClick = (notif) => {
    if (!notif) return;
    sounds.playClick();
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    const { route } = resolveNotificationAction(notif);
    setIsOpen(false);
    setToastBanner(null);

    if (route) {
      navigateTo(route);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        window.dispatchEvent(
          new CustomEvent('fcc-notification-navigate', {
            detail: { route, notification: notif, role: activeRole }
          })
        );
      }
    }
  };

  if (!activeUser) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Floating Live Toast Banner on New Login / Notification (100% Solid Background + Clickable) */}
      {toastBanner && (
        <div
          onClick={() => handleNotificationClick(toastBanner)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(toastBanner); }}
          className="fixed top-4 right-4 z-[9999] max-w-sm bg-[#0a1428] hover:bg-[#101e38] border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-start gap-3 animate-fadeIn cursor-pointer transition"
          title="Click to open and perform this notification action"
        >
          <div className="w-8 h-8 rounded-xl bg-[#064e3b] border border-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
            <Mail size={16} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-emerald-300 truncate">{toastBanner.title}</div>
            <div className="text-[11px] text-slate-200 line-clamp-2 mt-0.5">{toastBanner.message}</div>
            <div className="text-[10px] font-bold text-amber-300 mt-1 flex items-center gap-1">
              <span>{resolveNotificationAction(toastBanner).label}</span>
              <ExternalLink size={10} />
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setToastBanner(null);
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Notification Bell Trigger Button (100% Solid Background) */}
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          setIsOpen(prev => !prev);
          if (!isOpen) fetchUserNotifications(true);
        }}
        className={`relative flex items-center gap-1.5 rounded-xl border transition cursor-pointer ${
          compact
            ? 'p-2 bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-slate-100'
            : 'px-3 py-2 bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-slate-100 shadow-md'
        }`}
        title={`Notifications for ${activeUser.name || userIdentifiers.primary} (${unreadCount} unread)`}
      >
        <div className="relative">
          <Bell size={16} className={unreadCount > 0 ? 'text-amber-400 animate-Bells' : 'text-slate-200'} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black flex items-center justify-center shadow ring-2 ring-[#0f172a]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!compact && (
          <span className="hidden xl:inline text-xs font-bold text-slate-100">
            Notifications
          </span>
        )}
      </button>

      {/* Notification Center Popover / Drawer — 100% Solid Opaque Background */}
      {isOpen && (
        <div
          className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[94vw] sm:w-[430px] max-h-[82vh] bg-[#0a1224] border-2 border-slate-700 rounded-3xl shadow-2xl z-[9990] flex flex-col overflow-hidden text-left animate-fadeIn"
          style={{ backgroundColor: '#0a1224', opacity: 1 }}
        >
          {/* Header (Solid Opaque) */}
          <div className="p-4 bg-[#0f172a] border-b border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 bg-[#162238] border-emerald-500 text-emerald-400"
              >
                <Bell size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                    Personal Notification Center
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-700 border border-rose-500 text-white text-[10px] font-mono font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-mono truncate">
                  {activeUser.name || 'User'} • {userIdentifiers.email || userIdentifiers.primary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchUserNotifications(false)}
                className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Refresh notifications"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Email Login Notification Status Strip (Solid Opaque) */}
          <div className="px-4 py-2.5 bg-[#063628] border-b border-emerald-700 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={13} className="text-emerald-300 shrink-0" />
              <span className="text-emerald-100 truncate">
                Login Email Alerts: <strong>Active</strong> ({userIdentifiers.email || 'Institutional Mail'})
              </span>
            </div>
            <button
              type="button"
              onClick={handleDispatchLoginEmailAlertNow}
              disabled={isSendingTestAlert}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-400 text-white text-[10px] font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
              title="Send a live login notification email to your address and record in inbox"
            >
              <Send size={10} />
              <span>{isSendingTestAlert ? 'Sending...' : 'Send Email Alert'}</span>
            </button>
          </div>

          {/* Filter Tabs & Mark All Read (Solid Opaque) */}
          <div className="px-3 py-2 bg-[#0d1629] border-b border-slate-700 flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: `All (${notifications.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'security', label: 'Login & Security' },
                { id: 'library', label: 'Library' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#1e293b] text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-2 py-1 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck size={11} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Stream (100% Solid Rows + Entire Row Clickable to Navigate) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800 max-h-[390px] bg-[#0a1224]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-[#0a1224]">
                <Bell size={28} className="mx-auto text-slate-500" />
                <div className="text-xs font-bold text-slate-200">No notifications in this view</div>
                <p className="text-[11px] text-slate-400">
                  Login security alerts, bookmarked resources, loan updates, and departmental notices for {activeUser.name || userIdentifiers.primary} will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isLoginAlert = (notif.type || '').includes('login') || (notif.title || '').toLowerCase().includes('sign-in');
                const actionInfo = resolveNotificationAction(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notif); }}
                    className={`p-3.5 transition flex items-start gap-3 cursor-pointer group ${
                      !notif.read
                        ? 'bg-[#12223d] hover:bg-[#182c4f] border-l-4 border-l-emerald-400'
                        : 'bg-[#0b1324] hover:bg-[#132038]'
                    }`}
                    title={`Click to open: ${actionInfo.label}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isLoginAlert
                        ? 'bg-[#064e3b] border-emerald-500'
                        : 'bg-[#1e293b] border-slate-600'
                    }`}>
                      {getNotifIcon(notif.type, notif.title)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs leading-snug group-hover:text-emerald-300 transition ${!notif.read ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {notif.date ? new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                        {notif.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#1e293b] group-hover:bg-emerald-700 border border-slate-600 group-hover:border-emerald-400 text-cyan-300 group-hover:text-white text-[10px] font-bold flex items-center gap-1 transition">
                            <span>{actionInfo.label}</span>
                            <ExternalLink size={9} />
                          </span>
                          {isLoginAlert && (
                            <span className="px-2 py-0.5 rounded-md bg-[#064e3b] border border-emerald-600 text-emerald-200 text-[9px] font-mono font-bold flex items-center gap-1">
                              <Mail size={9} />
                              <span>Email Sent</span>
                            </span>
                          )}
                          <span className="text-[9.5px] font-mono text-slate-400">
                            {notif.date ? new Date(notif.date).toLocaleDateString() : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notif.id);
                              }}
                              className="px-2 py-0.5 rounded bg-[#1e293b] hover:bg-emerald-800 text-emerald-300 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer border border-slate-600"
                              title="Mark as read"
                            >
                              <Check size={10} />
                              <span>Read</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notif.id);
                            }}
                            className="p-1 rounded bg-[#1e293b] hover:bg-rose-900 text-slate-300 hover:text-rose-200 transition cursor-pointer border border-slate-700"
                            title="Delete notification"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer (Solid Opaque) */}
          <div className="p-3 bg-[#0f172a] border-t border-slate-700 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-mono text-[10px]">
              Scoped to: <strong className="text-white">{userIdentifiers.primary}</strong>
            </span>
            {onOpenFullNotificationsTab ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullNotificationsTab();
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Notification Inbox</span>
                <ExternalLink size={11} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

