import React, { useState } from 'react';
import { BookOpen, Bookmark, CheckCircle2, AlertTriangle, Layers, Sparkles, MapPin } from 'lucide-react';

export default function CourseReserves({ books, onSelectBook }) {
  const [selectedCourse, setSelectedCourse] = useState('CEM 411');

  const courseReserves = [
    {
      code: "CEM 411",
      title: "Advanced Cooperative Accounting & Apex Financial Management",
      lecturer: "Prof. A. O. Adebayo",
      department: "Co-operative Economics",
      requiredBookIds: ["FCC-B001", "FCC-B006"],
      recommendedBookIds: ["FCC-B003"]
    },
    {
      code: "CSC 301",
      title: "Distributed Systems, Consensus Protocols & ACID Databases",
      lecturer: "Dr. K. E. Okonjo",
      department: "Computer Science",
      requiredBookIds: ["FCC-B002", "FCC-B005"],
      recommendedBookIds: []
    },
    {
      code: "BNF 211",
      title: "Monetary Economics, Prudential Banking & Microfinance",
      lecturer: "Chief (Mrs.) Folake Sanusi",
      department: "Banking & Finance",
      requiredBookIds: ["FCC-B003"],
      recommendedBookIds: ["FCC-B001"]
    },
    {
      code: "AGR 305",
      title: "Smallholder Cocoa Agronomy & Agro-Industrial Cooperatives",
      lecturer: "Engr. T. J. Adeleke",
      department: "Agricultural Extension",
      requiredBookIds: ["FCC-B004"],
      recommendedBookIds: ["FCC-B001"]
    }
  ];

  const currentCourse = courseReserves.find(c => c.code === selectedCourse);

  const getBook = (id) => books.find(b => b.id === id);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-emerald-400" />
          Curriculum Syllabus Integration
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Course Reading Lists & Faculty Reserves
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Curated required and recommended library holdings linked directly to semester courses at the Federal Co-operative College.
        </p>
      </div>

      {/* Course Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {courseReserves.map(c => (
          <button
            key={c.code}
            onClick={() => setSelectedCourse(c.code)}
            className={`p-3.5 rounded-2xl border text-left transition ${
              selectedCourse === c.code
                ? 'bg-emerald-950 border-emerald-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-mono text-xs font-bold text-emerald-400">{c.code}</div>
            <div className="text-[11px] font-semibold line-clamp-1 mt-0.5 text-slate-200">{c.title}</div>
          </button>
        ))}
      </div>

      {/* Selected Course Details */}
      {currentCourse && (
        <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {currentCourse.code} • {currentCourse.department}
              </span>
              <h3 className="text-xl font-bold text-white mt-1.5">{currentCourse.title}</h3>
              <p className="text-xs text-slate-400">Course Lecturer: <strong className="text-slate-200">{currentCourse.lecturer}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                Semester 1 Syllabus Active
              </span>
            </div>
          </div>

          {/* Required Texts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-400" /> Mandatory Required Textbooks:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCourse.requiredBookIds.map(id => {
                const book = getBook(id);
                if (!book) return null;

                return (
                  <div
                    key={book.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-700/60 transition flex flex-col justify-between space-y-3 shadow"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400">
                          {book.callNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          book.copiesAvailable > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {book.copiesAvailable > 0 ? `${book.copiesAvailable} In-Stock` : 'On Loan'}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">{book.title}</h5>
                      <p className="text-xs text-slate-400">{book.author} ({book.year})</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <MapPin size={11} /> {book.shelfLocation}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                      <span className="text-[10px] text-emerald-400 font-bold">● Primary Course Reserve</span>
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
                      >
                        Details & Read
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Readings */}
          {currentCourse.recommendedBookIds.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Supplementary Recommended Readings:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCourse.recommendedBookIds.map(id => {
                  const book = getBook(id);
                  if (!book) return null;

                  return (
                    <div
                      key={book.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{book.title}</div>
                        <div className="text-[11px] text-slate-400">{book.author} • {book.callNumber}</div>
                      </div>
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
