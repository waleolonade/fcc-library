import React, { useState } from 'react';
import { Shield, Clock, Search, Filter, Download, Sparkles } from 'lucide-react';
import { INITIAL_AUDIT_LOGS } from '../data/institutionalSeedData';

export default function AuditLogViewer() {
  const [logs] = useState(INITIAL_AUDIT_LOGS);
  const [filterAction, setFilterAction] = useState('All');

  const filteredLogs = logs.filter(l => filterAction === 'All' || l.action === filterAction);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            Cryptographic Integrity & Accountability
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Institutional Audit Trail & Event Logs
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Immutable trace of administrative overrides, catalog updates, fine waivers, and authentication events.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting signed audit logs...')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <Download size={14} /> Export Signed Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        {['All', 'CIRC_OVERRIDE', 'MARC_INGEST', 'FINE_ACCRUAL'].map(act => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              filterAction === act
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800 font-mono text-xs">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-4 space-y-1 hover:bg-slate-950/50 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {log.action}
                  </span>
                  <span className="text-slate-300 font-sans font-bold">{log.user}</span>
                  <span className="text-[10px] text-slate-500 font-sans">({log.role})</span>
                </div>
                <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
              </div>
              <p className="text-slate-400 font-sans text-xs pt-1">{log.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
