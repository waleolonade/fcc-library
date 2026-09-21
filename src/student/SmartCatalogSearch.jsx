import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Mic, MicOff, Bot, Sparkles, Filter, BookOpen,
  Layers, FileText, CheckCircle, MapPin, Download, Share2,
  Bookmark, ChevronRight, AlertCircle, RefreshCw, X, PlusCircle,
  Building2, GraduationCap, ArrowUpDown, Clock, Tag
} from 'lucide-react';
import { parseNaturalLanguageQuery, filterCatalogByNlp } from '../utils/nlpSearch';
import TraceBadge from '../common/TraceBadge';
import { sounds } from '../utils/soundEffects';

const DEFAULT_RECENT_SEARCHES = [
  'artificial intelligence',
  'distributed database systems',
  'cooperative economics',
  'cocoa agronomy',
  'CEM 411 syllabus textbooks'
];

export default function SmartCatalogSearch({
  books = [],
  theses = [],
  courses = [],
  onSelectBook,
  onOpenReader,
  onOpenAi,
  onRequestAcquisition,
  initialQuery = ''
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('Everything');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available'
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'newest' | 'oldest' | 'title' | 'callNumber' | 'copies'
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('fcc_recent_searches');
      return saved ? JSON.parse(saved) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const recognitionRef = useRef(null);

  const categories = [
    'Everything', 'Books', 'eBooks & PDFs', 'Journals', 'Theses & Projects', 'Course Materials'
  ];

  const branches = [
    'All Branches',
    'Main Campus Library (Prof. Hezekiah Complex)',
    'Faculty of Engineering Library',
    'Faculty of Science & Computing Library',
    'Law & Administrative Library',
    'E-Library & Virtual Commons'
  ];

  // Merge theses into searchable catalog items when in Everything or Theses mode
  const combinedCatalog = useMemo(() => {
    const formattedTheses = (theses || []).map(t => ({
      id: `thesis-${t.id}`,
      title: t.title,
      author: t.studentName || t.author || 'Postgraduate Researcher',
      publisher: `FCC Institutional Repository (${t.department || 'Academic Affairs'})`,
      year: t.year || 2024,
      callNumber: `TH-${t.department || 'GEN'}-${t.year || 2024}-${t.id}`,
      isbn: `ETD-${t.id}`,
      subject: t.topic || t.abstract || 'Academic Dissertation / Project',
      abstract: t.abstract || `Research study submitted to the Department of ${t.department || 'General Studies'}, Federal Cooperative College Ibadan.`,
      department: t.department || 'General',
      isDigital: true,
      pdfUrl: t.fileUrl || '/demo-theses.pdf',
      pdfPages: t.pages || 142,
      copiesAvailable: 1,
      totalCopies: 1,
      format: 'Thesis',
      branch: 'Main Campus Library (Prof. Hezekiah Complex)',
      shelfLocation: 'Postgraduate Archive & Repository',
      supervisor: t.supervisor
    }));

    // Deduplicate books so identical monographs never appear twice on the student side
    const seenMap = new Map();
    for (const b of books) {
      const normKey = (b.title || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\.pdf$/i, '').replace(/[^\w\s]/g, '').trim();
      const key = (b.isbn && !b.isbn.startsWith('978-978-000') ? b.isbn : null) || normKey || b.id;
      if (!seenMap.has(key)) {
        seenMap.set(key, b);
      }
    }

    const uniqueBooks = Array.from(seenMap.values());
    return [...uniqueBooks, ...formattedTheses];
  }, [books, theses]);

  // Execute Search & Filtering
  const filteredResults = useMemo(() => {
    const parsedNlp = parseNaturalLanguageQuery(searchQuery);
    let results = filterCatalogByNlp(combinedCatalog, parsedNlp);

    // 1. Category Filter
    if (activeCategory === 'Books') {
      results = results.filter(b => b.format === 'Book' || (!b.isDigital && b.format !== 'Thesis' && b.format !== 'Journal'));
    } else if (activeCategory === 'eBooks & PDFs') {
      results = results.filter(b => b.isDigital || b.pdfUrl || b.format === 'PDF' || b.format === 'E-Book');
    } else if (activeCategory === 'Journals') {
      results = results.filter(b => 
        b.format === 'Journal' || 
        (b.subject && b.subject.toLowerCase().includes('journal')) ||
        (b.title && b.title.toLowerCase().includes('journal')) ||
        (b.publisher && (b.publisher.toLowerCase().includes('ieee') || b.publisher.toLowerCase().includes('springer') || b.publisher.toLowerCase().includes('journal')))
      );
    } else if (activeCategory === 'Theses & Projects') {
      results = results.filter(b => b.format === 'Thesis' || String(b.id).startsWith('thesis-') || (b.title && b.title.toLowerCase().includes('thesis')));
    } else if (activeCategory === 'Course Materials') {
      results = results.filter(b => Boolean(b.courseCode) || b.format === 'Course Material');
    }

    // 2. Branch Filter
    if (selectedBranch !== 'All' && selectedBranch !== 'All Branches') {
      results = results.filter(b => b.branch === selectedBranch);
    }

    // 3. Availability Filter
    if (availabilityFilter === 'available') {
      results = results.filter(b => b.copiesAvailable > 0 || b.isDigital);
    }

    // 4. Sorting
    const sorted = [...results];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'callNumber') {
      sorted.sort((a, b) => (a.callNumber || '').localeCompare(b.callNumber || ''));
    } else if (sortBy === 'copies') {
      sorted.sort((a, b) => (b.copiesAvailable || 0) - (a.copiesAvailable || 0));
    } else {
      // Relevance (Default): prioritize direct title match, then author, then subject
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        sorted.sort((a, b) => {
          const aTitle = (a.title || '').toLowerCase().includes(q) ? 3 : 0;
          const bTitle = (b.title || '').toLowerCase().includes(q) ? 3 : 0;
          const aCourse = (a.courseCode || '').toLowerCase().includes(q) ? 2 : 0;
          const bCourse = (b.courseCode || '').toLowerCase().includes(q) ? 2 : 0;
          const aAuthor = (a.author || '').toLowerCase().includes(q) ? 1 : 0;
          const bAuthor = (b.author || '').toLowerCase().includes(q) ? 1 : 0;
          return (bTitle + bCourse + bAuthor) - (aTitle + aCourse + aAuthor);
        });
      }
    }

    return sorted;
  }, [combinedCatalog, searchQuery, activeCategory, selectedBranch, availabilityFilter, sortBy]);

  // Voice Search via Web Speech API
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          sounds.playClick();
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setSearchQuery(transcript);
            handleSaveRecentSearch(transcript);
            sounds.playSuccessChime();
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          sounds.playErrorBuzz();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        fallbackVoiceSimulation();
      }
    } else {
      fallbackVoiceSimulation();
    }
  };

  const fallbackVoiceSimulation = () => {
    setIsListening(true);
    sounds.playClick();
    const demoVoiceQueries = [
      'Find available books about artificial intelligence',
      'Show CEM 411 textbooks',
      'Find books about cooperative economics',
      'Show distributed database systems'
    ];
    const randomQuery = demoVoiceQueries[Math.floor(Math.random() * demoVoiceQueries.length)];
    setTimeout(() => {
      setSearchQuery(randomQuery);
      handleSaveRecentSearch(randomQuery);
      setIsListening(false);
      sounds.playSuccessChime();
    }, 1200);
  };

  const handleSaveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 7);
      try {
        localStorage.setItem('fcc_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleApplySuggestion = (text) => {
    setSearchQuery(text);
    handleSaveRecentSearch(text);
    sounds.playClick();
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('fcc_recent_searches');
    sounds.playClick();
  };

  const parsedNlp = parseNaturalLanguageQuery(searchQuery);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HERO SEARCH BAR & NATURAL LANGUAGE INPUT */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                <Sparkles size={11} /> NATURAL LANGUAGE DISCOVERY
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {books.length} Catalog Items • {theses.length} Theses
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">What are you looking for?</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ask naturally or search by Title, Author, ISBN, Call Number, or Course Code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAi(searchQuery || 'Find available books about artificial intelligence')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950 transition shrink-0 group active:scale-95 cursor-pointer"
            >
              <Bot size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Ask AI Librarian</span>
            </button>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder='Try: "Find available books about artificial intelligence" or "Show CEM 411 textbooks"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveRecentSearch(searchQuery);
              }
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner font-sans"
          />

          <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-white transition"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}

            {/* Voice Search Button */}
            <button
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isListening ? "Listening... Speak now" : "Click to speak voice search"}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>
        </div>

        {/* Category Pills & Facet Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  sounds.playClick();
                }}
                className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 scale-105'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Filter size={13} className="text-emerald-400" />
            <span>{showFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
        </div>

        {/* Extended Filter Drawer */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-emerald-400" /> Campus Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <CheckCircle size={13} className="text-emerald-400" /> Availability Status
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Holdings (Print & Digital)</option>
                <option value="available">Available on Shelf / E-Books Only</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <ArrowUpDown size={13} className="text-emerald-400" /> Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="relevance">Relevance (Dense Keyword Match)</option>
                <option value="newest">Publication Year (Newest First)</option>
                <option value="oldest">Publication Year (Oldest First)</option>
                <option value="title">Title (A-Z)</option>
                <option value="callNumber">Call Number (A-Z)</option>
                <option value="copies">Available Stock / Copies</option>
              </select>
            </div>
          </div>
        )}

        {/* Typo Correction / Did You Mean Banner */}
        {parsedNlp.suggestedTerm && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-xs flex items-center justify-between text-indigo-300">
            <div>
              <span>Did you mean: </span>
              <strong className="text-white underline cursor-pointer" onClick={() => handleApplySuggestion(parsedNlp.suggestedTerm)}>
                "{parsedNlp.suggestedTerm}"
              </strong>
            </div>
            <button onClick={() => handleApplySuggestion(parsedNlp.suggestedTerm)} className="text-emerald-400 font-bold hover:underline">Apply</button>
          </div>
        )}

        {/* Recent Search Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Clock size={12} /> Recent Searches:
          </span>
          {recentSearches.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySuggestion(s)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 hover:text-emerald-300 text-slate-300 border border-slate-800 transition flex items-center gap-1 active:scale-95"
            >
              <Search size={10} className="text-slate-500" />
              <span>{s}</span>
            </button>
          ))}
          {recentSearches.length > 0 && (
            <button
              onClick={handleClearRecentSearches}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. RESULTS COUNT & ACTIVE SEARCH CRITERIA */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <strong className="text-white">{filteredResults.length}</strong> {activeCategory.toLowerCase()} found
          {searchQuery && <span> for "<strong className="text-emerald-400">{searchQuery}</strong>"</span>}
          {selectedBranch !== 'All Branches' && <span> in <span className="text-slate-300">{selectedBranch.split('(')[0]}</span></span>}
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
          MySQL Dual-Driver & MARC21 Synchronized
        </span>
      </div>

      {/* 3. SEARCH RESULTS LIST OR NOT-FOUND ASSISTANT */}
      {filteredResults.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">No matching catalog holdings found</h3>
            <p className="text-xs text-slate-400">
              We couldn't find a direct record matching "{searchQuery || activeCategory}". Here are recommended options:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-xs">
            <button
              onClick={() => onOpenAi(searchQuery || 'Find available books')}
              className="p-4 rounded-2xl bg-slate-950 border border-indigo-800 hover:border-indigo-500 text-left transition group"
            >
              <Bot size={20} className="text-indigo-400 mb-2" />
              <div className="font-bold text-white group-hover:text-indigo-300">Ask AI Librarian</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Explore related research papers & citations</div>
            </button>

            <button
              onClick={() => onRequestAcquisition({ title: searchQuery })}
              className="p-4 rounded-2xl bg-slate-950 border border-emerald-800 hover:border-emerald-500 text-left transition group"
            >
              <PlusCircle size={20} className="text-emerald-400 mb-2" />
              <div className="font-bold text-white group-hover:text-emerald-300">Request Acquisition</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Submit purchase request to College Librarian</div>
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('Everything');
                setSelectedBranch('All Branches');
                setAvailabilityFilter('all');
                sounds.playClick();
              }}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition group"
            >
              <RefreshCw size={20} className="text-slate-400 mb-2" />
              <div className="font-bold text-white group-hover:text-slate-200">Reset Search Filters</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Browse the complete library holdings</div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map(book => (
            <div
              key={book.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                        {book.callNumber || 'GEN-LIB'}
                      </span>
                      {book.courseCode && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {book.courseCode}
                        </span>
                      )}
                      {book.format && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                          {book.format}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition leading-snug pt-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {book.author} • {book.publisher} ({book.year})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      (book.copiesAvailable > 0 || book.isDigital)
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {book.isDigital 
                        ? 'E-Book Online' 
                        : (book.copiesAvailable > 0 ? `${book.copiesAvailable} Available` : 'Reserved Out')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {book.abstract || 'Institutional library academic holding with indexed full-text search capability.'}
                </p>

                {/* Smart Wayfinding & Branch Info */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                  <MapPin size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{book.branch?.split('(')[0] || 'Main Campus Library'} • {book.shelfLocation || 'Floor 2 / Open Stacks'}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <TraceBadge uri={`#/book/${book.id}`} />
                  <span>📖 {book.pdfPages || 280}p</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectBook(book)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-xs"
                  >
                    Details & Author
                  </button>
                  {book.isDigital && (
                    <button
                      onClick={() => onOpenReader(book)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-md shadow-emerald-950 transition text-xs active:scale-95"
                    >
                      <BookOpen size={13} /> Read E-Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
