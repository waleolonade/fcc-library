import React, { useState, useMemo, useEffect } from 'react';
import { Search, BookOpen, Layers, Filter, CheckCircle, Clock, ArrowRight, Sparkles, Building, Globe, ExternalLink, Building2 } from 'lucide-react';
import { INSTITUTION, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import PartnerLibrariesGateway from '../common/PartnerLibrariesGateway';
import TraceBadge from '../common/TraceBadge';
import { navigateTo, parseCurrentRoute } from '../utils/router';

export default function PublicDiscovery({ books, partnerLibraries = INITIAL_PARTNER_LIBRARIES, onSelectBook, onOpenLogin }) {
  const [activeView, setActiveView] = useState('catalog'); // 'catalog' | 'partner_libraries'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All'); // 'All' | 'Digital' | 'Physical'
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const subjects = ['All', 'Co-operative Economics', 'Computer Science', 'Banking & Finance', 'Agricultural Extension'];

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.callNumber.toLowerCase().includes(q) ||
        b.abstract.toLowerCase().includes(q);

      const matchSubject = selectedSubject === 'All' || b.subject === selectedSubject;
      const matchFormat = selectedFormat === 'All' || (selectedFormat === 'Digital' ? b.isDigital : !b.isDigital);
      const matchAvailable = !onlyAvailable || b.copiesAvailable > 0;

      return matchQuery && matchSubject && matchFormat && matchAvailable;
    });
  }, [books, searchQuery, selectedSubject, selectedFormat, onlyAvailable]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* OPAC Public Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-emerald-700/40 font-serif">
              FCC
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">{INSTITUTION.shortName}</div>
              <div className="text-[11px] text-emerald-400 font-medium">Public Discovery OPAC / Open Catalog</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveView('catalog')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'catalog'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} /> Local Catalog
            </button>
            <button
              onClick={() => setActiveView('partner_libraries')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'partner_libraries'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 size={14} /> Linked Partner Libraries ({partnerLibraries.length})
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition"
          >
            Patron / Staff Login <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {activeView === 'partner_libraries' ? (
          <PartnerLibrariesGateway partnerLibraries={partnerLibraries} />
        ) : (
          <>
            {/* Hero Search Box */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
                  <Sparkles size={13} className="text-emerald-400" />
                  Unified Institutional Catalog & Digital Repository
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Scholarly Holdings & E-Library Discovery
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  Explore catalog holdings for the Federal Co-operative College, Ibadan. Instant real-time stack availability, call numbers, and full-text e-book access.
                </p>

                {/* Input Bar */}
                <div className="relative pt-2">
                  <Search size={20} className="absolute left-4 top-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search across 125,000+ volumes, authors, ISBN, Call Numbers (e.g. HD2963, Adebayo, Raft)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Facet Controls & Filters */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter size={13} /> Subject Facets:
                </span>
                {subjects.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                      selectedSubject === s
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>In-Stock Only</span>
                </label>

                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="All">All Formats</option>
                  <option value="Digital">Digital E-Books Only</option>
                  <option value="Physical">Physical Volumes Only</option>
                </select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
              <span>Showing <strong>{filteredBooks.length}</strong> catalog records</span>
              <span>MARC21 Interop Active</span>
            </div>

            {/* Catalog Holdings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map(book => (
                <div
                  key={book.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-700/60 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">
                          {book.callNumber}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition mt-1.5 leading-snug">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{book.author} • {book.publisher} ({book.year})</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          book.copiesAvailable > 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {book.copiesAvailable > 0 ? `${book.copiesAvailable} Available` : 'Reserved Out'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {book.abstract}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <TraceBadge uri={`#/book/${book.id}`} />
                      <span>📖 {book.pdfPages}p</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-xs"
                      >
                        Details & Cite
                      </button>
                      {book.isDigital && (
                        <button
                          onClick={() => onSelectBook(book)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow transition text-xs"
                        >
                          <BookOpen size={13} /> E-Reader
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
