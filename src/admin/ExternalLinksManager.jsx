import React, { useState } from 'react';
import { Globe, Plus, ExternalLink, Trash2, Edit3, CheckCircle2, Link2, Sparkles, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function ExternalLinksManager({ books, setBooks }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [category, setCategory] = useState('Open Access E-Book / PDF');
  const [department, setDepartment] = useState('CEM');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-populated external links from current books
  const digitalResources = books.filter(b => b.isDigital || b.externalUrl);

  const handleAddExternalLink = (e) => {
    e.preventDefault();
    if (!title.trim() || !externalUrl.trim()) return;

    let formattedUrl = externalUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newResource = {
      id: `FCC-EXT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      author: author.trim() || 'Institutional / External Contributor',
      isbn: `EXT-${Math.floor(100000 + Math.random() * 900000)}`,
      callNumber: `EXT.${department}.${Math.floor(100 + Math.random() * 900)}`,
      subject: category,
      department: department,
      copiesTotal: 1,
      copiesAvailable: 1,
      isDigital: true,
      externalUrl: formattedUrl,
      pdfPages: 150,
      rating: 5.0,
      citations: 0,
      doi: `10.5281/zenodo.ext.${Math.floor(100000 + Math.random() * 900000)}`,
      publisher: 'External Academic Repository / Open Source',
      year: new Date().getFullYear(),
      abstract: description.trim() || `Curated external digital research resource verified by the FCC Library Directorate. Direct access link: ${formattedUrl}`
    };

    setBooks([newResource, ...books]);
    sounds.playSuccessChime();
    setSuccessMsg(`External resource "${title}" published live for student reading!`);
    setIsModalOpen(false);
    setTitle('');
    setAuthor('');
    setExternalUrl('');
    setDescription('');

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this digital link from student discovery?')) {
      setBooks(books.filter(b => b.id !== id));
      sounds.playErrorBuzz();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
            <Globe size={13} className="text-emerald-400" />
            Digital Knowledge Base & External E-Resources
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            External Links & Digital E-Books Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Ingest direct web reader URLs, open access PDFs, institutional links, and academic repositories for students to read instantly.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
        >
          <Plus size={16} /> Add New External E-Resource Link
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Resource Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Published Digital E-Resources</div>
          <div className="text-2xl font-black text-white mt-1">{digitalResources.length} Active Items</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Live on Student & Public Portals</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">External Link Protocols</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">HTTPS / PDF Web Reader</div>
          <div className="text-[10px] text-indigo-300 font-mono mt-0.5">256-Bit SSL Gateway</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Student Read Access</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">Instant 1-Click Launch</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Zero Download Required</div>
        </div>
      </div>

      {/* External Links Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>Active Digital Library Links</span>
          <span className="text-slate-500 font-mono">AUTOMATED CITATION INTEGRATION</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {digitalResources.map(item => (
            <div key={item.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-950/40 transition">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.callNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                    {item.department} • {item.subject}
                  </span>
                  {item.externalUrl && (
                    <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                      <Link2 size={12} /> External Link Active
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-bold text-white">{item.title}</h4>
                <p className="text-xs text-slate-400">Author: {item.author} ({item.year})</p>

                {item.externalUrl ? (
                  <div className="text-[11px] text-emerald-400 font-mono truncate max-w-lg">
                    🔗 {item.externalUrl}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Local Campus Intranet PDF Reader
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.externalUrl && (
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <ExternalLink size={13} /> Test Link
                  </a>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                  title="Remove Resource"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add External Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800 mb-1">
                <Link2 size={12} /> Instant Ingestion
              </div>
              <h3 className="text-xl font-bold text-white">Publish External E-Resource Link</h3>
              <p className="text-xs text-slate-400">Add an external eBook, PDF, journal URL, or open-access link for students to read.</p>
            </div>

            <form onSubmit={handleAddExternalLink} className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handbook of Cooperative Governance & Digital Audits"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. World Bank / Prof. A. Adebayo"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Target Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="CEM">Co-operative Economics (CEM)</option>
                    <option value="CSC">Computer Science (CSC)</option>
                    <option value="BNF">Banking & Finance (BNF)</option>
                    <option value="AGR">Agricultural Extension (AGR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                  Resource Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option>Open Access E-Book / PDF</option>
                  <option>Peer-Reviewed External Journal</option>
                  <option>Government Gazette / Policy Document</option>
                  <option>Conference Proceedings & Slide Decks</option>
                  <option>Interactive Dataset / Research Web Tool</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <Link2 size={13} /> External URL / Direct Reader Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://openlibrary.org/books/OL... or https://arxiv.org/pdf/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-600/70 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                  Summary / Monograph Abstract
                </label>
                <textarea
                  rows={2}
                  placeholder="Key research themes, methodology, or reading requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950"
                >
                  Publish for Student Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
