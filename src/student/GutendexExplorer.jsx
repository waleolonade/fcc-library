import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, BookOpen, User, Globe, Download, Filter, X, ExternalLink,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, BookMarked,
  FileText, Tag, Calendar, Languages, Layers, ArrowUpDown, Eye,
  RotateCw, Copy, Check, ShieldCheck, Sparkles, BookCopy, Compass,
  Bookmark
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────
const API_BASE = '/api/gutenberg';

const LANGUAGE_OPTIONS = [
  { code: '', label: 'All Languages' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'zh', label: 'Chinese' },
  { code: 'la', label: 'Latin' },
  { code: 'el', label: 'Greek' },
  { code: 'ru', label: 'Russian' },
  { code: 'fi', label: 'Finnish' },
  { code: 'eo', label: 'Esperanto' },
];

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular (Downloads)' },
  { value: 'ascending',  label: 'ID (Low to High)' },
  { value: 'descending', label: 'ID (High to Low)' },
];

const COPYRIGHT_OPTIONS = [
  { value: '', label: 'All Rights Statuses' },
  { value: 'false', label: 'Public Domain (USA Only)' },
  { value: 'true', label: 'Copyright Protected' },
];

const MIME_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'text/html', label: 'HTML (Read Online)' },
  { value: 'application/epub+zip', label: 'EPUB E-Book' },
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'application/x-mobipocket-ebook', label: 'Kindle (KF8/MOBI)' },
];

const TOPIC_PRESETS = [
  'Classics', 'Fiction', 'Science Fiction', 'Mystery', 'Romance',
  'Philosophy', 'History', 'Children', 'Poetry', 'Adventure', 'Gothic', 'Drama'
];

const ERA_PRESETS = [
  { label: 'Ancient (<500 CE)', start: '', end: '500' },
  { label: '18th Century', start: '1700', end: '1799' },
  { label: '19th Century', start: '1800', end: '1899' },
  { label: 'Early 20th C.', start: '1900', end: '1950' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find the best human-readable URL from the formats object.
 * Priority: any text/html variant → UTF-8 plain text → ASCII plain text → epub.
 */
function getBestReadUrl(formats = {}) {
  const htmlKey = Object.keys(formats).find(k => k.startsWith('text/html'));
  if (htmlKey) return { url: formats[htmlKey], mime: htmlKey };

  const priority = [
    'text/plain; charset=utf-8',
    'text/plain; charset=us-ascii',
    'text/plain; charset=iso-8859-1',
    'text/plain',
    'application/epub+zip',
  ];
  for (const mime of priority) {
    if (formats[mime]) return { url: formats[mime], mime };
  }
  const fallback = Object.entries(formats).find(
    ([k]) => !k.startsWith('image/') && !k.includes('rdf') && !k.includes('octet-stream')
  );
  return fallback ? { url: fallback[1], mime: fallback[0] } : null;
}

/**
 * Get direct download links for EPUB, Kindle, and Plain Text.
 */
function getDownloadLinks(formats = {}) {
  return {
    epub: formats['application/epub+zip'] || null,
    kindle: formats['application/x-mobipocket-ebook'] || null,
    text: formats['text/plain; charset=utf-8'] || formats['text/plain; charset=us-ascii'] || formats['text/plain'] || null,
    zip: formats['application/octet-stream'] || null,
  };
}

/**
 * Extract cover URL. Tries formats first, then constructs canonical
 * Gutenberg CDN cover URL from the book ID as fallback.
 */
function getCoverUrl(formats = {}, bookId = null) {
  const key = Object.keys(formats).find(k => k.startsWith('image/'));
  if (key) return formats[key];
  if (bookId) return `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.cover.medium.jpg`;
  return null;
}

/**
 * Format a person's name from "Surname, Firstname" to "Firstname Surname".
 */
function fmtName(raw = '') {
  if (!raw) return '';
  const clean = raw.replace(/\s*\([^)]*\)/g, '').trim();
  if (!clean.includes(',')) return clean;
  const [last, first] = clean.split(',').map(s => s.trim());
  return first ? `${first} ${last}` : last;
}

/**
 * Format a year number, handling BCE dates (negative integers).
 */
function fmtYear(y) {
  if (y === null || y === undefined) return '?';
  if (y < 0) return `${Math.abs(y)} BCE`;
  return String(y);
}

/**
 * Get all credited persons: authors first, then editors (if no authors).
 */
function getCreators(book) {
  const authors = book.authors || [];
  const editors = book.editors || [];
  if (authors.length > 0) return { people: authors, role: 'Author' };
  if (editors.length > 0) return { people: editors, role: 'Editor' };
  return { people: [], role: '' };
}

function fmtDownloads(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n || 0);
}

function cleanSummary(text) {
  if (!text) return '';
  return text.replace(/^"|"$/g, '').replace(/\\"/g, '"').trim();
}

// ─── BookDetailModal ──────────────────────────────────────────────────────────
function BookDetailModal({ book, onClose, onRead, onSelectTopic }) {
  const [copiedLink, setCopiedLink] = useState(false);
  if (!book) return null;

  const cover = getCoverUrl(book.formats, book.id);
  const readLink = getBestReadUrl(book.formats);
  const downloads = getDownloadLinks(book.formats);
  const { people: creators, role: creatorRole } = getCreators(book);
  const translators = book.translators || [];
  const editors = book.editors || [];
  const showEditors = editors.length > 0 && (book.authors || []).length > 0;

  const langLabel = (book.languages || []).map(l => {
    const found = LANGUAGE_OPTIONS.find(o => o.code === l);
    return found ? found.label : l.toUpperCase();
  }).join(', ');

  const handleCopyGutenbergLink = () => {
    const url = `https://www.gutenberg.org/ebooks/${book.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#032316] border border-amber-700/50 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-amber-800/40 bg-[#021810]">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookMarked className="text-amber-400" size={20} />
            Book Dossier &amp; Full Metadata
            <span className="ml-2 px-2.5 py-0.5 bg-amber-950/80 border border-amber-700/60 rounded-full text-[10px] font-mono font-bold text-amber-400">
              PG #{book.id}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-white transition p-1.5 bg-amber-900/30 hover:bg-amber-800 rounded-full"
            title="Close dossier"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

          {/* Cover + Title block */}
          <div className="flex gap-5">
            {cover ? (
              <img
                src={cover}
                alt={book.title}
                className="w-28 h-40 object-cover rounded-2xl border border-amber-700/60 shadow-xl flex-shrink-0 bg-amber-950/40"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-28 h-40 rounded-2xl border border-amber-800/50 bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-amber-700" size={32} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white leading-snug">{book.title}</h1>

              {/* Authors / Editors */}
              {creators.length > 0 && (
                <div className="mt-2 space-y-1">
                  {creators.map((a, i) => (
                    <div key={i} className="text-sm text-amber-300 flex items-center gap-1.5 flex-wrap">
                      <User size={13} className="text-amber-500 shrink-0" />
                      <span className="font-bold">{fmtName(a.name)}</span>
                      <span className="text-[10px] text-amber-600 uppercase font-mono tracking-wider">{creatorRole}</span>
                      {(a.birth_year !== null || a.death_year !== null) && (
                        <span className="text-amber-500/80 text-xs font-mono">
                          ({fmtYear(a.birth_year)} &ndash; {fmtYear(a.death_year)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata pills */}
              <div className="flex flex-wrap gap-2 mt-3.5">
                {book.download_count > 0 && (
                  <span className="px-2.5 py-1 bg-amber-900/60 border border-amber-700/50 rounded-lg text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                    <Download size={10} /> {fmtDownloads(book.download_count)} Gutenberg downloads
                  </span>
                )}
                {langLabel && (
                  <span className="px-2.5 py-1 bg-[#021810] border border-amber-800/50 rounded-lg text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <Languages size={10} /> {langLabel}
                  </span>
                )}
                {book.copyright === false ? (
                  <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-400" /> Public Domain (USA)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-950/60 border border-amber-700/60 rounded-lg text-[10px] font-mono text-amber-400">
                    Copyright Restricted
                  </span>
                )}
                {book.media_type && (
                  <span className="px-2.5 py-1 bg-[#021810] border border-amber-800/40 rounded-lg text-[10px] font-mono text-amber-600">
                    {book.media_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Downloads Bar */}
          <div className="p-3.5 bg-[#021810] border border-amber-800/40 rounded-2xl">
            <h3 className="text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Download size={13} /> Instant E-Book Downloads
            </h3>
            <div className="flex flex-wrap gap-2">
              {downloads.epub && (
                <a
                  href={downloads.epub}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download size={12} /> Download EPUB (.epub)
                </a>
              )}
              {downloads.kindle && (
                <a
                  href={downloads.kindle}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-900/50 hover:bg-amber-800 border border-amber-700/60 text-amber-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download size={12} /> Kindle / MOBI (.kf8)
                </a>
              )}
              {downloads.text && (
                <a
                  href={downloads.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#032316] hover:bg-amber-900/40 border border-amber-800 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FileText size={12} /> Plain Text (.txt)
                </a>
              )}
              {downloads.zip && (
                <a
                  href={downloads.zip}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#032316] hover:bg-amber-900/40 border border-amber-800 text-amber-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Layers size={12} /> HTML Archive (.zip)
                </a>
              )}
            </div>
          </div>

          {/* Summaries */}
          {book.summaries && book.summaries.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} /> Synopsis &amp; Book Summary
              </h3>
              <div className="space-y-2">
                {book.summaries.map((s, i) => (
                  <div key={i} className="text-amber-100/90 text-sm leading-relaxed bg-amber-950/20 p-4 rounded-2xl border border-amber-900/40 relative">
                    <span className="text-amber-600/40 text-3xl font-serif absolute top-1 left-2 pointer-events-none">&ldquo;</span>
                    <p className="pl-4 italic">{cleanSummary(s)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects */}
          {book.subjects && book.subjects.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Tag size={12} /> Subjects &amp; Classifications
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {book.subjects.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectTopic && onSelectTopic(s)}
                    className="px-2.5 py-1 bg-[#021810] hover:bg-amber-900/40 border border-amber-800/40 hover:border-amber-500 rounded-lg text-[11px] text-amber-300 transition text-left"
                    title={`Filter by subject "${s}"`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bookshelves */}
          {book.bookshelves && book.bookshelves.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Layers size={12} /> Project Gutenberg Bookshelves
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {book.bookshelves.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectTopic && onSelectTopic(s)}
                    className="px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-800/60 hover:border-amber-400 rounded-lg text-[11px] font-semibold text-amber-400 transition"
                    title={`Filter by bookshelf "${s}"`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Translators & Editors */}
          {(translators.length > 0 || showEditors) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {translators.length > 0 && (
                <div className="p-3 bg-[#021810] rounded-xl border border-amber-900/30">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Translators</h4>
                  <div className="space-y-1">
                    {translators.map((t, i) => (
                      <div key={i} className="text-xs text-amber-200">
                        {fmtName(t.name)}
                        {(t.birth_year || t.death_year) && (
                          <span className="text-amber-600 text-[10px] ml-1">
                            ({fmtYear(t.birth_year)}&ndash;{fmtYear(t.death_year)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showEditors && (
                <div className="p-3 bg-[#021810] rounded-xl border border-amber-900/30">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Editors</h4>
                  <div className="space-y-1">
                    {editors.map((e, i) => (
                      <div key={i} className="text-xs text-amber-200">
                        {fmtName(e.name)}
                        {(e.birth_year || e.death_year) && (
                          <span className="text-amber-600 text-[10px] ml-1">
                            ({fmtYear(e.birth_year)}&ndash;{fmtYear(e.death_year)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source Attribution */}
          <div className="pt-3 border-t border-amber-800/30">
            <div className="bg-[#021810] p-4 rounded-2xl border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Gutenberg Record</h4>
                <p className="text-xs text-amber-200">Project Gutenberg eBook #{book.id}</p>
                <p className="text-[10px] font-mono text-amber-600">https://www.gutenberg.org/ebooks/{book.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyGutenbergLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800 border border-amber-800 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  {copiedLink ? <Check size={13} className="text-amber-400" /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={`https://www.gutenberg.org/ebooks/${book.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 hover:bg-amber-800 border border-amber-700/60 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  <span>Open Official Page</span> <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#021810] border-t border-amber-800/40 flex justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-amber-400 hover:text-white transition text-xs"
          >
            Close
          </button>
          {readLink && (
            <button
              onClick={() => onRead(readLink.url, book)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center gap-2 text-xs"
            >
              <Eye size={16} /> Read Full Book in Viewer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── InlineReader ─────────────────────────────────────────────────────────────
function InlineReader({ url, title, onClose }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url, iframeKey, onClose]);

  if (!url) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const openDirect = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isTrustedProvider = url.includes('gutenberg.org') || url.includes('archive.org');

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#021810] animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#032316] border-b border-amber-800/50 shadow-lg gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-amber-100 font-bold text-sm truncate max-w-[280px] sm:max-w-md" title={title}>
              {title}
            </h3>
            <span className="text-[11px] font-mono text-amber-500/80">Project Gutenberg Digital Reader</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openDirect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md transition-all whitespace-nowrap"
            title="Open book in new tab"
          >
            <ExternalLink size={13} />
            <span className="hidden md:inline">Open in New Tab</span>
          </button>

          <button
            onClick={handleReload}
            className="p-2 bg-amber-900/40 hover:bg-amber-800 border border-amber-800 text-amber-300 hover:text-white rounded-lg transition"
            title="Reload Frame"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleCopy}
            className="p-2 bg-amber-900/40 hover:bg-amber-800 border border-amber-800 text-amber-300 hover:text-white rounded-lg transition"
            title={copied ? "Copied!" : "Copy link"}
          >
            {copied ? <Check size={14} className="text-amber-400" /> : <Copy size={14} />}
          </button>

          <div className="h-5 w-px bg-amber-800/50 mx-1 hidden sm:block" />

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-bold text-xs shadow transition"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative bg-white overflow-hidden flex flex-col">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#021810]/75 backdrop-blur-xs transition-opacity duration-300">
            <div className="bg-[#032316] p-5 rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-amber-200 text-xs font-bold tracking-wide">Loading Gutenberg Text...</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={url}
          title={title}
          className="flex-1 w-full h-full border-none bg-white"
          allow="fullscreen; autoplay; clipboard-write; encrypted-media"
          allowFullScreen={true}
          {...(!isTrustedProvider ? { sandbox: "allow-same-origin allow-scripts allow-popups allow-forms allow-modals" } : {})}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

// ─── BookCard ─────────────────────────────────────────────────────────────────
function BookCard({ book, onDetail, onRead }) {
  const cover = getCoverUrl(book.formats, book.id);
  const readLink = getBestReadUrl(book.formats);
  const downloads = getDownloadLinks(book.formats);
  const { people: creators, role: creatorRole } = getCreators(book);
  const firstCreator = creators[0];
  const summary = book.summaries?.[0] ? cleanSummary(book.summaries[0]) : null;

  return (
    <div className="bg-[#021810]/80 border border-amber-800/30 rounded-2xl p-4 flex flex-col h-full hover:border-amber-600/50 hover:bg-[#032316] transition-all group shadow-lg">

      {/* Cover */}
      <div className="w-full h-48 bg-amber-950/20 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-amber-800/20 relative group-hover:border-amber-600/30 transition">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex flex-col items-center text-amber-700/40">
            <BookOpen size={40} className="mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider">No Cover</span>
          </div>
        )}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-950/90 border border-amber-700/60 rounded text-[9px] font-mono font-bold text-amber-400">
          #{book.id}
        </div>
        {book.copyright === false && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-950/90 border border-emerald-700/60 rounded text-[9px] font-mono text-emerald-300">
            Public Domain
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-amber-300 transition mb-1">
          {book.title}
        </h3>

        {firstCreator ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/90 mb-2">
            <User size={11} className="shrink-0 text-amber-500" />
            <span className="line-clamp-1 font-medium">{fmtName(firstCreator.name)}</span>
            <span className="text-[9px] text-amber-600 uppercase shrink-0 font-mono">{creatorRole}</span>
            {(firstCreator.birth_year !== null || firstCreator.death_year !== null) && (
              <span className="text-amber-600/80 text-[10px] shrink-0 font-mono">
                {fmtYear(firstCreator.birth_year)}&ndash;{fmtYear(firstCreator.death_year)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-700/60 mb-2 italic">Anonymous / Various</p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {(book.languages || []).map(l => (
            <span key={l} className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 rounded text-[9px] font-mono text-amber-400 uppercase">
              {l}
            </span>
          ))}
          {book.download_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-mono">
              <Download size={9} /> {fmtDownloads(book.download_count)}
            </span>
          )}
        </div>

        {/* Synopsis snippet if available */}
        {summary && (
          <p className="text-[11px] text-amber-200/70 line-clamp-2 leading-relaxed mb-2.5 italic">
            &ldquo;{summary}&rdquo;
          </p>
        )}

        {/* Subjects tags */}
        {book.subjects && book.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.subjects.slice(0, 2).map((s, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[#010e09] border border-amber-800/30 rounded text-amber-500/80 truncate max-w-[130px]" title={s}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-amber-800/20 flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onDetail(book)}
              className="py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-amber-900/30 hover:bg-amber-800/50 text-amber-300 hover:text-white border border-amber-800/40 hover:border-amber-500"
            >
              <FileText size={11} /> Details
            </button>
            {downloads.epub ? (
              <a
                href={downloads.epub}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 bg-amber-950/50 hover:bg-amber-900 text-amber-300 hover:text-white border border-amber-700/40 hover:border-amber-400"
                title="Download EPUB file directly"
              >
                <Download size={11} /> EPUB
              </a>
            ) : (
              <a
                href={`https://www.gutenberg.org/ebooks/${book.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 bg-amber-950/50 text-amber-400 hover:text-white border border-amber-800/30"
              >
                <ExternalLink size={10} /> Gutenberg
              </a>
            )}
          </div>
          {readLink && (
            <button
              onClick={() => onRead(readLink.url, book)}
              className="w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/50"
            >
              <Eye size={12} /> Read Online
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main: GutendexExplorer ───────────────────────────────────────────────────
export default function GutendexExplorer() {
  const [books, setBooks]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [totalCount, setTotalCount]   = useState(0);
  const [nextUrl, setNextUrl]         = useState(null);
  const [prevUrl, setPrevUrl]         = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filter state
  const [search, setSearch]                   = useState('');
  const [topic, setTopic]                     = useState('');
  const [language, setLanguage]               = useState('');
  const [copyright, setCopyright]             = useState('');
  const [mimeType, setMimeType]               = useState('');
  const [ids, setIds]                         = useState('');
  const [sort, setSort]                       = useState('popular');
  const [authorYearStart, setAuthorYearStart] = useState('');
  const [authorYearEnd, setAuthorYearEnd]     = useState('');
  const [showFilters, setShowFilters]         = useState(false);

  // UI state
  const [selectedBook, setSelectedBook] = useState(null);
  const [readerUrl, setReaderUrl]       = useState(null);
  const [readerTitle, setReaderTitle]   = useState('');

  // ── Fetch via backend proxy ──
  const fetchBooks = useCallback(async (params = {}, page = 1) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (params.search)            query.set('search', params.search.trim());
      if (params.topic)             query.set('topic', params.topic.trim());
      if (params.languages)         query.set('languages', params.languages);
      if (params.copyright)         query.set('copyright', params.copyright);
      if (params.mime_type)         query.set('mime_type', params.mime_type);
      if (params.ids)               query.set('ids', params.ids.trim());
      if (params.sort)              query.set('sort', params.sort);
      if (params.author_year_start) query.set('author_year_start', params.author_year_start);
      if (params.author_year_end)   query.set('author_year_end', params.author_year_end);
      if (page > 1)                 query.set('page', String(page));

      const res = await fetch(`${API_BASE}/books?${query.toString()}`);
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBooks(data.results || []);
      setTotalCount(data.count || 0);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to reach Project Gutenberg API.');
    } finally {
      setLoading(false);
    }
  }, []);

  const currentParams = useCallback(() => ({
    search,
    topic,
    languages: language,
    copyright,
    mime_type: mimeType,
    ids,
    sort,
    author_year_start: authorYearStart,
    author_year_end: authorYearEnd,
  }), [search, topic, language, copyright, mimeType, ids, sort, authorYearStart, authorYearEnd]);

  useEffect(() => {
    fetchBooks({ sort: 'popular' }, 1);
  }, [fetchBooks]);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchBooks(currentParams(), 1);
  };

  const handleSelectTopic = (newTopic) => {
    setTopic(newTopic);
    setSelectedBook(null);
    fetchBooks({ ...currentParams(), topic: newTopic }, 1);
  };

  const handleSelectEra = (start, end) => {
    setAuthorYearStart(start);
    setAuthorYearEnd(end);
    fetchBooks({ ...currentParams(), author_year_start: start, author_year_end: end }, 1);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setTopic('');
    setLanguage('');
    setCopyright('');
    setMimeType('');
    setIds('');
    setAuthorYearStart('');
    setAuthorYearEnd('');
    setSort('popular');
    fetchBooks({ sort: 'popular' }, 1);
  };

  const openReader = (url, book) => {
    setReaderUrl(url);
    setReaderTitle(book.title);
    setSelectedBook(null);
  };

  // Count active non-default filters
  const activeFilterCount = [
    Boolean(search),
    Boolean(topic),
    Boolean(language),
    Boolean(copyright),
    Boolean(mimeType),
    Boolean(ids),
    Boolean(authorYearStart),
    Boolean(authorYearEnd),
    sort !== 'popular'
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-[#032316] text-amber-100 p-4 sm:p-6 rounded-3xl border border-amber-800/40 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 z-10 relative">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-950/60 shrink-0">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Project Gutenberg
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-700/50 text-amber-400">
                  Gutendex API
                </span>
              </h2>
              <p className="text-amber-500/80 text-xs sm:text-sm">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} curated public-domain eBooks, classics, and literature`
                  : "70,000+ free public-domain eBooks from the world's oldest digital library"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-sm ${
              showFilters || activeFilterCount > 0
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-amber-900/30 border-amber-800/50 text-amber-300 hover:text-white hover:bg-amber-800/50'
            }`}
          >
            <Filter size={14} />
            <span>Advanced Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-950 rounded-full text-[10px] font-mono">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} className="z-10 relative mb-3">
        <div className="flex flex-col sm:flex-row gap-2 bg-[#021810]/70 p-2.5 rounded-2xl border border-amber-800/30">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Search title, author, key phrases... (e.g. Jane Austen, Sherlock Holmes, Dracula)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#032316] border border-amber-700/40 rounded-xl pl-10 pr-4 py-2.5 text-amber-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-amber-700 transition"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-3.5 h-3.5 pointer-events-none" />
              <select
                value={sort}
                onChange={e => {
                  setSort(e.target.value);
                  fetchBooks({ ...currentParams(), sort: e.target.value }, 1);
                }}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl pl-8 pr-4 py-2.5 text-amber-100 text-xs focus:outline-none focus:border-amber-500 transition appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0 shadow"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={14} />}
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* ── Topic Presets Bar ── */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mr-1 shrink-0 flex items-center gap-1">
            <Compass size={11} /> Topics:
          </span>
          {TOPIC_PRESETS.map(t => {
            const isActive = topic.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTopic(isActive ? '' : t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 border ${
                  isActive
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-[#021810] border-amber-800/40 text-amber-300 hover:text-white hover:border-amber-600'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* ── Advanced Filters Drawer ── */}
        {showFilters && (
          <div className="mt-3 p-4 bg-[#021810] border border-amber-800/40 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
            {/* Language */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 transition"
              >
                {LANGUAGE_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Copyright */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Copyright Status
              </label>
              <select
                value={copyright}
                onChange={e => setCopyright(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 transition"
              >
                {COPYRIGHT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* MIME Type / Format */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                MIME / Format Prefix
              </label>
              <select
                value={mimeType}
                onChange={e => setMimeType(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 transition"
              >
                {MIME_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Topic */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Topic / Subject Search
              </label>
              <input
                type="text"
                placeholder="e.g. poetry, sea stories"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>

            {/* Author Era Start */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Author Born After (Year)
              </label>
              <input
                type="number"
                placeholder="e.g. 1800 (or -500 for BCE)"
                value={authorYearStart}
                onChange={e => setAuthorYearStart(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>

            {/* Author Era End */}
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Author Died Before (Year)
              </label>
              <input
                type="number"
                placeholder="e.g. 1920"
                value={authorYearEnd}
                onChange={e => setAuthorYearEnd(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>

            {/* Specific Gutenberg IDs */}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Specific Gutenberg ID(s)
              </label>
              <input
                type="text"
                placeholder="e.g. 1342, 2701, 84, 11 (comma separated numbers)"
                value={ids}
                onChange={e => setIds(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-xl px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>

            {/* Era shortcuts & actions */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 pt-2 border-t border-amber-800/30 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Eras:</span>
                {ERA_PRESETS.map((era) => (
                  <button
                    key={era.label}
                    type="button"
                    onClick={() => handleSelectEra(era.start, era.end)}
                    className="px-2 py-0.5 bg-[#032316] hover:bg-amber-900/40 border border-amber-800/40 hover:border-amber-600 text-amber-300 rounded text-[10px] transition"
                  >
                    {era.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:text-white border border-amber-800/40 hover:bg-amber-900/30 transition"
                >
                  Reset All
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Filter Badges ── */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Active Filters:</span>
            {search && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                Query: &quot;{search}&quot;
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setSearch(''); fetchBooks({ ...currentParams(), search: '' }, 1); }} />
              </span>
            )}
            {topic && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                Topic: {topic}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setTopic(''); fetchBooks({ ...currentParams(), topic: '' }, 1); }} />
              </span>
            )}
            {language && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                Lang: {language.toUpperCase()}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setLanguage(''); fetchBooks({ ...currentParams(), languages: '' }, 1); }} />
              </span>
            )}
            {copyright && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                {copyright === 'false' ? 'Public Domain' : 'Copyrighted'}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setCopyright(''); fetchBooks({ ...currentParams(), copyright: '' }, 1); }} />
              </span>
            )}
            {mimeType && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                Format: {mimeType}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setMimeType(''); fetchBooks({ ...currentParams(), mime_type: '' }, 1); }} />
              </span>
            )}
            {ids && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                IDs: {ids}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setIds(''); fetchBooks({ ...currentParams(), ids: '' }, 1); }} />
              </span>
            )}
            {(authorYearStart || authorYearEnd) && (
              <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/50 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                Era: {authorYearStart || 'any'} &ndash; {authorYearEnd || 'any'}
                <X size={10} className="cursor-pointer hover:text-white" onClick={() => { setAuthorYearStart(''); setAuthorYearEnd(''); fetchBooks({ ...currentParams(), author_year_start: '', author_year_end: '' }, 1); }} />
              </span>
            )}
            <button
              onClick={handleClearAllFilters}
              className="text-[10px] text-amber-400 hover:text-white underline font-semibold ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </form>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-900/30 border border-red-600/40 text-red-200 p-4 rounded-2xl mb-4 flex items-center gap-3 z-10">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-bold">Unable to reach Project Gutenberg</p>
            <p className="text-red-300/80 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchBooks(currentParams(), currentPage)}
            className="px-3 py-1 bg-red-800/50 hover:bg-red-700 border border-red-500 rounded-lg text-xs font-bold text-white transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Book Grid ── */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-amber-400" />
            <p className="font-bold text-sm text-amber-200">Querying Project Gutenberg Catalog...</p>
            <p className="text-xs text-amber-600 mt-1">Filtering live records via Gutendex</p>
          </div>
        ) : books.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-700/50">
            <BookOpen size={48} className="mb-3 opacity-40" />
            <p className="font-bold text-base text-amber-300">No books found matching this criteria.</p>
            <p className="text-xs mt-1 text-amber-600">Try broadening your search term or resetting your filters.</p>
            <button
              onClick={handleClearAllFilters}
              className="mt-3 px-4 py-1.5 bg-amber-900/40 hover:bg-amber-800 border border-amber-700 text-amber-300 rounded-xl text-xs font-bold transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onDetail={setSelectedBook}
                onRead={openReader}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && books.length > 0 && (
        <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-amber-800/30 z-10 text-xs">
          <button
            disabled={!prevUrl || loading}
            onClick={() => fetchBooks(currentParams(), currentPage - 1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900/40 text-amber-300 hover:bg-amber-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition font-bold"
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="text-center font-mono text-amber-500/80">
            <span className="font-bold text-amber-300">Page {currentPage}</span>
            <span className="mx-2 text-amber-700">&bull;</span>
            <span>{totalCount.toLocaleString()} total books</span>
          </div>
          <button
            disabled={!nextUrl || loading}
            onClick={() => fetchBooks(currentParams(), currentPage + 1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900/40 text-amber-300 hover:bg-amber-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition font-bold"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onRead={openReader}
        onSelectTopic={handleSelectTopic}
      />
      <InlineReader
        url={readerUrl}
        title={readerTitle}
        onClose={() => setReaderUrl(null)}
      />
    </div>
  );
}
