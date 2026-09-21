import React, { useState } from 'react';
import { Building2, Plus, ExternalLink, Trash2, CheckCircle2, Globe, Sparkles, Link2, Layers } from 'lucide-react';
import { INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function PartnerLibrariesManager({ partnerLibraries = INITIAL_PARTNER_LIBRARIES, setPartnerLibraries }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Nigerian Federal University Partner');
  const [opacUrl, setOpacUrl] = useState('');
  const [protocol, setProtocol] = useState('Z39.50 / Web OPAC');
  const [location, setLocation] = useState('');
  const [holdingsCount, setHoldingsCount] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState('Consortium Reciprocal Access');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddLibrary = (e) => {
    e.preventDefault();
    if (!name.trim() || !opacUrl.trim()) return;

    let formattedUrl = opacUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newLib = {
      id: `LIB-EXT-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      url: formattedUrl,
      opacUrl: formattedUrl,
      protocol,
      holdingsCount: holdingsCount.trim() || '500,000+ Records',
      location: location.trim() || 'Inter-University Consortium',
      accessType,
      status: 'Active Interlink',
      description: description.trim() || `Linked external academic library catalog connected to the Federal Co-operative College, Ibadan network. Direct OPAC gateway: ${formattedUrl}`,
      badgeColor: 'indigo'
    };

    setPartnerLibraries([newLib, ...partnerLibraries]);
    sounds.playSuccessChime();
    setSuccessMsg(`Linked library "${name}" added to scholar directory!`);
    setIsModalOpen(false);
    setName('');
    setOpacUrl('');
    setLocation('');
    setDescription('');

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id) => {
    if (confirm('Disconnect this partner library from student discovery?')) {
      setPartnerLibraries(partnerLibraries.filter(l => l.id !== id));
      sounds.playErrorBuzz();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Globe size={13} className="text-indigo-400" />
            Consortium & Remote Catalog Interlinks
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Partner Libraries & External OPAC Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Link and configure external university OPACs, national legal deposits, and international digital libraries for campus-wide federated discovery.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-950 transition"
        >
          <Plus size={16} /> Link New Partner Library OPAC
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Linked Libraries Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>Active External Library Interlinks ({partnerLibraries.length})</span>
          <span className="text-slate-500 font-mono">Z39.50 / REST FEDERATION ACTIVE</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {partnerLibraries.map(lib => (
            <div key={lib.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-950/40 transition">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {lib.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {lib.protocol}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lib.holdingsCount}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{lib.name}</h4>
                <p className="text-xs text-slate-300 line-clamp-1">{lib.description}</p>
                <div className="text-[11px] text-indigo-400 font-mono truncate max-w-lg">
                  🔗 {lib.opacUrl || lib.url}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={lib.opacUrl || lib.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <ExternalLink size={13} /> Test OPAC
                </a>
                <button
                  onClick={() => handleDelete(lib.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                  title="Disconnect Library"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Link New Partner Library */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800 mb-1">
                <Building2 size={12} /> Institutional Consortium Integration
              </div>
              <h3 className="text-xl font-bold text-white">Link External Partner Library</h3>
              <p className="text-xs text-slate-400">Connect an external university catalog, national deposit library, or global archive.</p>
            </div>

            <form onSubmit={handleAddLibrary} className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                  Library / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenneth Dike Library — University of Ibadan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Institutional Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>Nigerian Federal University Partner</option>
                    <option>National Legal Depository</option>
                    <option>Global Open Digital Library</option>
                    <option>Global National Authority Library</option>
                    <option>Peer-Reviewed Academic Open Access</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Access Protocol
                  </label>
                  <select
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>Z39.50 / Web OPAC</option>
                    <option>KOHA ILS / OAI-PMH</option>
                    <option>MARC21 / Z39.50 Gateway</option>
                    <option>REST API / Web Reader</option>
                    <option>OAI-PMH / Direct PDF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-indigo-400 uppercase font-bold mb-1 flex items-center gap-1">
                  <Link2 size={13} /> Partner OPAC / Discovery Portal URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://opac.ui.edu.ng/discovery or https://openlibrary.org"
                  value={opacUrl}
                  onChange={(e) => setOpacUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-600/70 rounded-xl px-3 py-2.5 text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ibadan, Oyo State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                    Holdings Volume
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1,450,000+ Volumes"
                    value={holdingsCount}
                    onChange={(e) => setHoldingsCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">
                  Access Guide for Scholars
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain special privileges, reciprocal walk-in access, or digital collections..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950"
                >
                  Establish Library Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
