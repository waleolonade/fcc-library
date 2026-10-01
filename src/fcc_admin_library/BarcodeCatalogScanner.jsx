import React, { useState } from 'react';
import {
  Barcode, Search, CheckCircle, AlertTriangle, ArrowRight, BookOpen,
  Sparkles, ExternalLink, Eye, Plus, ShieldCheck, Database, RefreshCw, Copy, Check
} from 'lucide-react';
import { resolveBookByIsbnCascade, cleanIsbnString } from '../services/isbnCatalogService';
import GoogleBooksViewerModal from '../common/GoogleBooksViewerModal';

export default function BarcodeCatalogScanner({ catalog = [], onAddBookToCatalog }) {
  const [isbnInput, setIsbnInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [resolvedResult, setResolvedResult] = useState(null);
  const [activePipelineTrace, setActivePipelineTrace] = useState([]);
  const [previewingBook, setPreviewingBook] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sample ISBNs for fast demo & testing (includes Roald Dahl's Matilda as specified by user)
  const sampleIsbns = [
    { label: 'Matilda (Roald Dahl)', isbn: '9780140328721' },
    { label: 'Clean Architecture (Martin)', isbn: '9780134494166' },
    { label: 'Intro to Algorithms (CLRS)', isbn: '9780262033848' },
    { label: 'Designing Data-Intensive Apps', isbn: '9781491950296' },
    { label: 'FCC Local Book (Nigeria)', isbn: '978-978-49021-1-4' }
  ];

  const handleExecuteScan = async (targetIsbn = isbnInput) => {
    const raw = targetIsbn || isbnInput;
    if (!raw.trim()) return;

    setIsScanning(true);
    setResolvedResult(null);
    setSaveSuccessMsg('');
    setActivePipelineTrace([`[Initial] Input received: "${raw}"...`]);

    try {
      const result = await resolveBookByIsbnCascade(raw, catalog);
      setResolvedResult(result);
      setActivePipelineTrace(result.pipelineTrace || []);
    } catch (err) {
      setActivePipelineTrace(prev => [...prev, `[Error] Cascade failure: ${err.message}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (e) => {
    // Hardware barcode scanners send Enter key at the end of scan
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteScan();
    }
  };

  const handleIngestToCatalog = () => {
    if (!resolvedResult || !resolvedResult.book) return;
    const book = resolvedResult.book;

    const newBook = {
      id: book.id || `FCC-ISBN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: book.title,
      author: book.author || (Array.isArray(book.authors) ? book.authors.join(', ') : 'Unknown Author'),
      isbn: book.isbn,
      publisher: book.publisher || 'Catalog Ingested Publisher',
      year: book.publishYear || new Date().getFullYear(),
      subject: book.subject || (Array.isArray(book.subjects) && book.subjects[0]) || 'General Collection',
      callNumber: `QA76 .${(book.author || 'GEN').slice(0, 3).toUpperCase()} 2026`,
      shelfLocation: `Floor 1 • Aisle ${Math.floor(1 + Math.random() * 8)} • Shelf B`,
      copiesTotal: 3,
      copiesAvailable: 3,
      rating: 5.0,
      abstract: book.description || 'Imported via External Library Cataloging API Gateway.',
      coverUrl: book.coverUrl,
      googleBookId: book.googleBookId || null,
      externalUrl: book.externalUrl,
      format: 'Hardcover & Digital Ingest',
      isDigital: Boolean(book.previewUrl || book.embedViewerUrl)
    };

    if (onAddBookToCatalog) {
      onAddBookToCatalog(newBook);
    }

    setSaveSuccessMsg(`Successfully ingested "${newBook.title}" into the FCC Institutional Catalog!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Barcode size={14} className="text-emerald-400" />
          <span>Automated ISBN & Barcode Scanner Engine</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Circulation & Cataloging ISBN Ingestion Station
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          Powered by real-time multi-tier resolution: checks Local DB Cache first, then queries the Open Library Books & Search API, with seamless automatic fallback to Google Books Global Volumes API.
        </p>

        {/* Live Architecture Flow Diagram */}
        <div className="pt-3 overflow-x-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Barcode size={13} /> [Barcode Scanner]
            </span>
            <ArrowRight size={12} className="text-slate-600" />
            <span className="text-slate-300 font-semibold">Clean ISBN</span>
            <ArrowRight size={12} className="text-slate-600" />
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Database size={13} /> [Local DB Cache]
            </span>
            <span className="text-slate-500 text-[10px]">(miss) ➔</span>
            <span className="text-amber-400 font-bold">[Open Library API]</span>
            <span className="text-slate-500 text-[10px]">(fallback) ➔</span>
            <span className="text-sky-400 font-bold">[Google Books API]</span>
            <ArrowRight size={12} className="text-slate-600" />
            <span className="text-emerald-300 font-bold">[Auto-populate Metadata]</span>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Input Console */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Barcode size={16} className="text-emerald-400" />
            Scan Barcode or Enter 10/13-Digit ISBN:
          </span>
          <span className="text-[11px] text-slate-500 font-normal normal-case">
            Compatible with USB & Bluetooth Laser Scanners
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={isbnInput}
              onChange={(e) => setIsbnInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g. 9780140328721 or scan physical barcode directly..."
              className="w-full px-4 py-3 pl-11 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              autoFocus
            />
            <Barcode size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
          </div>

          <button
            onClick={() => handleExecuteScan()}
            disabled={isScanning || !isbnInput.trim()}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 shrink-0"
          >
            {isScanning ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Cascading APIs...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Fetch Metadata</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Test Presets:</span>
          {sampleIsbns.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsbnInput(s.isbn);
                handleExecuteScan(s.isbn);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-mono transition flex items-center gap-1.5"
            >
              <span>{s.label}</span>
              <span className="text-emerald-400 font-bold">[{s.isbn}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Pipeline Activity Log */}
      {activePipelineTrace.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs shadow-inner">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Live Resolution Pipeline Trace:
          </div>
          {activePipelineTrace.map((line, i) => (
            <div key={i} className="text-slate-300 flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">➔</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Auto-Populated Bibliographic Card */}
      {resolvedResult && resolvedResult.found && resolvedResult.book && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-600/60 shadow-2xl space-y-5 animate-scaleUp">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                <CheckCircle size={12} />
                <span>Resolved via {resolvedResult.source}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                {resolvedResult.book.title}
              </h3>
              {resolvedResult.book.subtitle && (
                <p className="text-xs text-slate-400 italic">{resolvedResult.book.subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(resolvedResult.book.embedViewerUrl || resolvedResult.book.googleBookId) && (
                <button
                  onClick={() => setPreviewingBook(resolvedResult.book)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Eye size={14} className="text-emerald-400" />
                  <span>Google Books Preview</span>
                </button>
              )}

              {resolvedResult.book.externalUrl && (
                <a
                  href={resolvedResult.book.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="View External Source Record"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Book Cover with standard onError fallback */}
            <div className="md:col-span-1 flex flex-col items-center space-y-2">
              <div className="w-36 h-52 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl relative group">
                <img
                  src={resolvedResult.book.coverUrl || `https://covers.openlibrary.org/b/isbn/${resolvedResult.book.isbn}-M.jpg?default=false`}
                  alt={resolvedResult.book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/no-cover.svg';
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                ISBN: {resolvedResult.book.isbn}
              </span>
            </div>

            {/* Extracted Metadata Grid */}
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Primary Author</span>
                  <span className="text-white font-semibold truncate block">{resolvedResult.book.author}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Publisher</span>
                  <span className="text-white font-semibold truncate block">{resolvedResult.book.publisher}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Publication Year</span>
                  <span className="text-white font-semibold block">{resolvedResult.book.publishYear}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Subject / Category</span>
                  <span className="text-emerald-400 font-semibold truncate block">{resolvedResult.book.subject}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Page Count</span>
                  <span className="text-white font-semibold block">{resolvedResult.book.pageCount || 'Unspecified'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Normalized ISBN</span>
                  <span className="text-emerald-300 font-mono font-bold block">{resolvedResult.book.isbn}</span>
                </div>
              </div>

              {/* Abstract / Summary */}
              {resolvedResult.book.description && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Curriculum Abstract & Overview
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {resolvedResult.book.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleIngestToCatalog}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950 flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>Ingest Record to FCC Institutional Catalog</span>
                </button>

                <button
                  onClick={() => handleExecuteScan()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Re-Query APIs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Record Found Alert */}
      {resolvedResult && !resolvedResult.found && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-3 shadow-lg animate-fadeIn">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-sm text-white">No Record Located for this ISBN</div>
            <p className="text-amber-300/80 mt-0.5">
              The entered barcode was not found in the local catalog, Open Library, or Google Books. You may manually catalog this monograph or verify the ISBN.
            </p>
          </div>
        </div>
      )}

      {/* Embedded Google Books Preview Modal */}
      {previewingBook && (
        <GoogleBooksViewerModal
          book={previewingBook}
          onClose={() => setPreviewingBook(null)}
        />
      )}
    </div>
  );
}
