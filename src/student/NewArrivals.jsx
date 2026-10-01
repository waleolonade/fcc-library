import React, { useState, useMemo } from 'react';
import { Sparkles, Filter, BookOpen, Clock, Tag, Building2, GraduationCap, Calendar } from 'lucide-react';

// =========================================================================
// NEW ARRIVALS — Recently added resources with filters
// Filters: Date, Subject, Resource Type, Department, Faculty
// =========================================================================

const FACULTIES = ['All Faculties', 'Faculty of Management Sciences', 'Faculty of Science & Computing', 'Faculty of Agricultural Sciences', 'Faculty of Engineering'];
const DEPARTMENTS = ['All Departments', 'Co-operative Economics & Management', 'Computer Science', 'Banking & Finance', 'Agricultural Extension & Management', 'Computer Engineering'];
const RESOURCE_TYPES = ['All Types', 'Book', 'E-Book', 'Journal', 'Article', 'Thesis', 'Report'];
const DATE_RANGES = ['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function NewArrivalCard({ book, onSelect, onRead }) {
  const isVeryNew = book.uploadedAt && new Date(book.uploadedAt) > new Date(daysAgo(7));
  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-700/40 transition-all flex flex-col justify-between group shadow">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">{book.callNumber}</span>
              {isVeryNew && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles size={9} /> New
                </span>
              )}
              {book.isDigital && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">Digital</span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition leading-snug">{book.title}</h3>
            <p className="text-xs text-slate-400">{book.author}</p>
            <p className="text-xs text-slate-500">{book.publisher} • {book.year}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border block ${book.copiesAvailable > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
              {book.copiesAvailable > 0 ? `${book.copiesAvailable} avail.` : 'On Reserve'}
            </span>
          </div>
        </div>
        {book.abstract && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{book.abstract}</p>
        )}
      </div>
      <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock size={11} />
          <span>{book.uploadedAt ? new Date(book.uploadedAt).toLocaleDateString('en-GB') : book.year}</span>
          <span>•</span>
          <span>{book.subject}</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onSelect && onSelect(book)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition">Details</button>
          {book.isDigital && (
            <button onClick={() => onRead && onRead(book)} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition">
              <BookOpen size={11} /> Read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewArrivals({ books = [], onSelectBook, onOpenReader }) {
  const [dateRange, setDateRange] = useState('All Time');
  const [subject, setSubject] = useState('All');
  const [resourceType, setResourceType] = useState('All Types');
  const [department, setDepartment] = useState('All Departments');
  const [faculty, setFaculty] = useState('All Faculties');

  const subjects = useMemo(() => ['All', ...Array.from(new Set(books.map(b => b.subject).filter(Boolean)))], [books]);

  // Sort by uploadedAt desc, fallback to year desc
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      if (a.uploadedAt && b.uploadedAt) return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (a.uploadedAt) return -1;
      if (b.uploadedAt) return 1;
      return (b.year || 0) - (a.year || 0);
    });
  }, [books]);

  const filteredBooks = useMemo(() => {
    return sortedBooks.filter(book => {
      // Date filter
      if (dateRange !== 'All Time') {
        const daysMap = { 'Last 7 Days': 7, 'Last 30 Days': 30, 'Last 90 Days': 90, 'This Year': 365 };
        const cutoff = new Date(daysAgo(daysMap[dateRange]));
        const bookDate = book.uploadedAt ? new Date(book.uploadedAt) : new Date(`${book.year}-01-01`);
        if (bookDate < cutoff) return false;
      }
      // Subject filter
      if (subject !== 'All' && book.subject !== subject) return false;
      // Resource type filter
      if (resourceType !== 'All Types') {
        const bType = book.resourceType || (book.isDigital ? 'E-Book' : 'Book');
        if (bType !== resourceType) return false;
      }
      // Department filter
      if (department !== 'All Departments' && book.department !== department) return false;
      // Faculty filter (derive from department for now)
      return true;
    });
  }, [sortedBooks, dateRange, subject, resourceType, department]);

  const newThisWeek = useMemo(() => books.filter(b => b.uploadedAt && new Date(b.uploadedAt) > new Date(daysAgo(7))).length, [books]);
  const newThisMonth = useMemo(() => books.filter(b => b.uploadedAt && new Date(b.uploadedAt) > new Date(daysAgo(30))).length, [books]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-emerald-400" />
          <h2 className="text-2xl font-black text-white">New Arrivals</h2>
        </div>
        <p className="text-slate-400 text-sm">Recently added resources to the FCC Ibadan collection</p>
        <div className="flex gap-4 text-sm mt-2">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-emerald-400">{newThisWeek}</span>
            <p className="text-xs text-slate-400">This Week</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-extrabold text-teal-400">{newThisMonth}</span>
            <p className="text-xs text-slate-400">This Month</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-extrabold text-indigo-400">{books.length}</span>
            <p className="text-xs text-slate-400">Total Catalogue</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Filter size={13} /> Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Date Range', value: dateRange, options: DATE_RANGES, onChange: setDateRange },
            { label: 'Subject', value: subject, options: subjects, onChange: setSubject },
            { label: 'Resource Type', value: resourceType, options: RESOURCE_TYPES, onChange: setResourceType },
            { label: 'Department', value: department, options: DEPARTMENTS, onChange: setDepartment },
            { label: 'Faculty', value: faculty, options: FACULTIES, onChange: setFaculty },
          ].map(({ label, value, options, onChange }) => (
            <div key={label}>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">{label}</label>
              <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}</span>
          <button onClick={() => { setDateRange('All Time'); setSubject('All'); setResourceType('All Types'); setDepartment('All Departments'); setFaculty('All Faculties'); }} className="text-indigo-400 hover:text-indigo-300 transition">Reset filters</button>
        </div>
      </div>

      {/* Results */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Sparkles size={36} className="mx-auto text-slate-700" />
          <p className="text-slate-400">No new arrivals match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map(book => (
            <NewArrivalCard key={book.id} book={book} onSelect={onSelectBook} onRead={onOpenReader} />
          ))}
        </div>
      )}
    </div>
  );
}
