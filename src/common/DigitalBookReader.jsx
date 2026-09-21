import React, { useState, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Bookmark, Sun, Moon, Coffee,
  ZoomIn, ZoomOut, Search, Share2, Check, FileText, ExternalLink,
  Link2, UserCheck, Download, Sparkles, BookOpen, Layers, Eye
} from 'lucide-react';
import TraceBadge from './TraceBadge';
import { sounds } from '../utils/soundEffects';
import { libraryApi } from '../api/libraryApi';

export default function DigitalBookReader({ book, onClose, user }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'sepia' | 'light'
  const [fontSize, setFontSize] = useState('text-base'); // 'text-sm' | 'text-base' | 'text-lg'
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'author' | 'notes'
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [pdfEmbedMode, setPdfEmbedMode] = useState(Boolean(book.fileDataUrl));

  // Sync reading progress to SQL database & localStorage
  useEffect(() => {
    if (user && user.matric && book && book.id) {
      libraryApi.continueReading.updateProgress(
        user.matric,
        book.id,
        currentPage,
        book.pdfPages || 384,
        book.title,
        book.author
      );
    }
  }, [currentPage, book, user]);

  const chapters = book.chapters && book.chapters.length > 0 ? book.chapters : [
    { title: "Chapter 1: Foundational Principles & Regulatory Frameworks", page: 1 },
    { title: "Chapter 2: Financial Ratios & Liquidity Stress in Cooperatives", page: 45 },
    { title: "Chapter 3: Risk Hedging & Apex Syndicate Accounting", page: 112 },
    { title: "Chapter 4: Modern Statutory Reserves & Audit Protocols", page: 230 },
    { title: "Chapter 5: Digital Value Chains & Fair-Trade Settlement", page: 310 }
  ];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([...notes, { id: Date.now(), page: currentPage, text: newNote, timestamp: new Date().toLocaleTimeString() }]);
    setNewNote('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Exit Reader"
          >
            <X size={16} />
          </button>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>{book.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {book.callNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {book.author} • Page {currentPage} of {book.pdfPages || 384}
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          <TraceBadge uri={`#/reader/${book.id}?page=${currentPage}`} label="Reader" />

          <button
            onClick={() => {
              sounds.playSuccessChime();
              alert(`Downloading authenticated PDF copy: "${book.fileName || book.title + '.pdf'}" (${book.fileSize || '4.8 MB'})`);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            title="Download PDF File"
          >
            <Download size={13} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {book.externalUrl && (
            <a
              href={book.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow"
            >
              <ExternalLink size={13} /> Open Ext Link
            </a>
          )}

          {/* Theme switcher */}
          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-lg transition ${theme === 'sepia' ? 'bg-[#dfd2be] text-[#332a1e]' : 'text-slate-400'}`}
              title="Sepia Mode"
            >
              <Coffee size={14} />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
          </div>

          {/* Font Size controls */}
          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs text-slate-400">
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-2 py-0.5 rounded-lg ${fontSize === 'text-sm' ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-2 py-0.5 rounded-lg ${fontSize === 'text-base' ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('text-lg')}
              className={`px-2 py-0.5 rounded-lg ${fontSize === 'text-lg' ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              A+
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2 rounded-xl border transition ${
              bookmarked ? 'bg-emerald-950 border-emerald-600 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Bookmark Page"
          >
            <Bookmark size={14} />
          </button>

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-30 text-white hover:bg-slate-700 transition"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">{currentPage}</span>
            <button
              disabled={currentPage >= (book.pdfPages || 384)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-30 text-white hover:bg-slate-700 transition"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Reader Main Split Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Chapter Navigator, Author Profile & Annotation Notes */}
        <div className="lg:col-span-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex border-b border-slate-800 pb-2 text-xs font-semibold gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-1 px-2.5 rounded-lg transition whitespace-nowrap ${activeTab === 'content' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-400'}`}
            >
              Chapters ({chapters.length})
            </button>
            <button
              onClick={() => setActiveTab('author')}
              className={`py-1 px-2.5 rounded-lg transition whitespace-nowrap ${activeTab === 'author' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-400'}`}
            >
              Author Dossier
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-1 px-2.5 rounded-lg transition whitespace-nowrap ${activeTab === 'notes' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-400'}`}
            >
              Notes ({notes.length})
            </button>
          </div>

          {activeTab === 'content' ? (
            <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
              {chapters.map(c => (
                <button
                  key={c.page}
                  onClick={() => setCurrentPage(c.page)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex justify-between items-center transition ${
                    currentPage >= c.page && currentPage < c.page + 50
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="pr-2">{c.title}</span>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">p.{c.page}</span>
                </button>
              ))}
            </div>
          ) : activeTab === 'author' ? (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <UserCheck size={14} />
                  <span>{book.author}</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  {book.authorCredentials || 'Ph.D., Lead Academic Researcher'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {book.authorAffiliation || 'Federal Co-operative College, Ibadan'}
                </div>
              </div>

              {book.coAuthors && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Contributors:</span>
                  <span className="text-slate-300 text-[11px]">{book.coAuthors}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Bibliographic Dossier</div>
                <div className="text-[11px] text-slate-300">Publisher: <strong className="text-white">{book.publisher || 'FCC Press'}</strong></div>
                <div className="text-[11px] text-slate-300">Edition: <strong className="text-white">{book.edition || '1st National Edition'}</strong></div>
                <div className="text-[11px] text-slate-300">Year: <strong className="text-white">{book.year || 2024}</strong></div>
                <div className="text-[11px] text-slate-300 font-mono">ISBN: {book.isbn}</div>
                <div className="text-[11px] text-slate-300 font-mono">CALL: {book.callNumber}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  placeholder="Record an annotation for this page..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Save Note on Page {currentPage}
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {notes.map(n => (
                  <div key={n.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-emerald-400 font-mono">
                      <span>Page {n.page}</span>
                      <span>{n.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Document Reader Canvas */}
        <div className={`lg:col-span-8 p-4 sm:p-8 rounded-2xl border min-h-[550px] shadow-2xl transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-200'
            : theme === 'sepia'
            ? 'bg-[#fcf7ee] border-[#dfd2be] text-[#332a1e]'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {book.fileDataUrl && pdfEmbedMode ? (
            <div className="w-full h-[650px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="p-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-400 font-bold">📄 Authenticated PDF Document Stream</span>
                <button
                  onClick={() => setPdfEmbedMode(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                >
                  Switch to Text View
                </button>
              </div>
              <iframe
                src={`${book.fileDataUrl}#page=${currentPage}`}
                className="w-full flex-1 border-none"
                title={book.title}
              />
            </div>
          ) : (
            <div className={`max-w-2xl mx-auto space-y-5 leading-relaxed font-serif ${fontSize}`}>
              <div className="flex justify-between items-center text-[11px] font-sans font-bold uppercase tracking-widest text-emerald-500 pb-3 border-b border-dashed border-slate-700/50">
                <span>{chapters.find(c => currentPage >= c.page && currentPage < (c.page + 50))?.title || `Section ${Math.floor(currentPage / 50) + 1}.0`}</span>
                <span>Doc Ref: {book.doi || '10.5281/fcc.2026'}</span>
              </div>

              {book.fileDataUrl && (
                <div className="flex justify-end font-sans">
                  <button
                    onClick={() => setPdfEmbedMode(true)}
                    className="px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye size={13} /> View Original PDF Layout
                  </button>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold font-sans">
                {book.title}
              </h2>
              {book.subtitle && (
                <p className="text-sm font-sans italic text-slate-400">
                  {book.subtitle}
                </p>
              )}

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 font-sans text-xs text-emerald-300 leading-relaxed">
                <strong className="text-white block mb-1">Monograph Abstract & Syllabus Summary:</strong>
                {book.abstract || 'Peer-reviewed academic monograph digitized and indexed in the Federal Co-operative College Institutional Repository.'}
              </div>

              <p>
                In institutional cooperative governance, capital equity accumulation diverges sharply from orthodox joint-stock corporations. Rather than proportional capital voting distributions, governance conforms strictly to democratic member hegemony (<span className="italic">"one member, one vote"</span>).
              </p>

              <p>
                Within the institutional framework established in Western Nigeria under the early regional cooperative edicts, agricultural credit societies acted as primary conduits for stabilizing rural cash liquidity during off-harvest cycles. By pooling fractional micro-savings into apex syndicates, member vulnerability to usurious merchant lenders was systematically dismantled.
              </p>

              <div className={`p-4 rounded-xl border border-dashed font-mono text-xs my-4 ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-700 text-emerald-300' : 'bg-amber-100/50 border-amber-300 text-amber-900'
              }`}>
                <strong>Formula (2.4):</strong> Statutory Reserve Allocation Ratio:
                <br />
                <code>R_stat = max(0.25 * Net_Surplus, Fixed_Statutory_Reserve_Rate * Asset_Base)</code>
              </div>

              <p>
                Subsequent empirical chapters evaluate the operational resilience of multi-purpose cooperatives in the cocoa belts of Oyo, Ondo, and Osun states during volatile global commodity cycles, demonstrating that federated marketing unions maintained average solvency margins exceeding 14.2% above commercial agricultural counterparts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
