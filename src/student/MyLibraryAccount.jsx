import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Clock, AlertTriangle, Bell, Star, List, DollarSign,
  History, CheckCircle, User, Calendar, Hash, TrendingUp, Award,
  BookMarked, Bookmark, XCircle, RefreshCw, Eye, ChevronRight
} from 'lucide-react';
import { PATRON_POLICIES, INITIAL_FAVORITES, INITIAL_READING_LISTS } from '../data/institutionalSeedData';

// =========================================================================
// MY LIBRARY ACCOUNT — Complete Dashboard
// Active loans, due soon, overdue, reservations, favorites, reading list,
// fines, notifications, borrowing history
// =========================================================================

function StatCard({ icon: Icon, label, value, color = 'slate', sub }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    slate: 'text-slate-400 bg-slate-800 border-slate-700',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  };
  const textColor = color === 'rose' ? 'text-rose-400' : color === 'amber' ? 'text-amber-400' :
    color === 'emerald' ? 'text-emerald-400' : color === 'indigo' ? 'text-indigo-400' :
    color === 'teal' ? 'text-teal-400' : 'text-white';

  return (
    <div className={`p-4 rounded-xl border ${colorMap[color].split(' ').slice(1).join(' ')} space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${colorMap[color].split(' ')[1]}`}>
          <Icon size={15} className={colorMap[color].split(' ')[0]} />
        </div>
      </div>
      <div className={`text-2xl font-extrabold ${textColor}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function LoanRow({ loan, books, onRenew, onPayFine }) {
  const book = books?.find(b => b.id === loan.bookId);
  const today = new Date();
  const dueDate = new Date(loan.dueDate);
  const daysUntilDue = Math.ceil((dueDate - today) / 86400000);
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = !isOverdue && daysUntilDue <= 3;

  return (
    <div className={`p-3.5 rounded-xl border transition ${
      isOverdue ? 'bg-rose-500/5 border-rose-500/20' :
      isDueSoon ? 'bg-amber-500/5 border-amber-500/20' :
      'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 flex-1">
          <p className="font-semibold text-white text-sm">{loan.bookTitle}</p>
          <p className="text-xs text-slate-400">{loan.author}</p>
          <div className="flex flex-wrap gap-2 text-xs mt-1.5">
            <span className="font-mono text-indigo-400">{loan.id}</span>
            <span className={`font-semibold ${isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
               isDueSoon ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` :
               `Due ${loan.dueDate}`}
            </span>
            {loan.renewalsCount > 0 && <span className="text-slate-500">Renewed {loan.renewalsCount}×</span>}
          </div>
          {loan.fine > 0 && (
            <p className="text-xs text-rose-400 font-semibold">Fine: ₦{loan.fine?.toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loan.status !== 'Returned' && (loan.renewalsCount || 0) < 2 && (
            <button
              onClick={() => onRenew && onRenew(loan.id)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1"
            >
              <RefreshCw size={11} /> Renew
            </button>
          )}
          {loan.fine > 0 && (
            <button
              onClick={() => onPayFine && onPayFine(loan.id)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
            >
              Pay Fine
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyLibraryAccount({
  user,
  loans = [],
  books = [],
  reservations = [],
  fines = [],
  notifications = [],
  favorites = [],
  readingLists = [],
  onRenewLoan,
  onPayFine,
  onNavigate,
  initialSection = 'overview'
}) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const userLoans = useMemo(() => loans.filter(l => l.matric === user?.matric), [loans, user]);
  const activeLoans = useMemo(() => userLoans.filter(l => l.status === 'Active'), [userLoans]);
  const overdueLoans = useMemo(() => userLoans.filter(l => l.status === 'Overdue'), [userLoans]);
  const dueSoonLoans = useMemo(() => activeLoans.filter(l => {
    const days = Math.ceil((new Date(l.dueDate) - new Date()) / 86400000);
    return days >= 0 && days <= 3;
  }), [activeLoans]);
  const userReservations = useMemo(() => reservations.filter(r => r.matric === user?.matric), [reservations, user]);
  const userFines = useMemo(() => fines.filter(f => f.matric === user?.matric && f.status !== 'Paid' && f.status !== 'Waived'), [fines, user]);
  const totalFines = useMemo(() => userFines.reduce((sum, f) => sum + (f.fineAmount - f.amountPaid), 0), [userFines]);
  const userFavorites = useMemo(() => favorites.filter(f => f.matric === user?.matric), [favorites, user]);
  const userReadingLists = useMemo(() => readingLists.filter(l => l.matric === user?.matric), [readingLists, user]);
  const unreadNotifications = useMemo(() => notifications.filter(n => n.matric === user?.matric && !n.isRead), [notifications, user]);
  const historyLoans = useMemo(() => userLoans.filter(l => l.status === 'Returned'), [userLoans]);
  const policy = PATRON_POLICIES[user?.role] || PATRON_POLICIES.student;

  const sections = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'loans', label: 'Active Loans', icon: BookOpen, badge: activeLoans.length },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, badge: overdueLoans.length },
    { id: 'reservations', label: 'Reservations', icon: Clock, badge: userReservations.length },
    { id: 'fines', label: 'Fines', icon: DollarSign, badge: userFines.length },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: userFavorites.length },
    { id: 'reading_lists', label: 'Reading Lists', icon: List, badge: userReadingLists.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications.length },
    { id: 'history', label: 'Borrowing History', icon: History, badge: historyLoans.length },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg">
          <User size={26} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-sm text-slate-400">{user?.dept} • {user?.matric}</p>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
              {user?.role === 'student' ? 'Student Patron' : 'Staff Patron'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
              Max {policy.maxLoans} Books
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-600">
              {policy.loanPeriodDays}-Day Loan Period
            </span>
          </div>
        </div>
        {totalFines > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Outstanding Fines</p>
            <p className="text-xl font-extrabold text-rose-400">₦{totalFines.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {sections.map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon size={13} />
              {s.label}
              {s.badge > 0 && (
                <span className={`px-1.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-700 text-slate-300'
                }`}>{s.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Active Loans" value={activeLoans.length} color="emerald" sub={`${activeLoans.length} of ${policy.maxLoans} quota`} />
            <StatCard icon={AlertTriangle} label="Overdue" value={overdueLoans.length} color={overdueLoans.length > 0 ? 'rose' : 'slate'} sub={overdueLoans.length > 0 ? 'Immediate action needed' : 'All clear'} />
            <StatCard icon={Clock} label="Due Soon" value={dueSoonLoans.length} color={dueSoonLoans.length > 0 ? 'amber' : 'slate'} sub="Within 3 days" />
            <StatCard icon={DollarSign} label="Outstanding Fines" value={`₦${totalFines.toLocaleString()}`} color={totalFines > 0 ? 'rose' : 'slate'} sub={totalFines > 0 ? 'Unpaid / partial' : 'No outstanding fines'} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Clock} label="Reservations" value={userReservations.filter(r => ['Pending','Approved','Ready for Pickup'].includes(r.status)).length} color="indigo" />
            <StatCard icon={Star} label="Favorites" value={userFavorites.length} color="amber" />
            <StatCard icon={List} label="Reading Lists" value={userReadingLists.length} color="teal" />
            <StatCard icon={History} label="Books Borrowed" value={userLoans.length} color="slate" sub="Lifetime total" />
          </div>

          {/* Due soon alert */}
          {dueSoonLoans.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Books Due Soon
              </p>
              {dueSoonLoans.map(l => (
                <div key={l.id} className="flex items-center justify-between text-xs">
                  <span className="text-white font-semibold">{l.bookTitle}</span>
                  <span className="text-amber-400 font-mono">{l.dueDate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Overdue alert */}
          {overdueLoans.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Overdue Items — Fine Accruing
              </p>
              {overdueLoans.map(l => (
                <div key={l.id} className="flex items-center justify-between text-xs">
                  <span className="text-white font-semibold">{l.bookTitle}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-mono">₦{l.fine?.toLocaleString()}</span>
                    <button onClick={() => onPayFine && onPayFine(l.id)} className="px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[10px] border border-rose-500/30 transition">
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ready for pickup */}
          {userReservations.filter(r => r.status === 'Ready for Pickup').length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Bell size={14} /> Reservations Ready for Pickup
              </p>
              {userReservations.filter(r => r.status === 'Ready for Pickup').map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-white font-semibold">{r.title}</span>
                  <span className="text-emerald-400">{r.pickupLocation?.split('•')[0]?.trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE LOANS */}
      {activeSection === 'loans' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''} • {policy.renewalsAllowed} renewals allowed per loan</p>
          {activeLoans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No active loans</p>
            </div>
          ) : activeLoans.map(l => (
            <LoanRow key={l.id} loan={l} books={books} onRenew={onRenewLoan} onPayFine={onPayFine} />
          ))}
        </div>
      )}

      {/* OVERDUE */}
      {activeSection === 'overdue' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Fine rate: ₦{policy.finePerDay}/day overdue</p>
          {overdueLoans.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={36} className="mx-auto text-emerald-700 mb-2" />
              <p className="text-slate-400">No overdue items — well done!</p>
            </div>
          ) : overdueLoans.map(l => (
            <LoanRow key={l.id} loan={l} books={books} onRenew={onRenewLoan} onPayFine={onPayFine} />
          ))}
        </div>
      )}

      {/* RESERVATIONS */}
      {activeSection === 'reservations' && (
        <div className="space-y-3">
          {userReservations.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No reservations</p>
            </div>
          ) : userReservations.map(r => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white text-sm">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.author}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  r.status === 'Ready for Pickup' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  r.status === 'Pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-slate-700 text-slate-400 border-slate-600'
                }`}>{r.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span>Queue #{r.queuePosition}</span>
                <span>Reserved: {r.reservedDate}</span>
                <span>Expires: {r.expiryDate}</span>
              </div>
              {r.pickupLocation && <p className="text-xs text-indigo-400 flex items-center gap-1"><MapPin size={11} /> {r.pickupLocation}</p>}
            </div>
          ))}
        </div>
      )}

      {/* FINES */}
      {activeSection === 'fines' && (
        <div className="space-y-4">
          {totalFines > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-300">Total Outstanding</p>
                <p className="text-2xl font-extrabold text-rose-400">₦{totalFines.toLocaleString()}</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition">
                Pay All Fines
              </button>
            </div>
          )}
          {userFines.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={36} className="mx-auto text-emerald-700 mb-2" />
              <p className="text-slate-400">No outstanding fines</p>
            </div>
          ) : userFines.map(f => (
            <div key={f.id} className="p-4 rounded-xl bg-slate-900 border border-rose-500/20 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white text-sm">{f.bookTitle}</p>
                  <p className="text-xs text-slate-400">Loan: {f.loanId} • Due: {f.dueDate}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  f.status === 'Unpaid' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  f.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>{f.status}</span>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-slate-400">{f.daysOverdue} days overdue</span>
                <span className="text-rose-400 font-semibold">₦{f.fineAmount.toLocaleString()} total</span>
                {f.amountPaid > 0 && <span className="text-emerald-400">₦{f.amountPaid.toLocaleString()} paid</span>}
                <span className="text-white font-bold">₦{(f.fineAmount - f.amountPaid).toLocaleString()} due</span>
              </div>
              <button
                onClick={() => onPayFine && onPayFine(f.loanId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
              >
                Pay Fine
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAVORITES */}
      {activeSection === 'favorites' && (
        <div className="space-y-3">
          {userFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Star size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No favorites yet</p>
              <p className="text-slate-500 text-sm mt-1">Add books to your favorites from the catalog.</p>
            </div>
          ) : userFavorites.map(fav => {
            const book = books.find(b => b.id === fav.bookId);
            if (!book) return null;
            return (
              <div key={fav.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white text-sm">{book.title}</p>
                  <p className="text-xs text-slate-400">{book.author} • {book.year}</p>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">{book.callNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    book.copiesAvailable > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {book.copiesAvailable > 0 ? `${book.copiesAvailable} avail.` : 'Out'}
                  </span>
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING LISTS */}
      {activeSection === 'reading_lists' && (
        <div className="space-y-4">
          {userReadingLists.length === 0 ? (
            <div className="text-center py-12">
              <List size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No reading lists</p>
            </div>
          ) : userReadingLists.map(list => (
            <div key={list.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{list.name}</p>
                  <p className="text-xs text-slate-400">{list.description}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {list.items.length} items • Created {list.createdDate} • {list.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                {list.items.slice(0, 3).map(item => {
                  const book = books.find(b => b.id === item.bookId);
                  return book ? (
                    <div key={item.bookId} className="flex items-center gap-2 text-xs">
                      <BookOpen size={11} className="text-indigo-400 shrink-0" />
                      <span className="text-slate-300 truncate">{book.title}</span>
                    </div>
                  ) : null;
                })}
                {list.items.length > 3 && (
                  <p className="text-xs text-slate-500">+{list.items.length - 3} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeSection === 'notifications' && (
        <div className="space-y-3">
          {notifications.filter(n => n.matric === user?.matric).length === 0 ? (
            <div className="text-center py-12">
              <Bell size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No notifications</p>
            </div>
          ) : notifications.filter(n => n.matric === user?.matric).map(notif => (
            <div key={notif.id} className={`p-4 rounded-xl border transition ${
              !notif.isRead ? 'bg-slate-900 border-indigo-500/30' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                    <p className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>{notif.title}</p>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      notif.priority === 'high' ? 'bg-rose-500/20 text-rose-300' :
                      notif.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-700 text-slate-400'
                    }`}>{notif.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400">{notif.message}</p>
                  <p className="text-[10px] text-slate-600">{notif.timestamp}</p>
                </div>
                {notif.actionUrl && (
                  <a href={notif.actionUrl} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition">
                    <ChevronRight size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BORROWING HISTORY */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{userLoans.length} total borrowing records</p>
          {userLoans.length === 0 ? (
            <div className="text-center py-12">
              <History size={36} className="mx-auto text-slate-700 mb-2" />
              <p className="text-slate-400">No borrowing history yet</p>
            </div>
          ) : userLoans.map(l => (
            <div key={l.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold text-white text-sm">{l.bookTitle}</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span className="font-mono text-indigo-400">{l.id}</span>
                  <span>Borrowed: {l.borrowDate || l.issueDate}</span>
                  <span>Due: {l.dueDate}</span>
                  {l.returnDate && <span className="text-emerald-400">Returned: {l.returnDate}</span>}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                l.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                l.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                'bg-slate-700 text-slate-400 border-slate-600'
              }`}>{l.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
