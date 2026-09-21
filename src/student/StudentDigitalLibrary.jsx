import React, { useState } from 'react';
import {
  BookOpen, Download, Wifi, WifiOff, FileText, Video,
  Database, Sparkles, Filter, Search, Layers, Clock, Award
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function StudentDigitalLibrary({
  books,
  continueReading,
  onOpenReader,
  onSelectBook,
  user
}) {
  const [dataSaver, setDataSaver] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'eBooks' | 'Past Questions' | 'Theses' | 'Datasets'
  const [searchFilter, setSearchFilter] = useState('');

  const digitalBooks = books.filter(b => b.isDigital);

  const filteredDigital = digitalBooks.filter(b => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.subject.toLowerCase().includes(q);
    return matchesSearch;
  });

  const toggleDataSaver = () => {
    setDataSaver(!dataSaver);
    sounds.playClick();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header with Low-Data Saver Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
            DIGITAL REPOSITORY & E-MEDIA VAULT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Digital Library Hub</h2>
          <p className="text-xs text-slate-400">
            Instant full-text access to {digitalBooks.length}+ digitized textbooks, academic PDFs, past papers, and research datasets.
          </p>
        </div>

        {/* Data Saver Mode Toggle Button */}
        <button
          onClick={toggleDataSaver}
          className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition ${
            dataSaver
              ? 'bg-amber-950/80 border-amber-600 text-amber-300 shadow-lg shadow-amber-950'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Low-Bandwidth Optimized Mode"
        >
          {dataSaver ? <WifiOff size={15} className="text-amber-400" /> : <Wifi size={15} className="text-emerald-400" />}
          <span>Data Saver: <strong className={dataSaver ? 'text-amber-400' : 'text-slate-200'}>{dataSaver ? 'ON (Cached)' : 'OFF'}</strong></span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {['All Digital', 'eBooks & PDFs', 'Theses & Projects', 'Datasets & Media'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search digital titles..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Digital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDigital.map(book => (
          <div
            key={book.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 transition flex flex-col justify-between space-y-4 shadow-xl group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PDF E-BOOK • {book.pdfPages || 320} PAGES
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{book.fileSize || '5.4 MB'}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{book.author} • {book.publisher} ({book.year})</p>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {book.abstract}
              </p>

              {/* Chapters Pill Preview */}
              {book.chapters && (
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950/70 p-2 rounded-xl border border-slate-800 truncate">
                  📑 TOC: {book.chapters[0]?.title || 'Chapter 1'}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectBook(book)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Full Dossier
              </button>

              <button
                onClick={() => onOpenReader(book)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
              >
                <BookOpen size={13} /> Launch Reader
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
