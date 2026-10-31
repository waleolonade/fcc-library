import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Database, Search, Plus, Edit2, Trash2, ExternalLink,
  Zap, CheckCircle2, XCircle, AlertTriangle, Copy, Check, Settings,
  Key, Sliders, RefreshCw, BookOpen, Layers, Shield, Filter,
  Code2, Play, Sparkles, Server, CheckCheck
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';

export default function ApiConfigurationManager({
  apis = [],
  setApis,
  onIngestBook,
  soundEnabled = true,
  sounds
}) {
  // Navigation within the API Hub: 'all' | 'simplelib' | 'sandbox'
  const [activeSubTab, setActiveSubTab] = useState('all');

  // Search & Filters
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Live Diagnostics State
  const [testResults, setTestResults] = useState({});
  const [testingMap, setTestingMap] = useState({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Configuration Modal State (Edit existing or Add new)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'create'
  const [showApiKeySecret, setShowApiKeySecret] = useState(false);
  const [configForm, setConfigForm] = useState({
    id: '',
    name: '',
    provider: '',
    category: 'Academic Books & Monograph Discovery',
    endpoint_template: '',
    auth_type: 'Free Open Access',
    api_key: '',
    headers: '',
    status: 'Active',
    description: '',
    docs_url: '',
    is_preset: false
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // SimpleLib Interactive State
  const [simpleLibStats, setSimpleLibStats] = useState(null);
  const [simpleLibBooks, setSimpleLibBooks] = useState([]);
  const [isLoadingSimpleLib, setIsLoadingSimpleLib] = useState(false);
  const [simpleLibFilter, setSimpleLibFilter] = useState('');
  const [simpleLibSelectedGenre, setSimpleLibSelectedGenre] = useState('ALL');
  const [isSeedingSimpleLib, setIsSeedingSimpleLib] = useState(false);
  const [newSimpleBookModal, setNewSimpleBookModal] = useState(false);
  const [newSimpleBookForm, setNewSimpleBookForm] = useState({
    title: '',
    author: '',
    genre: 'Historical Fiction',
    rating: 5,
    cover_url: ''
  });

  // Federated Search Sandbox State
  const [sandboxQuery, setSandboxQuery] = useState('cooperative economics');
  const [sandboxTargetApi, setSandboxTargetApi] = useState('all');
  const [sandboxResults, setSandboxResults] = useState([]);
  const [isSearchingSandbox, setIsSearchingSandbox] = useState(false);

  // Gora Network Off-Chain Computation API State (#introduction & #gora-off-chain-computation-api-1)
  const [goraStatus, setGoraStatus] = useState(null);
  const [goraTaskType, setGoraTaskType] = useState('journal_issn_doi_verification');
  const [goraQuery, setGoraQuery] = useState('cooperative economics');
  const [goraDoi, setGoraDoi] = useState('10.1016/j.jcom.2025.100412');
  const [goraIssn, setGoraIssn] = useState('2213-297X');
  const [goraComputeResult, setGoraComputeResult] = useState(null);
  const [isRunningGora, setIsRunningGora] = useState(false);
  const [goraVerifyForm, setGoraVerifyForm] = useState({
    title: 'Journal of Co-operative Economics & Digital Finance',
    author: 'Dr. A. O. Adebayo',
    identifier: 'ISSN 2213-297X',
    department: 'Co-operative Economics & Management'
  });
  const [goraVerifyResult, setGoraVerifyResult] = useState(null);
  const [isVerifyingGora, setIsVerifyingGora] = useState(false);

  // InneAI Scholarly Intelligence API State
  const [inneAiStatus, setInneAiStatus] = useState(null);
  const [inneAiModel, setInneAiModel] = useState('inneai-scholar-pro-v2');
  const [inneAiPrompt, setInneAiPrompt] = useState('Synthesize recent research on agricultural co-operatives and digital microfinance in West Africa with APA 7th citations.');
  const [inneAiChatResult, setInneAiChatResult] = useState(null);
  const [isRunningInneAi, setIsRunningInneAi] = useState(false);
  const [inneAiAnalyzeForm, setInneAiAnalyzeForm] = useState({
    title: 'Empirical Impact of Digital Credit Unions on Rural Agribusiness',
    author: 'Prof. K. Balogun & Dr. S. Adeyemi',
    abstract: 'This paper evaluates decentralized oracle credit scoring and cooperative lending models across 450 rural cooperative societies in Oyo State.'
  });
  const [inneAiAnalyzeResult, setInneAiAnalyzeResult] = useState(null);
  const [isAnalyzingInneAi, setIsAnalyzingInneAi] = useState(false);

  // Ensure Gora Off-Chain Computation API & InneAI API are always present in the list
  const effectiveApis = useMemo(() => {
    const list = Array.isArray(apis) ? [...apis] : [];
    const hasGora = list.some(a => a.id === 'API-GORA-OFFCHAIN' || (a.name || '').toLowerCase().includes('gora'));
    if (!hasGora) {
      list.unshift({
        id: 'API-GORA-OFFCHAIN',
        name: 'Gora Off-Chain Computation API',
        provider: 'Gora Network (Decentralized Oracle & WASM Engine)',
        category: 'Off-Chain Computation & Oracle Attestation',
        endpoint_template: '/api/gora/compute?query={query}',
        auth_type: 'Free Open Access',
        api_key: '',
        description: 'Gora Network Off-Chain Computation API (gora-off-chain-computation-api-1). Executes WebAssembly (WASM) off-chain tasks, cryptographic academic watermark verification, citation impact consensus, and multi-node oracle feeds.',
        docs_url: 'https://goranetwork.github.io/doc/#gora-off-chain-computation-api-1',
        status: 'Active',
        is_preset: true
      });
    }
    const hasInneAi = list.some(a => a.id === 'API-INNEAI' || (a.name || '').toLowerCase().includes('inneai'));
    if (!hasInneAi) {
      list.unshift({
        id: 'API-INNEAI',
        name: 'InneAI Scholarly Intelligence API',
        provider: 'InneAI (Multi-Model Academic Research & Synthesis)',
        category: 'AI Scholarly Synthesis & Semantic Discovery',
        endpoint_template: '/api/inneai/search?query={query}',
        auth_type: 'Bearer Token',
        api_key: '',
        description: 'InneAI Multi-Model Scholarly API for academic journal synthesis, literature review generation, manuscript deep analysis, APA 7th citation engine, and semantic catalog discovery.',
        docs_url: 'https://app.innerai.com',
        status: 'Active',
        is_preset: true
      });
    }
    return list;
  }, [apis]);

  // Execute Gora Off-Chain Computation
  const handleRunGoraComputation = async (e) => {
    if (e) e.preventDefault();
    setIsRunningGora(true);
    if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();
    try {
      const res = await libraryApi.gora.compute({
        task_type: goraTaskType,
        query: goraQuery,
        doi: goraDoi,
        issn: goraIssn
      });
      if (res) {
        setGoraComputeResult(res);
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (err) {
      console.error('Gora computation error:', err);
    } finally {
      setIsRunningGora(false);
    }
  };

  // Execute Gora Document Watermark Verification
  const handleRunGoraVerify = async (e) => {
    if (e) e.preventDefault();
    setIsVerifyingGora(true);
    try {
      const res = await libraryApi.gora.verifyDocument(goraVerifyForm);
      if (res) {
        setGoraVerifyResult(res);
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (err) {
      console.error('Gora verify error:', err);
    } finally {
      setIsVerifyingGora(false);
    }
  };

  // Execute InneAI Scholarly Synthesis
  const handleRunInneAiChat = async (e) => {
    if (e) e.preventDefault();
    setIsRunningInneAi(true);
    if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();
    try {
      const res = await libraryApi.inneai.chat({
        prompt: inneAiPrompt,
        model: inneAiModel
      });
      if (res) {
        setInneAiChatResult(res);
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (err) {
      console.error('InneAI chat error:', err);
    } finally {
      setIsRunningInneAi(false);
    }
  };

  // Execute InneAI Manuscript Analysis
  const handleRunInneAiAnalyze = async (e) => {
    if (e) e.preventDefault();
    setIsAnalyzingInneAi(true);
    try {
      const res = await libraryApi.inneai.analyze(inneAiAnalyzeForm);
      if (res) {
        setInneAiAnalyzeResult(res);
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (err) {
      console.error('InneAI analyze error:', err);
    } finally {
      setIsAnalyzingInneAi(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'gora') {
      libraryApi.gora.getStatus().then(s => { if (s) setGoraStatus(s); }).catch(() => {});
      if (!goraComputeResult) handleRunGoraComputation();
    } else if (activeSubTab === 'inneai') {
      libraryApi.inneai.getStatus().then(s => { if (s) setInneAiStatus(s); }).catch(() => {});
      if (!inneAiChatResult) handleRunInneAiChat();
    }
  }, [activeSubTab]);

  // Fetch initial APIs if not passed
  useEffect(() => {
    if ((!apis || apis.length === 0) && setApis) {
      fetch('/api/library-apis')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data)) setApis(data);
        })
        .catch(console.error);
    }
  }, []);

  // Fetch SimpleLib data on mount or when tab changes
  const fetchSimpleLibData = async () => {
    setIsLoadingSimpleLib(true);
    try {
      const [stats, books] = await Promise.all([
        libraryApi.simpleLib.getStats().catch(() => null),
        libraryApi.simpleLib.getBooks().catch(() => [])
      ]);
      if (stats) setSimpleLibStats(stats);
      if (Array.isArray(books)) setSimpleLibBooks(books);
    } catch (e) {
      console.error('Failed to load SimpleLib data:', e);
    } finally {
      setIsLoadingSimpleLib(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'simplelib') {
      fetchSimpleLibData();
    }
  }, [activeSubTab]);

  // Categories list
  const availableCategories = useMemo(() => {
    const set = new Set();
    effectiveApis.forEach(a => { if (a.category) set.add(a.category); });
    return Array.from(set);
  }, [effectiveApis]);

  // Filtered APIs
  const filteredApis = useMemo(() => {
    return effectiveApis.filter(api => {
      const matchQuery = !filterQuery.trim() ||
        api.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        api.provider?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        api.endpoint_template?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        api.description?.toLowerCase().includes(filterQuery.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || api.category === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [effectiveApis, filterQuery, categoryFilter]);

  // Copy to clipboard helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();
  };

  // Test individual API
  const handleTestApi = async (apiId) => {
    setTestingMap(prev => ({ ...prev, [apiId]: true }));
    try {
      const res = await fetch(`/api/library-apis/${apiId}/test`);
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [apiId]: data }));
      if (soundEnabled) {
        if (data.status === 'Online' && sounds?.playSuccessChime) sounds.playSuccessChime();
        else if (sounds?.playErrorBuzz) sounds.playErrorBuzz();
      }
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [apiId]: { status: 'Network Error', error: e.message }
      }));
      if (soundEnabled && sounds?.playErrorBuzz) sounds.playErrorBuzz();
    } finally {
      setTestingMap(prev => ({ ...prev, [apiId]: false }));
    }
  };

  // Test all APIs concurrently
  const handleTestAllApis = async () => {
    setIsTestingAll(true);
    if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();

    const activeList = apis.filter(a => a.status === 'Active');
    const promises = activeList.map(async (api) => {
      setTestingMap(prev => ({ ...prev, [api.id]: true }));
      try {
        const res = await fetch(`/api/library-apis/${api.id}/test`);
        const data = await res.json();
        setTestResults(prev => ({ ...prev, [api.id]: data }));
      } catch (e) {
        setTestResults(prev => ({ ...prev, [api.id]: { status: 'Network Error', error: e.message } }));
      } finally {
        setTestingMap(prev => ({ ...prev, [api.id]: false }));
      }
    });

    await Promise.all(promises);
    setIsTestingAll(false);
    if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
  };

  // Quick toggle Active/Inactive status
  const handleToggleApiStatus = async (api) => {
    const nextStatus = api.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/library-apis/${api.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        if (setApis) {
          setApis(prev => prev.map(a => a.id === api.id ? { ...a, status: nextStatus } : a));
        }
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  // Open Edit Modal
  const openEditModal = (api) => {
    setModalMode('edit');
    setConfigForm({
      id: api.id,
      name: api.name || '',
      provider: api.provider || '',
      category: api.category || 'Academic & Books',
      endpoint_template: api.endpoint_template || '',
      auth_type: api.auth_type || 'Free Open Access',
      api_key: api.api_key || '',
      headers: api.headers || '',
      status: api.status || 'Active',
      description: api.description || '',
      docs_url: api.docs_url || '',
      is_preset: !!api.is_preset
    });
    setShowApiKeySecret(false);
    setShowConfigModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setConfigForm({
      id: '',
      name: '',
      provider: '',
      category: 'Academic Books & Monograph Discovery',
      endpoint_template: '',
      auth_type: 'Free Open Access',
      api_key: '',
      headers: '',
      status: 'Active',
      description: '',
      docs_url: '',
      is_preset: false
    });
    setShowApiKeySecret(false);
    setShowConfigModal(true);
  };

  // Save Configuration (Create or Update)
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configForm.name.trim() || !configForm.endpoint_template.trim()) {
      alert('API Name and Endpoint URL Template are required.');
      return;
    }

    setIsSavingConfig(true);
    try {
      if (modalMode === 'edit') {
        const res = await fetch(`/api/library-apis/${configForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configForm)
        });
        if (res.ok) {
          const data = await res.json();
          if (setApis) {
            setApis(prev => prev.map(a => a.id === configForm.id ? { ...a, ...configForm } : a));
          }
          setShowConfigModal(false);
          if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
          alert(`Configuration for "${configForm.name}" updated successfully.`);
        } else {
          alert('Failed to save configuration update.');
        }
      } else {
        const res = await fetch('/api/library-apis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configForm)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.api && setApis) {
            setApis(prev => [data.api, ...prev]);
          }
          setShowConfigModal(false);
          if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
          alert(`New Library API "${configForm.name}" successfully integrated!`);
        } else {
          alert('Failed to register new API.');
        }
      }
    } catch (e) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Delete Custom API
  const handleDeleteApi = async (apiId, name) => {
    if (!window.confirm(`Are you sure you want to permanently remove the API integration for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/library-apis/${apiId}`, { method: 'DELETE' });
      if (res.ok) {
        if (setApis) setApis(prev => prev.filter(a => a.id !== apiId));
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (e) {
      console.error('Delete API error:', e);
    }
  };

  // Reseed SimpleLib Database
  const handleReseedSimpleLib = async () => {
    setIsSeedingSimpleLib(true);
    try {
      const res = await libraryApi.simpleLib.seed();
      if (res?.success) {
        await fetchSimpleLibData();
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
        alert('SimpleLib database successfully reseeded from booksjson.js dataset!');
      }
    } catch (e) {
      alert(`Reseed failed: ${e.message}`);
    } finally {
      setIsSeedingSimpleLib(false);
    }
  };

  // Add new book to SimpleLib
  const handleCreateSimpleBook = async (e) => {
    e.preventDefault();
    if (!newSimpleBookForm.title.trim()) {
      alert('Book title is required.');
      return;
    }
    try {
      const res = await libraryApi.simpleLib.createBook(newSimpleBookForm);
      if (res?.id || res?._id) {
        await fetchSimpleLibData();
        setNewSimpleBookModal(false);
        setNewSimpleBookForm({
          title: '',
          author: '',
          genre: 'Historical Fiction',
          rating: 5,
          cover_url: ''
        });
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
        alert(`Book "${newSimpleBookForm.title}" added to SimpleLib repository!`);
      }
    } catch (e) {
      alert(`Failed to add book: ${e.message}`);
    }
  };

  // Quick star rating patch for SimpleLib book
  const handlePatchRating = async (bookId, newRating) => {
    try {
      const updated = await libraryApi.simpleLib.patchBook(bookId, { rating: newRating });
      if (updated) {
        setSimpleLibBooks(prev => prev.map(b => (b.id === bookId || b._id === String(bookId)) ? { ...b, rating: newRating } : b));
        if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();
      }
    } catch (e) {
      console.error('Rating update failed:', e);
    }
  };

  // Federated search
  const handlePerformSandboxSearch = async (e) => {
    if (e) e.preventDefault();
    if (!sandboxQuery.trim()) return;
    setIsSearchingSandbox(true);
    if (soundEnabled && sounds?.playScannerBeep) sounds.playScannerBeep();
    try {
      const q = encodeURIComponent(sandboxQuery.trim());
      const res = await fetch(`/api/library-apis/search?query=${q}&api_id=${sandboxTargetApi}`);
      if (res.ok) {
        const data = await res.json();
        setSandboxResults(data || []);
        if (soundEnabled && sounds?.playSuccessChime) sounds.playSuccessChime();
      }
    } catch (e) {
      console.error('Sandbox search error:', e);
    } finally {
      setIsSearchingSandbox(false);
    }
  };

  // Stats calculation
  const onlineCount = Object.values(testResults).filter(r => r.status === 'Online').length;
  const testedCount = Object.keys(testResults).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#021810] border border-emerald-800/60 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>API Configuration & Integration Hub</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Configure endpoints, API tokens, headers, rate limits, and health pings for all world & internal library APIs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTestAllApis}
              disabled={isTestingAll}
              id="test-all-apis-btn"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition shadow-md"
            >
              <Zap size={14} className={isTestingAll ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
              <span>{isTestingAll ? 'Pinging All APIs...' : 'Batch Health Ping'}</span>
            </button>

            <button
              onClick={openCreateModal}
              id="add-custom-api-btn"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition hover:scale-105 active:scale-95"
            >
              <Plus size={15} />
              <span>Add External Library API</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-5 mt-4 border-t border-slate-800/80">
          {[
            { id: 'all', label: `Configured APIs (${effectiveApis.length})`, icon: Sliders },
            { id: 'gora', label: 'Gora Off-Chain Computation API', icon: Server, badge: 'WASM Oracle' },
            { id: 'inneai', label: 'InneAI Scholarly API', icon: Sparkles, badge: 'AI Synthesis' },
            { id: 'simplelib', label: 'SimpleLib API (BassemGhoniem)', icon: BookOpen },
            { id: 'sandbox', label: 'Federated Search Sandbox', icon: Search }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ALL CONFIGURED APIS GRID & CONTROLS
      ========================================================================= */}
      {activeSubTab === 'all' && (
        <div className="space-y-4">
          {/* Quick Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter APIs by name, provider, endpoint URL, or description..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="ALL">All Categories ({availableCategories.length})</option>
                  {availableCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Health summary badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active: {apis.filter(a => a.status === 'Active').length}</span>
              </span>
              {testedCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300">
                  <CheckCheck size={13} className="text-emerald-400" />
                  <span>Tested: {onlineCount}/{testedCount} Online</span>
                </span>
              )}
            </div>
          </div>

          {/* APIs Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredApis.map(api => {
              const test = testResults[api.id];
              const isTesting = testingMap[api.id];
              const isActive = api.status === 'Active';

              return (
                <div
                  key={api.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-900 opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header Row: Name + Preset Badge + Status Toggle */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <h3 className="font-bold text-sm text-white truncate" title={api.name}>{api.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 ml-4">{api.provider}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          api.is_preset
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {api.is_preset ? 'Preset' : 'Custom'}
                        </span>
                      </div>
                    </div>

                    {/* Category & Auth Type */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {api.category || 'Academic & Holdings'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 flex items-center gap-1">
                        <Shield size={10} />
                        <span>{api.auth_type || 'Free Open Access'}</span>
                      </span>
                    </div>

                    {/* Endpoint Template Container with Copy */}
                    <div className="relative group">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 break-all select-all pr-8 leading-relaxed">
                        {api.endpoint_template}
                      </div>
                      <button
                        onClick={() => copyToClipboard(api.endpoint_template, api.id)}
                        className="absolute right-2 top-2 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        title="Copy endpoint template URL"
                      >
                        {copiedId === api.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Description */}
                    {api.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {api.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Operational Controls */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    {/* Live Test Diagnostic Output */}
                    {test && (
                      <div className={`p-2.5 rounded-xl text-[10px] font-mono flex items-center justify-between border ${
                        test.status === 'Online'
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                          : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {test.status === 'Online' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-rose-400" />}
                          <span>{test.status} ({test.latencyMs || 0}ms)</span>
                        </div>
                        {test.itemsDiscovered !== undefined && (
                          <span className="text-[10px] text-slate-400 font-bold">{test.itemsDiscovered} items</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Ping Test & Configure button */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTestApi(api.id)}
                          disabled={isTesting}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Run live ping diagnostic test"
                        >
                          <Zap size={13} className={isTesting ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                          <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                        </button>

                        <button
                          onClick={() => openEditModal(api)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
                          title="Configure API endpoints, headers, and credentials"
                        >
                          <Edit2 size={12} />
                          <span>Configure</span>
                        </button>
                      </div>

                      {/* Right: Status toggle & Extra tools */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleApiStatus(api)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                          }`}
                          title={`Toggle status: Currently ${api.status}`}
                        >
                          {isActive ? 'ENABLED' : 'DISABLED'}
                        </button>

                        {api.docs_url && (
                          <a
                            href={api.docs_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Open Official Documentation"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}

                        {!api.is_preset && (
                          <button
                            onClick={() => handleDeleteApi(api.id, api.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Delete Custom External API"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BASSEMGHONIEM SIMPLELIB API CONSOLE & BOOK EXPLORER
      ========================================================================= */}
      {activeSubTab === 'simplelib' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SimpleLib Identity & Metrics Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-[#021810] border border-indigo-700/50 p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-inner">
                  <BookOpen size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-tight">SimpleLib REST API</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      BassemGhoniem Spec
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HATEOAS Hypermedia
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Integrated library management REST service with hypermedia routing, star ratings (1-5), and genre discovery
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReseedSimpleLib}
                  disabled={isSeedingSimpleLib}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center gap-2 transition"
                >
                  <RefreshCw size={14} className={isSeedingSimpleLib ? 'animate-spin' : ''} />
                  <span>Reseed from booksjson.js</span>
                </button>

                <button
                  onClick={() => setNewSimpleBookModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition"
                >
                  <Plus size={15} />
                  <span>Add SimpleLib Book</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            {simpleLibStats?.metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-indigo-900/40">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Books</div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">{simpleLibStats.metrics.total_books}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authors Registered</div>
                  <div className="text-xl font-black text-indigo-300 font-mono mt-0.5">{simpleLibStats.metrics.total_authors}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{simpleLibStats.metrics.average_rating} ★</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Endpoints</div>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">19 Routes</div>
                </div>
              </div>
            )}
          </div>

          {/* Books Explorer & Filters */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={simpleLibFilter}
                    onChange={e => setSimpleLibFilter(e.target.value)}
                    placeholder="Search SimpleLib collection by title or author..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={simpleLibSelectedGenre}
                  onChange={e => setSimpleLibSelectedGenre(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="ALL">All Genres</option>
                  <option value="Historical Fiction">Historical Fiction</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="History">History</option>
                  <option value="Biography">Biography</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/simplelib/books"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <Code2 size={13} />
                  <span>View Raw JSON (/api/simplelib/books)</span>
                </a>
              </div>
            </div>

            {/* Books List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {simpleLibBooks
                .filter(b => {
                  const matchQ = !simpleLibFilter.trim() ||
                    b.title?.toLowerCase().includes(simpleLibFilter.toLowerCase()) ||
                    b.author?.toLowerCase().includes(simpleLibFilter.toLowerCase());
                  const matchG = simpleLibSelectedGenre === 'ALL' || b.genre === simpleLibSelectedGenre;
                  return matchQ && matchG;
                })
                .map(book => {
                  const currentRating = Math.round(book.rating || 1);
                  return (
                    <div
                      key={book.id || book._id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt="Cover" className="w-12 h-16 object-cover rounded shadow border border-slate-800 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-[10px] flex-shrink-0">
                              SL-BK
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-white line-clamp-2 leading-tight">{book.title}</h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{book.author}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                              {book.genre}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Rating Stars (BassemGhoniem PATCH rating support) */}
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">Rating:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => handlePatchRating(book.id || book._id, star)}
                                className={`text-xs transition ${star <= currentRating ? 'text-amber-400 hover:scale-125' : 'text-slate-600 hover:text-slate-400'}`}
                                title={`Set rating to ${star} stars (PATCH /api/simplelib/books/${book.id || book._id})`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="text-[10px] font-mono text-amber-300 ml-1 font-bold">{book.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* HATEOAS Hypermedia links summary */}
                      <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">ID: {book.id || book._id}</span>
                        {book.links?.self && (
                          <a
                            href={book.links.self}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            title="Direct HATEOAS Hypermedia Link"
                          >
                            <span>HATEOAS Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FEDERATED SEARCH SANDBOX
      ========================================================================= */}
      {activeSubTab === 'sandbox' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search size={16} className="text-emerald-400" />
                <span>Live Federated API Discovery Sandbox</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute cross-network search queries targeting individual APIs or the entire federated network simultaneously
              </p>
            </div>

            <form onSubmit={handlePerformSandboxSearch} className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={sandboxQuery}
                  onChange={e => setSandboxQuery(e.target.value)}
                  placeholder="Query term (e.g. cooperative governance, agricultural biology, Tolstoy)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={sandboxTargetApi}
                onChange={e => setSandboxTargetApi(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">🌍 All Configured World APIs</option>
                {apis.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSearchingSandbox}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap shadow-md shadow-emerald-950 transition flex items-center gap-1.5"
              >
                <Globe size={14} className={isSearchingSandbox ? 'animate-spin' : ''} />
                <span>{isSearchingSandbox ? 'Harvesting...' : 'Execute Federated Query'}</span>
              </button>
            </form>

            {/* Results Grid */}
            {sandboxResults.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Discovered <strong className="text-emerald-400 font-mono">{sandboxResults.length}</strong> records across active providers:</span>
                  <button onClick={() => setSandboxResults([])} className="text-slate-500 hover:text-slate-300">Clear Results</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {sandboxResults.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} alt="Cover" className="w-12 h-16 object-cover rounded shadow border border-slate-700 shrink-0" />
                          ) : (
                            <div className="w-12 h-16 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0 font-mono text-[10px]">
                              VOL
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-white line-clamp-2 leading-tight">{item.title}</h5>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.author}</p>
                            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">{item.year} • {item.format || 'Monograph'}</span>
                          </div>
                        </div>
                        {item.abstract && (
                          <p className="text-[10px] text-slate-400 line-clamp-2">{item.abstract}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-900 text-slate-300 truncate max-w-[130px]">
                          {item.sourceApi}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                              title="External Resource Link"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {onIngestBook && (
                            <button
                              onClick={() => onIngestBook(item)}
                              className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1 transition"
                            >
                              <Plus size={11} />
                              <span>Ingest</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: GORA NETWORK OFF-CHAIN COMPUTATION API (gora-off-chain-computation-api-1)
      ========================================================================= */}
      {activeSubTab === 'gora' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Gora Banner & Documentation Links */}
          <div className="p-6 rounded-2xl bg-[#0a1428] border-2 border-cyan-600/60 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-900 border border-cyan-500 text-cyan-200 text-[10px] font-mono font-bold">
                    gora-off-chain-computation-api-1
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-500 text-emerald-200 text-[10px] font-mono font-bold">
                    WASM Decentralized Oracle • 5/5 Validators Online
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Gora Network Off-Chain Computation API & Cryptographic Attestation Engine
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Executes heavy off-chain WebAssembly (WASM) computational tasks, multi-source bibliographic oracle consensus (Crossref/OpenAlex/ISSN), and SHA-256 digital watermark attestation for FCC academic journals and theses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://goranetwork.github.io/doc/#introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <span>Gora Docs: #introduction</span>
                  <ExternalLink size={12} />
                </a>
                <a
                  href="https://goranetwork.github.io/doc/#gora-off-chain-computation-api-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                >
                  <span>#gora-off-chain-computation-api-1</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {goraStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Runtime Engine</div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5 truncate">{goraStatus.runtime?.engine || 'Gora WASM Sandbox v1.4'}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Consensus Quorum</div>
                  <div className="text-xs font-bold text-emerald-300 mt-0.5">{goraStatus.runtime?.min_confirmations || 5}/{goraStatus.runtime?.quorum_validators || 7} Validator Nodes</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Attested Holdings</div>
                  <div className="text-xs font-bold text-white mt-0.5">{goraStatus.institutional_metrics?.attested_catalog_holdings ?? 0} Books & Journals</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Endpoint Route</div>
                  <div className="text-xs font-mono text-amber-300 mt-0.5">POST /api/gora/compute</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Off-Chain Computation Task Runner */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Code2 size={16} className="text-cyan-400" />
                    <span>1. Off-Chain WASM Computation Executor</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Dispatch an off-chain computation job to Gora validator nodes</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono">
                  /api/gora/compute
                </span>
              </div>

              <form onSubmit={handleRunGoraComputation} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Off-Chain Computation Task Type</label>
                  <select
                    value={goraTaskType}
                    onChange={e => setGoraTaskType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="journal_issn_doi_verification">Multi-Source Journal ISSN & DOI Oracle Verification</option>
                    <option value="citation_impact_wasm">Bibliometric & Citation Impact WASM Computation</option>
                    <option value="document_watermark_attestation">Academic Journal Digital Watermark Cryptographic Proof</option>
                    <option value="custom_wasm_script">Arbitrary Off-Chain WASM Computation (gora-off-chain-computation-api-1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Research Topic / Query Parameter</label>
                  <input
                    type="text"
                    value={goraQuery}
                    onChange={e => setGoraQuery(e.target.value)}
                    placeholder="e.g. cooperative economics, artificial intelligence, agronomy"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target DOI (Optional)</label>
                    <input
                      type="text"
                      value={goraDoi}
                      onChange={e => setGoraDoi(e.target.value)}
                      placeholder="10.1016/j.jcom..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target ISSN (Optional)</label>
                    <input
                      type="text"
                      value={goraIssn}
                      onChange={e => setGoraIssn(e.target.value)}
                      placeholder="2213-297X"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRunningGora}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Play size={14} />
                  <span>{isRunningGora ? 'Executing WASM Off-Chain Consensus...' : 'Execute Gora Off-Chain Computation'}</span>
                </button>
              </form>

              {goraComputeResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300">{goraComputeResult.request_id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px] font-mono font-bold">
                      {goraComputeResult.execution_metrics?.consensus_quorum || '5/5 Validators Agreed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#0f172a] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Computed Impact Score</span>
                      <strong className="text-emerald-300 font-mono">{goraComputeResult.computation_result?.computed_impact_index}</strong>
                    </div>
                    <div className="p-2 rounded bg-[#0f172a] border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">WASM Execution Cycles</span>
                      <strong className="text-amber-300 font-mono">{goraComputeResult.execution_metrics?.wasm_cycles_used} cycles ({goraComputeResult.execution_metrics?.latency_ms}ms)</strong>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-[#0f172a] border border-slate-800 font-mono text-[10px] text-slate-300 break-all">
                    <span className="text-slate-400 block">Cryptographic State Root Hash:</span>
                    <span className="text-cyan-300">{goraComputeResult.cryptographic_proof?.state_root_hash}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Digital Watermark & Document Attestation Verifier */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Shield size={16} className="text-emerald-400" />
                    <span>2. Gora Academic Watermark & Hash Attestation</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Certify Academic Journal / Thesis SHA-256 watermark proof off-chain</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono">
                  /api/gora/verify
                </span>
              </div>

              <form onSubmit={handleRunGoraVerify} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Journal / Manuscript Title</label>
                  <input
                    type="text"
                    value={goraVerifyForm.title}
                    onChange={e => setGoraVerifyForm({ ...goraVerifyForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Lead Author / Researcher</label>
                    <input
                      type="text"
                      value={goraVerifyForm.author}
                      onChange={e => setGoraVerifyForm({ ...goraVerifyForm, author: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">ISSN / DOI Identifier</label>
                    <input
                      type="text"
                      value={goraVerifyForm.identifier}
                      onChange={e => setGoraVerifyForm({ ...goraVerifyForm, identifier: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isVerifyingGora}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CheckCheck size={14} />
                  <span>{isVerifyingGora ? 'Attesting on Gora Nodes...' : 'Verify & Certify Watermark Proof'}</span>
                </button>
              </form>

              {goraVerifyResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">{goraVerifyResult.attestation_id}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900 text-white text-[10px] font-mono">
                      {goraVerifyResult.off_chain_attestation?.oracle_consensus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <strong>Seal:</strong> {goraVerifyResult.document?.watermark_seal}
                  </div>
                  <div className="p-2 rounded bg-[#0f172a] border border-slate-800 font-mono text-[10px] text-emerald-300 break-all">
                    SHA-256: {goraVerifyResult.off_chain_attestation?.document_sha256}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: INNEAI SCHOLARLY INTELLIGENCE API
      ========================================================================= */}
      {activeSubTab === 'inneai' && (
        <div className="space-y-6 animate-fadeIn">
          {/* InneAI Banner */}
          <div className="p-6 rounded-2xl bg-[#13112c] border-2 border-indigo-500/60 shadow-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-900 border border-indigo-400 text-indigo-200 text-[10px] font-mono font-bold">
                    API-INNEAI • Multi-Model Academic Engine
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 border border-emerald-500 text-emerald-200 text-[10px] font-mono font-bold">
                    Grounded in FCC Catalog & OpenAlex
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  InneAI Scholarly Intelligence, Literature Review & Manuscript Analyzer API
                </h3>
                <p className="text-xs text-slate-300">
                  Provides multi-model scholarly synthesis (`inneai-scholar-pro-v2`), automated APA 7th citation generation, and deep manuscript evaluation across all FCC departments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const found = effectiveApis.find(a => a.id === 'API-INNEAI');
                  if (found) openEditModal(found);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Key size={13} />
                <span>Configure InneAI API Key</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: InneAI Scholarly Synthesis & Citation Engine */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-400" />
                    <span>1. InneAI Research Synthesis & Citation Studio</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Generate grounded literature reviews and APA 7th citations</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 text-[10px] font-mono">
                  POST /api/inneai/chat
                </span>
              </div>

              <form onSubmit={handleRunInneAiChat} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">InneAI Model</label>
                  <select
                    value={inneAiModel}
                    onChange={e => setInneAiModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="inneai-scholar-pro-v2">inneai-scholar-pro-v2 (Academic Synthesis & Citations)</option>
                    <option value="inneai-research-analyzer">inneai-research-analyzer (Methodology & Rigor)</option>
                    <option value="inneai-semantic-discovery">inneai-semantic-discovery (Cross-Catalog Discovery)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Scholarly Prompt / Research Question</label>
                  <textarea
                    rows={3}
                    value={inneAiPrompt}
                    onChange={e => setInneAiPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRunningInneAi}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{isRunningInneAi ? 'Synthesizing with InneAI...' : 'Run InneAI Scholarly Synthesis'}</span>
                </button>
              </form>

              {inneAiChatResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-800/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 font-mono">
                    <span>Model: {inneAiChatResult.model}</span>
                    <span>Latency: {inneAiChatResult.latency_ms}ms</span>
                  </div>
                  <div className="text-slate-200 whitespace-pre-line leading-relaxed text-[11.5px] max-h-56 overflow-y-auto pr-1">
                    {inneAiChatResult.reply}
                  </div>
                </div>
              )}
            </div>

            {/* Right: InneAI Deep Manuscript Analyzer */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-400" />
                    <span>2. InneAI Deep Manuscript & Journal Analyzer</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Evaluate academic rigor, keywords, and APA citation format</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono">
                  POST /api/inneai/analyze
                </span>
              </div>

              <form onSubmit={handleRunInneAiAnalyze} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Journal / Book Title</label>
                  <input
                    type="text"
                    value={inneAiAnalyzeForm.title}
                    onChange={e => setInneAiAnalyzeForm({ ...inneAiAnalyzeForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Authors / Researchers</label>
                  <input
                    type="text"
                    value={inneAiAnalyzeForm.author}
                    onChange={e => setInneAiAnalyzeForm({ ...inneAiAnalyzeForm, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Abstract / Executive Summary</label>
                  <textarea
                    rows={2}
                    value={inneAiAnalyzeForm.abstract}
                    onChange={e => setInneAiAnalyzeForm({ ...inneAiAnalyzeForm, abstract: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzingInneAi}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Play size={14} />
                  <span>{isAnalyzingInneAi ? 'Analyzing Manuscript...' : 'Analyze Manuscript with InneAI'}</span>
                </button>
              </form>

              {inneAiAnalyzeResult?.analysis && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">Rigor Score: {inneAiAnalyzeResult.analysis.readability_and_rigor_score}</span>
                    <span className="text-[10px] font-mono text-amber-300">{inneAiAnalyzeResult.analysis.recommended_academic_level}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{inneAiAnalyzeResult.analysis.executive_summary}</p>
                  <div className="p-2 rounded bg-[#0f172a] border border-slate-800 text-[10px] font-mono text-indigo-300">
                    APA 7th: {inneAiAnalyzeResult.analysis.apa_7th_citation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FULL API CONFIGURATION EDITOR (EDIT / CREATE)
      ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'edit' ? `Configure API: ${configForm.name}` : 'Register New Library API'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fine-tune endpoint templates, authentication tokens, rate limits, and network status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">API Display Name *</label>
                  <input
                    type="text"
                    required
                    value={configForm.name}
                    onChange={e => setConfigForm({ ...configForm, name: e.target.value })}
                    placeholder="e.g. Open Library Monograph Service"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Provider / Host Authority</label>
                  <input
                    type="text"
                    value={configForm.provider}
                    onChange={e => setConfigForm({ ...configForm, provider: e.target.value })}
                    placeholder="e.g. Internet Archive (San Francisco, USA)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category Classification</label>
                  <input
                    type="text"
                    value={configForm.category}
                    onChange={e => setConfigForm({ ...configForm, category: e.target.value })}
                    placeholder="e.g. Academic Books & Hold Queue"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Status</label>
                  <select
                    value={configForm.status}
                    onChange={e => setConfigForm({ ...configForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Active">Active (Enabled in Searches)</option>
                    <option value="Inactive">Inactive (Disabled / Offline)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Endpoint URL Template * <span className="text-slate-500 font-normal">(use {`{query}`} and {`{isbn}`} placeholders)</span>
                </label>
                <input
                  type="text"
                  required
                  value={configForm.endpoint_template}
                  onChange={e => setConfigForm({ ...configForm, endpoint_template: e.target.value })}
                  placeholder="https://api.example.com/books?q={query}&limit=12"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Authentication Method</label>
                  <select
                    value={configForm.auth_type}
                    onChange={e => setConfigForm({ ...configForm, auth_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Free Open Access">Free Open Access (No Key Needed)</option>
                    <option value="Bearer Token">Bearer Token Header</option>
                    <option value="API Key Header">Custom API Key Header</option>
                    <option value="Basic Auth">HTTP Basic Auth</option>
                    <option value="Internal Free Open Access">Internal Direct Local Access</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">API Key / Access Token</label>
                    <button
                      type="button"
                      onClick={() => setShowApiKeySecret(!showApiKeySecret)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      {showApiKeySecret ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <input
                    type={showApiKeySecret ? 'text' : 'password'}
                    value={configForm.api_key}
                    onChange={e => setConfigForm({ ...configForm, api_key: e.target.value })}
                    placeholder="Optional API Secret Token"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Documentation URL</label>
                <input
                  type="url"
                  value={configForm.docs_url}
                  onChange={e => setConfigForm({ ...configForm, docs_url: e.target.value })}
                  placeholder="https://docs.provider.org/api"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Architecture Notes</label>
                <textarea
                  rows={2}
                  value={configForm.description}
                  onChange={e => setConfigForm({ ...configForm, description: e.target.value })}
                  placeholder="Brief summary of capabilities, format, and collections served..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {modalMode === 'edit' && configForm.id && (
                  <button
                    type="button"
                    onClick={() => handleTestApi(configForm.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Zap size={13} className="text-emerald-400" />
                    <span>Ping Live Endpoint</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
                  >
                    {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD SIMPLELIB BOOK MODAL
      ========================================================================= */}
      {newSimpleBookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-400" />
                <span>Add Book to SimpleLib Repository</span>
              </h3>
              <button onClick={() => setNewSimpleBookModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSimpleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newSimpleBookForm.title}
                  onChange={e => setNewSimpleBookForm({ ...newSimpleBookForm, title: e.target.value })}
                  placeholder="e.g. Crime and Punishment"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                <input
                  type="text"
                  value={newSimpleBookForm.author}
                  onChange={e => setNewSimpleBookForm({ ...newSimpleBookForm, author: e.target.value })}
                  placeholder="e.g. Fyodor Dostoevsky"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
                  <select
                    value={newSimpleBookForm.genre}
                    onChange={e => setNewSimpleBookForm({ ...newSimpleBookForm, genre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Historical Fiction">Historical Fiction</option>
                    <option value="Science Fiction">Science Fiction</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="History">History</option>
                    <option value="Biography">Biography</option>
                    <option value="Classic Literature">Classic Literature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rating (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={newSimpleBookForm.rating}
                    onChange={e => setNewSimpleBookForm({ ...newSimpleBookForm, rating: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL (optional)</label>
                <input
                  type="url"
                  value={newSimpleBookForm.cover_url}
                  onChange={e => setNewSimpleBookForm({ ...newSimpleBookForm, cover_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewSimpleBookModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save to SimpleLib
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
