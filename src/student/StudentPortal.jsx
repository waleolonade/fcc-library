import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Search, LogOut, QrCode, FileText, Bot, DoorOpen,
  Sparkles, Layers, Bookmark, MapPin, Filter, AlertTriangle,
  Award, ShieldCheck, Globe, MessageSquare, Printer, Fingerprint, Building2, Link2
} from 'lucide-react';
import { INSTITUTION, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import DigitalBookReader from './DigitalBookReader';
import ThesesArchive from './ThesesArchive';
import StudentCardAndLoans from './StudentCardAndLoans';
import StudyRoomBooking from './StudyRoomBooking';
import AiLibrarianModal from './AiLibrarianModal';
import BookDetailsModal from '../common/BookDetailsModal';
import GraduationClearance from './GraduationClearance';
import PlagiarismChecker from './PlagiarismChecker';
import CourseReserves from './CourseReserves';
import InterLibraryLoan from './InterLibraryLoan';
import HelpdeskTickets from './HelpdeskTickets';
import IdCardPrintModal from './IdCardPrintModal';
import BiometricScannerModal from '../common/BiometricScannerModal';
import PartnerLibrariesGateway from '../common/PartnerLibrariesGateway';
import TraceBadge from '../common/TraceBadge';
import { navigateTo, parseCurrentRoute } from '../utils/router';

export default function StudentPortal({
  user,
  onLogout,
  books,
  partnerLibraries = INITIAL_PARTNER_LIBRARIES,
  loans,
  onRenewLoan,
  onPayFine
}) {
  const [activeTab, setActiveTab] = useState('catalog');
  // Tabs: 'catalog' | 'partner_libs' | 'reserves' | 'theses' | 'plagiarism' | 'loans' | 'clearance' | 'rooms' | 'ill' | 'helpdesk'

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeBookForReader, setActiveBookForReader] = useState(null);
  const [activeBookDetails, setActiveBookDetails] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showIdPrintModal, setShowIdPrintModal] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);

  // Sync activeTab with URL Hash
  useEffect(() => {
    const syncFromHash = () => {
      const { path } = parseCurrentRoute();
      if (path.startsWith('/scholar/')) {
        const sub = path.replace('/scholar/', '').split('/')[0];
        const valid = ['catalog', 'partner_libs', 'reserves', 'theses', 'plagiarism', 'loans', 'clearance', 'rooms', 'ill', 'helpdesk'];
        if (valid.includes(sub)) {
          setActiveTab(sub);
        }
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    setActiveBookForReader(null);
    navigateTo(`/scholar/${tabId}`);
  };

  const subjects = ['All', 'Co-operative Economics', 'Computer Science', 'Banking & Finance', 'Agricultural Extension'];

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.callNumber.toLowerCase().includes(q) ||
        b.abstract.toLowerCase().includes(q);

      const matchSubject = selectedSubject === 'All' || b.subject === selectedSubject;
      return matchQuery && matchSubject;
    });
  }, [books, searchQuery, selectedSubject]);

  const userLoans = loans.filter(l => l.matric === user.matric);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Student Top Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-700/40 font-serif">
              FCC
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">{INSTITUTION.shortName}</div>
              <div className="text-[11px] text-emerald-400 font-medium">Digital Scholar Environment</div>
            </div>
          </div>

          <nav className="hidden 2xl:flex items-center gap-1">
            {[
              { id: 'catalog', label: 'Discovery Catalog', icon: BookOpen },
              { id: 'partner_libs', label: 'Linked Libraries', icon: Building2, badge: partnerLibraries.length },
              { id: 'reserves', label: 'Course Reserves', icon: Layers },
              { id: 'theses', label: 'Theses Archive', icon: FileText },
              { id: 'plagiarism', label: 'Plagiarism Checker', icon: ShieldCheck },
              { id: 'loans', label: 'My Loans & Card', icon: QrCode, badge: userLoans.length },
              { id: 'clearance', label: 'Graduation Exit', icon: Award },
              { id: 'rooms', label: 'Study Rooms', icon: DoorOpen },
              { id: 'ill', label: 'Inter-Library Loan', icon: Globe },
              { id: 'helpdesk', label: 'Ask a Librarian', icon: MessageSquare },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === tab.id && !activeBookForReader
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-[10px] text-white font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Smart Card Studio, Turnstile Biometrics, AI Trigger, User Badge, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowBiometrics(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
            title="Simulate Biometric Turnstile Gate Scan"
          >
            <Fingerprint size={16} />
          </button>

          <button
            onClick={() => setShowIdPrintModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Open PVC Smart Card Print Studio"
          >
            <Printer size={16} />
          </button>

          <button
            onClick={() => setIsAiOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
          >
            <Bot size={15} />
            <span className="hidden sm:inline">AI Librarian</span>
          </button>

          <div className="text-right hidden md:block pl-2 border-l border-slate-800">
            <div className="text-xs font-bold text-slate-200">{user.name}</div>
            <div className="text-[10px] text-emerald-400 font-mono">{user.matric}</div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sub-Header Navigation for Tablet & Mobile Screens */}
      <div className="2xl:hidden flex items-center gap-1 p-2 bg-slate-900/70 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'catalog', label: 'Catalog', icon: BookOpen },
          { id: 'partner_libs', label: 'Linked Libraries', icon: Building2 },
          { id: 'reserves', label: 'Reserves', icon: Layers },
          { id: 'theses', label: 'Theses', icon: FileText },
          { id: 'plagiarism', label: 'Integrity Scan', icon: ShieldCheck },
          { id: 'loans', label: 'Loans & Card', icon: QrCode },
          { id: 'clearance', label: 'Clearance', icon: Award },
          { id: 'rooms', label: 'Rooms', icon: DoorOpen },
          { id: 'ill', label: 'ILL Loans', icon: Globe },
          { id: 'helpdesk', label: 'Helpdesk', icon: MessageSquare },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id && !activeBookForReader
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Dynamic View Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {activeBookForReader ? (
          <DigitalBookReader
            book={activeBookForReader}
            onClose={() => setActiveBookForReader(null)}
          />
        ) : activeTab === 'catalog' ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Hero Search Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Unified Knowledge Discovery</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Search across 125,000+ local physical holdings, OpenAccess journals, and internal dissertations.
                </p>
              </div>

              <div className="relative">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Title, Author, Keyword, ISBN, or Call Number (e.g. Adebayo, HD2963, Raft)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                />
              </div>

              {/* Subject Badges Filter */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-semibold mr-1">Facets:</span>
                {subjects.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      selectedSubject === s
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-700/50 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">
                          {book.callNumber}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition mt-1.5">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-400">{book.author} • {book.publisher} ({book.year})</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                          book.copiesAvailable > 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {book.copiesAvailable > 0 ? `${book.copiesAvailable} Available` : 'Reserved Out'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {book.abstract}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <TraceBadge uri={`#/book/${book.id}`} />
                      <span>📖 {book.pdfPages}p</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveBookDetails(book)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-xs"
                      >
                        Details
                      </button>
                      {book.isDigital && (
                        <button
                          onClick={() => setActiveBookForReader(book)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-md shadow-emerald-950 transition text-xs"
                        >
                          <BookOpen size={13} /> Read E-Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'partner_libs' ? (
          <PartnerLibrariesGateway partnerLibraries={partnerLibraries} user={user} />
        ) : activeTab === 'reserves' ? (
          <CourseReserves books={books} onSelectBook={(b) => setActiveBookDetails(b)} />
        ) : activeTab === 'theses' ? (
          <ThesesArchive />
        ) : activeTab === 'plagiarism' ? (
          <PlagiarismChecker />
        ) : activeTab === 'loans' ? (
          <StudentCardAndLoans
            user={user}
            loans={userLoans}
            books={books}
            onRenewLoan={onRenewLoan}
            onPayFine={onPayFine}
          />
        ) : activeTab === 'clearance' ? (
          <GraduationClearance user={user} loans={loans} />
        ) : activeTab === 'rooms' ? (
          <StudyRoomBooking user={user} />
        ) : activeTab === 'ill' ? (
          <InterLibraryLoan user={user} />
        ) : (
          <HelpdeskTickets user={user} />
        )}
      </main>

      {/* Book Metadata & Citation Modal */}
      {activeBookDetails && (
        <BookDetailsModal
          book={activeBookDetails}
          onClose={() => setActiveBookDetails(null)}
          onOpenReader={(b) => { setActiveBookDetails(null); setActiveBookForReader(b); }}
          onReserve={(b) => alert(`Reserved copy of "${b.title}". You will be notified when returned.`)}
        />
      )}

      {/* AI Smart Librarian Chat Modal */}
      {isAiOpen && (
        <AiLibrarianModal
          books={books}
          user={user}
          onClose={() => setIsAiOpen(false)}
          onSelectBook={(b) => { setActiveBookDetails(b); }}
        />
      )}

      {/* PVC Smart Card Print Studio Modal */}
      {showIdPrintModal && (
        <IdCardPrintModal
          user={user}
          onClose={() => setShowIdPrintModal(false)}
        />
      )}

      {/* Biometric Turnstile Scanner Modal */}
      {showBiometrics && (
        <BiometricScannerModal
          patron={user}
          purpose="Campus Turnstile & Library Access"
          onClose={() => setShowBiometrics(false)}
        />
      )}
    </div>
  );
}
