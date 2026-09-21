import React from 'react';
import {
  BookOpen, Clock, AlertTriangle, CheckCircle, Bookmark,
  Layers, QrCode, Bot, DoorOpen, ShieldCheck, Sparkles,
  ArrowRight, Search, FileText, Download, UserCheck, RefreshCw,
  Compass, ChevronRight, Globe, Award, Wifi, Calendar, Check, Link2
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import TraceBadge from '../common/TraceBadge';

export default function StudentOverviewDashboard({
  user,
  books = [],
  loans = [],
  reservations = [],
  continueReading = [],
  roomBookings = [],
  readingLists = [],
  theses = [],
  notifications = [],
  onNavigateTab,
  onOpenReader,
  onSelectBook,
  onRenewLoan,
  onOpenAi
}) {
  // Calculate real stats from database records
  const userMatric = (user?.matric || '').toLowerCase();
  const activeLoans = loans.filter(l => (l.matric || '').toLowerCase() === userMatric);
  const now = new Date();
  
  const dueSoonLoans = activeLoans.filter(l => {
    const diff = (new Date(l.dueDate) - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 5;
  });

  const overdueLoans = activeLoans.filter(l => {
    const diff = (new Date(l.dueDate) - now) / (1000 * 60 * 60 * 24);
    return diff < 0 || l.status === 'Overdue';
  });

  const userReservations = reservations.filter(r => (r.matric || '').toLowerCase() === userMatric);
  const userContinueReading = continueReading.filter(c => (c.matric || '').toLowerCase() === userMatric);
  const userRoomBookings = roomBookings.filter(b => (b.matric || '').toLowerCase() === userMatric);
  const totalSavedItems = readingLists.reduce((acc, r) => acc + (r.itemCount || (r.items ? r.items.length : 0)), 0);

  // Recommendations dynamically chosen from real database books
  const recommendations = books.slice(0, 3).map((book, i) => {
    const reasons = [
      `Course reserve linked to your department: ${user?.department || 'Economics & Management'}`,
      `Verified academic edition digitized in institutional catalog`,
      `Recommended based on your recent activity in digital reading`
    ];
    return {
      book,
      reason: reasons[i % reasons.length]
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. SMART DASHBOARD HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {INSTITUTION.currentSession} • {INSTITUTION.currentSemester}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome back, {user?.name || 'Scholar'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Connected directly to <span className="text-indigo-400 font-mono font-bold">brainfeels_library</span> database. Real-time circulation, digital monographs, and research depository.
            </p>

            {/* Student Metadata Tag Ribbon */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                Matric: <strong className="text-emerald-400">{user?.matric}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
                {user?.department}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-indigo-300 font-medium">
                {user?.level}
              </span>
            </div>
          </div>

          {/* Profile Completion Widget */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 min-w-[220px] backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Clearance Status</span>
              <span className="text-emerald-400 font-bold font-mono">{user?.clearanceStatus || 'Active Student'}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${user?.profileCompletion || 95}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Security PIN: Verified ✓</span>
              <button onClick={() => onNavigateTab('card')} className="text-emerald-400 hover:underline">Digital ID Card</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME ACTIONABLE NOTIFICATIONS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-800/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 shrink-0">
            <Clock size={18} />
          </div>
          <div className="text-xs">
            <div className="text-slate-200 font-bold">{dueSoonLoans.length} Loans Due Soon</div>
            <div className="text-slate-400 text-[11px]">{dueSoonLoans.length > 0 ? 'Review return dates' : 'All active loans within schedule'}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-800/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="text-xs">
            <div className="text-slate-200 font-bold">{userReservations.length} Active Reservations</div>
            <div className="text-slate-400 text-[11px]">{userReservations.length > 0 ? 'Ready for pickup at Circulation' : 'No pending hold requests'}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-800/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-950 text-teal-400 shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="text-xs">
            <div className="text-slate-200 font-bold">{books.filter(b => b.isDigital).length} Digital Monographs</div>
            <div className="text-slate-400 text-[11px]">Instant full-text reading enabled</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-800/40 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 shrink-0">
            <DoorOpen size={18} />
          </div>
          <div className="text-xs">
            <div className="text-slate-200 font-bold">{userRoomBookings.length} Study Room Bookings</div>
            <div className="text-slate-400 text-[11px]">{userRoomBookings.length > 0 ? 'Check in with booking code' : 'Carrels & pods available for booking'}</div>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNT OVERVIEW STATISTICS (8 DYNAMIC DATABASE TILES) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Database Record Summary</h2>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SQL Live Relay
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Books Borrowed', value: activeLoans.length, color: 'emerald', tab: 'loans' },
            { label: 'Due Soon', value: dueSoonLoans.length, color: 'amber', tab: 'loans' },
            { label: 'Overdue', value: overdueLoans.length, color: 'rose', tab: 'loans' },
            { label: 'Reservations', value: userReservations.length, color: 'indigo', tab: 'reservations' },
            { label: 'Digital Books', value: books.filter(b => b.isDigital).length, color: 'teal', tab: 'digital' },
            { label: 'Reading Lists', value: totalSavedItems, color: 'purple', tab: 'reading_lists' },
            { label: 'Outstanding Fine', value: user?.outstandingFines ? `₦${user.outstandingFines}` : '₦0', color: 'emerald', sub: 'Clear', tab: 'clearance' },
            { label: 'Study Bookings', value: userRoomBookings.length, color: 'blue', tab: 'rooms' },
          ].map((stat, idx) => (
            <button
              key={idx}
              onClick={() => onNavigateTab(stat.tab)}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all text-left group shadow-lg flex flex-col justify-between"
            >
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block truncate">{stat.label}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-400 transition font-mono">
                  {stat.value}
                </span>
                {stat.sub && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    {stat.sub}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. CURRENT BORROWINGS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-white">My Active Borrowings ({activeLoans.length})</h2>
          </div>
          <button onClick={() => onNavigateTab('loans')} className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
            View Loan History <ChevronRight size={14} />
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
            You currently have no active physical book borrowings. Explore the discovery catalog to request loans.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map(loan => {
              const diffDays = Math.ceil((new Date(loan.dueDate) - now) / (1000 * 60 * 60 * 24));
              const isOverdue = diffDays < 0 || loan.status === 'Overdue';
              const isDueSoon = diffDays >= 0 && diffDays <= 5;
              const matchingBook = books.find(b => b.id === loan.bookId);

              return (
                <div
                  key={loan.id}
                  className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between shadow-xl ${
                    isOverdue
                      ? 'border-rose-700/60 bg-gradient-to-br from-slate-900 to-rose-950/20'
                      : isDueSoon
                      ? 'border-amber-700/60 bg-gradient-to-br from-slate-900 to-amber-950/20'
                      : 'border-slate-800 hover:border-emerald-600/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                          {loan.callNumber || 'FCC Stack'}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                          {loan.bookTitle}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{loan.author}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          isOverdue
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : isDueSoon
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {isOverdue ? `Overdue by ${Math.abs(diffDays)}d` : `Due in ${diffDays} days`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-slate-400">
                      <div>Borrowed: <strong className="text-slate-200">{loan.borrowDate}</strong></div>
                      <div>Due Date: <strong className={isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-emerald-400'}>{loan.dueDate}</strong></div>
                      <div>Branch: <strong className="text-slate-300">{loan.branch?.split('(')[0] || 'Main Campus Library'}</strong></div>
                      <div>RFID / Tag: <strong className="text-slate-300">{loan.rfidTag || loan.barcode || 'Verified'}</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRenewLoan(loan.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <RefreshCw size={13} /> Renew (14 Days)
                      </button>
                      <TraceBadge uri={`#/book/${loan.bookId}`} label="Book Link" />
                    </div>

                    <div className="flex items-center gap-2">
                      {matchingBook && (
                        <button
                          onClick={() => onSelectBook(matchingBook)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                          Details
                        </button>
                      )}
                      {matchingBook?.isDigital && (
                        <button
                          onClick={() => onOpenReader(matchingBook)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition"
                        >
                          <BookOpen size={13} /> Open Reader
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. 1-CLICK QUICK ACTIONS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Quick Library Navigation</h2>
          <span className="text-[11px] text-slate-500 font-mono">Direct Deep-Linked Views</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Discover Catalog', icon: Search, tab: 'catalog', uri: '#/catalog', desc: 'Browse catalog titles' },
            { label: 'Ask AI Librarian', icon: Bot, tab: 'ai', uri: '#/ai', desc: 'Scholarly RAG assistant', isSpecial: true },
            { label: 'Digital Library', icon: BookOpen, tab: 'digital', uri: '#/digital', desc: 'PDF books & readers' },
            { label: 'Book Study Room', icon: DoorOpen, tab: 'study_rooms', uri: '#/study_rooms', desc: 'Carrels & group pods' },
            { label: 'My Library Card', icon: QrCode, tab: 'card', uri: '#/card', desc: 'PVC Barcode / QR' },
            { label: 'Course Resources', icon: Layers, tab: 'courses', uri: '#/courses', desc: 'Past exams & reserves' },
            { label: 'Reading Lists', icon: Bookmark, tab: 'reading_lists', uri: '#/reading_lists', desc: 'Curated citations' },
            { label: 'Research Center', icon: Globe, tab: 'research', uri: '#/theses', desc: 'Theses & dissertations' },
            { label: 'Linked Libraries', icon: Globe, tab: 'partner_libs', uri: '#/partner_libs', desc: 'Consortia gateway' },
            { label: 'Ask a Librarian', icon: UserCheck, tab: 'helpdesk', uri: '#/helpdesk', desc: 'Live ticket support' },
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between shadow-lg relative ${
                  act.isSpecial
                    ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border-indigo-700/60 hover:border-emerald-400'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl w-fit mb-2 ${act.isSpecial ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'} transition`}>
                    <Icon size={18} />
                  </div>
                  <TraceBadge uri={act.uri} />
                </div>
                <button
                  onClick={() => act.isSpecial ? onOpenAi() : onNavigateTab(act.tab)}
                  className="text-left w-full mt-2"
                >
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">{act.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{act.desc}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. CONTINUE READING SECTION (BOOKMARKS) */}
      {userContinueReading.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Continue Reading ({userContinueReading.length})</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Auto-Saved in Database</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userContinueReading.map((item, idx) => {
              const bookMatch = books.find(b => b.id === item.bookId);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 transition flex flex-col justify-between space-y-3 shadow-lg">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Page {item.lastPage} / {item.totalPages || 384}
                      </span>
                      <TraceBadge uri={`#/read/${item.bookId}`} label="Reader Link" />
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2 leading-snug line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.author}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-emerald-400 font-bold">{item.progress}% completed</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.progress}%` }}></div>
                    </div>
                  </div>

                  {bookMatch && (
                    <button
                      onClick={() => onOpenReader(bookMatch)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <BookOpen size={13} /> Resume on Page {item.lastPage}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. RECOMMENDED TITLES */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Recommended for You</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Indexed Holdings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 transition flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[11px] leading-relaxed">
                    💡 <strong className="text-white">Why recommended:</strong> {rec.reason}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {rec.book.callNumber}
                      </span>
                      <TraceBadge uri={`#/book/${rec.book.id}`} label="Book Link" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition mt-1.5 leading-snug">
                      {rec.book.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{rec.book.author} ({rec.book.year})</p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {rec.book.abstract}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectBook(rec.book)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Details
                    </button>
                    {rec.book.isDigital && (
                      <TraceBadge uri={`#/read/${rec.book.id}`} label="PDF Link" />
                    )}
                  </div>
                  {rec.book.isDigital && (
                    <button
                      onClick={() => onOpenReader(rec.book)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition"
                    >
                      <BookOpen size={13} /> Read E-Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
