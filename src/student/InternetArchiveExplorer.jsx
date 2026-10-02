import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, BookOpen, User, Calendar, Download, ExternalLink,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, FileText,
  Tag, RotateCw, Copy, Check, X, Shield, Eye, Layers, Library,
  Sparkles, Globe, Filter, Bookmark, Info
} from 'lucide-react';

const API_BASE = '/api/internet-archive';

const POPULAR_TOPICS = [
  'Computer Science',
  'Python Programming',
  'Artificial Intelligence',
  'World History',
  'Philosophy',
  'Physics',
  'Literature',
  'Economics'
];

export default function InternetArchiveExplorer() {
  const [query, setQuery] = useState('Computer Science');
  const [accessFilter, setAccessFilter] = useState('open'); // 'open' | 'all'
  const [sortOrder, setSortOrder] = useState('-downloads');
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [selectedBook, setSelectedBook] = useState(null); // for metadata modal
  const [metaLoading, setMetaLoading] = useState(false);
  const [activeReader, setActiveReader] = useState(null); // { url, title, author, type, directUrl, identifier }
  const [copied, setCopied] = useState(false);

  // Fetch search results from our Laravel backend proxy
  const fetchArchiveBooks = useCallback(async (searchQ = query, filter = accessFilter, sort = sortOrder, pageNum = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        q: searchQ,
        filter: filter,
        sort: sort,
        page: pageNum.toString(),
        rows: '24'
      });

      const res = await fetch(`${API_BASE}/search?${params}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setBooks(data.results || []);
        setTotalCount(data.count || 0);
      } else {
        setError(data.message || 'Failed to load Internet Archive books.');
      }
    } catch (err) {
      console.error('Internet Archive fetch error:', err);
      setError('Unable to connect to Internet Archive API. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, accessFilter, sortOrder, page]);

  // Initial load
  useEffect(() => {
    fetchArchiveBooks(query, accessFilter, sortOrder, page);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchArchiveBooks(query, accessFilter, sortOrder, 1);
  };

  const handleTopicClick = (topic) => {
    setQuery(topic);
    setPage(1);
    fetchArchiveBooks(topic, accessFilter, sortOrder, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchArchiveBooks(query, accessFilter, sortOrder, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch full item metadata and open detail modal
  const openMetadataModal = async (identifier) => {
    setMetaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/metadata/${identifier}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSelectedBook(data.data);
        }
      }
    } catch (err) {
      console.error('Metadata fetch error:', err);
    } finally {
      setMetaLoading(false);
    }
  };

  // Launch in-app reader for any book
  const openReader = async (item) => {
    // If we already have full metadata with best PDF and item is unrestricted
    if (!item.is_restricted && item.files?.pdf?.url) {
      setActiveReader({
        url: item.files.pdf.url,
        directUrl: item.files.pdf.url,
        title: item.title,
        creator: item.creator,
        type: 'pdf',
        identifier: item.identifier,
        isRestricted: false,
        pdfUrl: item.files.pdf.url
      });
      return;
    }

    // Otherwise fetch metadata first to resolve the direct 100% full file
    try {
      const res = await fetch(`${API_BASE}/metadata/${item.identifier}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          setActiveReader({
            url: d.read_url,
            directUrl: (!d.is_restricted && d.files?.pdf?.url) ? d.files.pdf.url : d.details_url,
            title: d.title,
            creator: d.creator,
            type: d.reader_type,
            identifier: d.identifier,
            isRestricted: d.is_restricted,
            pdfUrl: (!d.is_restricted && d.files?.pdf?.url) ? d.files.pdf.url : null
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Reader metadata resolve error:', e);
    }

    // Fallback: direct Archive link
    setActiveReader({
      url: `https://archive.org/details/${item.identifier}?view=theater&ui=embed`,
      directUrl: `https://archive.org/details/${item.identifier}`,
      title: item.title,
      creator: item.creator,
      type: 'embed',
      identifier: item.identifier,
      isRestricted: item.is_restricted
    });
  };

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Header & Search Banner ─── */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#021810] via-[#032316] to-[#043320] border border-emerald-700/60 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-mono mb-3">
            <Library size={13} />
            <span>Official Internet Archive API Stack</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Direct Internet Archive Book Repository
          </h1>
          <p className="text-emerald-300/90 text-sm mt-1 leading-relaxed">
            Search, retrieve full metadata, and stream <strong className="text-white">100% complete books & PDFs</strong> without omitted pages, borrow limits, or embedded iframe restrictions.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, topic, or keyword (e.g., Computer Networking, Python, Physics)..."
                className="w-full pl-11 pr-4 py-3 bg-[#01140d]/90 border border-emerald-700/70 rounded-2xl text-white placeholder-emerald-600/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 shrink-0 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Search Books</span>
            </button>
          </form>

          {/* Filter Bar & Quick Topics */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-emerald-800/40">
            {/* Access Filter Toggle */}
            <div className="flex items-center gap-1.5 bg-[#01140d]/90 p-1 rounded-xl border border-emerald-800/80">
              <button
                type="button"
                onClick={() => {
                  setAccessFilter('open');
                  setPage(1);
                  fetchArchiveBooks(query, 'open', sortOrder, 1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  accessFilter === 'open'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} className="text-amber-300" />
                <span>100% Free Full Access Only (No Borrow)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessFilter('all');
                  setPage(1);
                  fetchArchiveBooks(query, 'all', sortOrder, 1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  accessFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <Globe size={12} />
                <span>All Books & Scans</span>
              </button>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <span className="text-emerald-400/80 font-mono text-[11px]">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                  fetchArchiveBooks(query, accessFilter, e.target.value, 1);
                }}
                className="bg-[#01140d] border border-emerald-800 rounded-lg px-2.5 py-1 text-emerald-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              >
                <option value="-downloads">Most Downloaded</option>
                <option value="-publicdate">Recently Added</option>
                <option value="titleSorter">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Quick Topics Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-emerald-500 font-mono mr-1">Trending:</span>
            {POPULAR_TOPICS.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleTopicClick(topic)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                  query.toLowerCase() === topic.toLowerCase()
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Search Stats Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300 font-mono px-2">
        <div className="flex items-center gap-2">
          <span>Found <strong>{totalCount.toLocaleString()}</strong> results on Internet Archive</span>
          {accessFilter === 'open' && (
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 text-[10px] font-bold">
              ✓ Filtered: 100% Unrestricted Complete Items
            </span>
          )}
        </div>
        <div>Page {page} of {Math.ceil(totalCount / 24) || 1}</div>
      </div>

      {/* ─── Results Grid ─── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-emerald-200 text-sm font-semibold tracking-wide">
            Querying Internet Archive Advanced Search API...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[#032316] border border-rose-500/40 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-rose-200 text-sm font-bold">{error}</p>
          <button
            onClick={() => fetchArchiveBooks()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow"
          >
            Try Again
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-[#021810] rounded-2xl border border-emerald-900">
          <BookOpen className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-white font-bold">No books found for "{query}"</h3>
          <p className="text-emerald-400 text-xs">Try searching with broader terms or toggle to "All Books & Scans".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => {
            const isRestricted = book.is_restricted;
            return (
              <div
                key={book.identifier}
                className="bg-[#032316] border border-emerald-800/70 hover:border-emerald-500/80 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl group"
              >
                <div>
                  {/* Cover + Badge */}
                  <div className="relative aspect-[3/4] bg-[#01140d] rounded-xl overflow-hidden mb-3 border border-emerald-900/80 flex items-center justify-center">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center text-emerald-600 flex-col gap-1 p-2 text-center">
                      <BookOpen size={28} />
                      <span className="text-[10px] line-clamp-2">{book.title}</span>
                    </div>

                    {/* Format Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {!isRestricted ? (
                        <span className="px-2 py-0.5 bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 text-[10px] font-bold rounded-md shadow backdrop-blur-xs">
                          100% Free Full Book
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-950/90 border border-amber-600/70 text-amber-300 text-[10px] font-bold rounded-md shadow backdrop-blur-xs">
                          Controlled Lending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Author */}
                  <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-emerald-400 text-xs truncate mt-1">
                    {book.creator || 'Unknown Author'}
                  </p>

                  {/* Year & Downloads */}
                  <div className="flex items-center justify-between text-[11px] text-emerald-500/80 font-mono mt-2 pt-2 border-t border-emerald-900/60">
                    <span>{book.year ? `Year: ${book.year}` : 'Public Archive'}</span>
                    <span>{book.downloads ? `${book.downloads.toLocaleString()} downloads` : ''}</span>
                  </div>

                  {/* Subjects */}
                  {book.subjects?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {book.subjects.slice(0, 2).map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-[10px] text-emerald-400 border border-emerald-800 truncate max-w-[120px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-emerald-900/60 flex flex-col gap-1.5">
                  <button
                    onClick={() => openReader(book)}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <BookOpen size={13} />
                    <span>{!isRestricted ? 'Read 100% Full Book' : 'Read / Borrow Online'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openMetadataModal(book.identifier)}
                      className="flex-1 py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Info size={11} />
                      <span>Details & Files</span>
                    </button>
                    <button
                      onClick={() => window.open(book.details_url, '_blank', 'noopener,noreferrer')}
                      className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-white transition"
                      title="Open on Archive.org"
                    >
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination Bar ─── */}
      {totalCount > 24 && !loading && (
        <div className="flex items-center justify-center gap-3 pt-6 pb-10">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs text-emerald-300 font-mono px-3">
            Page {page} of {Math.ceil(totalCount / 24)}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil(totalCount / 24)}
            className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ─── METADATA MODAL (API Details & Downloadable Files) ─── */}
      {selectedBook && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#032316] border border-emerald-700/60 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-emerald-800/60 bg-[#021810]">
              <div className="flex items-center gap-2">
                <Library size={18} className="text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Item Metadata & Available Files</h2>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-full hover:bg-emerald-900 text-emerald-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              <div className="flex gap-4">
                <img
                  src={selectedBook.cover_url}
                  alt={selectedBook.title}
                  className="w-24 h-32 object-cover rounded-xl border border-emerald-800 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white leading-snug">{selectedBook.title}</h3>
                  <p className="text-emerald-300 text-sm mt-1">{selectedBook.creator}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[11px]">
                    {selectedBook.year && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                        {selectedBook.year}
                      </span>
                    )}
                    {selectedBook.total_pages && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                        {selectedBook.total_pages} Pages
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded font-bold ${selectedBook.is_restricted ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'}`}>
                      {selectedBook.is_restricted ? 'Controlled Digital Lending' : 'Full Open Access'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedBook.description && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-emerald-400 font-mono tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed bg-[#021810] p-3 rounded-xl border border-emerald-900/60 max-h-36 overflow-y-auto">
                    {selectedBook.description}
                  </p>
                </div>
              )}

              {/* Direct Files Section */}
              <div>
                <h4 className="text-xs uppercase font-bold text-emerald-400 font-mono tracking-wider mb-2 flex items-center gap-1.5">
                  <Download size={13} /> Direct Downloadable Files & Streams
                </h4>
                <div className="space-y-2">
                  {selectedBook.files?.pdf && (
                    <div className="p-3 bg-[#021810] rounded-xl border border-emerald-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="text-rose-400 shrink-0" size={18} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{selectedBook.files.pdf.name}</p>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            PDF Document • {(selectedBook.files.pdf.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                      <a
                        href={selectedBook.files.pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <Download size={12} /> Download PDF
                      </a>
                    </div>
                  )}

                  {selectedBook.files?.epub && (
                    <div className="p-3 bg-[#021810] rounded-xl border border-emerald-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="text-indigo-400 shrink-0" size={18} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{selectedBook.files.epub.name}</p>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            EPUB E-Book • {(selectedBook.files.epub.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                      <a
                        href={selectedBook.files.epub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <Download size={12} /> Download EPUB
                      </a>
                    </div>
                  )}

                  {selectedBook.files?.txt && (
                    <div className="p-3 bg-[#021810] rounded-xl border border-emerald-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="text-teal-400 shrink-0" size={18} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{selectedBook.files.txt.name}</p>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            Full OCR Text • {(selectedBook.files.txt.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>
                      <a
                        href={selectedBook.files.txt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <Download size={12} /> Download Text
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#021810] border-t border-emerald-800/60 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-emerald-400 truncate">
                ID: {selectedBook.identifier}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 text-xs font-bold text-emerald-400 hover:text-white transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const bk = selectedBook;
                    setSelectedBook(null);
                    openReader(bk);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <BookOpen size={14} /> Read Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── IN-APP NATIVE VIEWER MODAL ─── */}
      {activeReader && (
        <div className="fixed inset-0 z-[140] flex flex-col bg-[#021810] animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#032316] border-b border-emerald-800/60 shadow-xl gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-emerald-100 font-bold text-sm truncate max-w-[280px] sm:max-w-md">
                    {activeReader.title}
                  </h3>
                  {!activeReader.isRestricted ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                      100% Free Full Document
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-bold rounded-full shrink-0">
                      Controlled Digital Lending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400/80 font-mono">
                  {activeReader.creator && <span>{activeReader.creator}</span>}
                  <span>•</span>
                  <span>{activeReader.type === 'pdf' ? 'Direct PDF Stream' : 'Internet Archive Document'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!activeReader.isRestricted && activeReader.pdfUrl && (
                <a
                  href={activeReader.pdfUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  <Download size={13} />
                  <span>Download Full PDF</span>
                </a>
              )}

              {activeReader.isRestricted && (
                <button
                  onClick={() => window.open(`https://archive.org/details/${activeReader.identifier}`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold shadow transition animate-pulse hover:animate-none"
                >
                  <ExternalLink size={13} />
                  <span>Borrow on Archive.org</span>
                </button>
              )}

              <button
                onClick={() => window.open(activeReader.directUrl || activeReader.url, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <ExternalLink size={13} />
                <span className="hidden md:inline">Open in Tab</span>
              </button>

              <button
                onClick={() => handleCopy(activeReader.directUrl || activeReader.url)}
                className="p-2 bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg transition"
                title={copied ? 'Copied!' : 'Copy Link'}
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <div className="h-5 w-px bg-emerald-800/60 mx-1 hidden sm:block" />

              <button
                onClick={() => setActiveReader(null)}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shadow transition"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Frame / Viewer */}
          <div className="flex-1 w-full h-full relative bg-[#fdfaf4] overflow-hidden flex flex-col">
            <iframe
              src={activeReader.url}
              className="flex-1 w-full h-full border-none bg-[#fdfaf4]"
              title={activeReader.title}
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
