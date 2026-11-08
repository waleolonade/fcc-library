import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, BookOpen, ExternalLink, Search, Globe, Building, Award,
  CheckCircle, Download, Share2, Sparkles, Filter, RefreshCw, Loader2,
  Bookmark, ChevronRight, FileText, Star, ShieldCheck, Check, Database,
  ArrowUpRight, Copy, BookMarked, Hash, Info, Library, Quote, TrendingUp,
  Unlock, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import TroveExplorer from './TroveExplorer';
import { isApiActive } from '../services/federatedLibrarySearchService';
import { getApiBase } from '../api/libraryApi';

// FCC Flagship Institutional Scholar Journals
const SCHOLARLY_JOURNALS = [
  {
    id: 'JRN-01',
    title: 'Nigerian Journal of Co-operative Economics & Rural Development (NJCERD)',
    shortCode: 'NJCERD',
    issn: '',
    frequency: 'Quarterly (March, June, September, December)',
    publisher: 'FCC Academic Press & Directorate of Research & Innovation',
    latestIssue: 'Vol. 18, No. 2 (June 2026)',
    indexedIn: 'African Journals Online (AJOL), Crossref, Google Scholar, DOAJ Listed',
    scope: 'Empirical and theoretical treatises on cooperative enterprise governance, agrarian micro-credit, apex unions, micro-insurance schemes, and community socio-economic resilience.',
    articlesCount: 48,
    openAccess: true,
    discipline: 'Cooperative Economics',
    rating: 4.9,
    doiPrefix: '10.5897/NJCERD',
    pdfUrl: ''
  },
  {
    id: 'JRN-02',
    title: 'West African Journal of Applied Computing & Information Systems (WAJACIS)',
    shortCode: 'WAJACIS',
    issn: '2276-9048',
    frequency: 'Bi-Annual (May & November)',
    publisher: 'Faculty of Science & Computing, FCC Ibadan',
    latestIssue: 'Vol. 12, Issue 1 (May 2026)',
    indexedIn: 'DOAJ, Scopus Preview, IEEE Xplore Listed, Crossref',
    scope: 'Applied artificial intelligence, neural networks, agro-informatics, smart library management systems, cooperative fintech infrastructures, and cybersecurity.',
    articlesCount: 36,
    openAccess: true,
    discipline: 'Computer Science & AI',
    rating: 4.8,
    doiPrefix: '10.5897/WAJACIS',
    pdfUrl: ''
  },
  {
    id: 'JRN-03',
    title: 'Journal of Banking, Sustainable Finance & SME Development',
    shortCode: 'JBSME',
    issn: '1597-4405',
    frequency: 'Tri-Annual (April, August, December)',
    publisher: 'Department of Banking & Finance in partnership with CIBN',
    latestIssue: 'Vol. 9, No. 1 (April 2026)',
    indexedIn: 'EBSCOhost, ProQuest, Crossref, Google Scholar',
    scope: 'Monetary policy transmission, microfinance regulatory frameworks, non-interest cooperative banking, green finance, and SME capitalization in emerging markets.',
    articlesCount: 29,
    openAccess: true,
    discipline: 'Banking & Finance',
    rating: 4.7,
    doiPrefix: '10.5897/JBSME',
    pdfUrl: ''
  },
  {
    id: 'JRN-04',
    title: 'Tropical Journal of Agricultural Extension & Agro-Enterprise Innovation',
    shortCode: 'TJAEE',
    issn: '1119-9180',
    frequency: 'Quarterly (March, June, September, December)',
    publisher: 'FCC Agricultural Extension Directorate & Cooperative Farm Outposts',
    latestIssue: 'Vol. 22, No. 1 (March 2026)',
    indexedIn: 'CAB Direct, AGORA, FAO AGRIS, Crossref',
    scope: 'Participatory agricultural extension, smallholder farmer cooperatives, post-harvest agro-processing value chains, and climate-smart regenerative agriculture.',
    articlesCount: 52,
    openAccess: true,
    discipline: 'Agricultural Extension',
    rating: 4.9,
    doiPrefix: '10.5897/TJAEE',
    pdfUrl: ''
  }
];

const DISCIPLINE_TAGS = [
  'All',
  'Cooperative Economics',
  'Computer Science & AI',
  'Banking & Finance',
  'Agricultural Extension',
  'Management & Governance',
  'Open Access Only'
];

export default function AcademicJournalsDirectory({
  user,
  onOpenReader,
  onNavigateToOpenAlex
}) {
  // Source Filter: 'all' | 'institutional' | 'openalex' | 'trove'
  const [activeSourceTab, setActiveSourceTab] = useState('all');

  // Search & discipline filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  // FCC Institutional & Approved HOD Uploads State
  const [approvedHodJournals, setApprovedHodJournals] = useState([]);
  const [isLoadingHod, setIsLoadingHod] = useState(false);

  // OpenAlex Sources API State
  const [openAlexJournals, setOpenAlexJournals] = useState([]);
  const [openAlexLoading, setOpenAlexLoading] = useState(false);
  const [openAlexMeta, setOpenAlexMeta] = useState({ count: 0, page: 1 });
  const [openAlexPage, setOpenAlexPage] = useState(1);
  const [openAlexError, setOpenAlexError] = useState(null);

  // Federated Major E-Resources (AGORA • JSTOR • ScienceDirect • EBSCO)
  const [scholarlyJournals, setScholarlyJournals] = useState([]);
  const [scholarlyLoading, setScholarlyLoading] = useState(false);
  const [scholarlyPlatform, setScholarlyPlatform] = useState('all');

  // Citation copying notification state
  const [copiedId, setCopiedId] = useState(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState({});

  // Load HOD Approved & Local Serials from backend database
  useEffect(() => {
    const fetchApprovedHodJournals = async () => {
      setIsLoadingHod(true);
      try {
        const [upRes, catRes] = await Promise.allSettled([
          fetch('/api/department-uploads'),
          fetch('/api/catalog')
        ]);
        const combined = [];
        if (upRes.status === 'fulfilled' && upRes.value.ok) {
          const data = await upRes.value.json();
          if (Array.isArray(data)) combined.push(...data);
        }
        if (catRes.status === 'fulfilled' && catRes.value.ok) {
          const cData = await catRes.value.json();
          if (Array.isArray(cData)) combined.push(...cData);
        }
        const seen = new Set();
        const journals = combined.filter(s => {
          if (!s || ['deleted', 'withdrawn', 'purged', 'rejected', 'declined'].includes(String(s.status || '').toLowerCase())) return false;
          let extra = {};
          try {
            if (typeof s.review_notes === 'string' && s.review_notes.trim().startsWith('{')) {
              extra = JSON.parse(s.review_notes);
            }
          } catch {}
          const cat = String(s.category || extra.upload_category || '').toLowerCase();
          const resType = String(s.resource_type || s.resourceType || '').toLowerCase();
          const rights = String(s.rights_status || '').toLowerCase();
          const isJrn =
            cat.includes('journal') ||
            resType.includes('journal') ||
            resType.includes('periodical') ||
            resType.includes('serial') ||
            rights.includes('journal') ||
            String(s.id || '').startsWith('FCC-JRN-') ||
            Boolean(s.issn || extra.issn || extra.journal_name);
          if (!isJrn) return false;
          const key = String(s.title || s.id).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setApprovedHodJournals(journals);
      } catch (err) {
        console.warn('Failed to load approved HOD journals:', err);
      } finally {
        setIsLoadingHod(false);
      }
    };

    fetchApprovedHodJournals();
  }, []);

  // Fetch OpenAlex Sources / Journals API (with direct CORS-enabled fallback)
  const fetchOpenAlexJournals = async (query = searchQuery, targetPage = 1) => {
    if (!isApiActive('openalex')) {
      setOpenAlexJournals([]);
      setOpenAlexError('OpenAlex API is temporarily offline / muted by the Lead Developer.');
      setOpenAlexLoading(false);
      return;
    }
    setOpenAlexLoading(true);
    setOpenAlexError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('search', query.trim());
      }
      params.append('filter', openAccessOnly ? 'type:journal,is_oa:true' : 'type:journal');
      params.append('page', targetPage.toString());
      params.append('per_page', '12');

      let res = await fetch(`/api/openalex/sources?${params.toString()}`).catch(() => null);
      if (!res || !res.ok) {
        params.delete('per_page');
        params.append('per-page', '12');
        params.append('mailto', 'library@fccibadan.edu.ng');
        params.append('api_key', 'FD6xNHEEyHhLMW5Htsx3Vv');
        res = await fetch(`https://api.openalex.org/sources?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'api_key': 'FD6xNHEEyHhLMW5Htsx3Vv',
            'Authorization': 'Bearer FD6xNHEEyHhLMW5Htsx3Vv'
          }
        });
      }
      if (!res.ok) {
        throw new Error(`OpenAlex API responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      setOpenAlexJournals(data.results || []);
      setOpenAlexMeta(data.meta || { count: 0, page: targetPage });
    } catch (e) {
      console.error('Error querying OpenAlex Journals API:', e);
      setOpenAlexError(e.message || 'Failed to query OpenAlex sources.');
    } finally {
      setOpenAlexLoading(false);
    }
  };

  const fetchScholarlyJournals = async (query = searchQuery, platform = scholarlyPlatform) => {
    setScholarlyLoading(true);
    try {
      const q = (query || '').trim() || 'cooperative agriculture economics business finance';
      const base = getApiBase();
      const urls = [
        `${base}/scholarly/search?query=${encodeURIComponent(q)}&platform=${platform}&per_page=12`,
        `/api/scholarly/search?query=${encodeURIComponent(q)}&platform=${platform}&per_page=12`
      ];
      let data = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, { headers: { Accept: 'application/json' } });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch {}
      }
      if (data && Array.isArray(data.results)) {
        setScholarlyJournals(data.results);
      }
    } catch (e) {
      console.warn('Error fetching scholarly journals:', e);
    } finally {
      setScholarlyLoading(false);
    }
  };

  const handleCopyCitation = (item) => {
    if (!item) return;
    let text = '';
    if (item.citation_apa) {
      text = item.citation_apa;
    } else if (item.publisher && item.latestIssue) {
      text = `${item.publisher} (2026). ${item.title}. ${item.latestIssue}. ISSN: ${item.issn || 'N/A'}. Available via Federal Co-operative College Academic Repository.`;
    } else {
      text = `${item.author || item.publisher || 'Scholar'} (${item.year || '2026'}). ${item.title}. ${item.source || ''}. ${item.doi ? `https://doi.org/${item.doi}` : item.url || ''}`;
    }
    navigator.clipboard?.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Initial & Debounced Search for OpenAlex Journals and Federated E-Resources
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpenAlexJournals(searchQuery, 1);
      fetchScholarlyJournals(searchQuery, scholarlyPlatform);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, openAccessOnly, scholarlyPlatform]);

  // Normalized Institutional Journals (FCC Flagship + HOD Uploaded Local Journals)
  const normalizedInstitutionalJournals = useMemo(() => {
    const list = [];

    approvedHodJournals.forEach((j, i) => {
      let parsedNotes = {};
      try {
        const rawNotes = j.review_notes || j.notes;
        if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
          parsedNotes = JSON.parse(rawNotes);
        }
      } catch (e) {}

      list.push({
        id: j.book_id || j.id || `HOD-JRN-${i}`,
        title: j.title || j.resource_title || 'Institutional Journal Serial',
        shortCode: `HOD-JRN-${i + 1}`,
        issn: j.issn || parsedNotes.issn || String(j.isbn || '').replace(/^ISSN\s*/i, '') || '',
        frequency: j.frequency || parsedNotes.volume_issue || 'Departmental Peer-Reviewed Issue',
        publisher: parsedNotes.journal_name || j.journal_name || j.publisher || `Department of ${j.department_name || j.department || 'Academic Studies'}`,
        latestIssue: parsedNotes.volume_issue || j.volume_issue || j.edition || 'Academic Issue',
        indexedIn: 'Federal Co-operative College Institutional Repository & Open-Access Archive',
        scope: parsedNotes.abstract || j.description || j.abstract || `Official Academic Journal uploaded locally by ${j.hod_name || j.uploaded_by || 'Department HOD'}.`,
        articlesCount: 1,
        openAccess: true,
        discipline: j.department_name || j.department || 'Cooperative Studies',
        rating: 4.9,
        doiPrefix: parsedNotes.doi || j.doi || '',
        isHodUpload: true,
        author: j.author || j.hod_name || 'Faculty Researcher',
        fileDataUrl: j.file_url || j.pdfUrl || `/api/catalog/${j.book_id || j.id}/file`,
        fileName: j.file_name || 'journal_issue.pdf',
        coverImage: j.cover_image || j.coverImage || '/assets/fcc-logo.png'
      });
    });

    return [...list, ...SCHOLARLY_JOURNALS];
  }, [approvedHodJournals]);

  // Filter Institutional Journals by search & discipline
  const filteredInstitutional = useMemo(() => {
    return normalizedInstitutionalJournals.filter(j => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        j.title.toLowerCase().includes(q) ||
        j.issn.toLowerCase().includes(q) ||
        j.scope.toLowerCase().includes(q) ||
        j.publisher.toLowerCase().includes(q) ||
        j.discipline.toLowerCase().includes(q);

      const matchDiscipline = selectedDiscipline === 'All' ||
        selectedDiscipline === 'Open Access Only' ||
        j.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase());

      const matchOa = !openAccessOnly || j.openAccess;

      return matchQuery && matchDiscipline && matchOa;
    });
  }, [normalizedInstitutionalJournals, searchQuery, selectedDiscipline, openAccessOnly]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Layers size={13} className="text-indigo-400" />
                <span>Federated Serials & Periodicals Archive</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1">
                <CheckCircle size={13} />
                <span>AJOL • Crossref • DOAJ • OpenAlex Indexed</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-serif">
              Academic Journals & Serials Directory
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Explore peer-reviewed periodicals from Federal Co-operative College institutional presses, departmental faculty issues, and the complete OpenAlex international knowledge graph spanning over 250,000+ scholarly journals.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap lg:flex-col gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 px-4 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 rounded-xl bg-teal-950 text-teal-400 border border-teal-800">
                <Building size={18} />
              </div>
              <div>
                <div className="text-lg font-black text-white">{normalizedInstitutionalJournals.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">FCC Institutional Serials</div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 px-4 flex items-center gap-3 shadow-inner">
              <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                <Globe size={18} />
              </div>
              <div>
                <div className="text-lg font-black text-white">250,000+</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">OpenAlex Global Journals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FEDERATED SOURCE TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSourceTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSourceTab === 'all'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} />
            <span>All Collections ({filteredInstitutional.length + (openAlexJournals.length || 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('institutional')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSourceTab === 'institutional'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building size={14} />
            <span>🏛️ Local FCC Institutional Serials (HODs / Admin) ({filteredInstitutional.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('openalex')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSourceTab === 'openalex'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe size={14} />
            <span>🌐 Online Global Journals (OpenAlex API) ({openAlexMeta.count > 0 ? openAlexMeta.count.toLocaleString() : '250K+'})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSourceTab('scholarly');
              fetchScholarlyJournals(searchQuery, scholarlyPlatform);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSourceTab === 'scholarly'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950 ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>🎓 Major Databases (AGORA • JSTOR • ScienceDirect • EBSCO) ({scholarlyJournals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSourceTab('trove')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSourceTab === 'trove'
                ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Library size={14} />
            <span>Trove Periodicals & Archives</span>
          </button>
        </div>

        {/* Open Access Toggle */}
        <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-700 transition">
          <input
            type="checkbox"
            checked={openAccessOnly}
            onChange={(e) => setOpenAccessOnly(e.target.checked)}
            className="rounded border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span>🔓 Open Access Only</span>
          </span>
        </label>
      </div>

      {/* 3. SEARCH & DISCIPLINE FILTER BAR (When not in Trove dedicated view) */}
      {activeSourceTab !== 'trove' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journals by title, ISSN, DOI, subject (Cooperative, AI, Finance), or publisher..."
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-teal-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-sans shadow-inner transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => fetchOpenAlexJournals(searchQuery, 1)}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-950 active:scale-95 shrink-0"
            >
              {openAlexLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span>Search Directory</span>
            </button>
          </div>

          {/* Quick Discipline Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
              <Filter size={11} />
              <span>Discipline:</span>
            </span>
            {DISCIPLINE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedDiscipline(tag)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                  selectedDiscipline === tag
                    ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-950'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5b. MAJOR SCHOLARLY E-RESOURCE DATABASES (AGORA • JSTOR • SCIENCEDIRECT • EBSCOHOST) */}
      {(activeSourceTab === 'all' || activeSourceTab === 'scholarly') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between border-b border-amber-900/60 pb-3 gap-2">
            <div className="flex items-center gap-2.5 text-white font-serif font-bold text-base sm:text-lg">
              <Sparkles size={20} className="text-amber-400" />
              <span>Major Academic E-Resources: AGORA • JSTOR • ScienceDirect • EBSCOhost</span>
              <span className="text-xs font-mono font-normal text-amber-400/80">
                ({scholarlyJournals.length} Matches)
              </span>
            </div>

            {/* Platform Sub-Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {[
                { id: 'all', label: 'All Databases' },
                { id: 'sciencedirect', label: '🔬 ScienceDirect' },
                { id: 'agora', label: '🌾 AGORA / FAO' },
                { id: 'jstor', label: '🏛️ JSTOR' },
                { id: 'ebsco', label: '📚 EBSCOhost' },
                { id: 'doaj', label: '🌐 DOAJ' },
                { id: 'europe_pmc', label: '🧬 Europe PMC' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setScholarlyPlatform(p.id);
                    fetchScholarlyJournals(searchQuery, p.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    scholarlyPlatform === p.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {scholarlyLoading ? (
            <div className="py-14 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={32} className="animate-spin text-amber-400 mx-auto" />
              <p className="text-slate-300 font-serif text-sm">Querying AGORA, JSTOR, ScienceDirect, and EBSCOhost APIs concurrently…</p>
            </div>
          ) : scholarlyJournals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scholarlyJournals.map((item, idx) => {
                const cardId = item.id || `sch-${idx}`;
                const isExpanded = !!expandedAbstracts[cardId];
                const fullTextUrl = item.pdf_url || item.oa_url || null;
                const isCopied = copiedId === cardId;

                return (
                  <div
                    key={cardId}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: item.platform_color || '#d97706' }} />

                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-sm"
                          style={{ backgroundColor: item.platform_color || '#d97706' }}
                        >
                          {item.platform_badge}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.is_open_access ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold inline-flex items-center gap-1">
                              <Unlock size={9} /> Open Access
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 border border-amber-900 font-mono inline-flex items-center gap-1">
                              <Lock size={9} /> Institutional
                            </span>
                          )}
                          {item.year && (
                            <span className="text-[10px] font-mono text-slate-400 ml-1">
                              {item.year}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-300 transition leading-snug">
                        <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      </h4>

                      <div className="text-xs text-slate-300 line-clamp-1">
                        <span>Authors: <strong className="text-white">{item.author}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1 font-sans">
                        <div className="text-slate-200">
                          <strong>Source:</strong> <span className="italic">{item.source}</span>
                          {item.volume_issue ? `, ${item.volume_issue}` : ''}
                          {item.pages ? `, pp. ${item.pages}` : ''}
                        </div>
                        {item.doi && (
                          <div className="font-mono text-amber-300/80 truncate text-[10px]">
                            DOI: {item.doi}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                          <span>{item.access_type || 'Academic Resource'}</span>
                          {item.citations !== undefined && (
                            <span className="text-amber-300 inline-flex items-center gap-1">
                              <TrendingUp size={11} /> {item.citations} citations
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Abstract preview */}
                      {item.abstract && (
                        <div className="text-[11px] text-slate-300/90 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-slate-800/60">
                          <p className={isExpanded ? '' : 'line-clamp-2'}>
                            {item.abstract}
                          </p>
                          <button
                            type="button"
                            onClick={() => setExpandedAbstracts(prev => ({ ...prev, [cardId]: !prev[cardId] }))}
                            className="mt-1 text-[10px] text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            {isExpanded ? <>Show less <ChevronUp size={10} /></> : <>Read abstract <ChevronDown size={10} /></>}
                          </button>
                        </div>
                      )}

                      {/* Keywords */}
                      {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.keywords.slice(0, 4).map(k => (
                            <span key={k} className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-2">
                      <a
                        href={fullTextUrl || item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-w-[120px] py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow"
                      >
                        {fullTextUrl ? <FileText size={12} /> : <ExternalLink size={12} />}
                        <span>{fullTextUrl ? 'Read Full Text' : (item.is_open_access ? 'Open Article' : 'Access Gateway')}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyCitation(item)}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition inline-flex items-center gap-1"
                        title="Copy APA 7th Edition Citation"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Quote size={12} />}
                        <span>{isCopied ? 'Copied' : 'Cite'}</span>
                      </button>

                      {item.portal_url && (
                        <a
                          href={item.portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
                          title="Open Institutional Research Portal"
                        >
                          Portal
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
              No direct matches found in selected platform for "{searchQuery}". Try selecting "All Databases" or broadening terms.
            </div>
          )}
        </div>
      )}

      {/* 4. TROVE DEDICATED VIEW */}
      {activeSourceTab === 'trove' && (
        <div className="h-[750px] animate-fadeIn">
          <TroveExplorer />
        </div>
      )}

      {/* 5. FCC INSTITUTIONAL SCHOLAR JOURNALS SECTION */}
      {(activeSourceTab === 'all' || activeSourceTab === 'institutional') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-base sm:text-lg">
              <Building size={18} className="text-indigo-400" />
              <span>FCC Scholar Flagship & Departmental Serials</span>
              <span className="text-xs font-mono font-normal text-slate-400">({filteredInstitutional.length})</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Institutional Open Access
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInstitutional.map((j) => (
              <div
                key={j.id}
                className="bg-slate-900/90 border border-emerald-900/60 hover:border-emerald-500/70 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-950 text-emerald-300 border border-emerald-700">
                      🏛️ LOCAL INSTITUTIONAL (HOD/FACULTY)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                      {j.latestIssue}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-serif leading-snug group-hover:text-emerald-300 transition">
                    {j.title}
                  </h3>

                  {j.isHodUpload ? (
                    <div className="text-xs text-teal-300 flex items-center gap-1.5 font-mono">
                      <Award size={12} className="text-teal-400" />
                      <span>HOD / Department Contributor: <strong className="text-white">{j.author}</strong></span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                      <Building size={12} className="text-emerald-400" />
                      <span>Institutional Publisher: <strong className="text-slate-200">{j.publisher}</strong></span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {j.scope}
                  </p>

                  <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1">
                    <div className="text-slate-300"><strong>Publisher:</strong> {j.publisher}</div>
                    {j.issn && <div className="text-[11px] text-emerald-300 font-mono">ISSN: {j.issn}</div>}
                    <div className="text-[11px] text-slate-400 font-mono">Indexed: {j.indexedIn}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Frequency: {j.frequency}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(j)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition flex items-center gap-1"
                      title="Copy standard academic citation"
                    >
                      {copiedId === j.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedId === j.id ? 'Copied' : 'Cite'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenReader) {
                          onOpenReader({
                            id: j.id,
                            title: j.title,
                            subtitle: `${j.shortCode} • ${j.latestIssue}`,
                            author: j.publisher,
                            authorCredentials: 'Peer-Reviewed Academic Periodical',
                            callNumber: `ISSN: ${j.issn}`,
                            shelfLocation: 'Institutional Serials Archive',
                            isDigital: true,
                            pdfPages: 64,
                            fileDataUrl: j.fileDataUrl || j.pdfUrl,
                            pdfUrl: j.fileDataUrl || j.pdfUrl,
                            fileName: j.fileName || `${j.shortCode}_latest_issue.pdf`,
                            abstract: j.scope
                          });
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <BookOpen size={13} />
                      <span>Read Issue (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5b. MAJOR SCHOLARLY E-RESOURCE DATABASES (AGORA • JSTOR • SCIENCEDIRECT • EBSCOHOST) */}
      {(activeSourceTab === 'all' || activeSourceTab === 'scholarly') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between border-b border-amber-900/60 pb-3 gap-2">
            <div className="flex items-center gap-2.5 text-white font-serif font-bold text-base sm:text-lg">
              <Sparkles size={20} className="text-amber-400" />
              <span>Major Academic E-Resources: AGORA • JSTOR • ScienceDirect • EBSCOhost</span>
              <span className="text-xs font-mono font-normal text-amber-400/80">
                ({scholarlyJournals.length} Matches)
              </span>
            </div>

            {/* Platform Sub-Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {[
                { id: 'all', label: 'All Databases' },
                { id: 'sciencedirect', label: '🔬 ScienceDirect' },
                { id: 'agora', label: '🌾 AGORA / FAO' },
                { id: 'jstor', label: '🏛️ JSTOR' },
                { id: 'ebsco', label: '📚 EBSCOhost' },
                { id: 'doaj', label: '🌐 DOAJ' },
                { id: 'europe_pmc', label: '🧬 Europe PMC' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setScholarlyPlatform(p.id);
                    fetchScholarlyJournals(searchQuery, p.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    scholarlyPlatform === p.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {scholarlyLoading ? (
            <div className="py-14 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={32} className="animate-spin text-amber-400 mx-auto" />
              <p className="text-slate-300 font-serif text-sm">Querying AGORA, JSTOR, ScienceDirect, and EBSCOhost APIs concurrently…</p>
            </div>
          ) : scholarlyJournals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scholarlyJournals.map((item, idx) => {
                const cardId = item.id || `sch-${idx}`;
                const isExpanded = !!expandedAbstracts[cardId];
                const fullTextUrl = item.pdf_url || item.oa_url || null;
                const isCopied = copiedId === cardId;

                return (
                  <div
                    key={cardId}
                    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between transition group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: item.platform_color || '#d97706' }} />

                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-sm"
                          style={{ backgroundColor: item.platform_color || '#d97706' }}
                        >
                          {item.platform_badge}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.is_open_access ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold inline-flex items-center gap-1">
                              <Unlock size={9} /> Open Access
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 border border-amber-900 font-mono inline-flex items-center gap-1">
                              <Lock size={9} /> Institutional
                            </span>
                          )}
                          {item.year && (
                            <span className="text-[10px] font-mono text-slate-400 ml-1">
                              {item.year}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-amber-300 transition leading-snug">
                        <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      </h4>

                      <div className="text-xs text-slate-300 line-clamp-1">
                        <span>Authors: <strong className="text-white">{item.author}</strong></span>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1 font-sans">
                        <div className="text-slate-200">
                          <strong>Source:</strong> <span className="italic">{item.source}</span>
                          {item.volume_issue ? `, ${item.volume_issue}` : ''}
                          {item.pages ? `, pp. ${item.pages}` : ''}
                        </div>
                        {item.doi && (
                          <div className="font-mono text-amber-300/80 truncate text-[10px]">
                            DOI: {item.doi}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                          <span>{item.access_type || 'Academic Resource'}</span>
                          {item.citations !== undefined && (
                            <span className="text-amber-300 inline-flex items-center gap-1">
                              <TrendingUp size={11} /> {item.citations} citations
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Abstract preview */}
                      {item.abstract && (
                        <div className="text-[11px] text-slate-300/90 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-slate-800/60">
                          <p className={isExpanded ? '' : 'line-clamp-2'}>
                            {item.abstract}
                          </p>
                          <button
                            type="button"
                            onClick={() => setExpandedAbstracts(prev => ({ ...prev, [cardId]: !prev[cardId] }))}
                            className="mt-1 text-[10px] text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            {isExpanded ? <>Show less <ChevronUp size={10} /></> : <>Read abstract <ChevronDown size={10} /></>}
                          </button>
                        </div>
                      )}

                      {/* Keywords */}
                      {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.keywords.slice(0, 4).map(k => (
                            <span key={k} className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-2">
                      <a
                        href={fullTextUrl || item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 min-w-[120px] py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow"
                      >
                        {fullTextUrl ? <FileText size={12} /> : <ExternalLink size={12} />}
                        <span>{fullTextUrl ? 'Read Full Text' : (item.is_open_access ? 'Open Article' : 'Access Gateway')}</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyCitation(item)}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition inline-flex items-center gap-1"
                        title="Copy APA 7th Edition Citation"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Quote size={12} />}
                        <span>{isCopied ? 'Copied' : 'Cite'}</span>
                      </button>

                      {item.portal_url && (
                        <a
                          href={item.portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
                          title="Open Institutional Research Portal"
                        >
                          Portal
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
              No direct matches found in selected platform for "{searchQuery}". Try selecting "All Databases" or broadening terms.
            </div>
          )}
        </div>
      )}

      {/* 6. OPENALEX GLOBAL JOURNALS API SECTION */}
      {(activeSourceTab === 'all' || activeSourceTab === 'openalex') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-base sm:text-lg">
              <Globe size={18} className="text-teal-400" />
              <span>OpenAlex Global Academic Journals & Sources API</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({openAlexMeta.count > 0 ? openAlexMeta.count.toLocaleString() : '250,000+ Indexed'})
              </span>
            </div>
            <span className="text-[11px] font-mono text-teal-400 flex items-center gap-1">
              <Database size={11} />
              <span>Live OpenAlex Graph Proxy</span>
            </span>
          </div>

          {openAlexLoading ? (
            <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={32} className="animate-spin text-teal-400 mx-auto" />
              <p className="text-slate-300 font-serif text-sm">Querying OpenAlex Sources Knowledge Graph (/sources)...</p>
            </div>
          ) : openAlexJournals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openAlexJournals.map((src) => {
                const issn = src.issn_l || (Array.isArray(src.issn) ? src.issn[0] : null) || 'N/A';
                const publisher = src.host_organization_name || 'Academic Publisher';
                const cleanId = src.id ? src.id.replace('https://openalex.org/', '') : '';

                return (
                  <div
                    key={src.id}
                    className="bg-slate-900/90 border border-sky-900/60 hover:border-sky-500/70 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between transition group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-sky-950 text-sky-300 border border-sky-700">
                          🌐 ONLINE GLOBAL (API)
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {src.is_oa && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold">
                              🔓 Open Access
                            </span>
                          )}
                          {src.is_in_doaj && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 font-bold">
                              ✓ DOAJ
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white font-serif leading-snug group-hover:text-sky-300 transition">
                        {src.display_name}
                      </h4>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1 text-slate-300 text-[11px]">
                          <Building size={12} className="text-sky-400 shrink-0" />
                          <span className="truncate">{publisher}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          {issn !== 'N/A' && <span className="text-sky-300">ISSN: {issn}</span>}
                          {src.country_code && <span>Country: {src.country_code.toUpperCase()}</span>}
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                        {src.works_count !== undefined && (
                          <div>
                            <strong className="text-white">{Number(src.works_count).toLocaleString()}</strong> Works
                          </div>
                        )}
                        {src.cited_by_count !== undefined && (
                          <div>
                            <strong className="text-teal-300">{Number(src.cited_by_count).toLocaleString()}</strong> Citations
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {src.homepage_url ? (
                        <a
                          href={src.homepage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-teal-300 text-xs flex items-center gap-1 font-mono transition"
                        >
                          <span>Journal Site</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : <span />}

                      {/* 1-Click Explore Papers in OpenAlex */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToOpenAlex) {
                            onNavigateToOpenAlex(`primary_location.source.id:${cleanId}`);
                          } else {
                            window.location.hash = `#/library_openalex?filter=primary_location.source.id:${cleanId}`;
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1 transition active:scale-95"
                      >
                        <BookOpen size={12} />
                        <span>Explore Papers</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
              No OpenAlex journals found matching your query. Try broadening search terms.
            </div>
          )}

          {/* OpenAlex Pagination */}
          {openAlexJournals.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                disabled={openAlexPage <= 1 || openAlexLoading}
                onClick={() => {
                  const newPage = openAlexPage - 1;
                  setOpenAlexPage(newPage);
                  fetchOpenAlexJournals(searchQuery, newPage);
                }}
                className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white disabled:opacity-40"
              >
                Previous Page
              </button>
              <span className="text-xs font-mono text-slate-400">
                Page {openAlexPage} of {Math.max(1, Math.ceil((openAlexMeta.count || 1) / 12))}
              </span>
              <button
                type="button"
                disabled={openAlexLoading}
                onClick={() => {
                  const newPage = openAlexPage + 1;
                  setOpenAlexPage(newPage);
                  fetchOpenAlexJournals(searchQuery, newPage);
                }}
                className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white disabled:opacity-40"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
