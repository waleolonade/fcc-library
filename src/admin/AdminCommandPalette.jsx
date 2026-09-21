import React, { useState, useEffect } from 'react';
import {
  Search, Command, BookOpen, User, RefreshCw, PlusCircle,
  FileText, Shield, Sparkles, Building2, Layers, Check
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function AdminCommandPalette({
  isOpen,
  onClose,
  onSelectAction,
  books,
  patrons
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { id: 'pdf_upload', label: 'Upload PDF Book / Ingest Monograph', category: 'Cataloguing', icon: PlusCircle },
    { id: 'patrons', label: 'Generate / Reset Student Access PIN', category: 'Patrons', icon: User },
    { id: 'circulation', label: 'Open Circulation Desk (Issue / Return)', category: 'Circulation', icon: RefreshCw },
    { id: 'approvals', label: 'Review Thesis & Acquisition Approvals', category: 'Workflow', icon: FileText },
    { id: 'marc', label: 'Open MARC21 / Dublin Core Cataloguer', category: 'Cataloguing', icon: BookOpen },
    { id: 'partner_libs', label: 'Manage External Linked Libraries', category: 'Interoperability', icon: Building2 },
    { id: 'health', label: 'Check System Health & Latencies', category: 'System', icon: Shield },
    { id: 'reports', label: 'Generate Institutional BI Report', category: 'Analytics', icon: Layers }
  ];

  const filteredActions = quickActions.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredBooks = books.filter(b =>
    query && (b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()) || b.callNumber.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 4);

  const filteredPatrons = (patrons || []).filter(p =>
    query && (p.name.toLowerCase().includes(query.toLowerCase()) || p.matric.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl shadow-black space-y-4 animate-fadeIn">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, book title, or student matric (e.g. 'Upload', 'Adebayo', 'FCC/CEM')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
          <kbd className="absolute right-3.5 top-3 px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Action Results */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono px-2">Actions</div>
              {filteredActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      onSelectAction(action.id);
                      onClose(false);
                      sounds.playClick();
                    }}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-indigo-950 hover:text-white flex items-center justify-between text-slate-300 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                      <span className="font-semibold">{action.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{action.category}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Book Results */}
          {filteredBooks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono px-2">Catalog Records</div>
              {filteredBooks.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectAction('pdf_upload');
                    onClose(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-indigo-950 flex items-center justify-between text-slate-300 transition"
                >
                  <div>
                    <div className="font-bold text-white leading-tight">{b.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.author} • {b.callNumber}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-emerald-400 font-mono">
                    {b.copiesAvailable} Avail
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Patron Results */}
          {filteredPatrons.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono px-2">Patron Scholars</div>
              {filteredPatrons.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectAction('patrons');
                    onClose(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-indigo-950 flex items-center justify-between text-slate-300 transition"
                >
                  <div>
                    <div className="font-bold text-white leading-tight">{p.name}</div>
                    <div className="text-[10px] text-indigo-400 font-mono">{p.matric} • {p.department}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono">
                    PIN: {p.pin}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
