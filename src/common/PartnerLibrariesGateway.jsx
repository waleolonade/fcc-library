import React, { useState } from 'react';
import { Building2, ExternalLink, Search, Globe, ShieldCheck, Sparkles, BookOpen, Layers, CheckCircle2, Eye, Compass, Link2 } from 'lucide-react';
import { INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import ExternalLibraryViewerModal from './ExternalLibraryViewerModal';
import TraceBadge from './TraceBadge';
import { sounds } from '../utils/soundEffects';

export default function PartnerLibrariesGateway({ partnerLibraries = INITIAL_PARTNER_LIBRARIES, user = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeLibraryViewer, setActiveLibraryViewer] = useState(null);

  const categories = [
    'All',
    'Nigerian Federal University Partner',
    'National Legal Depository',
    'Global Open Digital Library',
    'Global National Authority Library',
    'Peer-Reviewed Academic Open Access'
  ];

  const filteredLibraries = partnerLibraries.filter(lib => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      lib.name.toLowerCase().includes(q) ||
      lib.description.toLowerCase().includes(q) ||
      lib.location.toLowerCase().includes(q);

    const matchCategory = selectedCategory === 'All' || lib.category === selectedCategory;
    return matchQuery && matchCategory;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
          <Globe size={13} className="text-indigo-400" />
          Global Consortium & Linked Partner Libraries
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Federated Partner Libraries & OPAC Gateways
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Connect directly to external partner library catalogs across Nigeria and worldwide. Enjoy reciprocal borrowing, open-access eBook reading, and archival access.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 sm:p-5 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-xl">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search linked libraries by institution, city, or collections (e.g. Kenneth Dike, Library of Congress, OpenLibrary)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-semibold mr-1">Consortium:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Partner Library Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLibraries.map(lib => (
          <div
            key={lib.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-600/50 transition-all flex flex-col justify-between space-y-4 shadow-xl group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {lib.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-2 group-hover:text-indigo-300 transition">
                    {lib.name}
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                  {lib.status || 'Active Interlink'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                {lib.description}
              </p>

              {/* Metadata Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Catalog Holdings</span>
                  <strong className="text-indigo-400">{lib.holdingsCount}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Location / Network</span>
                  <strong className="text-slate-300 truncate block">{lib.location}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between">
                <span>Protocol: <strong className="text-slate-200 font-mono">{lib.protocol}</strong></span>
                <span className="text-emerald-400 font-semibold">{lib.accessType}</span>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <TraceBadge uri={lib.opacUrl || lib.url} label="OPAC URI" />

              <div className="flex items-center gap-2">
                <a
                  href={lib.opacUrl || lib.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                  title="Open in new browser window"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Direct Tab</span>
                </a>

                <button
                  onClick={() => {
                    sounds.playSuccessChime();
                    setActiveLibraryViewer(lib);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition"
                >
                  <Eye size={14} /> Explore & Access Library
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* In-App Live Library Portal Modal */}
      {activeLibraryViewer && (
        <ExternalLibraryViewerModal
          library={activeLibraryViewer}
          user={user}
          onClose={() => setActiveLibraryViewer(null)}
        />
      )}
    </div>
  );
}
