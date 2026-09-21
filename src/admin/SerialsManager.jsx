import React, { useState } from 'react';
import { Newspaper, Plus, CheckCircle2, AlertTriangle, Send, Sparkles, Filter, Layers } from 'lucide-react';
import { INITIAL_SERIALS } from '../data/institutionalSeedData';

export default function SerialsManager() {
  const [serials, setSerials] = useState(INITIAL_SERIALS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimedId, setClaimedId] = useState(null);

  // New Subscription form
  const [newTitle, setNewTitle] = useState('');
  const [newIssn, setNewIssn] = useState('');
  const [newFrequency, setNewFrequency] = useState('Quarterly');
  const [newPublisher, setNewPublisher] = useState('');

  const handleCreateSubscription = (e) => {
    e.preventDefault();
    const newSub = {
      id: `SER-0${serials.length + 1}`,
      title: newTitle,
      issn: newIssn || `1597-${Math.floor(1000 + Math.random() * 9000)}`,
      frequency: newFrequency,
      latestVolume: 'Vol. 1 No. 1 (2026)',
      status: 'Active Subscription',
      missingIssues: 0
    };

    setSerials([newSub, ...serials]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewIssn('');
  };

  const handleClaim = (id) => {
    setClaimedId(id);
    setTimeout(() => setClaimedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            KBART Phase III & ISSN Serial Control
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Serials & Academic Periodicals Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage print and electronic subscriptions for peer-reviewed journals, national gazettes, and quarterly reports.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition"
        >
          <Plus size={15} /> Add Serial Subscription
        </button>
      </div>

      {/* Serials Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>Active Institutional Subscriptions</span>
          <span className="text-slate-500 font-mono">AUTOMATED CLAIMS ACTIVE</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {serials.map(s => (
            <div key={s.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400">{s.id}</span>
                  <span className="text-emerald-400 font-mono font-bold">ISSN: {s.issn}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{s.frequency}</span>
                </div>
                <h4 className="font-bold text-white text-sm">{s.title}</h4>
                <div className="text-slate-400">Latest Ingested: <strong className="text-slate-200">{s.latestVolume}</strong></div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {s.missingIssues > 0 ? (
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 block mb-1">
                      {s.missingIssues} Issue Missing
                    </span>
                    <button
                      onClick={() => handleClaim(s.id)}
                      className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition flex items-center gap-1"
                    >
                      <Send size={11} /> {claimedId === s.id ? 'Claim Notice Fired' : 'File Publisher Claim'}
                    </button>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Up to Date
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white">Add Journal / Serial Subscription</h3>
            <form onSubmit={handleCreateSubscription} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Journal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nigerian Journal of Cooperative Studies"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Standard ISSN</label>
                <input
                  type="text"
                  placeholder="e.g. 1597-2844"
                  value={newIssn}
                  onChange={(e) => setNewIssn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Publication Frequency</label>
                <select
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>Monthly</option>
                  <option>Bi-monthly</option>
                  <option>Quarterly</option>
                  <option>Bi-annual</option>
                  <option>Annual</option>
                </select>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
