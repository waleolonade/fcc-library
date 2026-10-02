import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Search, LogOut, QrCode, FileText, Bot, DoorOpen,
  Sparkles, Layers, Bookmark, MapPin, Filter, AlertTriangle,
  Award, ShieldCheck, Globe, MessageSquare, Printer, Fingerprint, Building2, Link2, Shield,
  Menu, ChevronLeft, ChevronRight, ChevronDown, X, User, GraduationCap, Barcode,
  Home, Library, Clock, Star, History, Bell, Quote, Compass, BookMarked,
  ExternalLink, Check, Copy, AlertCircle, RefreshCw, Send, Sparkle
} from 'lucide-react';
import { INSTITUTION, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import DigitalBookReader from './DigitalBookReader';
import StudentOverviewDashboard from './StudentOverviewDashboard';
import StudentResearchHub from './StudentResearchHub';
import MyLibraryAccount from './MyLibraryAccount';
import NotificationCenter from './NotificationCenter';
import StudentCardAndLoans from './StudentCardAndLoans';
import StudyRoomBooking from './StudyRoomBooking';
import AiLibrarianModal from './AiLibrarianModal';
import BookDetailsModal from '../common/BookDetailsModal';
import GraduationClearance from './GraduationClearance';
import PlagiarismChecker from './PlagiarismChecker';
import CourseReserves from './CourseReserves';
import InterLibraryLoan from './InterLibraryLoan';
import HelpdeskTickets from './HelpdeskTickets';
import DepartmentalResourcesView from './DepartmentalResourcesView';
import IdCardPrintModal from './IdCardPrintModal';
import BiometricScannerModal from '../common/BiometricScannerModal';
import PartnerLibrariesGateway from '../common/PartnerLibrariesGateway';
import TraceBadge from '../common/TraceBadge';
import { navigateTo, parseCurrentRoute } from '../utils/router';
import { PATTERNS } from '../utils/backgroundPatterns';
import StudentPatronProfile from './StudentPatronProfile';
import BarcodeQrStudio from '../common/BarcodeQrStudio';
import SelfServiceKiosk from '../common/SelfServiceKiosk';
import UserFccAdminBridge from './UserFccAdminBridge';
import InstitutionalCommunicationHub from '../common/InstitutionalCommunicationHub';
import { sounds } from '../utils/soundEffects';
import GutendexExplorer from './GutendexExplorer';
import OpenLibraryExplorer from './OpenLibraryExplorer';
import TroveExplorer from './TroveExplorer';
import InternetArchiveExplorer from './InternetArchiveExplorer';

export default function StudentPortal({
  user,
  onLogout,
  books = [],
  partnerLibraries = INITIAL_PARTNER_LIBRARIES,
  loans = [],
  onRenewLoan,
  onPayFine,
  onOpenReader
}) {
  // Navigation active tab:
  // HOME: 'home'
  // LIBRARY: 'library_search', 'library_books', 'library_ebooks', 'library_journals', 'library_digital'
  // MY LIBRARY: 'my_borrowed', 'my_reserved', 'my_due_soon', 'my_history', 'my_saved'
  // RESEARCH: 'research_hnd_projects', 'research_papers', 'research_journals', 'research_topics', 'research_references'
  // AI: 'ai_assistant'
  // NOTIFICATIONS: 'notifications'
  // PROFILE: 'profile'
  // Campus utilities: 'kiosk', 'barcode_studio', 'clearance', 'rooms', 'ill', 'communication', 'helpdesk'
  const [activeTab, setActiveTab] = useState('home');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeBookForReader, setActiveBookForReader] = useState(null);
  const [activeBookDetails, setActiveBookDetails] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [showIdPrintModal, setShowIdPrintModal] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);

  // Accordion state for sidebar menu groups
  const [expandedGroups, setExpandedGroups] = useState({
    library: true,
    myLibrary: true,
    research: true,
    ai: true,
    campusTools: false
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Determine if student is HND2 (High Research Priority)
  const isHnd2 = Boolean(
    user?.level?.includes('HND2') ||
    user?.level?.includes('HND 2') ||
    user?.level?.includes('HND II') ||
    user?.level?.includes('Final') ||
    (user?.matric && user.matric.toUpperCase().includes('HND')) ||
    user?.level === 'HND II'
  );

  // Sync activeTab with URL Hash
  useEffect(() => {
    const syncFromHash = () => {
      const { path } = parseCurrentRoute();
      if (path.startsWith('/scholar/')) {
        const sub = path.replace('/scholar/', '').split('/')[0];
        
        // Backward-compatibility and shorthand route aliases
        const routeAliasMap = {
          'dashboard': 'home',
          'catalog': 'library_search',
          'search': 'library_search',
          'books': 'library_books',
          'ebooks': 'library_ebooks',
          'journals': 'library_journals',
          'dept_resources': 'library_digital',
          'digital': 'library_digital',
          'loans': 'my_borrowed',
          'borrowed': 'my_borrowed',
          'reserves': 'my_reserved',
          'reserved': 'my_reserved',
          'due_soon': 'my_due_soon',
          'history': 'my_history',
          'saved': 'my_saved',
          'favorites': 'my_saved',
          'theses': 'research_hnd_projects',
          'theses_archive': 'research_hnd_projects',
          'projects': 'research_hnd_projects',
          'papers': 'research_papers',
          'research_papers': 'research_papers',
          'topics': 'research_topics',
          'references': 'research_references',
          'citations': 'research_references',
          'ai': 'ai_assistant',
          'assistant': 'ai_assistant'
        };

        const resolved = routeAliasMap[sub] || sub;
        const validTabs = [
          'home',
          'library_search', 'library_books', 'library_ebooks', 'library_journals', 'library_digital',
          'my_borrowed', 'my_reserved', 'my_due_soon', 'my_history', 'my_saved',
          'research_hnd_projects', 'research_papers', 'research_journals', 'research_topics', 'research_references',
          'ai_assistant', 'notifications', 'profile',
          'kiosk', 'barcode_studio', 'clearance', 'rooms', 'ill', 'communication', 'helpdesk', 'partner_libs',
          'library_gutendex', 'library_openlibrary', 'library_archive'
        ];

        if (validTabs.includes(resolved)) {
          setActiveTab(resolved);
        }

        if (sub === 'reader') {
          const { queryParams } = parseCurrentRoute();
          const target = books.find(b => b.id === queryParams?.bookId) || books[0];
          if (target) {
            setActiveBookForReader(target);
          }
        }
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const handleTabSwitch = (tabId) => {
    sounds.playClick();
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

  const physicalBooks = useMemo(() => books.filter(b => !b.isDigital), [books]);
  const digitalEbooks = useMemo(() => books.filter(b => b.isDigital), [books]);

  const userLoans = useMemo(() => loans.filter(l => l.matric === user?.matric), [loans, user]);
  const dueSoonLoans = useMemo(() => {
    const today = new Date();
    return userLoans.filter(l => {
      const diff = Math.ceil((new Date(l.dueDate) - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 4;
    });
  }, [userLoans]);

  // Tab Breadcrumbs and Metadata
  const tabMetadata = {
    home: { label: 'Scholar Home', category: 'HOME', icon: Home },
    library_search: { label: 'Catalog Search', category: 'LIBRARY', icon: Search },
    library_books: { label: 'Physical Books Collection', category: 'LIBRARY', icon: BookOpen },
    library_ebooks: { label: 'eBooks & Digital Texts', category: 'LIBRARY', icon: BookOpen },
    library_journals: { label: 'Academic Journals', category: 'LIBRARY', icon: Layers },
    library_digital: { label: 'Digital Resources & Notes', category: 'LIBRARY', icon: GraduationCap },
    my_borrowed: { label: 'Borrowed Books', category: 'MY LIBRARY', icon: QrCode },
    my_reserved: { label: 'Reserved Books', category: 'MY LIBRARY', icon: Layers },
    my_due_soon: { label: 'Due Soon & Overdue Warnings', category: 'MY LIBRARY', icon: Clock },
    my_history: { label: 'Borrowing History', category: 'MY LIBRARY', icon: History },
    my_saved: { label: 'Saved & Reading Lists', category: 'MY LIBRARY', icon: Bookmark },
    research_hnd_projects: { label: 'HND Dissertations & Projects', category: 'RESEARCH', icon: FileText },
    research_papers: { label: 'Scholarly Research Papers', category: 'RESEARCH', icon: Globe },
    research_journals: { label: 'Peer-Reviewed Journals', category: 'RESEARCH', icon: Layers },
    research_topics: { label: 'Curated Project Topics', category: 'RESEARCH', icon: Compass },
    research_references: { label: 'Citation & References Builder', category: 'RESEARCH', icon: Quote },
    ai_assistant: { label: 'Library AI Assistant', category: 'AI', icon: Bot },
    notifications: { label: 'Notifications Center', category: 'ALERTS', icon: Bell },
    profile: { label: 'Patron Profile & Dossier', category: 'PROFILE', icon: User },
    kiosk: { label: 'Self-Service Station', category: 'FACILITIES', icon: QrCode },
    barcode_studio: { label: 'Barcode Suite', category: 'FACILITIES', icon: Barcode },
    clearance: { label: 'Graduation Clearance', category: 'FACILITIES', icon: Award },
    rooms: { label: 'Study Rooms', category: 'FACILITIES', icon: DoorOpen },
    ill: { label: 'Inter-Library Loan', category: 'FACILITIES', icon: Globe },
    communication: { label: 'Institutional Dispatch', category: 'FACILITIES', icon: MessageSquare },
    helpdesk: { label: 'Ask a Librarian', category: 'FACILITIES', icon: MessageSquare },
    partner_libs: { label: 'Linked Libraries', category: 'FACILITIES', icon: Building2 },
    library_gutendex: { label: 'Project Gutenberg eBooks', category: 'LIBRARY', icon: BookOpen },
    library_openlibrary: { label: 'Open Library Catalog', category: 'LIBRARY', icon: Globe },
    library_archive: { label: 'Internet Archive Books', category: 'LIBRARY', icon: Library },
  };

  const currentMeta = tabMetadata[activeTab] || tabMetadata.home;
  const CurrentIcon = currentMeta.icon;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#021810] text-emerald-100 font-sans selection:bg-emerald-500 selection:text-white"
      style={{ backgroundImage: PATTERNS.scholar }}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <header className="bg-[#032317]/95 backdrop-blur-md border-b border-emerald-800/80 sticky top-0 z-30 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left: Sidebar Toggle + Branding + Active Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 transition flex items-center gap-1.5"
            title={sidebarOpen ? "Hide Menu Sidebar" : "Show Menu Sidebar"}
          >
            <Menu size={18} />
            <span className="text-xs font-semibold hidden sm:inline">Menu</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center shadow-md shadow-emerald-950/60 overflow-hidden shrink-0">
              <img
                src="/assets/fcc-logo.png"
                alt="Federal Co-operative College"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white leading-none">{INSTITUTION.shortName}</div>
              <div className="text-[10px] text-emerald-400 font-medium">Student App & Digital Library</div>
            </div>
          </div>

          {/* Current Section Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-emerald-200">
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">{currentMeta.category}</span>
            <span className="text-emerald-600">/</span>
            <CurrentIcon size={13} className="text-emerald-400" />
            <span className="font-semibold">{currentMeta.label}</span>
          </div>

          {/* Special HND2 Priority Indicator */}
          {isHnd2 && (
            <div className="hidden xl:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold">
              <Sparkles size={11} className="text-emerald-400 animate-spin" />
              <span>HND II Final Year Research Active</span>
            </div>
          )}
        </div>

        {/* Center: Quick Primary Switchers */}
        <div className="hidden lg:flex items-center gap-1 bg-[#021810] p-1 rounded-2xl border border-emerald-800/80 text-xs font-semibold">
          <button
            onClick={() => handleTabSwitch('home')}
            className={`px-3 py-1 rounded-xl transition ${
              activeTab === 'home' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabSwitch('library_search')}
            className={`px-3 py-1 rounded-xl transition ${
              activeTab.startsWith('library') ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => handleTabSwitch('my_borrowed')}
            className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 ${
              activeTab.startsWith('my_') ? 'bg-emerald-600 text-white shadow' : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            <span>My Library</span>
            {userLoans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-800 text-[10px] text-emerald-200 font-bold">
                {userLoans.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabSwitch('research_hnd_projects')}
            className={`px-3 py-1 rounded-xl transition flex items-center gap-1.5 ${
              activeTab.startsWith('research')
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            <span>Research</span>
            {isHnd2 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase">
                HND2
              </span>
            )}
          </button>
        </div>

        {/* Right: AI Librarian + User Badge + Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAiOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
          >
            <Bot size={15} />
            <span className="hidden sm:inline">AI Librarian</span>
          </button>

          <button
            onClick={() => handleTabSwitch('notifications')}
            className={`p-2 rounded-xl border border-emerald-800/80 transition relative ${
              activeTab === 'notifications' ? 'bg-emerald-600 text-white' : 'bg-[#021810] text-emerald-300 hover:text-white'
            }`}
            title="Notifications"
          >
            <Bell size={16} />
            {dueSoonLoans.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <div
            onClick={() => handleTabSwitch('profile')}
            className="text-right hidden sm:block pl-2 border-l border-emerald-800 cursor-pointer group"
          >
            <div className="text-xs font-bold text-emerald-100 group-hover:text-emerald-300 transition flex items-center gap-1 justify-end">
              <span>{user?.name || 'Scholar'}</span>
              <User size={13} className="text-emerald-400" />
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              {user?.matric} • <span className="text-amber-400 font-bold">{user?.level || 'HND II'}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT: COLLAPSIBLE HIERARCHICAL SIDEBAR + MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-emerald-800/80 bg-[#032317]/95 backdrop-blur-md flex flex-col justify-between shrink-0 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto p-3 space-y-4 animate-fadeIn">
            <div className="space-y-3">
              {/* Institution Identity Card in Sidebar */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#021810] border border-emerald-800/80 shadow-md">
                <img
                  src="/assets/fcc-logo.png"
                  alt="FCC Crest"
                  className="w-10 h-10 object-cover rounded-xl shadow ring-1 ring-emerald-500/40 shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white leading-tight truncate">Federal Co-operative College</div>
                  <div className="text-[10px] text-emerald-400 font-mono">EST. 1943 • IBADAN</div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* RECOMMENDED STUDENT APP MENU (ND/HND SPECIFICATION)            */}
              {/* ============================================================== */}
              <div className="space-y-2">

                {/* 1. HOME */}
                <button
                  onClick={() => handleTabSwitch('home')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'home'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home size={16} className={activeTab === 'home' ? 'text-white' : 'text-emerald-400'} />
                    <span className="tracking-wide uppercase text-[11px]">HOME</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>

                {/* 2. LIBRARY (├── Search, ├── Books, ├── eBooks, ├── Journals, └── Digital Resources) */}
                <div className="rounded-2xl bg-[#021810]/70 border border-emerald-800/60 overflow-hidden">
                  <button
                    onClick={() => toggleGroup('library')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Library size={15} className="text-emerald-400" />
                      <span className="tracking-wide uppercase text-[11px]">LIBRARY</span>
                    </div>
                    {expandedGroups.library ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {expandedGroups.library && (
                    <div className="pl-4 pr-1.5 pb-1.5 space-y-0.5 border-t border-emerald-900/50">
                      {[
                        { id: 'library_search', label: 'Search', icon: Search, prefix: '├──' },
                        { id: 'library_books', label: 'Books', icon: BookOpen, prefix: '├──', badge: physicalBooks.length },
                        { id: 'library_ebooks', label: 'eBooks', icon: BookOpen, prefix: '├──', badge: digitalEbooks.length },
                        { id: 'library_journals', label: 'Journals', icon: Layers, prefix: '├──' },
                        { id: 'library_digital', label: 'Digital Resources', icon: GraduationCap, prefix: '├──' },
                        { id: 'library_gutendex', label: 'Project Gutenberg', icon: Globe, prefix: '├──' },
                        { id: 'library_openlibrary', label: 'Open Library', icon: Globe, prefix: '├──' },
                        { id: 'library_archive', label: 'Internet Archive', icon: Library, prefix: '└──' },
                      ].map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleTabSwitch(sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                              isSubActive
                                ? 'bg-emerald-600 text-white font-bold shadow'
                                : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-emerald-600 text-[10px] select-none">{sub.prefix}</span>
                              <SubIcon size={13} className={isSubActive ? 'text-white' : 'text-emerald-400/80'} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.badge !== undefined && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSubActive ? 'bg-emerald-800 text-white' : 'bg-emerald-950 text-emerald-400'
                              }`}>
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. MY LIBRARY (├── Borrowed, ├── Reserved, ├── Due Soon, ├── History, └── Saved) */}
                <div className="rounded-2xl bg-[#021810]/70 border border-emerald-800/60 overflow-hidden">
                  <button
                    onClick={() => toggleGroup('myLibrary')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark size={15} className="text-emerald-400" />
                      <span className="tracking-wide uppercase text-[11px]">MY LIBRARY</span>
                    </div>
                    {expandedGroups.myLibrary ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {expandedGroups.myLibrary && (
                    <div className="pl-4 pr-1.5 pb-1.5 space-y-0.5 border-t border-emerald-900/50">
                      {[
                        { id: 'my_borrowed', label: 'Borrowed', icon: QrCode, prefix: '├──', badge: userLoans.length },
                        { id: 'my_reserved', label: 'Reserved', icon: Layers, prefix: '├──' },
                        { id: 'my_due_soon', label: 'Due Soon', icon: Clock, prefix: '├──', badge: dueSoonLoans.length, badgeAlert: dueSoonLoans.length > 0 },
                        { id: 'my_history', label: 'History', icon: History, prefix: '├──' },
                        { id: 'my_saved', label: 'Saved', icon: Star, prefix: '└──' },
                      ].map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleTabSwitch(sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                              isSubActive
                                ? 'bg-emerald-600 text-white font-bold shadow'
                                : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-emerald-600 text-[10px] select-none">{sub.prefix}</span>
                              <SubIcon size={13} className={isSubActive ? 'text-white' : 'text-emerald-400/80'} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {sub.badge !== undefined && sub.badge > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                sub.badgeAlert
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                  : isSubActive ? 'bg-emerald-800 text-white' : 'bg-emerald-950 text-emerald-400'
                              }`}>
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. RESEARCH (ESPECIALLY IMPORTANT FOR HND2 STUDENTS) */}
                {/* ├── HND Projects, ├── Research Papers, ├── Journals, ├── Project Topics, └── References */}
                <div className={`rounded-2xl overflow-hidden transition ${
                  isHnd2
                    ? 'bg-gradient-to-b from-emerald-950/80 via-[#021810] to-[#021810] border-2 border-emerald-500/50 shadow-lg shadow-emerald-950/80 ring-1 ring-emerald-500/20'
                    : 'bg-[#021810]/70 border border-emerald-800/60'
                }`}>
                  <button
                    onClick={() => toggleGroup('research')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Award size={16} className={isHnd2 ? "text-amber-400 animate-pulse" : "text-emerald-400"} />
                      <span className="tracking-wide uppercase text-[11px] font-black">RESEARCH</span>
                      {isHnd2 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow">
                          HND2 Priority
                        </span>
                      )}
                    </div>
                    {expandedGroups.research ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {expandedGroups.research && (
                    <div className="pl-4 pr-1.5 pb-1.5 space-y-0.5 border-t border-emerald-900/50">
                      {[
                        { id: 'research_hnd_projects', label: 'HND Projects', icon: FileText, prefix: '├──', hndHighlight: true },
                        { id: 'research_papers', label: 'Research Papers', icon: Globe, prefix: '├──' },
                        { id: 'research_journals', label: 'Journals', icon: Layers, prefix: '├──' },
                        { id: 'research_topics', label: 'Project Topics', icon: Compass, prefix: '├──', hndHighlight: true },
                        { id: 'research_references', label: 'References', icon: Quote, prefix: '└──' },
                      ].map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleTabSwitch(sub.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                              isSubActive
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow'
                                : isHnd2 && sub.hndHighlight
                                ? 'text-emerald-200 hover:text-white hover:bg-emerald-900/50'
                                : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-emerald-600 text-[10px] select-none">{sub.prefix}</span>
                              <SubIcon size={13} className={isSubActive ? 'text-white' : isHnd2 && sub.hndHighlight ? 'text-emerald-400' : 'text-emerald-400/80'} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {isHnd2 && sub.hndHighlight && (
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">★</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. AI (└── Library AI Assistant) */}
                <div className="rounded-2xl bg-[#021810]/70 border border-emerald-800/60 overflow-hidden">
                  <button
                    onClick={() => toggleGroup('ai')}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/30 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Bot size={15} className="text-emerald-400" />
                      <span className="tracking-wide uppercase text-[11px]">AI</span>
                    </div>
                    {expandedGroups.ai ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {expandedGroups.ai && (
                    <div className="pl-4 pr-1.5 pb-1.5 space-y-0.5 border-t border-emerald-900/50">
                      <button
                        onClick={() => handleTabSwitch('ai_assistant')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          activeTab === 'ai_assistant'
                            ? 'bg-emerald-600 text-white font-bold shadow'
                            : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-emerald-600 text-[10px] select-none">└──</span>
                          <Sparkles size={13} className={activeTab === 'ai_assistant' ? 'text-white' : 'text-emerald-400/80'} />
                          <span className="truncate">Library AI Assistant</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. NOTIFICATIONS */}
                <button
                  onClick={() => handleTabSwitch('notifications')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'notifications'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell size={16} className={activeTab === 'notifications' ? 'text-white' : 'text-emerald-400'} />
                    <span className="tracking-wide uppercase text-[11px]">NOTIFICATIONS</span>
                  </div>
                  {dueSoonLoans.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {dueSoonLoans.length}
                    </span>
                  )}
                </button>

                {/* 7. PROFILE */}
                <button
                  onClick={() => handleTabSwitch('profile')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'profile'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User size={16} className={activeTab === 'profile' ? 'text-white' : 'text-emerald-400'} />
                    <span className="tracking-wide uppercase text-[11px]">PROFILE</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/70">ID</span>
                </button>

              </div>

              {/* Collapsible Secondary Utilities: Campus Facilities & Modals */}
              <div className="pt-2 border-t border-emerald-800/60">
                <button
                  onClick={() => toggleGroup('campusTools')}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-emerald-400/70 hover:text-emerald-200 transition"
                >
                  <span>Campus Desks & Tools</span>
                  {expandedGroups.campusTools ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>

                {expandedGroups.campusTools && (
                  <div className="pt-1 space-y-0.5 animate-fadeIn">
                    {[
                      { id: 'kiosk', label: 'Self-Service Station', icon: QrCode },
                      { id: 'rooms', label: 'Study Rooms', icon: DoorOpen },
                      { id: 'clearance', label: 'Graduation Clearance', icon: Award },
                      { id: 'barcode_studio', label: 'Barcode & QR Suite', icon: Barcode },
                      { id: 'helpdesk', label: 'Ask a Librarian', icon: MessageSquare },
                      { id: 'pvc', label: 'PVC Card Studio', icon: Printer, action: () => setShowIdPrintModal(true) },
                      { id: 'gate', label: 'Turnstile Scan', icon: Fingerprint, action: () => setShowBiometrics(true) },
                    ].map(tool => {
                      const ToolIcon = tool.icon;
                      const isActive = activeTab === tool.id;
                      if (tool.action) {
                        return (
                          <button
                            key={tool.id}
                            onClick={tool.action}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-emerald-300/70 hover:text-emerald-100 hover:bg-emerald-900/30 transition"
                          >
                            <ToolIcon size={13} className="text-emerald-400/70" />
                            <span>{tool.label}</span>
                          </button>
                        );
                      }
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleTabSwitch(tool.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                            isActive
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'text-emerald-300/70 hover:text-emerald-100 hover:bg-emerald-900/30'
                          }`}
                        >
                          <ToolIcon size={13} className={isActive ? 'text-white' : 'text-emerald-400/70'} />
                          <span>{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Patron Identity Card */}
            <div className="p-3 rounded-2xl bg-[#021810] border border-emerald-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400">PATRON VERIFIED</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="font-bold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-emerald-400/70 font-mono">{user?.matric}</div>
              <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-300/70">Level / Status</span>
                <span className="font-bold text-emerald-400">{user?.level || 'HND II'}</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
          {activeBookForReader ? (
            <DigitalBookReader
              book={activeBookForReader}
              onClose={() => setActiveBookForReader(null)}
            />
          ) : activeTab === 'home' ? (
            /* ============================================================== */
            /* 1. HOME VIEW (Overview Dashboard + HND2 Accelerator)           */
            /* ============================================================== */
            <StudentOverviewDashboard
              user={user}
              books={books}
              loans={loans}
              reservations={[]}
              continueReading={[]}
              roomBookings={[]}
              readingLists={[]}
              theses={[]}
              notifications={[]}
              onNavigateTab={(tab) => handleTabSwitch(tab)}
              onOpenReader={(b) => setActiveBookForReader(b)}
              onSelectBook={(b) => setActiveBookDetails(b)}
              onRenewLoan={onRenewLoan}
              onOpenAi={() => setIsAiOpen(true)}
            />
          ) : activeTab === 'library_search' ? (
            /* ============================================================== */
            /* 2. LIBRARY ├── Search                                          */
            /* ============================================================== */
            <div className="h-full animate-fadeIn">
              <OpenLibraryExplorer />
            </div>
          ) : activeTab === 'library_books' ? (
            /* ============================================================== */
            /* 2. LIBRARY ├── Books (API Integration)                         */
            /* ============================================================== */
            <div className="h-full animate-fadeIn">
              <OpenLibraryExplorer />
            </div>
          ) : activeTab === 'library_ebooks' ? (
            /* ============================================================== */
            /* 2. LIBRARY ├── eBooks                                          */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-950 text-teal-400 border border-teal-800/80">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Digital eBooks Repository</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Read full-text electronic books online with interactive reader, bookmarks, and search.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {digitalEbooks.map(book => (
                  <div key={book.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-700/50 transition flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-400 border border-teal-800/60">
                        DIGITAL EDITION • {book.pdfPages || 140} PAGES
                      </span>
                      <h3 className="text-base font-bold text-white">{book.title}</h3>
                      <p className="text-xs text-slate-400">{book.author}</p>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{book.abstract}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                      <button
                        onClick={() => setActiveBookDetails(book)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                      >
                        Metadata
                      </button>
                      <button
                        onClick={() => setActiveBookForReader(book)}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow transition"
                      >
                        <BookOpen size={13} /> Open Reader
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'library_journals' ? (
            /* ============================================================== */
            /* 2. LIBRARY ├── Journals                                        */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Academic Journals Directory</h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Peer-reviewed periodicals, quarterly institutional journals, and indexed scholarly publications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trove Journals & Archives */}
              <div className="h-[750px]">
                <TroveExplorer />
              </div>
            </div>
          ) : activeTab === 'library_digital' ? (
            /* ============================================================== */
            /* 2. LIBRARY └── Digital Resources                               */
            /* ============================================================== */
            <DepartmentalResourcesView
              user={user}
              onOpenReader={(b) => {
                setActiveBookDetails(null);
                setActiveBookForReader(b);
              }}
            />
          ) : activeTab === 'library_gutendex' ? (
            <div className="h-full">
              <GutendexExplorer />
            </div>
          ) : activeTab === 'library_openlibrary' ? (
            <div className="h-full">
              <OpenLibraryExplorer />
            </div>
          ) : activeTab === 'library_archive' ? (
            <div className="h-full">
              <InternetArchiveExplorer />
            </div>
          ) : activeTab.startsWith('my_') ? (
            /* ============================================================== */
            /* 3. MY LIBRARY (Borrowed, Reserved, Due Soon, History, Saved)   */
            /* ============================================================== */
            <MyLibraryAccount
              user={user}
              loans={loans}
              books={books}
              reservations={[]}
              fines={[]}
              notifications={[]}
              favorites={[]}
              readingLists={[]}
              onRenewLoan={onRenewLoan}
              onPayFine={onPayFine}
              initialSection={
                activeTab === 'my_borrowed' ? 'loans' :
                activeTab === 'my_reserved' ? 'reservations' :
                activeTab === 'my_due_soon' ? 'overdue' :
                activeTab === 'my_history' ? 'history' :
                'favorites'
              }
              onNavigate={(sec) => {
                if (sec === 'loans') handleTabSwitch('my_borrowed');
                else if (sec === 'reservations') handleTabSwitch('my_reserved');
                else if (sec === 'overdue') handleTabSwitch('my_due_soon');
                else if (sec === 'history') handleTabSwitch('my_history');
                else if (sec === 'favorites') handleTabSwitch('my_saved');
              }}
            />
          ) : activeTab.startsWith('research_') ? (
            /* ============================================================== */
            /* 4. RESEARCH (HND Projects, Papers, Journals, Topics, Refs)    */
            /* High priority for HND2 students                                */
            /* ============================================================== */
            <StudentResearchHub
              initialSubTab={
                activeTab === 'research_hnd_projects' ? 'hnd_projects' :
                activeTab === 'research_papers' ? 'papers' :
                activeTab === 'research_journals' ? 'journals' :
                activeTab === 'research_topics' ? 'topics' :
                'references'
              }
              theses={[]}
              books={books}
              user={user}
              onOpenReader={(b) => setActiveBookForReader(b)}
              onOpenAi={() => setIsAiOpen(true)}
            />
          ) : activeTab === 'ai_assistant' ? (
            /* ============================================================== */
            /* 5. AI └── Library AI Assistant Workspace                       */
            /* ============================================================== */
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/40 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                    <Bot size={26} className="text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Library AI Research Assistant</h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Trained on institutional catalog holdings, HND dissertation archives, and academic databases.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {[
                    { title: "Literature Review Summary", desc: "Synthesize empirical studies on micro-credit in West Africa", prompt: "Summarize top empirical research on micro-credit and cooperative apex unions." },
                    { title: "Dissertation Problem Statement", desc: "Draft a crisp problem formulation for your HND2 project", prompt: "Help me formulate a strong academic problem statement for an HND dissertation on IoT library automation." },
                    { title: "Call Number Navigator", desc: "Locate shelf section for economics and computing books", prompt: "What call number and shelf stack should I look for Co-operative Economics?" },
                    { title: "Format Reference (APA 7th)", desc: "Generate complete citation for an audited financial report", prompt: "How do I format an institutional annual report in APA 7th edition citation style?" },
                    { title: "Methodology Recommendation", desc: "Suggest sample size and regression design for survey", prompt: "Recommend an empirical methodology and sample size for testing farmer loan repayment velocity." },
                    { title: "Plagiarism Pre-Check Advice", desc: "Tips to ensure zero similarity match on final thesis", prompt: "What are best practices for avoiding accidental plagiarism in an HND dissertation literature review?" },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => setIsAiOpen(true)}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition space-y-2 group shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">{card.title}</span>
                        <Sparkles size={14} className="text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => setIsAiOpen(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center gap-2 transition"
                  >
                    <Bot size={18} /> Launch Interactive AI Librarian Chat
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            /* ============================================================== */
            /* 6. NOTIFICATIONS                                               */
            /* ============================================================== */
            <NotificationCenter user={user} />
          ) : activeTab === 'profile' ? (
            /* ============================================================== */
            /* 7. PROFILE                                                     */
            /* ============================================================== */
            <StudentPatronProfile
              user={user}
              loans={loans}
              books={books}
              onRenewLoan={onRenewLoan}
              onPayFine={onPayFine}
              onOpenReader={(b) => setActiveBookForReader(b)}
            />
          ) : activeTab === 'kiosk' ? (
            <SelfServiceKiosk
              books={books}
              loans={loans}
              currentUser={user}
              onClose={() => handleTabSwitch('home')}
            />
          ) : activeTab === 'barcode_studio' ? (
            <BarcodeQrStudio
              user={user}
              books={books}
              patrons={[user]}
            />
          ) : activeTab === 'clearance' ? (
            <GraduationClearance user={user} loans={loans} />
          ) : activeTab === 'rooms' ? (
            <StudyRoomBooking user={user} />
          ) : activeTab === 'ill' ? (
            <InterLibraryLoan user={user} />
          ) : activeTab === 'communication' ? (
            <div className="animate-fadeIn">
              <InstitutionalCommunicationHub
                currentRole="student"
                currentUser={{
                  name: user?.name || 'Wale Olonade',
                  matric: user?.matric || 'FCC/CEM/2024/042',
                  dept: user?.department || 'Co-operative Economics & Management'
                }}
                allowRoleSwitching={true}
              />
            </div>
          ) : (
            <HelpdeskTickets user={user} />
          )}
        </main>
      </div>

      {/* Global Book Details & Citation Modal */}
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
