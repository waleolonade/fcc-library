import React, { useState } from 'react';
import {
  Bot, Shield, Database, Sparkles, CheckCircle, RefreshCw,
  Lock, AlertTriangle, Eye, Settings, FileText
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function AdminAiManager() {
  const [sources, setSources] = useState([
    { id: 'SRC-01', name: 'Physical & Digital Catalogue (MARC21)', records: '125,430 indexed', status: 'Active Sync', latency: '0.4s' },
    { id: 'SRC-02', name: 'FCC Institutional Theses & Dissertations', records: '14,205 full-text', status: 'Active Sync', latency: '0.6s' },
    { id: 'SRC-03', name: 'OpenAlex & Crossref Global Metadata Proxy', records: '250M+ scholarly graph', status: 'Active Sync', latency: '1.1s' },
    { id: 'SRC-04', name: 'Campus Regulations & Bye-Laws Corpus', records: '14 policy volumes', status: 'Grounded Guardrail', latency: '0.2s' }
  ]);

  const [aiSafetyLevel, setAiSafetyLevel] = useState('Strict Grounding (Zero Hallucination Mode)');

  const handleReindex = () => {
    sounds.playSuccessChime();
    alert('Triggered dense vector embedding re-index across all 4 knowledge sources!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
            RAG PIPELINES & KNOWLEDGE SOURCES
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">AI Librarian Management & Safety</h2>
          <p className="text-xs text-slate-400">
            Configure authorized knowledge bases, dense vector retrieval indices, and hallucination guardrails.
          </p>
        </div>

        <button
          onClick={handleReindex}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950 transition"
        >
          <RefreshCw size={14} /> Re-Index Vector Corpus
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(src => (
          <div key={src.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-purple-400">
                  <Database size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{src.name}</h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{src.records}</div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
                {src.status}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              <span>Embedding Latency: <strong className="text-purple-300">{src.latency}</strong></span>
              <span className="text-emerald-400">Grounding Accuracy: 99.4%</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Guardrails and Safety Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl max-w-2xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield size={16} className="text-purple-400" /> Grounding & Safety Guardrail Policies
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Retrieval Grounding Policy</label>
            <select
              value={aiSafetyLevel}
              onChange={(e) => setAiSafetyLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
            >
              <option>Strict Grounding (Zero Hallucination Mode — Approved Sources Only)</option>
              <option>Hybrid Synthesizer (Campus Holdings + Federated OpenAlex)</option>
              <option>Permissive Citation Exploration Mode</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1.5 text-[11px]">
            <div>🔒 <strong>Safety Rule:</strong> Destructive admin modifications are completely isolated from AI assistant tools.</div>
            <div>📑 <strong>Citation Integrity:</strong> All recommendations strictly include verified Call Numbers or DOIs.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
