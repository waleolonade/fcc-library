import React, { useState } from 'react';
import {
  Layers, BookOpen, Download, FileText, CheckCircle,
  ExternalLink, User, Sparkles, ChevronRight, Award, Link2
} from 'lucide-react';
import TraceBadge from '../common/TraceBadge';
import { sounds } from '../utils/soundEffects';

export default function StudentCourseResources({
  books = [],
  courses = [],
  onSelectBook,
  onOpenReader,
  user
}) {
  const activeCourses = courses && courses.length > 0 ? courses : [];
  const [selectedCourseCode, setSelectedCourseCode] = useState(() => {
    if (activeCourses.length > 0) return activeCourses[0].code;
    return 'CEM 411';
  });

  const selectedCourse = activeCourses.find(c => c.code === selectedCourseCode) || activeCourses[0] || {
    code: 'CEM 411',
    title: 'Advanced Co-operative Economics & Management',
    department: 'Co-operative Economics & Management',
    faculty: 'Faculty of Management Sciences',
    level: 'HND II',
    lecturer: 'Prof. A. O. Adebayo',
    requiredTexts: [],
    recommendedTexts: [],
    pastExams: [],
    lecturePacks: []
  };

  // Extract required and recommended book IDs
  const requiredTexts = Array.isArray(selectedCourse.requiredTexts) ? selectedCourse.requiredTexts : [];
  const recommendedTexts = Array.isArray(selectedCourse.recommendedTexts) ? selectedCourse.recommendedTexts : [];
  const pastExams = Array.isArray(selectedCourse.pastExams) ? selectedCourse.pastExams : [];
  const lecturePacks = Array.isArray(selectedCourse.lecturePacks) ? selectedCourse.lecturePacks : [];

  const requiredBooks = books.filter(b => 
    requiredTexts.includes(b.id) || b.courseCode === selectedCourse.code || b.department === selectedCourse.department
  );
  const recommendedBooks = books.filter(b => 
    recommendedTexts.includes(b.id) && !requiredBooks.some(rb => rb.id === b.id)
  );

  const handleDownloadPastQuestion = (pq) => {
    sounds.playSuccessChime();
    alert(`Downloading verified past question: "${pq.title || pq}"`);
  };

  const handleDownloadLecture = (lm) => {
    sounds.playSuccessChime();
    alert(`Downloading syllabus lecture pack: "${lm.title || lm}"`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              ACADEMIC CURRICULUM & COURSE RESERVES
            </span>
            <TraceBadge uri={`#/courses?code=${selectedCourse.code}`} label="Course Link" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">My Course Resources</h2>
          <p className="text-xs text-slate-400">
            Official departmental course reserves, syllabus textbooks, and past exam question papers fetched directly from the institutional database.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono p-2.5 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          Enrolled Level: <strong className="text-emerald-400">{user?.level || 'HND II'}</strong>
        </div>
      </div>

      {/* Course Selector Tabs */}
      {activeCourses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {activeCourses.map(course => (
            <button
              key={course.code}
              onClick={() => {
                setSelectedCourseCode(course.code);
                sounds.playClick();
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
                selectedCourseCode === course.code
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950 scale-105'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="font-mono">{course.code}</span>
              <span className="text-[11px] opacity-80 hidden sm:inline">• {course.title?.split('&')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Course Content Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
        {/* Course Overview Banner */}
        <div className="border-b border-slate-800 pb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-800">
                  {selectedCourse.code} • {selectedCourse.level || 'Higher National Diploma'}
                </span>
                <TraceBadge uri={`#/courses?code=${selectedCourse.code}`} />
              </div>
              <h3 className="text-2xl font-black text-white mt-1.5">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedCourse.department} • {selectedCourse.faculty}</p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <User size={14} className="text-emerald-400" />
              <span>Lecturer: <strong className="text-white">{selectedCourse.lecturer}</strong></span>
            </div>
          </div>
        </div>

        {/* Required & Recommended Textbooks Grid */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-400" /> Required & Recommended Textbooks ({requiredBooks.length + recommendedBooks.length})
          </h4>

          {requiredBooks.length === 0 && recommendedBooks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              No specific books linked yet for this course. Browse the catalog to explore general holdings.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredBooks.map(book => (
                <div key={book.id} className="p-4 rounded-2xl bg-slate-950 border border-emerald-800/40 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 font-mono">REQUIRED TEXT</span>
                      <TraceBadge uri={`#/book/${book.id}`} label="Book Link" />
                    </div>
                    <h5 className="text-sm font-bold text-white mt-2 leading-snug">{book.title}</h5>
                    <p className="text-xs text-slate-400">{book.author} ({book.year || '2025'})</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2">
                    <span className="text-emerald-400 font-mono text-[11px]">{book.copiesAvailable || 1} copies available</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Dossier
                      </button>
                      {book.isDigital && (
                        <button
                          onClick={() => onOpenReader(book)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                        >
                          <BookOpen size={12} /> Read E-Book
                        </button>
                      )}
                      {book.isDigital && (
                        <TraceBadge uri={`#/read/${book.id}`} label="PDF Link" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {recommendedBooks.map(book => (
                <div key={book.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800 font-mono">RECOMMENDED TEXT</span>
                      <TraceBadge uri={`#/book/${book.id}`} label="Book Link" />
                    </div>
                    <h5 className="text-sm font-bold text-white mt-2 leading-snug">{book.title}</h5>
                    <p className="text-xs text-slate-400">{book.author} ({book.year || '2025'})</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2">
                    <span className="text-indigo-400 font-mono text-[11px]">{book.copiesAvailable || 1} copies available</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Dossier
                      </button>
                      {book.isDigital && (
                        <button
                          onClick={() => onOpenReader(book)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                        >
                          <BookOpen size={12} /> Read E-Book
                        </button>
                      )}
                      {book.isDigital && (
                        <TraceBadge uri={`#/read/${book.id}`} label="PDF Link" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Examination Papers & Lecture Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Past Questions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Award size={15} className="text-amber-400" /> Past Examination Archives
            </h4>

            <div className="space-y-2">
              {pastExams.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 font-mono">
                  No past questions uploaded for this semester yet.
                </div>
              ) : (
                pastExams.map((pq, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{typeof pq === 'string' ? pq : pq.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Verified Institutional Examination Paper</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TraceBadge uri={`#/file/past-question/${selectedCourse.code}/${i + 1}`} />
                      <button
                        onClick={() => handleDownloadPastQuestion(pq)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                        title="Download Past Question PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lecture Packs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <FileText size={15} className="text-teal-400" /> Lecturer Handouts & Notes
            </h4>

            <div className="space-y-2">
              {lecturePacks.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 font-mono">
                  No lecture packs uploaded yet for this course.
                </div>
              ) : (
                lecturePacks.map((lm, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{typeof lm === 'string' ? lm : lm.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Official Faculty Lecture Material</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TraceBadge uri={`#/file/lecture-pack/${selectedCourse.code}/${i + 1}`} />
                      <button
                        onClick={() => handleDownloadLecture(lm)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-teal-600 text-teal-400 hover:text-white transition"
                        title="Download Lecture PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

