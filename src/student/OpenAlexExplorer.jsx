import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, BookOpen, User, Calendar, ExternalLink, Bookmark, Check,
  Download, FileText, Sparkles, Filter, RefreshCw, Loader2, Quote,
  Layers, Globe, CheckCircle, Database, ShieldCheck, Star, Award,
  Clock, ArrowUpRight, Copy, X, ChevronDown, ChevronUp, AlertCircle,
  Building, BookMarked, Share2, Tag, SlidersHorizontal, Hash, HelpCircle,
  ListFilter, MapPin, Brain, Zap, Info, BarChart2, BarChart3, PieChart, ArrowRight,
  Terminal, Code2, Play, CheckCircle2, ArrowRightLeft, Cpu
} from 'lucide-react';
import { formatCitation } from '../utils/citationFormatter';
import { sounds } from '../utils/soundEffects';

const QUICK_DISCIPLINES = [
  { label: 'Cooperative Economics', query: 'cooperative economics microfinance nigeria', icon: '🏛️' },
  { label: 'Computer Science & AI', query: 'machine learning algorithms computer networks', icon: '💻' },
  { label: 'Agricultural Extension', query: 'agricultural extension smallholder farming value chain', icon: '🌾' },
  { label: 'Banking & Finance', query: 'banking finance monetary policy financial inclusion', icon: '🏦' },
  { label: 'Data Science & DB', query: 'relational database data mining distributed systems', icon: '📊' },
  { label: 'Business & Management', query: 'enterprise management corporate governance entrepreneurship', icon: '📈' },
];

const GROUP_BY_FIELDS = [
  { id: 'type', label: 'Work Format (Type)', icon: '📑', desc: 'Articles, Books, Chapters, Dissertations, Reviews' },
  { id: 'authorships.institutions.id', label: 'Research Institutions', icon: '🏛️', desc: 'Universities and research centers' },
  { id: 'open_access.is_oa', label: 'Open Access Status', icon: '🔓', desc: 'Freely readable vs paywalled publications' },
  { id: 'publication_year', label: 'Publication Year', icon: '📅', desc: 'Chronological timeline of publications' },
  { id: 'primary_location.source.id', label: 'Journals & Sources', icon: '📰', desc: 'Publishing venues, journals, and repositories' },
  { id: 'authorships.countries', label: 'Author Countries', icon: '🌍', desc: 'Geographic author affiliations' },
  { id: 'topics.id', label: 'Topics Taxonomy', icon: '🏷️', desc: 'Primary subject classifications' },
];

const OQL_TEMPLATES = [
  {
    title: 'Nigerian Agricultural Value Chains',
    oql: 'works where authorships.institutions.country_code is (NG) and title has (agriculture) and year >= (2020)',
    desc: 'Recent Nigerian agricultural extension & smallholder value chain studies'
  },
  {
    title: 'Open Access AI & Machine Learning',
    oql: 'works where topics.name has (machine learning) and is_oa is (true) and cited_by_count > (20)',
    desc: 'High-impact open access literature in artificial intelligence'
  },
  {
    title: 'Cooperative Banking & Microfinance',
    oql: 'works where title has (cooperative) and abstract has (microfinance) and year >= (2021)',
    desc: 'Field studies on microcredit and cooperative enterprise models'
  },
  {
    title: 'Work Type Breakdown (Group By)',
    oql: 'works where year is (2023) group by type',
    desc: 'Aggregates 2023 publications across article, preprint, and book types'
  },
  {
    title: 'Cancer Oncology Reviews',
    oql: 'works where title has (cancer) and type is (review) and year >= (2020)',
    desc: 'Recent literature reviews in oncology and cellular immunology'
  }
];

export default function OpenAlexExplorer({ onOpenReader, user }) {
  // Navigation & Entity mode: 'works' | 'saved' | 'authors' | 'sources' | 'institutions' | 'topics'
  const [activeTab, setActiveTab] = useState('works');

  // Search input & states
  const [searchQuery, setSearchQuery] = useState('cooperative economics nigeria');
  const [activeSearch, setActiveSearch] = useState('cooperative economics nigeria');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search Engine Modes (OpenAlex Search Specification)
  const [searchScope, setSearchScope] = useState('title_abstract_keywords'); // 'title_abstract_keywords' | 'title_and_abstract' | 'title' | 'semantic' | 'fulltext'
  const [isExactMatch, setIsExactMatch] = useState(false); // Exact unstemmed / wildcard search
  const [isRerankEnabled, setIsRerankEnabled] = useState(false); // AI Neural decision reranker
  const [bylineAuthor, setBylineAuthor] = useState(''); // Published byline string match

  // Search Syntax Assistant Modal
  const [searchSyntaxModalOpen, setSearchSyntaxModalOpen] = useState(false);

  // Core & Convenience Filters
  const [isOpenAccessOnly, setIsOpenAccessOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'article' | 'book' | 'dissertation' | 'review'
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Advanced OpenAlex Query Specification Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minCitations, setMinCitations] = useState('any'); // 'any' | '10' | '50' | '100'
  const [originCountry, setOriginCountry] = useState('all'); // 'all' | 'ng' | 'global_south' | 'west_africa'
  const [hasAbstractOnly, setHasAbstractOnly] = useState(false);
  const [hasFullTextOnly, setHasFullTextOnly] = useState(false);
  const [excludeParatext, setExcludeParatext] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rawFilter, setRawFilter] = useState('');

  // Bulk DOI Modal
  const [bulkDoiModalOpen, setBulkDoiModalOpen] = useState(false);
  const [bulkDoiInput, setBulkDoiInput] = useState('');
  const [activeBulkDois, setActiveBulkDois] = useState(null);

  // Specific Entity Filter Pins (e.g. pinned author, source, institution, or topic)
  const [pinnedFilter, setPinnedFilter] = useState(null); // { label: string, filterParam: string }

  // Entity Exploration Tabs State (Authors, Sources, Institutions, Topics)
  const [entityQuery, setEntityQuery] = useState('');
  const [entityResults, setEntityResults] = useState([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityMeta, setEntityMeta] = useState({ count: 0, page: 1 });

  // Data
  const [works, setWorks] = useState([]);
  const [savedWorks, setSavedWorks] = useState([]);
  const [meta, setMeta] = useState({ count: 0, page: 1, per_page: 20 });
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  // Expanded abstract card IDs
  const [expandedAbstracts, setExpandedAbstracts] = useState({});

  // Citation Modal state
  const [citationModalItem, setCitationModalItem] = useState(null);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Local save status tracker: map of ID -> boolean
  const [savedStatusMap, setSavedStatusMap] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Analytics & Distribution Aggregations (OpenAlex Group By Specification)
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState('type');
  const [analyticsIncludeUnknown, setAnalyticsIncludeUnknown] = useState(false);
  const [analyticsSort, setAnalyticsSort] = useState('count:desc');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsMeta, setAnalyticsMeta] = useState({ count: 0, groups_count: 0, next_cursor: null });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // OQL Query Studio & 3-Way Translator State (OpenAlex OQL API Specification)
  const [oqlInput, setOqlInput] = useState('works where year >= (2020) and title has (microfinance)');
  const [oqlInputFormat, setOqlInputFormat] = useState('oql'); // 'oql' | 'oxurl' | 'oqo'
  const [oqlTranslation, setOqlTranslation] = useState(null);
  const [oqlTranslateLoading, setOqlTranslateLoading] = useState(false);
  const [oqlValidateLoading, setOqlValidateLoading] = useState(false);
  const [oqlValidationResult, setOqlValidationResult] = useState(null);
  const [oqlExecuteLoading, setOqlExecuteLoading] = useState(false);
  const [oqlExecuteResults, setOqlExecuteResults] = useState(null);
  const [oqlActiveFormatTab, setOqlActiveFormatTab] = useState('oql'); // 'oql' | 'oxurl' | 'oqo'

  // Live Type-Ahead Autocomplete State (/api/openalex/autocomplete/works)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  // AI Aboutness & SDG Tagger State (/api/openalex/text)
  const [taggerTitle, setTaggerTitle] = useState('Microfinance and Agricultural Value Chains in Nigeria');
  const [taggerAbstract, setTaggerAbstract] = useState('An empirical investigation into cooperative societies, rural banking, and agricultural extension services for smallholder farmers in southwestern Nigeria.');
  const [taggerLoading, setTaggerLoading] = useState(false);
  const [taggerResults, setTaggerResults] = useState(null);
  const [taggerError, setTaggerError] = useState(null);

  // Live Autocomplete Debouncer
  useEffect(() => {
    if (searchScope === 'semantic' || searchScope === 'oql' || searchQuery.trim().length < 3) {
      setAutocompleteSuggestions([]);
      setAutocompleteOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAutocompleteLoading(true);
        const res = await fetch(`/api/openalex/autocomplete/works?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          setAutocompleteSuggestions(results);
          if (results.length > 0) {
            setAutocompleteOpen(true);
          }
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setAutocompleteLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchScope]);

  // Count active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (searchScope !== 'title_abstract_keywords') count++;
    if (isExactMatch) count++;
    if (isRerankEnabled) count++;
    if (bylineAuthor.trim()) count++;
    if (minCitations !== 'any') count++;
    if (originCountry !== 'all') count++;
    if (hasAbstractOnly) count++;
    if (hasFullTextOnly) count++;
    if (excludeParatext) count++;
    if (fromDate.trim()) count++;
    if (toDate.trim()) count++;
    if (rawFilter.trim()) count++;
    if (activeBulkDois) count++;
    if (pinnedFilter) count++;
    return count;
  }, [
    searchScope, isExactMatch, isRerankEnabled, bylineAuthor, minCitations,
    originCountry, hasAbstractOnly, hasFullTextOnly, excludeParatext, fromDate,
    toDate, rawFilter, activeBulkDois, pinnedFilter
  ]);

  // Load gateway telemetry / rate limit stats on mount
  useEffect(() => {
    fetchRateLimitStats();
    fetchSavedWorks();
  }, []);

  const fetchRateLimitStats = async () => {
    try {
      const res = await fetch('/api/openalex/rate-limit');
      if (res.ok) {
        const data = await res.json();
        setRateLimitInfo(data);
      }
    } catch (e) {
      console.warn('Could not fetch rate-limit info:', e);
    }
  };

  const fetchSavedWorks = async () => {
    try {
      const res = await fetch('/api/openalex/saved');
      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        setSavedWorks(items);
        const map = {};
        items.forEach(it => { map[it.id] = true; });
        setSavedStatusMap(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.warn('Could not fetch saved works:', e);
    }
  };

  // Perform search through backend with full OpenAlex Querying & Searching specification
  const executeSearch = useCallback(async (targetPage = 1, currentSearch = activeSearch) => {
    setIsLoading(true);
    setError(null);
    sounds.playClick();

    try {
      // 0. Direct OpenAlex Query Language (OQL) Execution routing
      if (searchScope === 'oql' || /^\s*(works|authors|sources|institutions|topics)\s+where\s+/i.test(currentSearch)) {
        const oqlParams = new URLSearchParams();
        oqlParams.append('oql', currentSearch.trim());
        oqlParams.append('page', targetPage.toString());
        oqlParams.append('per_page', perPage.toString());
        if (selectedSort !== 'relevance') {
          oqlParams.append('sort', selectedSort);
        }

        const res = await fetch(`/api/openalex/oql?${oqlParams.toString()}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.message || errJson?.error || `OQL query failed with status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setWorks(data.results || []);
          setMeta(data.meta || { count: 0, page: targetPage });
          setPage(targetPage);

          const newMap = { ...savedStatusMap };
          (data.results || []).forEach(w => {
            if (w.is_saved) newMap[w.id] = true;
          });
          setSavedStatusMap(newMap);
          return;
        } else {
          setError({
            message: data.message || data.error || 'Failed to execute OQL query.',
            suggestion: data.suggestion,
            validation: data.validation,
            status: res.status
          });
          return;
        }
      }

      const params = new URLSearchParams();
      if (currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      params.append('page', targetPage.toString());
      params.append('per_page', perPage.toString());

      // Search Scope
      params.append('search_scope', searchScope);

      // Exact (Unstemmed / Wildcard) modifier
      if (isExactMatch) {
        params.append('exact', 'true');
      }

      // AI Neural Rerank (incompatible with semantic search per OpenAlex spec)
      if (isRerankEnabled && searchScope !== 'semantic') {
        params.append('rerank', 'true');
      }

      // Byline Author (e.g. "Jane Smith"~1)
      if (bylineAuthor.trim()) {
        params.append('byline_author', bylineAuthor.trim());
      }

      // Open Access
      if (isOpenAccessOnly) {
        params.append('is_oa', 'true');
      }

      // Format Type
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }

      // Publication Year / Date Bounds
      if (fromDate.trim()) {
        params.append('from_publication_date', fromDate.trim());
      } else if (selectedYear !== 'all') {
        params.append('year', selectedYear);
      }
      if (toDate.trim()) {
        params.append('to_publication_date', toDate.trim());
      }

      // Numeric Inequality: Citations Count
      if (minCitations !== 'any') {
        params.append('min_citations', minCitations);
      }

      // Geographic scope & Global South
      if (originCountry === 'ng') {
        params.append('institution_country', 'ng');
      } else if (originCountry === 'global_south') {
        params.append('is_global_south', 'true');
      } else if (originCountry === 'west_africa') {
        params.append('institution_country', 'ng|gh|sn');
      }

      // Content boolean filters
      if (hasAbstractOnly) {
        params.append('has_abstract', 'true');
      }
      if (hasFullTextOnly) {
        params.append('has_fulltext', 'true');
      }

      // Negation: Exclude paratext / front matter
      if (excludeParatext) {
        params.append('type', '!paratext');
      }

      // Bulk DOIs via OR pipe
      if (activeBulkDois) {
        params.append('dois', activeBulkDois);
      }

      // Raw OpenAlex Filter Expression passthrough
      if (rawFilter.trim()) {
        params.append('filter', rawFilter.trim());
      }

      // Pinned Entity filter (e.g. from entity tabs)
      if (pinnedFilter?.filterParam) {
        params.append('filter', pinnedFilter.filterParam);
      }

      // Sort Order (Rerank forces relevance)
      if (isRerankEnabled && searchScope !== 'semantic') {
        params.append('sort', 'relevance_score:desc');
      } else if (selectedSort === 'relevance') {
        if (currentSearch.trim()) {
          params.append('sort', 'relevance_score:desc');
        } else {
          params.append('sort', 'cited_by_count:desc');
        }
      } else {
        // Multi-key sort or standard sort (fallback gracefully if relevance_score requested without active query)
        let sortValue = selectedSort;
        if (!currentSearch.trim() && sortValue.includes('relevance_score')) {
          sortValue = sortValue
            .replace(/,?\s*relevance_score(:desc|:asc)?/g, '')
            .replace(/^,|,$/g, '');
          if (!sortValue) sortValue = 'cited_by_count:desc';
        }
        params.append('sort', sortValue);
      }

      const res = await fetch(`/api/openalex/works?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || `OpenAlex gateway returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setWorks(data.results || []);
        setMeta(data.meta || { count: 0, page: targetPage });
        setPage(targetPage);

        // Update saved status map
        const newMap = { ...savedStatusMap };
        (data.results || []).forEach(w => {
          if (w.is_saved) newMap[w.id] = true;
        });
        setSavedStatusMap(newMap);
      } else {
        setError({
          message: data.message || data.error || 'Failed to retrieve research works.',
          suggestion: data.suggestion,
          status: res.status
        });
      }
    } catch (err) {
      setError({
        message: err.message || 'Network error communicating with OpenAlex backend.',
        status: 500
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeSearch, searchScope, isExactMatch, isRerankEnabled, bylineAuthor,
    isOpenAccessOnly, selectedType, selectedYear, selectedSort, perPage,
    minCitations, originCountry, hasAbstractOnly, hasFullTextOnly, excludeParatext,
    fromDate, toDate, rawFilter, activeBulkDois, pinnedFilter, savedStatusMap
  ]);

  // Initial search
  useEffect(() => {
    executeSearch(1, activeSearch);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery);
    executeSearch(1, searchQuery);
  };

  const handleDisciplineClick = (disc) => {
    sounds.playClick();
    setSearchQuery(disc.query);
    setActiveSearch(disc.query);
    executeSearch(1, disc.query);
  };

  // 1-Click Save to Institutional Database
  const handleSaveWork = async (work) => {
    sounds.playClick();
    setSavingId(work.id);

    try {
      const res = await fetch('/api/openalex/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          work: work,
          saved_by: user?.matric_no || user?.matricNo || user?.id || 'FCC-STUDENT',
          notes: 'Saved from OpenAlex Scholarly Explorer'
        })
      });

      if (res.ok) {
        sounds.playSuccess();
        setSavedStatusMap(prev => ({ ...prev, [work.id]: true }));
        fetchSavedWorks();
      } else {
        alert('Failed to save paper to database.');
      }
    } catch (err) {
      console.error('Error saving paper:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Remove / Unsave work
  const handleUnsaveWork = async (workId) => {
    sounds.playClick();
    try {
      const res = await fetch(`/api/openalex/saved/${workId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        setSavedStatusMap(prev => {
          const updated = { ...prev };
          delete updated[workId];
          return updated;
        });
        fetchSavedWorks();
      }
    } catch (err) {
      console.error('Error deleting saved work:', err);
    }
  };

  // Toggle Abstract expansion
  const toggleAbstract = (id) => {
    sounds.playClick();
    setExpandedAbstracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Citation Modal Trigger
  const handleOpenCitationModal = (work) => {
    sounds.playClick();
    setCitationModalItem(work);
    setCopiedCitation(false);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    sounds.playClick();
    setSearchScope('title_abstract_keywords');
    setIsExactMatch(false);
    setIsRerankEnabled(false);
    setBylineAuthor('');
    setIsOpenAccessOnly(false);
    setSelectedType('all');
    setSelectedYear('all');
    setSelectedSort('relevance');
    setMinCitations('any');
    setOriginCountry('all');
    setHasAbstractOnly(false);
    setHasFullTextOnly(false);
    setExcludeParatext(false);
    setFromDate('');
    setToDate('');
    setRawFilter('');
    setActiveBulkDois(null);
    setPinnedFilter(null);
  };

  // Bulk DOI Submit
  const handleApplyBulkDois = () => {
    sounds.playClick();
    if (!bulkDoiInput.trim()) {
      setActiveBulkDois(null);
    } else {
      setActiveBulkDois(bulkDoiInput.trim());
    }
    setBulkDoiModalOpen(false);
    setPage(1);
    executeSearch(1, activeSearch);
  };

  // Search Academic Graph Entities (Authors, Sources, Institutions, Topics, Awards, SDGs, Subfields, etc.)
  const executeEntitySearch = async (tabName, query = entityQuery, targetPage = 1) => {
    const validTabs = ['authors', 'sources', 'institutions', 'topics', 'awards', 'sdgs', 'subfields', 'domains', 'keywords', 'countries'];
    if (!validTabs.includes(tabName)) return;
    setEntityLoading(true);
    sounds.playClick();

    try {
      const endpoint = `/api/openalex/${tabName}?search=${encodeURIComponent(query || '')}&page=${targetPage}&per_page=20`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setEntityResults(data.results || []);
        setEntityMeta(data.meta || { count: 0, page: targetPage });
      }
    } catch (e) {
      console.error(`Error querying ${tabName}:`, e);
    } finally {
      setEntityLoading(false);
    }
  };

  // Pin entity to Works search
  const handleFilterByEntity = (entityType, entity) => {
    sounds.playClick();
    let filterStr = '';
    let label = '';

    const id = entity.id?.replace('https://openalex.org/', '') || entity.id;

    if (entityType === 'author') {
      filterStr = `authorships.author.id:${id}`;
      label = `Author: ${entity.display_name}`;
    } else if (entityType === 'source') {
      filterStr = `primary_location.source.id:${id}`;
      label = `Journal: ${entity.display_name}`;
    } else if (entityType === 'institution') {
      filterStr = `authorships.institutions.id:${id}`;
      label = `Institution: ${entity.display_name}`;
    } else if (entityType === 'topic') {
      filterStr = `topics.id:${id}`;
      label = `Topic: ${entity.display_name}`;
    } else if (entityType === 'award') {
      filterStr = `awards.id:${id}`;
      label = `Award: ${entity.display_name || entity.funder_award_id || id}`;
    } else if (entityType === 'sdg') {
      filterStr = `sustainable_development_goals.id:${id}`;
      label = `SDG: ${entity.display_name}`;
    } else if (entityType === 'subfield') {
      filterStr = `primary_topic.subfield.id:${id}`;
      label = `Subfield: ${entity.display_name}`;
    } else if (entityType === 'domain') {
      filterStr = `primary_topic.domain.id:${id}`;
      label = `Domain: ${entity.display_name}`;
    } else if (entityType === 'keyword') {
      filterStr = `keywords.id:${id}`;
      label = `Keyword: ${entity.display_name}`;
    } else if (entityType === 'country') {
      const countryCode = entity.country_code || id.replace('countries/', '');
      filterStr = `authorships.countries:${countryCode}`;
      label = `Country: ${entity.display_name}`;
    } else {
      filterStr = `${entityType}:${id}`;
      label = `${entityType}: ${entity.display_name || id}`;
    }

    setPinnedFilter({ label, filterParam: filterStr });
    setActiveTab('works');
    executeSearch(1, '');
  };

  // Handle AI Aboutness & SDG Text Tagging (/api/openalex/text)
  const handleTagText = async () => {
    if (!taggerTitle.trim() && !taggerAbstract.trim()) return;
    setTaggerLoading(true);
    setTaggerError(null);
    sounds.playClick();

    try {
      const res = await fetch('/api/openalex/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taggerTitle.trim(),
          abstract: taggerAbstract.trim(),
        })
      });
      const data = await res.json();
      if (res.ok && (data.keywords || data.topics)) {
        setTaggerResults(data);
        sounds.playSuccess();
      } else {
        setTaggerError(data.message || data.error || 'Failed to tag text.');
      }
    } catch (e) {
      setTaggerError(e.message || 'Error communicating with text tagger API.');
    } finally {
      setTaggerLoading(false);
    }
  };

  // Fetch OpenAlex Aggregations (group_by parameter)
  const fetchAggregations = useCallback(async (
    field = analyticsGroupBy,
    cursor = null,
    includeUnknown = analyticsIncludeUnknown,
    sort = analyticsSort
  ) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    sounds.playClick();

    try {
      const params = new URLSearchParams();
      params.append('group_by', field);
      if (includeUnknown) {
        params.append('include_unknown', 'true');
      }
      if (sort) {
        params.append('sort', sort);
      }
      if (cursor) {
        params.append('cursor', cursor);
      }

      // Pass active search query if present so groups match user query
      if (activeSearch.trim()) {
        params.append('search', activeSearch.trim());
      }

      // Pass active filters
      if (isOpenAccessOnly) params.append('is_oa', 'true');
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (originCountry === 'ng') params.append('institution_country', 'ng');
      else if (originCountry === 'global_south') params.append('is_global_south', 'true');
      else if (originCountry === 'west_africa') params.append('institution_country', 'ng|gh|sn');
      if (pinnedFilter?.filterParam) params.append('filter', pinnedFilter.filterParam);
      else if (rawFilter.trim()) params.append('filter', rawFilter.trim());

      const res = await fetch(`/api/openalex/aggregate?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || `Aggregation failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.groups || []);
        setAnalyticsMeta({
          count: data.meta?.count || 0,
          groups_count: data.groups_count || (data.groups || []).length,
          next_cursor: data.meta?.next_cursor || null
        });
      } else {
        setAnalyticsError(data.message || data.error || 'Failed to aggregate entities.');
      }
    } catch (err) {
      setAnalyticsError(err.message || 'Error fetching aggregation data.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [
    analyticsGroupBy, analyticsIncludeUnknown, analyticsSort, activeSearch,
    isOpenAccessOnly, selectedType, selectedYear, originCountry, pinnedFilter, rawFilter
  ]);

  // Apply group item as filter to Works list
  const handleApplyGroupFilter = (field, group) => {
    sounds.playSuccess();
    const rawKey = group.key;
    const displayName = group.display_name || group.key_display_name || String(rawKey);

    // Normalize entity ID if URL
    const cleanId = typeof rawKey === 'string' ? rawKey.replace('https://openalex.org/', '') : rawKey;

    if (field === 'type') {
      setSelectedType(String(rawKey));
      setPinnedFilter(null);
    } else if (field === 'open_access.is_oa') {
      setIsOpenAccessOnly(rawKey === true || rawKey === 'true');
      setPinnedFilter(null);
    } else if (field === 'publication_year') {
      setSelectedYear(String(rawKey));
      setPinnedFilter(null);
    } else if (field === 'authorships.institutions.id') {
      setPinnedFilter({
        label: `Institution: ${displayName}`,
        filterParam: `authorships.institutions.id:${cleanId}`
      });
    } else if (field === 'primary_location.source.id') {
      setPinnedFilter({
        label: `Journal: ${displayName}`,
        filterParam: `primary_location.source.id:${cleanId}`
      });
    } else if (field === 'authorships.countries') {
      setPinnedFilter({
        label: `Country: ${displayName}`,
        filterParam: `authorships.countries:${cleanId}`
      });
    } else {
      setPinnedFilter({
        label: `${field}: ${displayName}`,
        filterParam: `${field}:${cleanId}`
      });
    }

    setActiveTab('works');
    setPage(1);
    executeSearch(1, activeSearch);
  };

  // Translate query between OQL, classic URL, and OQO JSON
  const handleTranslateQuery = async (queryText = oqlInput, format = oqlInputFormat) => {
    if (!queryText.trim()) return;
    setOqlTranslateLoading(true);
    sounds.playClick();

    try {
      const res = await fetch('/api/openalex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [format]: queryText.trim() })
      });
      const data = await res.json();
      setOqlTranslation(data);
      if (data.validation) {
        setOqlValidationResult(data.validation);
      }
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setOqlTranslateLoading(false);
    }
  };

  // Validate/lint OQL query string
  const handleValidateOql = async (queryText = oqlInput) => {
    if (!queryText.trim()) return;
    setOqlValidateLoading(true);
    sounds.playClick();

    try {
      const res = await fetch(`/api/openalex/validate?q=${encodeURIComponent(queryText.trim())}`);
      const data = await res.json();
      setOqlValidationResult(data);
    } catch (e) {
      console.error('Validation error:', e);
    } finally {
      setOqlValidateLoading(false);
    }
  };

  // Execute OQL query through backend proxy
  const handleExecuteOql = async (queryText = oqlInput) => {
    if (!queryText.trim()) return;
    setOqlExecuteLoading(true);
    sounds.playClick();

    try {
      const res = await fetch('/api/openalex/oql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oql: queryText.trim(),
          per_page: 20
        })
      });
      const data = await res.json();
      setOqlExecuteResults(data);
      if (data.success && data.results) {
        sounds.playSuccess();
      }
    } catch (e) {
      console.error('Execution error:', e);
    } finally {
      setOqlExecuteLoading(false);
    }
  };

  // Fill search with syntax example
  const handleApplySyntaxExample = (query, scope = 'title_abstract_keywords', exact = false) => {
    sounds.playClick();
    setSearchQuery(query);
    setActiveSearch(query);
    setSearchScope(scope);
    setIsExactMatch(exact);
    setSearchSyntaxModalOpen(false);
    executeSearch(1, query);
  };

  // Compute formatted citation text
  const currentCitationText = useMemo(() => {
    if (!citationModalItem) return '';
    return formatCitation({
      title: citationModalItem.title,
      authors: citationModalItem.authors || [],
      year: citationModalItem.publication_year,
      publisher: citationModalItem.publisher || citationModalItem.primary_source,
      source: citationModalItem.primary_source,
      doi: citationModalItem.doi,
      volume: citationModalItem.biblio?.volume,
      issue: citationModalItem.biblio?.issue,
      pages: citationModalItem.biblio?.first_page ? `${citationModalItem.biblio.first_page}-${citationModalItem.biblio.last_page || ''}` : null
    }, citationStyle);
  }, [citationModalItem, citationStyle]);

  const copyCitationToClipboard = () => {
    if (!currentCitationText) return;
    navigator.clipboard.writeText(currentCitationText);
    sounds.playSuccess();
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. HERO BANNER WITH OPENALEX ARCHITECTURE METRICS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950/70 to-slate-900 border border-teal-800/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold tracking-wider">
              <Sparkles size={13} className="text-teal-400" />
              <span>OPENALEX GLOBAL SCHOLARLY GRAPH</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-serif">
              Scholarly Research & Journal Articles
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Explore 250M+ peer-reviewed papers with full-text search, keywords matching, AI neural reranking,
              Boolean logic, phrase proximity, unstemmed wildcards, and AI semantic embeddings.
            </p>
          </div>

          {/* Telemetry pill */}
          {rateLimitInfo && (
            <div className="bg-slate-900/80 backdrop-blur border border-teal-700/40 rounded-2xl p-4 flex flex-col gap-2 min-w-[200px] shrink-0 text-xs font-mono">
              <div className="flex items-center justify-between text-teal-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Database size={13} className="text-teal-400" />
                  Local DB Cache:
                </span>
                <span className="text-white font-bold">{rateLimitInfo.stats?.cached_queries || 0} Queries</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Cache Hits:</span>
                <span className="text-emerald-400 font-bold">{rateLimitInfo.stats?.cache_hits || 0} hits</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Saved In Library:</span>
                <span className="text-amber-400 font-bold">{savedWorks.length} papers</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Topic Chips */}
        <div className="mt-6 pt-5 border-t border-teal-800/40 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-mono text-teal-300 font-bold mr-1">Curated Tracks:</span>
          {QUICK_DISCIPLINES.map((d, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDisciplineClick(d)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-teal-900/60 border border-teal-700/50 hover:border-teal-400 text-xs text-slate-200 hover:text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. NAVIGATION MODE TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => { sounds.playClick(); setActiveTab('works'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'works'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BookOpen size={14} />
          <span>Works & Papers ({meta.count > 0 ? meta.count.toLocaleString() : 'OpenAlex'})</span>
        </button>

        <button
          type="button"
          onClick={() => { sounds.playClick(); setActiveTab('saved'); fetchSavedWorks(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bookmark size={14} />
          <span>Saved in FCC Library ({savedWorks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('authors');
            executeEntitySearch('authors', entityQuery || 'Nigeria');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'authors'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <User size={14} />
          <span>Authors & Scholars</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('sources');
            executeEntitySearch('sources', entityQuery || 'Journal');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building size={14} />
          <span>Sources & Journals</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('institutions');
            executeEntitySearch('institutions', entityQuery || 'Ibadan');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'institutions'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Globe size={14} />
          <span>Institutions</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('topics');
            executeEntitySearch('topics', entityQuery || 'Economics');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'topics'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Tag size={14} />
          <span>Topics Taxonomy</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('awards');
            executeEntitySearch('awards', entityQuery || 'Agriculture');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'awards'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Award size={14} />
          <span>Awards & Grants</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('sdgs');
            executeEntitySearch('sdgs', entityQuery || '');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sdgs'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Globe size={14} />
          <span>UN SDGs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('subfields');
            executeEntitySearch('subfields', entityQuery || 'Economics');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'subfields'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers size={14} />
          <span>Subfields</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('analytics');
            fetchAggregations(analyticsGroupBy);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart3 size={14} />
          <span>Analytics & Distribution (Group By)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('oql');
            if (!oqlTranslation) {
              handleTranslateQuery(oqlInput, oqlInputFormat);
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'oql'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal size={14} />
          <span>OQL Query Lab & 3-Way Translator</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('tagger');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'tagger'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles size={14} />
          <span>AI Aboutness & SDG Tagger</span>
        </button>
      </div>

      {/* PINNED FILTER PILL (if navigating from an entity) */}
      {pinnedFilter && activeTab === 'works' && (
        <div className="bg-teal-950/70 border border-teal-500/50 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-teal-200">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-teal-400">📍 Active Entity Scope:</span>
            <span className="bg-teal-900/80 px-2 py-0.5 rounded-lg border border-teal-700/60 font-bold">{pinnedFilter.label}</span>
            <span className="text-teal-400/70 text-[11px]">({pinnedFilter.filterParam})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setPinnedFilter(null);
              executeSearch(1, activeSearch);
            }}
            className="p-1 hover:bg-teal-900 rounded-lg text-teal-300 hover:text-white transition flex items-center gap-1 text-[11px]"
          >
            <X size={14} />
            <span>Clear Scope</span>
          </button>
        </div>
      )}

      {/* 3. SEARCH BAR & ADVANCED SEARCH ENGINE CONTROLS */}
      {activeTab === 'works' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input Bar with Scope Selector */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Scope Dropdown */}
              <div className="bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-2 flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">Scope:</span>
                <select
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value)}
                  className="bg-transparent text-xs font-bold text-teal-300 focus:outline-none cursor-pointer"
                >
                  <option value="title_abstract_keywords" className="bg-slate-900 text-white">Title, Abstract & Keywords</option>
                  <option value="title_and_abstract" className="bg-slate-900 text-white">Title & Abstract Only</option>
                  <option value="title" className="bg-slate-900 text-white">Title Only</option>
                  <option value="semantic" className="bg-slate-900 text-white">🧠 AI Semantic Embeddings</option>
                  <option value="fulltext" className="bg-slate-900 text-white">Broad Full-Text Search</option>
                  <option value="oql" className="bg-slate-900 text-teal-300 font-bold">💬 OQL Sentence (works where...)</option>
                </select>
              </div>

              {/* Text Input / Semantic Abstract Textarea */}
              <div className="relative flex-1">
                {searchScope === 'semantic' ? (
                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      value={searchQuery}
                      maxLength={2000}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Paste research abstract, grant aim, or thesis description (up to 2,000 characters). Matches conceptual meaning via Alibaba GTE Large vector embeddings..."
                      className="w-full bg-slate-950 border border-purple-500/60 focus:border-purple-400 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition shadow-inner font-sans resize-y"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
                      <span className="flex items-center gap-1 text-purple-300">
                        <Brain size={12} className="text-purple-400" />
                        <span>Alibaba GTE Large EN (1,024-dim Vector Embeddings)</span>
                      </span>
                      <span className={searchQuery.length > 1800 ? 'text-amber-400 font-bold' : ''}>
                        {searchQuery.length} / 2,000 characters
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search terms (supports Boolean "AND, OR, NOT", quotes "...", proximity ~5, wildcards *)...'
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-teal-500 rounded-2xl pl-11 pr-24 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition shadow-inner font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchSyntaxModalOpen(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-teal-300 hover:text-white transition flex items-center gap-1"
                      title="View OpenAlex search syntax guide & examples"
                    >
                      <HelpCircle size={12} />
                      <span>Syntax</span>
                    </button>

                    {/* Fast Type-Ahead Autocomplete Dropdown */}
                    {autocompleteOpen && autocompleteSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                        <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1.5 text-teal-300 font-bold">
                            <Sparkles size={12} />
                            <span>OpenAlex Fast Type-Ahead Suggestions</span>
                            {autocompleteLoading && <Loader2 size={11} className="animate-spin text-teal-400" />}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAutocompleteOpen(false)}
                            className="text-slate-500 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                          {autocompleteSuggestions.map((sug, idx) => (
                            <button
                              key={sug.id || idx}
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setSearchQuery(sug.display_name);
                                setActiveSearch(sug.display_name);
                                setAutocompleteOpen(false);
                                executeSearch(1, sug.display_name);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition flex items-start justify-between gap-3 group"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 transition truncate">
                                  {sug.display_name}
                                </p>
                                {sug.hint && (
                                  <p className="text-[11px] text-slate-400 font-serif italic truncate mt-0.5">
                                    {sug.hint}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:bg-teal-900/50 group-hover:text-teal-300">
                                {sug.entity_type || 'work'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 shrink-0 ${
                  searchScope === 'semantic'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-900/30'
                }`}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : searchScope === 'semantic' ? <Brain size={16} /> : <Search size={16} />}
                <span>{searchScope === 'semantic' ? 'Match Vectors' : 'Execute Search'}</span>
              </button>
            </div>

            {/* Semantic Explanatory Banner */}
            {searchScope === 'semantic' && (
              <div className="bg-purple-950/40 border border-purple-700/60 rounded-2xl p-3 text-xs text-purple-200 flex items-start gap-2.5 animate-fadeIn">
                <Brain size={16} className="text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-white flex items-center justify-between">
                    <span>AI Semantic Vector Search Active</span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-900/80 px-2 py-0.5 rounded-full border border-purple-600/60">Max 50 Results / Cosine Distance</span>
                  </p>
                  <p className="text-[11px] text-purple-300/80 leading-relaxed">
                    Conceptual matching searches meaning across all 250M+ paper abstracts using 1,024-dimensional vectors. Note: <span className="underline">country_code</span> and <span className="underline">cited_by_count</span> filters are automatically omitted per OpenAlex vector engine constraints.
                  </p>
                </div>
              </div>
            )}

            {/* Search Engine Mode Badges & Toggles */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs pt-0.5">
              {/* Neural Reranker Toggle */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsRerankEnabled(!isRerankEnabled);
                }}
                disabled={searchScope === 'semantic'}
                className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 ${
                  isRerankEnabled && searchScope !== 'semantic'
                    ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                } ${searchScope === 'semantic' ? 'opacity-40 cursor-not-allowed' : ''}`}
                title="Reorder top 100 results with relevance probability decision model"
              >
                <Brain size={13} className={isRerankEnabled ? 'text-purple-400' : 'text-slate-500'} />
                <span>AI Neural Rerank (Top 100)</span>
                {isRerankEnabled && searchScope !== 'semantic' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
              </button>

              {/* Exact Unstemmed / Wildcards Toggle */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsExactMatch(!isExactMatch);
                }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 ${
                  isExactMatch
                    ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Search unstemmed literal text without lemmatization (required for wildcards like machin*)"
              >
                <Zap size={13} className={isExactMatch ? 'text-amber-400' : 'text-slate-500'} />
                <span>Exact / Wildcard Mode (*, ?)</span>
              </button>

              {/* Open Access Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-teal-700 select-none">
                <input
                  type="checkbox"
                  checked={isOpenAccessOnly}
                  onChange={(e) => {
                    setIsOpenAccessOnly(e.target.checked);
                    executeSearch(1, activeSearch);
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500/20"
                />
                <span className="text-teal-300 font-bold flex items-center gap-1">
                  <span>🔓</span> Open Access
                </span>
              </label>

              {/* Format Type */}
              <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[11px]">Format:</span>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    executeSearch(1, activeSearch);
                  }}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">All Formats</option>
                  <option value="article" className="bg-slate-900 text-white">Journal Article</option>
                  <option value="book" className="bg-slate-900 text-white">Book / Monograph</option>
                  <option value="dissertation" className="bg-slate-900 text-white">Thesis / Dissertation</option>
                  <option value="review" className="bg-slate-900 text-white">Literature Review</option>
                </select>
              </div>

              {/* Sort Order (Supports Single & Multiple Sort Keys per OpenAlex Spec) */}
              <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[11px]">Sort:</span>
                <select
                  value={isRerankEnabled ? 'relevance' : selectedSort}
                  disabled={isRerankEnabled}
                  onChange={(e) => {
                    setSelectedSort(e.target.value);
                    executeSearch(1, activeSearch);
                  }}
                  className={`bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs ${
                    isRerankEnabled ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="relevance" className="bg-slate-900 text-white">🎯 Relevance Score (Best Match)</option>
                  <option value="cited_by_count:desc" className="bg-slate-900 text-white">🔥 Most Cited (Highest Citations)</option>
                  <option value="cited_by_count:asc" className="bg-slate-900 text-white">📈 Citations (Lowest First)</option>
                  <option value="publication_date:desc" className="bg-slate-900 text-white">📅 Publication Date (Newest)</option>
                  <option value="publication_date:asc" className="bg-slate-900 text-white">📆 Publication Date (Oldest)</option>
                  <option value="publication_year:desc,relevance_score:desc" className="bg-slate-900 text-white">⭐ Year Newest, then Relevance</option>
                  <option value="cited_by_count:desc,publication_year:desc" className="bg-slate-900 text-white">🏆 Citations Highest, then Year</option>
                  <option value="publication_year:desc,cited_by_count:desc" className="bg-slate-900 text-white">⚡ Year Newest, then Citations</option>
                  <option value="display_name:asc" className="bg-slate-900 text-white">🔤 Title / Name (A → Z)</option>
                  <option value="display_name:desc" className="bg-slate-900 text-white">🔤 Title / Name (Z → A)</option>
                </select>
              </div>

              {/* Advanced Filters Expand Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowAdvancedFilters(!showAdvancedFilters);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                  showAdvancedFilters || activeAdvancedFilterCount > 0
                    ? 'bg-teal-900/60 border-teal-500 text-teal-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Filters & Logic</span>
                {activeAdvancedFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950 text-[10px] font-extrabold">
                    {activeAdvancedFilterCount}
                  </span>
                )}
                {showAdvancedFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Bulk DOI Search Button */}
              <button
                type="button"
                onClick={() => { sounds.playClick(); setBulkDoiModalOpen(true); }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  activeBulkDois
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
                title="Lookup up to 100 DOIs at once using OpenAlex OR pipe syntax"
              >
                <Hash size={13} />
                <span>Bulk DOIs</span>
                {activeBulkDois && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>

              {/* Results count indicator & Quick Distribution Button */}
              {meta.count > 0 && (
                <div className="ml-auto text-slate-400 font-mono text-[11px] flex items-center gap-2">
                  <span>Found <span className="text-teal-400 font-bold">{meta.count.toLocaleString()}</span> works</span>
                  {meta.reranked && <span className="text-purple-400 font-bold">✨ (Reranked)</span>}
                  {meta.cached && <span className="text-emerald-400 font-bold">⚡ (Instant DB)</span>}

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab('analytics');
                      fetchAggregations(analyticsGroupBy);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white transition flex items-center gap-1.5 text-[11px] font-bold shadow-sm active:scale-95 ml-1"
                    title="Analyze distribution of these works across formats, institutions, journals, and years"
                  >
                    <BarChart3 size={12} />
                    <span>Distribution (Group By)</span>
                  </button>
                </div>
              )}
            </div>

            {/* EXPANDABLE ADVANCED FILTERS PANEL */}
            {showAdvancedFilters && (
              <div className="pt-4 mt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs animate-fadeIn">
                {/* 1. Author Byline Search */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-teal-300 font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-teal-400" />
                      Published Author Byline
                    </span>
                    <span className="text-[10px] text-slate-400">raw_author_name.search</span>
                  </div>
                  <input
                    type="text"
                    value={bylineAuthor}
                    onChange={(e) => setBylineAuthor(e.target.value)}
                    placeholder='e.g. "Jane Smith"~1 or "Priem, Jason"'
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Matches exact byline as printed on published article. Use ~1 for middle initials.
                  </span>
                </div>

                {/* 2. Citation Impact (Numeric Inequality) */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-teal-300 font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" />
                      Citation Impact Inequality (&gt;)
                    </span>
                    <span className="text-[10px] text-slate-400">cited_by_count:&gt;N</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'any', label: 'Any' },
                      { id: '10', label: '≥ 10 Citations' },
                      { id: '50', label: '≥ 50 Citations' },
                      { id: '100', label: '≥ 100 Highly Cited' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { sounds.playClick(); setMinCitations(c.id); }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                          minCitations === c.id
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Geographic & Institutional Scope */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-teal-300 font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-teal-400" />
                      Geographic & Institution Scope
                    </span>
                    <span className="text-[10px] text-slate-400">country_code / is_global_south</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Global (All)' },
                      { id: 'ng', label: '🇳🇬 Nigeria Only' },
                      { id: 'global_south', label: '🌍 Global South' },
                      { id: 'west_africa', label: '🌐 West Africa (NG/GH/SN)' }
                    ].map(geo => (
                      <button
                        key={geo.id}
                        type="button"
                        onClick={() => { sounds.playClick(); setOriginCountry(geo.id); }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                          originCountry === geo.id
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {geo.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Content Flags & Negation */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-teal-300 font-bold font-mono flex items-center gap-1">
                    <CheckCircle size={12} className="text-emerald-400" />
                    Content Flags & Negation
                  </span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={hasAbstractOnly}
                        onChange={(e) => setHasAbstractOnly(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-teal-500"
                      />
                      <span>Must have Abstract decoded</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={hasFullTextOnly}
                        onChange={(e) => setHasFullTextOnly(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-teal-500"
                      />
                      <span>Has Direct Full-Text PDF</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={excludeParatext}
                        onChange={(e) => setExcludeParatext(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-teal-500"
                      />
                      <span className="text-amber-300">Negate front-matter (type:!paratext)</span>
                    </label>
                  </div>
                </div>

                {/* 5. Exact Publication Date Bounds */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-teal-300 font-bold font-mono flex items-center gap-1">
                    <Calendar size={12} className="text-teal-400" />
                    Date Range Boundaries
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">From Date:</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">To Date:</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Custom Raw OpenAlex Filter Expression (Power Users) */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-teal-300 font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <ListFilter size={12} className="text-teal-400" />
                      Direct OpenAlex Filter Syntax
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">e.g. primary_location.source.country_code:CA</span>
                  </div>
                  <input
                    type="text"
                    value={rawFilter}
                    onChange={(e) => setRawFilter(e.target.value)}
                    placeholder="e.g. primary_location.source.is_ojs:true"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                  />
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Presets:</span>
                    <button
                      type="button"
                      onClick={() => setRawFilter('primary_location.source.is_ojs:true')}
                      className="text-teal-400 hover:underline"
                    >
                      OJS
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setRawFilter('primary_location.source.summary_stats.h_index:>50')}
                      className="text-teal-400 hover:underline"
                    >
                      Journal h-index &gt; 50
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setRawFilter('authorships.institutions.country_code:ng+gh')}
                      className="text-teal-400 hover:underline"
                    >
                      NG + GH (AND)
                    </button>
                  </div>
                </div>

                {/* Bottom Filter Actions */}
                <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-slate-400 hover:text-rose-400 text-xs font-mono transition flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Reset All Filters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPage(1); executeSearch(1, activeSearch); }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 active:scale-95"
                  >
                    <Check size={14} />
                    <span>Apply Filters & Rerank</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* 4. RESULTS SECTION FOR WORKS */}
      {activeTab === 'works' && (
        <div className="space-y-4">
          {/* Echoed OpenAlex x_query (OQL sentence) banner */}
          {meta.x_query?.oql && !isLoading && !error && (
            <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-indigo-950/70 border border-teal-800/50 rounded-2xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn font-mono">
              <div className="flex items-center gap-2 text-teal-200 min-w-0">
                <span className="bg-teal-900/80 px-2 py-0.5 rounded-lg border border-teal-700/60 font-bold text-teal-300 text-[11px] shrink-0 flex items-center gap-1">
                  <Terminal size={11} />
                  <span>OQL</span>
                </span>
                <span className="truncate text-slate-200">
                  {meta.x_query.oql}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setOqlInput(meta.x_query.oql);
                    setActiveTab('oql');
                    handleTranslateQuery(meta.x_query.oql, 'oql');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-teal-900/70 hover:bg-teal-800 border border-teal-600/60 text-teal-200 hover:text-white transition flex items-center gap-1 text-[11px] font-bold"
                >
                  <span>Open in OQL Studio</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={36} className="animate-spin text-teal-400 mx-auto" />
              <p className="text-slate-300 font-serif text-sm">Querying OpenAlex Academic Graph via FCC Gateway...</p>
              <p className="text-xs text-slate-500 font-mono">
                {isRerankEnabled ? 'Neural reranking top 100 results with relevance probability model...' : 'Evaluating search scope & SQLite institutional cache...'}
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className={`p-6 rounded-2xl border text-sm flex items-start gap-3.5 shadow-lg ${
              error.status === 429
                ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                : error.status === 400
                ? 'bg-blue-950/40 border-blue-600/70 text-blue-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}>
              <AlertCircle size={22} className={`shrink-0 mt-0.5 ${
                error.status === 429 ? 'text-amber-400' : error.status === 400 ? 'text-blue-400' : 'text-rose-400'
              }`} />
              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>
                    {error.status === 429
                      ? 'Rate Limit / Daily Credit Budget Exceeded (HTTP 429)'
                      : error.status === 400
                      ? 'Search or Filter Syntax Error (HTTP 400)'
                      : error.status === 404
                      ? 'Entity Not Found (HTTP 404)'
                      : 'OpenAlex Gateway Notice'}
                  </span>
                </h4>
                <p className="text-xs leading-relaxed">{typeof error === 'string' ? error : error.message}</p>
                {error.suggestion && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-mono">Suggested fix:</span>
                    <span className="font-mono text-emerald-400 font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-700/60">
                      {error.suggestion}
                    </span>
                  </div>
                )}
                {error.status === 429 && (
                  <p className="text-[11px] text-amber-300 font-mono pt-1">
                    Tip: 4xx/5xx responses cost 0 credits. Institutional SQLite database cache continues serving saved and cached research papers.
                  </p>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && works.length === 0 && (
            <div className="py-16 text-center space-y-2 bg-slate-900/40 rounded-3xl border border-slate-800">
              <BookOpen size={36} className="text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No academic papers found</h3>
              <p className="text-xs text-slate-400">Try adjusting your keywords, expanding date bounds, or clearing filters.</p>
            </div>
          )}

          {!isLoading && !error && works.map((w) => {
            const isSaved = Boolean(savedStatusMap[w.id]);
            const isAbstractExpanded = Boolean(expandedAbstracts[w.id]);

            return (
              <div
                key={w.id}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-700/60 rounded-3xl p-5 md:p-6 transition duration-300 space-y-4 shadow-lg group relative overflow-hidden"
              >
                {/* Top Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Open Access Badge */}
                    {w.is_oa ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-600/60 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <span>🔓</span>
                        <span>{w.oa_status ? w.oa_status.toUpperCase() : 'OPEN ACCESS'}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]">
                        🔒 Restricted Access
                      </span>
                    )}

                    {/* Work Type */}
                    <span className="px-2 py-0.5 rounded-md bg-teal-950/80 border border-teal-800 text-teal-300 font-mono text-[10px] uppercase font-bold">
                      {w.type || 'Scholarly Work'}
                    </span>

                    {/* Year */}
                    {w.publication_year && (
                      <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{w.publication_year}</span>
                      </span>
                    )}

                    {/* Citations Count */}
                    <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span>{w.cited_by_count.toLocaleString()} Citations</span>
                    </span>

                    {/* AI Rerank Score (if available) */}
                    {w.rerank_score !== undefined && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-700 text-purple-300 font-mono text-[10px] font-bold flex items-center gap-1">
                        <Brain size={10} className="text-purple-400" />
                        <span>Rerank Score: {(w.rerank_score * 100).toFixed(0)}%</span>
                      </span>
                    )}

                    {/* Vector Cosine Similarity Score (Semantic Search) */}
                    {searchScope === 'semantic' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-700 text-purple-300 font-mono text-[10px] font-bold flex items-center gap-1">
                        <Brain size={10} className="text-purple-400" />
                        <span>🧠 Vector Match (Cosine Distance)</span>
                      </span>
                    )}

                    {/* Relevance Score (if available and not semantic) */}
                    {w.relevance_score !== undefined && w.rerank_score === undefined && searchScope !== 'semantic' && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]">
                        Relevance: {w.relevance_score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* DOI badge */}
                  {w.doi && (
                    <a
                      href={w.doi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-teal-300 font-mono text-[10px] flex items-center gap-1 transition"
                      title="Digital Object Identifier"
                    >
                      <span>DOI: {w.doi}</span>
                      <ArrowUpRight size={11} />
                    </a>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white group-hover:text-teal-200 transition font-serif leading-snug">
                    {w.title}
                  </h3>

                  {/* Primary Venue / Publisher */}
                  {(w.primary_source || w.publisher) && (
                    <div className="mt-1 text-xs text-teal-400 font-medium flex items-center gap-1.5">
                      <Building size={12} className="text-teal-500 shrink-0" />
                      <span className="truncate">{w.primary_source || w.publisher}</span>
                    </div>
                  )}
                </div>

                {/* Authors */}
                {w.authors && w.authors.length > 0 && (
                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-400 flex items-center gap-1">
                      <User size={12} className="text-teal-500" />
                      <span>Researchers:</span>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {w.authors.map((a, i) => (
                        <span key={i} className="text-slate-200">
                          <span className="font-medium text-white">{a.name}</span>
                          {a.institutions && a.institutions[0] && (
                            <span className="text-[10px] text-slate-400 ml-1">({a.institutions[0]})</span>
                          )}
                          {i < w.authors.length - 1 && <span className="text-slate-600 ml-1">;</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abstract Section */}
                {w.abstract ? (
                  <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/80 space-y-2 text-xs leading-relaxed text-slate-300">
                    <div className="flex items-center justify-between text-[11px] font-mono text-teal-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <FileText size={12} className="text-teal-400" />
                        Abstract & Synoptic Findings:
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAbstract(w.id)}
                        className="text-slate-400 hover:text-teal-300 transition flex items-center gap-1"
                      >
                        {isAbstractExpanded ? 'Collapse' : 'Expand'}
                        {isAbstractExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                    <p className={isAbstractExpanded ? '' : 'line-clamp-3'}>
                      {w.abstract}
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>No structured abstract index available for this indexed paper.</span>
                  </div>
                )}

                {/* Topics / Concepts taxonomy */}
                {w.topics && w.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {w.topics.slice(0, 5).map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFilterByEntity('topic', { id: t.id, display_name: t.name })}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-[10px] text-slate-400 hover:text-teal-300 transition"
                      >
                        #{t.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Read / PDF Link */}
                    {w.pdf_url ? (
                      <a
                        href={w.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md shadow-teal-950 active:scale-95"
                      >
                        <Download size={14} />
                        <span>Read Full PDF</span>
                      </a>
                    ) : w.doi_url ? (
                      <a
                        href={w.doi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        <span>Publisher Landing</span>
                      </a>
                    ) : null}

                    {/* Cite Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenCitationModal(w)}
                      className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl font-medium transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Quote size={13} className="text-teal-400" />
                      <span>Cite (APA/MLA)</span>
                    </button>
                  </div>

                  {/* 1-Click Save to Library DB */}
                  <div className="flex items-center gap-2">
                    {isSaved ? (
                      <button
                        type="button"
                        onClick={() => handleUnsaveWork(w.id)}
                        className="px-3 py-2 bg-amber-950/80 border border-amber-600/70 text-amber-300 rounded-xl font-bold transition flex items-center gap-1.5 hover:bg-rose-950/80 hover:border-rose-600/70 hover:text-rose-300 active:scale-95"
                        title="Remove from saved library collection"
                      >
                        <Check size={14} />
                        <span>Saved in Library DB</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingId === w.id}
                        onClick={() => handleSaveWork(w)}
                        className="px-3.5 py-2 bg-slate-950 hover:bg-teal-950/80 border border-slate-700 hover:border-teal-500 text-slate-300 hover:text-teal-300 rounded-xl font-medium transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        {savingId === w.id ? (
                          <Loader2 size={14} className="animate-spin text-teal-400" />
                        ) : (
                          <Bookmark size={14} />
                        )}
                        <span>Save to Library DB</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {meta.count > perPage && !isLoading && !error && (
            <div className="pt-4 flex items-center justify-between border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">
                Page <span className="text-teal-300 font-bold">{page}</span> of{' '}
                <span className="text-white font-bold">{Math.ceil(meta.count / perPage).toLocaleString()}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => executeSearch(page - 1, activeSearch)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold disabled:opacity-40 hover:bg-slate-800 transition active:scale-95"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * perPage >= meta.count}
                  onClick={() => executeSearch(page + 1, activeSearch)}
                  className="px-4 py-2 rounded-xl bg-teal-600 border border-teal-500 text-white font-bold disabled:opacity-40 hover:bg-teal-500 transition active:scale-95 shadow-md shadow-teal-950"
                >
                  Next Page
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SAVED PAPERS VIEW */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-4 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-amber-400" />
              <span className="font-bold">Your Saved FCC Library Scholarly Collection</span>
              <span className="text-slate-400">({savedWorks.length} papers recorded in local SQLite database)</span>
            </div>
            <button
              type="button"
              onClick={fetchSavedWorks}
              className="text-amber-400 hover:text-white transition flex items-center gap-1 font-mono text-[11px]"
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          {savedWorks.length === 0 ? (
            <div className="py-20 text-center space-y-2 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Bookmark size={40} className="text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No research papers saved yet</h3>
              <p className="text-xs text-slate-400">
                Browse scholarly works and click "Save to Library DB" to keep them permanently in your local collection.
              </p>
            </div>
          ) : (
            savedWorks.map((item) => {
              const authors = item.authors ? (typeof item.authors === 'string' ? JSON.parse(item.authors) : item.authors) : [];

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-amber-400 font-mono font-bold">
                      Saved on {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnsaveWork(item.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-medium transition"
                    >
                      Remove from Saved
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white font-serif">{item.title}</h3>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    {authors.length > 0 && <span>Authors: {authors.map(a => a.name).join(', ')}</span>}
                    {item.publication_year && <span>Year: {item.publication_year}</span>}
                    {item.doi && <span>DOI: {item.doi}</span>}
                  </div>

                  {item.abstract && (
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 line-clamp-3">
                      {item.abstract}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    {item.pdf_url && (
                      <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        <span>Read PDF</span>
                      </a>
                    )}
                    {item.doi && (
                      <a
                        href={`https://doi.org/${item.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <ExternalLink size={13} />
                        <span>DOI Landing</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. ENTITY GRAPH EXPLORER (Authors, Sources, Institutions, Topics, Awards, SDGs, Subfields, Countries, Keywords) */}
      {['authors', 'sources', 'institutions', 'topics', 'awards', 'sdgs', 'subfields', 'domains', 'keywords', 'countries'].includes(activeTab) && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="text"
                  value={entityQuery}
                  onChange={(e) => setEntityQuery(e.target.value)}
                  placeholder={`Search OpenAlex ${activeTab.toUpperCase()} (e.g. Nigeria, Ibadan, Oxford, Economics, Grants)...`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="button"
                disabled={entityLoading}
                onClick={() => executeEntitySearch(activeTab, entityQuery)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 active:scale-95 disabled:opacity-50"
              >
                {entityLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Search {activeTab.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {entityLoading ? (
            <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={36} className="animate-spin text-indigo-400 mx-auto" />
              <p className="text-slate-300 font-serif text-sm">Traversing OpenAlex {activeTab} taxonomy & graph...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entityResults.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-700/60 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-indigo-400 font-bold uppercase">
                        {activeTab === 'sdgs' ? 'UN SDG' : activeTab === 'awards' ? 'Grant Award' : activeTab === 'subfields' ? 'Subfield' : activeTab.slice(0, -1)}
                      </span>
                      {item.works_count !== undefined && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {item.works_count.toLocaleString()} Works
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-serif">{item.display_name || item.funder_award_id || item.id}</h3>

                    {/* Author specific details */}
                    {activeTab === 'authors' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {item.last_known_institutions && item.last_known_institutions[0] && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Building size={12} className="text-indigo-400" />
                            <span>{item.last_known_institutions[0].display_name}</span>
                          </div>
                        )}
                        {item.orcid && (
                          <a
                            href={item.orcid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono text-[11px]"
                          >
                            <span>ORCID: {item.orcid}</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Source specific details */}
                    {activeTab === 'sources' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {item.host_organization_name && <div>Publisher: {item.host_organization_name}</div>}
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {item.is_oa && <span className="text-emerald-400">🔓 Open Access</span>}
                          {item.is_in_doaj && <span className="text-teal-400">✓ DOAJ Indexed</span>}
                        </div>
                      </div>
                    )}

                    {/* Institution specific details */}
                    {activeTab === 'institutions' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {item.country_code && <div>Country: {item.country_code.toUpperCase()}</div>}
                        {item.type && <div className="capitalize">Type: {item.type}</div>}
                        {item.is_global_south && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            🌍 Global South Institution
                          </span>
                        )}
                      </div>
                    )}

                    {/* Topics specific details */}
                    {activeTab === 'topics' && (
                      <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                        {item.domain?.display_name && <div>Domain: {item.domain.display_name}</div>}
                        {item.field?.display_name && <div>Field: {item.field.display_name}</div>}
                        {item.subfield?.display_name && <div>Subfield: {item.subfield.display_name}</div>}
                      </div>
                    )}

                    {/* Awards specific details */}
                    {activeTab === 'awards' && (
                      <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                        {item.funder_award_id && <div>Grant Ref: {item.funder_award_id}</div>}
                        {item.funder_display_name && <div className="text-amber-300">Funder: {item.funder_display_name}</div>}
                        {item.amount && <div>Amount: {item.currency || '$'}{Number(item.amount).toLocaleString()}</div>}
                      </div>
                    )}

                    {/* SDGs specific details */}
                    {activeTab === 'sdgs' && (
                      <div className="text-xs text-slate-400 space-y-1">
                        {item.description && <p className="text-slate-300 text-xs line-clamp-2">{item.description}</p>}
                        <div className="text-emerald-400 font-mono text-[11px]">UN Sustainable Development Goal</div>
                      </div>
                    )}

                    {/* Subfields specific details */}
                    {activeTab === 'subfields' && (
                      <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                        {item.field?.display_name && <div>Field: {item.field.display_name}</div>}
                        {item.domain?.display_name && <div>Domain: {item.domain.display_name}</div>}
                      </div>
                    )}

                    {/* Countries specific details */}
                    {activeTab === 'countries' && (
                      <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                        {item.country_code && <div>ISO: {item.country_code.toUpperCase()}</div>}
                        {item.continent && <div>Continent: {item.continent.display_name || item.continent}</div>}
                        {item.is_global_south && <span className="text-emerald-400">🌍 Global South</span>}
                      </div>
                    )}
                  </div>

                  {/* Filter works by this entity button */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleFilterByEntity(
                        activeTab === 'sdgs' ? 'sdg' : 
                        activeTab === 'awards' ? 'award' : 
                        activeTab === 'subfields' ? 'subfield' : 
                        activeTab === 'countries' ? 'country' : 
                        activeTab.slice(0, -1),
                        item
                      )}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <BookOpen size={13} />
                      <span>Explore Works by this {activeTab === 'sdgs' ? 'SDG' : activeTab === 'awards' ? 'Award' : activeTab === 'subfields' ? 'Subfield' : activeTab.slice(0, -1)}</span>
                    </button>

                    <a
                      href={item.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-mono"
                    >
                      <span>OpenAlex Graph</span>
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. ANALYTICS & DISTRIBUTION (OPENALEX GROUP BY AGGREGATION SPECIFICATION) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-800/50 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                  <BarChart3 size={13} className="text-indigo-400" />
                  <span>OPENALEX GROUP BY AGGREGATIONS</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white font-serif">
                  Scholarly Graph Distribution & Breakdown
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  The <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">group_by</code> parameter aggregates matching research entities into clusters and counts entities in each group. Click any row below to apply that specific group as an active filter!
                </p>
              </div>

              {/* Aggregation Stats Box */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">MATCHING WORKS</div>
                  <div className="text-lg font-bold text-teal-400 font-mono">
                    {analyticsMeta.count > 0 ? analyticsMeta.count.toLocaleString() : 'Loading...'}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">GROUPS RETURNED</div>
                  <div className="text-lg font-bold text-indigo-400 font-mono">
                    {analyticsData.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Context Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Context:</span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-teal-300">
                {activeSearch ? `Search: "${activeSearch}"` : 'All Research Works'}
              </span>
              {selectedType !== 'all' && (
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  Type: {selectedType}
                </span>
              )}
              {isOpenAccessOnly && (
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400">
                  🔓 Open Access Only
                </span>
              )}
              {originCountry === 'ng' && (
                <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-teal-400">
                  🇳🇬 Nigeria Affiliations
                </span>
              )}
              {pinnedFilter && (
                <span className="bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-700 text-indigo-300">
                  {pinnedFilter.label}
                </span>
              )}
            </div>
          </div>

          {/* Group By Field Selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 font-mono uppercase tracking-wider">
                Select Aggregation Dimension:
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Endpoint: <code className="text-indigo-400">group_by={analyticsGroupBy}</code>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {GROUP_BY_FIELDS.map((f) => {
                const isActive = analyticsGroupBy === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setAnalyticsGroupBy(f.id);
                      fetchAggregations(f.id, null, analyticsIncludeUnknown, analyticsSort);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 active:scale-95 ${
                      isActive
                        ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-md shadow-indigo-950'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span>{f.icon}</span>
                      <span className={isActive ? 'text-indigo-300 font-extrabold' : ''}>{f.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{f.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Controls Bar: Include Unknowns & Sort Order */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Include Unknowns Toggle */}
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={analyticsIncludeUnknown}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setAnalyticsIncludeUnknown(val);
                      fetchAggregations(analyticsGroupBy, null, val, analyticsSort);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500/20"
                  />
                  <span className="text-slate-300 font-medium text-xs">
                    Include Unknowns (<code className="text-indigo-400 text-[11px]">:include_unknown</code> sentinel -111)
                  </span>
                </label>

                {/* Sort Order Selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-mono text-[11px]">Group Sort:</span>
                  <select
                    value={analyticsSort}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnalyticsSort(val);
                      fetchAggregations(analyticsGroupBy, null, analyticsIncludeUnknown, val);
                    }}
                    className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="count:desc" className="bg-slate-900 text-white">Count: Highest First (count:desc)</option>
                    <option value="count:asc" className="bg-slate-900 text-white">Count: Lowest First (count:asc)</option>
                    <option value="key:asc" className="bg-slate-900 text-white">Key: Alphabetical A → Z (key:asc)</option>
                    <option value="key:desc" className="bg-slate-900 text-white">Key: Alphabetical Z → A (key:desc)</option>
                  </select>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                disabled={analyticsLoading}
                onClick={() => fetchAggregations(analyticsGroupBy, null, analyticsIncludeUnknown, analyticsSort)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center gap-2 text-xs shadow-md shadow-indigo-950 active:scale-95 disabled:opacity-50"
              >
                {analyticsLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>Refresh Breakdown</span>
              </button>
            </div>
          </div>

          {/* Aggregation Results List */}
          {analyticsLoading ? (
            <div className="py-20 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Loader2 size={36} className="animate-spin text-indigo-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aggregating OpenAlex Scholarly Records...</h3>
              <p className="text-xs text-slate-400 font-mono">
                Calculating group totals across 250M+ items for <span className="text-indigo-400">{analyticsGroupBy}</span>
              </p>
            </div>
          ) : analyticsError ? (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-3xl p-6 text-center space-y-2">
              <AlertCircle size={28} className="text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aggregation Request Failed</h3>
              <p className="text-xs text-rose-300 font-mono">{analyticsError}</p>
            </div>
          ) : analyticsData.length === 0 ? (
            <div className="py-16 text-center space-y-2 bg-slate-900/40 rounded-3xl border border-slate-800">
              <BarChart2 size={36} className="text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Groups Found</h3>
              <p className="text-xs text-slate-400">
                Try enabling "Include Unknowns" or widening your search query.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(...analyticsData.map(g => g.count || 0), 1);
                const totalCount = analyticsMeta.count || analyticsData.reduce((acc, g) => acc + (g.count || 0), 0) || 1;

                return analyticsData.map((group, idx) => {
                  const displayName = group.display_name || group.key_display_name || String(group.key);
                  const isUnknown = group.key === 'unknown' || group.key === -111 || group.key === '-111' || displayName === 'Unknown / Unrecorded';
                  const percentOfTotal = ((group.count / totalCount) * 100).toFixed(1);
                  const barWidth = Math.max(2, Math.min(100, (group.count / maxCount) * 100));

                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800/90 hover:border-indigo-500/60 rounded-2xl p-4 transition-all shadow-md space-y-2.5 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Group Title and Key */}
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-400 font-mono text-[11px] font-bold shrink-0 border border-slate-800">
                            #{idx + 1}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                                {displayName}
                              </h4>
                              {isUnknown && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono">
                                  Unknown / Unrecorded (-111)
                                </span>
                              )}
                            </div>

                            {/* Raw Key or OpenAlex ID */}
                            {typeof group.key === 'string' && group.key.startsWith('https://openalex.org/') ? (
                              <a
                                href={group.key}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-indigo-400/80 hover:text-indigo-300 flex items-center gap-1 mt-0.5"
                              >
                                <span>{group.key.replace('https://openalex.org/', '')}</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                                Raw Key: {String(group.key)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Counts & Action Button */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-sm font-bold text-white font-mono block">
                              {group.count.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">works</span>
                            </span>
                            <span className="text-[10px] font-mono text-indigo-400">
                              {percentOfTotal}% of total
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyGroupFilter(analyticsGroupBy, group)}
                            className="px-3.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                            title="Set this group as an active search filter"
                          >
                            <span>Filter Works</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Distribution Progress Bar */}
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Cursor Pagination Button */}
              {analyticsMeta.next_cursor && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    disabled={analyticsLoading}
                    onClick={() => fetchAggregations(analyticsGroupBy, analyticsMeta.next_cursor)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-indigo-700/60 hover:border-indigo-500 text-indigo-200 font-bold text-xs rounded-2xl transition flex items-center gap-2 mx-auto shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {analyticsLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                    <span>Load Next 200 Groups (Cursor Paging)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. OQL QUERY LAB & 3-WAY TRANSLATOR STUDIO (OPENALEX OQL API SPECIFICATION) */}
      {activeTab === 'oql' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-800/50 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <Terminal size={13} className="text-emerald-400" />
                  <span>OPENALEX QUERY LANGUAGE (OQL) STUDIO</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white font-serif">
                  Natural Sentence Queries & 3-Way Translation
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Every query in OpenAlex can be written in three synchronized forms: a human-readable <span className="text-emerald-300 font-semibold">OQL Sentence</span>, a machine-validatable <span className="text-teal-300 font-semibold">OQO JSON</span> object, or a legacy <span className="text-indigo-300 font-semibold">Classic URL</span>. Translate without running, validate against the grammar, or execute directly through our cached proxy!
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-xs font-mono shrink-0">
                <span className="text-slate-400">Execution:</span>
                <span className="text-emerald-400 font-bold">GET /?oql=</span>
                <span className="text-slate-600">|</span>
                <span className="text-teal-400 font-bold">POST /</span>
              </div>
            </div>
          </div>

          {/* Interactive Translation & Query Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 font-mono">Input Format:</span>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setOqlInputFormat('oql')}
                    className={`px-3 py-1 rounded-lg transition ${
                      oqlInputFormat === 'oql'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💬 OQL Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setOqlInputFormat('oxurl')}
                    className={`px-3 py-1 rounded-lg transition ${
                      oqlInputFormat === 'oxurl'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔗 Classic URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setOqlInputFormat('oqo')}
                    className={`px-3 py-1 rounded-lg transition ${
                      oqlInputFormat === 'oqo'
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🧩 OQO JSON
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={oqlValidateLoading}
                  onClick={() => handleValidateOql(oqlInput)}
                  className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono rounded-xl transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Lint OQL query against OpenAlex formal grammar"
                >
                  {oqlValidateLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="text-emerald-400" />}
                  <span>Lint Grammar</span>
                </button>

                <button
                  type="button"
                  disabled={oqlTranslateLoading}
                  onClick={() => handleTranslateQuery(oqlInput, oqlInputFormat)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {oqlTranslateLoading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRightLeft size={12} />}
                  <span>Translate 3-Way</span>
                </button>

                <button
                  type="button"
                  disabled={oqlExecuteLoading}
                  onClick={() => handleExecuteOql(oqlInput)}
                  className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-950 active:scale-95 disabled:opacity-50"
                >
                  {oqlExecuteLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  <span>Run Query</span>
                </button>
              </div>
            </div>

            {/* Query Input Area */}
            <div className="space-y-1.5">
              <textarea
                rows={3}
                value={oqlInput}
                onChange={(e) => setOqlInput(e.target.value)}
                placeholder={
                  oqlInputFormat === 'oql'
                    ? 'works where year >= (2020) and title has (microfinance)...'
                    : oqlInputFormat === 'oxurl'
                    ? '/works?filter=publication_year:>2019,display_name.search:microfinance...'
                    : '{"get_rows": "works", "filter_rows": [{"column_id": "publication_year", "value": 2020}]}'
                }
                className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 rounded-2xl p-4 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition resize-y shadow-inner leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <span>Supports natural boolean nesting, inequalities (&gt;, &gt;=, &lt;, &lt;=), group by, and entity projection</span>
                <span>{oqlInput.length} characters</span>
              </div>
            </div>

            {/* Validation Banner (if validated) */}
            {oqlValidationResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-mono space-y-1 animate-fadeIn ${
                  oqlValidationResult.valid
                    ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600/70 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {oqlValidationResult.valid ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Syntax Valid: Compiles cleanly to OpenAlex Query Object (OQO)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} className="text-rose-400" />
                      <span>Syntax Error in OQL String</span>
                    </>
                  )}
                </div>

                {oqlValidationResult.errors && oqlValidationResult.errors.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {oqlValidationResult.errors.map((err, idx) => (
                      <div key={idx} className="text-[11px] text-rose-300">
                        <span className="font-bold">[{err.type} at pos {err.position}]:</span> {err.message}
                        {err.context && <div className="text-slate-400 text-[10px] mt-0.5 font-mono">Context: {err.context}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Synchronized 3-Way Translation Cards */}
            {oqlTranslation && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-white uppercase tracking-wider">Synchronized 3-Way Formats:</span>
                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOqlActiveFormatTab('oql')}
                      className={`px-2.5 py-0.5 rounded transition ${oqlActiveFormatTab === 'oql' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      Canonical OQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setOqlActiveFormatTab('oxurl')}
                      className={`px-2.5 py-0.5 rounded transition ${oqlActiveFormatTab === 'oxurl' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Classic URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setOqlActiveFormatTab('oqo')}
                      className={`px-2.5 py-0.5 rounded transition ${oqlActiveFormatTab === 'oqo' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                    >
                      OQO JSON Schema
                    </button>
                  </div>
                </div>

                {/* Tab 1: Canonical OQL */}
                {oqlActiveFormatTab === 'oql' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-700/60 font-mono text-xs text-emerald-300 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                      <span>CANONICAL OQL TEXT</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(oqlTranslation.oql || ''); sounds.playSuccess(); }}
                        className="text-emerald-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <Copy size={11} /> <span>Copy</span>
                      </button>
                    </div>
                    <p className="select-all text-sm font-semibold text-white leading-relaxed">{oqlTranslation.oql || 'None'}</p>
                    {oqlTranslation.oql_oneline && (
                      <p className="text-[11px] text-slate-500 font-sans">Single-line: <code className="text-emerald-400">{oqlTranslation.oql_oneline}</code></p>
                    )}
                  </div>
                )}

                {/* Tab 2: Classic URL */}
                {oqlActiveFormatTab === 'oxurl' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-700/60 font-mono text-xs text-indigo-300 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                      <span>CLASSIC REST URL GRAMMAR</span>
                      {oqlTranslation.oxurl && (
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(oqlTranslation.oxurl || ''); sounds.playSuccess(); }}
                          className="text-indigo-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          <Copy size={11} /> <span>Copy</span>
                        </button>
                      )}
                    </div>
                    {oqlTranslation.oxurl ? (
                      <p className="select-all text-sm font-semibold text-white break-all">{oqlTranslation.oxurl}</p>
                    ) : (
                      <p className="text-amber-400 text-xs">
                        ⚠️ No classic URL equivalent available. This query uses expressive features (nested booleans / proximity) only supported in OQL/OQO.
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 3: OQO JSON Object */}
                {oqlActiveFormatTab === 'oqo' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-teal-700/60 font-mono text-xs text-teal-300 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                      <span>CANONICAL OQO JSON (FOR PROGRAMS & AGENTS)</span>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(oqlTranslation.oqo || {}, null, 2)); sounds.playSuccess(); }}
                        className="text-teal-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <Copy size={11} /> <span>Copy JSON</span>
                      </button>
                    </div>
                    <pre className="select-all text-[11px] text-teal-200 overflow-x-auto max-h-60 leading-relaxed">
                      {JSON.stringify(oqlTranslation.oqo || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Curated OQL Recipe Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              Curated OQL Recipes (Click to Load):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {OQL_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setOqlInput(tmpl.oql);
                    setOqlInputFormat('oql');
                    handleTranslateQuery(tmpl.oql, 'oql');
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 text-left transition space-y-2 group active:scale-95 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">{tmpl.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">OQL</span>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-400/90 block line-clamp-2 bg-slate-950 p-2 rounded-xl border border-slate-850">
                    {tmpl.oql}
                  </code>
                  <p className="text-[10px] text-slate-400">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Execution Results (if user ran query directly here) */}
          {oqlExecuteResults && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                  <span>Live OQL Execution Results</span>
                  <span className="text-xs font-mono text-emerald-400 font-normal">
                    ({oqlExecuteResults.meta?.count?.toLocaleString() || 0} total works)
                  </span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Status: {oqlExecuteResults.meta?.status || 200} OK
                </span>
              </div>

              {oqlExecuteResults.results && oqlExecuteResults.results.length > 0 ? (
                <div className="space-y-3">
                  {oqlExecuteResults.results.slice(0, 5).map((w, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-emerald-400 font-bold">{w.publication_year || 2024}</span>
                        <span>{w.cited_by_count?.toLocaleString()} citations</span>
                      </div>
                      <h4 className="text-sm font-bold text-white font-serif">{w.title}</h4>
                      {w.abstract && <p className="text-xs text-slate-300 line-clamp-2">{w.abstract}</p>}
                      <div className="pt-2 flex items-center justify-between text-xs">
                        {w.pdf_url ? (
                          <a href={w.pdf_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-white flex items-center gap-1 font-bold">
                            <Download size={12} /> <span>PDF Fulltext</span>
                          </a>
                        ) : <span />}
                        <button
                          type="button"
                          onClick={() => handleSaveWork(w)}
                          className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1"
                        >
                          <Bookmark size={12} /> <span>Save to Library DB</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                  Query executed successfully, returning 0 records. Try adjusting constraints or operators.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8b. AI ABOUTNESS & SDG TAGGER (/api/openalex/text) */}
      {activeTab === 'tagger' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-pink-950/80 via-slate-900 to-rose-950/80 border border-pink-800/50 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={16} />
                  <span>OpenAlex Tag Aboutness API (/text)</span>
                </div>
                <h2 className="text-xl font-bold text-white font-serif">
                  AI Aboutness & UN SDG Classification Laboratory
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Paste arbitrary text (paper titles, abstracts, grant aims, or thesis proposals). OpenAlex models will tag canonical keywords with relevance scores, map them into the 4,500+ topics taxonomy, and identify relevant UN Sustainable Development Goals (SDGs).
                </p>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTaggerTitle('Microfinance and Agricultural Value Chains in Nigeria');
                    setTaggerAbstract('An empirical investigation into cooperative societies, rural banking, and agricultural extension services for smallholder farmers in southwestern Nigeria.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-pink-300 hover:text-white transition"
                >
                  🌾 Sample: Ag Extension
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaggerTitle('Deep Learning and Convolutional Neural Networks for Automated Breast Cancer Detection in Digital Mammography');
                    setTaggerAbstract('Computer-aided diagnosis using deep neural architectures for early stage solid tumor segmentation and clinical oncology.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-purple-300 hover:text-white transition"
                >
                  🧬 Sample: Oncology AI
                </button>
              </div>
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 font-mono">
                Scholarly Title or Heading (Optional):
              </label>
              <input
                type="text"
                value={taggerTitle}
                onChange={(e) => setTaggerTitle(e.target.value)}
                placeholder="e.g. Cooperative banking and economic resilience in West Africa..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-sans"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 font-mono">
                Abstract, Grant Aim, or Proposal Text (Required):
              </label>
              <textarea
                rows={4}
                value={taggerAbstract}
                onChange={(e) => setTaggerAbstract(e.target.value)}
                placeholder="Paste the paragraph or abstract text to analyze..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-sans resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Powered by OpenAlex Tag Aboutness Endpoint
              </span>
              <button
                type="button"
                disabled={taggerLoading || (!taggerTitle.trim() && !taggerAbstract.trim())}
                onClick={handleTagText}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm rounded-2xl transition flex items-center gap-2 shadow-lg shadow-pink-950 active:scale-95 disabled:opacity-50"
              >
                {taggerLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{taggerLoading ? 'Analyzing Text...' : 'Analyze & Tag Aboutness'}</span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {taggerError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{taggerError}</span>
            </div>
          )}

          {/* Results Display */}
          {taggerResults && (
            <div className="space-y-6">
              {/* Keywords Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                    <Tag size={16} />
                    <span>Extracted Keywords ({taggerResults.keywords?.length || 0})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Scores reflect confidence (0.0 to 1.0)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(taggerResults.keywords || []).map((kw) => (
                    <div
                      key={kw.id}
                      className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 hover:border-pink-600/60 transition flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-pink-300 font-bold capitalize">{kw.display_name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 text-[10px]">
                            {Math.round((kw.score || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setActiveSearch(kw.display_name);
                          setSearchQuery(kw.display_name);
                          setActiveTab('works');
                          executeSearch(1, kw.display_name);
                        }}
                        className="text-[11px] font-mono text-teal-400 hover:text-white flex items-center gap-1 transition"
                      >
                        <Search size={11} /> <span>Search works for keyword →</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Layers size={16} />
                    <span>Mapped Subject Topics & Disciplines ({taggerResults.topics?.length || 0})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Canonical OpenAlex Subject Hierarchy</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(taggerResults.topics || []).map((top) => (
                    <div
                      key={top.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-indigo-600/60 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-indigo-400 font-bold">{top.subfield?.display_name || 'Subfield'}</span>
                          {top.score && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              Confidence: {Math.round(top.score * 100)}%
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white font-serif">{top.display_name}</h4>
                        <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                          {top.field?.display_name && <div>Field: {top.field.display_name}</div>}
                          {top.domain?.display_name && <div>Domain: {top.domain.display_name}</div>}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleFilterByEntity('topic', top)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1"
                        >
                          <BookOpen size={12} />
                          <span>Filter Works by Topic</span>
                        </button>
                        <a
                          href={top.id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-mono"
                        >
                          <span>Graph</span>
                          <ArrowUpRight size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. SEARCH SYNTAX ASSISTANT MODAL (Interactive Guide & Examples) */}
      {searchSyntaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-700/60 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <HelpCircle size={18} />
                <span>OpenAlex Search Syntax & Querying Guide</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchSyntaxModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              OpenAlex supports full Lucene text search with Boolean operators, exact unstemmed phrase matching, proximity operators, fuzzy edits, and AI semantic embeddings. Click any example to test it instantly!
            </p>

            <div className="space-y-3 text-xs">
              {/* Boolean Operators */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 font-mono">1. Boolean Operators (AND, OR, NOT)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Uppercase required</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Use parentheses to combine complex conditions. Words without operators default to AND.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySyntaxExample('(cooperative AND microfinance) NOT bank', 'title_abstract_keywords')}
                  className="w-full text-left font-mono text-[11px] bg-slate-900 hover:bg-teal-950/60 text-teal-300 p-2 rounded-xl border border-slate-800 hover:border-teal-600 transition flex items-center justify-between"
                >
                  <span>(cooperative AND microfinance) NOT bank</span>
                  <span className="text-[10px] text-slate-400 font-sans">Click to try →</span>
                </button>
              </div>

              {/* Exact Phrase Matching */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 font-mono">2. Exact Phrase Matching ("...")</span>
                  <span className="text-[10px] text-slate-500 font-mono">Quoted phrases</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Matches adjacent words in the exact sequence requested.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySyntaxExample('"financial inclusion in nigeria"', 'title_abstract_keywords')}
                  className="w-full text-left font-mono text-[11px] bg-slate-900 hover:bg-teal-950/60 text-teal-300 p-2 rounded-xl border border-slate-800 hover:border-teal-600 transition flex items-center justify-between"
                >
                  <span>"financial inclusion in nigeria"</span>
                  <span className="text-[10px] text-slate-400 font-sans">Click to try →</span>
                </button>
              </div>

              {/* Proximity Matching */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 font-mono">3. Word & Phrase Proximity (~N)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Distance slop budget</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Finds words within N positions of each other in any order. Two phrases can also be joined with ~N.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplySyntaxExample('"climate change"~5', 'title_abstract_keywords')}
                    className="text-left font-mono text-[11px] bg-slate-900 hover:bg-teal-950/60 text-teal-300 p-2 rounded-xl border border-slate-800 hover:border-teal-600 transition"
                  >
                    <span>"climate change"~5</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySyntaxExample('"machine learning"~5~"neural network"', 'title_abstract_keywords')}
                    className="text-left font-mono text-[11px] bg-slate-900 hover:bg-teal-950/60 text-teal-300 p-2 rounded-xl border border-slate-800 hover:border-teal-600 transition truncate"
                  >
                    <span>"machine learning"~5~"neural network"</span>
                  </button>
                </div>
              </div>

              {/* Wildcards and Unstemmed Exact Search */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-300 font-mono">4. Wildcards (* and ?) & Fuzzy (~N)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Requires unstemmed exact search</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  <code className="text-amber-300 font-mono">machin*</code> matches machine, machines, machinery. <code className="text-amber-300 font-mono">wom?n</code> matches woman/women. <code className="text-teal-300 font-mono">word~1</code> allows 1 typo.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySyntaxExample('machin*', 'title_abstract_keywords', true)}
                  className="w-full text-left font-mono text-[11px] bg-slate-900 hover:bg-amber-950/60 text-amber-300 p-2 rounded-xl border border-slate-800 hover:border-amber-600 transition flex items-center justify-between"
                >
                  <span>machin* (Exact Unstemmed Mode)</span>
                  <span className="text-[10px] text-slate-400 font-sans">Click to try →</span>
                </button>
              </div>

              {/* AI Semantic Embeddings */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 font-mono">5. AI Semantic Search (Conceptual Meaning)</span>
                  <span className="text-[10px] text-purple-400 font-mono">search.semantic</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Uses vector embeddings to find conceptually related works even if words differ completely.
                </p>
                <button
                  type="button"
                  onClick={() => handleApplySyntaxExample('methods for measuring smallholder agricultural productivity and microcredit default risk', 'semantic')}
                  className="w-full text-left font-mono text-[11px] bg-slate-900 hover:bg-purple-950/60 text-purple-300 p-2 rounded-xl border border-slate-800 hover:border-purple-600 transition flex items-center justify-between"
                >
                  <span className="truncate">"methods for measuring smallholder agricultural productivity..."</span>
                  <span className="text-[10px] text-slate-400 font-sans shrink-0 ml-2">Click to try →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. BULK DOI MODAL (Up to 100 DOIs via OpenAlex pipe OR syntax) */}
      {bulkDoiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-700/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Hash size={18} />
                <span>Bulk DOI Lookup (Up to 100 DOIs)</span>
              </div>
              <button
                type="button"
                onClick={() => setBulkDoiModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste a list of DOIs (one per line, or separated by commas or pipes).
              OpenAlex will retrieve all matching papers simultaneously using its high-speed OR pipe syntax:
              <span className="font-mono text-teal-300 block mt-1">doi:doi1|doi2|doi3...</span>
            </p>

            <textarea
              rows={6}
              value={bulkDoiInput}
              onChange={(e) => setBulkDoiInput(e.target.value)}
              placeholder={`10.1371/journal.pone.0266781\n10.1371/journal.pone.0267149\n10.1038/s41586-020-2649-2`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setBulkDoiInput('');
                  setActiveBulkDois(null);
                  setBulkDoiModalOpen(false);
                  executeSearch(1, activeSearch);
                }}
                className="text-slate-400 hover:text-rose-400 text-xs font-mono transition"
              >
                Clear DOIs
              </button>

              <button
                type="button"
                onClick={handleApplyBulkDois}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Check size={14} />
                <span>Retrieve Matching Papers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. SCHOLARLY CITATION MODAL (APA, MLA, HARVARD, CHICAGO, IEEE, BIBTEX) */}
      {citationModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-700/60 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Quote size={18} />
                <span>Scholarly Citation Generator</span>
              </div>
              <button
                type="button"
                onClick={() => setCitationModalItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white line-clamp-2 font-serif">
                {citationModalItem.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {citationModalItem.author_string || 'Scholarly Researcher'} ({citationModalItem.publication_year || 2024})
              </p>
            </div>

            {/* Style Selector */}
            <div className="flex flex-wrap gap-1.5">
              {['APA', 'MLA', 'HARVARD', 'CHICAGO', 'IEEE', 'BIBTEX'].map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => { sounds.playClick(); setCitationStyle(style); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                    citationStyle === style
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Citation Output Box */}
            <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed select-all">
              {currentCitationText}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Complies with NBTE & NUC academic citation guidelines.
              </span>
              <button
                type="button"
                onClick={copyCitationToClipboard}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-teal-950 active:scale-95"
              >
                {copiedCitation ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                <span>{copiedCitation ? 'Copied to Clipboard!' : 'Copy Citation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
