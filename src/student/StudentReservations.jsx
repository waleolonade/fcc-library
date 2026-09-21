import React from 'react';
import { Clock, BookOpen, AlertCircle, CheckCircle, XCircle, ArrowRight, Bookmark, ShieldCheck, MapPin } from 'lucide-react';
import TraceBadge from '../common/TraceBadge';

export default function StudentReservations({
  reservations = [],
  books = [],
  onCancelReservation,
  onSelectBook,
  onOpenReader,
  user
}) {
  const userReservations = reservations.filter(
    r => (r.matric || '').toLowerCase() === (user?.matric || '').toLowerCase()
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Bookmark size={15} /> Circulation & Hold Queue
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Reserved Books & Holds</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Track books currently set aside for you at the Circulation Desk or queued in line for return by other borrowers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TraceBadge uri="#/reservations" label="#/reservations" />
          <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-900/60 border border-indigo-700/60 text-xs font-mono font-bold text-indigo-300">
            {userReservations.length} Active {userReservations.length === 1 ? 'Hold' : 'Holds'}
          </div>
        </div>
      </div>

      {/* Reservation List */}
      {userReservations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-indigo-400">
            <Clock size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Active Book Reservations</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When a book is checked out or in high demand, you can place a hold from the Catalog search to reserve the next available copy.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userReservations.map(res => {
            const matchedBook = books.find(b => String(b.id) === String(res.bookId)) || {
              title: res.bookTitle || res.title || 'Reserved Academic Title',
              author: res.author || 'Institutional Author',
              coverImage: res.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80',
              callNumber: res.callNumber || 'GEN-LIB'
            };

            const isReady = res.status === 'READY_FOR_PICKUP' || res.status === 'Ready' || res.ready;

            return (
              <div
                key={res.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-4 shadow-lg"
              >
                <div className="flex gap-4 items-start">
                  <img
                    src={matchedBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'}
                    alt={matchedBook.title}
                    className="w-16 h-22 object-cover rounded-xl border border-slate-700 shrink-0 shadow"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        isReady
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {isReady ? '● Ready for Pickup' : '● Queued in Hold'}
                      </span>
                      <TraceBadge uri={`#/book/${matchedBook.id || res.bookId}`} />
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-2">{matchedBook.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{matchedBook.author}</p>
                    <div className="text-[11px] font-mono text-indigo-300 flex items-center gap-1.5 pt-1">
                      <MapPin size={12} /> Shelf: {matchedBook.callNumber}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Reserved Date:</span>
                    <span className="font-mono text-white">{res.date || res.createdAt || 'Recent'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Pickup Location:</span>
                    <span className="font-semibold text-emerald-400">FCC Library Main Circulation Desk</span>
                  </div>
                  {res.expiryDate && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Hold Expires:</span>
                      <span className="font-mono text-rose-400 font-bold">{res.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {onSelectBook && matchedBook.id && (
                    <button
                      onClick={() => onSelectBook(matchedBook)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <BookOpen size={14} /> View Details
                    </button>
                  )}
                  {onOpenReader && matchedBook.isDigital && (
                    <button
                      onClick={() => onOpenReader(matchedBook)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <BookOpen size={14} /> Read Now
                    </button>
                  )}
                  {onCancelReservation && (
                    <button
                      onClick={() => {
                        if (confirm(`Cancel reservation for "${matchedBook.title}"?`)) {
                          onCancelReservation(res.id);
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} /> Cancel Hold
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
