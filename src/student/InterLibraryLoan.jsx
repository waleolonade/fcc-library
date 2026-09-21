import React, { useState } from 'react';
import { Building2, Globe, Send, CheckCircle2, Clock, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';

export default function InterLibraryLoan({ user }) {
  const [partnerLibrary, setPartnerLibrary] = useState('Kenneth Dike Library, University of Ibadan');
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbnOrDoi, setIsbnOrDoi] = useState('');
  const [requests, setRequests] = useState([
    {
      id: "ILL-2026-091",
      title: "Cooperative Agrarian Reform Law in Post-Colonial Africa",
      author: "Prof. E. O. Akande",
      lender: "Kenneth Dike Library, University of Ibadan",
      status: "In Transit via National Dispatch",
      eta: "2026-09-22"
    }
  ]);
  const [isSuccess, setIsSuccess] = useState(false);

  const partners = [
    "Kenneth Dike Library, University of Ibadan (UI)",
    "Hezekiah Oluwasanmi Library, Obafemi Awolowo University (OAU)",
    "University of Lagos Central Library (UNILAG)",
    "National Library of Nigeria, Abuja Headquarters"
  ];

  const handleRequest = (e) => {
    e.preventDefault();
    const newReq = {
      id: `ILL-2026-0${requests.length + 92}`,
      title: bookTitle,
      author,
      lender: partnerLibrary,
      status: "Dispatched to Partner Consortium",
      eta: "Within 48-72 Hours"
    };

    setRequests([newReq, ...requests]);
    setIsSuccess(true);
    setBookTitle('');
    setAuthor('');
    setIsbnOrDoi('');
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
          <Globe size={13} className="text-indigo-400" />
          National Academic Resource Sharing
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Inter-Library Loan (ILL) Consortium
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Request rare research treatises, government gazettes, and out-of-print physical volumes from partner university libraries across Nigeria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Form */}
        <div className="lg:col-span-6 bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 size={16} className="text-indigo-400" /> New Inter-Library Request
          </h3>

          {isSuccess && (
            <div className="p-3.5 bg-emerald-950 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>ILL Request transmitted to consortium desk! Delivery tracking active.</span>
            </div>
          )}

          <form onSubmit={handleRequest} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Target Lending Institution</label>
              <select
                value={partnerLibrary}
                onChange={(e) => setPartnerLibrary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {partners.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Book / Monograph Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Constitutional Law of Cooperative Societies"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Primary Author</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. J. K. Coker"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">ISBN or Year</label>
                <input
                  type="text"
                  placeholder="e.g. 978-978-0012"
                  value={isbnOrDoi}
                  onChange={(e) => setIsbnOrDoi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition flex items-center justify-center gap-2"
            >
              <Send size={14} /> Submit Consortium Request
            </button>
          </form>
        </div>

        {/* Right: Active Consortium Dispatches */}
        <div className="lg:col-span-6 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock size={16} className="text-indigo-400" /> Active Consortium Requests
          </h3>

          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {req.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                    {req.status}
                  </span>
                </div>
                <div className="font-bold text-white text-sm">{req.title}</div>
                <div className="text-xs text-slate-400">Author: {req.author}</div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between items-center">
                  <span>Lender: {req.lender.split(',')[0]}</span>
                  <span className="font-mono text-emerald-400">ETA: {req.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
