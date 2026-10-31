import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, Bookmark, Sun, Moon, Coffee,
  ZoomIn, ZoomOut, Search, Share2, Check, FileText, ExternalLink,
  Link2, UserCheck, Download, Sparkles, BookOpen, Layers, Eye,
  BookCheck, RefreshCw, ChevronDown, CheckCircle2, ShieldCheck,
  Building2, GraduationCap, Copy, Maximize2, Minimize2, Trash2,
  FileDown, BookMarked, Tag, Info, AlertCircle, AlertTriangle, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import TraceBadge from './TraceBadge';
import { sounds } from '../utils/soundEffects';
import { libraryApi } from '../api/libraryApi';
import PdfCanvasViewer from './PdfCanvasViewer';
import { fetchLiveAcademicJournals } from '../services/openSourceJournalsApi';
import { subscribeRealtimeEvents } from '../services/realtimeSync';

export default function DigitalBookReader({ book: initialBook, onClose, user, onSelectBook }) {
  const [currentBook, setCurrentBook] = useState(() => initialBook || null);
  const [isDocumentDeletedNotice, setIsDocumentDeletedNotice] = useState(false);
  const [deletedNoticeTitle, setDeletedNoticeTitle] = useState('');
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
  const [readerMode, setReaderMode] = useState('pdf'); // 'pdf' | 'interactive'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shelfFilter, setShelfFilter] = useState('all'); // 'all' | 'local' | 'online'
  const [detectedPages, setDetectedPages] = useState(1);

  // Origin detection helpers to strictly distinguish local HOD/Admin uploads from online external journals
  const isOnlineBook = (b) => Boolean(
    b?.isLiveExternalJournal ||
    b?.sourceApi ||
    (b?.id && (String(b.id).startsWith('OA-') || String(b.id).startsWith('CR-') || String(b.id).startsWith('EPMC-') || String(b.id).startsWith('W')))
  );

  const localShelfCount = useMemo(() => uploadedBooks.filter(b => !isOnlineBook(b)).length, [uploadedBooks]);
  const onlineShelfCount = useMemo(() => uploadedBooks.filter(b => isOnlineBook(b)).length, [uploadedBooks]);

  const displayedShelfBooks = useMemo(() => {
    if (shelfFilter === 'local') return uploadedBooks.filter(b => !isOnlineBook(b));
    if (shelfFilter === 'online') return uploadedBooks.filter(b => isOnlineBook(b));
    return uploadedBooks;
  }, [uploadedBooks, shelfFilter]);
  // Sync initialBook prop changes
  useEffect(() => {
    if (initialBook && (!currentBook || currentBook.id !== initialBook.id)) {
      setCurrentBook(initialBook);
      setCurrentPage(1);
    }
  }, [initialBook]);

  // Real-time synchronization: Auto-close reader immediately if this document is deleted anywhere
  useEffect(() => {
    if (!currentBook) return;

    const currentId = String(currentBook.id || '').trim().toLowerCase();
    const currentUploadId = String(currentBook.upload_id || '').trim().toLowerCase();
    const currentTitle = String(currentBook.title || '').trim().toLowerCase();

    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (!event || !event.action) return;

      if (event.action === 'DELETE') {
        const targetId = String(event.id || '').trim().toLowerCase();
        const targetIds = (event.ids || []).map(i => String(i).trim().toLowerCase());
        const targetTitle = String(event.title || '').trim().toLowerCase();

        const isCurrentDocumentDeleted =
          (targetId && (targetId === currentId || targetId === currentUploadId)) ||
          (targetIds.length > 0 && (targetIds.includes(currentId) || targetIds.includes(currentUploadId))) ||
          (currentTitle && targetTitle && targetTitle.length > 3 && targetTitle === currentTitle);

        if (isCurrentDocumentDeleted) {
          try { sounds.playWarning(); } catch {}
          setDeletedNoticeTitle(currentBook.title || 'Academic Document');
          setIsDocumentDeletedNotice(true);

          // Auto-close reader and return to catalog
          setTimeout(() => {
            if (onClose) {
              onClose();
            } else if (typeof window !== 'undefined' && window.location.hash.includes('/reader')) {
              window.location.hash = '#/';
            }
          }, 1800);
        }

        // Remove from the side drawer list in real time
        setUploadedBooks(prev => prev.filter(b => {
          const bId = String(b.id || '').toLowerCase();
          const bUpId = String(b.upload_id || '').toLowerCase();
          return bId !== targetId && bUpId !== targetId && !targetIds.includes(bId) && !targetIds.includes(bUpId);
        }));
      } else if (event.action === 'MODIFY' || event.action === 'APPROVE') {
        const targetId = String(event.id || '').trim().toLowerCase();
        if (targetId && (targetId === currentId || targetId === currentUploadId) && event.data) {
          setCurrentBook(prev => ({ ...prev, ...event.data }));
        }
        if (event.data) {
          setUploadedBooks(prev => prev.map(b => {
            const bId = String(b.id || '').toLowerCase();
            return (bId === targetId || String(b.upload_id || '').toLowerCase() === targetId) ? { ...b, ...event.data } : b;
          }));
        }
      } else if (event.action === 'UPLOAD') {
        if (event.data && event.data.id) {
          setUploadedBooks(prev => {
            if (prev.some(b => String(b.id).toLowerCase() === String(event.data.id).toLowerCase())) return prev;
            return [event.data, ...prev];
          });
        }
      }
    });

    return unsubscribe;
  }, [currentBook?.id, currentBook?.upload_id, currentBook?.title, onClose]);

  // Fetch authentic uploaded books and live peer-reviewed academic journals from the backend and database
  const fetchUploadedBooks = async () => {
    setIsLoadingList(true);
    try {
      const [catalogRes, departmentRes, journalsRes] = await Promise.allSettled([
        fetch('/api/catalog').then(r => r.ok ? r.json() : []),
        fetch('/api/department-uploads').then(r => r.ok ? r.json() : []),
        fetchLiveAcademicJournals({
          query: 'cooperative economics agriculture computer science finance management nigeria',
          perPage: 25
        }).catch(() => [])
      ]);

      const rawCatalog = (catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value)) ? catalogRes.value : [];
      const rawDeptUploads = (departmentRes.status === 'fulfilled' && Array.isArray(departmentRes.value)) ? departmentRes.value : [];
      const rawJournals = (journalsRes.status === 'fulfilled' && Array.isArray(journalsRes.value)) ? journalsRes.value : [];

      const seenIds = new Set();
      const combinedLocal = [...rawCatalog, ...rawDeptUploads].filter(b => {
        if (!b) return false;
        const id = b.id || b.book_id;
        if (!id) return false;
        const status = String(b.status || '').toLowerCase();
        if (['deleted', 'withdrawn', 'purged', 'rejected', 'declined'].includes(status)) return false;
        const key = String(id).toLowerCase();
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      });

      const normalizedCatalog = combinedLocal.map(b => {
        const id = b.id || b.book_id;
        const title = b.title || '';
        const author = b.author || b.student_names || b.studentNames || '';
        const callNumber = b.call_number || b.callNumber || '';
        const shelfLocation = b.shelf_location || b.shelfLocation || '';
        const courseCode = b.course_code || b.courseCode || '';
        const targetLevel = b.target_level || b.targetLevel || '';
        const department = b.department || b.faculty || '';
        const uploadedBy = b.uploaded_by || b.uploadedBy || '';
        const fileName = b.file_name || b.fileName || '';
        const fileSize = b.file_size || b.fileSize || '';
        const fileDataUrl = b.file_data_url || b.fileDataUrl || '';
        const hasBinary = Boolean(fileDataUrl || fileName || b.has_file || b.hasBinaryPdf || b.pdf_path || b.pdfUrl);
        const pdfUrl = fileDataUrl || b.pdfUrl || (id ? `/api/books/${encodeURIComponent(id)}/pdf` : '');

        return {
          ...b,
          id,
          title,
          author,
          callNumber,
          shelfLocation,
          courseCode,
          targetLevel,
          department,
          uploadedBy,
          fileName,
          fileSize,
          fileDataUrl,
          hasBinaryPdf: hasBinary,
          pdfUrl,
          isDigital: hasBinary || Boolean(pdfUrl),
          abstract: b.abstract || b.description || '',
          pdfPages: Number(b.pdf_pages || b.pdfPages || 0) || null
        };
      });

      // Combine catalog uploads and authentic live open-access journals
      const combined = [...normalizedCatalog, ...rawJournals];

      // Prioritize institutional uploads with real binary PDFs
      combined.sort((a, b) => {
        const aHasPdf = Boolean(a.hasBinaryPdf || a.fileDataUrl || a.file_data_url || a.pdfUrl);
        const bHasPdf = Boolean(b.hasBinaryPdf || b.fileDataUrl || b.file_data_url || b.pdfUrl);
        if (aHasPdf && !bHasPdf) return -1;
        if (!aHasPdf && bHasPdf) return 1;
        return 0;
      });

      setUploadedBooks(combined);

      // If no book is currently loaded, select the first available real book/journal
      if (!currentBook && combined.length > 0) {
        loadBookDetails(combined[0]);
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

  // Fetch complete book record directly from database
  const loadBookDetails = async (candidate) => {
    if (!candidate || !candidate.id) return;
    setIsLoadingBook(true);
    try {
      // If it's a live external scholarly journal (e.g. OpenAlex, Crossref), keep its full metadata
      if (candidate.isLiveExternalJournal || candidate.sourceApi) {
        setCurrentBook(candidate);
        setCurrentPage(1);
        if (onSelectBook) onSelectBook(candidate);
        setReaderMode(candidate.pdfUrl ? 'pdf' : 'interactive');
        return;
      }

      let full = null;
      const res = await fetch(`/api/catalog/${encodeURIComponent(candidate.id)}`);
      if (res.ok) {
        full = await res.json();
      } else {
        const deptRes = await fetch(`/api/department-uploads/${encodeURIComponent(candidate.id)}`);
        if (deptRes.ok) {
          full = await deptRes.json();
        }
      }

      if (full) {
        const hasBinary = Boolean(
          full.hasBinaryPdf ||
          full.has_file ||
          full.hasPdf ||
          full.file_name ||
          full.fileName ||
          full.file_data_url ||
          full.fileDataUrl ||
          candidate.hasBinaryPdf ||
          full.pdf_path
        );

        const merged = {
          ...candidate,
          ...full,
          id: full.id || candidate.id,
          title: full.title || candidate.title || '',
          author: full.author || full.student_names || full.studentNames || candidate.author || '',
          callNumber: full.call_number || full.callNumber || candidate.callNumber || '',
          shelfLocation: full.shelf_location || full.shelfLocation || candidate.shelfLocation || '',
          courseCode: full.course_code || full.courseCode || candidate.courseCode || '',
          targetLevel: full.target_level || full.targetLevel || candidate.targetLevel || '',
          department: full.department || candidate.department || '',
          uploadedBy: full.uploaded_by || full.uploadedBy || candidate.uploadedBy || '',
          fileDataUrl: full.file_data_url || full.fileDataUrl || candidate.fileDataUrl || '',
          fileName: full.file_name || full.fileName || candidate.fileName || '',
          fileSize: full.file_size || full.fileSize || candidate.fileSize || '',
          cover_image: full.cover_image || full.coverImage || candidate.cover_image || candidate.coverImage || candidate.cover || '',
          coverImage: full.cover_image || full.coverImage || candidate.cover_image || candidate.coverImage || candidate.cover || '',
          hasBinaryPdf: hasBinary,
          pdfUrl: full.file_data_url || full.fileDataUrl || full.pdfUrl || candidate.pdfUrl || `/api/books/${encodeURIComponent(candidate.id)}/pdf`,
          isDigital: hasBinary,
          pdfPages: Number(full.pdf_pages || full.pdfPages || candidate.pdfPages || 0) || null,
          abstract: full.abstract || full.description || candidate.abstract || ''
        };
        setCurrentBook(merged);
        setCurrentPage(1);
        if (onSelectBook) onSelectBook(merged);
        setReaderMode(merged.hasBinaryPdf ? 'pdf' : 'interactive');
      } else {
        setCurrentBook(candidate);
        setReaderMode(candidate.hasBinaryPdf ? 'pdf' : 'interactive');
      }
    } catch (e) {
      setCurrentBook(candidate);
      setReaderMode(candidate.hasBinaryPdf ? 'pdf' : 'interactive');
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
        currentBook.pdfPages || detectedPages || 1,
        currentBook.title,
        currentBook.author
      );
    }
  }, [currentPage, currentBook, user, detectedPages]);

  const totalPages = currentBook?.pdfPages || detectedPages || 1;
  const isPageBookmarked = Boolean(bookmarkedPages[currentPage]);

  const toggleBookmark = () => {
    sounds.playClick();
    setBookmarkedPages(prev => ({
      ...prev,
      [currentPage]: !prev[currentPage]
    }));
  };

  // Sections / Chapters: extracted from real manuscript table of contents or outline
  const chapters = useMemo(() => {
    if (currentBook?.chapters && Array.isArray(currentBook.chapters) && currentBook.chapters.length > 0) {
      return currentBook.chapters;
    }
    if (currentBook?.tableOfContents && Array.isArray(currentBook.tableOfContents) && currentBook.tableOfContents.length > 0) {
      return currentBook.tableOfContents;
    }
    return [
      { id: 1, title: currentBook?.title || 'Manuscript Document', page: 1 }
    ];
  }, [currentBook?.chapters, currentBook?.tableOfContents, currentBook?.title]);

  const filteredChapters = chapters.filter(c =>
    c.title.toLowerCase().includes(chapterSearch.toLowerCase())
  );

  const currentChapter = useMemo(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentPage >= chapters[i].page) return chapters[i];
    }
    return chapters[0] || { title: currentBook?.title || 'Manuscript Document', page: 1 };
  }, [chapters, currentPage, currentBook?.title]);

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
    const author = currentBook?.author || '';
    const title = currentBook?.title || '';
    const year = currentBook?.year || currentBook?.publicationYear || currentBook?.publication_year || '';
    const journal = currentBook?.journalName || currentBook?.journal_name || currentBook?.publisher || '';
    const doi = currentBook?.doi ? `https://doi.org/${currentBook.doi}` : '';
    const vol = currentBook?.volumeIssue || currentBook?.volume_issue || '';

    const parts = [];
    if (author) parts.push(author);
    if (year) parts.push(`(${year})`);
    if (title) parts.push(`"${title}"`);
    if (journal) parts.push(journal);
    if (vol) parts.push(vol);
    if (doi) parts.push(doi);

    return parts.join('. ') || title || 'Academic Publication';
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
    <div className={`space-y-4 animate-fadeIn transition-all duration-300 relative ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 p-3 sm:p-6 overflow-y-auto' : ''}`}>
      {/* Real-time Document Deletion Overlay (closes reader automatically if deleted) */}
      {isDocumentDeletedNotice && (
        <div className="absolute inset-0 z-[999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 rounded-3xl border border-rose-500/30">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-4 shadow-2xl shadow-rose-950">
            <Trash2 size={32} className="animate-bounce" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">
            Academic Document Withdrawn &amp; Deleted
          </h3>
          <p className="text-sm text-slate-300 max-w-md mb-2 leading-relaxed font-semibold">
            &ldquo;{deletedNoticeTitle}&rdquo;
          </p>
          <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
            This document was deleted or withdrawn from the institutional repository in real time. Reader access has been closed by administration.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-300 bg-rose-950/70 border border-rose-800/80 px-3.5 py-1.5 rounded-xl shadow">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span>Auto-closing reader and returning to catalogue...</span>
          </div>
        </div>
      )}

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
          </button>

          {/* Book Cover Artwork Thumbnail */}
          {(currentBook.cover_image || currentBook.coverImage) ? (
            <div className="w-8 h-11 rounded-lg overflow-hidden shrink-0 border border-emerald-500/40 shadow bg-slate-950 hidden sm:block">
              <img
                src={currentBook.cover_image || currentBook.coverImage || currentBook.cover || '/assets/fcc-logo.png'}
                alt="Book Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/fcc-logo.png';
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-11 rounded-lg overflow-hidden shrink-0 border border-emerald-500/30 shadow bg-emerald-950/80 p-1 flex flex-col justify-between hidden sm:flex">
              <span className="text-[6px] text-emerald-400 font-mono font-bold">FCC</span>
              <span className="text-[7.5px] text-white font-serif font-bold text-center leading-none">📖</span>
            </div>
          )}

          <div>
            {(() => {
              const isOnlineCurrent = isOnlineBook(currentBook);
              return (
                <>
                  <div className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span className="line-clamp-1 max-w-sm sm:max-w-md">{currentBook.title}</span>
                    {isOnlineCurrent ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-600 font-mono font-black shrink-0 flex items-center gap-1 shadow-sm">
                        🌐 ONLINE SCHOLARLY JOURNAL (API)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono font-black shrink-0 flex items-center gap-1 shadow-sm">
                        🏛️ LOCAL CAMPUS REPOSITORY (HOD/ADMIN)
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/60 text-slate-300 border border-white/10 font-mono shrink-0">
                      {currentBook.callNumber || (isOnlineCurrent ? 'OPEN ACCESS' : 'LOCAL STACK')}
                    </span>
                    {currentBook.hasBinaryPdf && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 font-mono shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Raw PDF
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{currentBook.author}</span>
                    <span>•</span>
                    {isOnlineCurrent ? (
                      <>
                        <span className="text-sky-300 font-medium">Source: OpenAlex API</span>
                        {currentBook.journalName && (
                          <>
                            <span>•</span>
                            <span className="text-sky-200">Journal: {currentBook.journalName}</span>
                          </>
                        )}
                        {currentBook.issn && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-sky-400">ISSN: {currentBook.issn}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-400 font-medium">Uploader: {currentBook.uploadedBy || 'HOD / Library Admin'}</span>
                        {currentBook.department && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">{currentBook.department}</span>
                          </>
                        )}
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono">Page {currentPage} of {totalPages}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Book Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBookDrawer(!showBookDrawer)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition shadow"
              title="Switch between Local HOD/Admin uploads and Online API journals"
            >
              <BookOpen size={13} className="text-emerald-400" />
              <span>Catalog Switcher ({uploadedBooks.length})</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${showBookDrawer ? 'rotate-180' : ''}`} />
            </button>

            {showBookDrawer && (
              <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-2 max-h-[460px] overflow-y-auto">
                <div className="p-2 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-emerald-400" /> Digital Repository Selector
                  </span>
                  <button
                    onClick={fetchUploadedBooks}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                    title="Refresh list"
                  >
                    <RefreshCw size={12} className={isLoadingList ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Filter pills inside dropdown */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShelfFilter('all')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({uploadedBooks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfFilter('local')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'local' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    🏛️ Local ({localShelfCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfFilter('online')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'online' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-sky-300'
                    }`}
                  >
                    🌐 Online ({onlineShelfCount})
                  </button>
                </div>

                <div className="space-y-1">
                  {displayedShelfBooks.map(b => {
                    const isSelected = b.id === currentBook.id;
                    const isOnline = isOnlineBook(b);
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          sounds.playClick();
                          loadBookDetails(b);
                          setShowBookDrawer(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-start gap-2.5 border ${
                          isSelected
                            ? isOnline
                              ? 'bg-sky-950/80 text-sky-200 border-sky-600 shadow-lg'
                              : 'bg-emerald-950/80 text-emerald-200 border-emerald-600 shadow-lg'
                            : isOnline
                            ? 'text-slate-300 hover:bg-slate-800 border-transparent hover:border-sky-900/50'
                            : 'text-slate-300 hover:bg-slate-800 border-transparent hover:border-emerald-900/50'
                        }`}
                      >
                        <div className={`w-8 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          isOnline ? 'bg-sky-950/90 border-sky-800 text-sky-400' : 'bg-emerald-950/90 border-emerald-800 text-emerald-400'
                        }`}>
                          {b.hasBinaryPdf ? <FileText size={16} /> : <BookOpen size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8.5px] px-1 py-0.2 rounded font-black font-mono uppercase ${
                              isOnline ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            }`}>
                              {isOnline ? '🌐 ONLINE API' : '🏛️ LOCAL'}
                            </span>
                            <span className="font-bold truncate text-white">{b.title}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {b.author} • {isOnline ? (b.journalName || 'OpenAlex Journal') : b.department}
                          </div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{isOnline ? 'Source: OpenAlex' : `By: ${b.uploadedBy}`}</span>
                            {b.hasBinaryPdf && (
                              <span className="px-1.5 py-0.2 rounded font-mono bg-blue-900/60 text-blue-300">
                                Raw PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <TraceBadge uri={`#/reader/${currentBook.id}?page=${currentPage}`} label="Reader" />

          {/* Download Button */}
          <a
            href={`/api/books/${encodeURIComponent(currentBook.id)}/pdf/download`}
            download={currentBook.fileName || `${currentBook.title}.pdf`}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            title="Download PDF Document"
          >
            <Download size={13} />
            <span className="hidden sm:inline">PDF</span>
          </a>

          {/* New Tab External Link */}
          <a
            href={`/api/books/${encodeURIComponent(currentBook.id)}/pdf`}
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
                    placeholder="Search manuscript sections..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {chapters.length > 1 ? (
                    filteredChapters.map(c => {
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
                          </div>
                          <span className="font-mono text-[10px] text-emerald-400 bg-slate-900 px-2 py-0.5 rounded shrink-0">
                            p.{c.page}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="text-xs text-white font-semibold line-clamp-2">
                        {currentBook.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {totalPages > 1 ? `Full Document (${totalPages} Pages)` : 'Full Document'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setReaderMode('pdf')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow"
                      >
                        <FileText size={13} />
                        <span>View in PDF Stream</span>
                      </button>
                    </div>
                  )}
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
                    <span>{isOnlineBook(currentBook) ? 'Verified Scholarly Record' : 'Accredited Institutional Publication'}</span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {isOnlineBook(currentBook) ? 'Indexed By / Source:' : 'Endorsed & Uploaded By:'}
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    {currentBook.uploadedBy || (isOnlineBook(currentBook) ? 'OpenAlex Scholarly Graph' : 'Institutional Library')}
                  </div>
                  {currentBook.department && (
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span>{currentBook.department}</span>
                    </div>
                  )}
                  {currentBook.courseCode && (
                    <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-slate-400 shrink-0" />
                      <span>Course: {currentBook.courseCode} {currentBook.targetLevel ? `(${currentBook.targetLevel})` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Bibliographic Record Card */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Catalogue Metadata</div>
                  {currentBook.author && (
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span className="text-slate-500">Author:</span>
                      <strong className="text-white text-right max-w-[160px] truncate">{currentBook.author}</strong>
                    </div>
                  )}
                  {currentBook.callNumber && (
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span className="text-slate-500">Call Number:</span>
                      <span className="font-mono text-emerald-400">{currentBook.callNumber}</span>
                    </div>
                  )}
                  {currentBook.shelfLocation && (
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span className="text-slate-500">Shelf Stack:</span>
                      <span className="text-slate-300 text-right truncate">{currentBook.shelfLocation}</span>
                    </div>
                  )}
                  {currentBook.fileSize && (
                    <div className="text-[11px] text-slate-300 flex justify-between">
                      <span className="text-slate-500">File Payload:</span>
                      <span className="font-mono text-slate-300">{currentBook.fileSize}</span>
                    </div>
                  )}
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
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Browse & Load Collections:</span>
                  <span className="font-mono text-emerald-400 font-bold">{displayedShelfBooks.length} items</span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShelfFilter('all')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({uploadedBooks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfFilter('local')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'local' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    🏛️ Local ({localShelfCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShelfFilter('online')}
                    className={`px-2 py-1 rounded-lg font-bold transition flex-1 text-center ${
                      shelfFilter === 'online' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-sky-300'
                    }`}
                  >
                    🌐 Online ({onlineShelfCount})
                  </button>
                </div>

                <div className="space-y-2">
                  {displayedShelfBooks.map(b => {
                    const isSelected = b.id === currentBook.id;
                    const isOnline = isOnlineBook(b);
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          sounds.playClick();
                          loadBookDetails(b);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs transition space-y-1.5 border ${
                          isSelected
                            ? isOnline
                              ? 'bg-sky-950/80 text-sky-200 border-sky-600 shadow-xl'
                              : 'bg-emerald-950/80 text-emerald-200 border-emerald-600 shadow-xl'
                            : isOnline
                            ? 'bg-[#021822] text-slate-300 hover:bg-[#032230] border-sky-900/60 hover:border-sky-700'
                            : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800/80 border-slate-800/80 hover:border-emerald-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black font-mono uppercase ${
                            isOnline
                              ? 'bg-sky-950 text-sky-300 border border-sky-600'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          }`}>
                            {isOnline ? '🌐 ONLINE JOURNAL (API)' : '🏛️ LOCAL REPOSITORY'}
                          </span>
                          {b.hasBinaryPdf ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono shrink-0">
                              RAW PDF
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                              {isOnline ? 'Open Access' : 'Campus Copy'}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white line-clamp-1 leading-snug">{b.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{b.author}</div>
                        <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/40">
                          <span className={`font-mono font-bold ${isOnline ? 'text-sky-400' : 'text-emerald-400'}`}>
                            {isOnline ? (b.issn ? `ISSN: ${b.issn}` : 'ONLINE') : (b.courseCode || b.callNumber || '')}
                          </span>
                          <span className="truncate max-w-[150px]">
                            {isOnline ? 'OpenAlex Scholarly API' : `By: ${b.uploadedBy || 'HOD'}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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

          {/* MODE 1: PDF MANUSCRIPT STREAM (HIGH-PERFORMANCE CANVAS PDF VIEWER) */}
          {readerMode === 'pdf' ? (
            <PdfCanvasViewer
              pdfUrl={currentBook?.fileDataUrl || currentBook?.file_data_url || currentBook?.pdfUrl || (currentBook?.id ? `/api/books/${encodeURIComponent(currentBook.id)}/pdf` : null)}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onTotalPages={(total) => {
                if (currentBook) {
                  currentBook.pdfPages = total;
                }
              }}
              title={currentBook?.title || 'Academic Document'}
              fileName={currentBook?.fileName || `${currentBook?.title || 'document'}.pdf`}
              theme={theme}
              onSwitchToInteractive={() => setReaderMode('interactive')}
            />
          ) : (
            /* MODE 2: INTERACTIVE E-BOOK TEXT READER (ORIGINAL FEATURES & RICH CONTENT) */
            <div className={`max-w-2xl mx-auto space-y-6 leading-relaxed font-serif flex-1 ${fontSize}`}>
              {/* Header Bar */}
              <div className="flex justify-between items-center text-[11px] font-sans font-bold uppercase tracking-widest text-emerald-500 pb-3 border-b border-dashed border-slate-700/50">
                <span>{currentChapter.title}</span>
                {currentBook.callNumber ? <span>Ref: {currentBook.callNumber}</span> : null}
              </div>

              {/* Book / Journal Title & Bibliographic Heading */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
                  {currentBook.title}
                </h2>
                <div className="text-xs font-sans text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                  {currentBook.author && <span>Author: <strong className="text-white">{currentBook.author}</strong></span>}
                  {currentBook.department && (
                    <>
                      <span>•</span>
                      <span>Dept / Faculty: <strong className="text-emerald-400">{currentBook.department}</strong></span>
                    </>
                  )}
                  {currentBook.year && (
                    <>
                      <span>•</span>
                      <span>Published: {currentBook.year}</span>
                    </>
                  )}
                </div>

                {/* Bibliographic Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3 font-sans text-[11px]">
                  {(currentBook.journalName || currentBook.journal_name || currentBook.publisher) && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium">
                      🏛️ {currentBook.journalName || currentBook.journal_name || currentBook.publisher}
                    </span>
                  )}
                  {(currentBook.volumeIssue || currentBook.volume_issue) && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-300 font-mono">
                      {currentBook.volumeIssue || currentBook.volume_issue}
                    </span>
                  )}
                  {currentBook.issn && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-300 font-mono">
                      ISSN {currentBook.issn}
                    </span>
                  )}
                  {currentBook.doi && (
                    <a
                      href={`https://doi.org/${currentBook.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> DOI: {currentBook.doi}
                    </a>
                  )}
                </div>
              </div>

              {/* Verified Abstract Box (Rendered only if real abstract exists in database) */}
              {currentBook.abstract ? (
                <div className={`p-4 rounded-xl border font-sans text-xs leading-relaxed space-y-1.5 ${
                  theme === 'dark'
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    : theme === 'sepia'
                    ? 'bg-[#f4ebe1] border-[#dfd2be] text-[#332a1e]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles size={14} /> Executive Abstract & Scholarly Scope:
                  </div>
                  <p>{currentBook.abstract}</p>
                </div>
              ) : null}

              {/* Real Content or High-Fidelity PDF Manuscript Stream */}
              <div className="space-y-4 font-sans text-sm">
                <h3 className="text-lg font-bold font-sans">
                  {currentChapter.title}
                </h3>

                {currentBook.content || currentBook.extractedText ? (
                  <div className="leading-relaxed whitespace-pre-line text-slate-200">
                    {currentBook.content || currentBook.extractedText}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 my-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Full Manuscript Stream</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                        This work is streamed directly from its official document PDF payload. Click below to view the original manuscript in high-fidelity canvas mode.
                      </p>
                    </div>
                    {currentBook.pdfUrl && (
                      <button
                        type="button"
                        onClick={() => setReaderMode('pdf')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition inline-flex items-center gap-2 shadow"
                      >
                        <BookOpen size={14} />
                        <span>View in PDF Canvas Stream</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Scholarly Citation Box */}
                <div className={`p-4 rounded-xl border text-xs my-3 space-y-2 ${
                  theme === 'dark'
                    ? 'bg-slate-950/80 border-slate-700/80 text-slate-200'
                    : theme === 'sepia'
                    ? 'bg-[#ebe0d0] border-[#c9bba6] text-[#3b2b1a]'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
                      Standard Academic Citation ({citationFormat}):
                    </span>
                    <button
                      onClick={copyCitation}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center gap-1"
                    >
                      {copiedCitation ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedCitation ? 'Copied' : 'Copy Citation'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 break-words">
                    {getCitationText()}
                  </div>
                </div>

                {/* External Actions & Source Access */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {currentBook.doi && (
                    <a
                      href={`https://doi.org/${currentBook.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <ExternalLink size={13} />
                      <span>Open Full Publisher Source (DOI)</span>
                    </a>
                  )}
                  {currentBook.externalUrl && !currentBook.doi && (
                    <a
                      href={currentBook.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
                    >
                      <ExternalLink size={13} />
                      <span>Open External Repository Paper</span>
                    </a>
                  )}
                  {currentBook.pdfUrl && (
                    <button
                      onClick={() => setReaderMode('pdf')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <FileText size={13} />
                      <span>Switch to PDF Canvas Viewer</span>
                    </button>
                  )}
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
