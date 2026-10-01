import React, { useState, useEffect } from 'react';
import {
  Link2, Compass, Copy, Check, ChevronUp, ChevronDown, Sparkles,
  ExternalLink, FileText, BookOpen, Shield, GraduationCap, ArrowRight,
  Search, Hash, Layers, Code, Zap
} from 'lucide-react';
import {
  SYSTEM_ROUTES,
  parseCurrentRoute,
  navigateTo,
  getPermalink,
  copyToClipboardWithFeedback,
  getActionUri
} from '../utils/router';
import { sounds } from '../utils/soundEffects';

export default function RouteTracerHUD({
  books = [],
  currentUser = null,
  onNavigateDirect = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSitemap, setShowSitemap] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/opac');
  const [customJumpInput, setCustomJumpInput] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [sitemapSearch, setSitemapSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '#/opac');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleCopyCurrent = () => {
    copyToClipboardWithFeedback(window.location.href, (success) => {
      if (success) {
        sounds.playClick();
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2000);
      }
    });
  };

  const handleDirectJump = (path, params = {}) => {
    sounds.playClick();
    navigateTo(path, params);
    setShowSitemap(false);
    if (onNavigateDirect) onNavigateDirect(path, params);
  };

  const handleCustomJumpSubmit = (e) => {
    e.preventDefault();
    if (!customJumpInput.trim()) return;
    let target = customJumpInput.trim();
    if (target.startsWith('#')) target = target.slice(1);
    const [p, q] = target.split('?');
    const params = {};
    if (q) {
      new URLSearchParams(q).forEach((v, k) => { params[k] = v; });
    }
    handleDirectJump(p, params);
    setCustomJumpInput('');
  };

  // Compile Comprehensive Catalog of Files and Action URIs
  const fileAndBookLinks = [
    ...books.slice(0, 8).map(b => ({
      uri: `#/book/${b.id}`,
      label: `Book: ${b.title}`,
      category: 'Catalog Books',
      desc: `Direct permalink to ${b.title} by ${b.author} [ISBN: ${b.isbn}]`
    })),
    ...books.slice(0, 4).map(b => ({
      uri: `#/reader/${b.id}`,
      label: `E-Reader: ${b.title}`,
      category: 'E-Books',
      desc: `Direct chapter reading viewer for ${b.title}`
    })),
    {
      uri: '#/scholar/theses?id=TH-2024-001',
      label: 'Thesis File: Decentralized Agricultural Credit Unions',
      category: 'Theses Files',
      desc: 'Adeyemi & Ogundipe (2024) Capstone Repository PDF'
    },
    {
      uri: '#/scholar/theses?id=TH-2024-002',
      label: 'Thesis File: Automated Micro-Finance Loan Default Detection',
      category: 'Theses Files',
      desc: 'Babatunde & Olanrewaju (2024) ML Research PDF'
    },
    {
      uri: '#/file/certificate/clearance?matric=FCC-CEM-2024-042',
      label: 'Official Clearance Certificate (Wale Olonade)',
      category: 'Official Documents',
      desc: 'Printable Accredited Institutional Clearance Certificate'
    },
    {
      uri: '#/file/certificate/accreditation?ref=NBTE-2024-FCC-A',
      label: 'NBTE Institutional Accreditation Certificate (Grade A)',
      category: 'Official Documents',
      desc: 'National Board for Technical Education Official Credential'
    },
    {
      uri: '#/file/card/pvc?matric=FCC-CEM-2024-042',
      label: 'PVC Smart NFC Library ID Card Studio',
      category: 'Official Documents',
      desc: 'Dual-sided ISO/IEC 14443 NFC Library PVC Card'
    },
    {
      uri: '#/admin/marc?id=FCC-B001',
      label: 'MARC21 Record Export (.MRC): Co-op Management',
      category: 'Bibliographic Files',
      desc: 'Binary MARC 21 machine-readable record download'
    }
  ];

  const allDirectoryItems = [
    ...SYSTEM_ROUTES.map(r => ({
      uri: `#${r.path}`,
      label: r.label,
      category: r.category,
      desc: r.desc
    })),
    ...fileAndBookLinks
  ];

  const filteredItems = allDirectoryItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = sitemapSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      item.label.toLowerCase().includes(q) ||
      item.uri.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Public', 'Auth', 'Scholar', 'HOD', 'Admin', 'Catalog Books', 'E-Books', 'Theses Files', 'Official Documents', 'Bibliographic Files'];

  return (
    <>
      {/* Docked Interactive Route & Link Tracer HUD Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/80 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Active Route Display with Trace Indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
              <Compass size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
              TRACE ACTIVE
            </span>
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-mono text-[11px] truncate max-w-xs sm:max-w-md md:max-w-lg">
              <Link2 size={12} className="text-emerald-400 shrink-0" />
              <span className="text-slate-400 select-all truncate">{window.location.origin}{window.location.pathname}</span>
              <span className="text-emerald-300 font-bold select-all shrink-0">{currentHash}</span>
            </div>

            <button
              id="hud-copy-btn"
              onClick={handleCopyCurrent}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-[11px] transition shadow"
              title="Copy active page trace link"
            >
              {copiedSuccess ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedSuccess ? 'Copied Link' : 'Copy Trace URI'}</span>
            </button>
          </div>

          {/* Quick Jump & Full Route Directory Triggers */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleCustomJumpSubmit} className="hidden lg:flex items-center gap-1">
              <input
                type="text"
                value={customJumpInput}
                onChange={(e) => setCustomJumpInput(e.target.value)}
                placeholder="Jump to URI (e.g. #/book/FCC-B002)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 xl:w-60"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono font-bold"
              >
                Go
              </button>
            </form>

            <button
              id="hud-open-sitemap-btn"
              onClick={() => {
                sounds.playClick();
                setShowSitemap(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-lg shadow-indigo-900/40 transition"
            >
              <Layers size={13} />
              <span>Trace Directory & Sitemap</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-[10px] font-mono">
                {allDirectoryItems.length}+ URIs
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Trace Directory & Sitemap Modal */}
      {showSitemap && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-indigo-700 text-white shadow-lg">
                  <Compass size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Universal Link Address & Trace Directory
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-normal">
                      100% Traceable Architecture
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Every page, modal, thesis file, digital book chapter, and administrative tool has a permanent traceable address.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSitemap(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={sitemapSearch}
                  onChange={(e) => setSitemapSearch(e.target.value)}
                  placeholder="Filter URI, file name, or action..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Directory Items Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No trace addresses matching your query.
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition">
                          {item.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-1.5">{item.desc}</p>
                      
                      {/* Copyable Trace Address */}
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
                          {item.uri}
                        </code>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          const full = getPermalink(item.uri.replace('#', ''));
                          copyToClipboardWithFeedback(full, () => {
                            sounds.playClick();
                            alert(`Copied: ${full}`);
                          });
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 font-mono transition"
                        title="Copy direct permalink"
                      >
                        <Copy size={13} />
                        <span className="text-[11px]">Copy Link</span>
                      </button>

                      <button
                        onClick={() => {
                          const [pathPart, queryPart] = item.uri.replace('#', '').split('?');
                          const params = {};
                          if (queryPart) {
                            new URLSearchParams(queryPart).forEach((v, k) => { params[k] = v; });
                          }
                          handleDirectJump(pathPart, params);
                        }}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                      >
                        <span>Jump to Page</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                Showing {filteredItems.length} of {allDirectoryItems.length} registered URI endpoints
              </span>
              <button
                onClick={() => setShowSitemap(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
