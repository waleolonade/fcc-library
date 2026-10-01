import React, { useState, useMemo } from 'react';
import {
  Bell, CheckCheck, X, Clock, BookOpen, DollarSign, Sparkles,
  Calendar, AlertTriangle, CheckCircle, ChevronRight, Megaphone, Mail
} from 'lucide-react';

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
  'Study Room': { icon: Calendar, color: 'slate', label: 'Study Room' },
};

const PRIORITY_COLORS = {
  high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-slate-400 bg-slate-700/60 border-slate-600/30',
};

export default function NotificationCenter({ user, notifications: propNotifications = [], onNotificationRead, onNotificationsClear }) {
  const [notifications, setNotifications] = useState(propNotifications);
  const [filterType, setFilterType] = useState('All');
  const [filterRead, setFilterRead] = useState('All');
  const [emailPrefs, setEmailPrefs] = useState({
    dueDate: true, overdue: true, reservation: true, fine: true, newArrivals: false, announcements: false,
  });
  const [showPrefs, setShowPrefs] = useState(false);

  const updateNotifications = (updated) => {
    setNotifications(updated);
  };

  const userNotifications = useMemo(() =>
    notifications.filter(n => n.matric === user?.matric),
    [notifications, user]
  );

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter(n => {
      const matchType = filterType === 'All' || n.category === filterType;
      const matchRead = filterRead === 'All' || (filterRead === 'Unread' ? !n.isRead : n.isRead);
      return matchType && matchRead;
    }).sort((a, b) => {
      // Sort: unread first, then by priority (high > medium > low)
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      const pOrder = { high: 0, medium: 1, low: 2 };
      return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
    });
  }, [userNotifications, filterType, filterRead]);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    updateNotifications(updated);
    if (onNotificationRead) onNotificationRead(id);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => n.matric === user?.matric ? { ...n, isRead: true } : n);
    updateNotifications(updated);
  };

  const deleteNotification = (id) => {
    updateNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    updateNotifications(notifications.filter(n => n.matric !== user?.matric));
    if (onNotificationsClear) onNotificationsClear();
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

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Bell size={40} className="mx-auto text-slate-700" />
          <p className="text-slate-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(notif => {
            const typeCfg = NOTIFICATION_TYPES[notif.category] || NOTIFICATION_TYPES['Announcement'];
            const Icon = typeCfg.icon;
            const colorMap = {
              amber: 'text-amber-400 bg-amber-500/10',
              rose: 'text-rose-400 bg-rose-500/10',
              indigo: 'text-indigo-400 bg-indigo-500/10',
              emerald: 'text-emerald-400 bg-emerald-500/10',
              teal: 'text-teal-400 bg-teal-500/10',
              purple: 'text-purple-400 bg-purple-500/10',
              slate: 'text-slate-400 bg-slate-700/60',
            };
            const iconStyle = colorMap[typeCfg.color] || colorMap.slate;

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition ${
                  !notif.isRead ? 'bg-slate-900 border-indigo-500/20' : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconStyle}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                        <p className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>{notif.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.low}`}>
                          {notif.priority}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">{notif.category}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && (
                          <button onClick={() => markRead(notif.id)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition" title="Mark as read">
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notif.id)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-600">{notif.timestamp}</p>
                      {notif.actionUrl && (
                        <a href={notif.actionUrl} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition">
                          View <ChevronRight size={10} />
                        </a>
                      )}
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
