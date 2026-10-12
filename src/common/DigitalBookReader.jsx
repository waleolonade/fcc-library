import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Bookmark, Sun, Moon, Coffee,
  ZoomIn, ZoomOut, Search, Share2, Check, FileText, ExternalLink,
  Link2, UserCheck, Download, Sparkles, BookOpen, Layers, Eye,
  BookCheck, RefreshCw, ChevronDown, CheckCircle2, ShieldCheck,
  Building2, GraduationCap, Copy, Maximize2, Minimize2, Trash2,
  FileDown, BookMarked, Tag, Info, AlertCircle, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import TraceBadge from './TraceBadge';
import { sounds } from '../utils/soundEffects';
import { libraryApi } from '../api/libraryApi';

export default function DigitalBookReader({ book: initialBook, onClose, user, onSelectBook }) {
  const [currentBook, setCurrentBook] = useState(initialBook || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'sepia' | 'light'
  const [fontSize, setFontSize] = useState('text-base'); // 'text-sm' | 'text-base' | 'text-lg' | 'text-xl'
  const [bookmarkedPages, setBookmarkedPages] = useState({});
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'uploader' | 'library' | 'notes'
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [uploadedBooks, setUploadedBooks] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [showBookDrawer, setShowBookDrawer] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [citationFormat, setCitationFormat] = useState('APA'); // 'APA' | 'MLA' | 'Harvard'
  const [chapterSearch, setChapterSearch] = useState('');
  const [readerMode, setReaderMode] = useState('interactive'); // 'interactive' | 'pdf'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync initialBook prop changes
  useEffect(() => {
    if (initialBook && (!currentBook || currentBook.id !== initialBook.id)) {
      setCurrentBook(initialBook);
      setCurrentPage(1);
    }
  }, [initialBook]);

  // Fetch real uploaded books list from backend
  const fetchUploadedBooks = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map(b => ({
            ...b,
            id: b.id || 'FCC-BOOK',
            title: b.title || 'Untitled Monograph',
            author: b.author || 'FCC Faculty Scholar',
            callNumber: b.call_number || b.callNumber || 'FCC.LIB',
            shelfLocation: b.shelf_location || b.shelfLocation || 'Digital E-Library',
            courseCode: b.course_code || b.courseCode || 'GEN 101',
            targetLevel: b.target_level || b.targetLevel || 'HND II',
            department: b.department || 'Computer Science & Information Technology',
            uploadedBy: b.uploaded_by || b.uploadedBy || 'Admin Librarian',
            fileName: b.file_name || b.fileName || `${b.title || 'handout'}.pdf`,
            fileSize: b.file_size || b.fileSize || '7.4 MB',
            fileDataUrl: b.file_data_url || b.fileDataUrl || '',
            hasBinaryPdf: Boolean(b.hasBinaryPdf || b.file_data_url || b.fileDataUrl || (b.id && b.id === 'FCC-HOD-8201')),
            pdfUrl: `/api/catalog/${b.id}/file`,
            isDigital: true,
            abstract: b.abstract || ''
          }));

          // Sort so books with raw uploaded PDF files appear first
          normalized.sort((a, b) => {
            if (a.hasBinaryPdf && !b.hasBinaryPdf) return -1;
            if (!a.hasBinaryPdf && b.hasBinaryPdf) return 1;
            return 0;
          });

          setUploadedBooks(normalized);

          // If no currentBook was passed, select the first real book
          if (!currentBook && normalized.length > 0) {
            loadBookDetails(normalized[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch catalog uploads in reader:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchUploadedBooks();
  }, []);

  // Fetch complete book record
  const loadBookDetails = async (candidate) => {
    if (!candidate) return;
    setIsLoadingBook(true);
    try {
      const res = await fetch(`/api/catalog/${encodeURIComponent(candidate.id)}`);
      if (res.ok) {
        const full = await res.json();
        const merged = {
          ...candidate,
          ...full,
          callNumber: full.call_number || full.callNumber || candidate.callNumber,
          shelfLocation: full.shelf_location || full.shelfLocation || candidate.shelfLocation,
          courseCode: full.course_code || full.courseCode || candidate.courseCode,
          targetLevel: full.target_level || full.targetLevel || candidate.targetLevel,
          department: full.department || candidate.department,
          uploadedBy: full.uploaded_by || full.uploadedBy || candidate.uploadedBy,
          fileDataUrl: full.file_data_url || full.fileDataUrl || candidate.fileDataUrl || '',
          fileName: full.file_name || full.fileName || candidate.fileName,
          hasBinaryPdf: Boolean(full.file_data_url || full.fileDataUrl || (full.id && full.id === 'FCC-HOD-8201') || candidate.hasBinaryPdf),
          isDigital: true,
          pdfPages: full.pdf_pages || full.pdfPages || candidate.pdfPages || 120
        };
        setCurrentBook(merged);
        setCurrentPage(1);
        if (onSelectBook) onSelectBook(merged);

        // If it has raw binary PDF, default to PDF stream mode; otherwise interactive reader
        if (merged.hasBinaryPdf) {
          setReaderMode('pdf');
        } else {
          setReaderMode('interactive');
        }
      } else {
        setCurrentBook(candidate);
      }
    } catch (e) {
      setCurrentBook(candidate);
    } finally {
      setIsLoadingBook(false);
    }
  };

  // Sync reading velocity to API
  useEffect(() => {
    if (user && user.matric && currentBook && currentBook.id) {
      libraryApi.continueReading.updateProgress(
        user.matric,
        currentBook.id,
        currentPage,
        currentBook.pdfPages || 120,
        currentBook.title,
        currentBook.author
      );
    }
  }, [currentPage, currentBook, user]);

  const totalPages = currentBook?.pdfPages || 120;
  const isPageBookmarked = Boolean(bookmarkedPages[currentPage]);

  const toggleBookmark = () => {
    sounds.playClick();
    setBookmarkedPages(prev => ({
      ...prev,
      [currentPage]: !prev[currentPage]
    }));
  };

  const pdfStreamSrc = currentBook?.id
    ? `/api/catalog/${encodeURIComponent(currentBook.id)}/file#page=${currentPage}`
    : '';

  // Dynamic Syllabus Chapter Generator based on course topic
  const chapters = useMemo(() => {
    if (currentBook?.chapters && Array.isArray(currentBook.chapters) && currentBook.chapters.length > 0) {
      return currentBook.chapters;
    }
    const code = currentBook?.courseCode || 'GEN 101';
    const dept = currentBook?.department || 'Curriculum Studies';
    return [
      { id: 1, title: `Module 1: Foundational Theoretical Framework of ${code}`, page: 1, duration: '25 min' },
      { id: 2, title: `Module 2: Applied Methodologies & Institutional Principles in ${dept}`, page: 25, duration: '35 min' },
      { id: 3, title: `Module 3: Core Analytical Models, Equations & Technical Proofs`, page: 55, duration: '40 min' },
      { id: 4, title: `Module 4: Laboratory Practices, Case Studies & Empirical Projects`, page: 85, duration: '30 min' },
      { id: 5, title: `Module 5: Continuous Assessment Review, Syllabus Indices & References`, page: 105, duration: '20 min' }
    ];
  }, [currentBook?.courseCode, currentBook?.department, currentBook?.chapters]);

  const filteredChapters = chapters.filter(c =>
    c.title.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  const currentChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPage >= chapters[i].page) return chapters[i];
    }
    return chapters[0] || { title: 'Module 1.0', page: 1 };
  }, [chapters, currentPage]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes(prev => [
      {
        id: Date.now(),
        page: currentPage,
        chapter: currentChapter.title,
        text: newNote.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
    setNewNote('');
    sounds.playSuccessChime();
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const getCitationText = () => {
    const author = currentBook?.author || 'FCC Directorate';
    const title = currentBook?.title || 'Academic Monograph';
    const year = currentBook?.year || 2026;
    const dept = currentBook?.department || 'Federal Co-operative College';
    const publisher = currentBook?.publisher || 'FCC Institutional Press, Ibadan';

    if (citationFormat === 'APA') {
      return `${author} (${year}). ${title}. ${publisher}. Institutional Repository Ref: ${currentBook?.callNumber || 'FCC.LIB'}.`;
    }
    if (citationFormat === 'MLA') {
      return `${author}. "${title}." ${publisher}, ${year}. Federal Co-operative College Digital Archives.`;
    }
    return `${author} ${year}, ${title}, ${dept}, ${publisher}.`;
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(getCitationText());
    setCopiedCitation(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  if (!currentBook) {
    return (
      <div className="min-h-[550px] flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-spin">
          <RefreshCw size={30} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Accessing Master Library Repository...</h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Fetching institutional publications, HOD lecture handouts, and verified admin manuscripts from the Federal Co-operative College database.
          </p>
        </div>
        <button
          onClick={fetchUploadedBooks}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg"
        >
          <RefreshCw size={14} /> Refresh Library Stacks
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 animate-fadeIn transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 p-3 sm:p-6 overflow-y-auto' : ''}`}>
      {/* ============================================================ */}
      {/* TOP HEADER CONTROLS BAR                                      */}
      {/* ============================================================ */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl relative">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close Reader"
            >
              <X size={17} />
            </button>
          )}

          <button
            onClick={() => { sounds.playClick(); setSidebarOpen(!sidebarOpen); }}
            className={`p-2 sm:px-2.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
              sidebarOpen
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 shadow-md ring-1 ring-emerald-500/50'
            }`}
            title={sidebarOpen ? "Hide Left Sidebar" : "Show Left Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span className="text-[11px] font-semibold">{sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}</span>
          </button>

          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <span className="line-clamp-1 max-w-sm sm:max-w-md">{currentBook.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono shrink-0">
                {currentBook.callNumber}
              </span>
              {currentBook.hasBinaryPdf ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-mono shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Raw PDF
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 font-mono shrink-0 flex items-center gap-1">
                  <BookMarked size={11} /> Syllabus Guide
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>{currentBook.author}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">Uploader: {currentBook.uploadedBy}</span>
              <span>•</span>
              <span className="font-mono">Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Book Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBookDrawer(!showBookDrawer)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition shadow"
              title="Select another book uploaded by HODs or Admin"
            >
              <BookOpen size={13} />
              <span>Real Uploads ({uploadedBooks.length})</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${showBookDrawer ? 'rotate-180' : ''}`} />
            </button>

            {showBookDrawer && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1 max-h-[400px] overflow-y-auto">
                <div className="p-2 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-emerald-400" /> HOD & Central Library Catalogue
                  </span>
                  <button
                    onClick={fetchUploadedBooks}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                    title="Refresh list"
                  >
                    <RefreshCw size={12} className={isLoadingList ? 'animate-spin' : ''} />
                  </button>
                </div>
                {uploadedBooks.map(b => {
                  const isSelected = b.id === currentBook.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        sounds.playClick();
                        loadBookDetails(b);
                        setShowBookDrawer(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="w-8 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        {b.hasBinaryPdf ? <FileText size={16} className="text-emerald-400" /> : <BookOpen size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate text-white">{b.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {b.author} • {b.department}
                        </div>
                        <div className="text-[9px] text-emerald-400/90 flex items-center gap-1.5 mt-0.5">
                          <span>By: {b.uploadedBy}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono ${b.hasBinaryPdf ? 'bg-blue-900/60 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                            {b.hasBinaryPdf ? 'Raw PDF' : 'Syllabus'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <TraceBadge uri={`#/reader/${currentBook.id}?page=${currentPage}`} label="Reader" />

          {/* Download Button */}
          <a
            href={`/api/catalog/${encodeURIComponent(currentBook.id)}/file?download=1`}
            download={currentBook.fileName || `${currentBook.title}.pdf`}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            title="Download PDF Document"
          >
            <Download size={13} />
            <span className="hidden sm:inline">PDF</span>
          </a>

          {/* New Tab External Link */}
          <a
            href={`/api/catalog/${encodeURIComponent(currentBook.id)}/file`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            title="Open in Browser New Tab"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">New Tab</span>
          </a>

          {/* Theme switcher */}
          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'}`}
              title="Dark Mode"
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-lg transition ${theme === 'sepia' ? 'bg-[#dfd2be] text-[#332a1e] font-bold' : 'text-slate-400'}`}
              title="Sepia Mode"
            >
              <Coffee size={14} />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400'}`}
              title="Light Mode"
            >
              <Sun size={14} />
            </button>
          </div>

          {/* Font Size controls */}
          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs text-slate-400">
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-2 py-0.5 rounded-lg transition ${fontSize === 'text-sm' ? 'bg-slate-800 text-white font-bold' : 'hover:text-white'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-2 py-0.5 rounded-lg transition ${fontSize === 'text-base' ? 'bg-slate-800 text-white font-bold' : 'hover:text-white'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('text-lg')}
              className={`px-2 py-0.5 rounded-lg transition ${fontSize === 'text-lg' ? 'bg-slate-800 text-white font-bold' : 'hover:text-white'}`}
            >
              A+
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition ${
              isPageBookmarked
                ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isPageBookmarked ? 'Page Bookmarked' : 'Bookmark this Page'}
          >
            <Bookmark size={14} className={isPageBookmarked ? 'fill-emerald-400' : ''} />
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Page Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white hover:bg-slate-700 transition"
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 text-white hover:bg-slate-700 transition"
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN SPLIT CANVAS                                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ============================================================ */}
        {/* LEFT COLUMN (1): TABS, CHAPTERS, HOD DOSSIER & SHELF        */}
        {/* ============================================================ */}
        {sidebarOpen && (
          <div className="lg:col-span-3 xl:col-span-3 bg-slate-900/95 p-3 sm:p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-xl flex flex-col justify-between transition-all duration-300">
            <div className="space-y-3">
              {/* Sidebar Header with Direct Hide/Collapse Button */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <BookMarked size={14} className="text-emerald-400" />
                  <span>Navigator</span>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setSidebarOpen(false); }}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-[11px] font-semibold border border-slate-700/60"
                  title="Hide left panel for full screen reading"
                >
                  <PanelLeftClose size={13} className="text-emerald-400" />
                  <span>Hide Panel</span>
                </button>
              </div>

              {/* Nav Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px] sm:text-[11px] font-semibold">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-1.5 px-0.5 rounded-lg transition text-center truncate ${activeTab === 'content' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                  title="Chapters & Syllabus Outline"
                >
                  Chapters
                </button>
                <button
                  onClick={() => setActiveTab('uploader')}
                  className={`py-1.5 px-0.5 rounded-lg transition text-center truncate ${activeTab === 'uploader' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                  title="HOD & Uploader Dossier"
                >
                  Dossier
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`py-1.5 px-0.5 rounded-lg transition text-center truncate ${activeTab === 'library' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                  title="Uploaded Stack Shelf"
                >
                  Shelf{uploadedBooks.length > 0 ? ` (${uploadedBooks.length})` : ''}
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`py-1.5 px-0.5 rounded-lg transition text-center truncate ${activeTab === 'notes' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'}`}
                  title="Research Notes"
                >
                  Notes{notes.length > 0 ? ` (${notes.length})` : ''}
                </button>
              </div>

            {/* TAB 1: CHAPTERS & OUTLINE */}
            {activeTab === 'content' && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search modules & topics..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredChapters.map(c => {
                    const isCurrent = currentPage >= c.page && (!chapters.find(next => next.page > c.page && currentPage >= next.page));
                    return (
                      <button
                        key={c.id || c.page}
                        onClick={() => {
                          sounds.playClick();
                          setCurrentPage(c.page);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs transition border flex items-start justify-between gap-2 ${
                          isCurrent
                            ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 shadow'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold line-clamp-2">{c.title}</div>
                          <div className="text-[10px] text-slate-500">Est. duration: {c.duration || '20 min'}</div>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400 bg-slate-900 px-2 py-0.5 rounded shrink-0">
                          p.{c.page}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: HOD / UPLOADER DOSSIER */}
            {activeTab === 'uploader' && (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 animate-fadeIn">
                {/* Official Verification Seal */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck size={16} />
                    <span>Accredited Academic Monograph</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    Endorsed & Uploaded By:
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    {currentBook.uploadedBy}
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span>{currentBook.department}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-slate-400 shrink-0" />
                    <span>Course: {currentBook.courseCode} ({currentBook.targetLevel})</span>
                  </div>
                </div>

                {/* Bibliographic Record Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Catalogue Metadata</div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-500">Author:</span>
                    <strong className="text-white text-right max-w-[160px] truncate">{currentBook.author}</strong>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-500">Call Number:</span>
                    <span className="font-mono text-emerald-400">{currentBook.callNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-500">Shelf Stack:</span>
                    <span className="text-slate-300 text-right truncate">{currentBook.shelfLocation}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-500">File Payload:</span>
                    <span className="font-mono text-slate-300">{currentBook.fileSize || '7.4 MB'}</span>
                  </div>
                </div>

                {/* Citation Generator */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Citation Generator</span>
                    <div className="flex gap-1 text-[10px]">
                      {['APA', 'MLA', 'Harvard'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setCitationFormat(fmt)}
                          className={`px-1.5 py-0.5 rounded transition ${citationFormat === fmt ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400'}`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 italic leading-relaxed">
                    {getCitationText()}
                  </p>
                  <button
                    onClick={copyCitation}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedCitation ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedCitation ? 'Citation Copied!' : 'Copy Bibliographic Citation'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: UPLOADED SHELF (SWITCHER) */}
            {activeTab === 'library' && (
              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 animate-fadeIn">
                <div className="text-[11px] text-slate-400 px-1">
                  Click any title to load into reader:
                </div>
                {uploadedBooks.map(b => {
                  const isSelected = b.id === currentBook.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        sounds.playClick();
                        loadBookDetails(b);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs transition space-y-1.5 border ${
                        isSelected
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 shadow-lg'
                          : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800/80 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white line-clamp-1">{b.title}</span>
                        {b.hasBinaryPdf ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono shrink-0">
                            RAW PDF
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                            Syllabus
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{b.author}</div>
                      <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/40">
                        <span className="font-mono text-emerald-400">{b.courseCode}</span>
                        <span className="truncate max-w-[140px]">By: {b.uploadedBy}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 4: NOTES & ANNOTATIONS */}
            {activeTab === 'notes' && (
              <div className="space-y-3 animate-fadeIn">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    placeholder={`Record a research note on page ${currentPage}...`}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
                  >
                    Save Note on Page {currentPage}
                  </button>
                </form>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {notes.map(n => (
                    <div key={n.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono">
                        <span>Page {n.page} • {n.timestamp}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-slate-500 hover:text-red-400 transition"
                          title="Delete note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No annotations taken yet. Save bookmarks & notes as you read.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions: Quick Hide + Live Sync status */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => { sounds.playClick(); setSidebarOpen(false); }}
              className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
              title="Hide sidebar for full width reading"
            >
              <PanelLeftClose size={13} />
              <span>Hide Sidebar (Full Width)</span>
            </button>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={12} /> Live Repository Sync
              </span>
              <span className="font-mono">FCC Core Node</span>
            </div>
          </div>
        </div>
        )}

        {/* ============================================================ */}
        {/* RIGHT COLUMN (2): INTERACTIVE E-BOOK CANVAS & PDF STREAM     */}
        {/* ============================================================ */}
        <div className={`${sidebarOpen ? 'lg:col-span-9 xl:col-span-9' : 'col-span-12'} p-4 sm:p-6 rounded-2xl border min-h-[640px] shadow-2xl transition-all duration-300 flex flex-col justify-between ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : theme === 'sepia'
            ? 'bg-[#fcf7ee] border-[#dfd2be] text-[#332a1e]'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Canvas Mode Header Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-dashed border-slate-700/50">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <button
                  onClick={() => { sounds.playClick(); setSidebarOpen(true); }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-lg transition"
                  title="Expand Navigator Sidebar"
                >
                  <PanelLeftOpen size={14} className="text-emerald-400" />
                  <span>Show Sidebar</span>
                </button>
              )}

              <button
                onClick={() => setReaderMode('interactive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  readerMode === 'interactive'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <BookOpen size={13} />
                <span>Interactive E-Book Text</span>
              </button>

              <button
                onClick={() => setReaderMode('pdf')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  readerMode === 'pdf'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <FileText size={13} />
                <span>PDF Manuscript Stream</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {isPageBookmarked && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-[10px] flex items-center gap-1">
                  <Bookmark size={10} className="fill-emerald-400" /> Bookmarked
                </span>
              )}
              <span className="font-mono text-[11px] opacity-70">
                {currentChapter.title}
              </span>
            </div>
          </div>

          {/* MODE 1: PDF MANUSCRIPT STREAM (NATIVE IFRAME) */}
          {readerMode === 'pdf' ? (
            <div className="w-full flex-1 min-h-[660px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap justify-between items-center text-xs font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-400 font-bold">📄 Official Document Stream:</span>
                  <span className="text-slate-300 truncate max-w-xs">{currentBook.fileName || currentBook.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReaderMode('interactive')}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] font-sans transition"
                  >
                    Switch to Text View
                  </button>
                  <a
                    href={`/api/catalog/${encodeURIComponent(currentBook.id)}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-sans flex items-center gap-1 transition"
                  >
                    <ExternalLink size={11} /> Open Separate Window
                  </a>
                </div>
              </div>

              {/* Native PDF Stream Frame (Handles both raw binary and generated syllabus PDFs) */}
              <iframe
                src={pdfStreamSrc}
                className="w-full flex-1 min-h-[640px] border-none bg-slate-950"
                title={currentBook.title}
              />
            </div>
          ) : (
            /* MODE 2: INTERACTIVE E-BOOK TEXT READER (ORIGINAL FEATURES & RICH CONTENT) */
            <div className={`max-w-2xl mx-auto space-y-6 leading-relaxed font-serif flex-1 ${fontSize}`}>
              {/* Header Bar */}
              <div className="flex justify-between items-center text-[11px] font-sans font-bold uppercase tracking-widest text-emerald-500 pb-3 border-b border-dashed border-slate-700/50">
                <span>{currentChapter.title}</span>
                <span>Ref: {currentBook.callNumber}</span>
              </div>

              {/* Book Title & Subtitle */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
                  {currentBook.title}
                </h2>
                <div className="text-xs font-sans text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>Author: <strong className="text-white">{currentBook.author}</strong></span>
                  <span>•</span>
                  <span>Course: <strong className="text-emerald-400">{currentBook.courseCode}</strong> ({currentBook.targetLevel})</span>
                  <span>•</span>
                  <span>Dept: {currentBook.department}</span>
                </div>
              </div>

              {/* Syllabus Overview & Abstract Box */}
              <div className={`p-4 rounded-xl border font-sans text-xs leading-relaxed space-y-1.5 ${
                theme === 'dark'
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : theme === 'sepia'
                  ? 'bg-[#f4ebe1] border-[#dfd2be] text-[#332a1e]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} /> Course Abstract & Learning Framework:
                </div>
                <p>
                  {currentBook.abstract || `Official departmental syllabus monograph and academic instructional materials prepared for ${currentBook.courseCode} students of Federal Co-operative College, Ibadan.`}
                </p>
              </div>

              {/* Reading Content Modules */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-sans">
                  {currentChapter.title}
                </h3>

                <p>
                  Within the accredited academic curricula of the Federal Co-operative College, Ibadan, the study of {currentBook.department} bridges rigorous theoretical formulations with practical field methodology. Students are instructed to evaluate institutional case dynamics, compliance guidelines, and empirical governance structures.
                </p>

                <p>
                  As outlined by {currentBook.author}, statutory standards and regulatory ratios establish the foundation of continuous learning. Members and scholars must systematically analyze syllabus-mandated units, field exercises, and practical laboratory components.
                </p>

                {/* Mathematical Formula / Theorem Block */}
                <div className={`p-4 rounded-xl border font-mono text-xs my-3 space-y-1.5 ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-700/80 text-emerald-300'
                    : theme === 'sepia'
                    ? 'bg-[#ebe0d0] border-[#c9bba6] text-[#3b2b1a]'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                    Equation & Institutional Criterion Model ({currentBook.courseCode}.1):
                  </div>
                  <code>
                    R_res = &sum;(Alpha_i &times; Output_i) / (1 + Rate_discount) &plus; Reserve_Statutory
                  </code>
                  <div className="text-[10px] text-slate-400 pt-1 font-sans">
                    * Applied in weekly laboratory sessions and continuous assessment evaluations.
                  </div>
                </div>

                <p>
                  Subsequent empirical sections evaluate operational resilience across Western Nigeria agricultural unions and cooperative credit systems, assessing solvency benchmarks, liquidity management, and technological integration.
                </p>

                {/* Practical Learning Outcomes */}
                <div className={`p-4 rounded-xl border font-sans text-xs space-y-2 ${
                  theme === 'dark'
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                    : theme === 'sepia'
                    ? 'bg-[#f4ede4] border-[#d8cbbe] text-[#3b2b1a]'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <strong className="block text-white">Syllabus Competency Outcomes:</strong>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Synthesize foundational concepts of {currentBook.courseCode} with statutory guidelines.</li>
                    <li>Conduct quantitative evaluations using departmental empirical frameworks.</li>
                    <li>Participate in end-of-term seminar presentations and central library reserve study hours.</li>
                  </ul>
                </div>
              </div>

              {/* In-Canvas Bottom Navigation */}
              <div className="pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold transition flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} /> Previous Section
                </button>

                <div className="font-mono text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white font-bold transition flex items-center gap-1.5"
                >
                  <span>Next Section</span> <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
