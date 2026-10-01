import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, BookOpen, User, Globe, Download, Filter, X, ExternalLink,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, BookMarked,
  FileText, Tag, Calendar, Languages, Layers, ArrowUpDown, Eye,
  RotateCw, Copy, Check
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────
const API_BASE = '/api/gutenberg';

const LANGUAGE_OPTIONS = [
  { code: '', label: 'All Languages' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'fi', label: 'Finnish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'it', label: 'Italian' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'la', label: 'Latin' },
  { code: 'el', label: 'Greek' },
];

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'ascending',  label: 'ID (Low to High)' },
  { value: 'descending', label: 'ID (High to Low)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find the best human-readable URL from the formats object.
 * Priority: any text/html variant → UTF-8 plain text → ASCII plain text → epub.
 * Handles all charset variants seen in real Gutendex responses.
 */
function getBestReadUrl(formats = {}) {
  // Match any text/html key (text/html, text/html; charset=utf-8, text/html; charset=iso-8859-1, etc.)
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
  // Last resort: any non-image, non-rdf format
  const fallback = Object.entries(formats).find(
    ([k]) => !k.startsWith('image/') && !k.includes('rdf') && !k.includes('octet-stream')
  );
  return fallback ? { url: fallback[1], mime: fallback[0] } : null;
}

/**
 * Extract cover URL. Tries formats first, then constructs the canonical
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
 * Handles edge cases: no comma, trailing dots (abbreviations), long pen names.
 */
function fmtName(raw = '') {
  if (!raw) return '';
  // Strip anything in parentheses (e.g. "Forster, E. M. (Edward Morgan)" → "E. M. Forster")
  const clean = raw.replace(/\s*\([^)]*\)/g, '').trim();
  if (!clean.includes(',')) return clean;
  const [last, first] = clean.split(',').map(s => s.trim());
  return first ? `${first} ${last}` : last;
}

/**
 * Format a year number, handling BCE dates (negative integers).
 * e.g. -750 → "750 BCE", 1775 → "1775", null → "?"
 */
function fmtYear(y) {
  if (y === null || y === undefined) return '?';
  if (y < 0) return `${Math.abs(y)} BCE`;
  return String(y);
}

/**
 * Get all credited persons: authors first, then editors (if no authors).
 * Editors are only shown as primary credit when there are zero authors.
 * Translators are always shown separately.
 */
function getCreators(book) {
  const authors  = book.authors  || [];
  const editors  = book.editors  || [];
  if (authors.length > 0) return { people: authors, role: 'Author' };
  if (editors.length > 0) return { people: editors, role: 'Editor' };
  return { people: [], role: '' };
}

function fmtDownloads(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── BookDetailModal ──────────────────────────────────────────────────────────
function BookDetailModal({ book, onClose, onRead }) {
  if (!book) return null;

  const cover    = getCoverUrl(book.formats, book.id);
  const readLink = getBestReadUrl(book.formats);
  const { people: creators, role: creatorRole } = getCreators(book);
  const translators = book.translators || [];
  const editors     = book.editors     || [];
  // Only show editors in a separate section if there were also authors
  const showEditors = editors.length > 0 && (book.authors || []).length > 0;

  const langLabel = (book.languages || []).map(l => {
    const found = LANGUAGE_OPTIONS.find(o => o.code === l);
    return found ? found.label : l.toUpperCase();
  }).join(', ');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#032316] border border-amber-700/50 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-amber-800/40 bg-[#021810]">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BookMarked className="text-amber-400" size={20} />
            Book Details
            <span className="ml-2 px-2 py-0.5 bg-amber-950/60 border border-amber-700/50 rounded-full text-[10px] font-mono text-amber-400">
              PG #{book.id}
            </span>
          </h2>
          <button onClick={onClose} className="text-amber-400 hover:text-white transition p-1 bg-amber-900/30 hover:bg-amber-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* Cover + Title block */}
          <div className="flex gap-4">
            {cover && (
              <img
                src={cover}
                alt={book.title}
                className="w-24 h-36 object-cover rounded-xl border border-amber-800/50 shadow-lg flex-shrink-0"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            {!cover && (
              <div className="w-24 h-36 rounded-xl border border-amber-800/50 bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-amber-700" size={28} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white leading-tight">{book.title}</h1>

              {/* Authors / Editors */}
              {creators.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {creators.map((a, i) => (
                    <div key={i} className="text-sm text-amber-300 flex items-center gap-1.5 flex-wrap">
                      <User size={12} className="text-amber-500 shrink-0" />
                      <span className="font-semibold">{fmtName(a.name)}</span>
                      <span className="text-[10px] text-amber-600 uppercase tracking-wider">{creatorRole}</span>
                      {(a.birth_year !== null || a.death_year !== null) && (
                        <span className="text-amber-600 text-xs">
                          ({fmtYear(a.birth_year)}&ndash;{fmtYear(a.death_year)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {book.download_count > 0 && (
                  <span className="px-2 py-0.5 bg-amber-900/60 border border-amber-700/50 rounded-full text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Download size={9} /> {fmtDownloads(book.download_count)} downloads
                  </span>
                )}
                {langLabel && (
                  <span className="px-2 py-0.5 bg-[#021810] border border-amber-800/40 rounded-full text-[10px] font-mono text-amber-500 flex items-center gap-1">
                    <Languages size={9} /> {langLabel}
                  </span>
                )}
                {book.copyright === false && (
                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-[10px] font-mono text-emerald-400">
                    &#10003; Public Domain (USA)
                  </span>
                )}
                {book.media_type && (
                  <span className="px-2 py-0.5 bg-[#021810] border border-amber-800/30 rounded-full text-[10px] font-mono text-amber-600">
                    {book.media_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summaries — show all available */}
          {book.summaries && book.summaries.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest">Summary</h3>
              <div className="space-y-2">
                {book.summaries.map((s, i) => (
                  <div key={i} className="text-amber-100/90 text-sm leading-relaxed bg-amber-950/20 p-4 rounded-xl border border-amber-900/40 max-h-48 overflow-y-auto">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects */}
          {book.subjects && book.subjects.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Tag size={11} /> Subjects
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {book.subjects.slice(0, 20).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[#021810] border border-amber-800/40 rounded-md text-[10px] text-amber-300">
                    {s}
                  </span>
                ))}
                {book.subjects.length > 20 && (
                  <span className="text-amber-700 text-[10px] px-1">+{book.subjects.length - 20} more</span>
                )}
              </div>
            </div>
          )}

          {/* Bookshelves */}
          {book.bookshelves && book.bookshelves.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <Layers size={11} /> Bookshelves
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {book.bookshelves.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-950/40 border border-amber-800/50 rounded-md text-[10px] text-amber-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Translators */}
          {translators.length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest">Translators</h3>
              <div className="flex flex-wrap gap-2">
                {translators.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-[#021810] border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-1">
                    <User size={10} /> {fmtName(t.name)}
                    {(t.birth_year !== null || t.death_year !== null) && (
                      <span className="text-amber-600 text-[10px] ml-0.5">
                        ({fmtYear(t.birth_year)}&ndash;{fmtYear(t.death_year)})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editors — only when there are also authors */}
          {showEditors && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest">Editors</h3>
              <div className="flex flex-wrap gap-2">
                {editors.map((e, i) => (
                  <span key={i} className="px-2 py-1 bg-[#021810] border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-1">
                    <User size={10} /> {fmtName(e.name)}
                    {(e.birth_year !== null || e.death_year !== null) && (
                      <span className="text-amber-600 text-[10px] ml-0.5">
                        ({fmtYear(e.birth_year)}&ndash;{fmtYear(e.death_year)})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Available Formats */}
          {book.formats && Object.keys(book.formats).length > 0 && (
            <div>
              <h3 className="text-amber-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <FileText size={11} /> Available Formats
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(book.formats).map(([mime, url], i) => {
                  if (mime.startsWith('image/')) return null;
                  const isReadable = mime.startsWith('text/');
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2.5 py-1 border rounded-lg text-[10px] font-mono flex items-center gap-1 transition ${
                        isReadable
                          ? 'bg-amber-900/40 border-amber-700/60 text-amber-300 hover:text-white hover:border-amber-400'
                          : 'bg-[#021810] border-amber-800/40 text-amber-600 hover:text-amber-300'
                      }`}
                    >
                      {mime.split(';')[0]} <ExternalLink size={9} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source Attribution */}
          <div className="pt-3 border-t border-amber-800/30">
            <div className="bg-[#021810] p-4 rounded-xl border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Source</h4>
                <p className="text-sm text-amber-100">Data by <strong className="text-white">Project Gutenberg</strong> via Gutendex API</p>
                <p className="text-[10px] font-mono text-amber-700">gutenberg.org/ebooks/{book.id}</p>
              </div>
              <a
                href={`https://www.gutenberg.org/ebooks/${book.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 hover:bg-amber-800 border border-amber-800 text-amber-300 hover:text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
              >
                Open on gutenberg.org <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#021810] border-t border-amber-800/40 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl font-bold text-amber-400 hover:text-white transition">
            Close
          </button>
          {readLink && (
            <button
              onClick={() => onRead(readLink.url, book)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2"
            >
              <Eye size={16} /> Read Book
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
            <span className="text-[11px] font-mono text-amber-500/80">Project Gutenberg EBook</span>
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
  const cover    = getCoverUrl(book.formats, book.id);
  const readLink = getBestReadUrl(book.formats);
  const { people: creators, role: creatorRole } = getCreators(book);
  const firstCreator = creators[0];

  return (
    <div className="bg-[#021810]/80 border border-amber-800/30 rounded-2xl p-4 flex flex-col h-full hover:border-amber-600/50 hover:bg-[#032316] transition-all group">

      {/* Cover */}
      <div className="w-full h-44 bg-amber-950/20 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-amber-800/20 relative group-hover:border-amber-600/30 transition">
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-contain p-2"
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex flex-col items-center text-amber-700/40">
            <BookOpen size={36} className="mb-1" />
            <span className="text-[9px] font-bold uppercase tracking-wider">No Cover</span>
          </div>
        )}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-950/90 border border-amber-700/60 rounded text-[9px] font-mono text-amber-400">
          #{book.id}
        </div>
        {book.copyright === false && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-950/90 border border-emerald-700/60 rounded text-[9px] font-mono text-emerald-400">
            Public Domain
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-amber-300 transition mb-1">
          {book.title}
        </h3>

        {firstCreator && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80 mb-2">
            <User size={11} className="shrink-0" />
            <span className="line-clamp-1">{fmtName(firstCreator.name)}</span>
            <span className="text-[9px] text-amber-600 uppercase shrink-0">{creatorRole}</span>
            {(firstCreator.birth_year !== null || firstCreator.death_year !== null) && (
              <span className="text-amber-700 text-[10px] shrink-0">
                {fmtYear(firstCreator.birth_year)}&ndash;{fmtYear(firstCreator.death_year)}
              </span>
            )}
          </div>
        )}
        {!firstCreator && (
          <p className="text-xs text-amber-700/60 mb-2 italic">Anonymous / Unknown</p>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(book.languages || []).map(l => (
            <span key={l} className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-800/40 rounded text-[9px] font-mono text-amber-500 uppercase">
              {l}
            </span>
          ))}
          {book.download_count > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-mono">
              <Download size={9} /> {fmtDownloads(book.download_count)}
            </span>
          )}
        </div>

        {book.subjects && book.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.subjects.slice(0, 2).map((s, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[#010e09] border border-amber-800/30 rounded text-amber-600 truncate max-w-[120px]">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-3 border-t border-amber-800/20 flex flex-col gap-2">
          <button
            onClick={() => onDetail(book)}
            className="w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 hover:text-white border border-amber-800/40 hover:border-amber-500"
          >
            <FileText size={11} /> View Details
          </button>
          {readLink && (
            <button
              onClick={() => onRead(readLink.url, book)}
              className="w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white shadow"
            >
              <Eye size={11} /> Read Book
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

  // Search state
  const [search, setSearch]           = useState('');
  const [topic, setTopic]             = useState('');
  const [language, setLanguage]       = useState('');
  const [sort, setSort]               = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [authorYearStart, setAuthorYearStart] = useState('');
  const [authorYearEnd, setAuthorYearEnd]     = useState('');

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
      if (params.search)            query.set('search', params.search);
      if (params.topic)             query.set('topic', params.topic);
      if (params.languages)         query.set('languages', params.languages);
      if (params.sort)              query.set('sort', params.sort);
      if (params.author_year_start) query.set('author_year_start', params.author_year_start);
      if (params.author_year_end)   query.set('author_year_end',   params.author_year_end);
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

  useEffect(() => { fetchBooks({ sort: 'popular' }, 1); }, []);

  const currentParams = () => ({
    search, topic, languages: language, sort,
    author_year_start: authorYearStart, author_year_end: authorYearEnd,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(currentParams(), 1);
  };

  const openReader = (url, book) => {
    setReaderUrl(url);
    setReaderTitle(book.title);
    setSelectedBook(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#032316] text-amber-100 p-6 rounded-2xl border border-amber-800/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 z-10 relative">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-950/60">
              <BookOpen className="text-white" size={20} />
            </div>
            Project Gutenberg
          </h2>
          <p className="text-amber-500/80 mt-1 text-sm">
            {totalCount > 0
              ? `${totalCount.toLocaleString()} free public-domain books via Gutendex API`
              : "Free public-domain ebooks from the world's oldest digital library"}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
            showFilters
              ? 'bg-amber-600 border-amber-500 text-white'
              : 'bg-amber-900/30 border-amber-800/50 text-amber-300 hover:text-white hover:bg-amber-800/50'
          }`}
        >
          <Filter size={14} /> Advanced Filters
        </button>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="z-10 relative mb-4">
        <div className="flex gap-3 bg-[#021810]/60 p-3 rounded-2xl border border-amber-800/30">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-5 h-5" />
            <input
              type="text"
              placeholder="Search titles, authors... (e.g. Dickens, Shakespeare, Alice in Wonderland)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#032316] border border-amber-700/40 rounded-xl pl-10 pr-4 py-2.5 text-amber-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-amber-700 transition-all"
            />
          </div>
          <div className="relative w-44">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 w-4 h-4 pointer-events-none" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full bg-[#032316] border border-amber-700/40 rounded-xl pl-9 pr-4 py-2.5 text-amber-100 focus:outline-none focus:border-amber-500 transition-all appearance-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-2 p-4 bg-[#021810] border border-amber-800/30 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-lg px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 transition"
              >
                {LANGUAGE_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                Topic / Bookshelf
              </label>
              <input
                type="text"
                placeholder="e.g. children, mystery"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-lg px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                Author Born After
              </label>
              <input
                type="number"
                placeholder="e.g. 1700"
                value={authorYearStart}
                onChange={e => setAuthorYearStart(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-lg px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                Author Died Before
              </label>
              <input
                type="number"
                placeholder="e.g. 1900"
                value={authorYearEnd}
                onChange={e => setAuthorYearEnd(e.target.value)}
                className="w-full bg-[#032316] border border-amber-700/40 rounded-lg px-3 py-2 text-amber-100 text-xs focus:outline-none focus:border-amber-500 placeholder-amber-700 transition"
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setLanguage(''); setTopic(''); setAuthorYearStart(''); setAuthorYearEnd(''); }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:text-white border border-amber-800/40 hover:bg-amber-900/30 transition"
              >
                Clear Filters
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition">
                Apply &amp; Search
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-900/30 border border-red-600/40 text-red-200 p-4 rounded-xl mb-4 flex items-center gap-3 z-10">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Unable to reach Project Gutenberg</p>
            <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Book Grid ── */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium animate-pulse text-sm">Querying Project Gutenberg...</p>
          </div>
        ) : books.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-64 text-amber-700/50">
            <BookOpen size={48} className="mb-3 opacity-40" />
            <p className="font-medium">No books found.</p>
            <p className="text-xs mt-1 text-amber-700/40">Try a different search or remove filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-amber-800/30 z-10">
          <button
            disabled={!prevUrl || loading}
            onClick={() => fetchBooks(currentParams(), currentPage - 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/40 text-amber-300 hover:bg-amber-800 hover:text-white disabled:opacity-40 transition text-sm font-bold"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="text-center text-xs font-mono text-amber-600">
            <span className="font-bold text-amber-400">Page {currentPage}</span>
            {' · '}
            {totalCount.toLocaleString()} total
            {' · '}
            <span className="text-amber-700">Gutendex · Project Gutenberg</span>
          </div>
          <button
            disabled={!nextUrl || loading}
            onClick={() => fetchBooks(currentParams(), currentPage + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/40 text-amber-300 hover:bg-amber-800 hover:text-white disabled:opacity-40 transition text-sm font-bold"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onRead={openReader}
      />
      <InlineReader
        url={readerUrl}
        title={readerTitle}
        onClose={() => setReaderUrl(null)}
      />
    </div>
  );
}
