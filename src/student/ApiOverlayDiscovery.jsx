import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, Sparkles, BookOpen, Globe, Layers, Filter, ExternalLink,
  Bookmark, Check, ChevronRight, ChevronDown, Award, Star, Loader2,
  RefreshCw, CheckCircle, AlertTriangle, FileText, Database, ShieldCheck,
  Calendar, User, Copy, ArrowRight, Quote, Download, X, HelpCircle,
  Building, BookMarked, Zap, Eye, Clock, CornerDownRight, ArrowUpRight
} from 'lucide-react';
import { formatCitation, downloadCitationFile } from '../utils/citationFormatter';
import { sounds } from '../utils/soundEffects';

const API_BASE = '/api/overlay';

const EXAMPLE_TASKS = [
  {
    label: 'Cooperative Banking in Nigeria',
    prompt: 'I need recent empirical papers on cooperative economics and microfinance in Nigeria for my HND thesis',
    badge: 'HND Research'
  },
  {
    label: 'Data Structures & Algorithms',
    prompt: 'Computer Science textbooks on Algorithms and Data Structures with free read access',
    badge: 'Textbook'
  },
  {
    label: 'Agricultural Extension Past Projects',
    prompt: 'HND student theses and research on smallholder agricultural value chains and extension',
    badge: 'Institutional'
  },
  {
    label: 'Classic Economics & Literature',
    prompt: 'Public domain classic literature and foundational economic monographs free to download',
    badge: 'Free eBooks'
  },
  {
    label: 'Commercial Law & Auditing',
    prompt: 'Statutory auditing and cooperative law reference textbooks available in campus stacks',
    badge: 'Campus Stacks'
  }
];

export default function ApiOverlayDiscovery({ onOpenReader, initialQuery = '' }) {
  // Modes: 'assistant' (Task Planner) | 'federated' (Standard multi-source search)
  const [mode, setMode] = useState('assistant');
  const [promptInput, setPromptInput] = useState(initialQuery || '');
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');

  // Active filters
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'book' | 'ebook' | 'paper' | 'thesis' | 'archive'
  const [selectedAccess, setSelectedAccess] = useState('all'); // 'all' | 'full' | 'on_shelf' | 'preview'
  const [selectedSource, setSelectedSource] = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  // Execution & Data States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  const [plan, setPlan] = useState(null);
  const [brief, setBrief] = useState('');
  const [results, setResults] = useState([]);
  const [sourceStats, setSourceStats] = useState([]);
  const [facets, setFacets] = useState({ type: {}, access: {}, source: {} });
  const [tookMs, setTookMs] = useState(null);

  // Available sources catalog from backend
  const [availableSources, setAvailableSources] = useState([]);
  const [activeSourcesSelection, setActiveSourcesSelection] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  // Detail Modal & Citation State
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeCitationStyle, setActiveCitationStyle] = useState('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [savedUids, setSavedUids] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fcc_saved_overlay_resources') || '[]');
    } catch {
      return [];
    }
  });

  // Load available sources on mount
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sources`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSources(data.sources || []);
        // By default select all enabled
        const enabled = (data.sources || []).filter(s => s.enabled).map(s => s.key);
        setActiveSourcesSelection(enabled);
      }
    } catch (e) {
      console.warn('Could not load sources catalog:', e);
    } finally {
      setSourcesLoading(false);
    }
  };

  // Toggle Source in active filter list
  const toggleSourceSelection = (key) => {
    sounds.playClick();
    setActiveSourcesSelection(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, k]
    );
  };

  // Execute Task Assistant Request
  const handleExecuteAssistant = async (taskText) => {
    const textToRun = (taskText ?? promptInput).trim();
    if (!textToRun) return;

    sounds.playClick();
    setLoading(true);
    setError('');
    setCurrentTask(textToRun);

    try {
      const payload = {
        prompt: textToRun,
        sources: activeSourcesSelection.length > 0 ? activeSourcesSelection : undefined,
        freeOnly: freeOnly || undefined,
        type: selectedType !== 'all' ? selectedType : undefined
      };

      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        setBrief(data.brief);
        setResults(data.results || []);
        setSourceStats(data.sources || []);
        setFacets(data.facets || { type: {}, access: {}, source: {} });
        setTookMs(data.tookMs);
        sounds.playSuccessChime();
      } else {
        throw new Error(data.message || 'Federated discovery returned an error.');
      }
    } catch (err) {
      console.error('Assistant execution failed:', err);
      setError(err.message || 'Network failure communicating with API overlay.');
      sounds.playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  // Execute Federated Search directly
  const handleExecuteSearch = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    sounds.playClick();
    setLoading(true);
    setError('');
    setCurrentTask(`Direct Search: "${q}"`);
    setPlan(null);
    setBrief('');

    try {
      const params = new URLSearchParams({
        q,
        sources: activeSourcesSelection.join(','),
        freeOnly: freeOnly ? 'true' : 'false',
        type: selectedType,
        yearFrom: yearFrom || '',
        yearTo: yearTo || '',
        limit: '16'
      });

      const res = await fetch(`${API_BASE}/search?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server error HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setSourceStats(data.sources || []);
        setFacets(data.facets || { type: {}, access: {}, source: {} });
        setTookMs(data.tookMs);
        sounds.playSuccessChime();
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Federated search failed:', err);
      setError(err.message || 'Could not query overlay sources.');
      sounds.playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  // Open Deep Detail & Citation Modal
  const openDetailModal = async (item) => {
    sounds.playClick();
    setActiveDetailItem(item);
    setDetailLoading(true);
    setCopiedCitation(false);

    try {
      const res = await fetch(`${API_BASE}/detail?source=${encodeURIComponent(item.source)}&id=${encodeURIComponent(item.externalId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.resource) {
          setActiveDetailItem(prev => ({
            ...prev,
            ...json.resource,
            extra: json.resource.extra || prev?.extra
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch deep details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle Bookmark / Save
  const toggleSaveItem = (item, e) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    const uid = item.uid;
    const exists = savedUids.includes(uid);
    let updated;
    if (exists) {
      updated = savedUids.filter(x => x !== uid);
    } else {
      updated = [...savedUids, uid];
      sounds.playSuccessChime();
    }
    setSavedUids(updated);
    localStorage.setItem('fcc_saved_overlay_resources', JSON.stringify(updated));
  };

  // Copy citation to clipboard
  const handleCopyCitation = () => {
    if (!activeDetailItem) return;
    const cite = formatCitation(
      {
        author: (activeDetailItem.authors || []).join(', ') || 'Anonymous',
        title: activeDetailItem.title,
        year: activeDetailItem.year,
        publisher: activeDetailItem.publisher,
        doi: activeDetailItem.doi,
        url: activeDetailItem.url || activeDetailItem.readUrl,
        id: activeDetailItem.externalId
      },
      activeCitationStyle
    );
    navigator.clipboard?.writeText(cite);
    setCopiedCitation(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedCitation(false), 2200);
  };

  // Download Citation file (.ris or .bib)
  const handleDownloadCitation = (format) => {
    if (!activeDetailItem) return;
    const isBib = format === 'BIBTEX';
    const content = formatCitation(
      {
        author: (activeDetailItem.authors || []).join(', ') || 'Anonymous',
        title: activeDetailItem.title,
        year: activeDetailItem.year,
        publisher: activeDetailItem.publisher,
        doi: activeDetailItem.doi,
        url: activeDetailItem.url || activeDetailItem.readUrl,
        id: activeDetailItem.externalId
      },
      format
    );
    const filename = `citation-${activeDetailItem.externalId}.${isBib ? 'bib' : 'ris'}`;
    downloadCitationFile(content, filename, isBib ? 'application/x-bibtex' : 'application/x-research-info-systems');
  };

  // Test individual source live connection
  const handleTestSource = async (sourceKey) => {
    sounds.playClick();
    try {
      const res = await fetch(`${API_BASE}/test-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceKey, query: 'cooperative economics' })
      });
      if (res.ok) {
        const json = await res.json();
        alert(`Source: ${json.source}\nStatus: ${json.status?.status?.toUpperCase()}\nSample Discovered: ${json.sampleCount} records\nRoundtrip Latency: ${json.latencyMs}ms`);
      }
    } catch (e) {
      alert(`Source test failed: ${e.message}`);
    }
  };

  // Client-side filtering across already merged results
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      if (selectedType !== 'all' && item.type !== selectedType) return false;
      if (selectedAccess !== 'all') {
        if (selectedAccess === 'full' && item.access !== 'full') return false;
        if (selectedAccess === 'on_shelf' && item.access !== 'on_shelf') return false;
        if (selectedAccess === 'preview' && !['full', 'preview'].includes(item.access)) return false;
      }
      if (selectedSource !== 'all' && item.source !== selectedSource) {
        const inMirrors = (item.availableAt || []).some(m => m.source === selectedSource);
        if (!inMirrors) return false;
      }
      if (freeOnly && item.access !== 'full') return false;
      return true;
    });
  }, [results, selectedType, selectedAccess, selectedSource, freeOnly]);

  return (
    <div className="space-y-6 text-emerald-100 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER: LIVE API OVERLAY & MULTI-SOURCE FEDERATION ENGINE         */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021810] via-[#043320] to-[#01140c] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                LIVE API OVERLAY • ON-DEMAND RESOURCE ENGINE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Federated Academic Discovery
            </h1>

            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              Ask a question or state your assignment task. The library overlay analyzes your requirements, queries worldwide scholarly APIs (Google Books, OpenAlex, Open Library, Internet Archive, Gutenberg, Crossref & Local Stacks) simultaneously in parallel, and merges full-text resources live.
            </p>

            {/* Mode Toggle Buttons */}
            <div className="inline-flex p-1 rounded-2xl bg-[#01140c] border border-emerald-800/80 shadow-inner">
              <button
                onClick={() => { setMode('assistant'); sounds.playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'assistant'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Task Assistant</span>
              </button>

              <button
                onClick={() => { setMode('federated'); sounds.playClick(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  mode === 'federated'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-emerald-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4 text-emerald-300" />
                <span>Multi-API Search</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics & Connected Providers Card */}
          <div className="bg-[#021810]/85 p-4 sm:p-5 rounded-2xl border border-emerald-700/60 shadow-xl shrink-0 w-full lg:w-72 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> API Providers
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                {activeSourcesSelection.length} Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900/80">
                <div className="text-emerald-400/70 text-[9px] uppercase">Catalogue</div>
                <div className="font-bold text-white">FCC Stacks</div>
              </div>
              <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900/80">
                <div className="text-emerald-400/70 text-[9px] uppercase">Books & Scans</div>
                <div className="font-bold text-white">Google & OL</div>
              </div>
              <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900/80">
                <div className="text-emerald-400/70 text-[9px] uppercase">Research Papers</div>
                <div className="font-bold text-white">250M+ OpenAlex</div>
              </div>
              <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900/80">
                <div className="text-emerald-400/70 text-[9px] uppercase">Classics & Archive</div>
                <div className="font-bold text-white">Gutenberg/IA</div>
              </div>
            </div>

            <div className="text-[10px] text-emerald-300/70 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero local bloat • Fetched live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROMPT & SEARCH CONTROLS                                               */}
      {/* ========================================================================= */}
      <div className="bg-[#032317] p-5 sm:p-6 rounded-3xl border border-emerald-800/80 shadow-xl space-y-4">
        {mode === 'assistant' ? (
          /* ASSISTANT FORM */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Describe your research assignment, question or topic:
              </label>
              <span className="text-[10px] text-emerald-400/70 font-mono">
                Plain English accepted (e.g. "I need papers on...")
              </span>
            </div>

            <div className="relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleExecuteAssistant();
                  }
                }}
                rows={3}
                placeholder="Example: I am working on my HND final year thesis about agricultural cooperative finance and micro-credit in Nigeria. Find me empirical studies and textbooks with free full-text downloads..."
                className="w-full p-4 bg-[#021810] border border-emerald-700/80 rounded-2xl text-emerald-100 placeholder-emerald-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition resize-none leading-relaxed"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {promptInput && (
                  <button
                    type="button"
                    onClick={() => setPromptInput('')}
                    className="p-1.5 rounded-lg text-emerald-500 hover:text-white hover:bg-emerald-900/60 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading || !promptInput.trim()}
                  onClick={() => handleExecuteAssistant()}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Planning & Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Plan & Fetch Resources</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Example Task Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono font-bold text-emerald-400">Quick Examples:</span>
              {EXAMPLE_TASKS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(t.prompt);
                    handleExecuteAssistant(t.prompt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#021810] border border-emerald-800/80 hover:border-amber-400 hover:text-white text-emerald-300 text-xs transition"
                >
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-400 font-mono">
                    {t.badge}
                  </span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* STANDARD FEDERATED SEARCH FORM */
          <form onSubmit={handleExecuteSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, DOIs, ISBNs, papers, theses across all connected APIs..."
                  className="w-full pl-11 pr-4 py-3 bg-[#021810] border border-emerald-700/80 rounded-2xl text-emerald-100 placeholder-emerald-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Federated Search</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SOURCE TOGGLE CHIPS & ACTIVE APIS ACCORDION                                */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-emerald-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" /> Connected Sources:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSourcesSelection(availableSources.map(s => s.key))}
                className="text-[10px] text-emerald-400 hover:text-white underline font-mono"
              >
                Select All
              </button>
              <span className="text-emerald-700">•</span>
              <button
                type="button"
                onClick={() => setActiveSourcesSelection(['local', 'google_books', 'open_library', 'openalex'])}
                className="text-[10px] text-emerald-400 hover:text-white underline font-mono"
              >
                Reset Default
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableSources.map(src => {
              const isSelected = activeSourcesSelection.includes(src.key);
              return (
                <button
                  key={src.key}
                  type="button"
                  onClick={() => toggleSourceSelection(src.key)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-600/30 border-emerald-500/80 text-white'
                      : 'bg-[#021810] border-emerald-900 text-emerald-500 hover:text-emerald-300'
                  }`}
                  title={`${src.description} (Click to toggle)`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{src.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FACET FILTERS: TYPE, ACCESS, YEARS                                        */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-emerald-900/60">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800 text-emerald-200 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Formats ({results.length})</option>
            <option value="book">Books ({facets.type?.book || 0})</option>
            <option value="ebook">eBooks ({facets.type?.ebook || 0})</option>
            <option value="paper">Research Papers ({facets.type?.paper || 0})</option>
            <option value="thesis">HND/ND Theses ({facets.type?.thesis || 0})</option>
            <option value="archive">Archives & Historical ({facets.type?.archive || 0})</option>
          </select>

          {/* Access Filter */}
          <select
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800 text-emerald-200 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Access Levels</option>
            <option value="full">🟢 Free Full Text Online</option>
            <option value="on_shelf">🏢 On Campus Physical Shelf</option>
            <option value="preview">🟡 Preview / Partial</option>
          </select>

          {/* Free Only Toggle */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021810] border border-emerald-800/80 cursor-pointer select-none text-xs text-emerald-300 hover:text-white">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded border-emerald-700 text-emerald-600 focus:ring-0"
            />
            <span className="font-bold text-amber-300">Free to Read Only</span>
          </label>

          {/* Year Range */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-emerald-400/80">Years:</span>
            <input
              type="number"
              placeholder="From"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-16 px-2 py-1 bg-[#021810] border border-emerald-800 rounded-lg text-emerald-200 text-xs font-mono"
            />
            <span className="text-emerald-600">-</span>
            <input
              type="number"
              placeholder="To"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-16 px-2 py-1 bg-[#021810] border border-emerald-800 rounded-lg text-emerald-200 text-xs font-mono"
            />
          </div>

          {/* Reset Filters */}
          {(selectedType !== 'all' || selectedAccess !== 'all' || freeOnly || yearFrom || yearTo) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedAccess('all');
                setSelectedSource('all');
                setFreeOnly(false);
                setYearFrom('');
                setYearTo('');
              }}
              className="text-[11px] text-amber-400 hover:underline font-mono"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. AI TASK PLAN & BRIEFING CARD (When Assistant Mode Run)                 */}
      {/* ========================================================================= */}
      {plan && (
        <div className="rounded-3xl bg-gradient-to-r from-[#032317] via-[#043320] to-[#021810] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>Smart Library Execution Plan</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Engine: {plan.planner === 'gemini' ? 'Gemini AI' : 'Rule Engine'}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-300/80">
                  Target Keyword Query: <strong className="text-amber-300 font-mono">"{plan.query}"</strong>
                </p>
              </div>
            </div>

            {tookMs && (
              <span className="text-[11px] font-mono text-emerald-400 bg-[#021810] px-2.5 py-1 rounded-xl border border-emerald-800 shrink-0">
                ⚡ {tookMs}ms
              </span>
            )}
          </div>

          {/* Synthesis Briefing */}
          {brief && (
            <div className="p-3.5 rounded-2xl bg-[#021810]/90 border border-emerald-700/60 flex items-start gap-3">
              <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-100 leading-relaxed font-medium">
                {brief}
              </p>
            </div>
          )}

          {/* Detected Intents & Query Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#021810]/60 border border-emerald-900/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Detected Research Intents:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(plan.intents || []).map((intent, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono uppercase">
                    • {intent}
                  </span>
                ))}
                {(plan.types || []).map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-mono uppercase">
                    Format: {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#021810]/60 border border-emerald-900/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Automated Steps Executed:
              </span>
              <ul className="space-y-1 text-[11px] text-emerald-200/90 font-mono">
                {(plan.steps || []).map((step, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LIVE API LATENCY & HIT STATUS BAR                                      */}
      {/* ========================================================================= */}
      {sourceStats.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Parallel Fetch Status:
            </span>
            <span className="font-mono text-[11px] text-emerald-400/80">
              {results.length} total raw resources merged
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sourceStats.map(s => {
              const isOk = s.status === 'ok' || s.status === 'cached';
              const isCached = s.status === 'cached';
              return (
                <div
                  key={s.key}
                  onClick={() => handleTestSource(s.key)}
                  className={`p-2.5 rounded-2xl border transition cursor-pointer hover:border-amber-400 ${
                    isOk
                      ? 'bg-[#032317] border-emerald-800/80'
                      : 'bg-[#180a0a] border-red-900/60'
                  }`}
                  title={`${s.label}: Click to test connection`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-white truncate">{s.label}</span>
                    <span className={`w-2 h-2 rounded-full ${isOk ? (isCached ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-red-400'}`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/80">
                    <span>{s.count} found</span>
                    <span>{s.latencyMs ? `${s.latencyMs}ms` : (isCached ? 'cached' : 'err')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RESULTS GRID                                                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {currentTask ? `Resources for: ${currentTask}` : 'Discovered Academic Resources'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              {filteredResults.length} Available
            </span>
          </div>

          <span className="text-xs text-emerald-400/80 font-mono hidden sm:inline">
            Ranked by access level & syllabus relevance
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">Federated Overlay Notice</div>
              <div>{error}</div>
            </div>
            <button
              onClick={() => handleExecuteAssistant()}
              className="px-3 py-1.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-[#021810] rounded-3xl border border-emerald-900/80 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <div className="text-center space-y-1">
              <div className="text-sm font-bold text-white">Querying Global Academic APIs in Parallel...</div>
              <div className="text-xs text-emerald-400/80 font-mono">
                Google Books • OpenAlex • Open Library • Crossref • Gutenberg • FCC Stacks
              </div>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center p-12 bg-[#021810] rounded-3xl border border-emerald-900/80 space-y-3">
            <BookOpen className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Matching Resources</h3>
            <p className="text-xs text-emerald-300/80 max-w-md mx-auto leading-relaxed">
              Try adjusting your search terms or unchecking the "Free to Read Only" filter. You can also pick one of the quick example tasks above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((item) => {
              const isSaved = savedUids.includes(item.uid);
              const isLocal = item.source === 'local';
              const hasReadUrl = Boolean(item.readUrl);
              const mirrors = item.availableAt || [];

              return (
                <div
                  key={item.uid}
                  className="group relative flex flex-col justify-between bg-gradient-to-b from-[#032317] to-[#021810] rounded-2xl border border-emerald-800/80 hover:border-emerald-400 p-4 transition-all duration-300 shadow-xl hover:shadow-emerald-500/10"
                >
                  <div className="space-y-3">
                    {/* Top Row: Format Pill + Source + Save Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Format Tag */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {item.type}
                        </span>

                        {/* Source Tag */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isLocal
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-[#01140c] text-emerald-400 border border-emerald-900'
                        }`}>
                          {item.sourceLabel}
                        </span>

                        {/* Merged duplicates badge */}
                        {mirrors.length > 1 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40" title={`Found in: ${mirrors.map(m => m.sourceLabel).join(', ')}`}>
                            +{mirrors.length - 1} mirrors
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => toggleSaveItem(item, e)}
                        className={`p-1.5 rounded-xl border transition ${
                          isSaved
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-[#021810] text-emerald-400 border-emerald-900 hover:text-white hover:border-emerald-700'
                        }`}
                        title={isSaved ? "Saved in Library" : "Bookmark Resource"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Book Thumbnail & Bibliographic Details */}
                    <div className="flex gap-3">
                      <div className="w-20 h-28 bg-[#01140c] rounded-xl overflow-hidden shadow-md shrink-0 border border-emerald-800/80 relative flex items-center justify-center">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-emerald-600 text-center">
                            <BookOpen className="w-6 h-6 mb-1" />
                            <span className="text-[8px] font-mono uppercase">{item.type}</span>
                          </div>
                        )}

                        {/* Access badge overlay on cover */}
                        {item.access === 'on_shelf' && (
                          <span className="absolute bottom-1 left-1 right-1 text-center px-1 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[8px]">
                            SHELF
                          </span>
                        )}
                        {item.access === 'full' && (
                          <span className="absolute bottom-1 left-1 right-1 text-center px-1 py-0.5 rounded bg-teal-500 text-slate-950 font-mono font-bold text-[8px]">
                            FREE PDF
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-200 transition">
                          {item.title}
                        </h3>

                        {item.subtitle && (
                          <p className="text-[10px] text-emerald-400/80 line-clamp-1 italic">
                            {item.subtitle}
                          </p>
                        )}

                        <p className="text-[11px] text-emerald-300/80 truncate">
                          {(item.authors || []).join(', ') || 'Unknown Author'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-emerald-400 font-mono">
                          {item.year && <span>{item.year}</span>}
                          {item.publisher && <span className="truncate max-w-[120px]">• {item.publisher}</span>}
                          {item.citations !== null && item.citations !== undefined && (
                            <span className="flex items-center gap-0.5 text-amber-300">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {item.citations}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shelf Location or Access Banner */}
                    {item.holdings?.shelf && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 font-mono flex items-center justify-between">
                        <span>📍 Shelf: <strong>{item.holdings.shelf}</strong></span>
                        <span>Call: {item.holdings.callNumber}</span>
                      </div>
                    )}

                    {/* Brief snippet */}
                    {item.description && (
                      <p className="text-[11px] text-emerald-300/70 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Subject Pills */}
                    {(item.subjects || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.subjects.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-md bg-[#021810] text-emerald-400/80 border border-emerald-900 truncate max-w-[140px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-emerald-900/60">
                    {/* Read / Access Button */}
                    {hasReadUrl ? (
                      <a
                        href={item.readUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Online</span>
                        <ArrowUpRight className="w-3 h-3 text-emerald-200" />
                      </a>
                    ) : item.appRoute ? (
                      <a
                        href={`#${item.appRoute}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white font-bold text-xs transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open in Campus</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => openDetailModal(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 font-bold text-xs border border-emerald-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Dossier</span>
                      </button>
                    )}

                    {/* Citations & Mirrors Trigger */}
                    <button
                      onClick={() => openDetailModal(item)}
                      className="p-1.5 rounded-xl bg-[#021810] border border-emerald-900 hover:border-emerald-600 text-emerald-400 hover:text-white transition"
                      title="Generate Citations & View Mirrors"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>

                    {/* External Link */}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-[#021810] border border-emerald-900 hover:border-emerald-600 text-emerald-400 hover:text-white transition"
                        title="Open Publisher / Provider Record"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. DEEP BIBLIOGRAPHIC & CITATION MODAL                                    */}
      {/* ========================================================================= */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#032317] to-[#021810] border border-emerald-600/50 rounded-3xl p-6 shadow-2xl space-y-5 text-emerald-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-emerald-900 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-bold">
                    {activeDetailItem.type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Source: {activeDetailItem.sourceLabel}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {activeDetailItem.title}
                </h2>
                <p className="text-xs text-emerald-300">
                  {(activeDetailItem.authors || []).join(', ') || 'Unknown Author'}
                </p>
              </div>

              <button
                onClick={() => setActiveDetailItem(null)}
                className="p-2 rounded-xl bg-[#01140c] text-emerald-400 hover:text-white border border-emerald-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center p-4 text-xs text-emerald-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching live mirror metadata & citations...</span>
              </div>
            )}

            {/* Abstract / Summary */}
            {activeDetailItem.description && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">Description / Abstract</span>
                <p className="text-xs text-emerald-200/90 leading-relaxed bg-[#01140c] p-3 rounded-2xl border border-emerald-900/80">
                  {activeDetailItem.description}
                </p>
              </div>
            )}

            {/* Quick Identifier Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {activeDetailItem.year && (
                <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900">
                  <span className="text-[10px] text-emerald-500 block">Publication Year</span>
                  <span className="font-bold text-white">{activeDetailItem.year}</span>
                </div>
              )}
              {activeDetailItem.publisher && (
                <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900">
                  <span className="text-[10px] text-emerald-500 block">Publisher</span>
                  <span className="font-bold text-white truncate block">{activeDetailItem.publisher}</span>
                </div>
              )}
              {activeDetailItem.isbn && (
                <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900">
                  <span className="text-[10px] text-emerald-500 block">ISBN</span>
                  <span className="font-bold text-white">{activeDetailItem.isbn}</span>
                </div>
              )}
              {activeDetailItem.doi && (
                <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900">
                  <span className="text-[10px] text-emerald-500 block">DOI</span>
                  <span className="font-bold text-white truncate block">{activeDetailItem.doi}</span>
                </div>
              )}
              {activeDetailItem.citations !== null && activeDetailItem.citations !== undefined && (
                <div className="p-2 rounded-xl bg-[#01140c] border border-emerald-900">
                  <span className="text-[10px] text-emerald-500 block">Scholarly Citations</span>
                  <span className="font-bold text-amber-300">{activeDetailItem.citations}</span>
                </div>
              )}
              {activeDetailItem.holdings?.shelf && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] text-amber-300 block">Physical Shelf</span>
                  <span className="font-bold text-white">{activeDetailItem.holdings.shelf}</span>
                </div>
              )}
            </div>

            {/* Available Mirrors across APIs */}
            {(activeDetailItem.availableAt || []).length > 1 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                  Available Mirrors & Federated Endpoints:
                </span>
                <div className="space-y-1.5">
                  {activeDetailItem.availableAt.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#01140c] border border-emerald-900 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{m.sourceLabel}</span>
                        <span className="text-[10px] text-emerald-400">({m.access})</span>
                      </div>
                      {m.readUrl ? (
                        <a href={m.readUrl} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">
                          <span>Read Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : m.url ? (
                        <a href={m.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                          <span>Catalogue</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CITATION GENERATOR */}
            <div className="space-y-2.5 pt-2 border-t border-emerald-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-amber-400" /> Academic Citation Generator:
                </span>
                <div className="flex gap-1">
                  {['APA', 'MLA', 'HARVARD', 'CHICAGO', 'IEEE'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setActiveCitationStyle(style)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                        activeCitationStyle === style
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#01140c] text-emerald-400 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatted Citation Text Box */}
              <div className="p-3 rounded-2xl bg-[#01140c] border border-emerald-800 text-xs text-emerald-100 font-serif leading-relaxed">
                {formatCitation(
                  {
                    author: (activeDetailItem.authors || []).join(', ') || 'Anonymous',
                    title: activeDetailItem.title,
                    year: activeDetailItem.year,
                    publisher: activeDetailItem.publisher,
                    doi: activeDetailItem.doi,
                    url: activeDetailItem.url || activeDetailItem.readUrl,
                    id: activeDetailItem.externalId
                  },
                  activeCitationStyle
                )}
              </div>

              {/* Citation Copy / Export Controls */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleCopyCitation}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCitation('BIBTEX')}
                    className="px-3 py-2 rounded-xl bg-[#01140c] text-emerald-300 hover:text-white border border-emerald-800 text-xs font-mono"
                    title="Export BibTeX for LaTeX / Overleaf"
                  >
                    BibTeX (.bib)
                  </button>
                  <button
                    onClick={() => handleDownloadCitation('RIS')}
                    className="px-3 py-2 rounded-xl bg-[#01140c] text-emerald-300 hover:text-white border border-emerald-800 text-xs font-mono"
                    title="Export RIS for Zotero / Mendeley / EndNote"
                  >
                    RIS (.ris)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
