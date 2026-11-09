import React, { useState, useEffect } from 'react';
import {
  Video, Headphones, Power, ShieldCheck, ToggleLeft, ToggleRight,
  Globe, Sparkles, RefreshCw, CheckCircle2, XCircle, Sliders,
  BookOpen, Layers, Users, Download, FileText, Check, AlertTriangle,
  Play, ExternalLink, Activity, Search, Filter, Lock, Unlock, Building2
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function DeveloperMediaGovernanceStudio({ passkey = null, showToast = null }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    multimedia_master_enabled: true,
    page_opac_multimedia: true,
    page_student_multimedia: true,
    page_hod_multimedia: true,
    page_staff_multimedia: true,
    page_admin_multimedia: true,
    feature_video_streaming: true,
    feature_audio_streaming: true,
    feature_dynamic_bandwidth_saver: true,
    feature_companion_handouts: true,
    feature_interactive_transcripts: true,
    feature_chapter_cues: true,
    feature_playback_resume: true,
    feature_offline_download: true,
    feature_apa_citations: true,
    upload_perm_student: false,
    upload_perm_hod: true,
    upload_perm_staff: true,
    upload_perm_admin: true,
    upload_perm_developer: true,
    upload_dept_cem: true,
    upload_dept_cs: true,
    upload_dept_bfn: true,
    upload_dept_agr: true,
    upload_dept_acc: true,
    upload_dept_pad: true,
    api_wikipedia_academic: true,
    api_google_scholar: true,
    api_openalex_papers: true,
    api_crossref_dois: true,
    live_broadcast_master_enabled: true,
    live_broadcast_social_simulcast: true,
    live_broadcast_student_access: true,
    live_broadcast_chat_enabled: true,
    live_broadcast_auto_archive: true,
    live_broadcast_dept_cem: true,
    live_broadcast_dept_cs: true,
    live_broadcast_dept_bfn: true,
    live_broadcast_dept_agr: true,
    live_broadcast_dept_acc: true,
    live_broadcast_dept_pad: true,
    api_internet_archive: true,
    api_wikimedia_commons: true,
    api_librivox: true,
    api_nasa_media: true,
    api_europeana_av: true,
    api_mit_ocw: true
  });

  const [telemetry, setTelemetry] = useState(null);
  const [worldApis, setWorldApis] = useState([]);
  const [testingApiId, setTestingApiId] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Live Test Search Sandbox
  const [sandboxQuery, setSandboxQuery] = useState('cooperative');
  const [sandboxSearching, setSandboxSearching] = useState(false);
  const [sandboxResults, setSandboxResults] = useState([]);

  // Fetch governance state & world APIs from backend
  const fetchGovernance = async () => {
    try {
      setLoading(true);
      const base = getApiBase();
      const [resGov, resApis] = await Promise.all([
        fetch(`${base}/media/governance`),
        fetch(`${base}/media/world-apis`)
      ]);

      if (resGov.ok) {
        const dataGov = await resGov.json();
        if (dataGov.config) setConfig(dataGov.config);
        if (dataGov.telemetry) setTelemetry(dataGov.telemetry);
      }
      if (resApis.ok) {
        const dataApis = await resApis.json();
        if (dataApis.apis) setWorldApis(dataApis.apis);
      }
    } catch (err) {
      console.warn('Error loading media governance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernance();
  }, []);

  // Save Config to Database & Broadcast Live Event
  const saveConfig = async (newConfig) => {
    setSaving(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/media/governance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: newConfig,
          actor: 'Developer Authority Studio'
        })
      });

      if (res.ok) {
        sounds.playSuccessChime();
        localStorage.setItem('fcc_media_governance', JSON.stringify(newConfig));
        window.dispatchEvent(new CustomEvent('fcc-media-config-updated', { detail: newConfig }));
        showToast?.('Media governance updated & broadcast live across all portals!', 'success');
      } else {
        sounds.playErrorBuzz();
        showToast?.('Failed to save governance settings.', 'error');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Connection error while saving governance.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle single feature
  const toggleFeature = (key) => {
    sounds.playClick();
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    saveConfig(updated);
  };

  // Bulk enable / disable group
  const bulkSetGroup = (keys, value) => {
    sounds.playClick();
    const updated = { ...config };
    keys.forEach(k => { updated[k] = value; });
    setConfig(updated);
    saveConfig(updated);
  };

  // Ping & Test World API
  const handleTestApi = async (api) => {
    sounds.playClick();
    setTestingApiId(api.id);
    const startTime = performance.now();
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/media/world-apis/search?q=${encodeURIComponent(api.sample_query)}&provider=${api.id}`);
      const latency = Math.round(performance.now() - startTime);
      if (res.ok) {
        const data = await res.json();
        setTestResults(prev => ({
          ...prev,
          [api.id]: {
            status: 'online',
            latency: `${latency}ms`,
            count: data.total || data.results?.length || 0,
            msg: `Connected! Retrieved ${data.results?.length || 0} items in ${latency}ms`
          }
        }));
        sounds.playSuccessChime();
      } else {
        setTestResults(prev => ({
          ...prev,
          [api.id]: { status: 'error', latency: `${latency}ms`, msg: 'HTTP Error response' }
        }));
        sounds.playErrorBuzz();
      }
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [api.id]: { status: 'error', latency: 'timeout', msg: err.message || 'Connection failed' }
      }));
      sounds.playErrorBuzz();
    } finally {
      setTestingApiId(null);
    }
  };

  // Run Sandbox Search
  const handleSandboxSearch = async (e) => {
    e?.preventDefault();
    if (!sandboxQuery.trim()) return;
    setSandboxSearching(true);
    sounds.playClick();
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/media/world-apis/search?q=${encodeURIComponent(sandboxQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSandboxResults(data.results || []);
        sounds.playSuccessChime();
      }
    } catch (err) {
      console.warn('Sandbox search failed:', err);
    } finally {
      setSandboxSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-cyan-300 font-mono space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto text-cyan-400" />
        <p className="text-xs">Initializing Developer Media Governance &amp; World APIs Matrix...</p>
      </div>
    );
  }

  const isMasterOn = config.multimedia_master_enabled;

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-slate-100">
      {/* 1. MASTER KILL-SWITCH & TELEMETRY HEADER */}
      <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden ${
        isMasterOn
          ? 'bg-gradient-to-r from-[#021810] via-[#042417] to-[#02130c] border-emerald-500/80 shadow-emerald-950/80'
          : 'bg-gradient-to-r from-[#1f0608] via-[#2c090c] to-[#150406] border-rose-500/80 shadow-rose-950/80'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono border shadow-md bg-black/60">
              <Power size={13} className={isMasterOn ? 'text-emerald-400 animate-pulse' : 'text-rose-400'} />
              <span className={isMasterOn ? 'text-emerald-300' : 'text-rose-300'}>
                {isMasterOn ? 'SUBSYSTEM ONLINE & FUNCTIONAL' : 'SUBSYSTEM LOCKED & DISABLED (KILL-SWITCH)'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Universal Video &amp; Audio Authority Matrix</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border font-normal ${
                isMasterOn
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-rose-950 text-rose-300 border-rose-600'
              }`}>
                {isMasterOn ? 'Active (All Tiers Allowed)' : 'Deactivated'}
              </span>
            </h2>

            <p className="text-xs text-slate-300 font-sans max-w-3xl leading-relaxed">
              Full developer authority over the institutional multimedia repository. Turn the entire Audio &amp; Video engine on or off globally, or toggle each feature, portal page, upload permission, and global free library API one by one.
            </p>
          </div>

          {/* MASTER TOGGLE BUTTON */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => toggleFeature('multimedia_master_enabled')}
              disabled={saving}
              className={`px-6 py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase transition flex items-center gap-2.5 shadow-2xl cursor-pointer ${
                isMasterOn
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
              }`}
            >
              <Power size={16} />
              <span>{isMasterOn ? 'Master Kill-Switch (Deactivate)' : 'Activate Master Engine'}</span>
            </button>
          </div>
        </div>

        {/* TELEMETRY STATS BAR */}
        {telemetry && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Total Video Lectures</span>
              <span className="text-lg font-black text-cyan-300">{telemetry.total_videos}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Total Audiobooks</span>
              <span className="text-lg font-black text-emerald-300">{telemetry.total_audios}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Stream Engagements</span>
              <span className="text-lg font-black text-amber-300">{telemetry.total_streams}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase block">Active World APIs</span>
              <span className="text-lg font-black text-purple-300">{telemetry.active_apis_count} of 6 Live</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. PLATFORM INTERFACE PAGES (ONE BY ONE TOGGLES) */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-cyan-400" />
              <span>1. Interface &amp; Portal Page Visibility Toggles</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Choose exactly where the Audio &amp; Video pages and navigation pills appear for users.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkSetGroup(['page_opac_multimedia', 'page_student_multimedia', 'page_hod_multimedia', 'page_staff_multimedia', 'page_admin_multimedia'], true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-bold"
            >
              Turn All ON
            </button>
            <button
              onClick={() => bulkSetGroup(['page_opac_multimedia', 'page_student_multimedia', 'page_hod_multimedia', 'page_staff_multimedia', 'page_admin_multimedia'], false)}
              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 text-[10px] font-bold"
            >
              Turn All OFF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'page_opac_multimedia', label: 'Public OPAC (#/media & #/opac)', desc: 'Top nav pill and filterable multimedia stacks for public users & visitors' },
            { key: 'page_student_multimedia', label: 'Student Portal (#/student)', desc: 'Dedicated "Audio & Video Lectures" revision tab in student portal' },
            { key: 'page_hod_multimedia', label: 'HOD Dashboard (#/hod)', desc: 'Audio & Video Studio navigation tab for all departmental heads' },
            { key: 'page_staff_multimedia', label: 'Staff Workspace (#/hod/staff)', desc: 'Lecturer and staff upload studio for assigned departmental courses' },
            { key: 'page_admin_multimedia', label: 'Admin Console (#/admin)', desc: 'Audio & Video Cataloguing Studio in Chief Librarian admin dashboard' }
          ].map(p => {
            const on = config[p.key];
            return (
              <div
                key={p.key}
                onClick={() => toggleFeature(p.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  on
                    ? 'bg-slate-900/90 border-cyan-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${on ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{p.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{p.desc}</p>
                </div>
                <div className="shrink-0 text-cyan-400 mt-0.5">
                  {on ? <ToggleRight size={24} className="text-cyan-400" /> : <ToggleLeft size={24} className="text-slate-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CORE PLAYBACK & UI FEATURES (ONE BY ONE TOGGLES) */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-emerald-400" />
              <span>2. Core Streaming Features &amp; Functions Toggles</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Granularly enable or disable each sub-feature inside the Multimedia Studio Player.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'feature_video_streaming', label: '1080p HD Video Engine', desc: 'RFC 7233 partial content byte-range streaming for recorded lectures & practical demos' },
            { key: 'feature_audio_streaming', label: 'High-Bitrate Audio Player', desc: 'Audiobook player with waveform simulation, skip forward/back & background play' },
            { key: 'feature_dynamic_bandwidth_saver', label: 'Bandwidth Saver (Idle-Compact)', desc: 'Reduces video size while paused; expands to crystal-clear 1080p full size on click' },
            { key: 'feature_companion_handouts', label: 'Companion Handout (PDF)', desc: 'Split-view display for lecture notes, slides and exam preparation handouts' },
            { key: 'feature_interactive_transcripts', label: 'Interactive Timed Transcripts', desc: 'Synchronized WebVTT cue transcripts scrolling in time with the lecturer' },
            { key: 'feature_chapter_cues', label: 'Chapter Jump Markers', desc: 'Timestamped index points allowing students to jump straight to sub-topics' },
            { key: 'feature_playback_resume', label: 'Cross-Device Playback Resume', desc: 'Auto-resumes playback position across mobile phones and library PCs' },
            { key: 'feature_offline_download', label: 'Offline Copy Download', desc: 'Permits students to download approved educational copies for offline revision' },
            { key: 'feature_apa_citations', label: '1-Click APA 7th Citation', desc: 'Generates formatted academic citations for term papers & seminar bibliographies' }
          ].map(f => {
            const on = config[f.key];
            return (
              <div
                key={f.key}
                onClick={() => toggleFeature(f.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  on
                    ? 'bg-slate-900/90 border-emerald-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${on ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{f.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{f.desc}</p>
                </div>
                <div className="shrink-0 text-emerald-400 mt-0.5">
                  {on ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} className="text-slate-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. INGESTION & UPLOAD PERMISSIONS BY ROLE */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            <span>3. Upload Authority &amp; Ingestion Permissions by Role</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Control which user tiers are authorized to upload high-definition video and audio files into the repository.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              key: 'upload_perm_student',
              role: 'Student / User Upload',
              desc: 'When OFF (recommended): Clicking upload shows the popup instructing the student to meet their HOD for access under the HOD concept. When ON: Students can directly upload media.',
              badge: config.upload_perm_student ? 'Direct Access' : 'Requires HOD Concept'
            },
            { key: 'upload_perm_hod', role: 'Head of Department (HOD)', desc: 'Allows HODs to upload lectures & tutorials from departmental dashboard' },
            { key: 'upload_perm_staff', role: 'Staff under HODs', desc: 'Allows lecturers and assigned departmental staff to upload course lectures' },
            { key: 'upload_perm_admin', role: 'Chief Librarian / Admin', desc: 'Allows central library staff to catalogue institutional media' },
            { key: 'upload_perm_developer', role: 'Lead Developer', desc: 'Allows direct developer studio mastering and batch upload' }
          ].map(u => {
            const on = config[u.key];
            return (
              <div
                key={u.key}
                onClick={() => toggleFeature(u.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  on
                    ? 'bg-slate-900/90 border-amber-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${on ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span>{u.role}</span>
                    </div>
                    <div className="shrink-0 text-amber-400">
                      {on ? <ToggleRight size={22} className="text-amber-400" /> : <ToggleLeft size={22} className="text-slate-600" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{u.desc}</p>
                </div>

                {u.badge && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold self-start ${on ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}`}>
                    {u.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DEPARTMENTAL VIDEO INGESTION AUTHORITY (ONE-BY-ONE DEPARTMENT TOGGLES) */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-emerald-400" />
              <span>4. Departmental Video Ingestion Authority Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Enable or turn off video upload access for each academic department one by one. When a department is turned OFF, its HOD will see a popup instructing them to contact the developer to open the feature.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkSetGroup(['upload_dept_cem', 'upload_dept_cs', 'upload_dept_bfn', 'upload_dept_agr', 'upload_dept_acc', 'upload_dept_pad'], true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-bold"
            >
              Enable All 6 Depts
            </button>
            <button
              onClick={() => bulkSetGroup(['upload_dept_cem', 'upload_dept_cs', 'upload_dept_bfn', 'upload_dept_agr', 'upload_dept_acc', 'upload_dept_pad'], false)}
              className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 text-[10px] font-bold"
            >
              Lock All 6 Depts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'upload_dept_cem', code: 'CEM', name: 'Co-operative Economics & Management', hod: 'Dr. O. A. Babalola' },
            { key: 'upload_dept_cs', code: 'CS', name: 'Computer Science', hod: 'Engr. K. M. Balogun' },
            { key: 'upload_dept_bfn', code: 'BFN', name: 'Banking & Finance', hod: 'Dr. Y. O. Oladipo' },
            { key: 'upload_dept_agr', code: 'AGR', name: 'Agricultural Extension & Management', hod: 'Dr. (Mrs) F. T. Adeyemi' },
            { key: 'upload_dept_acc', code: 'ACC', name: 'Accounting', hod: 'Mrs. A. O. Adeleke' },
            { key: 'upload_dept_pad', code: 'PAD', name: 'Public Administration', hod: 'Dr. E. K. Ogundele' },
          ].map(d => {
            const on = config[d.key];
            return (
              <div
                key={d.key}
                onClick={() => toggleFeature(d.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  on
                    ? 'bg-slate-900/90 border-emerald-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-rose-900/50 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {d.code}
                    </span>
                    <span className="text-xs font-bold text-white line-clamp-1">{d.name}</span>
                  </div>
                  <div className="text-[11px] text-amber-300 font-mono">HOD: {d.hod}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: <strong className={on ? 'text-emerald-400' : 'text-rose-400'}>{on ? 'Active (Ingestion Open)' : 'Locked (Contact Dev)'}</strong>
                  </div>
                </div>

                <div className="shrink-0 text-emerald-400 mt-0.5">
                  {on ? <ToggleRight size={24} className="text-emerald-400" /> : <ToggleLeft size={24} className="text-rose-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. STUDENT RESEARCH & ASSESSMENT SEARCH ENGINE APIS */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span>5. Student Research &amp; Assessment Search Engine APIs</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Configure search engine APIs that power the Student Research &amp; Assessment Assistant across coursework, seminars, and HND capstone theses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'api_wikipedia_academic', name: 'Wikipedia Educational API', desc: 'Foundational conceptual overviews, definitions, and encyclopedia bibliographies' },
            { key: 'api_google_scholar', name: 'Google Books / Scholar API', desc: 'Academic monographs, textbook previews, and publisher metadata' },
            { key: 'api_openalex_papers', name: 'OpenAlex Scholarly Graph', desc: '250M+ peer-reviewed papers, DOIs, citation counts, and open-access PDFs' },
            { key: 'api_crossref_dois', name: 'CrossRef Metadata Registry', desc: 'Official registered DOIs, journal articles, and citation records' }
          ].map(s => {
            const on = config[s.key];
            return (
              <div
                key={s.key}
                onClick={() => toggleFeature(s.key)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  on
                    ? 'bg-slate-900/90 border-purple-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${on ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{s.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{s.desc}</p>
                </div>
                <div className="shrink-0 text-purple-400">
                  {on ? <ToggleRight size={22} className="text-purple-400" /> : <ToggleLeft size={22} className="text-slate-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. INSTITUTIONAL LIVE BROADCAST & SOCIAL SIMULCAST GOVERNANCE (FULL PRIORITY) */}
      <div className="p-6 rounded-3xl bg-[#081326] border-2 border-rose-600/80 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-900/60 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                <Video size={10} />
                <span>REAL-TIME ON-AIR TRANSMISSION</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800">
                WebRTC &bull; RTMP &bull; Restream
              </span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Video size={18} className="text-rose-400" />
              <span>6. Institutional Live Broadcast &amp; Social Simulcast Authority</span>
            </h3>
            <p className="text-xs text-slate-300">
              Full developer priority to control, modify, and turn on/off live broadcasting institutional-wide, by department, or by feature (Webcam, Screen Share, Social Media Simulcasting).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFeature('live_broadcast_master_enabled')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide flex items-center gap-2 shadow-lg transition cursor-pointer ${
                config.live_broadcast_master_enabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                  : 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950'
              }`}
            >
              <Power size={14} />
              <span>{config.live_broadcast_master_enabled ? 'Master Live: ACTIVE' : 'Master Live: KILLED'}</span>
            </button>
          </div>
        </div>

        {/* CORE BROADCAST SUB-FEATURES */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
            Core Live Broadcast &amp; Social Simulcast Feature Switches
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'live_broadcast_social_simulcast', name: 'Multi-Social Simulcast', desc: 'Allows HODs to simulcast live lectures to YouTube Live, Facebook, LinkedIn, and X simultaneously' },
              { key: 'live_broadcast_student_access', name: 'Student Viewer Access', desc: 'Allows enrolled students to connect to live classroom broadcasts with low latency' },
              { key: 'live_broadcast_chat_enabled', name: 'Live Chat & Hand Raising', desc: 'Enables interactive Q&A discussion board and virtual raised hands during the broadcast' },
              { key: 'live_broadcast_auto_archive', name: 'Auto-Archive to Repository', desc: 'Automatically compiles live stream recording into a permanent library catalogue lecture' }
            ].map(f => {
              const on = config[f.key];
              return (
                <div
                  key={f.key}
                  onClick={() => toggleFeature(f.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    on
                      ? 'bg-slate-900/90 border-rose-500/70 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${on ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span>{f.name}</span>
                      </div>
                      <div className="shrink-0 text-rose-400">
                        {on ? <ToggleRight size={22} className="text-rose-400" /> : <ToggleLeft size={22} className="text-slate-600" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PER-DEPARTMENT LIVE BROADCAST PERMISSIONS */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono">
              Per-Department Live Broadcast Authority (One-by-One Switches)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkSetGroup(['live_broadcast_dept_cem', 'live_broadcast_dept_cs', 'live_broadcast_dept_bfn', 'live_broadcast_dept_agr', 'live_broadcast_dept_acc', 'live_broadcast_dept_pad'], true)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800"
              >
                Enable All 6 Depts
              </button>
              <button
                onClick={() => bulkSetGroup(['live_broadcast_dept_cem', 'live_broadcast_dept_cs', 'live_broadcast_dept_bfn', 'live_broadcast_dept_agr', 'live_broadcast_dept_acc', 'live_broadcast_dept_pad'], false)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800"
              >
                Lock All 6 Depts
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'live_broadcast_dept_cem', code: 'CEM', name: 'Co-operative Economics & Management', hod: 'Dr. O. A. Babalola' },
              { key: 'live_broadcast_dept_cs', code: 'CS', name: 'Computer Science', hod: 'Engr. K. M. Balogun' },
              { key: 'live_broadcast_dept_bfn', code: 'BFN', name: 'Banking & Finance', hod: 'Dr. Y. O. Oladipo' },
              { key: 'live_broadcast_dept_agr', code: 'AGR', name: 'Agricultural Extension & Management', hod: 'Dr. (Mrs) F. T. Adeyemi' },
              { key: 'live_broadcast_dept_acc', code: 'ACC', name: 'Accounting', hod: 'Mrs. A. O. Adeleke' },
              { key: 'live_broadcast_dept_pad', code: 'PAD', name: 'Public Administration', hod: 'Dr. E. K. Ogundele' },
            ].map(d => {
              const on = config[d.key];
              return (
                <div
                  key={d.key}
                  onClick={() => toggleFeature(d.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    on
                      ? 'bg-slate-900/90 border-rose-500/70 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-cyan-300">
                        {d.code}
                      </span>
                      <span className="text-xs font-bold text-white line-clamp-1">{d.name}</span>
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono">HOD: {d.hod}</div>
                    <div className="text-[10px] font-mono">
                      Live Stream: <strong className={on ? 'text-emerald-400' : 'text-rose-400'}>{on ? 'Active' : 'Locked'}</strong>
                    </div>
                  </div>
                  <div className="shrink-0 text-rose-400 mt-1">
                    {on ? <ToggleRight size={22} className="text-rose-400" /> : <ToggleLeft size={22} className="text-slate-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. GLOBAL FREE VIDEO & AUDIO LIBRARY APIS (FULL AUTHORITY) */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-purple-400" />
              <span>4. Global Free Video &amp; Audio Library APIs Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Free, open-access, public domain audiovisual APIs from world institutions across every discipline. Test latency and toggle each API on or off.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkSetGroup(['api_internet_archive', 'api_wikimedia_commons', 'api_librivox', 'api_nasa_media', 'api_europeana_av', 'api_mit_ocw'], true)}
              className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800 text-[10px] font-bold"
            >
              Enable All 6 APIs
            </button>
            <button
              onClick={() => bulkSetGroup(['api_internet_archive', 'api_wikimedia_commons', 'api_librivox', 'api_nasa_media', 'api_europeana_av', 'api_mit_ocw'], false)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-[10px] font-bold"
            >
              Disable All External APIs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {worldApis.map((api) => {
            const on = config[api.id];
            const test = testResults[api.id];
            const isTesting = testingApiId === api.id;

            return (
              <div
                key={api.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  on
                    ? 'bg-slate-900/90 border-purple-500/60 shadow-xl shadow-purple-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${on ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
                      <h4 className="text-sm font-bold text-white">{api.name}</h4>
                    </div>
                    <span className="text-[11px] text-purple-300 font-sans">{api.provider}</span>
                  </div>

                  <button
                    onClick={() => toggleFeature(api.id)}
                    className="shrink-0 text-purple-400 cursor-pointer"
                    title={on ? 'Turn OFF' : 'Turn ON'}
                  >
                    {on ? <ToggleRight size={28} className="text-purple-400" /> : <ToggleLeft size={28} className="text-slate-600" />}
                  </button>
                </div>

                <p className="text-xs text-slate-300/90 font-sans leading-relaxed">
                  {api.description}
                </p>

                {/* Disciplines and Formats Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  {api.disciplines?.map((d, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-200 border border-purple-800/80">
                      {d}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {api.catalog_size}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {api.license}
                  </span>
                </div>

                {/* Test Connection Button & Result */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleTestApi(api)}
                    disabled={isTesting || !on}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-purple-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Activity size={13} className={isTesting ? 'animate-spin' : ''} />
                    <span>{isTesting ? 'Testing Connectivity...' : 'Ping & Test API'}</span>
                  </button>

                  {test && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {test.status === 'online' ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 size={13} />
                          <span>{test.latency} • 200 OK</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-bold">
                          <XCircle size={13} />
                          <span>{test.msg}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. LIVE WORLD AV SEARCH SANDBOX (TEST WHAT USERS SEE) */}
      <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-800/80 shadow-2xl space-y-4">
        <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Search size={16} className="text-cyan-400" />
              <span>5. Developer Live World API Search Sandbox</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Test queries across all enabled free global library APIs. Verify streaming playback and metadata normalization before students and researchers use it.
            </p>
          </div>
        </div>

        <form onSubmit={handleSandboxSearch} className="flex gap-2">
          <input
            type="text"
            value={sandboxQuery}
            onChange={(e) => setSandboxQuery(e.target.value)}
            placeholder="Search global educational video/audio (e.g. cooperative, soil science, algorithms, economics)..."
            className="flex-1 bg-[#02050b] border border-cyan-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={sandboxSearching}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
          >
            <RefreshCw size={14} className={sandboxSearching ? 'animate-spin' : ''} />
            <span>Search World Repositories</span>
          </button>
        </form>

        {sandboxResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            {sandboxResults.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                      {item.source_api}
                    </span>
                    <span className="text-slate-400 font-mono">{item.duration_formatted}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 truncate max-w-[150px]">{item.creator}</span>
                  <a
                    href={item.external_link || item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 flex items-center gap-1 font-bold"
                  >
                    <span>Inspect</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

