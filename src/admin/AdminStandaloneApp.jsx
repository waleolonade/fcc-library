import React, { useState, useEffect } from 'react';
import {
  Shield, RefreshCw, Database, Globe, ShoppingBag, MapPin,
  BarChart3, FileText, LogOut, Sparkles, Layers, BookOpen,
  Award, Newspaper, Printer, Link2, Building2, FileUp, Key,
  Lock, ArrowRight, UserCheck, Search, Command, Activity, Bot,
  Users, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Zap, Bell, HelpCircle, Laptop, Cpu, ArrowUpRight
} from 'lucide-react';
import { INSTITUTION, BRANCHES } from '../data/institutionalSeedData';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

// Admin Submodules
import AdminExecutiveDashboard from './AdminExecutiveDashboard';
import CirculationDesk from './CirculationDesk';
import MarcCataloguer from './MarcCataloguer';
import ResearchIngestion from './ResearchIngestion';
import AcquisitionsManager from './AcquisitionsManager';
import ShelfAuditMap from './ShelfAuditMap';
import InstitutionalAnalytics from './InstitutionalAnalytics';
import AuditLogViewer from './AuditLogViewer';
import AccreditationAuditor from './AccreditationAuditor';
import SerialsManager from './SerialsManager';
import ExternalLinksManager from './ExternalLinksManager';
import PartnerLibrariesManager from './PartnerLibrariesManager';
import PdfUploadManager from './PdfUploadManager';
import AdminPatronManager from './AdminPatronManager';
import AdminApprovalCenter from './AdminApprovalCenter';
import AdminSystemHealth from './AdminSystemHealth';
import AdminReportsBi from './AdminReportsBi';
import AdminAiManager from './AdminAiManager';
import AdminDatabaseManager from './AdminDatabaseManager';
import AdminCommandPalette from './AdminCommandPalette';
import DigitalBookReader from '../common/DigitalBookReader';

export default function AdminStandaloneApp() {
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('fcc_admin_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return hash || tabParam || 'dashboard';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All Libraries');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // App Data State
  const [books, setBooks] = useState([]);
  const [partnerLibraries, setPartnerLibraries] = useState([]);
  const [loans, setLoans] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [theses, setTheses] = useState([]);
  const [acquisitions, setAcquisitions] = useState([]);
  const [activeBookForReader, setActiveBookForReader] = useState(null);

  // Admin Auth Inputs
  const [loginEmail, setLoginEmail] = useState('librarian@fccibadan.edu.ng');
  const [loginPin, setLoginPin] = useState('9999');
  const [authError, setAuthError] = useState('');

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshDataFromApi = async () => {
    const [b, p, l, pat, th, acq] = await Promise.all([
      libraryApi.catalog.getAll(selectedBranch === 'All Libraries' ? null : selectedBranch),
      libraryApi.partnerLibraries.getAll(),
      libraryApi.loans.getAll(),
      libraryApi.patrons.getAll(),
      libraryApi.theses.getAll(),
      libraryApi.acquisitions.getAll()
    ]);
    setBooks(b);
    setPartnerLibraries(p);
    setLoans(l);
    setPatrons(pat);
    setTheses(th);
    setAcquisitions(acq);
  };

  useEffect(() => {
    refreshDataFromApi();

    const unsubscribe = libraryApi.subscribe(() => {
      refreshDataFromApi();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDataFromApi();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshDataFromApi);

    const interval = setInterval(() => {
      refreshDataFromApi();
    }, 4000);

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshDataFromApi);
      clearInterval(interval);
    };
  }, [selectedBranch]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'librarian@fccibadan.edu.ng' && loginPin === '9999') {
      const user = {
        name: 'Dr. (Mrs) B. A. Adebayo',
        title: 'College Librarian & Chief Cataloguer',
        email: loginEmail,
        role: 'admin',
        dept: 'Library Directorate',
        clearanceLevel: 'Super Admin Level 4'
      };
      setAdminUser(user);
      localStorage.setItem('fcc_admin_session', JSON.stringify(user));
      sounds.playSuccessChime();
      setAuthError('');
    } else {
      sounds.playErrorBuzz();
      setAuthError('Invalid Staff Authority credentials. (Use librarian@fccibadan.edu.ng / PIN: 9999)');
    }
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('fcc_admin_session');
    sounds.playClick();
  };

  const handleUpdatePatronPin = async (matric, newPin) => {
    await libraryApi.patrons.generateOrResetPin(matric, newPin);
    refreshDataFromApi();
  };

  const handleUpdatePolicy = async (role, policyData) => {
    await libraryApi.patrons.updatePolicy(role, policyData);
    refreshDataFromApi();
  };

  const handleApproveThesis = async (thesisId) => {
    await libraryApi.theses.updateStatus(thesisId, 'Published');
    refreshDataFromApi();
  };

  const handleRejectThesis = async (thesisId) => {
    await libraryApi.theses.updateStatus(thesisId, 'Changes Requested');
    refreshDataFromApi();
  };

  const handleApproveAcquisition = async (acqId) => {
    await libraryApi.acquisitions.updateStatus(acqId, 'Approved');
    refreshDataFromApi();
  };

  // Switch tab and update hash
  const navigateToTab = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    setMobileDrawerOpen(false);
    sounds.playClick();
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-900/50">
              <Shield size={32} />
            </div>
            <h1 className="text-xl font-black text-white">{INSTITUTION.shortName} Operations Console</h1>
            <p className="text-xs text-indigo-400 font-mono">Enterprise Library Command & Authority Hub</p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-950 border border-rose-800 text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Staff Institutional Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Staff Authority Security PIN</label>
              <input
                type="password"
                maxLength={4}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono tracking-widest text-center text-base focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition"
            >
              <Key size={15} /> Authenticate Admin Console
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2 text-[11px] text-slate-400">
            <div>Click to Auto-Fill Librarian Credentials:</div>
            <button
              type="button"
              onClick={() => { setLoginEmail('librarian@fccibadan.edu.ng'); setLoginPin('9999'); }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-xs font-semibold"
            >
              Chief Librarian (PIN: 9999)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Categorized Multi-tier Nav Sections
  const navCategories = [
    {
      title: 'Executive Hub',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: Sparkles },
        { id: 'approvals', label: 'Approvals Queue', icon: CheckCircle, badge: theses.filter(t => t.status === 'Submitted').length + acquisitions.filter(a => a.status === 'Pending Dean Approval').length }
      ]
    },
    {
      title: 'Cataloging & Ingestion',
      items: [
        { id: 'pdf_upload', label: 'AI Digital Resource Ingestion', icon: Sparkles },
        { id: 'marc', label: 'MARC 21 & RDA Catalog', icon: Database },
        { id: 'research', label: 'Research Ingestion', icon: Globe },
        { id: 'extlinks', label: 'External Resources', icon: Link2 },
        { id: 'partner_libs', label: 'Linked Consortia Libs', icon: Building2, badge: partnerLibraries.length }
      ]
    },
    {
      title: 'Patrons & Circulation',
      items: [
        { id: 'patrons', label: 'Patrons & PIN Authority', icon: Users, badge: patrons.length },
        { id: 'circulation', label: 'Circulation & Loans', icon: RefreshCw, badge: loans.filter(l => l.status === 'Overdue').length > 0 ? `${loans.filter(l => l.status === 'Overdue').length} overdue` : null },
        { id: 'serials', label: 'Serials & ISSN Periodicals', icon: Newspaper }
      ]
    },
    {
      title: 'Logistics & Compliance',
      items: [
        { id: 'shelves', label: 'Shelf Audit 2D/3D Map', icon: MapPin },
        { id: 'acquisitions', label: 'Acquisitions & Orders', icon: ShoppingBag },
        { id: 'accreditation', label: 'NBTE Accreditation Audit', icon: Award }
      ]
    },
    {
      title: 'Intelligence & Telemetry',
      items: [
        { id: 'database', label: 'Database & SQL Setup', icon: Database, badge: 'SQL' },
        { id: 'reports', label: 'BI & Analytics Studio', icon: BarChart3 },
        { id: 'ai', label: 'AI Librarian RAG Engine', icon: Bot },
        { id: 'health', label: 'System Health & Telemetry', icon: Activity },
        { id: 'audit', label: 'Security & Audit Logs', icon: FileText }
      ]
    }
  ];

  // Find active label for breadcrumb
  let activeLabel = 'Executive Dashboard';
  for (const cat of navCategories) {
    const found = cat.items.find(i => i.id === activeTab);
    if (found) {
      activeLabel = found.label;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. COLLAPSIBLE CATEGORIZED LEFT SIDEBAR (DESKTOP) */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-slate-900 border-r border-slate-800 sticky top-0 h-screen transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Sidebar Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-950 shrink-0">
              <Shield size={20} />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-sm font-black text-white leading-none">{INSTITUTION.shortName} Admin</div>
                <div className="text-[10px] text-indigo-400 font-mono mt-0.5">ILS Command Center</div>
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

        {/* Sidebar Nav Items Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs custom-scrollbar">
          {navCategories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500">
                  {category.title}
                </div>
              )}
              {category.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                            isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-indigo-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User & Status */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {!sidebarCollapsed && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Librarian Authority</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-xs font-bold text-white truncate">{adminUser.name}</div>
              <div className="text-[10px] text-indigo-400 font-mono truncate">{adminUser.clearanceLevel}</div>
            </div>
          )}

          {/* Switch to Student Catalog OPAC */}
          <a
            href="/student.html#/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition shadow-sm"
            title="Open Student Discovery Catalog (student.html#/catalog)"
          >
            <BookOpen size={16} className="shrink-0 text-emerald-400" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Student Catalog</span>
                <ArrowUpRight size={13} className="text-emerald-400" />
              </div>
            )}
          </a>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
          >
            <LogOut size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden flex">
          <div className="w-72 bg-slate-900 h-full p-4 flex flex-col justify-between border-r border-slate-800 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
                    <Shield size={16} />
                  </div>
                  <span className="font-bold text-sm text-white">Admin Command</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[70vh] space-y-4 text-xs">
                {navCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold font-mono text-slate-500 uppercase">{cat.title}</div>
                    {cat.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateToTab(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                            isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon size={15} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-indigo-300">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="/student.html#/catalog"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2"
              >
                <BookOpen size={14} /> Student Catalog OPAC <ArrowUpRight size={13} />
              </a>
              <button
                onClick={handleAdminLogout}
                className="w-full py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Sign Out Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE WITH TOP HEADER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Universal Top Header */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span>Console</span>
                <span>/</span>
                <span className="text-indigo-400 font-bold">{activeLabel}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white truncate leading-none mt-0.5">
                {activeLabel}
              </h1>
            </div>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2 text-xs text-slate-300 flex items-center justify-between transition shadow-inner"
            >
              <div className="flex items-center gap-2.5 text-slate-400">
                <Search size={14} className="text-indigo-400" />
                <span>Quick search actions, patrons, books...</span>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono border border-slate-800 text-slate-400">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Right: Branch Switcher & System Telemetry */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Student Catalog OPAC Direct Launcher */}
            <a
              href="/student.html#/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 font-bold text-xs shadow-sm transition active:scale-95"
              title="Open Student Discovery Catalog (student.html#/catalog)"
            >
              <BookOpen size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Student Catalog OPAC</span>
              <ArrowUpRight size={13} className="text-emerald-400 opacity-80" />
            </a>
            {/* Multi-Branch Campus Selector */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
              <Building2 size={14} className="text-indigo-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer text-xs"
              >
                <option value="All Libraries">All Libraries (Consortia)</option>
                {BRANCHES.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Live Vector Latency Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              24ms
            </div>

            {/* Staff Avatar Dropdown */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow">
                BA
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-bold text-white leading-tight">Dr. Adebayo</div>
                <div className="text-[10px] text-indigo-400 font-mono">Chief Librarian</div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Main Panel */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <AdminExecutiveDashboard
              books={books}
              loans={loans}
              patrons={patrons}
              theses={theses}
              acquisitions={acquisitions}
              partnerLibraries={partnerLibraries}
              selectedBranch={selectedBranch}
              onNavigateTab={navigateToTab}
              onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />
          )}

          {activeTab === 'pdf_upload' && (
            <PdfUploadManager
              books={books}
              setBooks={setBooks}
              onOpenReader={(b) => setActiveBookForReader(b)}
            />
          )}

          {activeTab === 'patrons' && (
            <AdminPatronManager
              patrons={patrons}
              onUpdatePin={handleUpdatePatronPin}
              onUpdatePolicy={handleUpdatePolicy}
            />
          )}

          {activeTab === 'approvals' && (
            <AdminApprovalCenter
              theses={theses}
              acquisitions={acquisitions}
              onApproveThesis={handleApproveThesis}
              onRejectThesis={handleRejectThesis}
              onApproveAcquisition={handleApproveAcquisition}
            />
          )}

          {activeTab === 'circulation' && (
            <CirculationDesk
              books={books}
              setBooks={setBooks}
              loans={loans}
              setLoans={setLoans}
            />
          )}

          {activeTab === 'partner_libs' && (
            <PartnerLibrariesManager
              partnerLibraries={partnerLibraries}
              setPartnerLibraries={setPartnerLibraries}
            />
          )}

          {activeTab === 'extlinks' && (
            <ExternalLinksManager
              books={books}
              setBooks={setBooks}
            />
          )}

          {activeTab === 'marc' && (
            <MarcCataloguer
              books={books}
              setBooks={setBooks}
            />
          )}

          {activeTab === 'research' && (
            <ResearchIngestion
              onImportBook={(newBook) => {
                libraryApi.catalog.uploadPdfBook(newBook);
                refreshDataFromApi();
              }}
            />
          )}

          {activeTab === 'acquisitions' && <AcquisitionsManager />}
          {activeTab === 'serials' && <SerialsManager />}
          {activeTab === 'shelves' && <ShelfAuditMap books={books} />}
          {activeTab === 'accreditation' && <AccreditationAuditor books={books} loans={loans} />}
          {activeTab === 'database' && <AdminDatabaseManager />}
          {activeTab === 'reports' && <AdminReportsBi books={books} loans={loans} />}
          {activeTab === 'health' && <AdminSystemHealth />}
          {activeTab === 'ai' && <AdminAiManager />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </main>
      </div>

      {/* Reader Modal */}
      {activeBookForReader && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto">
          <DigitalBookReader
            book={activeBookForReader}
            onClose={() => setActiveBookForReader(null)}
          />
        </div>
      )}

      {/* Global Command Palette (Ctrl + K) */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={setCommandPaletteOpen}
        onSelectAction={(tabId) => navigateToTab(tabId)}
        books={books}
        patrons={patrons}
      />
    </div>
  );
}
