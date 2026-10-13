import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, BookOpen, Layers, Filter, CheckCircle, Clock, ArrowRight,
  Sparkles, Building, Globe, ExternalLink, Building2, Calendar,
  HelpCircle, MessageSquare, Phone, Mail, MapPin, ChevronRight,
  Check, Copy, Star, Bookmark, BookCheck, Sliders, ChevronDown,
  ChevronUp, Database, FileText, Newspaper, Radio, Video, Award,
  Volume2, Shield, AlertCircle, RefreshCw, Send, X, Share2, Tag, Scan,
  BookMarked, Library, Eye, Loader2, AlertTriangle, Download, Zap
} from 'lucide-react';
import { INSTITUTION, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import PartnerLibrariesGateway from '../common/PartnerLibrariesGateway';
import TraceBadge from '../common/TraceBadge';
import { navigateTo, parseCurrentRoute, copyToClipboardWithFeedback } from '../utils/router';
import { sounds } from '../utils/soundEffects';
import { PATTERNS } from '../utils/backgroundPatterns';
import OpenLibraryExplorer from '../student/OpenLibraryExplorer';
import GutendexExplorer from '../student/GutendexExplorer';
import TroveExplorer from '../student/TroveExplorer';
import InternetArchiveExplorer from '../student/InternetArchiveExplorer';
import GoogleBooksExplorer from '../student/GoogleBooksExplorer';
import ApiOverlayDiscovery from '../student/ApiOverlayDiscovery';

export default function PublicDiscovery({
  books = [],
  partnerLibraries = INITIAL_PARTNER_LIBRARIES,
  onSelectBook,
  onOpenLogin
}) {
  // Navigation: 'home' | 'catalog' | 'openlibrary' | 'gutenberg' | 'trove' | 'journals' | 'databases' | 'repository' | 'partner_libraries'
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all'); // 'all' | 'title' | 'author' | 'isbn' | 'subject' | 'call' | 'doi' | 'publisher'
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [didYouMeanSuggestion, setDidYouMeanSuggestion] = useState(null);
  const [activeDetectedBadge, setActiveDetectedBadge] = useState(null); // 'isbn' | 'doi' | 'synonym'

  // Live External Repository Integration State (Public Access without login)
  const [searchTarget, setSearchTarget] = useState('all'); // 'all' | 'stacks' | 'openlibrary' | 'gutenberg' | 'trove'
  const [liveFederatedLoading, setLiveFederatedLoading] = useState(false);
  const [liveOpenLibraryResults, setLiveOpenLibraryResults] = useState([]);
  const [liveGutenbergResults, setLiveGutenbergResults] = useState([]);
  const [liveInternetArchiveResults, setLiveInternetArchiveResults] = useState([]);
  const [liveGoogleBooksResults, setLiveGoogleBooksResults] = useState([]);
  const [hasQueriedLiveApi, setHasQueriedLiveApi] = useState(false);
  const [activeLiveReader, setActiveLiveReader] = useState(null); // { url, directUrl, title, source }
  const [savedBooks, setSavedBooks] = useState(() => {
    return JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
  });

  // Server-side / Client Pagination State (Prompt 34: 20, 50, 100 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Resource Category Filter: 'All' | 'Book' | 'Journal' | 'Student Project'
  const [resourceCategory, setResourceCategory] = useState('All');

  // Ask a Librarian Modal State
  const [showAskLibrarianModal, setShowAskLibrarianModal] = useState(false);
  const [askForm, setAskForm] = useState({ name: '', matricOrEmail: '', department: 'CEM', question: '' });
  const [askSubmitted, setAskSubmitted] = useState(false);

  // Advanced Search State
  const [advSearch, setAdvSearch] = useState({
    title: '',
    author: '',
    subject: '',
    isbn: '',
    publisher: '',
    yearFrom: '2015',
    yearTo: '2026',
    materialTypes: {
      Book: true,
      Journal: false,
      Thesis: false,
      Dissertation: false,
      eBook: true,
      Video: false,
      Audio: false,
      Newspaper: false,
      ConferencePaper: false
    },
    availability: {
      Available: true,
      CheckedOut: false,
      Electronic: true,
      ReferenceOnly: false
    }
  });

  // Faceted Filter States (VuFind / LibraryWorld standard)
  const [facets, setFacets] = useState({
    subject: 'All',
    department: 'All',
    format: 'All', // 'All' | 'Digital' | 'Physical'
    availability: 'All', // 'All' | 'Available' | 'CheckedOut'
    yearRange: 'All',
    language: 'All'
  });

  // Quick Synonyms & Typo Mapping Engine
  const TYPO_MAP = {
    'economitcs': 'econometrics',
    'computr': 'computer',
    'coop': 'co-operative economics',
    'cooperative': 'co-operative economics',
    'bankin': 'banking & finance',
    'databse': 'database',
    'agric': 'agricultural extension',
    'auditin': 'auditing'
  };

  const SYNONYMS = {
    'ai': { term: 'Artificial Intelligence', field: 'subject' },
    'ml': { term: 'Machine Learning & Neural Networks', field: 'subject' },
    'co-op': { term: 'Co-operative Economics', field: 'subject' },
    'money': { term: 'Banking & Finance', field: 'subject' },
    'crops': { term: 'Agricultural Extension', field: 'subject' },
    'sql': { term: 'Database Management', field: 'subject' }
  };

  // Autocomplete & Search Intelligence Listener
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      setDidYouMeanSuggestion(null);
      setActiveDetectedBadge(null);
      return;
    }

    // 1. Detect ISBN (10 or 13 digits, optional hyphens)
    const cleanIsbnCandidate = q.replace(/[^0-9X]/gi, '');
    if ((cleanIsbnCandidate.length === 10 || cleanIsbnCandidate.length === 13) && /^\d+$/.test(cleanIsbnCandidate)) {
      setActiveDetectedBadge({ type: 'isbn', value: cleanIsbnCandidate });
    } else if (q.startsWith('10.') || q.includes('doi.org')) {
      setActiveDetectedBadge({ type: 'doi', value: q });
    } else if (SYNONYMS[q]) {
      setActiveDetectedBadge({ type: 'synonym', target: SYNONYMS[q].term });
    } else {
      setActiveDetectedBadge(null);
    }

    // 2. Check Typo
    if (TYPO_MAP[q]) {
      setDidYouMeanSuggestion(TYPO_MAP[q]);
    } else {
      setDidYouMeanSuggestion(null);
    }

    // 3. Autocomplete Suggestions (Rich Multi-Field Matches)
    const matchedTitles = books
      .filter(b => b.title && b.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(b => ({
        type: 'Title',
        text: b.title,
        book: b,
        subtext: `${b.author || 'Author Unknown'} • ${b.courseCode || b.department || 'General'}`
      }));

    const matchedAuthors = books
      .filter(b => (b.author && b.author.toLowerCase().includes(q)) || (b.studentNames && b.studentNames.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(b => ({
        type: 'Author',
        text: b.author || b.studentNames,
        book: b,
        subtext: `Author of "${b.title}"`
      }));

    const matchedCourses = books
      .filter(b => (b.courseCode && b.courseCode.toLowerCase().includes(q)) || (b.course_code && b.course_code.toLowerCase().includes(q)))
      .slice(0, 3)
      .map(b => ({
        type: 'Course',
        text: (b.courseCode || b.course_code).toUpperCase(),
        book: b,
        subtext: `Curriculum Holding: ${b.title}`
      }));

    const matchedSubjects = books
      .filter(b => b.subject && b.subject.toLowerCase().includes(q))
      .slice(0, 3)
      .map(b => ({
        type: 'Subject',
        text: b.subject,
        book: b,
        subtext: `Academic Subject Classification`
      }));

    const combined = [...matchedTitles, ...matchedAuthors, ...matchedCourses, ...matchedSubjects];
    setAutocompleteSuggestions(combined);
    setShowAutocomplete(combined.length > 0);
  }, [searchQuery, books]);

  // Load saved bookmarks from SQL database (if backend is active)
  useEffect(() => {
    fetch('/api/favorites?user_id=guest_opac')
      .then(res => {
        if (!res.ok) throw new Error('Backend not available');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedBooks(prev => {
            const merged = Array.from(new Set([...prev, ...data]));
            localStorage.setItem('fcc_saved_books_list', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync Saved Books from storage and SQL database
  const handleToggleSaveBook = (bookId, e) => {
    e?.stopPropagation();
    let updated;
    if (savedBooks.includes(bookId)) {
      updated = savedBooks.filter(id => id !== bookId);
    } else {
      updated = [...savedBooks, bookId];
      sounds.playSuccessChime();
    }
    setSavedBooks(updated);
    localStorage.setItem('fcc_saved_books_list', JSON.stringify(updated));

    // Persist to SQL backend database
    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'guest_opac', book_id: bookId })
    }).catch(() => {});
  };

  // Fetch live external API resources from Open Library & Gutendex (No login required)
  const fetchLiveExternalResources = async (term) => {
    if (!term || term.trim().length < 2) {
      setLiveOpenLibraryResults([]);
      setLiveGutenbergResults([]);
      setHasQueriedLiveApi(false);
      return;
    }

    setLiveFederatedLoading(true);
    setHasQueriedLiveApi(true);

    try {
      // 1. Fetch from Open Library API (limit 6)
      const olUrl = searchField === 'author'
        ? `https://openlibrary.org/search.json?author=${encodeURIComponent(term)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,ia,ebook_access`
        : `https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,ia,ebook_access`;
      const olPromise = fetch(olUrl)
        .then(res => res.ok ? res.json() : { docs: [] })
        .then(data => data.docs || [])
        .catch(() => []);

      // 2. Fetch from Gutendex API via proxy or direct (limit 6)
      const gutPromise = fetch(`/api/gutenberg/books?search=${encodeURIComponent(term)}`)
        .then(res => {
          if (res.ok) return res.json();
          return fetch(`https://gutendex.com/books?search=${encodeURIComponent(term)}`).then(r => r.ok ? r.json() : { results: [] });
        })
        .then(data => (data.results || []).slice(0, 6))
        .catch(() => []);

      // 3. Fetch from Official Internet Archive API via backend proxy (limit 6)
      const iaPromise = fetch(`/api/internet-archive/search?q=${encodeURIComponent(term)}&filter=open&rows=6`)
        .then(res => res.ok ? res.json() : { results: [] })
        .then(data => (data.results || []).slice(0, 6))
        .catch(() => []);

      // 4. Fetch from Google Books API via backend proxy (limit 6)
      const gbQuery = searchField === 'author' ? `inauthor:${encodeURIComponent(term)}` : encodeURIComponent(term);
      const gbPromise = fetch(`/api/google-books/search?q=${gbQuery}&maxResults=6`)
        .then(res => res.ok ? res.json() : { books: [] })
        .then(data => (data.books || []).slice(0, 6))
        .catch(() => []);

      const [olDocs, gutResults, iaResults, gbResults] = await Promise.all([olPromise, gutPromise, iaPromise, gbPromise]);
      setLiveOpenLibraryResults(olDocs);
      setLiveGutenbergResults(gutResults);
      setLiveInternetArchiveResults(iaResults);
      setLiveGoogleBooksResults(gbResults);
    } catch (err) {
      console.error('Error fetching live federated resources:', err);
    } finally {
      setLiveFederatedLoading(false);
    }
  };

  const handlePerformSearch = (e) => {
    if (e) e.preventDefault();
    sounds.playClick();
    if (searchTarget === 'overlay') {
      setActiveTab('overlay');
    } else if (searchTarget === 'google_books') {
      setActiveTab('google_books');
    } else if (searchTarget === 'openlibrary') {
      setActiveTab('openlibrary');
    } else if (searchTarget === 'gutenberg') {
      setActiveTab('gutenberg');
    } else if (searchTarget === 'archive') {
      setActiveTab('archive');
    } else if (searchTarget === 'trove') {
      setActiveTab('trove');
    } else if (searchTarget === 'stacks') {
      setActiveTab('catalog');
    } else {
      // 'all' (Federated)
      setActiveTab('home');
      fetchLiveExternalResources(searchQuery);
    }
  };

  // Filtered Books with Multi-Field, Category, and Advanced Facets
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const isProject = b.category === 'Student Project' || b.materialType === 'Thesis' || b.materialType === 'Dissertation' || (b.id && String(b.id).startsWith('TH-')) || (b.resourceType && String(b.resourceType).toLowerCase().includes('project'));
      const isJournal = b.category === 'Journal' || b.materialType === 'Journal' || Boolean(b.issn) || (b.resourceType && String(b.resourceType).toLowerCase().includes('journal'));
      const isBook = !isProject && !isJournal;

      // Category filter
      if (resourceCategory === 'Book' && !isBook) return false;
      if (resourceCategory === 'Journal' && !isJournal) return false;
      if (resourceCategory === 'Student Project' && !isProject) return false;

      // 1. Text & Search Field Match
      const q = searchQuery.toLowerCase().trim();
      let matchQuery = true;
      if (q) {
        if (searchField === 'title') matchQuery = b.title.toLowerCase().includes(q);
        else if (searchField === 'author') matchQuery = b.author.toLowerCase().includes(q) || (b.studentNames || b.student_names || '').toLowerCase().includes(q);
        else if (searchField === 'course') matchQuery = (b.courseCode || b.course_code || '').toLowerCase().includes(q);
        else if (searchField === 'department') matchQuery = (b.department || b.department_name || '').toLowerCase().includes(q);
        else if (searchField === 'isbn') matchQuery = (b.isbn || '').toLowerCase().includes(q) || (b.issn || '').toLowerCase().includes(q);
        else if (searchField === 'subject') matchQuery = (b.subject || '').toLowerCase().includes(q);
        else if (searchField === 'call') matchQuery = (b.callNumber || '').toLowerCase().includes(q);
        else if (searchField === 'publisher') matchQuery = (b.publisher || '').toLowerCase().includes(q) || (b.journalName || b.journal_name || '').toLowerCase().includes(q);
        else {
          // All fields
          matchQuery = b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.studentNames || b.student_names || '').toLowerCase().includes(q) ||
            (b.studentMatric || b.student_matric || '').toLowerCase().includes(q) ||
            (b.supervisor || '').toLowerCase().includes(q) ||
            (b.journalName || b.journal_name || '').toLowerCase().includes(q) ||
            (b.problemStatement || '').toLowerCase().includes(q) ||
            (b.methodology || '').toLowerCase().includes(q) ||
            (b.isbn || '').includes(q) ||
            (b.issn || '').includes(q) ||
            (b.callNumber || '').toLowerCase().includes(q) ||
            (b.subject || '').toLowerCase().includes(q) ||
            (b.department || '').toLowerCase().includes(q) ||
            (b.courseCode || b.course_code || '').toLowerCase().includes(q) ||
            (b.targetLevel || b.target_level || '').toLowerCase().includes(q) ||
            (b.publisher || '').toLowerCase().includes(q) ||
            (b.abstract || '').toLowerCase().includes(q);
        }
      }

      // 2. Advanced Search Query Match
      if (showAdvancedSearch) {
        if (advSearch.title && !b.title.toLowerCase().includes(advSearch.title.toLowerCase())) return false;
        if (advSearch.author && !b.author.toLowerCase().includes(advSearch.author.toLowerCase())) return false;
        if (advSearch.subject && !(b.subject || '').toLowerCase().includes(advSearch.subject.toLowerCase())) return false;
        if (advSearch.isbn && !(b.isbn || '').includes(advSearch.isbn)) return false;
        if (advSearch.publisher && !(b.publisher || '').toLowerCase().includes(advSearch.publisher.toLowerCase())) return false;
        if (b.year) {
          const y = parseInt(b.year);
          if (y < parseInt(advSearch.yearFrom) || y > parseInt(advSearch.yearTo)) return false;
        }
      }

      // 3. Facets
      const matchSubject = facets.subject === 'All' || b.subject === facets.subject;
      const matchDepartment = facets.department === 'All' || b.department === facets.department;
      const matchFormat = facets.format === 'All' || (facets.format === 'Digital' ? b.isDigital : !b.isDigital);
      const matchAvail = facets.availability === 'All' || (facets.availability === 'Available' ? b.copiesAvailable > 0 : b.copiesAvailable === 0);

      return matchQuery && matchSubject && matchDepartment && matchFormat && matchAvail;
    });
  }, [books, searchQuery, searchField, showAdvancedSearch, advSearch, facets, resourceCategory]);

  // Reset page when search or facet changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchField, facets, advSearch, resourceCategory]);

  const bookCount = useMemo(() => books.filter(b => b.category !== 'Journal' && b.category !== 'Student Project' && !String(b.id || '').startsWith('TH-') && !String(b.resourceType || '').toLowerCase().includes('project') && !String(b.resourceType || '').toLowerCase().includes('journal')).length, [books]);
  const journalCount = useMemo(() => books.filter(b => b.category === 'Journal' || b.materialType === 'Journal' || Boolean(b.issn) || String(b.resourceType || '').toLowerCase().includes('journal')).length, [books]);
  const projectCount = useMemo(() => books.filter(b => b.category === 'Student Project' || b.materialType === 'Thesis' || b.materialType === 'Dissertation' || String(b.id || '').startsWith('TH-') || String(b.resourceType || '').toLowerCase().includes('project')).length, [books]);

  const totalResults = filteredBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  const displayedBooks = filteredBooks.slice(startIndex, endIndex);

  // E-Journals
  const eJournals = [
    { name: 'Nigerian Journal of Cooperative Economics', issn: '0794-5590', scope: 'Quarterly Peer-Reviewed', coverage: '2010 - 2026' },
    { name: 'West African Journal of Applied Information Systems', issn: '2141-2820', scope: 'Bi-Annual Open Access', coverage: '2014 - 2026' },
    { name: 'African Review of Agronomy and Extension Systems', issn: '1597-8842', scope: 'Peer-Reviewed TETFUND Funded', coverage: '2012 - 2026' },
    { name: 'Journal of Banking & Financial Market Dynamics', issn: '1119-7498', scope: 'NBTE Grade A Accredited', coverage: '2016 - 2026' }
  ];

  // Research Databases
  const academicDatabases = [
    { name: 'TETFUND Virtual Institute Repository', type: 'National Academic Consortia', desc: 'Millions of full-text papers, e-books & doctoral dissertations for Nigerian polytechnics and colleges.', icon: '🏛️' },
    { name: 'ScienceDirect / Elsevier Access', type: 'Scholarly Peer-Reviewed Index', desc: 'World premier platform for technical computer science, mathematics, and agricultural journals.', icon: '🔬' },
    { name: 'JSTOR Digital Archive', type: 'Digital Library Foundation', desc: 'Over 12 million academic journal articles, books, and primary sources in economics and management.', icon: '📚' },
    { name: 'AGORA / FAO Food & Agriculture Index', type: 'Global Agricultural Knowledge', desc: 'Free agricultural, forestry, fisheries and environmental science research collections.', icon: '🌽' },
    { name: 'Directory of Open Access Books (DOAB)', type: 'Open Monograph Database', desc: 'Over 80,000 academic peer-reviewed books available under open Creative Commons licenses.', icon: '🌐' },
    { name: 'HINARI / WHO Global Health Library', type: 'Biomedical & Social Sciences', desc: 'Global research in public health, rural development and nutrition.', icon: '🩺' }
  ];

  const handleAskSubmit = (e) => {
    e.preventDefault();
    sounds.playSuccessChime();
    setAskSubmitted(true);
    setTimeout(() => {
      setAskSubmitted(false);
      setShowAskLibrarianModal(false);
      setAskForm({ name: '', matricOrEmail: '', department: 'CEM', question: '' });
    }, 3000);
  };

  return (
    <div
      className="min-h-screen bg-[#021810] text-emerald-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-dock md:pb-0"
      style={{ backgroundImage: PATTERNS.opac }}
    >
      {/* 1. INSTITUTIONAL OPAC TOP HEADER & STREAMLINED NAV */}
      <header className="bg-[#032317]/95 backdrop-blur-md border-b border-emerald-800/60 sticky top-0 z-40 px-3 sm:px-5 py-2 shadow-xl">
        <div className="flex items-center justify-between gap-3 max-w-[1920px] mx-auto">
          {/* Logo & College Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#021810] border border-emerald-400/50 p-0.5 flex items-center justify-center shadow-md shadow-emerald-950 shrink-0 overflow-hidden">
              <img
                src="/assets/fcc-logo.png"
                alt="FCC Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="text-xs font-black text-white leading-none tracking-tight">{INSTITUTION.shortName}</div>
              <div className="text-[9.5px] text-emerald-400 font-mono font-medium">OPAC Discovery</div>
            </div>
          </div>

          {/* Mobile Right Action */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenLogin();
              }}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1 active:scale-95"
            >
              <span>Login</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Unified Compact Navigation Bar in Exact Sequence (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-[11px] overflow-x-auto scrollbar-none py-0.5">
            {/* 1. College Catalog */}
            <button
              onClick={() => {
                setActiveTab('home');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'home' || activeTab === 'catalog'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <BookOpen size={12} className={activeTab === 'home' || activeTab === 'catalog' ? 'text-white' : 'text-emerald-400'} />
              <span>College Catalog ({books.length})</span>
            </button>

            {/* 2. Federated Search (Live APIs) */}
            <button
              onClick={() => {
                setActiveTab('overlay');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'overlay'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Zap size={12} className={activeTab === 'overlay' ? 'text-white' : 'text-emerald-400'} />
              <span>Federated Search</span>
              <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${
                activeTab === 'overlay' ? 'bg-black/30 text-emerald-100' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                Live APIs
              </span>
            </button>

            {/* 3. Google Books */}
            <button
              onClick={() => {
                setActiveTab('google_books');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'google_books'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Sparkles size={12} className={activeTab === 'google_books' ? 'text-white' : 'text-emerald-400'} />
              <span>Google Books</span>
            </button>

            {/* 4. Open Library */}
            <button
              onClick={() => {
                setActiveTab('openlibrary');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'openlibrary'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Globe size={12} className={activeTab === 'openlibrary' ? 'text-white' : 'text-emerald-400'} />
              <span>Open Library</span>
            </button>

            {/* 5. Gutenberg */}
            <button
              onClick={() => {
                setActiveTab('gutenberg');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'gutenberg'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <BookMarked size={12} className={activeTab === 'gutenberg' ? 'text-white' : 'text-emerald-400'} />
              <span>Gutenberg</span>
            </button>

            {/* 6. Internet Archive */}
            <button
              onClick={() => {
                setActiveTab('archive');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'archive'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Library size={12} className={activeTab === 'archive' ? 'text-white' : 'text-emerald-400'} />
              <span>Internet Archive</span>
            </button>

            {/* 7. Partner Libraries (6) */}
            <button
              onClick={() => {
                setActiveTab('partner_libraries');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'partner_libraries'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Building size={12} className={activeTab === 'partner_libraries' ? 'text-white' : 'text-emerald-400'} />
              <span>Partner Libraries ({partnerLibraries.length})</span>
            </button>

            {/* 8. Serials & Repositories */}
            <button
              onClick={() => {
                setActiveTab('journals');
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'journals'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm shadow-emerald-950 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 border border-transparent'
              }`}
            >
              <Newspaper size={12} className={activeTab === 'journals' ? 'text-white' : 'text-emerald-400'} />
              <span>Serials & Repositories</span>
            </button>

            {/* 9. Self-Service Kiosk */}
            <button
              onClick={() => {
                sounds.playClick();
                navigateTo('/kiosk');
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-700/60 text-teal-300 hover:text-white hover:bg-teal-900/60 text-[11px] font-semibold transition shrink-0 flex items-center gap-1 shadow-sm"
              title="Launch Self-Service Checkout / Return Kiosk"
            >
              <Scan size={12} className="text-teal-400" />
              <span>Self-Service Kiosk</span>
            </button>

            {/* 10. Ask a Librarian */}
            <button
              onClick={() => {
                sounds.playClick();
                setShowAskLibrarianModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#021810] border border-emerald-800/80 text-emerald-300 hover:text-white hover:border-emerald-600 text-[11px] font-semibold transition shrink-0 flex items-center gap-1"
            >
              <HelpCircle size={12} className="text-emerald-400" />
              <span>Ask a Librarian</span>
            </button>

            {/* 11. Student / Staff Login */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenLogin();
              }}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950 flex items-center gap-1 transition shrink-0 border border-emerald-400/40 active:scale-95"
            >
              <span>Student / Staff Login</span>
              <ArrowRight size={12} />
            </button>
          </nav>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION DOCK FOR PUBLIC OPAC */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 mobile-nav-dock pb-safe px-2 py-1.5 flex items-center justify-around select-none">
        {[
          { id: 'home', label: 'Catalog', icon: BookOpen },
          { id: 'overlay', label: 'Federated', icon: Zap },
          { id: 'google_books', label: 'Google', icon: Sparkles },
          { id: 'openlibrary', label: 'Open Lib', icon: Globe },
          { id: 'login', label: 'Sign In', icon: ArrowRight, isLogin: true }
        ].map(item => {
          const Icon = item.icon;
          const isActive = !item.isLogin && (activeTab === item.id || (item.id === 'home' && activeTab === 'catalog'));
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playClick();
                if (item.isLogin) {
                  onOpenLogin();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all relative ${
                isActive ? 'text-white font-bold' : 'text-emerald-300/70 hover:text-emerald-100'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-emerald-600/30 rounded-2xl border border-emerald-500/40 tab-active-glow" />
              )}
              <div className="relative z-10">
                <Icon size={19} className={isActive ? 'text-emerald-400 scale-110' : ''} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight relative z-10 ${
                isActive ? 'text-emerald-200 font-bold' : 'text-emerald-300/70'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-10">
        
        {/* VIEW 1: PARTNER LIBRARIES GATEWAY */}
        {activeTab === 'partner_libraries' && (
          <PartnerLibrariesGateway partnerLibraries={partnerLibraries} />
        )}

        {/* VIEW 2: E-JOURNALS PORTAL */}
        {activeTab === 'journals' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-2xl space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono font-bold">
                PEER-REVIEWED PERIODICALS & SERIALS
              </span>
              <h2 className="text-2xl font-black text-white">Electronic Academic Journals Directory</h2>
              <p className="text-xs text-emerald-300/80">
                Browse official peer-reviewed serials, journal articles, and periodicity archives affiliated with the college.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eJournals.map((j, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 transition space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#021810] text-emerald-300 border border-emerald-900 font-bold">
                      ISSN: {j.issn}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">{j.coverage}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{j.name}</h3>
                  <div className="flex justify-between items-center text-xs text-emerald-300 pt-2 border-t border-emerald-900/60">
                    <span>{j.scope}</span>
                    <button
                      onClick={() => {
                        setSearchQuery(j.name);
                        setActiveTab('catalog');
                      }}
                      className="text-emerald-400 hover:text-emerald-200 underline font-semibold flex items-center gap-1"
                    >
                      Browse Articles <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: RESEARCH DATABASES GATEWAY */}
        {activeTab === 'databases' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-2xl space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono font-bold">
                FEDERATED SCHOLARLY REPOSITORIES
              </span>
              <h2 className="text-2xl font-black text-white">Institutional Subscribed & Open Databases</h2>
              <p className="text-xs text-emerald-300/80">
                Direct gateways to millions of global research papers, TETFUND archives, and citation indices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {academicDatabases.map((db, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-2xl">{db.icon}</div>
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{db.type}</div>
                    <h3 className="text-base font-bold text-white">{db.name}</h3>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">{db.desc}</p>
                  </div>
                  <button
                    onClick={() => alert(`Connecting to ${db.name} via Institutional Proxy...`)}
                    className="w-full py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <span>Access Database Gateway</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: INSTITUTIONAL REPOSITORY */}
        {activeTab === 'repository' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-2xl space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono font-bold">
                DIGITAL COMMONS & THESES ARCHIVE
              </span>
              <h2 className="text-2xl font-black text-white">FCC Institutional Repository & Capstone Collection</h2>
              <p className="text-xs text-emerald-300/80">
                Preserved dissertations, ND/HND final year projects, and faculty monographs published under open access.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Appraisal of Micro-Credit Disbursement in Agrarian Cooperatives', author: 'Adeyemi & Ogundipe (2024)', dept: 'Cooperative Economics', type: 'HND Dissertation' },
                { title: 'Automated Loan Default Prediction with Machine Learning', author: 'Babatunde & Olanrewaju (2024)', dept: 'Computer Science', type: 'Capstone Software Project' },
                { title: 'Post-Harvest Losses Mitigation in Cocoa Farming Communities', author: 'Dr. Funmilayo Alabi (2023)', dept: 'Agricultural Science', type: 'Faculty Research Monograph' }
              ].map((th, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#032317] border border-emerald-800/80 space-y-2.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                    {th.type}
                  </span>
                  <h4 className="text-sm font-bold text-white">{th.title}</h4>
                  <div className="text-xs text-emerald-300">{th.author} • <span className="font-semibold">{th.dept}</span></div>
                  <button
                    onClick={() => alert(`Accessing repository full-text for: ${th.title}`)}
                    className="pt-2 text-xs text-emerald-400 hover:text-white font-bold underline flex items-center gap-1"
                  >
                    <span>View Repository PDF & Abstract</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: DISCOVERY HOME & CATALOG */}
        {(activeTab === 'home' || activeTab === 'catalog') && (
          <>
            {/* HERO SEARCH WITH MODERN INSTITUTIONAL BRANDING */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#063b27] via-[#04281c] to-[#021810] border-2 border-emerald-600/40 p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Federal Cooperative College, Ibadan • Directorate of Library Services</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Library Catalog & Digital Knowledge Discovery
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                  Search campus physical volumes, access digital e-textbooks and dissertations, or query global open academic repositories with live stack availability.
                </p>
              </div>

              {/* SEARCH BAR WITH MULTI-FIELD SELECTOR & AUTOCOMPLETE */}
              <div className="relative z-20 space-y-3">
                
                {/* REPOSITORY SOURCE SELECTOR */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mr-1">Search Target:</span>
                  {[
                    { id: 'stacks', label: `College Stacks (${books.length})`, icon: BookOpen, badge: 'On-Campus' },
                    { id: 'all', label: 'All Sources (Federated)', icon: Sparkles, badge: 'Multi-API' },
                    { id: 'google_books', label: 'Google Books', icon: Sparkles, badge: 'Previews' },
                    { id: 'openlibrary', label: 'Open Library', icon: Globe, badge: '30M+ Items' },
                    { id: 'gutenberg', label: 'Project Gutenberg', icon: BookMarked, badge: '70k+ E-Books' },
                    { id: 'archive', label: 'Internet Archive', icon: Library, badge: 'Full Books' },
                    { id: 'trove', label: 'Trove Archives', icon: Library, badge: 'National' }
                  ].map(src => {
                    const Icon = src.icon;
                    const isSelected = searchTarget === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => {
                          setSearchTarget(src.id);
                          sounds.playClick();
                          if (src.id === 'google_books') setActiveTab('google_books');
                          else if (src.id === 'openlibrary') setActiveTab('openlibrary');
                          else if (src.id === 'gutenberg') setActiveTab('gutenberg');
                          else if (src.id === 'archive') setActiveTab('archive');
                          else if (src.id === 'trove') setActiveTab('trove');
                          else if (src.id === 'stacks') setActiveTab('catalog');
                          else {
                            setActiveTab('home');
                            if (searchQuery) fetchLiveExternalResources(searchQuery);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950 ring-1 ring-emerald-400'
                            : 'bg-[#021810] text-emerald-300/80 border border-emerald-800/80 hover:border-emerald-600 hover:text-white'
                        }`}
                      >
                        <Icon size={13} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                        <span>{src.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected 
                            ? 'bg-black/30 text-emerald-100' 
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        }`}>
                          {src.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 bg-[#01140d]/90 p-2 rounded-2xl border border-emerald-700/60 shadow-2xl">
                  
                  {/* Field Selector */}
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="px-3 py-3 rounded-xl bg-[#032317] border border-emerald-800 text-emerald-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="all">All Fields</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="isbn">ISBN / ISSN</option>
                    <option value="subject">Subject</option>
                    <option value="call">Call Number</option>
                    <option value="publisher">Publisher</option>
                    <option value="doi">DOI</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-3.5 text-emerald-400" />
                    <input
                      type="text"
                      id="input-global-library-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePerformSearch(e);
                      }}
                      placeholder="Search title, author, keyword, ISBN (e.g. 978-0198826729), Call Number (HD 2963)..."
                      className="w-full bg-[#021810] border border-emerald-800/80 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-emerald-500/60 focus:outline-none focus:border-emerald-400 font-medium transition"
                    />

                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setLiveOpenLibraryResults([]);
                          setLiveGutenbergResults([]);
                          setHasQueriedLiveApi(false);
                        }}
                        className="absolute right-3 top-3 text-emerald-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handlePerformSearch}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition hover:scale-102 active:scale-98"
                  >
                    <Search size={15} />
                    <span>
                      {searchTarget === 'openlibrary'
                        ? 'Search Open Library'
                        : searchTarget === 'gutenberg'
                        ? 'Search Gutenberg'
                        : searchTarget === 'trove'
                        ? 'Search Trove Base'
                        : 'Search Stacks & APIs'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className={`px-3 py-3 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                      showAdvancedSearch
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-[#032317] text-emerald-400 border-emerald-800 hover:text-white'
                    }`}
                  >
                    <Sliders size={14} />
                    <span className="hidden sm:inline">Advanced</span>
                  </button>
                </div>

                {/* QUICK TOPIC & FORMAT FILTERS */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-[11px] font-semibold text-emerald-400 mr-1 flex items-center gap-1">
                    <Filter size={12} /> Quick Filters:
                  </span>
                  {['All', 'Co-operative Economics', 'Computer Science', 'Banking & Finance', 'Agricultural Extension'].map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setFacets(prev => ({ ...prev, subject: sub }));
                        sounds.playClick();
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        facets.subject === sub
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'bg-[#021810] text-emerald-300/80 border border-emerald-800/80 hover:text-white hover:border-emerald-600'
                      }`}
                    >
                      {sub === 'All' ? `All Subjects (${books.length})` : sub}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFacets(prev => ({ ...prev, format: prev.format === 'Digital' ? 'All' : 'Digital' }));
                      sounds.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                      facets.format === 'Digital'
                        ? 'bg-teal-600 text-white font-bold shadow'
                        : 'bg-[#021810] text-teal-300 border border-teal-800/80 hover:text-white hover:border-teal-600'
                    }`}
                  >
                    <span>⚡ E-Books Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFacets(prev => ({ ...prev, availability: prev.availability === 'Available' ? 'All' : 'Available' }));
                      sounds.playClick();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                      facets.availability === 'Available'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                        : 'bg-[#021810] text-emerald-300 border border-emerald-800/80 hover:text-white hover:border-emerald-600'
                    }`}
                  >
                    <span>✓ Available in Stacks</span>
                  </button>
                </div>

                {/* SEARCH INTELLIGENCE BADGES & "DID YOU MEAN?" */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {didYouMeanSuggestion && (
                    <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs flex items-center gap-1.5 animate-fadeIn">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Did you mean:</span>
                      <button
                        onClick={() => setSearchQuery(didYouMeanSuggestion)}
                        className="font-bold underline text-amber-300 hover:text-white"
                      >
                        {didYouMeanSuggestion}
                      </button>
                      <span>?</span>
                    </div>
                  )}

                  {activeDetectedBadge?.type === 'isbn' && (
                    <div className="p-1.5 px-3 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-1 font-mono">
                      <Tag size={13} />
                      <span>Recognized ISBN: <strong className="text-white">{activeDetectedBadge.value}</strong></span>
                    </div>
                  )}

                  {activeDetectedBadge?.type === 'doi' && (
                    <div className="p-1.5 px-3 rounded-xl bg-teal-950 border border-teal-600 text-teal-300 text-xs flex items-center gap-1 font-mono">
                      <ExternalLink size={13} />
                      <span>DOI Auto-Resolver Active: <strong className="text-white">{activeDetectedBadge.value}</strong></span>
                    </div>
                  )}

                  {activeDetectedBadge?.type === 'synonym' && (
                    <div className="p-1.5 px-3 rounded-xl bg-indigo-950 border border-indigo-600 text-indigo-300 text-xs flex items-center gap-1 font-mono">
                      <Layers size={13} />
                      <span>Synonym Linked: <strong className="text-white">{activeDetectedBadge.target}</strong></span>
                    </div>
                  )}
                </div>

                {/* AUTOCOMPLETE POPUP DROPDOWN */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#032317] border border-emerald-700 rounded-2xl shadow-2xl overflow-hidden p-2 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-mono text-emerald-400 uppercase tracking-wider border-b border-emerald-800/80">
                      Suggested Matches
                    </div>
                    {autocompleteSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.text);
                          setShowAutocomplete(false);
                          if (item.book) onSelectBook(item.book);
                        }}
                        className="px-3 py-2 rounded-xl hover:bg-[#021810] cursor-pointer flex items-center justify-between text-xs transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                            {item.type}
                          </span>
                          <span className="font-semibold text-white">{item.text}</span>
                        </div>
                        <span className="text-[11px] text-emerald-400/70">{item.book.callNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADVANCED SEARCH PANEL (ACCORDION) */}
              {showAdvancedSearch && (
                <div className="mt-4 p-5 rounded-2xl bg-[#01140d]/95 border border-emerald-700/80 shadow-2xl space-y-4 animate-scaleUp text-xs">
                  <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <Sliders size={16} className="text-emerald-400" />
                      <span>Structured Advanced Bibliographic Search</span>
                    </span>
                    <button
                      onClick={() => setShowAdvancedSearch(false)}
                      className="text-emerald-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Title</label>
                      <input
                        type="text"
                        value={advSearch.title}
                        onChange={e => setAdvSearch({ ...advSearch, title: e.target.value })}
                        placeholder="Search full or partial title..."
                        className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Author</label>
                      <input
                        type="text"
                        value={advSearch.author}
                        onChange={e => setAdvSearch({ ...advSearch, author: e.target.value })}
                        placeholder="e.g. Adebayo, Smith, Olaluwoye"
                        className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Subject</label>
                      <input
                        type="text"
                        value={advSearch.subject}
                        onChange={e => setAdvSearch({ ...advSearch, subject: e.target.value })}
                        placeholder="e.g. Microcredit, Econometrics"
                        className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">ISBN / ISSN</label>
                      <input
                        type="text"
                        value={advSearch.isbn}
                        onChange={e => setAdvSearch({ ...advSearch, isbn: e.target.value })}
                        placeholder="e.g. 978-0198826729"
                        className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Publisher</label>
                      <input
                        type="text"
                        value={advSearch.publisher}
                        onChange={e => setAdvSearch({ ...advSearch, publisher: e.target.value })}
                        placeholder="e.g. Oxford, Pearson, Spectrum"
                        className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-300 font-semibold mb-1">Publication Year Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={advSearch.yearFrom}
                          onChange={e => setAdvSearch({ ...advSearch, yearFrom: e.target.value })}
                          className="w-1/2 px-2 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs font-mono"
                          placeholder="From"
                        />
                        <span className="text-emerald-500">-</span>
                        <input
                          type="number"
                          value={advSearch.yearTo}
                          onChange={e => setAdvSearch({ ...advSearch, yearTo: e.target.value })}
                          className="w-1/2 px-2 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs font-mono"
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Material Type Checkboxes */}
                  <div className="space-y-1.5 pt-2 border-t border-emerald-900/60">
                    <span className="font-semibold text-emerald-300 block">Material Types:</span>
                    <div className="flex flex-wrap gap-3">
                      {['Book', 'Journal', 'Thesis', 'Dissertation', 'eBook', 'Video', 'Audio', 'Newspaper', 'Conference Paper'].map(m => (
                        <label key={m} className="flex items-center gap-1.5 text-xs text-emerald-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={advSearch.materialTypes[m] || false}
                            onChange={(e) => setAdvSearch({
                              ...advSearch,
                              materialTypes: { ...advSearch.materialTypes, [m]: e.target.checked }
                            })}
                            className="rounded border-emerald-700 text-emerald-600 focus:ring-emerald-500 bg-[#021810]"
                          />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability Checkboxes */}
                  <div className="space-y-1.5 pt-2 border-t border-emerald-900/60">
                    <span className="font-semibold text-emerald-300 block">Holding Availability:</span>
                    <div className="flex flex-wrap gap-3">
                      {['Available in Stacks', 'Checked Out', 'Electronic Digital Access', 'Reference Only'].map(a => (
                        <label key={a} className="flex items-center gap-1.5 text-xs text-emerald-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={advSearch.availability[a] || false}
                            onChange={(e) => setAdvSearch({
                              ...advSearch,
                              availability: { ...advSearch.availability, [a]: e.target.checked }
                            })}
                            className="rounded border-emerald-700 text-emerald-600 focus:ring-emerald-500 bg-[#021810]"
                          />
                          <span>{a}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdvSearch({
                          title: '', author: '', subject: '', isbn: '', publisher: '',
                          yearFrom: '2015', yearTo: '2026',
                          materialTypes: { Book: true, eBook: true },
                          availability: { Available: true, Electronic: true }
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#021810] text-emerald-400 hover:text-white border border-emerald-800"
                    >
                      Reset Criteria
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('catalog');
                        setShowAdvancedSearch(false);
                      }}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                    >
                      Apply Search Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CATALOG SEARCH RESULTS / BROWSE STACKS */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#032317] to-[#021810] border border-emerald-800 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-base tracking-tight">Institutional Catalog Holdings</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                        {books.length === 0 ? 'Awaiting Uploads (0 titles)' : `${filteredBooks.length} ${filteredBooks.length === 1 ? 'title' : 'titles'} matched`}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400/80 font-mono">
                      {books.length === 0 ? 'Verified live SQLite catalog • Ready for Admin & HOD submissions' : 'Physical stacks & digital e-textbooks verified against SQLite catalog'}
                    </p>
                  </div>
                </div>

                {/* View Controls & Reset Filter */}
                <div className="flex items-center gap-2 text-xs">
                  {(searchQuery || facets.subject !== 'All' || facets.format !== 'All' || facets.availability !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFacets({ subject: 'All', department: 'All', format: 'All', availability: 'All', yearRange: 'All', language: 'All' });
                        setShowAdvancedSearch(false);
                        sounds.playClick();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <X size={13} />
                      <span>Reset Filters</span>
                    </button>
                  )}
                  <span className="text-[11px] text-emerald-400/70 font-mono hidden sm:inline">Page {currentPage} of {totalPages}</span>
                </div>
              </div>

              {/* Category Filter Pills (Books, Journals, Student Projects) */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#021810] border border-emerald-800/80">
                {[
                  { id: 'All', label: 'All Holdings', icon: Layers, count: books.length },
                  { id: 'Book', label: 'Books & Monograms', icon: BookOpen, count: bookCount },
                  { id: 'Journal', label: 'Academic Journals', icon: Newspaper, count: journalCount },
                  { id: 'Student Project', label: 'Student Projects & Theses', icon: Award, count: projectCount }
                ].map(cat => {
                  const Icon = cat.icon;
                  const isActive = resourceCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setResourceCategory(cat.id);
                        sounds.playClick();
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-400'
                          : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-400'} />
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-black/30 text-emerald-100' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* BOOK CARDS GRID */}
              {displayedBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayedBooks.map((b) => {
                    const isProject = b.category === 'Student Project' || b.materialType === 'Thesis' || b.materialType === 'Dissertation' || (b.id && String(b.id).startsWith('TH-')) || (b.resourceType && String(b.resourceType).toLowerCase().includes('project'));
                    const isJournal = b.category === 'Journal' || b.materialType === 'Journal' || Boolean(b.issn) || (b.resourceType && String(b.resourceType).toLowerCase().includes('journal'));

                    const deptLower = (b.department || '').toLowerCase();
                    const isCS = deptLower.includes('computer') || deptLower.includes('technology');
                    const isBank = deptLower.includes('bank') || deptLower.includes('finance');
                    const isAgric = deptLower.includes('agric');

                    const coverGradient = isProject
                      ? 'from-amber-950 via-slate-900 to-[#021810] border-amber-600/40'
                      : isJournal
                      ? 'from-teal-950 via-slate-900 to-[#021810] border-teal-600/40'
                      : isCS
                      ? 'from-sky-950 via-slate-900 to-[#021810] border-sky-600/40'
                      : isBank
                      ? 'from-purple-950 via-slate-900 to-[#021810] border-purple-600/40'
                      : isAgric
                      ? 'from-lime-950 via-emerald-950 to-[#021810] border-lime-600/40'
                      : 'from-emerald-900 via-teal-950 to-[#021810] border-emerald-600/40';

                    const deptBadgeColor = isProject
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : isJournal
                      ? 'bg-teal-950 text-teal-300 border-teal-700'
                      : isCS
                      ? 'bg-sky-950 text-sky-300 border-sky-700'
                      : isBank
                      ? 'bg-purple-950 text-purple-300 border-purple-700'
                      : isAgric
                      ? 'bg-lime-950 text-lime-300 border-lime-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700';

                    const isSaved = savedBooks.includes(b.id);
                    const isAvailable = (b.copiesAvailable || 0) > 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBook(b)}
                        className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-400/90 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-emerald-950 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          {/* Top Badges & Bookmark */}
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800 truncate">
                                {b.callNumber || 'STACK ITEM'}
                              </span>
                              {isProject ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[9.5px] font-bold border border-amber-700/80 flex items-center gap-1 shrink-0">
                                  🎓 Project
                                </span>
                              ) : isJournal ? (
                                <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 text-[9.5px] font-bold border border-teal-700/80 flex items-center gap-1 shrink-0">
                                  📰 Journal
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9.5px] font-bold border border-emerald-700/80 flex items-center gap-1 shrink-0">
                                  📚 Book
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleToggleSaveBook(b.id, e)}
                              className="p-1 rounded-lg hover:bg-[#021810] text-emerald-400 hover:text-white transition shrink-0"
                              title={isSaved ? "Remove from saved books" : "Bookmark this title"}
                            >
                              <Bookmark size={15} className={isSaved ? 'fill-amber-400 text-amber-400' : ''} />
                            </button>
                          </div>

                          {/* Hardcover Styled Preview */}
                          <div className={`w-full h-40 rounded-xl bg-gradient-to-br ${coverGradient} border p-3.5 flex flex-col justify-between font-serif relative overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-300`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${deptBadgeColor}`}>
                                {isProject ? 'CAPSTONE PROJECT' : isJournal ? 'PEER-REVIEWED' : (b.courseCode || b.department || 'FCC IBADAN')}
                              </span>
                              {b.year && (
                                <span className="text-[10px] font-mono text-emerald-400/80">{b.year}</span>
                              )}
                            </div>

                            <div className="my-auto py-1">
                              <h4 className="text-xs sm:text-sm font-black text-white line-clamp-3 leading-snug group-hover:text-emerald-200 transition">
                                {b.title}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-emerald-800/40 text-[10px] font-mono text-emerald-300/80">
                              <span className="truncate max-w-[130px]">{b.studentNames || b.student_names || b.author}</span>
                              <span className="shrink-0">{b.isDigital ? '⚡ Digital (PDF)' : 'Physical'}</span>
                            </div>
                          </div>

                          {/* Metadata Details */}
                          <div>
                            <h3 className="font-bold text-white text-xs line-clamp-2 group-hover:text-emerald-300 transition leading-snug">
                              {b.title}
                            </h3>
                            {isProject ? (
                              <div className="mt-1 space-y-0.5 text-[11px] text-emerald-300/80">
                                <p className="truncate">
                                  Researcher:{' '}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSearchField('author');
                                      setSearchQuery(b.studentNames || b.student_names || b.author || '');
                                      sounds.playClick();
                                    }}
                                    className="text-emerald-200 font-semibold hover:underline hover:text-emerald-100 transition"
                                    title="Search by this researcher"
                                  >
                                    {b.studentNames || b.student_names || b.author}
                                  </button>
                                </p>
                                {b.supervisor && (
                                  <p className="truncate text-[10px] text-emerald-400/80">
                                    Supervisor:{' '}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchField('author');
                                        setSearchQuery(b.supervisor);
                                        sounds.playClick();
                                      }}
                                      className="hover:underline transition"
                                      title="Search by supervisor"
                                    >
                                      {b.supervisor}
                                    </button>
                                  </p>
                                )}
                              </div>
                            ) : isJournal ? (
                              <div className="mt-1 space-y-0.5 text-[11px] text-emerald-300/80">
                                <p className="truncate">Journal: <span className="text-emerald-200 font-semibold">{b.journalName || b.journal_name || b.publisher}</span></p>
                                {b.issn && <p className="truncate text-[10px] font-mono text-teal-300/80">ISSN: {b.issn}</p>}
                              </div>
                            ) : (
                              <p className="text-[11px] text-emerald-300/80 truncate mt-1">
                                By{' '}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchField('author');
                                    setSearchQuery(b.author || '');
                                    sounds.playClick();
                                  }}
                                  className="text-emerald-200 font-medium hover:underline hover:text-emerald-100 transition"
                                  title={`Search by author: ${b.author}`}
                                >
                                  {b.author}
                                </button>
                              </p>
                            )}
                            {b.shelfLocation && (
                              <p className="text-[10px] font-mono text-emerald-400/70 truncate mt-0.5">
                                📍 {b.shelfLocation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Bottom Status & Direct Action */}
                        <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[11px] mt-3 gap-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`w-2 h-2 rounded-full ${
                              b.isDigital ? 'bg-teal-400 animate-pulse' : (isAvailable ? 'bg-emerald-400' : 'bg-rose-400')
                            }`}></span>
                            <span className={`font-bold ${
                              b.isDigital ? 'text-teal-300' : (isAvailable ? 'text-emerald-400' : 'text-rose-400')
                            }`}>
                              {b.isDigital ? 'Digital PDF' : (isAvailable ? `${b.copiesAvailable} in Stacks` : 'On Loan')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {(b.isDigital || b.fileDataUrl || b.file_data_url) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectBook(b);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 text-[10px] shadow transition"
                              >
                                <BookOpen size={11} /> {isProject ? 'Preview' : isJournal ? 'Read Article' : 'Read'}
                              </button>
                            )}
                            <span className="text-emerald-400 group-hover:translate-x-1 transition font-bold flex items-center gap-0.5 text-[11px]">
                              Details <ChevronRight size={13} />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-16 px-6 rounded-3xl bg-gradient-to-b from-[#032317] to-[#01140d] border border-emerald-800/80 shadow-2xl space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                    <Library size={32} />
                  </div>
                  <div className="space-y-2 max-w-lg mx-auto">
                    <h3 className="text-lg font-black text-white tracking-tight">Institutional Catalog Awaiting Faculty Uploads</h3>
                    <p className="text-xs text-emerald-300/80 leading-relaxed font-normal">
                      The catalog is connected to the backend SQLite database. All mock demo records have been cleared. Books and course texts uploaded by <span className="text-emerald-200 font-semibold">Central Library Administrators</span> or submitted by <span className="text-emerald-200 font-semibold">Heads of Department (HODs)</span> will be indexed here live.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (onOpenLogin) onOpenLogin();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg flex items-center gap-2 transition"
                    >
                      <Building2 size={14} />
                      <span>Staff & HOD Portal Login</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab('openlibrary');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#021810] hover:bg-[#042d1f] border border-emerald-700/70 text-emerald-300 text-xs font-bold transition flex items-center gap-2"
                    >
                      <Globe size={14} />
                      <span>Search Open Library & Global Archives</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 p-6 rounded-3xl bg-[#032317] border border-emerald-800 space-y-3">
                  <AlertCircle size={36} className="text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">No catalog resources match your query.</h3>
                  <p className="text-xs text-emerald-400/80 max-w-sm mx-auto">
                    Try broader keywords, searching by author or ISBN, or reset specific filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFacets({ subject: 'All', department: 'All', format: 'All', availability: 'All', yearRange: 'All', language: 'All' });
                      setShowAdvancedSearch(false);
                      sounds.playClick();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* PAGINATION TOOLBAR */}
              {totalResults > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 shadow-md">
                  <div className="flex items-center gap-3 text-xs text-emerald-300">
                    <span>
                      Showing <strong className="text-white font-mono">{startIndex + 1}</strong> to <strong className="text-white font-mono">{endIndex}</strong> of <strong className="text-white font-mono">{totalResults}</strong> catalogue records
                    </span>

                    <div className="flex items-center gap-1.5 ml-2 border-l border-emerald-800/80 pl-3">
                      <span className="text-emerald-400/80">Page Size:</span>
                      {[20, 50, 100].map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                            sounds.playClick();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                            pageSize === size
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-[#021810] text-emerald-300 border border-emerald-800 hover:bg-emerald-900/40'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Navigation Controls */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          sounds.playClick();
                        }
                      }}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-xl bg-[#021810] text-emerald-300 border border-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-900/40 transition font-bold"
                    >
                      ← Previous
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            sounds.playClick();
                          }}
                          className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                            currentPage === pageNum
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-[#021810] text-emerald-300 border border-emerald-800 hover:bg-emerald-900/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          sounds.playClick();
                        }
                      }}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-xl bg-[#021810] text-emerald-300 border border-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-900/40 transition font-bold"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── LIVE FEDERATED GLOBAL REPOSITORIES SECTION (No Login Required) ─── */}
            {(liveFederatedLoading || liveOpenLibraryResults.length > 0 || liveGutenbergResults.length > 0 || hasQueriedLiveApi) && (
              <div className="space-y-6 p-6 rounded-3xl bg-gradient-to-br from-[#021c13] to-[#01140d] border border-emerald-600/50 shadow-2xl relative overflow-hidden animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white">Live Global Repositories (Public Access)</h2>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-[10px] font-bold">
                          No Login Required
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/80 mt-0.5">
                        Real-time live federated query results across Open Library and Project Gutenberg APIs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('openlibrary')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Globe size={13} /> Full Open Library (30M+)
                    </button>
                    <button
                      onClick={() => setActiveTab('gutenberg')}
                      className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <BookMarked size={13} /> Full Gutenberg (70K+)
                    </button>
                  </div>
                </div>

                {liveFederatedLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-emerald-300">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-xs font-bold tracking-wide">Fetching live records from Open Library & Gutenberg APIs...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Google Books Recommended Live Grid */}
                    {liveGoogleBooksResults.length > 0 && (
                      <div className="space-y-3 pb-2 border-b border-amber-500/30">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-400 animate-pulse" />
                            <span>Google Books Curated Previews (FCC Recommended)</span>
                          </span>
                          <button
                            onClick={() => setActiveTab('google_books')}
                            className="text-amber-400 hover:text-white underline font-semibold flex items-center gap-1"
                          >
                            Explore in Google Books Viewer <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {liveGoogleBooksResults.map((item, idx) => {
                            const authors = Array.isArray(item.authors) ? item.authors.join(', ') : item.authors;
                            return (
                              <div key={idx} className="p-3.5 rounded-2xl bg-gradient-to-b from-[#032317] to-[#021810] border border-amber-500/40 hover:border-amber-400 transition flex gap-3 group shadow-lg">
                                <div className="w-16 h-22 bg-[#021810] rounded-lg shrink-0 overflow-hidden border border-amber-900/60 flex items-center justify-center relative">
                                  {item.thumbnail_url ? (
                                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <BookOpen size={20} className="text-amber-600" />
                                  )}
                                  <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[7px] uppercase">
                                    REC
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono text-[9px] border border-amber-800">
                                        Google Books
                                      </span>
                                      {item.published_date && (
                                        <span className="text-[10px] text-emerald-400 font-mono">
                                          {item.published_date.slice(0, 4)}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-200">
                                      {item.title}
                                    </h4>
                                    <p className="text-[11px] text-emerald-300/80 truncate mt-0.5">
                                      {authors || 'Academic Author'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2">
                                    <button
                                      onClick={() => setActiveTab('google_books')}
                                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 rounded-lg text-[10px] font-black shadow flex items-center gap-1 transition"
                                    >
                                      <BookOpen size={11} /> Read Preview
                                    </button>
                                    {item.preview_link && (
                                      <button
                                        onClick={() => window.open(item.preview_link, '_blank')}
                                        className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60"
                                        title="Open on Google Books Website"
                                      >
                                        <ExternalLink size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Open Library Live Grid */}
                    {liveOpenLibraryResults.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <Globe size={14} className="text-emerald-400" />
                            <span>Open Library World Catalog Matches</span>
                          </span>
                          <button
                            onClick={() => setActiveTab('openlibrary')}
                            className="text-emerald-400 hover:text-white underline font-semibold flex items-center gap-1"
                          >
                            Explore all in Open Library <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {liveOpenLibraryResults.map((item, idx) => {
                            const coverUrl = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null;
                            const iaId = item.ia && item.ia[0];
                            const readUrl = iaId ? `https://archive.org/details/${iaId}?view=theater&ui=embed` : `https://openlibrary.org${item.key}`;
                            return (
                              <div key={idx} className="p-3.5 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 transition flex gap-3 group">
                                <div className="w-16 h-22 bg-[#021810] rounded-lg shrink-0 overflow-hidden border border-emerald-900 flex items-center justify-center">
                                  {coverUrl ? (
                                    <img src={coverUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <BookOpen size={20} className="text-emerald-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono text-[9px] border border-emerald-800">
                                        Open Library
                                      </span>
                                      {item.first_publish_year && (
                                        <span className="text-[10px] text-emerald-500 font-mono">
                                          {item.first_publish_year}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-300">
                                      {item.title}
                                    </h4>
                                    <p className="text-[11px] text-emerald-400/80 truncate mt-0.5">
                                      {item.author_name ? item.author_name.join(', ') : 'Unknown Author'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                                    <button
                                      onClick={() => setActiveLiveReader({
                                        url: readUrl,
                                        directUrl: iaId ? `https://archive.org/details/${iaId}` : `https://openlibrary.org${item.key}`,
                                        title: item.title,
                                        source: 'Open Library'
                                      })}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition"
                                    >
                                      <Eye size={11} /> Read Preview
                                    </button>
                                    {iaId && (
                                      <button
                                        onClick={() => window.open(`https://archive.org/details/${iaId}`, '_blank', 'noopener,noreferrer')}
                                        className="px-2.5 py-1 bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition"
                                        title="Borrow all pages on Archive.org (unlimited loan, all pages)"
                                      >
                                        <ExternalLink size={10} /> Full Borrow
                                      </button>
                                    )}
                                    <button
                                      onClick={() => window.open(`https://openlibrary.org${item.key}`, '_blank')}
                                      className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60"
                                      title="Open in OpenLibrary.org"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Gutenberg Live Grid */}
                    {liveGutenbergResults.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-emerald-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <BookMarked size={14} className="text-amber-400" />
                            <span>Project Gutenberg Full-Text E-Books</span>
                          </span>
                          <button
                            onClick={() => setActiveTab('gutenberg')}
                            className="text-amber-400 hover:text-white underline font-semibold flex items-center gap-1"
                          >
                            Explore all in Gutenberg <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {liveGutenbergResults.map((item, idx) => {
                            const coverUrl = item.formats && item.formats['image/jpeg'] ? item.formats['image/jpeg'] : null;
                            const htmlKey = item.formats && Object.keys(item.formats).find(k => k.startsWith('text/html'));
                            const readUrl = htmlKey ? item.formats[htmlKey] : `https://www.gutenberg.org/ebooks/${item.id}`;
                            const authors = item.authors && item.authors.map(a => a.name).join('; ');
                            return (
                              <div key={idx} className="p-3.5 rounded-2xl bg-[#032317] border border-amber-800/40 hover:border-amber-600/60 transition flex gap-3 group">
                                <div className="w-16 h-22 bg-[#021810] rounded-lg shrink-0 overflow-hidden border border-amber-900/50 flex items-center justify-center">
                                  {coverUrl ? (
                                    <img src={coverUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <BookMarked size={20} className="text-amber-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-mono text-[9px] border border-amber-800/60">
                                        Gutenberg
                                      </span>
                                      <span className="text-[10px] text-amber-500 font-mono">
                                        ID #{item.id}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300">
                                      {item.title}
                                    </h4>
                                    <p className="text-[11px] text-amber-300/80 truncate mt-0.5">
                                      {authors || 'Public Domain Author'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2">
                                    <button
                                      onClick={() => setActiveLiveReader({
                                        url: readUrl,
                                        directUrl: `https://www.gutenberg.org/ebooks/${item.id}`,
                                        title: item.title,
                                        source: 'Project Gutenberg'
                                      })}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition"
                                    >
                                      <Eye size={11} /> Read E-Book
                                    </button>
                                    <button
                                      onClick={() => window.open(`https://www.gutenberg.org/ebooks/${item.id}`, '_blank')}
                                      className="p-1 rounded-lg text-amber-400 hover:text-white hover:bg-amber-900/60"
                                      title="Open on gutenberg.org"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Internet Archive Live Grid */}
                    {liveInternetArchiveResults.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-emerald-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <Library size={14} className="text-emerald-400" />
                            <span>Internet Archive Direct Full-Text Books</span>
                          </span>
                          <button
                            onClick={() => setActiveTab('archive')}
                            className="text-emerald-400 hover:text-white underline font-semibold flex items-center gap-1"
                          >
                            Explore all in Internet Archive <ArrowRight size={12} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {liveInternetArchiveResults.map((item, idx) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 transition flex gap-3 group">
                              <div className="w-16 h-22 bg-[#021810] rounded-lg shrink-0 overflow-hidden border border-emerald-900 flex items-center justify-center">
                                <img
                                  src={item.cover_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-700">
                                      {item.is_restricted ? 'Borrowable' : 'Full Access'}
                                    </span>
                                    {item.year && (
                                      <span className="text-[10px] text-emerald-500 font-mono">
                                        {item.year}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-emerald-300">
                                    {item.title}
                                  </h4>
                                  <p className="text-[11px] text-emerald-400/80 truncate mt-0.5">
                                    {item.creator || 'Unknown Author'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 pt-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/internet-archive/metadata/${item.identifier}`);
                                        if (res.ok) {
                                          const mData = await res.json();
                                          if (mData.success && mData.data?.files?.pdf?.url && !mData.data?.is_restricted) {
                                            setActiveLiveReader({
                                              url: mData.data.files.pdf.url,
                                              pdfUrl: mData.data.files.pdf.url,
                                              directUrl: item.details_url,
                                              title: item.title,
                                              source: 'Internet Archive API',
                                              identifier: item.identifier,
                                              readerType: 'pdf'
                                            });
                                            return;
                                          }
                                        }
                                      } catch (e) {}

                                      setActiveLiveReader({
                                        url: `https://archive.org/details/${item.identifier}?view=theater&ui=embed`,
                                        directUrl: item.details_url,
                                        title: item.title,
                                        source: 'Internet Archive',
                                        identifier: item.identifier
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition"
                                  >
                                    <Eye size={11} /> Read Book
                                  </button>
                                  <button
                                    onClick={() => window.open(item.details_url, '_blank')}
                                    className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60"
                                    title="Open on archive.org"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {liveOpenLibraryResults.length === 0 && liveGutenbergResults.length === 0 && liveInternetArchiveResults.length === 0 && liveGoogleBooksResults.length === 0 && (
                      <div className="p-4 text-center text-xs text-emerald-400/80">
                        No live external matches for "{searchQuery}". Try broader keywords or click Google Books, Open Library, or Internet Archive to search millions of records.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── PUBLIC OPEN-ACCESS REPOSITORY GATEWAYS SHOWCASE ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Globe size={18} className="text-emerald-400" />
                    <span>Global Open Repositories (Public Access • No Login Required)</span>
                  </h2>
                  <p className="text-xs text-emerald-300/80">
                    Seamlessly explore, read, and discover millions of digital volumes directly linked to our institutional OPAC
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gateway 1: Open Library */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#032317] to-[#01140d] border border-emerald-700/60 hover:border-emerald-500 shadow-xl transition space-y-3 flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                        <Globe size={20} />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                        30M+ Items
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      Open Library World Catalog
                    </h3>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">
                      Search and read books from the Internet Archive collection, explore reading logs, works, subjects, and borrow editions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('openlibrary');
                      sounds.playClick();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Launch Open Library Explorer</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Gateway 2: Gutenberg */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#032317] to-[#01140d] border border-amber-800/40 hover:border-amber-600/60 shadow-xl transition space-y-3 flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                        <BookMarked size={20} />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
                        70,000+ E-Books
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                      Project Gutenberg E-Book Archives
                    </h3>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      Instant access to 70,000+ public-domain ebooks in HTML, EPUB, and Kindle formats powered by the Gutendex API.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('gutenberg');
                      sounds.playClick();
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-950 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Browse Project Gutenberg</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Gateway 3: Trove */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#032317] to-[#01140d] border border-emerald-700/60 hover:border-emerald-500 shadow-xl transition space-y-3 flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                        <Library size={20} />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                        National Base
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      Trove National Knowledge Base
                    </h3>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">
                      National Library of Australia digital repository containing digitized books, historical research, gazettes, and images.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('trove');
                      sounds.playClick();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Search Trove Archives</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW: FEDERATED API OVERLAY & AI TASK ASSISTANT */}
        {activeTab === 'overlay' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-emerald-500/40 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <ApiOverlayDiscovery />
            </div>
          </div>
        )}

        {/* VIEW: GOOGLE BOOKS (Recommended Institutional Curriculum & Embedded Viewer) */}
        {activeTab === 'google_books' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-amber-500/40 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <GoogleBooksExplorer />
            </div>
          </div>
        )}

        {/* VIEW: OPEN LIBRARY (Live API - 30M+ Items) */}
        {activeTab === 'openlibrary' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-emerald-900/50 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <OpenLibraryExplorer />
            </div>
          </div>
        )}

        {/* VIEW: PROJECT GUTENBERG E-BOOKS (Live Gutendex API) */}
        {activeTab === 'gutenberg' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-amber-900/40 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <GutendexExplorer />
            </div>
          </div>
        )}

        {/* VIEW: TROVE NATIONAL BASE (Live Trove API) */}
        {activeTab === 'trove' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-emerald-900/50 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="relative z-10">
               <TroveExplorer />
            </div>
          </div>
        )}

        {/* VIEW: INTERNET ARCHIVE REPOSITORY (Live Official IA API) */}
        {activeTab === 'archive' && (
          <div className="h-full mt-4 bg-[#01140d]/80 p-4 sm:p-6 rounded-3xl border border-emerald-900/50 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="relative z-10">
               <InternetArchiveExplorer />
            </div>
          </div>
        )}
      </main>

      {/* ASK A LIBRARIAN MODAL */}
      {showAskLibrarianModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#032317] border border-emerald-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Ask a College Reference Librarian</h3>
              </div>
              <button onClick={() => setShowAskLibrarianModal(false)} className="text-emerald-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {askSubmitted ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle size={36} className="text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white">Inquiry Ticket Dispatched!</h4>
                <p className="text-xs text-emerald-300">A college librarian will respond to your institutional email within 2 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleAskSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-emerald-300 mb-1 font-semibold">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={askForm.name}
                    onChange={e => setAskForm({ ...askForm, name: e.target.value })}
                    placeholder="e.g. Wale Olonade"
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-300 mb-1 font-semibold">Institutional Matric / Email *</label>
                  <input
                    type="text"
                    required
                    value={askForm.matricOrEmail}
                    onChange={e => setAskForm({ ...askForm, matricOrEmail: e.target.value })}
                    placeholder="e.g. FCC/CEM/2024/042 or w.olonade@student.fccibadan.edu.ng"
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-emerald-300 mb-1 font-semibold">Department</label>
                  <select
                    value={askForm.department}
                    onChange={e => setAskForm({ ...askForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="CEM">Co-operative Economics & Management (CEM)</option>
                    <option value="CSC">Computer Science & Information Technology (CSC)</option>
                    <option value="BNF">Banking & Finance (BNF)</option>
                    <option value="AGR">Agricultural Extension & Management (AGR)</option>
                    <option value="BAM">Business Administration & Management (BAM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-300 mb-1 font-semibold">Research Consultation Question *</label>
                  <textarea
                    rows={3}
                    required
                    value={askForm.question}
                    onChange={e => setAskForm({ ...askForm, question: e.target.value })}
                    placeholder="Describe the thesis topic, book finding request, or citation help you need..."
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Send Inquiry to Reference Desk
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-emerald-800/60 bg-[#01140d] py-8 px-4 sm:px-8 mt-12 text-xs text-emerald-400/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/fcc-logo.png"
              alt="FCC Crest"
              className="w-8 h-8 object-cover rounded-lg border border-emerald-500/40 shrink-0"
            />
            <div>
              <div className="font-bold text-white text-xs">{INSTITUTION.name}</div>
              <div className="text-[11px] text-emerald-400/80">Directorate of Library & Information Services • Est. 1943</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-emerald-300 font-mono text-[11px]">
            <span>MARC 21 Format Rev. 42 (May 2026)</span>
            <span>•</span>
            <span>VuFind / LibraryWorld Engine</span>
          </div>
        </div>
      </footer>

      {/* ─── LIVE FEDERATED MODAL READER (Public Access • No Login Required) ─── */}
      <LiveFederatedModalReader
        activeLiveReader={activeLiveReader}
        onClose={() => setActiveLiveReader(null)}
      />
    </div>
  );
}

// Subcomponent for the Live Federated Modal Reader with Gutenberg Auto-Discovery
function LiveFederatedModalReader({ activeLiveReader, onClose }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(activeLiveReader?.url || '');
  const [activeProvider, setActiveProvider] = useState(activeLiveReader?.readerType === 'pdf' ? 'pdf' : 'archive');
  const [gutenbergMatch, setGutenbergMatch] = useState(null);
  const [searchingGutenberg, setSearchingGutenberg] = useState(false);
  const [iaData, setIaData] = useState(null);
  const [iaPdf, setIaPdf] = useState(null);

  useEffect(() => {
    if (!activeLiveReader) return;
    setCurrentUrl(activeLiveReader.url || '');
    setActiveProvider(activeLiveReader.readerType === 'pdf' ? 'pdf' : 'archive');
    setLoading(true);
    setGutenbergMatch(null);
    setIaData(null);
    setIaPdf(null);

    // 1. Check Internet Archive API for unencrypted full PDF
    const targetIaId = activeLiveReader.identifier || (activeLiveReader.url?.match(/archive\.org\/(?:details|embed)\/([^\/?#]+)/)?.[1]);
    if (targetIaId) {
      fetch(`/api/internet-archive/metadata/${targetIaId}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setIaData(res.data);
            if (res.data.files?.pdf?.url && !res.data.is_restricted) {
              setIaPdf(res.data.files.pdf);
              if (activeLiveReader.readerType === 'pdf' || res.data.can_read_full) {
                setCurrentUrl(res.data.files.pdf.url);
                setActiveProvider('pdf');
                setLoading(false);
              }
            }
          }
        })
        .catch(() => {});
    }

    const rawTitle = activeLiveReader.title || '';
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

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLiveReader, iframeKey, onClose]);

  if (!activeLiveReader) return null;

  const url = currentUrl || activeLiveReader.url || '';
  const directUrl = activeLiveReader.directUrl || activeLiveReader.url;
  const title = activeLiveReader.title || 'Live Reader';

  const openDirect = () => {
    let target = directUrl;
    if (activeProvider === 'pdf' && iaPdf?.url) target = iaPdf.url;
    else if (activeProvider === 'gutenberg' && gutenbergMatch?.readUrl) target = gutenbergMatch.readUrl;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    let target = directUrl;
    if (activeProvider === 'pdf' && iaPdf?.url) target = iaPdf.url;
    else if (activeProvider === 'gutenberg' && gutenbergMatch?.readUrl) target = gutenbergMatch.readUrl;
    if (target) {
      navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              <h3 className="text-emerald-100 font-bold text-sm truncate max-w-[280px] sm:max-w-md">
                {title}
              </h3>
              {activeProvider === 'pdf' ? (
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                  Full PDF (All Pages)
                </span>
              ) : activeProvider === 'gutenberg' ? (
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                  100% Full Unrestricted Text
                </span>
              ) : null}
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              {activeProvider === 'pdf' ? 'Internet Archive API • Full Volume PDF Stream' : activeProvider === 'gutenberg' ? 'Project Gutenberg Full-Text Reader' : `${activeLiveReader.source || 'Digital Repository'} • Public Access`}
            </span>
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
            >
              <FileText size={12} />
              <span>Full Book PDF</span>
            </button>
          )}

          {activeLiveReader.url && activeLiveReader.url !== iaPdf?.url && (
            <button
              onClick={() => {
                setCurrentUrl(activeLiveReader.url);
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
            onClick={() => {
              setLoading(true);
              setIframeKey(k => k + 1);
            }}
            className="p-2 bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg transition"
            title="Reload Frame"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
            className="flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ── Status Banners ── */}
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
                setCurrentUrl(activeLiveReader.url);
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
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
