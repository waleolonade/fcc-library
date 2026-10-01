import React, { useState, useMemo } from 'react';
import {
  BookOpen, Clock, CheckCircle, XCircle, AlertTriangle,
  Calendar, MapPin, User, Hash, Bell, RefreshCw, Plus,
  Search, Filter, ChevronDown, X, ArrowRight, Info
} from 'lucide-react';
import { PATRON_POLICIES } from '../data/institutionalSeedData';

// =========================================================================
// RESERVATION SYSTEM
// Workflow: check eligibility → check availability → create → confirmation
// Statuses: Pending, Approved, Ready for Pickup, Collected, Cancelled, Expired
// =========================================================================

const STATUS_CONFIG = {
  Pending: { color: 'amber', icon: Clock, label: 'Pending Review' },
  Approved: { color: 'indigo', icon: CheckCircle, label: 'Approved' },
  'Ready for Pickup': { color: 'emerald', icon: Bell, label: 'Ready for Pickup' },
  Collected: { color: 'slate', icon: BookOpen, label: 'Collected' },
  Cancelled: { color: 'rose', icon: XCircle, label: 'Cancelled' },
  Expired: { color: 'slate', icon: AlertTriangle, label: 'Expired' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = cfg.icon;
  const colorMap = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    slate: 'bg-slate-700/60 text-slate-400 border-slate-600/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorMap[cfg.color]}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function ReserveBookModal({ book, user, existingReservations, onConfirm, onClose }) {
  const [step, setStep] = useState('check'); // 'check' | 'confirm' | 'done'
  const [pickupLocation, setPickupLocation] = useState('Main Campus Library • Circulation Desk Bay 2');
  const [eligibilityResult, setEligibilityResult] = useState(null);

  const policy = PATRON_POLICIES[user?.role] || PATRON_POLICIES.student;
  const userReservations = existingReservations.filter(r => r.matric === user?.matric && r.status !== 'Cancelled' && r.status !== 'Expired' && r.status !== 'Collected');
  const alreadyReserved = existingReservations.some(r => r.bookId === book?.id && r.matric === user?.matric && r.status !== 'Cancelled' && r.status !== 'Expired' && r.status !== 'Collected');

  const checkEligibility = () => {
    const issues = [];
    if (alreadyReserved) issues.push('You already have an active reservation for this title.');
    if (userReservations.length >= policy.reserveMax) issues.push(`You have reached your reservation limit (${policy.reserveMax}).`);
    if (book?.copiesAvailable > 0) issues.push('Copies are currently available — borrowing directly is recommended.');
    setEligibilityResult({
      eligible: issues.length === 0,
      issues,
      queuePosition: existingReservations.filter(r => r.bookId === book?.id && r.status !== 'Cancelled' && r.status !== 'Expired').length + 1,
      expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
    setStep('confirm');
  };

  const handleConfirm = () => {
    const reservation = {
      id: `RES-${Date.now()}`,
      matric: user.matric,
      patronName: user.name,
      bookId: book.id,
      title: book.title,
      author: book.author,
      callNumber: book.callNumber,
      reservedDate: new Date().toISOString().split('T')[0],
      expiryDate: eligibilityResult.expiryDate,
      pickupLocation,
      queuePosition: eligibilityResult.queuePosition,
      status: 'Pending',
    };
    onConfirm(reservation);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-white">Reserve Resource</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Book info */}
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
          <p className="text-sm font-semibold text-white">{book?.title}</p>
          <p className="text-xs text-slate-400">{book?.author}</p>
          <p className="text-xs font-mono text-emerald-400">{book?.callNumber}</p>
        </div>

        {/* Step: Check */}
        {step === 'check' && (
          <div className="space-y-4">
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Patron</span>
                <span className="font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Matric</span>
                <span className="font-mono">{user?.matric}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Copies Available</span>
                <span className={book?.copiesAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {book?.copiesAvailable}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Queue Length</span>
                <span>{existingReservations.filter(r => r.bookId === book?.id && !['Cancelled','Expired','Collected'].includes(r.status)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reservation Limit</span>
                <span>{userReservations.length} / {policy.reserveMax}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Pickup Location</label>
              <select
                value={pickupLocation}
                onChange={e => setPickupLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option>Main Campus Library • Circulation Desk Bay 2</option>
                <option>Faculty of Science &amp; Computing Library</option>
                <option>E-Library &amp; Virtual Innovation Commons</option>
                <option>Law &amp; Administrative Library</option>
                <option>Faculty of Engineering Library</option>
              </select>
            </div>
            <button
              onClick={checkEligibility}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Check Eligibility &amp; Continue
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && eligibilityResult && (
          <div className="space-y-4">
            {!eligibilityResult.eligible ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <XCircle size={14} /> Eligibility Issues
                </p>
                {eligibilityResult.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-rose-400/80">• {issue}</p>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Eligible for Reservation
                </p>
              </div>
            )}
            <div className="space-y-2 text-xs">
              {[
                { label: 'Queue Position', value: `#${eligibilityResult.queuePosition}` },
                { label: 'Reservation Date', value: new Date().toISOString().split('T')[0] },
                { label: 'Expiry Date', value: eligibilityResult.expiryDate },
                { label: 'Pickup Location', value: pickupLocation },
                { label: 'Initial Status', value: 'Pending' },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-2">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="text-slate-200 text-right font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('check')} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition">
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!eligibilityResult.eligible}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Reservation Confirmed!</p>
              <p className="text-sm text-slate-400">
                You have been added to the reservation queue. The librarian will notify you when your copy is ready for pickup.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationSystem({ user, books = [], reservations = [], onCreateReservation, onCancelReservation }) {
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const userReservations = useMemo(() =>
    reservations.filter(r => r.matric === user?.matric),
    [reservations, user]
  );

  const filteredReservations = useMemo(() => {
    return userReservations.filter(r => {
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || r.title?.toLowerCase().includes(q) || r.author?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [userReservations, filterStatus, searchQuery]);

  const handleCancelReservation = (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    if (onCancelReservation) onCancelReservation(reservationId);
  };

  const handleReserveBook = (book) => {
    setSelectedBook(book);
    setShowReserveModal(true);
  };

  const handleConfirmReservation = (reservation) => {
    if (onCreateReservation) onCreateReservation(reservation);
  };

  const statuses = ['All', 'Pending', 'Approved', 'Ready for Pickup', 'Collected', 'Cancelled', 'Expired'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">My Reservations</h2>
          <p className="text-slate-400 text-sm mt-0.5">Queue positions, statuses and pickup notifications</p>
        </div>
        <button
          onClick={() => { setSelectedBook(null); setShowReserveModal(true); }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition"
        >
          <Plus size={16} />
          Reserve a Resource
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: userReservations.length, color: 'indigo' },
          { label: 'Active', value: userReservations.filter(r => ['Pending','Approved','Ready for Pickup'].includes(r.status)).length, color: 'emerald' },
          { label: 'Ready', value: userReservations.filter(r => r.status === 'Ready for Pickup').length, color: 'amber' },
          { label: 'Collected', value: userReservations.filter(r => r.status === 'Collected').length, color: 'slate' },
        ].map(stat => {
          const colorMap = { indigo: 'text-indigo-400', emerald: 'text-emerald-400', amber: 'text-amber-400', slate: 'text-slate-400' };
          return (
            <div key={stat.label} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className={`text-2xl font-extrabold ${colorMap[stat.color]}`}>{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reservations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen size={40} className="mx-auto text-slate-700" />
          <p className="text-slate-400 font-semibold">No reservations found</p>
          <p className="text-slate-500 text-sm">Reserve resources from the catalog when copies are unavailable.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map(res => (
            <div key={res.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-indigo-400">{res.id}</span>
                    <StatusBadge status={res.status} />
                    {res.status === 'Ready for Pickup' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{res.title}</p>
                    <p className="text-xs text-slate-400">{res.author}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash size={11} /> Queue: <strong className="text-white">#{res.queuePosition}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> Reserved: <strong className="text-white">{res.reservedDate}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Expires: <strong className="text-white">{res.expiryDate}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {res.pickupLocation}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {['Pending', 'Approved'].includes(res.status) && (
                    <button
                      onClick={() => handleCancelReservation(res.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition flex items-center gap-1"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  {['Pending', 'Approved', 'Ready for Pickup', 'Collected'].map((s, i) => {
                    const statuses = ['Pending', 'Approved', 'Ready for Pickup', 'Collected'];
                    const currentIdx = statuses.indexOf(res.status);
                    const isActive = i <= currentIdx && !['Cancelled','Expired'].includes(res.status);
                    const isCurrent = s === res.status;
                    return (
                      <React.Fragment key={s}>
                        <div className={`flex flex-col items-center`}>
                          <div className={`w-2.5 h-2.5 rounded-full transition ${
                            isCurrent ? 'bg-indigo-400 ring-2 ring-indigo-400/40' :
                            isActive ? 'bg-emerald-500' : 'bg-slate-700'
                          }`} />
                          <span className={`text-[9px] mt-0.5 font-mono whitespace-nowrap ${
                            isCurrent ? 'text-indigo-400' : isActive ? 'text-emerald-400' : 'text-slate-600'
                          }`}>{s.replace(' for ', '\nfor ')}</span>
                        </div>
                        {i < 3 && (
                          <div className={`h-0.5 flex-1 mx-0.5 rounded ${
                            i < currentIdx && !['Cancelled','Expired'].includes(res.status) ? 'bg-emerald-500' : 'bg-slate-800'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reserve Modal — with book search if no book pre-selected */}
      {showReserveModal && (
        selectedBook ? (
          <ReserveBookModal
            book={selectedBook}
            user={user}
            existingReservations={reservations}
            onConfirm={handleConfirmReservation}
            onClose={() => { setShowReserveModal(false); setSelectedBook(null); }}
          />
        ) : (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Select a Resource to Reserve</h2>
                <button onClick={() => setShowReserveModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {books
                  .filter(b => !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(book => (
                    <button
                      key={book.id}
                      onClick={() => { setSelectedBook(book); }}
                      className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/40 transition"
                    >
                      <p className="text-sm font-semibold text-white truncate">{book.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-slate-400">{book.author}</p>
                        <span className={`text-[10px] font-semibold ${book.copiesAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {book.copiesAvailable > 0 ? `${book.copiesAvailable} available` : 'All checked out'}
                        </span>
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
