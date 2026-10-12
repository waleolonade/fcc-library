import React, { useState, useEffect } from 'react';
import { BookOpen, Bookmark, CheckCircle2, AlertTriangle, Layers, Sparkles, MapPin, FileText, Download, Calendar, GraduationCap } from 'lucide-react';
import { libraryApi } from '../api/libraryApi';

export default function CourseReserves({ books = [], onSelectBook }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      try {
        setIsLoading(true);
        const data = await libraryApi.courses.getAll();
        if (isMounted && Array.isArray(data)) {
          setCourses(data);
          if (data.length > 0 && !selectedCourse) {
            setSelectedCourse(data[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to load courses from database:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCourses();
    return () => { isMounted = false; };
  }, []);

  const currentCourse = courses.find(c => c.code === selectedCourse) || courses[0] || null;

  const getBook = (id) => books.find(b => b.id?.toUpperCase() === id?.toUpperCase());

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-emerald-400" />
          Live Curriculum & Database Integration
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Course Reading Lists & Faculty Reserves
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Curated required and recommended library holdings linked directly to semester courses at the Federal Co-operative College.
        </p>
      </div>

      {isLoading && (
        <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading courses from institution database...</p>
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
          <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-200">No course reserves registered in database yet.</p>
          <p className="text-xs text-slate-500 mt-1">Course reading lists will appear once faculty curricula are uploaded.</p>
        </div>
      )}

      {/* Course Selector Tabs */}
      {!isLoading && courses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {courses.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCourse(c.code)}
              className={`p-3.5 rounded-2xl border text-left transition ${
                selectedCourse === c.code
                  ? 'bg-emerald-950 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="font-mono text-xs font-bold text-emerald-400">{c.code}</div>
              <div className="text-[11px] font-semibold line-clamp-1 mt-0.5 text-slate-200">{c.title}</div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Course Details */}
      {!isLoading && currentCourse && (
        <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {currentCourse.code} • {currentCourse.department}
                </span>
                {currentCourse.level && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {currentCourse.level}
                  </span>
                )}
                {currentCourse.faculty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/60 text-slate-400">
                    {currentCourse.faculty}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-2">{currentCourse.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Course Lecturer: <strong className="text-slate-200">{currentCourse.lecturer || 'Faculty Assigned'}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {currentCourse.semester || 'Semester Active'} Syllabus
              </span>
            </div>
          </div>

          {/* Course Syllabus Overview */}
          {currentCourse.syllabus && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap size={14} /> Approved Course Syllabus & Scope
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentCourse.syllabus}
              </p>
            </div>
          )}

          {/* Required Texts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-emerald-400" /> Mandatory Required Textbooks:
            </h4>

            {(!currentCourse.requiredBookIds || currentCourse.requiredBookIds.length === 0) ? (
              <p className="text-xs text-slate-500 italic">No specific required textbook assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCourse.requiredBookIds.map(id => {
                  const book = getBook(id);
                  if (!book) {
                    return (
                      <div key={id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                        <span className="font-mono text-emerald-400 font-bold">{id}</span>
                        <p className="text-slate-400 text-xs mt-1">Reference textbook in institutional reserves.</p>
                      </div>
                    );
                  }

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
                        {book.shelfLocation && (
                          <p className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                            <MapPin size={11} /> {book.shelfLocation}
                          </p>
                        )}
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
            )}
          </div>

          {/* Recommended Readings */}
          {currentCourse.recommendedBookIds && currentCourse.recommendedBookIds.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Supplementary Recommended Readings:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCourse.recommendedBookIds.map(id => {
                  const book = getBook(id);
                  if (!book) {
                    return (
                      <div key={id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                        <span className="font-mono text-slate-400 font-semibold">{id}</span>
                      </div>
                    );
                  }

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

          {/* Past Examination Papers from Database */}
          {currentCourse.pastQuestions && currentCourse.pastQuestions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-400" /> Past Examination Papers & Model Solutions:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentCourse.pastQuestions.map((pq, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">{pq.title}</div>
                      <div className="text-[11px] text-slate-400">{pq.year} • {pq.size || 'PDF'}</div>
                    </div>
                    <button
                      onClick={() => alert(`Accessing examination document: ${pq.title}`)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Download size={11} /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lecture Materials & Packs */}
          {currentCourse.lectureMaterials && currentCourse.lectureMaterials.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-amber-400" /> Faculty Lecture Notes & Handouts:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentCourse.lectureMaterials.map((lm, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">Week {lm.week}: {lm.title}</div>
                      <div className="text-[11px] text-slate-400">{lm.file}</div>
                    </div>
                    <button
                      onClick={() => alert(`Opening lecture handout: ${lm.title}`)}
                      className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Download size={11} /> Handout
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
