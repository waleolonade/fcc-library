import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Search, LogOut, QrCode, FileText, Bot, DoorOpen,
  Sparkles, Layers, Bookmark, MapPin, Filter, AlertTriangle,
  Award, ShieldCheck, Globe, MessageSquare, Printer, Fingerprint,
  Building2, Key, Bell, User, Clock, ChevronLeft, ChevronRight,
  Menu, X, HelpCircle, Settings, Shield, PlusCircle, Wifi, Compass, Link2, Copy
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import TraceBadge from '../common/TraceBadge';

// Student Subcomponents
import StudentOverviewDashboard from './StudentOverviewDashboard';
import SmartCatalogSearch from './SmartCatalogSearch';
import StudentCourseResources from './StudentCourseResources';
import StudentReadingLists from './StudentReadingLists';
import StudentResearchCenter from './StudentResearchCenter';
import StudentDigitalLibrary from './StudentDigitalLibrary';
import DigitalLibraryCardModal from './DigitalLibraryCardModal';
import StudentStudyRooms from './StudentStudyRooms';
import StudentHelpCenter from './StudentHelpCenter';
import StudentEventsAndAnnouncements from './StudentEventsAndAnnouncements';
import AcquisitionRequestModal from './AcquisitionRequestModal';
import DigitalBookReader from '../common/DigitalBookReader';
import BookDetailsModal from '../common/BookDetailsModal';
import AiLibrarianModal from './AiLibrarianModal';
import PartnerLibrariesGateway from '../common/PartnerLibrariesGateway';
import BiometricScannerModal from '../common/BiometricScannerModal';
import StudentCardAndLoans from './StudentCardAndLoans';
import GraduationClearance from './GraduationClearance';
import StudentReservations from './StudentReservations';

export default function StudentStandaloneApp() {
  const [studentUser, setStudentUser] = useState(() => {
    const saved = localStorage.getItem('fcc_student_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 1,
      name: "Adebayo Oluwaseun",
      matric: "FCC/CEM/2024/042",
      email: "a.oluwaseun@fccibadan.edu.ng",
      dept: "Cooperative Economics & Management",
      level: "HND II",
      status: "Active",
      phone: "+234 803 123 4567",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      borrowingLimit: 5,
      currentBorrows: 2,
      finesDue: 0,
      turnstileAccess: "Granted"
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentHashUri, setCurrentHashUri] = useState(() => window.location.hash || '#/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Database Resources State (Direct from MySQL / API)
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [partnerLibraries, setPartnerLibraries] = useState([]);
  const [loans, setLoans] = useState([]);
  const [readingLists, setReadingLists] = useState([]);
  const [continueReading, setContinueReading] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [studyRooms, setStudyRooms] = useState([]);
  const [roomBookings, setRoomBookings] = useState([]);
  const [theses, setTheses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Modals
  const [activeBookForReader, setActiveBookForReader] = useState(null);
  const [activeBookDetails, setActiveBookDetails] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showAcquisitionModal, setShowAcquisitionModal] = useState(false);
  const [acquisitionInitialTitle, setAcquisitionInitialTitle] = useState('');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Student Login Fields
  const [matricInput, setMatricInput] = useState('FCC/CEM/2024/042');
  const [pinInput, setPinInput] = useState('1234');
  const [authError, setAuthError] = useState('');

  // Process Hash Route & Deep Link
  const processRouteFromHash = (loadedBooks = books, loadedTheses = theses) => {
    const rawHash = window.location.hash || '';
    setCurrentHashUri(rawHash || '#/dashboard');

    if (!rawHash || rawHash === '#' || rawHash === '#/') {
      setActiveTab('dashboard');
      return;
    }

    const clean = rawHash.replace(/^#\/?/, '');
    const [pathPart, queryPart] = clean.split('?');
    const params = new URLSearchParams(queryPart || '');

    // 1. Direct PDF Reader deep link (e.g. #/read/3 or #/read/thesis/1)
    if (pathPart.startsWith('read/thesis/')) {
      const thesisId = pathPart.replace('read/thesis/', '');
      const match = (loadedTheses || []).find(t => String(t.id) === String(thesisId));
      if (match) {
        setActiveBookForReader({
          id: `thesis-${match.id}`,
          title: match.title,
          author: match.author || match.studentName || 'Researcher',
          pdfUrl: match.fileUrl || '/demo-theses.pdf',
          pdfPages: match.pages || 148,
          callNumber: `TH-${match.id}`
        });
      }
      return;
    }

    if (pathPart.startsWith('read/')) {
      const bookId = pathPart.replace('read/', '');
      const match = (loadedBooks || []).find(b => String(b.id) === String(bookId));
      if (match) {
        setActiveBookForReader(match);
      }
      return;
    }

    // 2. Direct Book Dossier deep link (e.g. #/book/3)
    if (pathPart.startsWith('book/')) {
      const bookId = pathPart.replace('book/', '');
      const match = (loadedBooks || []).find(b => String(b.id) === String(bookId));
      if (match) {
        setActiveBookDetails(match);
      }
      return;
    }

    // 3. Modals
    if (pathPart === 'ai') {
      setIsAiOpen(true);
      if (params.get('prompt')) setAiInitialPrompt(params.get('prompt'));
      return;
    }
    if (pathPart === 'card-modal' || pathPart === 'card/pvc') {
      setShowIdCardModal(true);
      return;
    }
    if (pathPart === 'scanner' || pathPart === 'turnstile') {
      setShowBiometrics(true);
      return;
    }
    if (pathPart === 'acquisition') {
      setShowAcquisitionModal(true);
      if (params.get('title')) setAcquisitionInitialTitle(params.get('title'));
      return;
    }
    if (pathPart === 'notifications') {
      setShowNotificationsModal(true);
      return;
    }

    // 4. View Tabs
    const tabAliases = {
      'rooms': 'study_rooms',
      'study-rooms': 'study_rooms',
      'theses': 'research',
      'theses_archive': 'research',
      'help': 'helpdesk',
      'my-loans': 'loans',
      'loans_card': 'loans',
      'partner': 'partner_libs',
      'partner-libs': 'partner_libs',
      'events-notices': 'events',
      'course-resources': 'courses',
      'reading-lists': 'reading_lists',
      'graduation-exit': 'clearance'
    };
    const resolvedTab = tabAliases[pathPart] || pathPart;
    const validTabs = [
      'dashboard', 'catalog', 'loans', 'courses', 'reading_lists',
      'reservations', 'digital', 'study_rooms', 'theses', 'past_questions',
      'research', 'card', 'partner_libs', 'events', 'clearance', 'helpdesk'
    ];

    if (validTabs.includes(resolvedTab)) {
      setActiveTab(resolvedTab);
      setActiveBookForReader(null);
      setActiveBookDetails(null);
    }
  };

  const navigateToTab = (tabId, extra = '') => {
    setActiveTab(tabId);
    setActiveBookForReader(null);
    setActiveBookDetails(null);
    const hash = `#/${tabId}${extra ? '?' + extra : ''}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    setCurrentHashUri(hash);
  };

  const openBookDetails = (book) => {
    setActiveBookDetails(book);
    const hash = `#/book/${book.id}`;
    window.location.hash = hash;
    setCurrentHashUri(hash);
  };

  const openBookReader = (book) => {
    setActiveBookForReader(book);
    const hash = String(book.id).startsWith('thesis-')
      ? `#/read/thesis/${String(book.id).replace('thesis-', '')}`
      : `#/read/${book.id}`;
    window.location.hash = hash;
    setCurrentHashUri(hash);
  };

  useEffect(() => {
    const handleHashChange = () => {
      processRouteFromHash(books, theses);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [books, theses]);

  // Fetch all resources directly from Database via REST API
  const refreshDataFromApi = async () => {
    try {
      const [b, c, p, l, rl, cr, res, sr, rb, th, notifs, evts, anns] = await Promise.all([
        libraryApi.catalog.getAll(),
        libraryApi.courses.getAll(),
        libraryApi.partnerLibraries.getAll(),
        libraryApi.loans.getAll(),
        studentUser ? libraryApi.readingLists.getByMatric(studentUser.matric) : Promise.resolve([]),
        studentUser ? libraryApi.continueReading.getByMatric(studentUser.matric) : Promise.resolve([]),
        studentUser ? libraryApi.reservations.getByMatric(studentUser.matric) : Promise.resolve([]),
        libraryApi.studyRooms.getAll(),
        studentUser ? libraryApi.studyRooms.getBookings(studentUser.matric) : Promise.resolve([]),
        libraryApi.theses.getAll(),
        studentUser ? libraryApi.notifications.getByMatric(studentUser.matric) : Promise.resolve([]),
        libraryApi.events.getAll(),
        libraryApi.announcements.getAll()
      ]);

      setBooks(b || []);
      setCourses(c || []);
      setPartnerLibraries(p || []);
      setLoans(l || []);
      setReadingLists(rl || []);
      setContinueReading(cr || []);
      setReservations(res || []);
      setStudyRooms(sr || []);
      setRoomBookings(rb || []);
      setTheses(th || []);
      setNotifications(notifs || []);
      setEvents(evts || []);
      setAnnouncements(anns || []);

      if (studentUser?.matric) {
        const livePatron = await libraryApi.patrons.getByMatric(studentUser.matric);
        if (livePatron) {
          setStudentUser(prev => ({
            ...prev,
            ...livePatron
          }));
        }
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    refreshDataFromApi();
    processRouteFromHash();

    // 1. BroadcastChannel real-time sync across Admin and Student tabs
    const unsubscribe = libraryApi.subscribe(() => {
      refreshDataFromApi();
    });

    // 2. Refresh on window focus and tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDataFromApi();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshDataFromApi);

    // 3. Periodic background synchronization (every 5 seconds)
    const interval = setInterval(() => {
      refreshDataFromApi();
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshDataFromApi);
      clearInterval(interval);
    };
  }, [studentUser]);

  // Handle Student Login via database authentication
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const res = await libraryApi.patrons.authenticate(matricInput, pinInput);
    if (res.success) {
      setStudentUser(res.patron);
      localStorage.setItem('fcc_student_session', JSON.stringify(res.patron));
      sounds.playSuccessChime();
    } else {
      sounds.playErrorBuzz();
      setAuthError(res.message || 'Invalid Matriculation Number or Security PIN.');
    }
  };

  const handleStudentLogout = () => {
    setStudentUser(null);
    localStorage.removeItem('fcc_student_session');
    sounds.playClick();
  };

  const handleRenewLoan = async (loanId) => {
    await libraryApi.loans.renew(loanId);
    refreshDataFromApi();
    sounds.playSuccessChime();
    alert('Loan renewed for an additional 14 days!');
  };

  const handleCreateReadingList = async (listData) => {
    await libraryApi.readingLists.create(listData);
    refreshDataFromApi();
  };

  const handleDeleteReadingList = async (listId) => {
    await libraryApi.readingLists.deleteList(listId);
    refreshDataFromApi();
  };

  const handleRemoveReadingListItem = async (listId, bookId) => {
    await libraryApi.readingLists.removeItem(listId, bookId);
    refreshDataFromApi();
  };

  const handleBookStudyRoom = async (bookingData) => {
    await libraryApi.studyRooms.book(bookingData);
    refreshDataFromApi();
  };

  const handleCancelStudyRoom = async (bookingId) => {
    await libraryApi.studyRooms.cancelBooking(bookingId);
    refreshDataFromApi();
  };

  const handleSubmitThesis = async (thesisData) => {
    await libraryApi.theses.submitThesis(thesisData);
    refreshDataFromApi();
    alert('Dissertation draft submitted to Institutional Repository database!');
  };

  const handleSubmitAcquisition = async (reqData) => {
    await libraryApi.acquisitions.requestBook(reqData);
    refreshDataFromApi();
  };

  const handleRegisterEvent = async (eventId) => {
    await libraryApi.events.register(eventId);
    refreshDataFromApi();
  };

  // Unread notifications count
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  if (!studentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-950 font-serif">
              FCC
            </div>
            <h1 className="text-xl font-black text-white">{INSTITUTION.shortName} Scholar Portal</h1>
            <p className="text-xs text-emerald-400 font-mono">Smart Digital Library & Academic Workspace</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">College Matriculation Number</label>
              <input
                type="text"
                value={matricInput}
                onChange={(e) => setMatricInput(e.target.value)}
                placeholder="e.g. FCC/CEM/2024/042"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400 font-medium">4-Digit Security PIN</label>
                <span className="text-[10px] text-emerald-400 font-mono">Admin Issued</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono tracking-widest text-center text-base focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition"
            >
              <Key size={15} /> Authenticate Scholar Workspace
            </button>
          </form>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1 text-[11px] text-slate-400">
            <div className="font-mono text-emerald-400">Connected to Database: brainfeels_library</div>
            <div>Credentials issued by College Library Directorate</div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'catalog', label: 'Discover Library', icon: Search },
    { id: 'loans', label: 'My Library & Loans', icon: BookOpen, badge: loans.filter(l => l.matric === studentUser?.matric).length },
    { id: 'reservations', label: 'Reservations', icon: Clock, badge: reservations.filter(r => r.matric === studentUser?.matric).length },
    { id: 'digital', label: 'Digital Library', icon: Layers },
    { id: 'research', label: 'Research Center', icon: Globe },
    { id: 'courses', label: 'Course Resources', icon: Award },
    { id: 'reading_lists', label: 'Reading Lists', icon: Bookmark },
    { id: 'study_rooms', label: 'Study Rooms', icon: DoorOpen },
    { id: 'card', label: 'Library Card', icon: QrCode },
    { id: 'clearance', label: 'Graduation Exit', icon: ShieldCheck },
    { id: 'partner_libs', label: 'Linked Libraries', icon: Building2, badge: partnerLibraries.length },
    { id: 'events', label: 'Events & Notices', icon: Bell },
    { id: 'helpdesk', label: 'Ask a Librarian', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. COLLAPSIBLE LEFT SIDEBAR (DESKTOP) */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-slate-900 border-r border-slate-800 sticky top-0 h-screen transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Top: Branding */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-950 font-serif shrink-0">
              FCC
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-sm font-black text-white leading-none">{INSTITUTION.shortName}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Scholar Portal</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateToTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-emerald-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {!sidebarCollapsed && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Logged In Scholar</div>
              <div className="text-xs font-bold text-white truncate">{studentUser.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono truncate">{studentUser.matric}</div>
            </div>
          )}

          <button
            onClick={handleStudentLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
          >
            <LogOut size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Navigation Bar */}
        <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-xl">
          {/* Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="font-bold text-white text-sm">{INSTITUTION.shortName}</span>
          </div>

          {/* Traceable URL Deep-Link Address Bar */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 shadow-inner">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 shrink-0">
              <Link2 size={13} /> Trace URI:
            </span>
            <span className="text-slate-400 truncate max-w-[200px] lg:max-w-[340px]">
              {window.location.origin + window.location.pathname + currentHashUri}
            </span>
            <TraceBadge
              uri={currentHashUri}
              label="Copy Deep-Link"
            />
          </div>

          {/* Global Search Trigger / Quick Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs">
            <button
              onClick={() => navigateToTab('catalog')}
              className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-2xl px-3.5 py-2 text-xs text-slate-400 flex items-center justify-between transition shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-emerald-400" />
                <span>Quick search...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono border border-slate-800 text-slate-400">
                NLP
              </kbd>
            </button>
          </div>

          {/* Right Action Icons & Profile Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Live Status Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400" title="Connected to SQL Database brainfeels_library">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              brainfeels_library SQL Live
            </div>

            {/* AI Librarian Launcher */}
            <button
              onClick={() => {
                setIsAiOpen(true);
                setAiInitialPrompt('');
                window.location.hash = '#/ai';
                setCurrentHashUri('#/ai');
              }}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition active:scale-95"
            >
              <Bot size={15} />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                setShowNotificationsModal(true);
                window.location.hash = '#/notifications';
                setCurrentHashUri('#/notifications');
              }}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Notifications Center (#/notifications)"
            >
              <Bell size={16} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Smart PVC Card Launcher */}
            <button
              onClick={() => {
                setShowIdCardModal(true);
                window.location.hash = '#/card-modal';
                setCurrentHashUri('#/card-modal');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
              title="View Digital PVC Library Card (#/card-modal)"
            >
              <QrCode size={16} />
            </button>

            {/* Turnstile Gate Simulator */}
            <button
              onClick={() => {
                setShowBiometrics(true);
                window.location.hash = '#/scanner';
                setCurrentHashUri('#/scanner');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
              title="Biometric Turnstile Scanner (#/scanner)"
            >
              <Fingerprint size={16} />
            </button>

            {/* Profile Avatar Tag */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-emerald-500/40 overflow-hidden shrink-0">
                <img
                  src={studentUser?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={studentUser?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-right hidden xl:block">
                <div className="text-xs font-bold text-white leading-none">{studentUser?.name}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{studentUser?.matric}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigateToTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-2 font-semibold ${
                    activeTab === item.id ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Routed Content View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {activeBookForReader ? (
            <DigitalBookReader
              book={activeBookForReader}
              onClose={() => {
                setActiveBookForReader(null);
                navigateToTab(activeTab);
              }}
              user={studentUser}
            />
          ) : activeTab === 'dashboard' ? (
            <StudentOverviewDashboard
              user={studentUser}
              books={books}
              loans={loans}
              reservations={reservations}
              continueReading={continueReading}
              roomBookings={roomBookings}
              readingLists={readingLists}
              theses={theses}
              notifications={notifications}
              onNavigateTab={(tab) => navigateToTab(tab)}
              onOpenReader={openBookReader}
              onSelectBook={openBookDetails}
              onRenewLoan={handleRenewLoan}
              onOpenAi={(p) => {
                setIsAiOpen(true);
                setAiInitialPrompt(p || '');
                window.location.hash = '#/ai';
                setCurrentHashUri('#/ai');
              }}
            />
          ) : activeTab === 'catalog' ? (
            <SmartCatalogSearch
              books={books}
              theses={theses}
              courses={courses}
              onSelectBook={openBookDetails}
              onOpenReader={openBookReader}
              onOpenAi={(p) => {
                setIsAiOpen(true);
                setAiInitialPrompt(p || '');
                window.location.hash = '#/ai';
                setCurrentHashUri('#/ai');
              }}
              onRequestAcquisition={(opts) => {
                setAcquisitionInitialTitle(opts.title || '');
                setShowAcquisitionModal(true);
                window.location.hash = '#/acquisition';
                setCurrentHashUri('#/acquisition');
              }}
            />
          ) : activeTab === 'loans' ? (
            <StudentCardAndLoans
              user={studentUser}
              loans={loans.filter(l => l.matric === studentUser?.matric)}
              books={books}
              onRenewLoan={handleRenewLoan}
              onPayFine={() => alert('Fines are institutional and waived for enrolled scholars.')}
            />
          ) : activeTab === 'digital' ? (
            <StudentDigitalLibrary
              books={books}
              continueReading={continueReading}
              onOpenReader={openBookReader}
              onSelectBook={openBookDetails}
              user={studentUser}
            />
          ) : activeTab === 'courses' ? (
            <StudentCourseResources
              books={books}
              courses={courses}
              onSelectBook={openBookDetails}
              onOpenReader={openBookReader}
              user={studentUser}
            />
          ) : activeTab === 'reading_lists' ? (
            <StudentReadingLists
              readingLists={readingLists}
              books={books}
              onCreateList={handleCreateReadingList}
              onDeleteList={handleDeleteReadingList}
              onRemoveItem={handleRemoveReadingListItem}
              onOpenReader={openBookReader}
              onSelectBook={openBookDetails}
              user={studentUser}
            />
          ) : activeTab === 'reservations' ? (
            <StudentReservations
              reservations={reservations}
              books={books}
              user={studentUser}
              onSelectBook={openBookDetails}
              onOpenReader={openBookReader}
              onCancelReservation={async (resId) => {
                await libraryApi.reservations.cancel(resId);
                refreshDataFromApi();
              }}
            />
          ) : activeTab === 'study_rooms' || activeTab === 'rooms' ? (
            <StudentStudyRooms
              rooms={studyRooms}
              bookings={roomBookings}
              user={studentUser}
              onBookRoom={handleBookStudyRoom}
              onCancelBooking={handleCancelStudyRoom}
            />
          ) : activeTab === 'theses' ? (
            <StudentResearchCenter
              theses={theses}
              onSubmitThesis={handleSubmitThesis}
              user={studentUser}
              onOpenReader={openBookReader}
            />
          ) : activeTab === 'past_questions' ? (
            <StudentCourseResources
              books={books}
              courses={courses}
              onSelectBook={openBookDetails}
              onOpenReader={openBookReader}
              user={studentUser}
            />
          ) : activeTab === 'research' ? (
            <StudentResearchCenter
              theses={theses}
              onSubmitThesis={handleSubmitThesis}
              user={studentUser}
              onOpenReader={openBookReader}
            />
          ) : activeTab === 'card' ? (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                <h2 className="text-xl font-bold text-white">Smart Institutional Scholar Card</h2>
                <p className="text-xs text-slate-400">Click below to open high-DPI printable PVC card or wallet pass.</p>
                <button
                  onClick={() => setShowIdCardModal(true)}
                  className="mt-4 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950"
                >
                  <QrCode size={16} /> Open Digital PVC Card
                </button>
              </div>
            </div>
          ) : activeTab === 'partner_libs' ? (
            <PartnerLibrariesGateway partnerLibraries={partnerLibraries} user={studentUser} />
          ) : activeTab === 'events' ? (
            <StudentEventsAndAnnouncements
              events={events}
              announcements={announcements}
              onRegisterEvent={handleRegisterEvent}
            />
          ) : activeTab === 'clearance' ? (
            <GraduationClearance user={studentUser} loans={loans} />
          ) : (
            <StudentHelpCenter user={studentUser} />
          )}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-2 flex items-center justify-around text-[10px] font-bold">
        {[
          { id: 'dashboard', label: 'Home', icon: Sparkles },
          { id: 'catalog', label: 'Search', icon: Search },
          { id: 'loans', label: 'My Library', icon: BookOpen },
          { id: 'research', label: 'Research', icon: Globe },
          { id: 'card', label: 'Card', icon: QrCode },
        ].map(bNav => {
          const Icon = bNav.icon;
          return (
            <button
              key={bNav.id}
              onClick={() => navigateToTab(bNav.id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition ${
                activeTab === bNav.id ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon size={18} />
              <span>{bNav.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. MODALS */}
      {/* Book Dossier Modal */}
      {activeBookDetails && (
        <BookDetailsModal
          book={activeBookDetails}
          onClose={() => setActiveBookDetails(null)}
          onOpenReader={(b) => {
            setActiveBookDetails(null);
            setActiveBookForReader(b);
          }}
          onReserve={(b) => {
            libraryApi.reservations.create(studentUser.matric, b);
            refreshDataFromApi();
            alert(`Reserved copy of "${b.title}". Notification queued.`);
          }}
        />
      )}

      {/* AI Smart Librarian */}
      {isAiOpen && (
        <AiLibrarianModal
          books={books}
          user={studentUser}
          initialPrompt={aiInitialPrompt}
          onClose={() => setIsAiOpen(false)}
          onSelectBook={(b) => {
            setIsAiOpen(false);
            setActiveBookDetails(b);
          }}
        />
      )}

      {/* Digital PVC Card Modal */}
      {showIdCardModal && (
        <DigitalLibraryCardModal
          user={studentUser}
          onClose={() => setShowIdCardModal(false)}
        />
      )}

      {/* Biometric Turnstile Scanner Modal */}
      {showBiometrics && (
        <BiometricScannerModal
          user={studentUser}
          onClose={() => setShowBiometrics(false)}
          onVerified={() => sounds.playSuccessChime()}
        />
      )}

      {/* Book Acquisition Request Modal */}
      {showAcquisitionModal && (
        <AcquisitionRequestModal
          user={studentUser}
          initialTitle={acquisitionInitialTitle}
          onSubmitRequest={handleSubmitAcquisition}
          onClose={() => setShowAcquisitionModal(false)}
        />
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell size={16} className="text-emerald-400" /> Notifications & Alerts
              </h3>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-emerald-400 font-mono">{n.category}</span>
                    <span className="text-slate-500 font-mono">{n.timestamp}</span>
                  </div>
                  <h4 className="font-bold text-white">{n.title}</h4>
                  <p className="text-slate-300">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
