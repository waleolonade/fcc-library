import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, CheckCheck, X, Clock, BookOpen, DollarSign, Sparkles,
  Calendar, AlertTriangle, CheckCircle, ChevronRight, Megaphone, Mail, RefreshCw, ExternalLink
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { navigateTo } from '../utils/router';

// =========================================================================
// NOTIFICATION CENTER
// Types: reservation confirmation, reservation availability, due date reminders,
// overdue notices, return confirmation, fine notifications, new arrivals,
// library announcements. In-app + email config.
// =========================================================================

const NOTIFICATION_TYPES = {
  'Due Date': { icon: Clock, color: 'amber', label: 'Due Date' },
  'Overdue': { icon: AlertTriangle, color: 'rose', label: 'Overdue Notice' },
  'Reservation': { icon: BookOpen, color: 'indigo', label: 'Reservation' },
  'Fine': { icon: DollarSign, color: 'rose', label: 'Fine' },
  'Return': { icon: CheckCircle, color: 'emerald', label: 'Return Confirmed' },
  'New Arrivals': { icon: Sparkles, color: 'teal', label: 'New Arrivals' },
  'Announcement': { icon: Megaphone, color: 'purple', label: 'Announcement' },
  'Research Alert': { icon: BookOpen, color: 'indigo', label: 'Research Alert' },
  'developer_modification': { icon: Megaphone, color: 'emerald', label: 'Developer Update' },
  'Developer Update': { icon: Megaphone, color: 'emerald', label: 'Developer Update' },
};

const PRIORITY_COLORS = {
  high: 'text-rose-200 bg-[#4c0519] border-rose-500',
  medium: 'text-amber-200 bg-[#451a03] border-amber-500',
  low: 'text-slate-200 bg-[#1e293b] border-slate-600',
};

const resolveStudentNotificationRoute = (notif) => {
  const combined = `${notif?.category || ''} ${notif?.title || ''} ${notif?.message || ''}`.toLowerCase();
  const rawAction = String(notif?.actionUrl || notif?.action_url || '').trim();

  if (combined.includes('overdue') || combined.includes('due date') || combined.includes('due soon') || combined.includes('borrowed') || combined.includes('return')) {
    return { route: '/scholar/my_borrowed', label: 'Manage Borrowed Books' };
  }
  if (combined.includes('reservation') || combined.includes('reserved') || combined.includes('hold')) {
    return { route: '/scholar/my_reserved', label: 'View Reserved Books' };
  }
  if (combined.includes('fine') || combined.includes('clearance') || combined.includes('convocation')) {
    return { route: '/scholar/clearance', label: 'Open Clearance & Fines' };
  }
  if (combined.includes('journal') || combined.includes('issn') || combined.includes('research alert')) {
    return { route: '/scholar/research_journals', label: 'Open Academic Journals' };
  }
  if (combined.includes('thesis') || combined.includes('dissertation') || combined.includes('project')) {
    return { route: '/scholar/research_hnd_projects', label: 'Open Projects & Theses' };
  }
  if (combined.includes('bookmark') || combined.includes('saved')) {
    return { route: '/scholar/my_saved', label: 'Open Saved Bookmarks' };
  }
  if (combined.includes('login') || combined.includes('sign-in') || combined.includes('security') || combined.includes('password') || combined.includes('profile')) {
    return { route: '/scholar/profile', label: 'Review Account Security' };
  }
  if (combined.includes('message') || combined.includes('dispatch') || combined.includes('helpdesk') || combined.includes('support')) {
    return { route: '/scholar/communication', label: 'Open Messages & Support' };
  }
  if (combined.includes('new arrival') || combined.includes('book') || combined.includes('catalog')) {
    return { route: '/scholar/library_books', label: 'Browse Library Books' };
  }
  if (rawAction) {
    let cleaned = rawAction.includes('#/') ? '/' + rawAction.split('#/')[1] : rawAction.replace(/^#/, '');
    if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
    if (cleaned !== '/student/notifications' && cleaned !== '/scholar/notifications') {
      return { route: cleaned, label: 'Perform Action' };
    }
  }
  return { route: '/scholar/home', label: 'Open Dashboard' };
};

export default function NotificationCenter({ user, notifications: propNotifications = [], onNotificationRead, onNotificationsClear }) {
  const [notifications, setNotifications] = useState(propNotifications);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [filterRead, setFilterRead] = useState('All');
  const [emailPrefs, setEmailPrefs] = useState({
    dueDate: true, overdue: true, reservation: true, fine: true, newArrivals: false, announcements: false,
  });
  const [showPrefs, setShowPrefs] = useState(false);

  // Fetch live notifications from database API (by matric or email)
  const fetchDbNotifications = async () => {
    if (!user?.matric && !user?.email) return;
    try {
      setLoading(true);
      const queryParam = user.matric || user.email;
      const dbNotifs = await libraryApi.notifications.getAll(queryParam);
      if (Array.isArray(dbNotifs) && dbNotifs.length > 0) {
        const normalized = dbNotifs.map(n => ({
          id: n.id,
          matric: n.matric,
          category: n.type === 'developer_modification' ? 'Developer Update' : (n.type || 'General'),
          title: n.title,
          message: n.message,
          date: n.date,
          isRead: Boolean(n.read),
          actionUrl: n.action_url
        }));
        setNotifications(normalized);
      }
    } catch (err) {
      console.error('Failed to load database notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbNotifications();
  }, [user?.matric, user?.email]);

  const updateNotifications = (updated) => {
    setNotifications(updated);
  };

  const userNotifications = useMemo(() =>
    notifications.filter(n => {
      if (!n.matric) return true;
      const target = (n.matric || '').toLowerCase();
      const uMatric = (user?.matric || '').toLowerCase();
      const uEmail = (user?.email || '').toLowerCase();
      return (uMatric && target.includes(uMatric)) || (uEmail && target.includes(uEmail)) || target === 'global';
    }),
    [notifications, user]
  );

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter(n => {
      const matchType = filterType === 'All' || n.category === filterType;
      const matchRead = filterRead === 'All' || (filterRead === 'Unread' ? !n.isRead : n.isRead);
      return matchType && matchRead;
    }).sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      const pOrder = { high: 0, medium: 1, low: 2 };
      return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
    });
  }, [userNotifications, filterType, filterRead]);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    updateNotifications(updated);
    if (onNotificationRead) onNotificationRead(id);
    try {
      await libraryApi.notifications.markRead(id, user?.matric);
    } catch (e) {}
  };

  const markAllRead = async () => {
    const updated = notifications.map(n => n.matric === user?.matric ? { ...n, isRead: true } : n);
    updateNotifications(updated);
    try {
      await libraryApi.notifications.markRead('all', user?.matric);
    } catch (e) {}
  };

  const deleteNotification = async (id) => {
    updateNotifications(notifications.filter(n => n.id !== id));
    try {
      await libraryApi.notifications.clear(id, false);
    } catch (e) {}
  };

  const clearAll = async () => {
    updateNotifications(notifications.filter(n => n.matric !== user?.matric));
    if (onNotificationsClear) onNotificationsClear();
    try {
      await libraryApi.notifications.clear(user?.matric, true);
    } catch (e) {}
  };

  const types = ['All', ...Array.from(new Set(userNotifications.map(n => n.category)))];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={24} className="text-indigo-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Notifications</h2>
            <p className="text-slate-400 text-sm mt-0.5">{unreadCount} unread • {userNotifications.length} total</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPrefs(!showPrefs)} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold flex items-center gap-1.5 border border-slate-700 transition">
            <Mail size={14} /> Email Prefs
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition">
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Email Preferences */}
      {showPrefs && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail size={15} className="text-indigo-400" /> Email Notification Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'dueDate', label: 'Due Date Reminders' },
              { key: 'overdue', label: 'Overdue Notices' },
              { key: 'reservation', label: 'Reservation Updates' },
              { key: 'fine', label: 'Fine Notifications' },
              { key: 'newArrivals', label: 'New Arrivals' },
              { key: 'announcements', label: 'Announcements' },
            ].map(pref => (
              <label key={pref.key} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 p-2 rounded-lg hover:bg-slate-800 transition">
                <div
                  onClick={() => setEmailPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition flex-shrink-0 ${emailPrefs[pref.key] ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${emailPrefs[pref.key] ? 'left-4' : 'left-0.5'}`} />
                </div>
                {pref.label}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">Email delivery requires institutional SMTP configuration by the library administrator.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5">
          {['All', 'Unread', 'Read'].map(f => (
            <button key={f} onClick={() => setFilterRead(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterRead === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === t ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{t}</button>
          ))}
        </div>
        {userNotifications.length > 0 && (
          <button onClick={clearAll} className="ml-auto text-xs text-rose-400 hover:text-rose-300 transition">Clear All</button>
        )}
      </div>

      {/* Notification List — 100% Solid Background & Clickable to Perform Action */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 space-y-2 bg-[#0a1224] rounded-2xl border border-slate-800">
          <Bell size={40} className="mx-auto text-slate-600" />
          <p className="text-slate-300 font-semibold">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map(notif => {
            const typeCfg = NOTIFICATION_TYPES[notif.category] || NOTIFICATION_TYPES['Announcement'];
            const Icon = typeCfg.icon;
            const colorMap = {
              amber: 'text-amber-300 bg-[#451a03] border border-amber-600',
              rose: 'text-rose-300 bg-[#4c0519] border border-rose-600',
              indigo: 'text-indigo-300 bg-[#1e1b4b] border border-indigo-600',
              emerald: 'text-emerald-300 bg-[#064e3b] border border-emerald-600',
              teal: 'text-teal-300 bg-[#134e4a] border border-teal-600',
              purple: 'text-purple-300 bg-[#3b0764] border border-purple-600',
              slate: 'text-slate-200 bg-[#1e293b] border border-slate-600',
            };
            const iconStyle = colorMap[typeCfg.color] || colorMap.slate;
            const actionInfo = resolveStudentNotificationRoute(notif);

            const handleCardClick = () => {
              if (!notif.isRead) markRead(notif.id);
              if (actionInfo?.route) {
                navigateTo(actionInfo.route);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new HashChangeEvent('hashchange'));
                  window.dispatchEvent(
                    new CustomEvent('fcc-notification-navigate', {
                      detail: { route: actionInfo.route, notification: notif, role: 'student' }
                    })
                  );
                }
              }
            };

            return (
              <div
                key={notif.id}
                onClick={handleCardClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
                className={`p-4 rounded-xl border transition cursor-pointer group ${
                  !notif.isRead
                    ? 'bg-[#12223d] hover:bg-[#182c4f] border-indigo-500 border-l-4 border-l-emerald-400 shadow-lg'
                    : 'bg-[#0f172a] hover:bg-[#162238] border-slate-700'
                }`}
                title={`Click to open: ${actionInfo.label}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!notif.isRead && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />}
                        <p className={`text-sm font-bold group-hover:text-emerald-300 transition ${!notif.isRead ? 'text-white' : 'text-slate-200'}`}>{notif.title}</p>
                        {notif.priority && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.low}`}>
                            {notif.priority}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-[#1e293b] text-slate-200 text-[10px] font-semibold border border-slate-600">{notif.category}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!notif.isRead && (
                          <button onClick={(e) => { e.stopPropagation(); markRead(notif.id); }} className="p-1.5 rounded bg-[#1e293b] hover:bg-emerald-800 text-slate-200 hover:text-white border border-slate-600 transition" title="Mark as read">
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="p-1.5 rounded bg-[#1e293b] hover:bg-rose-900 text-slate-200 hover:text-white border border-slate-600 transition" title="Delete notification">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] font-mono text-slate-400">{notif.date ? new Date(notif.date).toLocaleString() : (notif.timestamp || '')}</p>
                      <span className="px-2.5 py-1 rounded-lg bg-[#1e293b] group-hover:bg-emerald-700 border border-slate-600 group-hover:border-emerald-400 text-[10px] font-bold text-cyan-300 group-hover:text-white flex items-center gap-1 transition">
                        <span>{actionInfo.label}</span>
                        <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
