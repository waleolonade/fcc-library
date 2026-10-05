import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, BookOpen, Star, Bookmark, Filter, RefreshCw, CheckCircle2,
  ExternalLink, Layers, Database, Sparkles, BookCheck, Clock, MapPin,
  ChevronRight, ArrowUpDown, UserCheck, ShieldCheck, Globe, Building2,
  Send, Quote, AlertCircle, X, Award, FileText, Check
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import TraceBadge from '../common/TraceBadge';

export default function LmsApiExplorer({
  user,
  onSelectBook,
  onOpenReader,
  onReserve
}) {
  const [activeSubTab, setActiveSubTab] = useState('books'); // 'books' | 'authors' | 'recommendations' | 'api_docs'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [digitalOnly, setDigitalOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Data states
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState({ departments: [], subjects: [] });
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [reservingBookId, setReservingBookId] = useState(null);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, statsRes, catRes, authorsRes, recRes] = await Promise.all([
        libraryApi.lms.getBooks({
          q: searchQuery,
          department: selectedDept !== 'All' ? selectedDept : '',
          available_only: availabilityOnly,
          is_digital: digitalOnly ? true : '',
          sort: sortBy,
          per_page: 24
        }),
        libraryApi.lms.getStats(),
        libraryApi.lms.getCategories(),
        libraryApi.authors.getAll(),
        libraryApi.recommendations.getForPatron(user?.matric || '')
      ]);

      if (booksRes && booksRes.data) {
        setBooks(booksRes.data);
      }
      if (statsRes) {
        setStats(statsRes);
      }
      if (catRes) {
        setCategories(catRes);
      }
      if (authorsRes && authorsRes.data) {
        setAuthors(authorsRes.data);
      }
      if (recRes && recRes.data) {
        setRecommendations(recRes.data);
      }
    } catch (err) {
      console.warn('LMS API load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept, availabilityOnly, digitalOnly, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleReserveBook = async (book) => {
    setReservingBookId(book.id);
    const patronId = user?.matric || user?.email || 'STUDENT-PATRON';
    try {
      await libraryApi.reservations.create({
        book_id: book.id,
        user_identifier: patronId,
        reserved_from: new Date().toISOString().split('T')[0],
        reserved_to: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: `Reservation via LMS Academic Explorer for ${patronId}`
      });
      sounds.playSuccessChime();
      setFeedbackMsg(`Hold confirmed for "${book.title}". Reserved under Patron [${patronId}].`);
      if (onReserve) onReserve(book);
      setTimeout(() => setFeedbackMsg(''), 5000);
      // Refresh count
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setReservingBookId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* 1. LMS API MASTHEAD BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021d13] via-[#03291b] to-[#01140d] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl text-emerald-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono font-bold flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LMS REST API v2.0 • Online (Active)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#021810] text-emerald-400 border border-emerald-800 text-[11px] font-mono">
                /api/lms/books
              </span>
              <TraceBadge uri="#/library_lms" label="#/library_lms" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              LMS Academic Library API Hub
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
              Integrated from the Global Library Management System. Provides dedicated endpoints for book discovery, live stack holdings, automated hold queues, scholar reviews, and institutional authors.
            </p>
          </div>

          {/* Quick Stats Ribbon */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#021810]/80 p-3.5 rounded-2xl border border-emerald-800/80 shrink-0">
              <div className="text-center px-2">
                <div className="text-lg font-black text-white font-mono">{stats.total_books}</div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-tight">Holdings</div>
              </div>
              <div className="text-center px-2 border-l border-emerald-800/60">
                <div className="text-lg font-black text-emerald-300 font-mono">{stats.digital_books}</div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-tight">E-Monographs</div>
              </div>
              <div className="text-center px-2 border-l border-emerald-800/60">
                <div className="text-lg font-black text-amber-400 font-mono">{stats.average_rating} ★</div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-tight">Avg Rating</div>
              </div>
              <div className="text-center px-2 border-l border-emerald-800/60">
                <div className="text-lg font-black text-teal-300 font-mono">{stats.total_reservations}</div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-tight">Active Holds</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-100 text-xs flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-emerald-800/60 pb-2 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'books', label: 'Search & Books Catalog', icon: Search, badge: books.length },
          { id: 'authors', label: 'Authors Directory', icon: UserCheck, badge: authors.length },
          { id: 'recommendations', label: 'Smart Recommendations', icon: Sparkles, badge: recommendations.length },
          { id: 'api_docs', label: 'API Architecture & Live Endpoints', icon: Database }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                setActiveSubTab(tab.id);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-emerald-800 text-white' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}
      {activeSubTab === 'books' && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <form onSubmit={handleSearchSubmit} className="space-y-3 p-4 rounded-2xl bg-[#021810] border border-emerald-800/80 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Search LMS API by Title, Author, Keyword, Subject, ISBN, or Call Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#032317] border border-emerald-800 text-emerald-50 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-emerald-500/60 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      fetchData();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Fetch via LMS API</span>
              </button>
            </div>

            {/* Department / Category Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
              <span className="text-[11px] font-mono text-emerald-400 shrink-0 mr-1">Facets:</span>
              {['All', 'Computer Science', 'Banking & Finance', 'Co-operative Economics', 'Agricultural Extension', 'General Studies'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 border ${
                    selectedDept === dept
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#032317] text-emerald-300 border-emerald-800 hover:border-emerald-600'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Sub-Filters: Available In-Stack, Digital Only, Sorting */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-900/60 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-200 select-none">
                  <input
                    type="checkbox"
                    checked={availabilityOnly}
                    onChange={(e) => setAvailabilityOnly(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Available in Stacks Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-emerald-200 select-none">
                  <input
                    type="checkbox"
                    checked={digitalOnly}
                    onChange={(e) => setDigitalOnly(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Digital E-Books Only</span>
                </label>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-emerald-400 font-mono text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#032317] border border-emerald-800 text-emerald-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="relevance">Relevance / Rating</option>
                  <option value="newest">Newest Publication</option>
                  <option value="title">Title (A - Z)</option>
                  <option value="author">Author (A - Z)</option>
                  <option value="copies">Most Copies in Stack</option>
                </select>
              </div>
            </div>
          </form>

          {/* BOOKS RESULT GRID */}
          {loading ? (
            <div className="p-16 text-center rounded-3xl bg-[#021810] border border-emerald-900/80 space-y-3">
              <RefreshCw size={28} className="animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-emerald-300 font-mono">Querying LMS Academic Library API records...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#021810] border border-emerald-900/80 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                <BookOpen size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">No Books Found for this Query</h3>
              <p className="text-xs text-emerald-300/80 max-w-sm mx-auto">
                Try loosening your filters, removing keywords, or resetting the department facet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => {
                const isAvail = (book.copiesAvailable !== undefined ? book.copiesAvailable : (book.copies_available || 1)) > 0;
                const copiesCount = book.copiesAvailable !== undefined ? book.copiesAvailable : (book.copies_available || 1);
                const totalCopies = book.copiesTotal || book.copies_total || 3;

                return (
                  <div
                    key={book.id}
                    className="p-5 rounded-2xl bg-[#021810] border border-emerald-900/70 hover:border-emerald-600 transition flex flex-col justify-between shadow-xl space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#032317] text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                          {book.callNumber || book.call_number || 'GEN-LIB'}
                        </span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
                          <span>★ {book.rating || 5.0}</span>
                          {book.reviews_count !== undefined && book.reviews_count > 0 && (
                            <span className="text-[10px] text-emerald-400">({book.reviews_count})</span>
                          )}
                        </div>
                      </div>

                      {/* Title & Author */}
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition line-clamp-2 leading-snug">
                          {book.title}
                        </h3>
                        <p className="text-xs text-emerald-400/90 mt-0.5 truncate">
                          {book.author} {book.year ? `(${book.year})` : ''}
                        </p>
                      </div>

                      {/* Abstract / Scope */}
                      <p className="text-xs text-emerald-200/80 line-clamp-2 leading-relaxed">
                        {book.abstract || 'Curated institutional academic text aligned with NBTE syllabus standards.'}
                      </p>

                      {/* Shelf Location & Availability */}
                      <div className="p-2.5 rounded-xl bg-[#032317] border border-emerald-900/60 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400/80">Stack Status:</span>
                          <span className={`font-bold ${isAvail ? 'text-emerald-300' : 'text-rose-400'}`}>
                            {isAvail ? `${copiesCount} of ${totalCopies} Available` : 'All Copies Checked Out'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-emerald-400/70">
                          <span>Shelf: {book.shelfLocation || book.shelf_location || 'Main Stacks'}</span>
                          <span>{book.department || 'Academic'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          if (onSelectBook) onSelectBook(book);
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-[#032317] hover:bg-emerald-950 text-emerald-200 hover:text-white text-xs font-semibold border border-emerald-800 transition text-center"
                      >
                        Details & Reviews
                      </button>

                      {book.isDigital && (
                        <button
                          onClick={() => {
                            sounds.playSuccessChime();
                            if (onOpenReader) onOpenReader(book);
                          }}
                          className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                          title="Read Online"
                        >
                          <BookOpen size={13} />
                          <span>Read</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleReserveBook(book)}
                        disabled={reservingBookId === book.id}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                        title="Place Hold Reservation"
                      >
                        {reservingBookId === book.id ? <RefreshCw size={13} className="animate-spin" /> : <BookCheck size={13} />}
                        <span>Hold</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AUTHORS DIRECTORY SUB-TAB */}
      {activeSubTab === 'authors' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Institutional Scholars & Author Authority Records</h2>
              <p className="text-xs text-emerald-300">Registered academic researchers, textbook authors, and faculty chairs.</p>
            </div>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
              {authors.length} Verified Authors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authors.map((auth) => (
              <div
                key={auth.id}
                className="p-5 rounded-2xl bg-[#021810] border border-emerald-900/70 space-y-3 shadow-lg hover:border-emerald-600 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-900/50 border border-emerald-700 flex items-center justify-center font-bold text-emerald-300 text-lg">
                    {auth.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{auth.name}</h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      {auth.credentials || 'Academic Author & Researcher'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-emerald-200/80 leading-relaxed">
                  {auth.bio || `Specializes in empirical methodologies and academic literature at ${auth.affiliation || 'Federal Cooperative College'}.`}
                </p>

                <div className="pt-2 border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-emerald-400/80">Affiliation: {auth.affiliation || 'FCC Directorate'}</span>
                  {auth.orcid && (
                    <a
                      href={`https://orcid.org/${auth.orcid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 hover:text-white underline"
                    >
                      ORCID: {auth.orcid}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS SUB-TAB */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Algorithmic Academic Recommendations</h2>
              <p className="text-xs text-emerald-300">Intelligently ranked works based on curriculum affinity and scholar demand.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
              Affinity Engine Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl bg-[#021810] border border-emerald-900/70 hover:border-emerald-600 transition flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-[10px] font-mono">
                    💡 Verified Curriculum Match: {rec.subject || 'Economics & Management'}
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-2">{rec.title}</h3>
                  <p className="text-xs text-emerald-400">{rec.author} ({rec.year || 2024})</p>
                  <p className="text-xs text-emerald-200/80 line-clamp-2">{rec.abstract}</p>
                </div>

                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (onSelectBook) onSelectBook(rec);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-[#032317] hover:bg-emerald-950 text-emerald-200 text-xs font-semibold border border-emerald-800 text-center"
                  >
                    View Details
                  </button>
                  {rec.isDigital && (
                    <button
                      onClick={() => {
                        sounds.playSuccessChime();
                        if (onOpenReader) onOpenReader(rec);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API DOCS & LIVE ENDPOINTS SUB-TAB */}
      {activeSubTab === 'api_docs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-800/80 space-y-1">
            <h2 className="text-sm font-bold text-white">LMS Academic API Specification & Endpoints</h2>
            <p className="text-xs text-emerald-300">
              Interactive documentation for developers, mobile apps, and student research scripts connecting to the backend SQLite/MySQL engine.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { method: 'GET', path: '/api/lms/books', desc: 'Search and paginate library collection with multi-field search and copy availability status.', params: 'q, department, is_digital, available_only, min_rating, sort, per_page' },
              { method: 'GET', path: '/api/lms/books/{id}', desc: 'Retrieve single book with full author profile, review aggregates, and active hold queue details.', params: 'id (e.g. FCC-B001)' },
              { method: 'GET', path: '/api/lms/search', desc: 'Unified search endpoint returning schema-normalized records for multi-source engines.', params: 'q, limit' },
              { method: 'POST', path: '/api/book-reservations', desc: 'Create hold reservation for physical book under student matric/identifier.', params: 'book_id, user_identifier, reserved_from, reserved_to' },
              { method: 'GET', path: '/api/books/{id}/reviews', desc: 'Fetch verified community reviews and dynamic average star rating for a book.', params: 'id' },
              { method: 'POST', path: '/api/books/{id}/reviews', desc: 'Submit a new review and star rating (1-5) for a book.', params: 'reviewer_name, rating, comment' },
              { method: 'GET', path: '/api/authors', desc: 'Query author authority directory with ORCID and institutional affiliations.', params: 'search' },
              { method: 'GET', path: '/api/recommendations', desc: 'Dynamic affinity-based recommendations based on patron borrowing history.', params: 'matric' },
              { method: 'GET', path: '/api/fines', desc: 'List circulation fines and calculate overdue amounts based on loan return dates.', params: 'status, matric' }
            ].map((ep, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/70 space-y-1.5 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ep.method === 'GET' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-teal-950 text-teal-300 border border-teal-700'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-bold text-white text-xs">{ep.path}</span>
                </div>
                <p className="text-emerald-200/80 font-sans text-xs">{ep.desc}</p>
                <div className="text-[10px] text-emerald-400/80 pt-1">
                  Parameters: <span className="text-emerald-300">{ep.params}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
