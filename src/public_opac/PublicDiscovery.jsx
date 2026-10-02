import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, BookOpen, Layers, Filter, CheckCircle, Clock, ArrowRight,
  Sparkles, Building, Globe, ExternalLink, Building2, Calendar,
  HelpCircle, MessageSquare, Phone, Mail, MapPin, ChevronRight,
  Check, Copy, Star, Bookmark, BookCheck, Sliders, ChevronDown,
  ChevronUp, Database, FileText, Newspaper, Radio, Video, Award,
  Volume2, Shield, AlertCircle, RefreshCw, Send, X, Share2, Tag, Scan,
  BookMarked, Library, Eye, Loader2, AlertTriangle
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
  const [hasQueriedLiveApi, setHasQueriedLiveApi] = useState(false);
  const [activeLiveReader, setActiveLiveReader] = useState(null); // { url, directUrl, title, source }
  const [savedBooks, setSavedBooks] = useState(() => {
    return JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
  });

  // Server-side / Client Pagination State (Prompt 34: 20, 50, 100 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

    // 3. Autocomplete Suggestions
    const matchedTitles = books
      .filter(b => b.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map(b => ({ type: 'Title', text: b.title, book: b }));

    const matchedAuthors = books
      .filter(b => b.author.toLowerCase().includes(q))
      .slice(0, 2)
      .map(b => ({ type: 'Author', text: b.author, book: b }));

    const matchedSubjects = books
      .filter(b => b.subject.toLowerCase().includes(q))
      .slice(0, 2)
      .map(b => ({ type: 'Subject', text: b.subject, book: b }));

    const combined = [...matchedTitles, ...matchedAuthors, ...matchedSubjects];
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
      const olPromise = fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,ia,ebook_access`)
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

      const [olDocs, gutResults] = await Promise.all([olPromise, gutPromise]);
      setLiveOpenLibraryResults(olDocs);
      setLiveGutenbergResults(gutResults);
    } catch (err) {
      console.error('Error fetching live federated resources:', err);
    } finally {
      setLiveFederatedLoading(false);
    }
  };

  const handlePerformSearch = (e) => {
    if (e) e.preventDefault();
    sounds.playClick();
    if (searchTarget === 'openlibrary') {
      setActiveTab('openlibrary');
    } else if (searchTarget === 'gutenberg') {
      setActiveTab('gutenberg');
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

  // Filtered Books with Multi-Field and Advanced Facets
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      // 1. Text & Search Field Match
      const q = searchQuery.toLowerCase().trim();
      let matchQuery = true;
      if (q) {
        if (searchField === 'title') matchQuery = b.title.toLowerCase().includes(q);
        else if (searchField === 'author') matchQuery = b.author.toLowerCase().includes(q);
        else if (searchField === 'isbn') matchQuery = (b.isbn || '').toLowerCase().includes(q);
        else if (searchField === 'subject') matchQuery = (b.subject || '').toLowerCase().includes(q);
        else if (searchField === 'call') matchQuery = (b.callNumber || '').toLowerCase().includes(q);
        else if (searchField === 'publisher') matchQuery = (b.publisher || '').toLowerCase().includes(q);
        else {
          // All fields
          matchQuery = b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.isbn || '').includes(q) ||
            (b.callNumber || '').toLowerCase().includes(q) ||
            (b.subject || '').toLowerCase().includes(q) ||
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
  }, [books, searchQuery, searchField, showAdvancedSearch, advSearch, facets]);

  // Reset page when search or facet changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchField, facets, advSearch]);

  const totalResults = filteredBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  const displayedBooks = filteredBooks.slice(startIndex, endIndex);

  // Curated Content Collections for Homepage
  const featuredBooks = books.slice(0, 4);
  const newArrivals = [...books].reverse().slice(0, 4);
  const mostBorrowed = books.slice(1, 5);
  const recommendedResources = books.filter(b => b.isDigital).slice(0, 4);

  // Popular Research Topics
  const researchTopics = [
    { title: 'Cooperative Agricultural Micro-Credit', count: 48, icon: '🌾' },
    { title: 'Relational Database Optimization & SQL Tuning', count: 62, icon: '💾' },
    { title: 'Sub-Saharan Banking Regulatory Compliance', count: 35, icon: '🏦' },
    { title: 'Agronomic Value Chain Logistics & Export', count: 29, icon: '🌱' },
    { title: 'Artificial Intelligence & Neural Machine Learning', count: 54, icon: '🧠' },
    { title: 'Financial Auditing Standards & Forensics', count: 41, icon: '📊' }
  ];

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

  // Announcements, News & Events
  const announcements = [
    { tag: 'NBTE ACCREDITATION', title: 'Directorate of Library Services Retains Grade A Compliance Scorecard', date: 'Sept 2026', desc: 'The National Board for Technical Education (NBTE) has reaffirmed full accreditation for the college library stacks.' },
    { tag: 'EXTENDED HOURS', title: 'Semester Examination 24/7 Carrel & Reading Stack Access Schedule', date: 'Oct 2026', desc: 'Acoustic study pods and Stack 2 reserve collections will remain open until midnight throughout the examination cycle.' },
    { tag: 'NEW ACQUISITIONS', title: 'TETFUND Stack 3 Ingestion: 450 New Cooperative & IT Reference Volumes', date: 'Sept 2026', desc: 'Physical books cataloged under Dewey Decimal Classification now ready for circulation desk checkout.' }
  ];

  const libraryEvents = [
    { date: 'OCT 08', time: '10:00 AM', title: 'Turnitin & Plagiarism Prevention Masterclass for HND II Students', room: 'Media Hall A' },
    { date: 'OCT 15', time: '02:00 PM', title: 'Open Science & Digital Commons Publishing Workshop for Faculty', room: 'E-Library Hub' },
    { date: 'OCT 22', time: '11:00 AM', title: 'Zotero & Mendeley Academic Citation & Bibliography Workshop', room: 'Stack 1 Lab' }
  ];

  const faqs = [
    { q: 'How many books can a student borrow simultaneously?', a: 'Under institutional Tier 3 RBAC policies, ND and HND students can borrow up to 2 physical volumes for 14 days, renewable once online if no hold reservations exist.' },
    { q: 'How do I obtain my Final Year Library Graduation Clearance?', a: 'Clearance is automated. Visit the Graduation Clearance portal (#/scholar/clearance). Once all loans are returned and fines are ₦0.00, your certified cryptographic certificate generates instantly.' },
    { q: 'Can I access the digital e-books and past questions from home?', a: 'Yes! All open-access and student departmental resources uploaded by HODs can be read in the built-in browser reader with watermark protection anytime.' },
    { q: 'What should I do if I misplace my library Smart PVC NFC card?', a: 'Report immediately to the Circulation Desk (#/admin/circulation) to lock your RFID token, then generate a temporary replacement barcode on the Scholar ID screen.' }
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
      className="min-h-screen bg-[#021810] text-emerald-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white"
      style={{ backgroundImage: PATTERNS.opac }}
    >
      {/* 1. INSTITUTIONAL OPAC TOP HEADER */}
      <header className="bg-[#032317]/95 backdrop-blur-md border-b border-emerald-800/60 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#021810] border border-emerald-400/50 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950 shrink-0 overflow-hidden">
              <img
                src="/assets/fcc-logo.png"
                alt="FCC Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="text-sm font-black text-white leading-none tracking-tight">{INSTITUTION.shortName}</div>
              <div className="text-[11px] text-emerald-400 font-mono font-medium">Unified OPAC & Institutional Discovery</div>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-xs">
            {[
              { id: 'home', label: 'Discovery Home', icon: Globe },
              { id: 'catalog', label: `College Stacks (${books.length})`, icon: BookOpen },
              { id: 'openlibrary', label: 'Open Library (Live API)', icon: Globe },
              { id: 'gutenberg', label: 'Project Gutenberg (E-Books)', icon: BookMarked },
              { id: 'trove', label: 'Trove Archives', icon: Library },
              { id: 'journals', label: 'E-Journals', icon: Newspaper },
              { id: 'databases', label: 'Databases', icon: Database },
              { id: 'repository', label: 'Institutional Repository', icon: Building2 },
              { id: 'partner_libraries', label: `Partner Libraries (${partnerLibraries.length})`, icon: Building }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    sounds.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === item.id
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold shadow'
                      : 'text-emerald-400/80 hover:text-white hover:bg-emerald-950/60'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Gateways */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              navigateTo('/kiosk');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/80 border border-teal-600/70 text-teal-300 hover:text-white hover:bg-teal-900 text-xs font-semibold transition shadow-md hover:border-teal-400"
            title="Launch Self-Service Checkout / Return Kiosk (Module 8)"
          >
            <Scan size={14} className="text-teal-400" />
            <span className="hidden sm:inline">Self-Service Kiosk</span>
            <span className="sm:hidden">Kiosk</span>
          </button>

          <button
            onClick={() => setShowAskLibrarianModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800 text-emerald-300 hover:text-white hover:border-emerald-600 text-xs font-semibold transition"
          >
            <HelpCircle size={14} className="text-emerald-400" />
            <span>Ask a Librarian</span>
          </button>

          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
          >
            <span>Student / Staff Login</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

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
            {/* HERO SEARCH WITH VU-FIND GRADE INTELLIGENCE */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#063b27] via-[#04281c] to-[#021810] border-2 border-emerald-600/40 p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-xs font-semibold">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Next-Generation OPAC Discovery Engine • LibraryWorld & VuFind Standards</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Discover Knowledge Across All Institutional Stacks
                </h1>
                <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                  Search across 125,000+ physical volumes, electronic textbooks, lecture compendiums, and digital research repositories with real-time stack availability.
                </p>
              </div>

              {/* SEARCH BAR WITH MULTI-FIELD SELECTOR & AUTOCOMPLETE */}
              <div className="relative z-20 space-y-3">
                
                {/* REPOSITORY SOURCE SELECTOR (No Login Required) */}
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  {[
                    { id: 'all', label: 'All Stacks & Live APIs', icon: Sparkles, badge: 'Federated' },
                    { id: 'stacks', label: `College Stacks (${books.length})`, icon: BookOpen, badge: 'Campus' },
                    { id: 'openlibrary', label: 'Open Library (Live API)', icon: Globe, badge: '30M+ Books' },
                    { id: 'gutenberg', label: 'Project Gutenberg', icon: BookMarked, badge: '70k+ E-Books' },
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
                          if (src.id === 'openlibrary') setActiveTab('openlibrary');
                          else if (src.id === 'gutenberg') setActiveTab('gutenberg');
                          else if (src.id === 'trove') setActiveTab('trove');
                          else if (src.id === 'stacks') setActiveTab('catalog');
                          else {
                            setActiveTab('home');
                            if (searchQuery) fetchLiveExternalResources(searchQuery);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950 ring-1 ring-emerald-400'
                            : 'bg-[#021810] text-emerald-300/80 border border-emerald-800/80 hover:border-emerald-600 hover:text-white'
                        }`}
                      >
                        <Icon size={13} className={isSelected ? 'text-white' : 'text-emerald-400'} />
                        <span>{src.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-black/30 text-emerald-100' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
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

                    {liveOpenLibraryResults.length === 0 && liveGutenbergResults.length === 0 && (
                      <div className="p-4 text-center text-xs text-emerald-400/80">
                        No live external matches for "{searchQuery}". Try broader keywords or click Open Library to search 30M+ records.
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

            {/* CATALOG SEARCH RESULTS / BROWSE STACKS */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#032317] border border-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">OPAC Collection Stacks</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                    {filteredBooks.length} titles matched
                  </span>
                </div>

                {/* Quick Facet Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['All', 'Co-operative Economics', 'Computer Science', 'Banking & Finance', 'Agricultural Extension'].map(sub => (
                    <button
                      key={sub}
                      onClick={() => setFacets({ ...facets, subject: sub })}
                      className={`px-3 py-1 rounded-xl transition ${
                        facets.subject === sub
                          ? 'bg-emerald-600 text-white font-bold shadow'
                          : 'bg-[#021810] text-emerald-300 border border-emerald-900 hover:border-emerald-600'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                  <button
                    onClick={() => setFacets({ ...facets, format: facets.format === 'Digital' ? 'All' : 'Digital' })}
                    className={`px-3 py-1 rounded-xl transition ${
                      facets.format === 'Digital'
                        ? 'bg-teal-600 text-white font-bold'
                        : 'bg-[#021810] text-teal-300 border border-teal-900'
                    }`}
                  >
                    ⚡ E-Books Only
                  </button>
                </div>
              </div>

              {/* BOOK CARDS GRID */}
              {displayedBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayedBooks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook(b)}
                      className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500/80 transition-all hover:-translate-y-1 shadow-xl flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800">
                            {b.callNumber}
                          </span>
                          <button
                            onClick={(e) => handleToggleSaveBook(b.id, e)}
                            className="p-1 rounded-lg hover:bg-[#021810] text-emerald-400 hover:text-white transition"
                            title="Bookmark to my list"
                          >
                            <Bookmark size={15} className={savedBooks.includes(b.id) ? 'fill-emerald-400 text-emerald-400' : ''} />
                          </button>
                        </div>

                        {/* Mini Canvas Cover */}
                        <div className="w-full h-36 rounded-xl bg-gradient-to-br from-[#063f2b] to-[#02150e] border border-emerald-700/50 p-3 flex flex-col justify-between font-serif relative overflow-hidden">
                          <div className="text-[10px] font-mono text-emerald-400/80 truncate uppercase">
                            {b.department || 'FEDERAL COOPERATIVE'}
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-3 leading-snug group-hover:text-emerald-300 transition">
                            {b.title}
                          </h4>
                          <div className="text-[10px] text-emerald-400 font-mono truncate">{b.author}</div>
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-xs line-clamp-2 group-hover:text-emerald-300 transition">
                            {b.title}
                          </h3>
                          <p className="text-[11px] text-emerald-300/80 truncate mt-0.5">By {b.author}</p>
                        </div>
                      </div>

                      {/* Bottom Status */}
                      <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between text-[11px] mt-2">
                        <span className={`font-bold ${
                          (b.copiesAvailable || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {(b.copiesAvailable || 0) > 0 ? `${b.copiesAvailable} In Stacks` : 'Checked Out'}
                        </span>
                        <span className="text-emerald-400 group-hover:translate-x-1 transition font-bold flex items-center gap-1">
                          Details <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 p-6 rounded-3xl bg-[#032317] border border-emerald-800 space-y-3">
                  <AlertCircle size={36} className="text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">No resources found matching your search.</h3>
                  <p className="text-xs text-emerald-400/80 max-w-sm mx-auto">
                    Try searching by author, topic keywords, or ISBN, or reset specific filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFacets({ subject: 'All', department: 'All', format: 'All', availability: 'All' });
                      setShowAdvancedSearch(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* SERVER-SIDE PAGINATION TOOLBAR (Prompt 34: 20/50/100, Prev, Next, Page Numbers, Total Count) */}
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

            {/* 3. SECTION: POPULAR RESEARCH TOPICS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>Popular Research Topics & Curriculum Focus</span>
                  </h2>
                  <p className="text-xs text-emerald-300/80">Trending academic research subjects across ND & HND departments</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {researchTopics.map((topic, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSearchQuery(topic.title);
                      setActiveTab('catalog');
                    }}
                    className="p-3.5 rounded-2xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 cursor-pointer transition text-center space-y-1.5 group"
                  >
                    <div className="text-2xl group-hover:scale-110 transition">{topic.icon}</div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 line-clamp-2">
                      {topic.title}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">{topic.count} resources</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SECTION: FEATURED BOOKS & NEW ARRIVALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Featured Editorial Picks */}
              <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                  <span className="font-bold text-white text-base flex items-center gap-2">
                    <Star size={16} className="text-amber-400" />
                    <span>Featured Academic Texts</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">Curated Faculty Picks</span>
                </div>

                <div className="space-y-3">
                  {featuredBooks.map(b => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook(b)}
                      className="p-3 rounded-xl bg-[#021810] border border-emerald-900 hover:border-emerald-500 cursor-pointer transition flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{b.title}</div>
                        <div className="text-[11px] text-emerald-300/80 truncate">By {b.author}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono shrink-0">
                        {b.callNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Arrivals & Recently Added */}
              <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-800 pb-2">
                  <span className="font-bold text-white text-base flex items-center gap-2">
                    <Clock size={16} className="text-teal-400" />
                    <span>New Arrivals & Recent Ingestions</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">Added This Month</span>
                </div>

                <div className="space-y-3">
                  {newArrivals.map(b => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBook(b)}
                      className="p-3 rounded-xl bg-[#021810] border border-emerald-900 hover:border-teal-500 cursor-pointer transition flex justify-between items-center gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{b.title}</div>
                        <div className="text-[11px] text-emerald-300/80 truncate">By {b.author}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 text-[10px] font-mono shrink-0">
                        {b.isDigital ? '⚡ E-Book' : 'Hardcover'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. ANNOUNCEMENTS, EVENTS & LIBRARY NEWS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Bulletins / Announcements */}
              <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-800 pb-2">
                  <Radio size={14} className="text-emerald-400" />
                  <span>Library Bulletins & Announcements</span>
                </span>
                <div className="space-y-3">
                  {announcements.map((a, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400">
                        <span>{a.tag}</span>
                        <span>{a.date}</span>
                      </div>
                      <h5 className="font-bold text-white text-xs leading-snug">{a.title}</h5>
                      <p className="text-[11px] text-emerald-200/80">{a.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events & Workshops */}
              <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-800 pb-2">
                  <Calendar size={14} className="text-teal-400" />
                  <span>Upcoming Library Events & Workshops</span>
                </span>
                <div className="space-y-3">
                  {libraryEvents.map((ev, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-300 font-mono text-center shrink-0">
                        <div className="font-black text-xs">{ev.date.split(' ')[1]}</div>
                        <div className="text-[10px] font-semibold">{ev.date.split(' ')[0]}</div>
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-white text-xs leading-snug truncate">{ev.title}</h5>
                        <div className="text-[11px] text-emerald-400/80">{ev.time} • {ev.room}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opening Hours & Contact */}
              <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-800 pb-2">
                  <Clock size={14} className="text-amber-400" />
                  <span>Opening Hours & Support Desk</span>
                </span>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#021810] border border-emerald-900 flex justify-between">
                    <span className="text-slate-300">Monday — Friday</span>
                    <span className="font-mono text-emerald-400 font-bold">8:00 AM — 8:00 PM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#021810] border border-emerald-900 flex justify-between">
                    <span className="text-slate-300">Saturday Reading Stack</span>
                    <span className="font-mono text-emerald-400 font-bold">9:00 AM — 4:00 PM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#021810] border border-emerald-900 flex justify-between">
                    <span className="text-slate-300">Sunday & Public Holidays</span>
                    <span className="font-mono text-amber-400 font-bold">Closed / Online Only</span>
                  </div>

                  <div className="pt-2 text-xs space-y-1 text-emerald-200 border-t border-emerald-900/60">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-emerald-400 shrink-0" />
                      <span>Prof. Hezekiah Complex, Main Campus, Ibadan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-emerald-400 shrink-0" />
                      <span>+234 803 000 4200 (Circulation Desk)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-emerald-400 shrink-0" />
                      <span>library@fccibadan.edu.ng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. SECTION: FREQUENTLY ASKED QUESTIONS (FAQS) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#032317] border border-emerald-700/60 shadow-xl space-y-4">
              <div className="border-b border-emerald-800 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle size={18} className="text-emerald-400" />
                  <span>Frequently Asked Questions (FAQs)</span>
                </h3>
                <p className="text-xs text-emerald-300/80">Answers to common institutional library inquiries</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-1.5">
                    <h5 className="font-bold text-white text-xs leading-snug">{faq.q}</h5>
                    <p className="text-emerald-200/90 leading-relaxed text-[11px]">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
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
      {activeLiveReader && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#021810] animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#032316] border-b border-emerald-800/60 shadow-xl gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-emerald-100 font-bold text-sm truncate max-w-[280px] sm:max-w-md">
                  {activeLiveReader.title}
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">
                  {activeLiveReader.source} • Public Access (No Login Required)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(activeLiveReader.url?.includes('archive.org') || activeLiveReader.directUrl?.includes('archive.org')) && (
                <button
                  onClick={() => window.open(activeLiveReader.directUrl || activeLiveReader.url, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold shadow-md transition whitespace-nowrap animate-pulse hover:animate-none"
                  title="Borrow on Archive.org to unlock all pages beyond page 7"
                >
                  <ExternalLink size={13} />
                  <span>Borrow Full Book (All Pages)</span>
                </button>
              )}
              <button
                onClick={() => window.open(activeLiveReader.directUrl || activeLiveReader.url, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                <ExternalLink size={13} />
                <span>Open in New Tab</span>
              </button>
              <button
                onClick={() => setActiveLiveReader(null)}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* ── Archive.org Page 7 CDL Limit Notice ── */}
          {(activeLiveReader.url?.includes('archive.org') || activeLiveReader.directUrl?.includes('archive.org')) && (
            <div className="bg-gradient-to-r from-amber-950 via-[#032316] to-[#021810] border-b border-amber-600/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-200 z-10 shadow">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <span className="truncate sm:overflow-visible sm:whitespace-normal">
                  <strong>Need to read past Page 7?</strong> Internet Archive enforces a 7-page guest preview inside embedded frames. To unlock all pages without jumping, click to activate your free 1-hour loan:
                </span>
              </div>
              <button
                onClick={() => window.open(activeLiveReader.directUrl || activeLiveReader.url, '_blank', 'noopener,noreferrer')}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow shrink-0 whitespace-nowrap"
              >
                <ExternalLink size={12} /> Unlock All Pages on Archive.org
              </button>
            </div>
          )}

          <iframe
            src={activeLiveReader.url}
            className="flex-1 w-full h-full border-none bg-[#fdfaf4]"
            title={activeLiveReader.title}
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen={true}
          />
        </div>
      )}
    </div>
  );
}
