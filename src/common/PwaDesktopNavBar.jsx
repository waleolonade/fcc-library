import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Link2, Check,
  Monitor, Smartphone, Volume2, VolumeX, Sparkles, ChevronRight,
  ExternalLink, Layers
} from 'lucide-react';
import { usePwaNavigation } from './usePwaNavigation';
import { copyToClipboardWithFeedback } from '../utils/router';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function PwaDesktopNavBar({
  currentUser,
  isMuted = false,
  onToggleAudio,
  onLogout,
  showFloatingQuickNav = true
}) {
  const {
    canGoBack,
    canGoForward,
    previousRoute,
    nextRoute,
    currentRoute,
    isStandalone,
    goBack,
    goForward,
    reload,
    goHome
  } = usePwaNavigation(currentUser);

  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [floatingMinimized, setFloatingMinimized] = useState(() => {
    try {
      return localStorage.getItem('fcc_pwa_floating_nav_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const handleCopyLink = () => {
    copyToClipboardWithFeedback(window.location.href, (success) => {
      if (success) {
        sounds.playClick();
        setCopiedFeedback(true);
        setTimeout(() => setCopiedFeedback(false), 2200);
      }
    });
  };

  const toggleFloatingMinimized = () => {
    const next = !floatingMinimized;
    setFloatingMinimized(next);
    try {
      localStorage.setItem('fcc_pwa_floating_nav_minimized', String(next));
    } catch {}
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. TOP PWA DESKTOP APP NAVIGATION BAR                          */}
      {/* Visible at the very top of all views                           */}
      {/* ============================================================== */}
      <nav
        aria-label="PWA Desktop Navigation Bar"
        className="bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border-b border-emerald-800/60 text-xs py-1.5 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 z-40 shrink-0 select-none shadow-md"
      >
        {/* Left Side: Branding & Desktop Browser Controls (Back, Front, Reload, Home) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* FCC Node Logo & Tag */}
          <div className="flex items-center gap-1.5 shrink-0">
            <img
              src="/assets/fcc-logo.png"
              alt="FCC Logo"
              className="w-5 h-5 object-cover rounded-full shadow-sm ring-1 ring-emerald-400/50 shrink-0"
            />
            <span className="hidden xl:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-400 font-bold hidden md:inline text-[11px]">
              {INSTITUTION.shortName}
            </span>
          </div>

          {/* DESKTOP BROWSER NAVIGATION BUTTONS: BACK & FRONT (FORWARD) */}
          <div className="flex items-center gap-1 bg-[#01140d]/90 p-0.5 rounded-xl border border-emerald-800/80 shadow-inner">
            {/* BACK / PREVIOUS BUTTON */}
            <button
              id="pwa-btn-back"
              onClick={() => goBack()}
              disabled={!canGoBack}
              title={
                canGoBack
                  ? `Go Back to: ${previousRoute?.title || 'Previous Page'} (Alt + ←)`
                  : 'No previous page in history'
              }
              aria-label="Go Back (Previous Page)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-[11px] transition duration-150 ${
                canGoBack
                  ? 'bg-emerald-950/80 hover:bg-emerald-600 text-emerald-200 hover:text-white shadow-sm border border-emerald-700/60 active:scale-95 cursor-pointer'
                  : 'bg-emerald-950/20 text-emerald-600/40 border border-emerald-900/30 cursor-not-allowed'
              }`}
            >
              <ArrowLeft size={13} className={canGoBack ? 'text-emerald-300' : 'text-emerald-700/50'} />
              <span className="font-semibold hidden xs:inline">Back</span>
            </button>

            {/* FRONT / FORWARD BUTTON */}
            <button
              id="pwa-btn-forward"
              onClick={() => goForward()}
              disabled={!canGoForward}
              title={
                canGoForward
                  ? `Go Forward to: ${nextRoute?.title || 'Next Page'} (Alt + →)`
                  : 'No forward page in history'
              }
              aria-label="Go Front (Forward Page)"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-[11px] transition duration-150 ${
                canGoForward
                  ? 'bg-emerald-950/80 hover:bg-emerald-600 text-emerald-200 hover:text-white shadow-sm border border-emerald-700/60 active:scale-95 cursor-pointer'
                  : 'bg-emerald-950/20 text-emerald-600/40 border border-emerald-900/30 cursor-not-allowed'
              }`}
            >
              <span className="font-semibold hidden xs:inline">Front</span>
              <ArrowRight size={13} className={canGoForward ? 'text-emerald-300' : 'text-emerald-700/50'} />
            </button>

            {/* RELOAD / REFRESH BUTTON */}
            <button
              id="pwa-btn-reload"
              onClick={() => reload()}
              title="Refresh / Reload Page (Ctrl + R)"
              aria-label="Reload Page"
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition cursor-pointer"
            >
              <RotateCw size={12} />
            </button>

            {/* HOME BUTTON */}
            <button
              id="pwa-btn-home"
              onClick={() => goHome()}
              title="Return to Home Overview"
              aria-label="Go to Home"
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition cursor-pointer"
            >
              <Home size={12} />
            </button>
          </div>

          {/* Desktop App Mode Badge */}
          {isStandalone ? (
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 font-mono text-[10px] shadow-sm animate-pulse"
              title="Running in Standalone Desktop PWA Mode"
            >
              <Monitor size={11} className="text-emerald-400" />
              <span className="font-bold">DESKTOP PWA</span>
            </div>
          ) : (
            <span className="hidden 2xl:inline text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-mono">
              NBTE GRADE A ACCREDITED
            </span>
          )}
        </div>

        {/* Center: Interactive Omnibar & Traceable URL Address Bar */}
        <div className="flex items-center gap-2 bg-[#01140d]/90 px-2.5 py-1 rounded-xl border border-emerald-900/70 font-mono text-[10px] text-emerald-200 max-w-xs sm:max-w-md lg:max-w-lg truncate shadow-inner">
          <Link2 size={12} className="text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-bold hidden sm:inline shrink-0">
            {currentRoute?.title ? `${currentRoute.title}:` : ''}
          </span>
          <span className="truncate text-emerald-300/90 font-mono font-medium">
            {currentRoute?.hash || window.location.hash || '#/opac'}
          </span>
          <button
            id="btn-copy-trace-url"
            onClick={handleCopyLink}
            className="text-emerald-400 hover:text-emerald-200 font-bold shrink-0 ml-auto pl-1 transition flex items-center gap-0.5"
            title="Copy Direct Link to Clipboard"
          >
            {copiedFeedback ? (
              <>
                <Check size={11} className="text-emerald-300" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </div>

        {/* Right Side: Audio toggle, Quick User controls & Sign out */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-300 text-[11px]">
          {/* Audio toggle button */}
          {onToggleAudio && (
            <button
              id="btn-toggle-audio"
              onClick={onToggleAudio}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
              title={isMuted ? "Unmute Hardware Audio" : "Mute Hardware Audio"}
            >
              {isMuted ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} className="text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? "Muted" : "Audio"}</span>
            </button>
          )}

          {currentUser && (
            <div className="hidden md:flex items-center gap-1.5 pl-1 border-l border-emerald-900/60">
              <span className="text-emerald-400 font-semibold truncate max-w-[120px]">
                {currentUser.name || currentUser.matric || 'Active User'}
              </span>
            </div>
          )}

          {currentUser && onLogout && (
            <button
              id="btn-global-sign-out"
              onClick={onLogout}
              className="text-slate-300 hover:text-white underline font-semibold text-[11px] ml-1"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* ============================================================== */}
      {/* 2. FLOATING DESKTOP QUICK-NAVIGATION PILL                      */}
      {/* Stays accessible when scrolling down or in full-screen views    */}
      {/* ============================================================== */}
      {showFloatingQuickNav && (
        <aside
          aria-label="Floating Desktop Navigation Controls"
          className="fixed bottom-4 left-4 z-50 select-none print:hidden"
        >
          {floatingMinimized ? (
            /* Minimized Pill Toggle */
            <button
              onClick={toggleFloatingMinimized}
              title="Expand Desktop Back/Front Controls"
              className="p-2.5 rounded-full bg-emerald-950/90 text-emerald-300 hover:text-white border border-emerald-600/70 shadow-2xl backdrop-blur-md hover:scale-105 active:scale-95 transition flex items-center justify-center ring-2 ring-emerald-500/20"
            >
              <div className="flex items-center gap-1">
                <ArrowLeft size={13} />
                <ArrowRight size={13} />
              </div>
            </button>
          ) : (
            /* Expanded Floating Navigation Bar */
            <div className="bg-[#021810]/95 backdrop-blur-md border border-emerald-600/60 rounded-2xl p-1.5 px-2.5 shadow-2xl shadow-emerald-950/90 flex items-center gap-1.5 ring-1 ring-emerald-500/30">
              {/* Back Button */}
              <button
                onClick={() => goBack()}
                disabled={!canGoBack}
                title={
                  canGoBack
                    ? `Back to: ${previousRoute?.title || 'Previous Page'} (Alt + ←)`
                    : 'No previous page'
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  canGoBack
                    ? 'bg-emerald-800/80 hover:bg-emerald-600 text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-emerald-950/30 text-emerald-700/50 cursor-not-allowed'
                }`}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              {/* Front / Forward Button */}
              <button
                onClick={() => goForward()}
                disabled={!canGoForward}
                title={
                  canGoForward
                    ? `Front to: ${nextRoute?.title || 'Next Page'} (Alt + →)`
                    : 'No forward page'
                }
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  canGoForward
                    ? 'bg-emerald-800/80 hover:bg-emerald-600 text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-emerald-950/30 text-emerald-700/50 cursor-not-allowed'
                }`}
              >
                <span>Front</span>
                <ArrowRight size={14} />
              </button>

              {/* Reload */}
              <button
                onClick={() => reload()}
                title="Reload Page"
                className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition"
              >
                <RotateCw size={13} />
              </button>

              {/* Home */}
              <button
                onClick={() => goHome()}
                title="Go Home"
                className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition"
              >
                <Home size={13} />
              </button>

              {/* Minimize button */}
              <button
                onClick={toggleFloatingMinimized}
                title="Minimize Floating Navigation Dock"
                className="text-[10px] text-emerald-500 hover:text-emerald-300 ml-1 px-1 py-0.5 rounded hover:bg-emerald-950/60 transition"
              >
                ✕
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
