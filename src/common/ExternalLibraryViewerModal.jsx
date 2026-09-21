import React, { useState } from 'react';
import {
  X, ExternalLink, Globe, ShieldCheck, Search, RefreshCw,
  Maximize2, Minimize2, ArrowLeft, ArrowRight, Lock, Key,
  Sparkles, CheckCircle2, Copy, Check, Building2, BookOpen
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import TraceBadge from './TraceBadge';
import { copyToClipboardWithFeedback, getPermalink } from '../utils/router';

export default function ExternalLibraryViewerModal({
  library,
  user = null,
  onClose
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeSrc, setIframeSrc] = useState(library?.opacUrl || library?.url || 'https://openlibrary.org');
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  if (!library) return null;

  const handleSearchInPartner = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sounds.playClick();
    
    // Construct search URL depending on partner
    let targetSearch = library.opacUrl || library.url;
    const q = encodeURIComponent(searchQuery.trim());
    if (targetSearch.includes('openlibrary.org')) {
      targetSearch = `https://openlibrary.org/search?q=${q}`;
    } else if (targetSearch.includes('doabooks.org')) {
      targetSearch = `https://directory.doabooks.org/discover?query=${q}`;
    } else if (targetSearch.includes('catalog.loc.gov')) {
      targetSearch = `https://catalog.loc.gov/vwebv/search?searchArg=${q}&searchCode=GKEY%5E*&searchType=0&recCount=25`;
    } else if (targetSearch.includes('pmc.ncbi.nlm.nih.gov') || targetSearch.includes('ncbi.nlm.nih.gov')) {
      targetSearch = `https://pmc.ncbi.nlm.nih.gov/?term=${q}`;
    } else {
      targetSearch = `${targetSearch}?q=${q}`;
    }
    setIframeSrc(targetSearch);
    setIframeKey(k => k + 1);
  };

  const handleReload = () => {
    sounds.playClick();
    setIframeKey(k => k + 1);
  };

  const handleCopy = () => {
    copyToClipboardWithFeedback(library.opacUrl || library.url, (success) => {
      if (success) {
        sounds.playClick();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div className={`bg-slate-900 border border-slate-700/80 w-full rounded-3xl shadow-2xl shadow-black flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'h-screen rounded-none border-none' : 'max-w-6xl h-[92vh]'
      }`}>
        
        {/* Top Institutional Pass-Through Bar */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border-b border-indigo-800/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white flex items-center gap-1.5 font-sans">
              <Building2 size={14} className="text-indigo-400" />
              {library.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700 font-mono">
              {library.category || 'Institutional Partner'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="hidden sm:inline text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} /> Full Student Access Granted
            </span>
            {user && (
              <span className="hidden md:inline text-slate-400 font-mono">
                Student ID: <strong className="text-white">{user.matric}</strong>
              </span>
            )}
            <TraceBadge uri={library.opacUrl || library.url} label="Partner URL" />
          </div>
        </div>

        {/* Live Browser Navigation & Search Toolbar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Address & Quick Search in Partner Library */}
          <form onSubmit={handleSearchInPartner} className="flex-1 min-w-[280px] max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search catalog in ${library.name} (e.g. Accounting, Python, Agribusiness)...`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1 shrink-0"
            >
              <span>Search Library</span>
            </button>
          </form>

          {/* Browser Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Reload Page"
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Copy Direct Library Link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>

            <a
              href={iframeSrc}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
              title="Open full external window in browser"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open In New Window</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition ml-1"
              title="Close Portal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Student Access Instructions Ribbon */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Access Protocol:</span>
            <span className="text-slate-200 font-mono text-[11px]">{library.protocol || 'OAI-PMH / Web OPAC'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 text-[11px]">
              {library.accessInstructions || library.description || 'Full open access privileges enabled for FCC students.'}
            </span>
          </div>

          <div className="text-[11px] text-indigo-400 font-mono">
            Holdings: {library.holdingsCount || '1,000,000+ Records'}
          </div>
        </div>

        {/* Embedded Live Interactive Frame & Content Canvas */}
        <div className="flex-1 bg-slate-950 relative w-full h-full overflow-hidden flex flex-col">
          <iframe
            key={iframeKey}
            src={iframeSrc}
            title={library.name}
            className="w-full flex-1 border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            loading="lazy"
          />

          {/* Bottom Fallback / Live Status Dock */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2 truncate max-w-md">
              <Globe size={13} className="text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] truncate text-slate-300">{iframeSrc}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                If the external site blocks in-app framing, click 👉
              </span>
              <a
                href={iframeSrc}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow"
              >
                <ExternalLink size={12} /> Launch External Direct Tab
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
