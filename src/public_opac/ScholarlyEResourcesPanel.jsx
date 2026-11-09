import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers, Sparkles, ExternalLink, Loader2, FileText, Copy, Check, Quote,
  BookmarkPlus, BookmarkCheck, Filter, RefreshCw, Unlock, Lock, Calendar,
  TrendingUp, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Search,
  Clock, Database, Zap, XCircle, Globe
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

/**
 * Scholarly E-Resources Panel (AGORA • JSTOR • ScienceDirect • EBSCOhost • DOAJ • Europe PMC)
 * ---------------------------------------------------------------------------------------
 * Talks to GET /api/scholarly/search (FCC Federated Scholarly Engine v3) and provides:
 *  - Per-database tabs with live counts and health/latency indicators
 *  - Open-access filter, year range, sort (relevance / newest / most cited)
 *  - Abstract preview, keywords, APA citation copy, DOI copy, PDF/full-text links
 *  - "Load more" pagination, saved reading list (localStorage)
 */

const PLATFORM_ORDER = ['sciencedirect', 'agora', 'jstor', 'ebsco', 'doaj', 'europe_pmc'];
const FALLBACK_META = {
  sciencedirect: { name: 'ScienceDirect', badge: '🔬 ScienceDirect', color: '#ff6f00', label: 'Elsevier ScienceDirect & Scopus' },
  agora: { name: 'AGORA (Research4Life)', badge: '🌾 AGORA', color: '#16a34a', label: 'AGORA – Research4Life / FAO' },
  jstor: { name: 'JSTOR', badge: '🏛️ JSTOR', color: '#b91c1c', label: 'JSTOR Digital Library' },
  ebsco: { name: 'EBSCOhost', badge: '📚 EBSCOhost', color: '#2563eb', label: 'EBSCOhost Research Databases' },
  doaj: { name: 'DOAJ', badge: '🌐 DOAJ', color: '#ca8a04', label: 'Directory of Open Access Journals' },
  europe_pmc: { name: 'Europe PMC', badge: '🧬 Europe PMC', color: '#059669', label: 'Europe PMC Life Sciences' },
};
const SUGGESTED_TOPICS = [
  'cooperative economics', 'agricultural extension', 'microfinance', 'food security',
  'accounting information systems', 'rural development', 'banking and finance', 'climate-smart agriculture',
];
const SAVED_KEY = 'fcc_saved_eresources';
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR + 1 - i);

function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function ResultCard({ item, isSaved, onToggleSave }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState('');
  const color = item.platform_color || '#10b981';
  const fullTextUrl = item.pdf_url || item.oa_url || null;

  const handleCopy = async (kind, text) => {
    if (await copyText(text)) {
      setCopied(kind);
      sounds?.playClick?.();
      setTimeout(() => setCopied(''), 1800);
    }
  };

  return (
    <article
      className="group relative flex flex-col rounded-2xl bg-[#032317]/90 border border-emerald-800/70 hover:border-emerald-400/70 shadow-lg hover:shadow-emerald-950/80 transition overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} />
      <div className="p-4 pl-5 flex-1 space-y-2.5">
        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono text-white" style={{ backgroundColor: color }}>
            {item.platform_badge}
          </span>
          {item.is_open_access ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
              <Unlock size={9} /> Open Access
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
              <Lock size={9} /> Institutional
            </span>
          )}
          {item.pdf_url && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">PDF</span>
          )}
          {item.type && (
            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">{item.type}</span>
          )}
          {item.year && (
            <span className="ml-auto text-[10px] font-mono text-emerald-300/90 font-bold">{item.year}</span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[13px] leading-snug font-bold text-white group-hover:text-teal-200 transition">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-teal-400/60" title={item.title}>
            {item.title}
          </a>
        </h4>

        {/* Authors / Source */}
        <p className="text-[11px] text-slate-300 line-clamp-1" title={item.author}>{item.author}</p>
        <p className="text-[10.5px] text-emerald-400/90 font-mono line-clamp-2">
          <span className="italic">{item.source}</span>
          {item.volume_issue ? `, ${item.volume_issue}` : ''}
          {item.pages ? `, pp. ${item.pages}` : ''}
          {item.publisher && item.publisher !== item.source ? ` • ${item.publisher}` : ''}
        </p>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="inline-flex items-center gap-1" title="Times cited">
            <TrendingUp size={11} className="text-amber-400" /> {Number(item.citations || 0).toLocaleString()} citations
          </span>
          {item.subject && (
            <span className="inline-flex items-center gap-1 text-teal-300/80"><Layers size={11} /> {item.subject}</span>
          )}
          {Array.isArray(item.also_in) && item.also_in.length > 0 && (
            <span className="text-indigo-300/90" title="Also indexed in">Also in: {item.also_in.join(', ')}</span>
          )}
        </div>

        {/* Abstract */}
        {item.abstract ? (
          <div className="text-[11px] text-slate-300/90 leading-relaxed">
            <p className={expanded ? '' : 'line-clamp-3'}>{item.abstract}</p>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-300 hover:text-teal-200"
            >
              {expanded ? <>Show less <ChevronUp size={11} /></> : <>Read abstract <ChevronDown size={11} /></>}
            </button>
          </div>
        ) : (
          <p className="text-[10.5px] italic text-slate-500">No abstract supplied by the publisher.</p>
        )}

        {/* Keywords */}
        {Array.isArray(item.keywords) && item.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.keywords.slice(0, 5).map(k => (
              <span key={k} className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">{k}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pl-5 py-3 border-t border-emerald-900/70 bg-black/20 flex flex-wrap items-center gap-1.5">
        <a
          href={fullTextUrl || item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[120px] py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] text-center transition inline-flex items-center justify-center gap-1"
        >
          {fullTextUrl ? <FileText size={12} /> : <ExternalLink size={12} />}
          <span>{fullTextUrl ? 'Read Full Text' : (item.is_open_access ? 'Open Article' : 'Access via Gateway')}</span>
        </a>
        <button
          type="button"
          onClick={() => handleCopy('apa', item.citation_apa || item.title)}
          className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold inline-flex items-center gap-1"
          title="Copy APA 7th citation"
        >
          {copied === 'apa' ? <Check size={11} className="text-emerald-400" /> : <Quote size={11} />} {copied === 'apa' ? 'Copied' : 'Cite'}
        </button>
        {item.doi && (
          <button
            type="button"
            onClick={() => handleCopy('doi', `https://doi.org/${item.doi}`)}
            className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-mono inline-flex items-center gap-1"
            title={`Copy DOI: ${item.doi}`}
          >
            {copied === 'doi' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />} DOI
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleSave(item)}
          className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition ${
            isSaved ? 'bg-amber-600/90 border-amber-400 text-white' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
          title={isSaved ? 'Remove from reading list' : 'Save to reading list'}
        >
          {isSaved ? <BookmarkCheck size={11} /> : <BookmarkPlus size={11} />}
        </button>
        {item.portal_url && (
          <a
            href={item.portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono"
            title={`Open ${item.platform} portal`}
          >
            Portal
          </a>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#032317]/70 border border-emerald-900/70 p-4 space-y-3 animate-pulse">
      <div className="flex gap-2"><div className="h-4 w-24 bg-emerald-900/70 rounded" /><div className="h-4 w-16 bg-emerald-900/50 rounded" /></div>
      <div className="h-4 w-11/12 bg-emerald-900/60 rounded" />
      <div className="h-4 w-8/12 bg-emerald-900/60 rounded" />
      <div className="h-3 w-6/12 bg-emerald-900/40 rounded" />
      <div className="h-12 w-full bg-emerald-900/30 rounded" />
      <div className="h-7 w-full bg-emerald-900/50 rounded" />
    </div>
  );
}

export default function ScholarlyEResourcesPanel({ query = '', searchNonce = 0 }) {
  const [activeQuery, setActiveQuery] = useState(query || '');
  const [localQuery, setLocalQuery] = useState(query || '');
  const [results, setResults] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [platformTab, setPlatformTab] = useState('all');
  const [oaOnly, setOaOnly] = useState(false);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sort, setSort] = useState('relevance');
  const [perPlatform, setPerPlatform] = useState(8);
  const [showSaved, setShowSaved] = useState(false);
  const [saved, setSaved] = useState(loadSaved);

  const requestIdRef = useRef(0);

  // Sync from parent search bar on submit
  useEffect(() => {
    if (query && query.trim().length >= 2) {
      setActiveQuery(query.trim());
      setLocalQuery(query.trim());
    }
  }, [searchNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = useCallback(async ({ q, pageNum = 1, append = false, refresh = false }) => {
    const term = (q || '').trim();
    if (term.length < 2) return;
    const myId = ++requestIdRef.current;
    append ? setLoadingMore(true) : setLoading(true);
    setError('');

    const params = new URLSearchParams({
      query: term,
      per_page: String(perPlatform),
      page: String(pageNum),
      sort,
    });
    if (oaOnly) params.set('oa_only', '1');
    if (yearFrom) params.set('year_from', yearFrom);
    if (yearTo) params.set('year_to', yearTo);
    if (refresh) params.set('refresh', '1');

    const base = getApiBase();
    const urls = [`${base}/scholarly/search?${params}`];
    if (base !== '/api') urls.push(`/api/scholarly/search?${params}`);

    let data = null;
    let lastErr = '';
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          data = await res.json();
          break;
        }
        lastErr = `Server responded with HTTP ${res.status}`;
      } catch (e) {
        lastErr = e?.message || 'Network error';
      }
    }

    if (myId !== requestIdRef.current) return; // a newer request superseded this one

    if (!data || !data.success) {
      setError(lastErr || 'The E-Resources service is temporarily unavailable.');
      if (!append) {
        setResults([]);
        setPlatforms([]);
      }
    } else {
      const incoming = Array.isArray(data.results) ? data.results : [];
      setResults(prev => {
        if (!append) return incoming;
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...incoming.filter(r => !seen.has(r.id))];
      });
      setPlatforms(Array.isArray(data.platforms) ? data.platforms : []);
      setMeta({
        total: data.total_matches,
        totalAvailable: data.total_available,
        tookMs: data.took_ms,
        cached: data.cached,
        hasMore: data.has_more,
        facets: data.facets || {},
      });
      setPage(pageNum);
      if (incoming.length > 0) sounds?.playSuccessChime?.();
    }
    append ? setLoadingMore(false) : setLoading(false);
  }, [perPlatform, sort, oaOnly, yearFrom, yearTo]);

  // Re-run whenever the query or any filter changes
  useEffect(() => {
    if (activeQuery && activeQuery.trim().length >= 2) {
      runSearch({ q: activeQuery, pageNum: 1 });
    }
  }, [activeQuery, runSearch]);

  const toggleSave = (item) => {
    setSaved(prev => {
      const exists = prev.some(s => s.id === item.id);
      const next = exists ? prev.filter(s => s.id !== item.id) : [{ ...item, saved_at: new Date().toISOString() }, ...prev].slice(0, 200);
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const savedIds = useMemo(() => new Set(saved.map(s => s.id)), [saved]);

  const platformMap = useMemo(() => {
    const m = {};
    platforms.forEach(p => { m[p.id] = p; });
    return m;
  }, [platforms]);

  const countsByPlatform = useMemo(() => {
    const c = {};
    results.forEach(r => { c[r.platform_id] = (c[r.platform_id] || 0) + 1; });
    return c;
  }, [results]);

  const visibleResults = useMemo(() => {
    const list = showSaved ? saved : results;
    if (platformTab === 'all') return list;
    return list.filter(r => r.platform_id === platformTab);
  }, [results, saved, showSaved, platformTab]);

  const handleLocalSubmit = (e) => {
    e?.preventDefault?.();
    const t = localQuery.trim();
    if (t.length < 2) return;
    setShowSaved(false);
    if (t === activeQuery) runSearch({ q: t, pageNum: 1 });
    else setActiveQuery(t);
  };

  const resetFilters = () => {
    setOaOnly(false);
    setYearFrom('');
    setYearTo('');
    setSort('relevance');
    setPlatformTab('all');
  };

  const okCount = platforms.filter(p => p.status === 'ok').length;
  const queriedCount = platforms.filter(p => ['ok', 'error'].includes(p.status)).length;

  return (
    <section className="space-y-4 p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#021c13] via-[#01160f] to-[#01110b] border border-teal-600/40 shadow-2xl relative overflow-hidden animate-fadeIn">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-900/60 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0">
            <Database size={22} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
              Scholarly E-Resources
              <span className="ml-2 text-[10px] align-middle px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/40 font-mono">Federated Engine v3</span>
            </h3>
            <p className="text-[11px] text-emerald-200/80">
              AGORA • JSTOR • ScienceDirect • EBSCOhost • DOAJ • Europe PMC - peer-reviewed journal articles only, searched concurrently.
            </p>
          </div>
        </div>
        {meta && !loading && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300">
              <strong className="text-white">{Number(meta.totalAvailable || 0).toLocaleString()}</strong> records available
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 inline-flex items-center gap-1">
              <Clock size={10} /> {meta.cached ? 'cached' : `${meta.tookMs} ms`}
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 inline-flex items-center gap-1">
              <Zap size={10} /> {okCount}/{queriedCount} databases online
            </span>
          </div>
        )}
      </div>

      {/* Search + filter bar */}
      <form onSubmit={handleLocalSubmit} className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder="Search journal articles, authors, DOIs, topics…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border border-emerald-700/70 focus:border-teal-400 focus:outline-none text-sm text-white placeholder:text-emerald-500/60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || localQuery.trim().length < 2}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Search E-Resources
        </button>
      </form>

      <div className="relative flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold"><Filter size={12} /> Refine:</span>
        <button
          type="button"
          onClick={() => setOaOnly(v => !v)}
          className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition ${
            oaOnly ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-[#021810] border-emerald-800 text-emerald-300 hover:border-emerald-600'
          }`}
        >
          <Unlock size={11} /> Open Access only
        </button>
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <Calendar size={12} />
          <select value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="bg-[#021810] border border-emerald-800 rounded-lg px-1.5 py-1 text-white">
            <option value="">From</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span>–</span>
          <select value={yearTo} onChange={e => setYearTo(e.target.value)} className="bg-[#021810] border border-emerald-800 rounded-lg px-1.5 py-1 text-white">
            <option value="">To</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </span>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-[#021810] border border-emerald-800 rounded-lg px-2 py-1 text-white">
          <option value="relevance">Sort: Relevance</option>
          <option value="newest">Sort: Newest first</option>
          <option value="citations">Sort: Most cited</option>
        </select>
        <select value={perPlatform} onChange={e => setPerPlatform(Number(e.target.value))} className="bg-[#021810] border border-emerald-800 rounded-lg px-2 py-1 text-white" title="Results per database">
          {[4, 6, 8, 12, 20].map(n => <option key={n} value={n}>{n} per database</option>)}
        </select>
        {(oaOnly || yearFrom || yearTo || sort !== 'relevance') && (
          <button type="button" onClick={resetFilters} className="px-2 py-1 rounded-lg text-rose-300 hover:text-white border border-rose-800/60 hover:bg-rose-900/40">
            Reset
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSaved(v => !v)}
            className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 ${
              showSaved ? 'bg-amber-600 border-amber-400 text-white' : 'bg-[#021810] border-emerald-800 text-amber-300 hover:border-amber-500'
            }`}
          >
            <BookmarkCheck size={11} /> Reading list ({saved.length})
          </button>
          {activeQuery && (
            <button
              type="button"
              onClick={() => runSearch({ q: activeQuery, pageNum: 1, refresh: true })}
              className="px-2 py-1 rounded-lg bg-[#021810] border border-emerald-800 text-emerald-300 hover:text-white inline-flex items-center gap-1"
              title="Bypass cache and re-query all databases"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Platform tabs with health */}
      {(platforms.length > 0 || showSaved) && (
        <div className="relative flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setPlatformTab('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
              platformTab === 'all' ? 'bg-teal-600 border-teal-300 text-white' : 'bg-[#021810] border-emerald-800 text-emerald-300 hover:border-emerald-600'
            }`}
          >
            <Globe size={11} className="inline mr-1" /> All databases ({showSaved ? saved.length : results.length})
          </button>
          {PLATFORM_ORDER.map(id => {
            const p = platformMap[id] || { ...FALLBACK_META[id], id, status: 'skipped' };
            const m = FALLBACK_META[id];
            const count = showSaved ? saved.filter(s => s.platform_id === id).length : (countsByPlatform[id] || 0);
            const isActive = platformTab === id;
            const statusIcon = p.status === 'ok'
              ? <CheckCircle2 size={10} className="text-emerald-400" />
              : p.status === 'error'
                ? <AlertTriangle size={10} className="text-amber-400" />
                : p.status === 'disabled'
                  ? <XCircle size={10} className="text-slate-500" />
                  : null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlatformTab(id)}
                disabled={p.status === 'disabled'}
                title={
                  p.status === 'disabled' ? 'Disabled by the developer'
                    : p.status === 'error' ? `Temporarily unavailable: ${p.error || 'unknown error'}`
                      : `${(p.total_available || 0).toLocaleString()} records available${p.latency_ms ? ` • ${p.latency_ms} ms` : ''}${p.fallback ? ` • via ${p.fallback}` : ''}`
                }
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive ? 'text-white shadow-lg' : 'bg-[#021810] text-emerald-200 border-emerald-800 hover:border-emerald-600'
                }`}
                style={isActive ? { backgroundColor: m.color, borderColor: m.color } : undefined}
              >
                {statusIcon}
                <span>{m.badge}</span>
                <span className={`font-mono text-[10px] px-1.5 rounded ${isActive ? 'bg-black/25' : 'bg-emerald-950 text-emerald-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div className="relative">
        {!activeQuery && !showSaved ? (
          <div className="py-10 text-center space-y-4">
            <Database size={34} className="mx-auto text-teal-400/70" />
            <p className="text-sm text-emerald-100 font-semibold">Search millions of peer-reviewed articles across six academic databases.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_TOPICS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setLocalQuery(t); setActiveQuery(t); }}
                  className="px-3 py-1.5 rounded-full bg-emerald-950 border border-emerald-800 hover:border-teal-400 text-emerald-200 text-[11px]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : loading && !showSaved ? (
          <div className="space-y-3">
            <p className="text-[11px] text-emerald-300 inline-flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" /> Querying ScienceDirect, AGORA, JSTOR, EBSCOhost, DOAJ and Europe PMC for “{activeQuery}”…
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : error && !showSaved ? (
          <div className="py-10 text-center space-y-3">
            <AlertTriangle size={30} className="mx-auto text-amber-400" />
            <p className="text-sm text-amber-200">{error}</p>
            <button
              type="button"
              onClick={() => runSearch({ q: activeQuery, pageNum: 1, refresh: true })}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Try again
            </button>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Search size={28} className="mx-auto text-emerald-500/70" />
            <p className="text-sm text-emerald-100">
              {showSaved ? 'Your reading list is empty. Use the bookmark button on any article to save it.' : `No journal articles matched “${activeQuery}” with the current filters.`}
            </p>
            {!showSaved && (oaOnly || yearFrom || yearTo || platformTab !== 'all') && (
              <button type="button" onClick={resetFilters} className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold">Clear filters</button>
            )}
            {!showSaved && platformTab !== 'all' && platformMap[platformTab]?.search_url && (
              <a href={platformMap[platformTab].search_url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-teal-300 underline">
                Search “{activeQuery}” directly on {platformMap[platformTab].name} ↗
              </a>
            )}
          </div>
        ) : (
          <>
            {!showSaved && meta?.facets && (
              <div className="mb-3 flex flex-wrap items-center gap-3 text-[10.5px] font-mono text-emerald-300/90">
                <span>Showing <strong className="text-white">{visibleResults.length}</strong> articles</span>
                <span>• <strong className="text-white">{meta.facets.open_access || 0}</strong> open access</span>
                <span>• <strong className="text-white">{meta.facets.with_pdf || 0}</strong> with PDF</span>
                {platformTab !== 'all' && platformMap[platformTab]?.search_url && (
                  <a href={platformMap[platformTab].search_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-teal-300 hover:text-white inline-flex items-center gap-1">
                    Continue on {platformMap[platformTab].name} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleResults.map(item => (
                <ResultCard key={item.id} item={item} isSaved={savedIds.has(item.id)} onToggleSave={toggleSave} />
              ))}
            </div>
            {!showSaved && meta?.hasMore && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => runSearch({ q: activeQuery, pageNum: page + 1, append: true })}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl bg-[#032317] border border-teal-500/60 hover:bg-teal-900/40 text-teal-200 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
                  {loadingMore ? 'Loading more articles…' : 'Load more articles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

