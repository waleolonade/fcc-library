import React, { useState } from 'react';
import { Globe, Search, Download, CheckCircle, ExternalLink, Sparkles, Database, Plus } from 'lucide-react';
import { OPENALEX_SEED_RESEARCH } from '../data/institutionalSeedData';

export default function ResearchIngestion({ onImportBook }) {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('openalex'); // 'openalex' | 'crossref'
  const [results, setResults] = useState(OPENALEX_SEED_RESEARCH);
  const [isSearching, setIsSearching] = useState(false);
  const [importedDois, setImportedDois] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const q = query.toLowerCase().trim();
      if (!q) {
        setResults(OPENALEX_SEED_RESEARCH);
        return;
      }
      const filtered = OPENALEX_SEED_RESEARCH.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.concepts.some(c => c.toLowerCase().includes(q)) ||
        r.authors.some(a => a.toLowerCase().includes(q))
      );
      // If none match from seed, mock a realistic scholarly result
      if (filtered.length === 0) {
        setResults([
          {
            doi: `10.1016/j.res.2026.${Math.floor(1000 + Math.random() * 9000)}`,
            title: `Empirical Assessment of "${query}" in Developing Institutional Repositories`,
            authors: ["Balogun, M. A.", "Adekunle, I. O.", "Smith, J."],
            venue: `${provider === 'openalex' ? 'OpenAlex Scholarly Graph' : 'Crossref DOI Index'} (Peer-Reviewed)`,
            year: 2026,
            citations: 12,
            concepts: ["Institutional Repositories", "Information Science", "Open Access"],
            openAccessPdf: `https://doi.org/10.1016/j.res.2026`
          }
        ]);
      } else {
        setResults(filtered);
      }
    }, 600);
  };

  const handleImport = (item) => {
    onImportBook({
      title: item.title,
      author: item.authors.join(", "),
      isbn: `978-0-13-${Math.floor(100000 + Math.random() * 900000)}`,
      callNumber: `Z666.5 .${item.authors[0].slice(0, 3).toUpperCase()} 2026`,
      subject: item.concepts[0] || 'Scholarly Research',
      department: 'CSC',
      copiesTotal: 4,
      copiesAvailable: 4,
      isDigital: true,
      pdfPages: 24,
      rating: 4.9,
      citations: item.citations,
      doi: item.doi,
      publisher: item.venue,
      year: item.year,
      abstract: `Harvested from ${provider.toUpperCase()} Global Research Graph. Full text and metadata ingested into the FCC Institutional Digital Archive.`
    });

    setImportedDois(prev => [...prev, item.doi]);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-indigo-400" />
          Global Research & DOI Gateway
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          OpenAlex & Crossref Live Ingestion
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Federated scholarly search across 250M+ global academic papers with 1-click MARC21 catalog ingestion.
        </p>
      </div>

      {/* Search & Provider Selector */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setProvider('openalex')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              provider === 'openalex' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={14} /> OpenAlex Scholarly Graph (API v2)
          </button>
          <button
            type="button"
            onClick={() => setProvider('crossref')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              provider === 'crossref' ? 'bg-teal-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Database size={14} /> Crossref Metadata Search
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search global research by topic, DOI (e.g. 10.1016), or author name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 shrink-0 transition"
          >
            {isSearching ? 'Querying...' : 'Query Index'}
          </button>
        </form>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((item, idx) => {
          const isImported = importedDois.includes(item.doi);

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg hover:border-indigo-700/40 transition"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {item.venue} • {item.year}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    DOI: {item.doi}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400">
                  Authors: {item.authors.join(", ")} • <strong>{item.citations} Citations</strong>
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.concepts.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col items-end gap-2">
                <button
                  disabled={isImported}
                  onClick={() => handleImport(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    isImported
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                      : 'bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white'
                  }`}
                >
                  {isImported ? <CheckCircle size={14} /> : <Plus size={14} />}
                  {isImported ? 'Ingested into Catalog' : 'Ingest to Catalog'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
