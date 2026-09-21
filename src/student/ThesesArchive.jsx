import React, { useState } from 'react';
import { Plus, Download, FileText, Search, CheckCircle, Sparkles, Filter, ExternalLink, X, Upload } from 'lucide-react';
import { INITIAL_THESES, INSTITUTION } from '../data/institutionalSeedData';

export default function ThesesArchive() {
  const [theses, setTheses] = useState(INITIAL_THESES);
  const [searchQuery, setSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('All');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [matric, setMatric] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [department, setDepartment] = useState('Co-operative Economics');
  const [degree, setDegree] = useState('HND Dissertation');
  const [abstract, setAbstract] = useState('');

  const filteredTheses = theses.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchQuery = t.title.toLowerCase().includes(q) ||
                       t.author.toLowerCase().includes(q) ||
                       t.advisor.toLowerCase().includes(q) ||
                       t.abstract.toLowerCase().includes(q);
    const matchDegree = degreeFilter === 'All' || t.degree === degreeFilter;
    return matchQuery && matchDegree;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newThesis = {
      id: `TH-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      author,
      matric,
      year: 2026,
      advisor,
      department,
      degree,
      access: "Under Review (Peer / Library Audit)",
      downloads: 0,
      citations: 0,
      doi: `10.5281/zenodo.${Math.floor(1000000 + Math.random() * 9000000)}`,
      abstract
    };

    setTheses([newThesis, ...theses]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitModalOpen(false);
      setTitle('');
      setAuthor('');
      setMatric('');
      setAdvisor('');
      setAbstract('');
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Title & Submission Trigger */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            OAI-PMH Compliant Institutional Repository
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            FCC Ibadan Scholarly Repository
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Dissertations, Faculty Research Papers, and Technical Monographs.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 shrink-0 transition"
        >
          <Plus size={16} /> Submit Scholarly Thesis
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search theses by keyword, author, or advisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'HND Dissertation', 'Postgraduate Diploma', 'ND Project'].map(deg => (
            <button
              key={deg}
              onClick={() => setDegreeFilter(deg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                degreeFilter === deg
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {deg}
            </button>
          ))}
        </div>
      </div>

      {/* Theses List */}
      <div className="space-y-3">
        {filteredTheses.map((thesis) => (
          <div
            key={thesis.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-700/50 transition-all flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {thesis.degree} • {thesis.year}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                  {thesis.department}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 ml-auto">
                  {thesis.access}
                </span>
              </div>

              <h3 className="text-base font-bold text-white hover:text-indigo-300 transition cursor-pointer">
                {thesis.title}
              </h3>

              <p className="text-xs text-slate-400">
                Author: <strong className="text-slate-200">{thesis.author}</strong> ({thesis.matric}) • Supervisor: <span className="text-slate-300">{thesis.advisor}</span>
              </p>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                {thesis.abstract}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span>DOI: {thesis.doi}</span>
                <span>📥 {thesis.downloads} Downloads</span>
                <span>📑 {thesis.citations} Citations</span>
              </div>

              <button
                onClick={() => alert(`Simulating PDF download for: "${thesis.title}"`)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download size={13} /> Full Text PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Submit New Dissertation / Thesis</h3>
              <p className="text-xs text-slate-400">
                Upload your research to the FCC Ibadan Institutional Repository. All submissions enter supervisor & library peer review.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle size={36} className="text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Thesis Submitted Successfully!</h4>
                <p className="text-xs text-slate-300">
                  Assigned permanent OAI-PMH identifier. Transferred to Departmental Review Board.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thesis / Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Econometric Modeling of Cooperative Liquidity Under High Inflation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Author Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Babatunde Lawal"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Matric Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FCC/CEM/2024/099"
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option>Co-operative Economics</option>
                      <option>Computer Science</option>
                      <option>Banking & Finance</option>
                      <option>Agricultural Extension</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Degree Type</label>
                    <select
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option>HND Dissertation</option>
                      <option>Postgraduate Diploma</option>
                      <option>ND Project</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Supervisor / Advisor</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. O. Alabi"
                      value={advisor}
                      onChange={(e) => setAdvisor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Abstract Summary</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="State research objectives, methodology, dataset characteristics, and main findings..."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-1 bg-slate-950/40">
                  <Upload size={20} className="text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-300 font-semibold">Attach Document (.PDF, max 50MB)</div>
                  <div className="text-[10px] text-slate-500">Document will be scanned for institutional integrity and similarity</div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    Submit to Repository
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
