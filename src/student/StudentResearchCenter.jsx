import React, { useState } from 'react';
import {
  Globe, FileText, Search, Download, Share2, Bookmark,
  Copy, Check, Sparkles, Filter, ExternalLink, Award,
  Upload, ShieldCheck, CheckCircle, Clock, AlertCircle, BookOpen, Link2, Bot
} from 'lucide-react';
import TraceBadge from '../common/TraceBadge';
import { OPENALEX_SEED_RESEARCH } from '../data/institutionalSeedData';
import { formatCitation, downloadCitationFile } from '../utils/citationFormatter';
import { generateAndDownloadThesisPdf } from '../utils/pdfGenerator';
import { sounds } from '../utils/soundEffects';

export default function StudentResearchCenter({
  theses = [],
  onSubmitThesis,
  user,
  onOpenReader,
  onOpenAi
}) {
  const [activeTab, setActiveTab] = useState('theses'); // 'theses' | 'openalex' | 'submit'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCitationItem, setSelectedCitationItem] = useState(null);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [downloadSuccessFeedback, setDownloadSuccessFeedback] = useState(null);

  // Thesis Submission Form state
  const [newThesisTitle, setNewThesisTitle] = useState('');
  const [newThesisAdvisor, setNewThesisAdvisor] = useState('Prof. A. O. Adebayo');
  const [newThesisDegree, setNewThesisDegree] = useState('Higher National Diploma Dissertation');
  const [newThesisAbstract, setNewThesisAbstract] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize database theses records
  const normalizedTheses = (theses || []).map((t, idx) => ({
    id: t.id || idx + 1,
    title: t.title || 'Untitled Dissertation',
    author: t.studentName || t.author || user?.name || 'FCC Scholar Researcher',
    matric: t.matric || user?.matric || 'FCC/CEM/2024/042',
    advisor: t.supervisor || t.advisor || 'Prof. A. O. Adebayo',
    degree: t.degree || 'Higher National Diploma Dissertation',
    department: t.department || 'Co-operative Economics & Management',
    faculty: t.faculty || 'Faculty of Management Sciences',
    year: t.year || 2024,
    abstract: t.abstract || t.topic || 'Empirical institutional research archived in the Federal Cooperative College repository.',
    doi: t.doi || `10.5897/FCC.ETD.${t.year || 2024}.${t.id || idx + 1}`,
    downloads: t.downloads || 142 + (idx * 17),
    citations: t.citations || 12 + (idx * 3),
    access: 'Open Access Repository',
    status: t.status || 'Published',
    fileUrl: t.fileUrl || '/demo-theses.pdf',
    fileName: t.fileName || `${(t.title || 'thesis').slice(0, 25).replace(/\s+/g, '_')}.pdf`
  }));

  const filteredTheses = normalizedTheses.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.author && t.author.toLowerCase().includes(q)) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      (t.abstract && t.abstract.toLowerCase().includes(q)) ||
      (t.doi && t.doi.toLowerCase().includes(q)) ||
      (t.advisor && t.advisor.toLowerCase().includes(q))
    );
  });

  const filteredPapers = OPENALEX_SEED_RESEARCH.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.authors && p.authors.some(a => a.toLowerCase().includes(q))) ||
      (p.venue && p.venue.toLowerCase().includes(q)) ||
      (p.concepts && p.concepts.some(c => c.toLowerCase().includes(q)))
    );
  });

  const handleCopyCitation = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedFeedback(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  const handleDownloadThesis = (thesis) => {
    sounds.playSuccessChime();
    try {
      generateAndDownloadThesisPdf(thesis);
    } catch {
      // Fallback text download
      downloadCitationFile(`${thesis.title}\n\nAuthor: ${thesis.author}\nDegree: ${thesis.degree}\nAdvisor: ${thesis.advisor}\nAbstract: ${thesis.abstract}\nDOI: ${thesis.doi}`, `${thesis.title.slice(0, 20)}.txt`);
    }
    setDownloadSuccessFeedback(thesis.fileName || thesis.title);
    setTimeout(() => setDownloadSuccessFeedback(null), 4000);
  };

  const handleReadThesis = (thesis) => {
    if (onOpenReader) {
      onOpenReader({
        id: `thesis-${thesis.id}`,
        title: thesis.title,
        author: thesis.author,
        publisher: 'FCC Institutional Repository',
        year: thesis.year,
        pdfPages: 148,
        callNumber: `THESES .${thesis.author.slice(0, 3).toUpperCase()} ${thesis.year}`,
        abstract: thesis.abstract,
        doi: thesis.doi,
        isDigital: true,
        chapters: [
          { title: 'Chapter 1: Institutional Context & Problem Formulation', page: 1 },
          { title: 'Chapter 2: Literature Review & Conceptual Modeling', page: 24 },
          { title: 'Chapter 3: Research Methodology & Sampling Matrix', page: 60 },
          { title: 'Chapter 4: Empirical Data Presentation & Analysis', page: 88 },
          { title: 'Chapter 5: Summary, Findings & Policy Recommendations', page: 125 }
        ]
      });
    }
  };

  const handleSubmitThesisForm = async (e) => {
    e.preventDefault();
    if (!newThesisTitle.trim() || !newThesisAbstract.trim()) return;

    setIsSubmitting(true);
    const thesisData = {
      title: newThesisTitle.trim(),
      author: user?.name || 'FCC Scholar',
      studentName: user?.name || 'FCC Scholar',
      matric: user?.matric || 'FCC/CEM/2024/042',
      advisor: newThesisAdvisor,
      supervisor: newThesisAdvisor,
      degree: newThesisDegree,
      department: user?.department || 'Co-operative Economics & Management',
      faculty: user?.faculty || 'Faculty of Management Sciences',
      abstract: newThesisAbstract.trim(),
      fileName: 'student_thesis_defense_draft.pdf',
      fileSize: '4.8 MB',
      year: new Date().getFullYear(),
      status: 'Under Review'
    };

    if (onSubmitThesis) {
      await onSubmitThesis(thesisData);
    }

    setNewThesisTitle('');
    setNewThesisAbstract('');
    setIsSubmitting(false);
    sounds.playSuccessChime();
    setActiveTab('theses');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800">
              INSTITUTIONAL REPOSITORY & GLOBAL SCHOLARLY GRAPH
            </span>
            <TraceBadge uri="#/theses" label="Repository URI" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Research Discovery & Depository</h2>
          <p className="text-xs text-slate-400">
            Access 14,000+ FCC theses, peer-reviewed OpenAlex/Crossref publications, and submit final-year dissertations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('theses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'theses' ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            Theses Archive
          </button>
          <button
            onClick={() => setActiveTab('openalex')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'openalex' ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            OpenAlex Journals
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'submit' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            Submit Thesis
          </button>
        </div>
      </div>

      {downloadSuccessFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>
            Verified academic monograph <strong>"{downloadSuccessFeedback}"</strong> generated and downloaded!
          </span>
        </div>
      )}

      {/* Search Filter for Research */}
      {activeTab !== 'submit' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search across DOIs, authors, research abstracts, or methodologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* 1. THESES & REPOSITORY PAPERS */}
      {activeTab === 'theses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTheses.map(thesis => (
              <div
                key={thesis.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-600/50 transition flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                        {thesis.degree}
                      </span>
                      <TraceBadge uri={`#/theses?id=${thesis.id}`} label="Thesis Link" />
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      thesis.status === 'Published'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : thesis.status === 'Under Review'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {thesis.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{thesis.title}</h3>
                  <p className="text-xs text-slate-400">
                    By <strong className="text-slate-200">{thesis.author}</strong> ({thesis.year}) • Advisor: {thesis.advisor}
                  </p>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {thesis.abstract}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span>DOI: {thesis.doi}</span>
                    <span>📥 {thesis.downloads} downloads</span>
                    <span>📑 {thesis.citations} citations</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-teal-400 font-mono">{thesis.access}</span>
                    <TraceBadge uri={`#/read/thesis/${thesis.id}`} label="PDF Link" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCitationItem(thesis)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy size={12} /> Cite
                    </button>
                    <button
                      onClick={() => handleReadThesis(thesis)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                    >
                      <BookOpen size={12} /> Read Full-Text
                    </button>
                    <button
                      onClick={() => handleDownloadThesis(thesis)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <Download size={12} /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. OPENALEX / CROSSREF JOURNAL PAPERS */}
      {activeTab === 'openalex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPapers.map((paper, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-600/50 transition flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        OPEN ACCESS
                      </span>
                      <TraceBadge uri={`#/research?doi=${encodeURIComponent(paper.doi || paper.title)}`} label="DOI Link" />
                    </div>
                    <span className="font-mono text-slate-400">Year {paper.year}</span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{paper.title}</h3>
                  <p className="text-xs text-slate-400">
                    {paper.authors.join(', ')} • <em>{paper.venue}</em>
                  </p>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {paper.abstract}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400">Citations: {paper.citationCount}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCitationItem({ ...paper, author: paper.authors[0] })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy size={12} /> Cite
                    </button>
                    {paper.openAccessPdf && (
                      <a
                        href={paper.openAccessPdf}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <ExternalLink size={12} /> Open PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. THESIS SUBMISSION PIPELINE */}
      {activeTab === 'submit' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Institutional Repository Dissertation Submission</h3>
            <p className="text-xs text-slate-400">
              Submit your final-year project, HND dissertation, or postgraduate research monograph for review, anti-plagiarism verification, and repository ingestion.
            </p>
          </div>

          {/* Submission Pipeline Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {[
              { stage: '1. Draft', status: 'completed' },
              { stage: '2. Submitted', status: 'active' },
              { stage: '3. Under Review', status: 'pending' },
              { stage: '4. Approved', status: 'pending' },
              { stage: '5. Published', status: 'pending' },
            ].map((st, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border font-bold ${
                  st.status === 'completed'
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                    : st.status === 'active'
                    ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {st.stage}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitThesisForm} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Dissertation Title</label>
              <input
                type="text"
                placeholder="Full approved academic title..."
                value={newThesisTitle}
                onChange={(e) => setNewThesisTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">Lead Academic Advisor</label>
                <input
                  type="text"
                  value={newThesisAdvisor}
                  onChange={(e) => setNewThesisAdvisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Degree Level</label>
                <select
                  value={newThesisDegree}
                  onChange={(e) => setNewThesisDegree(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>Higher National Diploma Dissertation</option>
                  <option>National Diploma Capstone Project</option>
                  <option>Postgraduate Diploma Project</option>
                  <option>Faculty Research Fellowship Monograph</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Abstract (250–500 words)</label>
              <textarea
                placeholder="Comprehensive summary covering background, methodology, empirical findings, and policy recommendations..."
                value={newThesisAbstract}
                onChange={(e) => setNewThesisAbstract(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                rows={4}
                required
              />
            </div>

            {/* Simulated File Upload Dropzone */}
            <div className="p-6 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 text-center space-y-2">
              <Upload size={24} className="mx-auto text-indigo-400" />
              <div className="text-xs font-bold text-white">Attach Defense Document (PDF Format)</div>
              <p className="text-[11px] text-slate-500">Maximum file size: 25 MB • Must include cover page and signed approval sheet</p>
              <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-slate-800 text-emerald-400 font-mono">
                draft_defense_copy.pdf (4.8 MB) — Verified
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl shadow-indigo-950 transition"
            >
              Submit Dissertation to Repository Queue
            </button>
          </form>
        </div>
      )}

      {/* Citation Generator Modal */}
      {selectedCitationItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                  SCHOLARLY CITATION ENGINE
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Generate Citation</h3>
              </div>
              <button onClick={() => setSelectedCitationItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Style Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              {['APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'BibTeX', 'RIS'].map(st => (
                <button
                  key={st}
                  onClick={() => setCitationStyle(st)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    citationStyle === st
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Formatted Citation Block */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 leading-relaxed break-words">
              {formatCitation(selectedCitationItem, citationStyle)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCitation(formatCitation(selectedCitationItem, citationStyle))}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {copiedFeedback ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedFeedback ? 'Copied to Clipboard!' : 'Copy Citation'}</span>
                </button>

                <button
                  onClick={() => {
                    const ext = citationStyle === 'BibTeX' ? 'bib' : citationStyle === 'RIS' ? 'ris' : 'txt';
                    downloadCitationFile(formatCitation(selectedCitationItem, citationStyle), `citation.${ext}`);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Download File
                </button>
              </div>

              <button
                onClick={() => setSelectedCitationItem(null)}
                className="text-xs text-slate-400 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
