import React, { useState } from 'react';
import {
  BookOpen, Download, ExternalLink, Play, Music, FileText,
  Lock, Shield, X, AlertTriangle, CheckCircle, Globe, Film,
  Headphones, Link2, Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';

// =========================================================================
// DIGITAL RESOURCE VIEWER
// Supports: PDF, EPUB, Video, Audio, External URL, Institutional Repository
// Access control: restricted resources cannot be downloaded by unauthorized users
// =========================================================================

const RESOURCE_TYPES = {
  pdf: { label: 'PDF Document', icon: FileText, color: 'rose' },
  epub: { label: 'EPUB E-Book', icon: BookOpen, color: 'indigo' },
  video: { label: 'Video Resource', icon: Film, color: 'purple' },
  audio: { label: 'Audio Resource', icon: Headphones, color: 'amber' },
  external_url: { label: 'External Web Resource', icon: Globe, color: 'teal' },
  repository: { label: 'Institutional Repository', icon: Link2, color: 'emerald' },
};

const ACCESS_LEVELS = {
  open: { label: 'Open Access', canRead: true, canDownload: true, color: 'emerald' },
  campus: { label: 'Campus Only', canRead: true, canDownload: true, color: 'indigo' },
  registered: { label: 'Registered Patrons', canRead: true, canDownload: false, color: 'amber' },
  restricted: { label: 'Restricted', canRead: false, canDownload: false, color: 'rose' },
  staff_only: { label: 'Staff Only', canRead: false, canDownload: false, color: 'rose' },
};

function AccessBadge({ level }) {
  const cfg = ACCESS_LEVELS[level] || ACCESS_LEVELS.open;
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[cfg.color]}`}>
      {cfg.canRead ? <CheckCircle size={10} /> : <Lock size={10} />}
      {cfg.label}
    </span>
  );
}

function ResourceTypeBadge({ type }) {
  const cfg = RESOURCE_TYPES[type] || RESOURCE_TYPES.pdf;
  const Icon = cfg.icon;
  const colors = {
    rose: 'bg-rose-500/20 text-rose-300',
    indigo: 'bg-indigo-500/20 text-indigo-300',
    purple: 'bg-purple-500/20 text-purple-300',
    amber: 'bg-amber-500/20 text-amber-300',
    teal: 'bg-teal-500/20 text-teal-300',
    emerald: 'bg-emerald-500/20 text-emerald-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${colors[cfg.color]}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// PDF Viewer Simulation
function PdfViewer({ book, onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const totalPages = book.pdfPages || 100;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-white truncate max-w-xs">{book.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
            <ChevronRight size={14} />
          </button>
          <span className="mx-2 text-slate-700">|</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
            <ZoomIn size={14} />
          </button>
          <span className="px-1.5 text-slate-400 font-mono text-[11px]">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1.5 rounded hover:bg-slate-800 text-slate-300">
            <ZoomOut size={14} />
          </button>
        </div>
      </div>
      {/* Page Area */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div
          className="bg-white shadow-2xl rounded"
          style={{ width: `${(595 * zoom) / 100}px`, minHeight: `${(842 * zoom) / 100}px`, maxWidth: '100%' }}
        >
          <div className="p-8 text-gray-900" style={{ fontSize: `${zoom * 0.12}px` }}>
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
              {book.subtitle && <p className="text-sm text-gray-600 mt-1">{book.subtitle}</p>}
              <p className="text-sm text-gray-500 mt-1">{book.author}</p>
              <p className="text-xs text-gray-400 mt-0.5">{book.publisher} • {book.year} • {book.edition}</p>
            </div>
            {currentPage === 1 && (
              <div className="space-y-4 text-sm text-gray-700">
                <h2 className="text-lg font-semibold text-gray-800">Abstract</h2>
                <p className="leading-relaxed">{book.abstract}</p>
                {book.chapters && book.chapters.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Table of Contents</h2>
                    {book.chapters.map((ch, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 text-sm">
                        <span>{ch.title}</span>
                        <span className="text-gray-400 font-mono">{ch.page}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {currentPage > 1 && (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="text-gray-400 text-xs font-mono">Page {currentPage}</p>
                <p className="leading-relaxed">
                  {book.abstract?.split('. ').slice(0, 3).join('. ')}.
                </p>
                <p className="leading-relaxed text-gray-600">
                  This section continues the discussion from the previous chapter, expanding on the theoretical frameworks and empirical evidence presented in the literature. The author draws from a comprehensive analysis of {book.subject?.toLowerCase()} practices across West African institutions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Player Simulation
function VideoPlayer({ book }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center h-full bg-black gap-4 p-6">
      <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        <button
          onClick={() => setPlaying(!playing)}
          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition ${
            playing ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
          } shadow-xl`}
        >
          {playing ? <X size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
        </button>
        {playing && (
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
            <div className="h-1 bg-slate-700 rounded-full flex-1 relative overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-1/3 animate-pulse" />
            </div>
            <span className="text-xs text-slate-400 font-mono">12:45 / 45:30</span>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-white font-semibold">{book.title}</p>
        <p className="text-slate-400 text-xs mt-1">{book.author}</p>
      </div>
    </div>
  );
}

// Audio Player Simulation
function AudioPlayer({ book }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-950 gap-6 p-8">
      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center shadow-2xl shadow-amber-950">
        <Headphones size={56} className="text-amber-200" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xl font-bold text-white">{book.title}</p>
        <p className="text-amber-400 text-sm">{book.author}</p>
        <p className="text-slate-500 text-xs">{book.publisher} • {book.year}</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <div className="h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
          <div className={`h-full bg-amber-500 rounded-full transition-all ${playing ? 'w-2/5' : 'w-0'}`} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>{playing ? '18:22' : '00:00'}</span>
          <span>1:14:45</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPlaying(!playing)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition ${
              playing ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {playing ? <X size={20} className="text-white" /> : <Play size={20} className="text-white ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// External URL Viewer
function ExternalViewer({ book, url }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-slate-950">
      <div className="w-20 h-20 rounded-2xl bg-teal-600/20 flex items-center justify-center border border-teal-500/30">
        <Globe size={40} className="text-teal-400" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <p className="text-xl font-bold text-white">{book.title}</p>
        <p className="text-slate-400 text-sm">{book.author}</p>
        <p className="text-teal-400 text-xs font-mono break-all mt-2">{url || book.externalUrl || 'https://doi.org/' + book.doi}</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-slate-400 text-sm text-center">This resource is hosted on an external platform.</p>
        <a
          href={url || book.externalUrl || `https://doi.org/${book.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold flex items-center gap-2 shadow-lg transition"
        >
          <ExternalLink size={16} />
          Open External Resource
        </a>
      </div>
    </div>
  );
}

// Access Denied screen
function AccessDenied({ level, onClose }) {
  const cfg = ACCESS_LEVELS[level] || ACCESS_LEVELS.restricted;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-slate-950">
      <div className="w-20 h-20 rounded-2xl bg-rose-600/20 flex items-center justify-center border border-rose-500/30">
        <Lock size={40} className="text-rose-400" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-slate-400 text-sm">
          This resource has <span className="text-rose-400 font-semibold">{cfg.label}</span> access level.
          Your current account does not have permission to view this material.
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 mt-4 text-xs">
          <p className="text-slate-300 font-semibold">To gain access you may:</p>
          <ul className="text-slate-400 space-y-1 list-disc list-inside">
            <li>Contact the Reference Librarian at library@fccibadan.edu.ng</li>
            <li>Submit an Inter-Library Loan (ILL) request</li>
            <li>Visit the Circulation Desk with your library card</li>
          </ul>
        </div>
      </div>
      <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition">
        Go Back
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DigitalResourceViewer({ book, user, onClose, onDownload }) {
  const [viewMode, setViewMode] = useState('info'); // 'info' | 'read' | 'video' | 'audio' | 'external'
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);

  if (!book) return null;

  // Derive resource type from book
  const resourceType = book.resourceType || book.format || (book.isDigital ? 'pdf' : 'physical');
  const normalizedType = resourceType?.toLowerCase().includes('video') ? 'video'
    : resourceType?.toLowerCase().includes('audio') ? 'audio'
    : resourceType?.toLowerCase().includes('epub') ? 'epub'
    : (book.externalUrl && !book.fileName) ? 'external_url'
    : 'pdf';

  // Access level
  const accessLevel = book.accessLevel || 'campus';
  const accessCfg = ACCESS_LEVELS[accessLevel] || ACCESS_LEVELS.campus;

  // Patron role check
  const isAuthenticated = !!user;
  const isStaff = user?.role === 'admin' || user?.role === 'hod';
  const canRead = accessCfg.canRead || isStaff;
  const canDownload = (accessCfg.canDownload || isStaff) && isAuthenticated;

  const handleDownload = () => {
    if (!canDownload) {
      setShowDownloadAlert(true);
      return;
    }
    setDownloadRequested(true);
    setTimeout(() => setDownloadRequested(false), 3000);
    if (onDownload) onDownload(book);
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = book.fileName || `${book.title}.pdf`;
    link.click();
  };

  const handleRead = () => {
    if (!canRead) return;
    if (normalizedType === 'video') setViewMode('video');
    else if (normalizedType === 'audio') setViewMode('audio');
    else if (normalizedType === 'external_url') setViewMode('external');
    else setViewMode('read');
  };

  // Render immersive viewer if active
  if (viewMode === 'read' && canRead) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        <PdfViewer book={book} onClose={() => setViewMode('info')} />
      </div>
    );
  }
  if (viewMode === 'video' && canRead) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => setViewMode('info')} className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <VideoPlayer book={book} />
      </div>
    );
  }
  if (viewMode === 'audio' && canRead) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => setViewMode('info')} className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <AudioPlayer book={book} />
      </div>
    );
  }
  if (viewMode === 'external' && canRead) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={() => setViewMode('info')} className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5">
            <ChevronLeft size={14} /> Back
          </button>
        </div>
        <ExternalViewer book={book} />
      </div>
    );
  }
  if (!canRead && viewMode !== 'info') {
    return <AccessDenied level={accessLevel} onClose={() => setViewMode('info')} />;
  }

  // Info / landing panel
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Download restriction alert */}
      {showDownloadAlert && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Download Not Permitted</p>
            <p className="mt-0.5 text-amber-400/80">
              This resource has <strong>{accessCfg.label}</strong> rights. Downloads are restricted for your account level.
              Contact the library for access.
            </p>
            <button onClick={() => setShowDownloadAlert(false)} className="mt-1.5 underline text-amber-400 hover:text-amber-300">Dismiss</button>
          </div>
        </div>
      )}

      {/* Resource Header Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap gap-2">
              <ResourceTypeBadge type={normalizedType} />
              <AccessBadge level={accessLevel} />
              {book.isDigital && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                  Digital Resource
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{book.title}</h2>
            {book.subtitle && <p className="text-slate-400 text-sm">{book.subtitle}</p>}
            <p className="text-slate-400 text-sm">{book.author} • {book.publisher} • {book.year}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Read Online */}
          {canRead && (normalizedType === 'pdf' || normalizedType === 'epub') && (
            <button
              onClick={handleRead}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition"
            >
              <Eye size={16} />
              Read Online
            </button>
          )}
          {canRead && normalizedType === 'video' && (
            <button
              onClick={handleRead}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition"
            >
              <Play size={16} />
              Watch Video
            </button>
          )}
          {canRead && normalizedType === 'audio' && (
            <button
              onClick={handleRead}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition"
            >
              <Headphones size={16} />
              Listen / Play
            </button>
          )}
          {canRead && normalizedType === 'external_url' && (
            <button
              onClick={handleRead}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition"
            >
              <ExternalLink size={16} />
              Open External Link
            </button>
          )}
          {!canRead && (
            <div className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-semibold text-sm flex items-center gap-2 cursor-not-allowed border border-slate-700">
              <Lock size={16} />
              Access Restricted
            </div>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition ${
              canDownload
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {downloadRequested ? <CheckCircle size={16} className="text-emerald-400" /> : <Download size={16} />}
            {downloadRequested ? 'Download Started' : canDownload ? 'Download' : 'Download Restricted'}
          </button>

          {/* External Link (always shown if DOI exists) */}
          {book.doi && (
            <a
              href={`https://doi.org/${book.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm flex items-center gap-2 border border-slate-700 transition"
            >
              <Globe size={16} />
              DOI / Publisher
            </a>
          )}
        </div>
      </div>

      {/* Resource Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resource Details</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'ISBN', value: book.isbn },
              { label: 'Call Number', value: book.callNumber },
              { label: 'Edition', value: book.edition },
              { label: 'Pages', value: book.pdfPages ? `${book.pdfPages} pages` : null },
              { label: 'File Size', value: book.fileSize },
              { label: 'File Name', value: book.fileName },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex justify-between gap-2">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-200 font-mono text-right truncate max-w-[160px]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location & Access</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Branch', value: book.branch },
              { label: 'Shelf', value: book.shelfLocation },
              { label: 'Copies Total', value: book.copiesTotal },
              { label: 'Available', value: book.copiesAvailable },
              { label: 'Access Level', value: accessCfg.label },
              { label: 'Rights Status', value: book.rightsStatus || 'In Copyright' },
            ].filter(r => r.value !== undefined && r.value !== null).map(row => (
              <div key={row.label} className="flex justify-between gap-2">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-200 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Abstract */}
      {book.abstract && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abstract</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{book.abstract}</p>
        </div>
      )}

      {/* Chapters list */}
      {book.chapters && book.chapters.length > 0 && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapters</h3>
          <div className="divide-y divide-slate-800/60">
            {book.chapters.map((ch, i) => (
              <div key={i} className="flex justify-between py-2 text-xs">
                <span className="text-slate-300">{ch.title}</span>
                <span className="text-slate-500 font-mono">p. {ch.page}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access notice */}
      <div className="rounded-xl border border-slate-800 p-3 bg-slate-900/50 flex items-start gap-2 text-xs text-slate-400">
        <Shield size={14} className="shrink-0 mt-0.5 text-indigo-400" />
        <p>
          Access to this resource is governed by FCC Ibadan Library Digital Rights Policy.
          Unauthorized reproduction, distribution, or resale of digital materials is prohibited.
          For institutional licensing enquiries: <span className="text-indigo-400">library@fccibadan.edu.ng</span>
        </p>
      </div>
    </div>
  );
}
