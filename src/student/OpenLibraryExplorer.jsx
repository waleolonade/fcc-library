import React, { useState, useEffect } from 'react';
import { Search, BookOpen, User, Calendar, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, AlertTriangle, ExternalLink, X, FileSearch, List, FileText, RotateCw, Copy, Check, Eye, Library, Download } from 'lucide-react';

// ─── Safe string extractor ─────────────────────────────────────────────────────
// Open Library API returns inconsistent shapes: sometimes plain strings,
// sometimes objects like { type: '/type/text', value: '...' }.
// This helper guarantees we always get a primitive string out.
const safeStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (typeof val.value === 'string') return val.value;
    if (typeof val.name === 'string') return val.name;
  }
  return '';
};

// ─── NativeDetailModal ─────────────────────────────────────────────────────────
// Extracted as a standalone component so that any render error is isolated
// and never silently kills the parent component.
function NativeDetailModal({ nativeDetail, onClose, onRead, onOpenUrl, onFetchAuthor, onSearchInside, onReadEdition }) {
  if (!nativeDetail) return null;

  const { data, type, originalKey, originalBook, editions = [], iaId, iaMetadata } = nativeDetail;

  // --- Extract all fields safely ---
  const title       = safeStr(data.title) || safeStr(data.name) || safeStr(data.personal_name) || 'Unknown Item';
  const description = safeStr(data.description);
  const birthDate   = safeStr(data.birth_date)  || safeStr(data.first_publish_date);
  const deathDate   = safeStr(data.death_date);
  const subtitle    = safeStr(data.subtitle);

  const subjects  = Array.isArray(data.subjects)  ? data.subjects  : [];
  const links     = Array.isArray(data.links)     ? data.links     : [];
  const authors   = Array.isArray(data.authors)   ? data.authors   : [];

  // Fallback to edition covers if work has none
  const allCovers = Array.isArray(data.covers) && data.covers.length > 0
    ? data.covers
    : (originalBook?.cover_i ? [originalBook.cover_i] : (editions.find(e => e.covers?.length > 0)?.covers || []));

  // Dates from API
  const createdRaw  = data.created?.value  || data.created  || '';
  const modifiedRaw = data.last_modified?.value || data.last_modified || '';
  const fmtDate = (raw) => {
    if (!raw) return '';
    try { return new Date(raw).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return String(raw).split('T')[0]; }
  };
  const createdDate  = fmtDate(createdRaw);
  const modifiedDate = fmtDate(modifiedRaw);
  const revision     = data.latest_revision || data.revision;

  // Cover image
  const coverId = allCovers[0];
  const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;

  // Resolve Archive.org identifier & full access details
  const activeIaId = iaId || originalBook?.ia?.[0] || data.ocaid || (Array.isArray(data.ia) ? data.ia[0] : data.ia) || (editions.find(e => e.ocaid || (e.ia && e.ia.length > 0))?.ocaid || editions.find(e => e.ia && e.ia.length > 0)?.ia?.[0]);
  const isCdlRestricted = iaMetadata?.metadata?.['access-restricted-item'] === 'true' || originalBook?.ebook_access === 'borrowable' || editions.some(e => e.ebook_access === 'borrowable');
  const totalPages = iaMetadata?.metadata?.imagecount || iaMetadata?.metadata?.pages || editions.find(e => e.number_of_pages)?.number_of_pages || null;
  const directArchiveUrl = activeIaId ? `https://archive.org/details/${activeIaId}` : null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#032316] border border-emerald-800/60 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex justify-between items-center p-5 border-b border-emerald-800/50 bg-[#021810]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {type === 'author' ? <User className="text-emerald-400" size={20} /> : <BookOpen className="text-emerald-400" size={20} />}
            {type === 'author' ? 'Author Profile' : 'Book Details & Full Reading Access'}
          </h2>
          <button onClick={onClose} className="text-emerald-400 hover:text-white transition p-1 bg-emerald-900/50 hover:bg-emerald-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

          {/* Cover + Title block */}
          <div className="flex gap-4">
            {coverUrl && (
              <img
                src={coverUrl}
                alt={title}
                className="w-24 h-32 object-cover rounded-xl border border-emerald-800/50 shadow-lg flex-shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white leading-snug">{title}</h1>
              {subtitle && <p className="text-emerald-300/80 text-sm mt-1 italic">{subtitle}</p>}
              {birthDate && (
                <div className="text-sm font-mono text-emerald-400 font-bold mt-1">
                  {birthDate}{deathDate ? ` – ${deathDate}` : ''}
                </div>
              )}

              {/* Metadata pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {totalPages && (
                  <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-700/60 rounded-full text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                    <FileText size={11} /> {totalPages} Pages Total
                  </span>
                )}
                {isCdlRestricted ? (
                  <span className="px-2.5 py-0.5 bg-amber-950 border border-amber-600/60 rounded-full text-[11px] font-mono font-bold text-amber-300">
                    Controlled Digital Lending (Free 1-Hr Loan)
                  </span>
                ) : activeIaId ? (
                  <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-600/60 rounded-full text-[11px] font-mono font-bold text-emerald-300">
                    Full Open Access
                  </span>
                ) : null}
                {revision && (
                  <span className="px-2 py-0.5 bg-emerald-900/60 border border-emerald-700/50 rounded-full text-[10px] font-mono font-bold text-emerald-400">
                    Rev. {revision}
                  </span>
                )}
                {createdDate && (
                  <span className="px-2 py-0.5 bg-[#021810] border border-emerald-800/40 rounded-full text-[10px] font-mono text-emerald-500">
                    Added: {createdDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── FULL ACCESS & READING OPTIONS PANEL ── */}
          {type !== 'author' && activeIaId && (
            <div className="p-4 rounded-2xl border bg-gradient-to-br from-emerald-950/40 via-[#021810] to-[#032316] border-emerald-600/50 shadow-lg space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Complete Digitized Volume
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-black/40 text-emerald-300 border border-emerald-800">
                      ID: {activeIaId}
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                    Directly connected to Internet Archive and Open Library APIs. Stream the full PDF, view raw catalog metadata, or launch our integrated reader with complete access.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={onRead}
                  className="flex-1 min-w-[200px] px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition transform hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Eye size={14} />
                  <span>Read Online (All {totalPages || ''} Pages)</span>
                </button>

                {directArchiveUrl && (
                  <button
                    onClick={() => window.open(directArchiveUrl, '_blank', 'noopener,noreferrer')}
                    className="px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 hover:text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink size={14} />
                    <span>Archive.org Source</span>
                  </button>
                )}

                {onSearchInside && (
                  <button
                    onClick={() => onSearchInside({ ...originalBook, title, ia: [activeIaId] })}
                    className="px-3.5 py-2.5 bg-[#021810] hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Search size={13} />
                    <span>Search Inside Book</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Authors */}
          {authors.length > 0 && (
            <div>
              <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <User size={11} /> Authors
              </h3>
              <div className="flex flex-wrap gap-2">
                {authors.map((a, i) => {
                  const authorKey = a?.author?.key || a?.key || '';
                  return authorKey ? (
                    <button
                      key={i}
                      onClick={() => onFetchAuthor && onFetchAuthor(authorKey)}
                      className="px-3 py-1.5 bg-emerald-900/40 border border-emerald-700/60 rounded-lg text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-800 hover:border-emerald-500 transition flex items-center gap-1"
                    >
                      <User size={10} /> View Author Profile
                    </button>
                  ) : (
                    <span key={i} className="px-2 py-1 bg-[#021810] border border-emerald-800/40 rounded-lg text-xs text-emerald-400">
                      Unknown Author
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {description ? (
            <div>
              <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2 tracking-widest">Description</h3>
              <div className="text-emerald-100/90 text-sm leading-relaxed whitespace-pre-wrap bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/50 max-h-48 overflow-y-auto">
                {description}
              </div>
            </div>
          ) : (
            <div className="text-emerald-600/80 text-sm italic bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30">
              No description available from the Open Library API for this item.
            </div>
          )}

          {/* ── EDITIONS EXPLORER ── */}
          {editions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-between">
                <span>Editions of this Work ({editions.length})</span>
                <span className="text-[10px] font-normal text-emerald-500">Live Open Library API</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {editions.map((ed, idx) => {
                  const edIaId = ed.ocaid || (Array.isArray(ed.ia) && ed.ia[0]);
                  const edPages = ed.number_of_pages || null;
                  const edYear = ed.publish_date || null;
                  const edPublisher = Array.isArray(ed.publishers) ? ed.publishers.join(', ') : (ed.publishers || null);

                  return (
                    <div key={idx} className="p-3 bg-[#021810] rounded-xl border border-emerald-900/60 hover:border-emerald-600/50 transition flex flex-col justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{ed.title || title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono mt-0.5">
                          {edYear && <span>{edYear}</span>}
                          {edPages && <span>• {edPages} pages</span>}
                          {edPublisher && <span className="truncate max-w-[120px]">• {edPublisher}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/40">
                        {edIaId ? (
                          <button
                            onClick={() => window.open(`https://archive.org/details/${edIaId}`, '_blank', 'noopener,noreferrer')}
                            className="flex-1 py-1 px-2 bg-amber-600/80 hover:bg-amber-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            title="Open full book loan on Archive.org"
                          >
                            <ExternalLink size={10} /> Full Borrow
                          </button>
                        ) : null}

                        {onReadEdition && (
                          <button
                            onClick={() => onReadEdition(ed)}
                            className="py-1 px-2.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <Eye size={10} /> Preview
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <div>
              <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2 tracking-widest">Subjects / Topics</h3>
              <div className="flex flex-wrap gap-2">
                {subjects.slice(0, 20).map((subj, i) => (
                  <span key={i} className="px-2 py-1 bg-[#021810] border border-emerald-800/50 rounded-lg text-xs text-emerald-300">
                    {safeStr(subj) || 'Subject'}
                  </span>
                ))}
                {subjects.length > 20 && (
                  <span className="px-2 py-1 text-emerald-600 text-xs">+{subjects.length - 20} more</span>
                )}
              </div>
            </div>
          )}

          {/* External Links */}
          {links.length > 0 && (
            <div>
              <h3 className="text-emerald-400 font-bold text-xs uppercase mb-2 tracking-widest">External Links</h3>
              <div className="flex flex-wrap gap-2">
                {links.map((lnk, i) => {
                  const url   = typeof lnk === 'string' ? lnk : (lnk?.url || '');
                  const label = typeof lnk === 'string' ? 'Link' : (safeStr(lnk?.title) || safeStr(lnk?.name) || 'External Link');
                  return url ? (
                    <button key={i} onClick={() => onOpenUrl(url)} className="px-3 py-1.5 bg-emerald-900/40 rounded-lg border border-emerald-800 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-800 transition flex items-center gap-1">
                      {label} <ExternalLink size={10} />
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Source Attribution */}
          <div className="pt-2 border-t border-emerald-800/40">
            <div className="bg-[#021810] p-4 rounded-xl border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Source</h4>
                <p className="text-sm text-emerald-100">Data by <strong className="text-white">Open Library</strong> · Internet Archive</p>
                <p className="text-[10px] font-mono text-emerald-600">{originalKey}</p>
              </div>
              <button
                onClick={() => window.open(`https://openlibrary.org${originalKey}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
              >
                Open on openlibrary.org <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="p-4 bg-[#021810] border-t border-emerald-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-emerald-400/80 font-mono">
            {activeIaId ? `Archive.org ID: ${activeIaId}` : 'Digital Repository API'}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl font-bold text-emerald-400 hover:text-white transition text-xs">
              Close
            </button>
            {type !== 'author' && directArchiveUrl && (
              <button
                onClick={() => window.open(directArchiveUrl, '_blank', 'noopener,noreferrer')}
                className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-4 py-2 rounded-xl font-bold shadow transition flex items-center gap-2 text-xs"
              >
                <ExternalLink size={14} /> Archive Source
              </button>
            )}
            {type !== 'author' && (
              <button
                onClick={onRead}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2 text-xs"
              >
                <BookOpen size={14} /> Read Online
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── IntegratedViewerModal ───────────────────────────────────────────────────
// Enterprise-grade document viewer with:
// 1. Permissive feature policy (fullscreen, audio, canvas) for BookReader
// 2. Unrestricted embedding for trusted domains (archive.org, openlibrary.org)
// 3. Zero-silent-failure timeout detection with 1-click direct link fallback
// 4. Keyboard ESC listener and status indicators
function IntegratedViewerModal({ viewerData, onClose }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stalledNotice, setStalledNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  // Federated Cross-API States
  const [currentUrl, setCurrentUrl] = useState(viewerData?.url || '');
  const [activeProvider, setActiveProvider] = useState(viewerData?.readerType === 'pdf' ? 'pdf' : 'archive'); // 'pdf' | 'archive' | 'gutenberg' | 'txt' | 'edition'
  const [gutenbergMatch, setGutenbergMatch] = useState(null);
  const [searchingGutenberg, setSearchingGutenberg] = useState(false);
  const [altEditions, setAltEditions] = useState([]);
  const [iaData, setIaData] = useState(null);
  const [iaPdf, setIaPdf] = useState(null);
  const [iaTxt, setIaTxt] = useState(null);

  useEffect(() => {
    if (!viewerData) return;
    const initialUrl = viewerData.url || '';
    setCurrentUrl(initialUrl);
    setActiveProvider(viewerData.readerType === 'pdf' ? 'pdf' : 'archive');
    setLoading(true);
    setStalledNotice(false);
    setGutenbergMatch(null);
    setAltEditions([]);
    setIaData(null);
    setIaPdf(null);
    setIaTxt(null);

    // 1. Resolve Internet Archive API for complete unrestricted files
    const targetIaId = viewerData.iaId || (viewerData.url?.match(/archive\.org\/(?:details|embed)\/([^\/?#]+)/)?.[1]);
    if (targetIaId) {
      fetch(`/api/internet-archive/metadata/${targetIaId}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setIaData(res.data);
            if (res.data.files?.pdf?.url) {
              setIaPdf(res.data.files.pdf);
              // If book was opened in PDF mode or has full PDF stream, prioritize direct PDF!
              if (viewerData.readerType === 'pdf' || res.data.can_read_full || !viewerData.url?.includes('/details/')) {
                setCurrentUrl(res.data.files.pdf.url);
                setActiveProvider('pdf');
                setLoading(false);
              }
            }
            if (res.data.files?.txt) {
              setIaTxt(res.data.files.txt);
            }
          }
        })
        .catch(err => {
          fetch(`https://archive.org/metadata/${targetIaId}`)
            .then(r => r.json())
            .then(raw => {
              const files = raw.files || [];
              const pdf = files.find(f => f.name?.toLowerCase().endsWith('.pdf') && !f.name.includes('_encrypted') && !f.name.includes('_lcp'));
              if (pdf) {
                const pdfUrl = `https://archive.org/download/${targetIaId}/${encodeURIComponent(pdf.name)}`;
                const resolvedPdf = { name: pdf.name, url: pdfUrl, size: pdf.size };
                setIaPdf(resolvedPdf);
                if (viewerData.readerType === 'pdf') {
                  setCurrentUrl(pdfUrl);
                  setActiveProvider('pdf');
                  setLoading(false);
                }
              }
            })
            .catch(() => {});
        });
    }

    // 2. Query Gutendex for complete full-text public domain version
    const rawTitle = viewerData.title || '';
    const cleanTitle = rawTitle
      .replace(/[\(\[\{].*?[\)\]\}]/g, '')
      .replace(/[:\-–—].*$/, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim();

    if (cleanTitle && cleanTitle.length > 2) {
      setSearchingGutenberg(true);
      fetch(`https://gutendex.com/books/?search=${encodeURIComponent(cleanTitle)}`)
        .then(r => r.json())
        .then(data => {
          if (data.results && data.results.length > 0) {
            const match = data.results.find(b => {
              const bTitle = b.title.toLowerCase();
              const cTitle = cleanTitle.toLowerCase();
              return bTitle.includes(cTitle) || cTitle.includes(bTitle);
            }) || data.results[0];

            if (match && match.formats) {
              const htmlUrl = match.formats['text/html'] || match.formats['text/html; charset=utf-8'];
              const textUrl = match.formats['text/plain; charset=utf-8'] || match.formats['text/plain'];
              const readUrl = htmlUrl || textUrl;
              if (readUrl) {
                setGutenbergMatch({
                  id: match.id,
                  title: match.title,
                  readUrl,
                  authors: match.authors?.map(a => a.name).join(', ')
                });
              }
            }
          }
        })
        .catch(err => console.warn('Gutendex error:', err))
        .finally(() => setSearchingGutenberg(false));
    }

    // 3. Check Open Library editions for public / unrestricted copies
    const workKey = viewerData.originalBook?.key || (viewerData.openLibraryUrl ? viewerData.openLibraryUrl.replace('https://openlibrary.org', '') : null);
    if (workKey && workKey.startsWith('/works/')) {
      fetch(`https://openlibrary.org${workKey}/editions.json?limit=15`)
        .then(r => r.json())
        .then(data => {
          if (data.entries) {
            const publicCopies = data.entries.filter(e => 
              (e.ebook_access === 'public' || e.ebook_access === 'full') &&
              (e.ocaid || (e.ia && e.ia.length > 0))
            );
            setAltEditions(publicCopies);
          }
        })
        .catch(err => console.warn('OL editions error:', err));
    }

    const timer = setTimeout(() => {
      setStalledNotice(true);
    }, 7000);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewerData, iframeKey, onClose]);

  if (!viewerData) return null;

  const url = currentUrl || viewerData.url || '';
  const directUrl = viewerData.directUrl || viewerData.url;
  const title = viewerData.title || 'Integrated Reader';
  const author = viewerData.author || '';

  const handleCopy = () => {
    let copyTarget = directUrl;
    if (activeProvider === 'pdf' && iaPdf?.url) copyTarget = iaPdf.url;
    else if (activeProvider === 'gutenberg' && gutenbergMatch?.readUrl) copyTarget = gutenbergMatch.readUrl;
    if (copyTarget) {
      navigator.clipboard.writeText(copyTarget);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReload = () => {
    setLoading(true);
    setStalledNotice(false);
    setIframeKey((prev) => prev + 1);
  };

  const openDirect = () => {
    let targetUrl = directUrl;
    if (activeProvider === 'pdf' && iaPdf?.url) targetUrl = iaPdf.url;
    else if (activeProvider === 'gutenberg' && gutenbergMatch?.readUrl) targetUrl = gutenbergMatch.readUrl;
    else if (activeProvider === 'txt' && iaTxt?.url) targetUrl = iaTxt.url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const isTrustedProvider = url.includes('archive.org') || url.includes('openlibrary.org') || url.includes('gutenberg.org');

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#021810] animate-in fade-in duration-200">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#032316] border-b border-emerald-800/60 shadow-xl gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-emerald-100 font-bold text-sm truncate max-w-[280px] sm:max-w-md" title={title}>
                {title}
              </h3>
              {activeProvider === 'pdf' && (
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                  Full PDF (All Pages)
                </span>
              )}
              {activeProvider === 'gutenberg' && (
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                  100% Full Unrestricted Text
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400/80 font-medium">
              {author && <span className="truncate max-w-[200px]">{author}</span>}
              {author && <span>•</span>}
              <span className="font-mono text-emerald-500">
                {activeProvider === 'pdf' ? 'Internet Archive API • Complete PDF Stream' : activeProvider === 'gutenberg' ? 'Project Gutenberg Full-Text Reader' : url.includes('archive.org') ? 'Internet Archive BookReader' : url.includes('openlibrary.org') ? 'Open Library' : 'External Document'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Source Switcher Tabs ── */}
        <div className="flex items-center gap-1.5 bg-[#021810] p-1 rounded-xl border border-emerald-800/80">
          {iaPdf && (
            <button
              onClick={() => {
                setCurrentUrl(iaPdf.url);
                setActiveProvider('pdf');
                setLoading(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeProvider === 'pdf'
                  ? 'bg-emerald-500 text-black shadow ring-1 ring-emerald-300'
                  : 'text-emerald-400 hover:text-white'
              }`}
              title="Read complete unabridged PDF with all pages unlocked"
            >
              <FileText size={12} />
              <span>Full Book PDF</span>
            </button>
          )}

          {viewerData.url && viewerData.url !== iaPdf?.url && (
            <button
              onClick={() => {
                setCurrentUrl(viewerData.url);
                setActiveProvider('archive');
                setLoading(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeProvider === 'archive'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              <Library size={12} />
              <span>Book Reader</span>
            </button>
          )}

          {gutenbergMatch ? (
            <button
              onClick={() => {
                setCurrentUrl(gutenbergMatch.readUrl);
                setActiveProvider('gutenberg');
                setLoading(true);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeProvider === 'gutenberg'
                  ? 'bg-emerald-500 text-black shadow ring-1 ring-emerald-300'
                  : 'bg-emerald-950/80 text-emerald-300 hover:text-white border border-emerald-700'
              }`}
              title="Switch to Project Gutenberg unabridged text"
            >
              <BookOpen size={12} />
              <span>Gutenberg (Full Text)</span>
            </button>
          ) : searchingGutenberg ? (
            <span className="px-2 py-1 text-[10px] text-emerald-500 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Cross-checking APIs...
            </span>
          ) : null}

          {altEditions.length > 0 && (
            <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-mono text-emerald-400">
              +{altEditions.length} Public Edition{altEditions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Action Controls ── */}
        <div className="flex items-center gap-2 shrink-0">
          {iaPdf && (
            <button
              onClick={() => window.open(iaPdf.url, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
              title="Download full PDF for offline reading"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}

          <button
            onClick={openDirect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-700/60 rounded-lg text-xs font-semibold shadow-sm transition whitespace-nowrap"
            title="Open direct document in a new tab"
          >
            <ExternalLink size={13} />
            <span className="hidden md:inline">Open in Tab</span>
          </button>

          <button
            onClick={handleReload}
            className="p-2 bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg transition"
            title="Reload Frame"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleCopy}
            className="p-2 bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg transition"
            title={copied ? "Copied!" : "Copy link"}
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <div className="h-5 w-px bg-emerald-800/60 mx-1 hidden sm:block" />

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shadow-md transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ── Active Provider Status Banners ── */}
      {activeProvider === 'pdf' && (
        <div className="bg-[#032316] border-b border-emerald-600/50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200 z-10 shadow">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Internet Archive Full Access:</strong> Streaming official uncompressed PDF with all {iaData?.total_pages ? `${iaData.total_pages} pages` : 'pages'} unlocked.
            </span>
          </div>
          {iaPdf && (
            <button
              onClick={() => window.open(iaPdf.url, '_blank')}
              className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white rounded border border-emerald-700 text-[11px] font-semibold transition flex items-center gap-1"
            >
              <Download size={11} /> Save PDF ({iaPdf.size ? `${(iaPdf.size / 1024 / 1024).toFixed(1)} MB` : 'Full Volume'})
            </button>
          )}
        </div>
      )}

      {activeProvider === 'gutenberg' && (
        <div className="bg-[#032316] border-b border-emerald-600/50 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200 z-10 shadow">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-emerald-400 shrink-0" />
            <span>
              <strong>Reading via Project Gutenberg:</strong> 100% full unabridged edition with all chapters, all pages, and zero omitted content.
            </span>
          </div>
          <button
            onClick={() => {
              if (iaPdf) {
                setCurrentUrl(iaPdf.url);
                setActiveProvider('pdf');
              } else {
                setCurrentUrl(viewerData.url);
                setActiveProvider('archive');
              }
              setLoading(true);
            }}
            className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white rounded border border-emerald-700 text-[11px] font-semibold transition"
          >
            Switch to Digitized Scan
          </button>
        </div>
      )}

      {/* ── Frame Area ── */}
      <div className="flex-1 w-full h-full relative bg-[#fdfaf4] overflow-hidden flex flex-col">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#021810]/75 backdrop-blur-xs transition-opacity duration-300">
            <div className="bg-[#032316] p-5 rounded-2xl border border-emerald-500/40 shadow-2xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-emerald-200 text-xs font-bold tracking-wide">
                Connecting to {activeProvider === 'gutenberg' ? 'Project Gutenberg Full Text...' : 'Book Reader...'}
              </p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={url}
          className="flex-1 w-full h-full border-none bg-[#fdfaf4]"
          title={title}
          allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen={true}
          {...(!isTrustedProvider ? { sandbox: "allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads allow-presentation" } : {})}
          onLoad={() => setLoading(false)}
        />

        {/* ── Helper Notice on Stall / Long Load ── */}
        {stalledNotice && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 max-w-2xl w-[92%] bg-[#032316]/95 border border-emerald-500/50 backdrop-blur-md p-4 rounded-xl shadow-2xl text-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-white mb-0.5">Seeing a continuous loading circle?</p>
                <p className="text-emerald-300/90 leading-relaxed">
                  Borrow-only titles and Controlled Digital Lending items require an active Internet Archive account. Modern browser privacy policies often block third-party loan cookies inside embedded frames.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openDirect}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-all whitespace-nowrap"
              >
                Open Direct Reader <ExternalLink size={12} />
              </button>
              <button
                onClick={() => setStalledNotice(false)}
                className="p-1.5 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-800/50"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpenLibraryExplorer() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('catalog'); // 'catalog', 'reading_log', 'list_search'
  const [listType, setListType] = useState('want-to-read');
  const [query, setQuery] = useState('programming');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [totalFound, setTotalFound] = useState(0);
  const [searchInsideBook, setSearchInsideBook] = useState(null);
  const [lists, setLists] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [drillDown, setDrillDown] = useState(null); // { type: 'list' | 'author' | 'work', url: string, name: string }
  const [viewerData, setViewerData] = useState(null);
  const [nativeDetail, setNativeDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Backward-compatible bridge for any caller passing a string URL
  const setIframeUrl = (val) => {
    if (!val) {
      setViewerData(null);
    } else if (typeof val === 'string') {
      setViewerData({
        url: val,
        directUrl: val,
        title: 'Document Viewer'
      });
    } else {
      setViewerData(val);
    }
  };

  const fetchNativeDetail = async (key, type = 'work', originalBook = null) => {
    if (!key) {
      alert("Error: This item does not have a valid Open Library key.");
      return;
    }
    const path = key.startsWith('/') ? key : (type === 'author' ? `/authors/${key}` : `/works/${key}`);
    
    setDetailLoading(true);
    try {
      const res = await fetch(`https://openlibrary.org${path}.json`);
      if (res.ok) {
        const data = await res.json();
        let editions = [];
        let iaMetadata = null;
        let activeIaId = originalBook?.ia?.[0] || data.ocaid || (Array.isArray(data.ia) ? data.ia[0] : data.ia) || null;

        // If it's a work, fetch editions to find full-access / public domain copies & total page counts
        if (type === 'work') {
          try {
            const edRes = await fetch(`https://openlibrary.org${path}/editions.json?limit=15`);
            if (edRes.ok) {
              const edData = await edRes.json();
              editions = edData.entries || [];
              if (!activeIaId) {
                const edWithIa = editions.find(e => e.ocaid || (Array.isArray(e.ia) && e.ia.length > 0));
                if (edWithIa) {
                  activeIaId = edWithIa.ocaid || edWithIa.ia[0];
                }
              }
            }
          } catch (e) {
            console.warn("Could not fetch editions:", e);
          }
        }

        // Fetch Internet Archive metadata if we have an IA identifier (to get true page count, loan status, files)
        if (activeIaId) {
          try {
            const iaRes = await fetch(`https://archive.org/metadata/${activeIaId}`);
            if (iaRes.ok) {
              iaMetadata = await iaRes.json();
            }
          } catch (e) {
            console.warn("Could not fetch IA metadata:", e);
          }
        }

        setNativeDetail({
          type,
          data,
          originalKey: key,
          originalBook,
          editions,
          iaId: activeIaId,
          iaMetadata
        });
      } else {
        alert("Could not load details from Open Library API.");
      }
    } catch (err) {
      alert("Error loading details from API.");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchBooks = async (searchQuery, sortBy, pageNum = 1, currentMode = searchMode, currentListType = listType, currentDrillDown = drillDown) => {
    if (!searchQuery) return;
    
    setLoading(true);
    setError('');
    try {
      let url;
      if (currentDrillDown) {
        if (currentDrillDown.type === 'list') {
          url = `https://openlibrary.org${currentDrillDown.url}/seeds.json?page=${pageNum}`;
        } else if (currentDrillDown.type === 'author') {
          url = `https://openlibrary.org${currentDrillDown.url}/works.json?limit=24&offset=${(pageNum - 1) * 24}`;
        } else if (currentDrillDown.type === 'work') {
          url = `https://openlibrary.org${currentDrillDown.url}/editions.json?limit=24&offset=${(pageNum - 1) * 24}`;
        }
      } else if (currentMode === 'catalog') {
        const fields = 'key,title,author_name,first_publish_year,cover_i,subject,editions,editions.key,editions.title,editions.ebook_access,editions.language,ia,isbn,lccn,oclc,author_key';
        url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&fields=${fields}&page=${pageNum}&limit=24`;
        if (sortBy) url += `&sort=${sortBy}`;
      } else if (currentMode === 'reading_log') {
        url = `https://openlibrary.org/people/${encodeURIComponent(searchQuery)}/books/${currentListType}.json?page=${pageNum}`;
      } else if (currentMode === 'list_search') {
        url = `https://openlibrary.org/search/lists.json?q=${encodeURIComponent(searchQuery)}&limit=24&offset=${(pageNum - 1) * 24}`;
      } else if (currentMode === 'author_search') {
        url = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(searchQuery)}`;
      } else if (currentMode === 'subject_search') {
        url = `https://openlibrary.org/subjects/${encodeURIComponent(searchQuery.toLowerCase().replace(/ /g, '_'))}.json?limit=24&offset=${(pageNum - 1) * 24}`;
      } else if (currentMode === 'recent_changes') {
        // searchQuery can be a date like 2023/01/01, a kind like merge-authors, or just generic if empty.
        let path = '';
        if (searchQuery && searchQuery.toLowerCase() !== 'all') {
          path = `/${encodeURIComponent(searchQuery)}`;
        }
        url = `https://openlibrary.org/recentchanges${path}.json?limit=24&offset=${(pageNum - 1) * 24}&bot=false`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from Open Library.');
      }
      
      const data = await response.json();
      
      if (currentDrillDown) {
        if (currentDrillDown.type === 'list') {
          const mappedBooks = data.entries.map(entry => ({
            key: entry.url,
            title: entry.title,
            author_name: [],
            first_publish_year: null,
            cover_i: entry.picture && entry.picture.url ? parseInt(entry.picture.url.match(/id\/(\d+)/)?.[1]) : null,
            ia: []
          }));
          setBooks(mappedBooks);
          setTotalFound(data.size);
        } else {
          const mappedBooks = data.entries.map(entry => ({
            key: entry.key,
            title: entry.title,
            author_name: currentDrillDown.type === 'author' ? [currentDrillDown.name] : (entry.authors?.map(a => a.name) || []),
            first_publish_year: entry.first_publish_date || (entry.created?.value ? new Date(entry.created.value).getFullYear() : null),
            cover_i: entry.covers && entry.covers.length > 0 ? entry.covers[0] : null,
            ia: entry.source_records ? entry.source_records.filter(r => r.startsWith('ia:')).map(r => r.replace('ia:', '')) : []
          }));
          setBooks(mappedBooks);
          setTotalFound(data.size);
        }
      } else if (currentMode === 'catalog') {
        setBooks(data.docs);
        setTotalFound(data.numFound);
      } else if (currentMode === 'reading_log') {
        const mappedBooks = data.reading_log_entries.map(entry => {
          const w = entry.work;
          return {
            key: w.key,
            title: w.title,
            author_name: w.author_names,
            first_publish_year: w.first_publish_year,
            cover_i: w.cover_id,
            author_key: w.author_keys ? [w.author_keys[0].replace('/authors/', '')] : null
          };
        });
        setBooks(mappedBooks);
        setTotalFound(data.numFound);
      } else if (currentMode === 'list_search') {
        setLists(data.docs || []);
        setTotalFound(data.numFound || data.docs?.length || 0);
      } else if (currentMode === 'author_search') {
        setAuthors(data.docs || []);
        setTotalFound(data.numFound || data.docs?.length || 0);
      } else if (currentMode === 'subject_search') {
        const mappedBooks = (data.works || []).map(entry => ({
          key: entry.key,
          title: entry.title,
          author_name: entry.authors?.map(a => a.name) || [],
          first_publish_year: entry.first_publish_year,
          cover_i: entry.cover_id || null,
          ia: entry.ia ? [entry.ia] : []
        }));
        setBooks(mappedBooks);
        setTotalFound(data.work_count || 0);
      } else if (currentMode === 'recent_changes') {
        setRecentChanges(Array.isArray(data) ? data : []);
        setTotalFound(Array.isArray(data) ? data.length + (pageNum - 1) * 24 : 0);
      }
      
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(query, sort, 1, searchMode, listType);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(query, sort, 1, searchMode, listType);
  };

  const handleNextPage = () => fetchBooks(query, sort, page + 1, searchMode, listType, drillDown);
  const handlePrevPage = () => fetchBooks(query, sort, Math.max(1, page - 1), searchMode, listType, drillDown);

  const handleReadOnline = async (book, fromNativeDetail = false) => {
    try {
      const bookTitle = safeStr(book.title) || 'Book Reader';
      const bookAuthor = Array.isArray(book.author_name) ? book.author_name.join(', ') : (safeStr(book.author_name) || '');
      const isBorrow = book.ebook_access === 'borrowable' || 
                       (book.editions?.docs && book.editions.docs.some(e => e.ebook_access === 'borrowable'));

      // 1. Direct Internet Archive Viewer if available
      if (book.ia && book.ia.length > 0) {
        const iaId = book.ia[0];
        try {
          const res = await fetch(`/api/internet-archive/metadata/${iaId}`);
          if (res.ok) {
            const mData = await res.json();
            if (mData.success && mData.data?.files?.pdf?.url) {
              setViewerData({
                url: mData.data.files.pdf.url,
                pdfUrl: mData.data.files.pdf.url,
                readerType: 'pdf',
                directUrl: `https://archive.org/details/${iaId}`,
                openLibraryUrl: book.key ? `https://openlibrary.org${book.key}` : null,
                title: bookTitle,
                author: bookAuthor,
                iaId: iaId,
                iaFiles: mData.data.files,
                originalBook: book,
              });
              return;
            }
          }
        } catch (e) {
          console.warn("Could not query IA metadata:", e);
        }

        setViewerData({
          url: `https://archive.org/details/${iaId}?view=theater&ui=embed`,
          directUrl: `https://archive.org/details/${iaId}`,
          openLibraryUrl: book.key ? `https://openlibrary.org${book.key}` : null,
          title: bookTitle,
          author: bookAuthor,
          iaId: iaId,
          isBorrowable: isBorrow,
          originalBook: book,
        });
        return;
      }
      
      // 2. Try Open Library Read API via best available identifier
      let apiUrl = null;
      if (book.isbn && book.isbn.length > 0) {
        apiUrl = `https://openlibrary.org/api/volumes/brief/isbn/${book.isbn[0]}.json`;
      } else if (book.oclc && book.oclc.length > 0) {
        apiUrl = `https://openlibrary.org/api/volumes/brief/oclc/${book.oclc[0]}.json`;
      } else if (book.lccn && book.lccn.length > 0) {
        apiUrl = `https://openlibrary.org/api/volumes/brief/lccn/${book.lccn[0]}.json`;
      } else if (book.key) {
        const olid = book.key.split('/').pop();
        apiUrl = `https://openlibrary.org/api/volumes/brief/olid/${olid}.json`;
      }

      if (apiUrl) {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          const itemKeys = Object.keys(data);
          if (itemKeys.length > 0) {
            const item = data[itemKeys[0]];
            if (item.items && item.items.length > 0 && item.items[0].itemURL) {
              const directItemUrl = item.items[0].itemURL;
              let embedUrl = directItemUrl;
              if (embedUrl.includes('/details/')) {
                embedUrl = embedUrl.replace('/details/', '/embed/');
              }
              setViewerData({
                url: embedUrl,
                directUrl: directItemUrl,
                openLibraryUrl: book.key ? `https://openlibrary.org${book.key}` : null,
                title: bookTitle,
                author: bookAuthor,
                isBorrowable: isBorrow,
                originalBook: book,
              });
              return;
            }
          }
        }
      }
      
      // 3. Graceful Fallback: Render Book natively instead of external links
      if (book.key && !fromNativeDetail) {
        fetchNativeDetail(book.key, 'work', book);
      } else {
        alert("Sorry, no readable version or catalog page could be found for this item.");
      }
    } catch (err) {
      if (book.key && !fromNativeDetail) {
        fetchNativeDetail(book.key, 'work', book);
      } else {
        alert("Error fetching read status. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#032316] text-emerald-100 p-6 rounded-2xl border border-emerald-800/60 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 z-10 relative">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-emerald-400 w-8 h-8" />
            Open Library Explorer
          </h2>
          <p className="text-emerald-400/80 mt-1">Search the world's open catalog or view public reading logs.</p>
        </div>
        <div className="flex bg-[#021810] rounded-lg p-1 border border-emerald-800/50">
          <button 
            onClick={() => setSearchMode('catalog')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'catalog' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Catalog Search
          </button>
          <button 
            onClick={() => {
              setSearchMode('reading_log');
              setQuery('mekBot'); // Example default
              setDrillDown(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'reading_log' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Patron Reading Logs
          </button>
          <button 
            onClick={() => {
              setSearchMode('list_search');
              setQuery('science'); // Example default
              setDrillDown(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'list_search' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Curated Lists
          </button>
          <button 
            onClick={() => {
              setSearchMode('author_search');
              setQuery('rowling'); // Example default
              setDrillDown(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'author_search' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Authors
          </button>
          <button 
            onClick={() => {
              setSearchMode('subject_search');
              setQuery('love'); // Example default
              setDrillDown(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'subject_search' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Subjects
          </button>
          <button 
            onClick={() => {
              setSearchMode('recent_changes');
              setQuery('all'); // Example default
              setDrillDown(null);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${searchMode === 'recent_changes' ? 'bg-emerald-600 text-white' : 'text-emerald-500 hover:text-emerald-300'}`}
          >
            Activity
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 z-10 bg-[#021810]/50 p-4 rounded-xl border border-emerald-800/40 relative">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder={
              searchMode === 'catalog' ? "Search by title, author, or keyword..." : 
              searchMode === 'list_search' ? "Search curated lists by topic (e.g. history)..." : 
              searchMode === 'author_search' ? "Search for an author by name (e.g. J. K. Rowling)..." :
              searchMode === 'subject_search' ? "Search by subject (e.g. love, science, magic)..." :
              searchMode === 'recent_changes' ? "Filter changes (e.g. 'all', 'merge-authors', '2023/12/31')..." :
              "Enter Open Library Username (e.g., mekBot)..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#032316] border border-emerald-700/50 rounded-lg pl-10 pr-4 py-2.5 text-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-emerald-600 transition-all"
          />
        </div>
        
        {searchMode === 'catalog' ? (
          <div className="w-48 relative">
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-[#032316] border border-emerald-700/50 rounded-lg px-4 py-2.5 text-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
            >
              <option value="">Relevance</option>
              <option value="new">Newest First</option>
              <option value="old">Oldest First</option>
              <option value="random">Random</option>
              <option value="rating">Rating</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronRight className="w-4 h-4 text-emerald-500 rotate-90" />
            </div>
          </div>
        ) : searchMode === 'reading_log' ? (
          <div className="w-48 relative">
            <select 
              value={listType}
              onChange={(e) => setListType(e.target.value)}
              className="w-full bg-[#032316] border border-emerald-700/50 rounded-lg px-4 py-2.5 text-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
            >
              <option value="want-to-read">Want to Read</option>
              <option value="currently-reading">Currently Reading</option>
              <option value="already-read">Already Read</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronRight className="w-4 h-4 text-emerald-500 rotate-90" />
            </div>
          </div>
        ) : null}
        
        <button 
          type="submit" 
          disabled={loading || !query || drillDown !== null}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-emerald-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium animate-pulse">Querying Open Library...</p>
          </div>
        ) : (
          <>
            {totalFound > 0 && (
              <div className="mb-4 flex items-center gap-4">
                {drillDown && (
                  <button 
                    onClick={() => { setDrillDown(null); fetchBooks(query, sort, 1, searchMode, listType, null); }}
                    className="flex items-center gap-1.5 text-sm bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg transition"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                <div className="text-sm text-emerald-400 font-medium">
                  {drillDown ? `${drillDown.type === 'list' ? 'Books in List' : drillDown.type === 'author' ? 'Works by Author' : 'Editions of Work'} "${drillDown.name}"` : `Found ${totalFound.toLocaleString()} results`}
                </div>
              </div>
            )}
            
            {searchMode === 'author_search' && !drillDown ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {authors.map((author, idx) => (
                  <div 
                    key={author.key || idx} 
                    onClick={() => {
                      const newDrillDown = { type: 'author', url: `/authors/${author.key}`, name: author.name };
                      setDrillDown(newDrillDown);
                      fetchBooks(query, sort, 1, 'author_search', listType, newDrillDown);
                    }}
                    className="bg-[#021810]/70 border border-emerald-800/40 p-5 rounded-xl hover:bg-[#032316] hover:border-emerald-500/50 transition-all group flex flex-col h-full cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-400 mx-auto overflow-hidden border border-emerald-800/50">
                      {author.key ? (
                        <img 
                          src={`https://covers.openlibrary.org/a/olid/${author.key}-M.jpg`} 
                          alt={author.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <User size={32} className="hidden" />
                    </div>
                    <h3 className="font-bold text-white text-lg text-center leading-tight mb-2 group-hover:text-emerald-400 transition-colors">{author.name}</h3>
                    {author.birth_date && (
                      <p className="text-center text-xs text-emerald-500/70 mb-3">{author.birth_date}</p>
                    )}
                    <div className="mt-auto pt-4 border-t border-emerald-800/30 text-sm text-emerald-500 text-center">
                      <span className="font-semibold text-emerald-300">{author.work_count || 0}</span> works
                    </div>
                  </div>
                ))}
              </div>
            ) : searchMode === 'recent_changes' && !drillDown ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {recentChanges.map((change, idx) => (
                  <div key={change.id || idx} className="bg-[#021810]/70 border border-emerald-800/40 p-5 rounded-xl flex flex-col gap-3 hover:bg-[#032316] transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-1 bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 rounded-md text-xs font-mono uppercase tracking-wider">
                        {change.kind || 'update'}
                      </span>
                      <span className="text-xs text-emerald-500/70">{new Date(change.timestamp).toLocaleString()}</span>
                    </div>
                    {change.comment && (
                      <p className="text-emerald-100 text-sm italic font-serif">"{change.comment}"</p>
                    )}
                    {change.author && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2">
                        <User size={14} /> 
                        <button onClick={() => fetchNativeDetail(change.author.key, 'author')} className="hover:underline hover:text-emerald-300">
                          {change.author.key.replace('/authors/', '')}
                        </button>
                      </div>
                    )}
                    {change.changes && change.changes.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-emerald-800/30">
                        <p className="text-xs text-emerald-500 mb-1">Affected Documents:</p>
                        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar pr-1">
                          {change.changes.map((c, i) => (
                            <button 
                              key={i} 
                              onClick={() => fetchNativeDetail(c.key, 'work')}
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-900/30 border border-emerald-800/50 rounded text-emerald-400 hover:bg-emerald-800 hover:text-emerald-200 transition-colors"
                            >
                              {c.key.split('/').pop()} (v{c.revision})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchMode === 'list_search' && !drillDown ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lists.map((list, idx) => (
                  <div 
                    key={list.url || idx} 
                    onClick={() => {
                      const newDrillDown = { type: 'list', url: list.url, name: list.name };
                      setDrillDown(newDrillDown);
                      fetchBooks(query, sort, 1, 'list_search', listType, newDrillDown);
                    }}
                    className="bg-[#021810]/70 border border-emerald-800/40 p-5 rounded-xl hover:bg-[#032316] hover:border-emerald-500/50 transition-all group flex flex-col h-full cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <List size={24} />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-emerald-400 transition-colors">{list.name}</h3>
                    <div className="mt-auto pt-4 border-t border-emerald-800/30 text-sm text-emerald-500 flex justify-between">
                      <span>{list.seed_count} books</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.map((book, idx) => {
                const coverUrl = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 
                                 book.isbn && book.isbn[0] ? `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-M.jpg` :
                                 book.oclc && book.oclc[0] ? `https://covers.openlibrary.org/b/oclc/${book.oclc[0]}-M.jpg` :
                                 book.lccn && book.lccn[0] ? `https://covers.openlibrary.org/b/lccn/${book.lccn[0]}-M.jpg` : null;
                
                return (
                <div key={book.key || idx} className="bg-[#021810]/70 border border-emerald-800/40 p-4 rounded-xl hover:bg-[#032316] transition-all group flex flex-col h-full">
                  <div className="w-full h-48 bg-emerald-900/30 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-emerald-800/30 relative group-hover:border-emerald-500/50 transition-colors">
                    {coverUrl ? (
                      <img 
                        src={coverUrl} 
                        alt={`Cover of ${book.title}`}
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-emerald-600/50">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Cover</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-white text-base leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors mb-2">
                      {book.title}
                    </h3>
                    
                    {book.author_name?.length > 0 && (
                      <div 
                        className={`flex items-center gap-2 text-sm text-emerald-300 mb-2 ${book.author_key && book.author_key[0] ? 'cursor-pointer hover:text-emerald-100 hover:underline' : ''}`}
                        onClick={() => {
                          if (book.author_key && book.author_key[0]) {
                            const newDrillDown = { type: 'author', url: `/authors/${book.author_key[0]}`, name: book.author_name[0] };
                            setDrillDown(newDrillDown);
                            fetchBooks(query, sort, 1, searchMode, listType, newDrillDown);
                          }
                        }}
                      >
                        {book.author_key && book.author_key[0] ? (
                          <img 
                            src={`https://covers.openlibrary.org/a/olid/${book.author_key[0]}-S.jpg`} 
                            alt={book.author_name[0]}
                            className="w-5 h-5 rounded-full object-cover bg-emerald-900 border border-emerald-700"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <User size={14} className="text-emerald-500 shrink-0" />
                        )}
                        <span className="line-clamp-1">{book.author_name.join(', ')}</span>
                      </div>
                    )}

                    {book.first_publish_year && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400/80 mb-3">
                        <Calendar size={12} />
                        <span>First published: {book.first_publish_year}</span>
                      </div>
                    )}
                    
                    {book.editions && book.editions.docs && book.editions.docs.length > 0 && book.editions.docs[0].ebook_access === "public" && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-2 bg-emerald-900/50 w-fit px-2 py-0.5 rounded">
                        <BookOpen size={12} />
                        <span>Publicly Readable</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {book.subject?.slice(0, 2).map((sub, i) => (
                        <span key={i} className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-sm border border-emerald-700/50 bg-emerald-900/30 text-emerald-400 truncate max-w-[120px]">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-800/30 mt-4 flex flex-col gap-2">
                    {book.ia && book.ia.length > 0 && (
                      <button 
                        onClick={() => setSearchInsideBook(book)}
                        className="w-full bg-emerald-700/50 hover:bg-emerald-600 text-emerald-100 hover:text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-500/30"
                      >
                        <FileSearch size={12} /> Search Inside
                      </button>
                    )}
                    {book.key && book.key.startsWith('/works/') && (
                      <button 
                        onClick={() => {
                          const newDrillDown = { type: 'work', url: book.key, name: book.title };
                          setDrillDown(newDrillDown);
                          fetchBooks(query, sort, 1, searchMode, listType, newDrillDown);
                        }}
                        className="w-full bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 hover:text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-800/50 hover:border-emerald-500 mb-2"
                      >
                        <BookOpen size={12} /> View Editions
                      </button>
                    )}
                    <button 
                      onClick={() => handleReadOnline(book)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 mb-2 shadow-lg"
                    >
                      <BookOpen size={12} /> Read / Borrow
                    </button>
                    <button 
                      onClick={() => fetchNativeDetail(book.key, 'work', book)}
                      className="w-full bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 hover:text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-800/50 hover:border-emerald-500"
                    >
                      View Native Details <FileText size={12} />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
          {!loading && ((searchMode === 'list_search' && !drillDown && lists.length === 0) || (searchMode === 'author_search' && !drillDown && authors.length === 0) || (searchMode === 'recent_changes' && !drillDown && recentChanges.length === 0) || (searchMode !== 'list_search' && searchMode !== 'author_search' && searchMode !== 'recent_changes' && books.length === 0 && !drillDown) || (drillDown && books.length === 0)) && query && (
            <div className="text-center py-12 text-emerald-500/60 font-medium">
              No results found matching "{query}".
            </div>
          )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-emerald-800/40 z-10">
        <button 
          disabled={page <= 1 || loading}
          onClick={handlePrevPage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800 hover:text-white disabled:opacity-50 transition"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="text-sm font-medium text-emerald-500">
          Page {page} • Powered by Open Library
        </div>
        <button 
          disabled={loading || (!drillDown && searchMode === 'list_search' ? lists.length < 24 : !drillDown && searchMode === 'author_search' ? authors.length < 24 : !drillDown && searchMode === 'recent_changes' ? recentChanges.length < 24 : books.length < 24)}
          onClick={handleNextPage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800 hover:text-white disabled:opacity-50 transition"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* SEARCH INSIDE MODAL */}
      {searchInsideBook && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#010e09]/80 backdrop-blur-sm">
          <div className="bg-[#021810] border border-emerald-700/50 rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between p-5 border-b border-emerald-800/50 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileSearch className="text-emerald-400" />
                  Search Inside Book
                </h3>
                <p className="text-sm text-emerald-400 mt-1 line-clamp-1">{searchInsideBook.title}</p>
              </div>
              <button 
                onClick={() => setSearchInsideBook(null)}
                className="p-2 hover:bg-emerald-900/50 rounded-full text-emerald-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-hidden flex flex-col relative z-10">
              <SearchInsideLogic book={searchInsideBook} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Native Detail Modal ───────────────────────────────────────────────── */}
      <NativeDetailModal
        nativeDetail={nativeDetail}
        onClose={() => setNativeDetail(null)}
        onRead={() => handleReadOnline(nativeDetail.originalBook || { key: nativeDetail.originalKey }, true)}
        onOpenUrl={(url) => setIframeUrl(url)}
        onFetchAuthor={(authorKey) => {
          setNativeDetail(null);
          fetchNativeDetail(authorKey, 'author');
        }}
        onSearchInside={(b) => {
          setNativeDetail(null);
          setSearchInsideBook(b);
        }}
        onReadEdition={(ed) => {
          setNativeDetail(null);
          handleReadOnline(ed, true);
        }}
      />

      {/* ─── Detail Loading Overlay ────────────────────────────────────────────── */}
      {detailLoading && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#032316] p-6 rounded-2xl flex flex-col items-center gap-3 border border-emerald-500/30 shadow-2xl">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-emerald-100 font-bold text-sm tracking-wide">Fetching raw API data...</span>
          </div>
        </div>
      )}

      {/* ─── Integrated Viewer ────────────────────────────────────────────────── */}
      <IntegratedViewerModal
        viewerData={viewerData}
        onClose={() => setViewerData(null)}
      />
    </div>
  );
}

// Subcomponent for handling the Search Inside Logic
function SearchInsideLogic({ book }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performSearch = async (e) => {
    e.preventDefault();
    if (!q || !book.ia || !book.ia[0]) return;
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const iaId = book.ia[0];
      
      // 1. Fetch metadata to get datanode host and dir path
      const metaRes = await fetch(`https://archive.org/metadata/${iaId}`);
      if (!metaRes.ok) throw new Error("Failed to fetch Archive.org metadata.");
      const meta = await metaRes.json();
      
      const host = meta.d1 || meta.d2 || meta.server;
      const dir = meta.dir;
      if (!host || !dir) throw new Error("Could not resolve book storage location.");
      
      // 2. Query inside API
      // Use no callback to attempt retrieving JSON directly
      const url = `https://${host}/fulltext/inside.php?item_id=${iaId}&doc=${iaId}&path=${dir}&q=${encodeURIComponent(q)}&callback=`;
      const insideRes = await fetch(url);
      const insideText = await insideRes.text();
      
      // Clean potential JSONP wrapper
      let jsonStr = insideText.trim();
      if (jsonStr.startsWith('reply(')) {
        jsonStr = jsonStr.slice(6, -1);
      } else if (jsonStr.startsWith('(')) {
        jsonStr = jsonStr.slice(1, -1);
      }
      
      const data = JSON.parse(jsonStr);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Unable to search inside this book. It may not have searchable text available yet.");
    } finally {
      setLoading(false);
    }
  };

  const highlightMatches = (text) => {
    // Replace {{{word}}} with a styled span
    if (!text) return null;
    const parts = text.split(/(\{\{\{.*?\}\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{{') && part.endsWith('}}}')) {
        return <span key={i} className="bg-emerald-500/30 text-emerald-200 font-bold px-1 rounded">{part.slice(3, -3)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={performSearch} className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Phrase to search inside the book..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-[#032316] border border-emerald-700/50 rounded-lg pl-10 pr-4 py-2.5 text-emerald-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-emerald-600 transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || !q}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 border border-emerald-800/30 rounded-lg bg-[#010e09]/50 p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-emerald-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Searching full text...</p>
          </div>
        )}
        
        {!loading && !results && !error && (
          <div className="flex flex-col items-center justify-center h-full text-emerald-600/50">
            <FileSearch className="w-12 h-12 mb-2 opacity-50" />
            <p>Enter a phrase to search the contents of this book.</p>
          </div>
        )}

        {!loading && results && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 border-b border-emerald-800/50 pb-2">
              Found {results.matches?.length || 0} matches across {results.page_count} OCR pages
            </div>
            
            {results.matches && results.matches.length > 0 ? (
              results.matches.map((match, i) => (
                <div key={i} className="bg-[#021810] border border-emerald-800/50 p-4 rounded-lg">
                  <div className="text-xs text-emerald-500 mb-2 flex items-center gap-2">
                    <BookOpen size={12} />
                    Page(s): {match.par.map(p => p.page).join(', ')}
                  </div>
                  <p className="text-sm text-emerald-100 leading-relaxed">
                    "...{highlightMatches(match.text)}..."
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-emerald-500/70">
                No matches found for "{q}".
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
