import { AlertTriangle, BookOpen, ExternalLink, FileText, Image as ImageIcon, Library, Loader2, Newspaper, Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TroveExplorer() {
  const [query, setQuery] = useState('australia');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/trove/search?q=${encodeURIComponent(query)}`);
      // const res = await fetch(`http://127.0.0.1:8000/api/trove/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch from Trove API");
      }
      
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);
  
  const getCategoryIcon = (category) => {
    if (!category) return <Library size={16} />;
    if (category.toLowerCase().includes('newspaper')) return <Newspaper size={16} />;
    if (category.toLowerCase().includes('image')) return <ImageIcon size={16} />;
    if (category.toLowerCase().includes('book')) return <BookOpen size={16} />;
    return <Library size={16} />;
  };

  return (
    <div className="flex flex-col h-full bg-[#021810] rounded-3xl overflow-hidden border border-emerald-800/50 shadow-2xl">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-emerald-950 via-emerald-900/50 to-[#021810] border-b border-emerald-800/50">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30 shadow-lg">
              <Library className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Trove Knowledge Base</h2>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">National Library of Australia</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-emerald-500 group-focus-within:text-emerald-400 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journals, archives, and cultural heritage..."
            className="w-full pl-11 pr-32 py-3 bg-[#01110b]/80 border border-emerald-800/60 rounded-xl text-emerald-100 placeholder-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner font-medium"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute inset-y-1.5 right-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-xl flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div>
              <h4 className="text-rose-400 font-bold text-sm">Trove API Error</h4>
              <p className="text-rose-200/70 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && !results && (
          <div className="h-64 flex flex-col items-center justify-center text-emerald-600 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-bold animate-pulse">Querying Trove Archives...</p>
          </div>
        )}

        {!loading && results && results.category && (
          <div className="space-y-8">
            {results.category.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-300 border-b border-emerald-800/50 pb-2 capitalize flex items-center gap-2">
                  {getCategoryIcon(cat.code)}
                  {cat.code.replace(/([A-Z])/g, ' $1').trim()} 
                  <span className="text-xs bg-emerald-900/50 px-2 py-0.5 rounded-full text-emerald-400 ml-2">
                    {cat.records?.total || 0} Results
                  </span>
                </h3>

                {cat.records?.work && cat.records.work.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.records.work.map((work, wIdx) => (
                      <div key={wIdx} className="bg-[#032316] border border-emerald-800/50 p-5 rounded-2xl flex flex-col gap-3 hover:border-emerald-500/50 transition-colors group">
                        <div className="flex-1">
                          <h4 className="text-emerald-100 font-bold text-sm leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors">
                            {work.title}
                          </h4>
                          {work.contributor && work.contributor.length > 0 && (
                            <p className="text-emerald-500/80 text-xs mt-2 line-clamp-1 flex items-center gap-1.5">
                              <User size={10} /> {work.contributor.join(', ')}
                            </p>
                          )}
                          {work.issued && (
                            <p className="text-emerald-400/60 text-xs mt-1 font-mono">
                              {work.issued}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-emerald-800/30 flex justify-between items-center mt-auto">
                          <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold tracking-wider">
                            {work.type?.join(', ') || 'Item'}
                          </span>
                          <button 
                            onClick={() => setSelectedItem({ category: cat.code, ...work })}
                            className="text-xs bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5"
                          >
                            <FileText size={12} /> View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-emerald-700 text-sm font-medium">
                    No records found in this category.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Native Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#032316] border border-emerald-800/60 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-emerald-800/50 bg-[#021810]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {getCategoryIcon(selectedItem.category)}
                Trove Record Details
              </h2>
              <button onClick={() => setSelectedItem(null)} className="text-emerald-400 hover:text-white transition p-1 bg-emerald-900/50 hover:bg-emerald-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <h1 className="text-2xl font-black text-white leading-snug">{selectedItem.title}</h1>
              
              {selectedItem.contributor && selectedItem.contributor.length > 0 && (
                <div className="text-sm font-bold text-emerald-400 flex items-start gap-2">
                  <User size={16} className="mt-0.5 shrink-0" />
                  <span>{selectedItem.contributor.join(', ')}</span>
                </div>
              )}
              
              {selectedItem.abstract && (
                <div className="text-emerald-100/90 text-sm leading-relaxed bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/50">
                  {selectedItem.abstract}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedItem.issued && (
                  <div>
                    <h3 className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-1">Date Issued</h3>
                    <p className="text-emerald-100 text-sm font-mono">{selectedItem.issued}</p>
                  </div>
                )}
                {selectedItem.language && (
                  <div>
                    <h3 className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-1">Language</h3>
                    <p className="text-emerald-100 text-sm">{selectedItem.language.join(', ')}</p>
                  </div>
                )}
                {selectedItem.type && (
                  <div>
                    <h3 className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-1">Format</h3>
                    <p className="text-emerald-100 text-sm">{selectedItem.type.join(', ')}</p>
                  </div>
                )}
              </div>

              {selectedItem.identifier && selectedItem.identifier.length > 0 && (
                <div className="pt-4 border-t border-emerald-800/30 mt-4">
                  <h3 className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mb-2">External Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.identifier.filter(id => id.type === 'url').map((lnk, i) => (
                      <button 
                        key={i} 
                        onClick={() => window.open(lnk.value, '_blank')}
                        className="px-3 py-1.5 bg-emerald-900/40 rounded-lg border border-emerald-800 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-800 transition flex items-center gap-1"
                      >
                        {lnk.linktext || 'View Online'} <ExternalLink size={10} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribution Block requested by User */}
              <div className="pt-6 mt-4 border-t border-emerald-800/50">
                <div className="bg-[#021810] p-4 rounded-xl border border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Source</h4>
                    <p className="text-sm text-emerald-100">Data provided by: <strong className="text-white">National Library of Australia</strong></p>
                    <p className="text-xs text-emerald-400">API: Trove API</p>
                  </div>
                  {selectedItem.troveUrl && (
                    <button 
                      onClick={() => window.open(selectedItem.troveUrl, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-900/30 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
                    >
                      View Original Source <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#021810] border-t border-emerald-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl font-bold text-emerald-400 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
