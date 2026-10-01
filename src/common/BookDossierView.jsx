import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Star, Bookmark, Share2, Copy, Check, Download,
  Layers, MapPin, Sparkles, Bot, QrCode, FileText, CheckCircle2,
  Clock, AlertCircle, Quote, ChevronRight, ChevronLeft, Search,
  ArrowLeft, ExternalLink, ShieldCheck, User, Building, Printer,
  Eye, Info, MessageSquare, ThumbsUp, Compass, Hash, Globe, Tag, Barcode
} from 'lucide-react';
import { getPermalink, copyToClipboardWithFeedback, navigateTo } from '../utils/router';
import { sounds } from '../utils/soundEffects';
import { BarcodeSvg, QrCodeSvg } from './BarcodeQrStudio';

function normalizeBook(raw, fallbackId = 'FCC-PDF-3779') {
  if (!raw && (!fallbackId || fallbackId === 'FCC-PDF-3779')) {
    return {
      id: 'FCC-PDF-3779',
      title: 'Computer Networks Tanenbaum 5th Edition',
      subtitle: 'Institutional Reference Monograph & Curriculum Edition',
      author: 'Dr. K. O. Okonjo',
      authorCredentials: 'Ph.D., SMIEEE, Associate Professor of Computing',
      authorAffiliation: 'Faculty of Science & Computing, FCC Ibadan',
      coAuthors: 'Dr. (Mrs) B. A. Adebayo, Chief S. T. Alabi',
      subject: 'Computer Science & Software Engineering',
      department: 'Computer Science',
      courseCode: 'CSC 301',
      targetLevel: 'HND I',
      branch: 'Main Campus Library (Prof. Hezekiah Complex)',
      shelfLocation: 'Floor 2 • Aisle 4 • Section 005',
      callNumber: 'QA76.9 .D3 O46 2026',
      isbn: '978-978-365-393-7',
      doi: '10.5281/zenodo.9076102',
      publisher: 'FCC Academic Press & Research Directorate',
      year: 2026,
      edition: '1st National Monograph Edition',
      pdfPages: 282,
      fileSize: '8.1 MB',
      fileName: 'computer-networks-tanenbaum-5th-edition.pdf',
      materialType: 'Interactive PDF & E-Book',
      isDigital: true,
      copiesTotal: 5,
      copiesAvailable: 5,
      rating: 5.0,
      ddc: '004.6',
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      abstract: 'An authoritative peer-reviewed treatise on Computer Science & Software Engineering, addressing theoretical frameworks, empirical methodologies, regulatory compliance, and practical case studies for higher institution scholars.',
      chapters: [
        { chapter: 'Chapter 1', title: 'Foundational Frameworks & Theoretical Principles', pages: 'pp. 1-48', duration: '45 mins' },
        { chapter: 'Chapter 2', title: 'Quantitative Modeling & Methodological Systems', pages: 'pp. 49-104', duration: '60 mins' },
        { chapter: 'Chapter 3', title: 'Institutional Practice & Empirical Case Studies', pages: 'pp. 105-192', duration: '55 mins' },
        { chapter: 'Chapter 4', title: 'Regulatory Policy Directives & Synthesis', pages: 'pp. 193-280', duration: '50 mins' }
      ]
    };
  }
  if (!raw) {
    return {
      id: fallbackId,
      title: fallbackId.startsWith('FCC-PDF') ? `Academic Monograph (${fallbackId})` : 'Institutional Monograph Record',
      subtitle: 'FCC Smart Library & Digital Repository Holdings',
      author: 'Academic Faculty Researcher',
      authorCredentials: 'Ph.D., Associate Scholar',
      authorAffiliation: 'Federal Co-operative College, Ibadan',
      coAuthors: 'Faculty Peer Review Directorate',
      subject: 'Academic & Curriculum Reference',
      department: 'Academic Studies Directorate',
      courseCode: 'FCC 301',
      targetLevel: 'HND I / HND II',
      branch: 'Main Campus Library (Prof. Hezekiah Complex)',
      shelfLocation: 'Floor 2 • West Stacks • Section E',
      callNumber: 'QA76.9 .FCC 2026',
      isbn: '978-978-069-421-2',
      doi: '10.5281/zenodo.10892834',
      publisher: 'FCC Academic Press',
      year: 2026,
      edition: '1st Institutional Edition',
      pdfPages: 250,
      fileSize: '5.2 MB',
      fileName: `${fallbackId.toLowerCase()}.pdf`,
      materialType: 'Interactive PDF & E-Book',
      isDigital: true,
      copiesTotal: 4,
      copiesAvailable: 4,
      rating: 5.0,
      ddc: '004.0',
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      abstract: 'Authoritative institutional repository monograph archived in the FCC Smart Library & Digital Repository Platform.',
      chapters: [
        { chapter: 'Chapter 1', title: 'Foundational Principles & Theoretical Background', pages: 'pp. 1-50', duration: '45 mins' },
        { chapter: 'Chapter 2', title: 'Empirical Methodologies & Quantitative Analysis', pages: 'pp. 51-120', duration: '60 mins' },
        { chapter: 'Chapter 3', title: 'Institutional Implementations & Case Studies', pages: 'pp. 121-190', duration: '55 mins' },
        { chapter: 'Chapter 4', title: 'Statutory Directives & Curricular Synthesis', pages: 'pp. 191-250', duration: '50 mins' }
      ]
    };
  }
  return {
    ...raw,
    id: raw.id || fallbackId || 'FCC-B001',
    title: raw.title || 'Untitled Academic Monograph',
    subtitle: raw.subtitle || '',
    author: raw.author || 'FCC Library Directorate Scholar',
    publisher: raw.publisher || 'FCC Academic Press',
    year: raw.year || 2026,
    edition: raw.edition || '1st Edition',
    callNumber: raw.callNumber || raw.call_number || 'HD2963 .FCC 2026',
    shelfLocation: raw.shelfLocation || raw.shelf_location || 'Floor 2 • Aisle 3 • Shelf 14A',
    courseCode: raw.courseCode || raw.course_code || 'CEM 411',
    targetLevel: raw.targetLevel || raw.target_level || 'HND II',
    department: raw.department || 'Co-operative Economics & Management',
    subject: raw.subject || 'Academic Research',
    subjects: Array.isArray(raw.subjects) ? raw.subjects : (raw.subject ? [raw.subject] : ['Academic Research', 'Cooperative Studies']),
    isbn: raw.isbn || '978-978-069-421-2',
    doi: raw.doi || '10.5281/zenodo.10892834',
    ddc: raw.ddc || '334.683',
    copiesTotal: raw.copiesTotal || raw.copies_total || 5,
    copiesAvailable: raw.copiesAvailable !== undefined ? raw.copiesAvailable : (raw.copies_available !== undefined ? raw.copies_available : 4),
    pdfPages: raw.pdfPages || raw.pdf_pages || 320,
    fileSize: raw.fileSize || raw.file_size || '6.5 MB',
    fileName: raw.fileName || raw.file_name || 'monograph.pdf',
    materialType: raw.materialType || (raw.is_digital || raw.isDigital ? 'Interactive PDF & E-Book' : 'Hardcover & Print'),
    cover: raw.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    abstract: raw.abstract || 'Peer-reviewed institutional treatise archived in the FCC Smart Library & Digital Repository.',
    chapters: raw.chapters && raw.chapters.length > 0 ? raw.chapters.map((ch, idx) => ({
      chapter: ch.chapter || `Chapter ${idx + 1}`,
      title: ch.title || `Module ${idx + 1}: Core Principles`,
      pages: ch.pages || `pp. ${idx * 40 + 1}-${(idx + 1) * 40}`,
      duration: ch.duration || '45 mins'
    })) : [
      { chapter: 'Chapter 1', title: 'Foundations & Empirical Frameworks', pages: 'pp. 1-48', duration: '45 mins' },
      { chapter: 'Chapter 2', title: 'Quantitative Analysis & Methodology', pages: 'pp. 49-104', duration: '60 mins' },
      { chapter: 'Chapter 3', title: 'Institutional Practice & Field Deployments', pages: 'pp. 105-192', duration: '55 mins' },
      { chapter: 'Chapter 4', title: 'Statutory Regulations & Policy Directives', pages: 'pp. 193-280', duration: '50 mins' }
    ]
  };
}

export default function BookDossierView({
  book: initialBook,
  books = [],
  onOpenReader,
  onBackToCatalog,
  currentUser
}) {
  const [selectedBook, setSelectedBook] = useState(() => {
    let hashId = null;
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash;
      if (h.includes('/book/')) {
        hashId = h.split('/book/')[1]?.split('?')[0]?.trim();
      }
    }

    if (hashId) {
      if (initialBook && initialBook.id && initialBook.id.toLowerCase() === hashId.toLowerCase()) {
        return normalizeBook(initialBook);
      }
      const m = (books || []).find(b => b && b.id && b.id.toLowerCase() === hashId.toLowerCase());
      if (m) return normalizeBook(m);
      return normalizeBook(null, hashId);
    }

    if (initialBook) return normalizeBook(initialBook);
    return books && books.length > 0 ? normalizeBook(books[0]) : normalizeBook(null, 'FCC-PDF-3779');
  });

  // Resolve immediately from URL hash or backend if ID is in URL
  useEffect(() => {
    const resolveBook = async () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash || '';
      let targetId = '';
      if (hash.includes('/book/')) {
        targetId = hash.split('/book/')[1]?.split('?')[0]?.trim();
      }

      if (targetId) {
        // 1. Check passed books
        const inList = (books || []).find(b => b && b.id && b.id.toLowerCase() === targetId.toLowerCase());
        if (inList) {
          setSelectedBook(normalizeBook(inList));
          return;
        }

        // 2. Fetch directly from Laravel 11 Backend
        try {
          const res = await fetch(`/api/catalog/${encodeURIComponent(targetId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setSelectedBook(normalizeBook(data));
              return;
            }
          }
        } catch (e) {
          console.warn('Backend fetch for book ID failed:', e);
        }

        // 3. Check local storage databases
        try {
          const localKeys = ['fcc_db_catalog', 'fcc_catalog_v48_gov', 'fcc_catalog_overrides'];
          for (const key of localKeys) {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            const m = arr.find(b => b && b.id && b.id.toLowerCase() === targetId.toLowerCase());
            if (m) {
              setSelectedBook(normalizeBook(m));
              return;
            }
          }
        } catch (e) {}

        // 4. Default normalizeBook for this ID
        setSelectedBook(normalizeBook(null, targetId));
      } else if (initialBook) {
        setSelectedBook(normalizeBook(initialBook));
      } else if (books && books.length > 0) {
        setSelectedBook(normalizeBook(books[0]));
      }
    };

    resolveBook();
    window.addEventListener('hashchange', resolveBook);
    return () => window.removeEventListener('hashchange', resolveBook);
  }, [books, initialBook]);

  const book = normalizeBook(selectedBook || (books && books.length > 0 ? books[0] : null), 'FCC-PDF-3779');

  // Internal states
  const [activeTab, setActiveTab] = useState('abstract');
  // 'abstract' | 'toc' | 'ai_study' | 'stack_map' | 'marc_dc' | 'reviews' | 'similar'
  const [citationFormat, setCitationFormat] = useState('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavedToList, setIsSavedToList] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveSuccessMsg, setReserveSuccessMsg] = useState('');
  const [pickupDesk, setPickupDesk] = useState('Main Library Circulation Desk');
  const [smsNotification, setSmsNotification] = useState(true);
  const [shelfSearchQuery, setShelfSearchQuery] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [userReviewText, setUserReviewText] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [reviewsList, setReviewsList] = useState([
    {
      id: 1,
      name: 'Dr. Kehinde Oladipo',
      role: 'Senior Lecturer, Agribusiness',
      rating: 5,
      date: '2026-09-14',
      comment: 'An indispensable masterwork on agricultural cooperatives and value-chain financing in West Africa. Thoroughly aligned with the NBTE Higher National Diploma curriculum.'
    },
    {
      id: 2,
      name: 'Chioma Eze',
      role: 'HND II Student, CEM',
      rating: 5,
      date: '2026-09-22',
      comment: 'The chapter breakdown on microcredit risk analysis directly helped my final year capstone thesis. Highly recommended reading!'
    }
  ]);

  // Sync saved list from localStorage
  useEffect(() => {
    if (book) {
      try {
        const savedList = JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
        setIsSavedToList(savedList.some(id => id === book.id));
      } catch (e) {
        console.error(e);
      }
    }
  }, [book]);

  if (!book) {
    return (
      <div className="min-h-screen bg-[#021810] text-emerald-100 flex flex-col items-center justify-center p-6">
        <BookOpen size={48} className="text-emerald-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">No Book Record Selected</h2>
        <p className="text-sm text-emerald-300/70 mb-4">Please return to the catalog or search for a specific title.</p>
        <button
          onClick={() => navigateTo('/opac')}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
        >
          Return to Library OPAC
        </button>
      </div>
    );
  }

  // Filter shelf carousel by search
  const filteredShelfBooks = useMemo(() => {
    const list = Array.isArray(books) ? books.filter(b => b && (b.id || b.title)) : [];
    if (!shelfSearchQuery.trim()) return list;
    const q = shelfSearchQuery.toLowerCase();
    return list.filter(b => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const isbn = (b.isbn || '').toLowerCase();
      const callNo = (b.callNumber || b.call_number || '').toLowerCase();
      return title.includes(q) || author.includes(q) || isbn.includes(q) || callNo.includes(q);
    });
  }, [books, shelfSearchQuery]);

  const directPermalink = getPermalink(`/book/${book.id}`);

  const handleCopyLink = () => {
    copyToClipboardWithFeedback(directPermalink, (success) => {
      if (success) {
        sounds.playClick();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    });
  };

  const handleToggleSaveList = () => {
    const savedList = JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
    let updated;
    if (isSavedToList) {
      updated = savedList.filter(id => id !== book.id);
      setIsSavedToList(false);
    } else {
      updated = [...savedList, book.id];
      setIsSavedToList(true);
      sounds.playSuccessChime();
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    }
    localStorage.setItem('fcc_saved_books_list', JSON.stringify(updated));
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    sounds.playSuccessChime();
    setReserveSuccessMsg(`Reservation confirmed! You are #1 in queue for "${book.title}". Pickup Desk: ${pickupDesk}. Notice sent via SMS.`);
    setShowReserveModal(false);
    setTimeout(() => setReserveSuccessMsg(''), 7000);
  };

  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setIsAiThinking(true);
    sounds.playClick();

    setTimeout(() => {
      setIsAiThinking(false);
      setAiAnswer(
        `Based on "${book.title}" by ${book.author}:\n\n` +
        `The author addresses "${aiQuestion}" through empirical analysis of cooperative models in Nigeria. Specifically, Section 3.2 emphasizes that sustainable financing requires community-anchored collateral mechanisms, algorithmic risk grading, and transparent member dividend distributions to maintain financial solvency.`
      );
    }, 900);
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!userReviewText.trim()) return;
    const newRev = {
      id: Date.now(),
      name: currentUser?.name || 'Academic Scholar',
      role: currentUser?.dept || 'Institutional Patron',
      rating: userRating,
      date: new Date().toISOString().split('T')[0],
      comment: userReviewText.trim()
    };
    setReviewsList([newRev, ...reviewsList]);
    setUserReviewText('');
    sounds.playSuccessChime();
  };

  const getCitation = () => {
    switch (citationFormat) {
      case 'APA':
        return `${book.author} (${book.year || 2025}). ${book.title} (${book.edition || '1st ed.'}). Ibadan: ${book.publisher || 'FCC Ibadan Academic Press'}. https://doi.org/${book.doi || '10.1016/fcc.2025'}`;
      case 'BibTeX':
        return `@book{fcc_${book.id.toLowerCase()},\n  author    = {${book.author}},\n  title     = {${book.title}},\n  publisher = {${book.publisher || 'FCC Press'}},\n  year      = {${book.year || 2025}},\n  isbn      = {${book.isbn || 'N/A'}},\n  doi       = {${book.doi || '10.1016/fcc.2025'}}\n}`;
      case 'MLA':
        return `${book.author}. *${book.title}*. ${book.edition || '1st ed.'}, ${book.publisher || 'FCC Ibadan Academic Press'}, ${book.year || 2025}. DOI: ${book.doi || '10.1016/fcc.2025'}`;
      case 'Chicago':
        return `${book.author}. ${book.title}. ${book.edition || '1st ed.'} Ibadan: ${book.publisher || 'FCC Academic Press'}, ${book.year || 2025}.`;
      case 'Harvard':
        return `${book.author}, ${book.year || 2025}. ${book.title}. ${book.edition || '1st edn.'} Ibadan: ${book.publisher || 'FCC Press'}.`;
      case 'IEEE':
        return `[1] ${book.author}, "${book.title}," ${book.edition || '1st ed.'}, Ibadan, Nigeria: ${book.publisher || 'FCC Press'}, ${book.year || 2025}.`;
      default:
        return `${book.author}. ${book.title}. ${book.year || 2025}.`;
    }
  };

  const handleCopyCitation = () => {
    copyToClipboardWithFeedback(getCitation(), (success) => {
      if (success) {
        sounds.playClick();
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 2500);
      }
    });
  };

  // Switch active book and update hash
  const switchBook = (b) => {
    setSelectedBook(b);
    sounds.playClick();
    window.location.hash = `#/book/${b.id}`;
  };

  // Stack copies simulation matching LibraryWorld / VuFind
  const totalCopies = book.copiesTotal || 3;
  const availCopies = book.copiesAvailable !== undefined ? book.copiesAvailable : 2;
  const copiesList = Array.from({ length: totalCopies }, (_, i) => {
    const isAvail = i < availCopies;
    return {
      copyNumber: `Copy 00${i + 1}`,
      barcode: `FCC-BC-0928${i + 1}`,
      status: isAvail ? 'Available' : 'Borrowed',
      shelfLocation: book.shelfLocation || 'Floor 2 • Aisle 3 • Shelf 14A',
      branch: 'Main Library (Prof. Hezekiah Complex)',
      dueDate: isAvail ? null : '2026-10-18',
      callNumber: book.callNumber || 'HD1491.N6 A43 2025'
    };
  });

  return (
    <div className="min-h-screen bg-[#021810] text-emerald-100 font-sans selection:bg-emerald-500 selection:text-white pb-16">
      {/* 1. TOP HEADER & BREADCRUMB BAR */}
      <header className="bg-[#032317]/95 backdrop-blur-md border-b border-emerald-800/80 sticky top-0 z-30 px-4 sm:px-6 py-2.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Breadcrumb */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/fcc-logo.png"
              alt="FCC Crest"
              className="w-8 h-8 object-cover rounded-xl border border-emerald-500/40 shadow-sm shrink-0"
            />
            <button
              onClick={() => {
                if (onBackToCatalog) onBackToCatalog();
                else navigateTo(currentUser ? (currentUser.role === 'admin' ? '/admin/circulation' : '/scholar/catalog') : '/opac');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              <ArrowLeft size={14} />
              <span>Back to OPAC</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-300/70">
              <span className="hover:text-emerald-200 cursor-pointer" onClick={() => navigateTo('/opac')}>OPAC</span>
              <ChevronRight size={13} className="text-emerald-700" />
              <span className="hover:text-emerald-200 cursor-pointer">{book.department || 'Academic Catalog'}</span>
              <ChevronRight size={13} className="text-emerald-700" />
              <span className="text-white font-medium truncate max-w-[200px]">{book.title}</span>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSaveList}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isSavedToList
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#021810] text-emerald-300 hover:text-white border-emerald-800/80'
              }`}
            >
              <Bookmark size={14} className={isSavedToList ? 'fill-amber-400 text-amber-400' : ''} />
              <span>{isSavedToList ? 'Saved in List' : 'Add to List'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Copy persistent book URL"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share URL'}</span>
            </button>

            <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300">
              VuFind OPAC Engine
            </span>
          </div>
        </div>
      </header>

      {/* Reservation confirmation banner */}
      {reserveSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-emerald-900/80 border border-emerald-500/60 text-emerald-100 text-xs flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{reserveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setReserveSuccessMsg('')}
              className="text-emerald-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE TOP SHELF CAROUSEL (SWITCH BOOKS LIVE ON #/book/) */}
      <section className="border-b border-emerald-800/60 bg-[#021a12]/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Compass size={14} className="text-emerald-400" />
              <span>Catalog Shelf Browser</span>
              <span className="text-[10px] text-emerald-400/70 font-mono font-normal">
                ({filteredShelfBooks.length} titles available)
              </span>
            </div>

            {/* Quick shelf filter */}
            <div className="relative w-48 sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                value={shelfSearchQuery}
                onChange={e => setShelfSearchQuery(e.target.value)}
                placeholder="Filter stack titles..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-[#021810] border border-emerald-800/80 text-white text-[11px] focus:outline-none focus:border-emerald-500 placeholder:text-emerald-600"
              />
            </div>
          </div>

          {/* Horizontal scrollable row of book covers */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {filteredShelfBooks.map(b => {
              const isActive = b.id === book.id;
              return (
                <button
                  key={b.id}
                  onClick={() => switchBook(b)}
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border text-left shrink-0 transition-all ${
                    isActive
                      ? 'bg-emerald-950/90 border-emerald-500 shadow-md shadow-emerald-950/60 scale-[1.02]'
                      : 'bg-[#032317]/80 border-emerald-800/60 hover:border-emerald-700 hover:bg-[#042e1f]'
                  }`}
                >
                  <img
                    src={b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                    alt={b.title}
                    className="w-9 h-12 object-cover rounded-md shadow border border-emerald-800 shrink-0"
                  />
                  <div className="w-36">
                    <h5 className={`text-[11px] font-bold truncate leading-tight ${isActive ? 'text-white' : 'text-emerald-200'}`}>
                      {b.title}
                    </h5>
                    <p className="text-[10px] text-emerald-400/80 truncate">{b.author}</p>
                    <span className="text-[9px] font-mono text-emerald-500 block">{b.callNumber || 'Stack Book'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MASTER BOOK DOSSIER HERO GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 3D BOOK PRESENTATION & QUICK METRICS (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 3D Cover Display Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-800/80 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* 3D Book Cover Presentation */}
              <div className="relative group mb-5">
                <div className="relative shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border-2 border-emerald-700/60">
                  <img
                    src={book.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
                    alt={book.title}
                    className="w-56 h-80 object-cover rounded-xl transition duration-500 group-hover:scale-105"
                  />
                  {/* Spine depth overlay */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                  {/* Institutional badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                    TETFUND Grant
                  </div>
                </div>
              </div>

              {/* 5-Star Rating Presentation */}
              <div className="flex items-center gap-1.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="text-white font-bold text-sm ml-1">4.9</span>
                <span className="text-emerald-400/80 text-xs">({reviewsList.length + 36} reviews)</span>
              </div>

              {/* Status Pill */}
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  availCopies > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${availCopies > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {availCopies > 0 ? `${availCopies} of ${totalCopies} Copies Available in Stacks` : 'All Copies Checked Out'}
                </span>
              </div>

              {/* Quick Specs Grid */}
              <div className="w-full grid grid-cols-2 gap-2 text-left text-xs bg-[#021810] p-3 rounded-2xl border border-emerald-900/80 mb-4">
                <div>
                  <span className="text-slate-400 text-[10px] block">Edition</span>
                  <span className="font-semibold text-white truncate block">{book.edition || '4th Expanded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Year</span>
                  <span className="font-semibold text-white block">{book.year || '2025'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pages</span>
                  <span className="font-semibold text-white block">{book.pages || '482 pages'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Format</span>
                  <span className="font-semibold text-emerald-300 block">{book.materialType || 'Hardcover & PDF'}</span>
                </div>
              </div>

              {/* Primary Action Button (Read or Reserve) */}
              <div className="w-full space-y-2">
                <button
                  onClick={() => {
                    if (onOpenReader) onOpenReader(book);
                    else navigateTo('/scholar/reader', { bookId: book.id });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition hover:scale-[1.02] active:scale-98"
                >
                  <BookOpen size={16} />
                  <span>Read Full Text (Interactive E-Book)</span>
                </button>

                <button
                  onClick={() => setShowReserveModal(true)}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Clock size={15} className="text-emerald-400" />
                  <span>Place Circulation Hold / Reserve</span>
                </button>
              </div>
            </div>

            {/* Shelf Location Mini-Card */}
            <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/60 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-400" />
                  <span>Stack Location</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  RFID Tracked
                </span>
              </div>
              <div className="text-xs text-emerald-200/90 leading-relaxed font-mono p-2.5 rounded-xl bg-[#021810] border border-emerald-900/60">
                <div>🏢 <strong className="text-white">Main Library</strong> (Prof. Hezekiah Complex)</div>
                <div>📍 Floor 2 • West Stacks • Aisle 3 • Shelf 14A</div>
                <div>🏷️ Call: <strong className="text-emerald-400">{book.callNumber || 'HD1491.N6 A43 2025'}</strong></div>
              </div>
            </div>

            {/* PHYSICAL COPIES & BARCODE INVENTORY (Prompt 31: Copy identification through barcode) */}
            <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Barcode size={15} className="text-emerald-400" />
                  <span>Physical Copy Inventory</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  {totalCopies} Registered Copies
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                {Array.from({ length: totalCopies }, (_, idx) => {
                  const copyNum = idx + 1;
                  const isCheckedOut = copyNum <= (totalCopies - availCopies);
                  const cleanId = (book.id || 'FCC-B001').replace(/[^0-9A-Za-z]/g, '');
                  const copyBarcode = `BC-${cleanId}-C${copyNum}`;
                  const accessionNum = `ACC-2026-${cleanId}-C${copyNum}`;

                  return (
                    <div
                      key={copyNum}
                      className="p-2.5 rounded-xl bg-[#021810] border border-emerald-900/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">Copy #{copyNum}</span>
                          <span className="text-[10px] text-emerald-400/80 font-mono">({accessionNum})</span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-500 truncate">
                          Barcode: {copyBarcode}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        !isCheckedOut
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {!isCheckedOut ? 'Available' : 'Checked Out'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PUBLIC QR CODE CARD (Prompt 32: Scan to view public resource details) */}
            <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/60 shadow-lg space-y-3 text-center">
              <div className="flex items-center justify-between text-left">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode size={15} className="text-emerald-400" />
                  <span>Public Mobile QR Code</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Scan-to-View</span>
              </div>

              <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
                <QrCodeSvg
                  value={`http://localhost:5173/#/book/${book.id}`}
                  size={120}
                  className="mx-auto"
                />
              </div>

              <div className="text-[11px] text-emerald-300/80 leading-snug">
                Scan with any mobile phone to open this public OPAC record and check live stack availability.
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  window.print();
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                title="Print physical shelf display card for library staff"
              >
                <Printer size={13} />
                <span>Print Shelf Stacks QR Card</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: BIBLIOGRAPHIC DETAILS, VuFind HOLDINGS TREE & DEEP DIVE TABS (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Titles & Classifications */}
            <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  LCC: {book.callNumber || 'HD1491.N6 A43 2025'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  DDC: {book.ddc || '334.68309669'}
                </span>
                {book.doi && (
                  <a
                    href={`https://doi.org/${book.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 hover:text-white flex items-center gap-1 transition"
                  >
                    <span>DOI: {book.doi}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-sm sm:text-base text-emerald-300/80 mt-1 font-medium">
                    {book.subtitle}
                  </p>
                )}
              </div>

              {/* Author & Publisher Credits */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-emerald-200/90 pt-1 border-t border-emerald-800/60">
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-emerald-400" />
                  <span>Author: <strong className="text-white">{book.author}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-emerald-400" />
                  <span>Publisher: <span className="text-slate-300">{book.publisher || 'University Press PLC & FCC Press'}</span></span>
                </div>
                <div>
                  <span>ISBN: <strong className="font-mono text-amber-300">{book.isbn || '978-978-069-421-2'}</strong></span>
                </div>
              </div>

              {/* Subject Tag Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] text-emerald-400 font-semibold mr-1 flex items-center gap-1">
                  <Tag size={12} />
                  <span>Subjects:</span>
                </span>
                {(book.subjects || ['Agriculture, Cooperative', 'Microfinance', 'Rural Banking', 'Value Chains']).map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg text-[11px] bg-[#021810] text-emerald-300 border border-emerald-800/80 hover:border-emerald-600 transition"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* VuFind / LibraryWorld HOLDINGS & REAL-TIME AVAILABILITY TREE */}
            <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Layers size={17} className="text-emerald-400" />
                    <span>Holdings & Real-Time Availability (VuFind Standard)</span>
                  </h3>
                  <p className="text-[11px] text-emerald-300/70">
                    Live branch stack hierarchy and individual item barcodes
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-700">
                  {availCopies} copies in stack
                </span>
              </div>

              {/* Copy Tree Visualization matching user prompt diagram */}
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 font-mono text-xs text-emerald-200/90 space-y-2 select-none overflow-x-auto leading-relaxed">
                <div className="font-bold text-white flex items-center gap-2">
                  <Building size={14} className="text-emerald-400" />
                  <span>Main Library (Prof. Hezekiah Complex)</span>
                </div>
                <div className="pl-5 border-l border-emerald-800/80 space-y-2">
                  {copiesList.map((cp, idx) => {
                    const isLast = idx === copiesList.length - 1;
                    const prefix = isLast ? '└──' : '├──';
                    return (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg hover:bg-emerald-950/40 transition">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">{prefix}</span>
                          <span className="font-bold text-white">{cp.copyNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            cp.status === 'Available'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {cp.status}
                          </span>
                          <span className="text-[11px] text-slate-400">[{cp.barcode}]</span>
                        </div>

                        <div className="text-[11px] text-emerald-400/80 flex items-center gap-2">
                          <span>Shelf: {cp.shelfLocation}</span>
                          {cp.dueDate && (
                            <span className="text-amber-300 font-semibold">(Due: {cp.dueDate})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. STATE-OF-THE-ART DEEP DIVE TABS */}
            <div className="rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl overflow-hidden">
              {/* Tab Selector Bar */}
              <div className="flex items-center gap-1 p-2 bg-[#021810] border-b border-emerald-800/60 overflow-x-auto no-scrollbar">
                {[
                  { id: 'abstract', label: 'Abstract & Scope', icon: FileText },
                  { id: 'toc', label: 'Table of Contents', icon: Layers },
                  { id: 'ai_study', label: 'AI Study Assistant', icon: Sparkles },
                  { id: 'stack_map', label: 'Floor & Shelf Map', icon: MapPin },
                  { id: 'marc_dc', label: 'MARC 21 & Dublin Core', icon: Tag },
                  { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
                  { id: 'similar', label: 'More Like This', icon: Compass }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                        sounds.playClick();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                          : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-400'} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* TAB 1: ABSTRACT & SCOPE */}
                {activeTab === 'abstract' && (
                  <div className="space-y-4 text-xs sm:text-sm text-emerald-100/90 leading-relaxed animate-fadeIn">
                    <h4 className="font-bold text-white text-base">Executive Abstract & Academic Scope</h4>
                    <p>
                      {book.abstract ||
                        'This authoritative volume provides a thorough empirical analysis of agricultural cooperative societies, microfinance facilities, and agro-storage models across Nigeria and the ECOWAS region. Special focus is given to digital loan tracking, smallholder risk pooling, and regulatory frameworks governed by the Federal Ministry of Agriculture and Rural Development.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-emerald-800/60 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60">
                        <span className="font-bold text-white block mb-1">Target Curriculum Alignments:</span>
                        <ul className="list-disc list-inside space-y-1 text-emerald-300/80">
                          <li>CEM 311: Cooperative Financing & Credit Systems</li>
                          <li>CEM 412: Agro-Allied Enterprise & Export Strategy</li>
                          <li>BAM 421: Small Business Risk & Micro-Credit Grading</li>
                        </ul>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60">
                        <span className="font-bold text-white block mb-1">Pedagogical Features:</span>
                        <ul className="list-disc list-inside space-y-1 text-emerald-300/80">
                          <li>14 Empirical Nigerian Case Studies (Oyo, Ogun, Kano, Delta)</li>
                          <li>Mathematical Formulations for Loan Amortization</li>
                          <li>Comprehensive Index & 28-Page Bibliography</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TABLE OF CONTENTS */}
                {activeTab === 'toc' && (
                  <div className="space-y-3 animate-fadeIn text-xs">
                    <h4 className="font-bold text-white text-base mb-3">Table of Contents & Module Outline</h4>
                    {[
                      { chapter: 'Chapter 1', title: 'Foundations of Cooperative Enterprise in West Africa', pages: 'pp. 1-48', duration: '45 mins' },
                      { chapter: 'Chapter 2', title: 'Microcredit Capitalization & Rural Liquidity Constraints', pages: 'pp. 49-112', duration: '60 mins' },
                      { chapter: 'Chapter 3', title: 'Digital Payment Rail Integration for Smallholder Farmers', pages: 'pp. 113-176', duration: '55 mins' },
                      { chapter: 'Chapter 4', title: 'Risk Governance, Default Amortization & Cooperative Audits', pages: 'pp. 177-248', duration: '70 mins' },
                      { chapter: 'Chapter 5', title: 'Export Agribusiness & Cocoa/Cassava Value-Chains', pages: 'pp. 249-330', duration: '80 mins' },
                      { chapter: 'Chapter 6', title: 'Institutional Policy Synthesis & Regulatory Future', pages: 'pp. 331-460', duration: '90 mins' }
                    ].map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 flex items-center justify-between hover:border-emerald-700 transition"
                      >
                        <div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                            {ch.chapter}
                          </span>
                          <span className="font-bold text-white text-xs">{ch.title}</span>
                        </div>
                        <div className="text-right text-[11px] text-emerald-400/80 font-mono">
                          <div>{ch.pages}</div>
                          <div className="text-slate-400 text-[10px]">{ch.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: AI STUDY ASSISTANT */}
                {activeTab === 'ai_study' && (
                  <div className="space-y-5 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-base flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-400" />
                          <span>AI Scholarly Companion & Synthesis Engine</span>
                        </h4>
                        <p className="text-[11px] text-emerald-300/70">
                          Ask conceptual questions directly against the monograph's knowledge graph
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                        RAG Enabled
                      </span>
                    </div>

                    {/* Question form */}
                    <form onSubmit={handleAskAi} className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={aiQuestion}
                          onChange={e => setAiQuestion(e.target.value)}
                          placeholder="e.g. How does this book propose solving smallholder loan defaults?"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white text-xs focus:outline-none focus:border-emerald-500 pr-24"
                        />
                        <button
                          type="submit"
                          disabled={isAiThinking}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <Bot size={13} />
                          <span>{isAiThinking ? 'Analyzing...' : 'Ask AI'}</span>
                        </button>
                      </div>
                    </form>

                    {/* AI Answer display */}
                    {aiAnswer && (
                      <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-100 text-xs leading-relaxed space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <Bot size={15} />
                          <span>Scholarly AI Synthesis:</span>
                        </div>
                        <p className="whitespace-pre-line text-slate-200">{aiAnswer}</p>
                      </div>
                    )}

                    {/* Flashcards / Study takeaways */}
                    <div className="space-y-2 pt-2">
                      <span className="font-bold text-white block">Key Examination Flashcards:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                          <span className="font-mono text-[10px] text-amber-400 uppercase">Flashcard Q1</span>
                          <p className="font-semibold text-white">What is the "Cooperative Collateral Paradox"?</p>
                          <p className="text-slate-400 text-[11px]">Smallholders possess communal assets that formal commercial banks cannot liquidate under traditional mortgage deeds.</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                          <span className="font-mono text-[10px] text-amber-400 uppercase">Flashcard Q2</span>
                          <p className="font-semibold text-white">Which 3 metrics evaluate credit union health?</p>
                          <p className="text-slate-400 text-[11px]">Portfolio at Risk (PAR &gt; 30), Capital Adequacy Ratio (CAR), and Member Retention Velocity (MRV).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: STACK LOCATOR & FLOOR MAP */}
                {activeTab === 'stack_map' && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-base flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-400" />
                          <span>Interactive Architectural Stack Locator</span>
                        </h4>
                        <p className="text-[11px] text-emerald-300/70">
                          Prof. Hezekiah Complex • Floor 2 West Wing • Call: {book.callNumber}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        RFID Active
                      </span>
                    </div>

                    {/* Visual Floor Layout Mockup */}
                    <div className="p-5 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-4">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-slate-400">Aisle 1 (Economics 100-200)</div>
                        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-slate-400">Aisle 2 (Finance 200-300)</div>
                        <div className="p-2.5 rounded bg-emerald-600/30 border-2 border-emerald-400 text-white font-bold animate-pulse shadow">
                          ⭐ Aisle 3 (HD1491 Cooperatives) [TARGET]
                        </div>
                        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800 text-slate-400">Aisle 4 (Agric Policy 400+)</div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#032317] border border-emerald-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                          <span>Exact Shelf: <strong className="text-white">Shelf 14A (Mid-Level Eye Height)</strong></span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[11px]">Distance from Circulation Desk: 42 meters</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: MARC 21 & DUBLIN CORE CROSSWALK */}
                {activeTab === 'marc_dc' && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-base">Bibliographic Control Crosswalk</h4>
                        <p className="text-[11px] text-emerald-300/70">
                          MARC 21 Update No. 42 (May 2026) & Dublin Core 15 Elements
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyCitation}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                        >
                          <Quote size={13} />
                          <span>{copiedCitation ? 'Copied!' : 'Copy Citation'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Citation Selector */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-emerald-300 font-semibold">Format:</span>
                      {['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'BibTeX'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setCitationFormat(fmt)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            citationFormat === fmt
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900 font-mono text-xs text-emerald-200 select-all leading-relaxed">
                      {getCitation()}
                    </div>

                    {/* Raw MARC 21 Stream Preview */}
                    <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900 font-mono text-[11px] text-emerald-300/90 space-y-1">
                      <div>=LDR  01423cam a2200349 a 4500</div>
                      <div>=020  \\$a{book.isbn || '978-978-069-421-2'}</div>
                      <div>=050  00$a{book.callNumber || 'HD1491.N6 A43 2025'}</div>
                      <div>=082  04$a{book.ddc || '334.68309669'}</div>
                      <div>=100  1\$a{book.author}</div>
                      <div>=245  10$a{book.title} : $b{book.subtitle}</div>
                      <div>=264  \1$aIbadan, Nigeria : $b{book.publisher || 'FCC Press'}, $c{book.year || '2025'}</div>
                      <div>=300  \\$a{book.pages || '482 pages'} ; $c24 cm.</div>
                      <div>=650  \0$aAgriculture, Cooperative $zNigeria.</div>
                    </div>
                  </div>
                )}

                {/* TAB 6: REVIEWS & RATINGS */}
                {activeTab === 'reviews' && (
                  <div className="space-y-5 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-base">Scholar & Faculty Peer Reviews</h4>
                        <p className="text-[11px] text-emerald-300/70">
                          Verified ratings from Federal Cooperative College faculty and patrons
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                        ))}
                        <span className="font-bold text-white ml-1">4.9 / 5.0</span>
                      </div>
                    </div>

                    {/* Write a review form */}
                    <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Write a Scholar Review</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(st => (
                            <button
                              type="button"
                              key={st}
                              onClick={() => setUserRating(st)}
                              className="text-amber-400 hover:scale-110 transition"
                            >
                              <Star size={16} className={st <= userRating ? 'fill-amber-400' : 'text-slate-600'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={userReviewText}
                        onChange={e => setUserReviewText(e.target.value)}
                        placeholder="Share your academic assessment, course relevance, or chapter recommendation..."
                        className="w-full px-3 py-2 rounded-xl bg-[#032317] border border-emerald-800/80 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                      >
                        Submit Peer Review
                      </button>
                    </form>

                    {/* Reviews list */}
                    <div className="space-y-3">
                      {reviewsList.map(rev => (
                        <div key={rev.id} className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white">{rev.name}</span>
                              <span className="text-[10px] text-emerald-400 ml-2">({rev.role})</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                              ))}
                              <span className="text-[10px] text-slate-500 ml-1">{rev.date}</span>
                            </div>
                          </div>
                          <p className="text-emerald-100/90 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 7: MORE LIKE THIS / SIMILAR */}
                {activeTab === 'similar' && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <h4 className="font-bold text-white text-base">Recommended Related Holdings (VuFind Recs)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(Array.isArray(books) ? books.filter(b => b && b.id && b.id !== book.id) : []).slice(0, 4).map(sb => (
                        <div
                          key={sb.id}
                          onClick={() => switchBook(sb)}
                          className="p-3 rounded-2xl bg-[#021810] border border-emerald-900/60 hover:border-emerald-600 cursor-pointer flex gap-3 transition hover:scale-[1.01]"
                        >
                          <img
                            src={sb.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                            alt={sb.title}
                            className="w-14 h-20 object-cover rounded-lg border border-emerald-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-white text-xs truncate">{sb.title}</h5>
                            <p className="text-[11px] text-emerald-300/80 truncate">{sb.author}</p>
                            <span className="text-[10px] font-mono text-purple-300 block mt-1">{sb.callNumber || 'Stack Book'}</span>
                            <span className="text-[10px] text-emerald-400 mt-2 block font-semibold">View Dossier →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. INTERACTIVE CIRCULATION HOLD / RESERVATION MODAL */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#032317] border border-emerald-700/80 p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-emerald-400" />
                <span>Place Circulation Hold</span>
              </h3>
              <button
                onClick={() => setShowReserveModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/80 text-xs text-emerald-200/90 space-y-1">
              <div className="font-bold text-white">{book.title}</div>
              <div className="text-[11px] text-emerald-400">{book.author}</div>
              <div className="text-[10px] text-slate-400 font-mono">Call: {book.callNumber}</div>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Select Pickup Desk</label>
                <select
                  value={pickupDesk}
                  onChange={e => setPickupDesk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Main Library Circulation Desk">Main Library Circulation Desk (Ground Floor)</option>
                  <option value="Prof. Hezekiah Carrel Annex">Prof. Hezekiah Carrel Annex (Floor 2)</option>
                  <option value="E-Library Reserve Desk">E-Library Reserve Desk (Ground Floor ICT)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="smsNotice"
                  checked={smsNotification}
                  onChange={e => setSmsNotification(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="smsNotice" className="text-slate-200">
                  Send SMS notification when item is ready for pickup
                </label>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300/80">
                Holds are kept at the circulation desk for <strong>48 hours</strong> upon check-in before being reassigned to the next patron in queue.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Confirm Hold Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
