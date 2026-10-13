import React, { useState } from 'react';
import {
  Home, Search, BookOpen, Layers, Globe, User, Bell,
  Bot, Sparkles, QrCode, FileText, Compass, Quote, GraduationCap,
  DoorOpen, Award, Barcode, MessageSquare, Printer, Fingerprint,
  LogOut, Zap, Library, Database, Clock, ChevronRight, X,
  Smartphone, Monitor, Tablet
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function TabletStudentNavigation({
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
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);

  const railItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library_search', label: 'Catalog', icon: Search },
    { id: 'my_borrowed', label: 'Loans', icon: BookOpen, badge: dueSoonCount > 0 ? dueSoonCount : null },
    { id: 'research_hnd_projects', label: 'Research', icon: FileText, badge: isHnd2 ? 'HND2' : null },
    { id: 'library_discover', label: 'APIs', icon: Zap },
    { id: 'ai_assistant', label: 'AI Desk', icon: Bot, isAi: true },
    { id: 'profile', label: 'Pass', icon: User },
  ];

  const handleSelectTab = (tabId) => {
    sounds.playClick();
    onTabSwitch(tabId);
    setToolsDrawerOpen(false);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. TABLET COMPACT LEFT NAVIGATION RAIL (72px wide)            */}
      {/* ============================================================== */}
      <aside className="w-20 tablet-nav-rail shrink-0 flex flex-col justify-between items-center py-3 border-r border-emerald-800/60 sticky top-0 h-screen z-30 select-none">
        {/* Top: Institution Crest */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl bg-[#021810] border border-emerald-500/50 p-1 flex items-center justify-center shadow-lg shadow-emerald-950/80">
            <img
              src="/assets/fcc-logo.png"
              alt="FCC Crest"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <span className="text-[9px] font-black text-emerald-400 font-mono tracking-tighter">FCC</span>
        </div>

        {/* Center: Rail Navigation Icons */}
        <nav className="flex flex-col items-center gap-2 w-full px-2 my-auto" aria-label="Tablet Navigation Rail">
          {railItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'library_search' && (activeTab === 'library_search' || activeTab === 'library_books' || activeTab === 'library_ebooks')) ||
              (item.id === 'my_borrowed' && activeTab.startsWith('my_')) ||
              (item.id === 'research_hnd_projects' && activeTab.startsWith('research'));

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAi) {
                    sounds.playClick();
                    onOpenAi();
                  } else {
                    handleSelectTab(item.id);
                  }
                }}
                className={`w-full py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all relative group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950 tab-active-glow'
                    : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
                }`}
                title={item.label}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-300 rounded-r-full" />
                )}

                <div className="relative">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-emerald-400'} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8.5px] font-black font-mono bg-rose-500 text-white shadow">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9.5px] mt-1 tracking-tight truncate max-w-[60px]">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Campus Desks / Tools Trigger */}
          <button
            onClick={() => {
              sounds.playClick();
              setToolsDrawerOpen(!toolsDrawerOpen);
            }}
            className={`w-full py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition text-emerald-300/70 hover:text-white hover:bg-emerald-900/40 ${
              toolsDrawerOpen ? 'bg-emerald-800 text-white' : ''
            }`}
            title="More Campus Tools"
          >
            <Layers size={18} className="text-emerald-400" />
            <span className="text-[9px] mt-0.5 tracking-tight">Tools</span>
          </button>
        </nav>

        {/* Bottom: Desktop Switcher & User Avatar / Sign Out */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-emerald-900/60 w-full px-2">
          {/* Switch back to Desktop View */}
          <button
            onClick={() => {
              sounds.playClick();
              onChangeDeviceMode('desktop');
            }}
            className="w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 hover:text-white transition shadow text-[9px] font-bold cursor-pointer"
            title="Switch back to Desktop View"
          >
            <Monitor size={15} className="text-emerald-400" />
            <span className="mt-0.5">Desktop</span>
          </button>

          {onOpenIdCard && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenIdCard();
              }}
              className="p-2 rounded-xl bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800/80 transition"
              title="Digital Student ID Card"
            >
              <QrCode size={16} />
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onLogout();
            }}
            className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-900/60 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. TABLET EXPANDABLE TOOLS FLYOUT DRAWER                      */}
      {/* ============================================================== */}
      {toolsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setToolsDrawerOpen(false)}
          />

          {/* Flyout panel from left rail */}
          <div className="relative z-10 w-80 bg-[#021810] border-r border-emerald-800/80 h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn ml-20">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white">Campus Desks & Tools</h3>
                </div>
                <button
                  onClick={() => setToolsDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Display Mode Preview in Tablet Flyout */}
              <div className="p-3 rounded-2xl bg-[#032317] border border-emerald-800/80 space-y-2">
                <span className="text-[11px] font-bold text-emerald-200 block">Tablet Layout Preview</span>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {[
                    { mode: 'auto', label: 'Auto' },
                    { mode: 'mobile', label: 'Phone' },
                    { mode: 'tablet', label: 'Tablet' },
                    { mode: 'desktop', label: 'Desktop' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => onChangeDeviceMode(opt.mode)}
                      className={`py-1 rounded-lg font-semibold transition ${
                        deviceMode === opt.mode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#021810] text-emerald-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools List */}
              <div className="space-y-1">
                {[
                  { id: 'course_reserves', label: 'Course Reading Lists', icon: BookOpen },
                  { id: 'rooms', label: 'Study Rooms Booking', icon: DoorOpen },
                  { id: 'clearance', label: 'Graduation Clearance', icon: Award },
                  { id: 'barcode_studio', label: 'Barcode & QR Studio', icon: Barcode },
                  { id: 'helpdesk', label: 'Ask a Librarian', icon: MessageSquare },
                  { id: 'library_google_books', label: 'Google Books API', icon: Sparkles },
                  { id: 'library_openlibrary', label: 'Open Library Archive', icon: Globe },
                  { id: 'library_archive', label: 'Internet Archive', icon: Library },
                  { id: 'library_gutendex', label: 'Project Gutenberg', icon: Globe },
                  { id: 'library_lms', label: 'Thetechguy44 Library API', icon: Database },
                ].map(tool => {
                  const ToolIcon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleSelectTab(tool.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs transition border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                          : 'bg-[#032317]/60 text-emerald-200 border-emerald-900/60 hover:bg-emerald-900/40'
                      }`}
                    >
                      <ToolIcon size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-900/60 text-center text-[10px] text-emerald-400/60 font-mono">
              FCC IBADAN TABLET SUITE v5.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
