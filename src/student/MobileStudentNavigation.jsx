import React, { useState } from 'react';
import {
  Home, Search, BookOpen, Layers, Globe, User, Bell, Menu, X,
  Bot, Sparkles, QrCode, FileText, Compass, Quote, GraduationCap,
  DoorOpen, Award, Barcode, MessageSquare, Printer, Fingerprint,
  ChevronRight, LogOut, Check, Zap, Library, Database, Clock,
  Smartphone, Monitor, Tablet
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function MobileStudentNavigation({
  user,
  activeTab,
  onTabSwitch,
  onOpenAi,
  onLogout,
  dueSoonCount = 0,
  isHnd2 = false,
  onOpenIdCard,
  onOpenBiometrics,
  deviceMode = 'auto',
  onChangeDeviceMode = () => {}
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Core Bottom Dock destinations (5 thumb-ergonomic tabs)
  const bottomNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      badge: null
    },
    {
      id: 'library_search',
      label: 'Catalog',
      icon: Search,
      badge: null
    },
    {
      id: 'my_borrowed',
      label: 'My Loans',
      icon: BookOpen,
      badge: dueSoonCount > 0 ? dueSoonCount : null,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'research_hnd_projects',
      label: 'Research',
      icon: FileText,
      badge: isHnd2 ? 'HND2' : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null
    }
  ];

  const handleSelectTab = (tabId) => {
    sounds.playClick();
    onTabSwitch(tabId);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. MOBILE TOP APP BAR (Sticky header with college branding)   */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#032317]/95 backdrop-blur-xl border-b border-emerald-800/60 px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-2.5">
        {/* Left: Crest & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#021810] border border-emerald-500/50 p-0.5 flex items-center justify-center shrink-0 shadow-md">
            <img
              src="/assets/fcc-logo.png"
              alt="FCC Crest"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white leading-tight truncate flex items-center gap-1.5">
              <span>FCC Ibadan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono leading-none truncate">
              {user?.matric || 'Scholar Mobile'}
            </div>
          </div>
        </div>

        {/* Right Actions: Search Pill + Notification + Desktop Switcher + Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Switch to Desktop View */}
          <button
            onClick={() => {
              sounds.playClick();
              onChangeDeviceMode('desktop');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-300 hover:text-white transition flex items-center gap-1.5 text-[11px] font-bold shadow-md cursor-pointer active:scale-95"
            title="Switch back to Desktop View"
            aria-label="Switch back to Desktop View"
          >
            <Monitor size={14} className="text-emerald-400" />
            <span>Desktop</span>
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => handleSelectTab('library_search')}
            className={`p-2 rounded-xl transition border ${
              activeTab === 'library_search'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#021810] text-emerald-300 border-emerald-800/80 hover:text-white'
            }`}
            title="Search Catalog"
            aria-label="Search Catalog"
          >
            <Search size={16} />
          </button>

          {/* Digital PVC Card Trigger */}
          {onOpenIdCard && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenIdCard();
              }}
              className="p-2 rounded-xl bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800/80 transition"
              title="Digital Student ID Card"
              aria-label="Digital Student ID Card"
            >
              <QrCode size={16} />
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={() => handleSelectTab('notifications')}
            className={`p-2 rounded-xl transition border relative ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#021810] text-emerald-300 border-emerald-800/80 hover:text-white'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {dueSoonCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* Drawer Menu Trigger */}
          <button
            onClick={() => {
              sounds.playClick();
              setDrawerOpen(!drawerOpen);
            }}
            className={`p-2 rounded-xl transition border ${
              drawerOpen
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#021810] text-emerald-300 border-emerald-800/80 hover:text-white'
            }`}
            title="Open Services Menu"
            aria-label="Open Services Menu"
          >
            {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* Floating Desktop Switcher for quick 1-tap exit from mobile view */}
      <div className="fixed bottom-20 left-3 z-40 pointer-events-auto">
        <button
          onClick={() => {
            sounds.playClick();
            onChangeDeviceMode('desktop');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#021810]/95 hover:bg-emerald-950 text-emerald-300 border border-emerald-600/80 shadow-2xl text-[11px] font-bold backdrop-blur-md transition hover:scale-105 active:scale-95"
          title="Switch to Desktop View"
        >
          <Monitor size={12} className="text-emerald-400" />
          <span>Desktop View</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. FLOATING ACTION BUTTON (FAB): ASK AI LIBRARIAN             */}
      {/* ============================================================== */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenAi();
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/30 border border-emerald-200/50 hover:scale-105 active:scale-95 transition-all animate-pulse-subtle"
          title="Ask AI Librarian"
        >
          <Bot size={17} className="text-slate-950" />
          <span className="tracking-wide">Ask AI</span>
          <Sparkles size={13} className="text-slate-950 animate-spin" style={{ animationDuration: '6s' }} />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION DOCK (Thumb Ergonomics)           */}
      {/* ============================================================== */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 mobile-nav-dock pb-safe px-2 py-1.5 flex items-center justify-around select-none"
        aria-label="Mobile Bottom Navigation"
      >
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'library_search' && activeTab.startsWith('library')) ||
            (item.id === 'my_borrowed' && activeTab.startsWith('my_')) ||
            (item.id === 'research_hnd_projects' && activeTab.startsWith('research'));

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all relative group ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-emerald-300/70 hover:text-emerald-100'
              }`}
            >
              {/* Active Tab Glow Pill */}
              {isActive && (
                <div className="absolute inset-0 bg-emerald-600/30 rounded-2xl border border-emerald-500/40 tab-active-glow" />
              )}

              {/* Icon with alert badge */}
              <div className="relative z-10">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? 'text-emerald-400 scale-110' : 'group-active:scale-95'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-black font-mono text-white ${
                      item.badgeColor || 'bg-emerald-600'
                    } shadow`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight relative z-10 truncate max-w-[64px] ${
                  isActive ? 'text-emerald-200 font-bold' : 'text-emerald-300/70 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================== */}
      {/* 4. SLIDE-UP MOBILE SERVICES DRAWER (Comprehensive Menu Sheet) */}
      {/* ============================================================== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet Content */}
          <div className="relative z-10 bg-[#021810] border-t-2 border-emerald-500/50 rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-5 animate-slide-up pb-24">
            {/* Sheet Handle */}
            <div className="flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-emerald-800" />
            </div>

            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#032317] border border-emerald-500/40 p-1 flex items-center justify-center">
                  <img
                    src="/assets/fcc-logo.png"
                    alt="FCC Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{user?.name || 'Scholar'}</h3>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    {user?.matric} • <span className="text-amber-400 font-bold">{user?.level || 'HND II'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Device Mode Switcher (Allows testing responsive views on any screen) */}
            <div className="p-3 rounded-2xl bg-[#032317] border border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-200 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-emerald-400" />
                  <span>Display Mode Preview</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase">{deviceMode}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {[
                  { mode: 'auto', label: 'Auto', icon: Zap },
                  { mode: 'mobile', label: 'Phone', icon: Smartphone },
                  { mode: 'tablet', label: 'Tablet', icon: Tablet },
                  { mode: 'desktop', label: 'Desktop', icon: Monitor },
                ].map(opt => {
                  const OptIcon = opt.icon;
                  const isSelected = deviceMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        sounds.playClick();
                        onChangeDeviceMode(opt.mode);
                      }}
                      className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-[#021810] text-emerald-300 hover:text-white border border-emerald-900'
                      }`}
                    >
                      <OptIcon size={12} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Library & Discovery Stacks */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                1. Institutional Catalog & Books
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'library_search', label: 'Catalog Search', icon: Search },
                  { id: 'library_books', label: 'Physical Stacks', icon: BookOpen },
                  { id: 'library_ebooks', label: 'eBooks Repository', icon: Layers },
                  { id: 'library_journals', label: 'Academic Journals', icon: Globe },
                  { id: 'library_digital', label: 'Digital Resources', icon: GraduationCap },
                  { id: 'course_reserves', label: 'Course Reading Lists', icon: BookOpen },
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                          : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70 hover:bg-emerald-900/40'
                      }`}
                    >
                      <ItemIcon size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: External Open Repositories (APIs) */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" />
                <span>2. Live Federated Repositories</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'library_discover', label: 'API Overlay Discover', icon: Zap },
                  { id: 'library_google_books', label: 'Google Books', icon: Sparkles },
                  { id: 'library_openlibrary', label: 'Open Library', icon: Globe },
                  { id: 'library_archive', label: 'Internet Archive', icon: Library },
                  { id: 'library_gutendex', label: 'Project Gutenberg', icon: Globe },
                  { id: 'library_lms', label: 'Thetechguy44 API', icon: Database },
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                          : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70 hover:bg-emerald-900/40'
                      }`}
                    >
                      <ItemIcon size={16} className={isActive ? 'text-white' : 'text-amber-400'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Research, Dissertations & Citations */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-400" />
                <span>3. Research & Dissertation Center</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'research_hnd_projects', label: 'Past Dissertations', icon: FileText, badge: 'HND2' },
                  { id: 'research_papers', label: 'Scholarly Papers', icon: Globe },
                  { id: 'research_topics', label: 'Vetted Project Topics', icon: Compass },
                  { id: 'research_references', label: 'Citation Builder', icon: Quote },
                ].map(item => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-2 transition text-left border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow'
                          : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70 hover:bg-emerald-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ItemIcon size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Campus Services & Desk Utilities */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
                4. Campus Desks & Smart Tools
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSelectTab('rooms')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                    activeTab === 'rooms'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70'
                  }`}
                >
                  <DoorOpen size={16} className="text-emerald-400" />
                  <span>Study Rooms</span>
                </button>

                <button
                  onClick={() => handleSelectTab('clearance')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                    activeTab === 'clearance'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70'
                  }`}
                >
                  <Award size={16} className="text-emerald-400" />
                  <span>Grad Clearance</span>
                </button>

                <button
                  onClick={() => handleSelectTab('helpdesk')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                    activeTab === 'helpdesk'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70'
                  }`}
                >
                  <MessageSquare size={16} className="text-emerald-400" />
                  <span>Ask a Librarian</span>
                </button>

                <button
                  onClick={() => handleSelectTab('barcode_studio')}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 transition text-left border ${
                    activeTab === 'barcode_studio'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-[#032317]/80 text-emerald-200 border-emerald-800/70'
                  }`}
                >
                  <Barcode size={16} className="text-emerald-400" />
                  <span>Barcode Studio</span>
                </button>

                {onOpenIdCard && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenIdCard();
                      setDrawerOpen(false);
                    }}
                    className="p-3 rounded-2xl flex items-center gap-2.5 bg-[#032317]/80 text-emerald-200 border border-emerald-800/70 text-left"
                  >
                    <Printer size={16} className="text-emerald-400" />
                    <span>PVC Card Studio</span>
                  </button>
                )}

                {onOpenBiometrics && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenBiometrics();
                      setDrawerOpen(false);
                    }}
                    className="p-3 rounded-2xl flex items-center gap-2.5 bg-[#032317]/80 text-emerald-200 border border-emerald-800/70 text-left"
                  >
                    <Fingerprint size={16} className="text-emerald-400" />
                    <span>Turnstile Gate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onLogout();
                }}
                className="w-full py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <LogOut size={16} />
                <span>Sign Out of Scholar Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
