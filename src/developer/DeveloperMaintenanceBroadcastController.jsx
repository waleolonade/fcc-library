import React, { useState, useEffect } from 'react';
import {
  Radio,
  Wrench,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  ShieldAlert,
  Users,
  GraduationCap,
  Building,
  Briefcase,
  Layers,
  Clock,
  Sparkles,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';
import {
  fetchMaintenanceBroadcasts,
  updateMaintenanceBroadcast
} from '../services/developerApi';

const ROLE_TABS = [
  {
    id: 'student',
    label: 'Students & Scholars',
    badge: 'STUDENT PORTAL',
    icon: GraduationCap,
    desc: 'Target scholar dashboard, search catalog, and e-reader',
    color: 'emerald',
    availablePages: [
      { id: 'all', label: 'Entire Student Portal (Full Lockout)' },
      { id: 'catalog', label: 'OPAC Search & Book Discovery' },
      { id: 'reader', label: 'E-Book & PDF Digital Reader' },
      { id: 'borrowing', label: 'Circulation & My Borrowed Books' },
      { id: 'profile', label: 'Student Identity & Clearance Status' }
    ]
  },
  {
    id: 'admin',
    label: 'Central Library Admins',
    badge: 'ADMIN CONSOLE',
    icon: Building,
    desc: 'Target central library circulation, catalogers, and management',
    color: 'blue',
    availablePages: [
      { id: 'all', label: 'Entire Admin Console (Full Lockout)' },
      { id: 'circulation', label: 'Circulation & Desk Loans' },
      { id: 'cataloging', label: 'Cataloging & MARC Ingestion' },
      { id: 'patrons', label: 'Patron Registry & Cards' },
      { id: 'reports', label: 'Financial & Analytics Reporting' }
    ]
  },
  {
    id: 'hod',
    label: 'Heads of Department (HODs)',
    badge: 'HOD EXECUTIVE',
    icon: Briefcase,
    desc: 'Target HOD console, departmental publishing, and staff builder',
    color: 'purple',
    availablePages: [
      { id: 'all', label: 'Entire HOD Departmental Portal' },
      { id: 'upload', label: 'Course Reserves & Publishing' },
      { id: 'curriculum', label: 'Departmental Curriculum Review' },
      { id: 'staff_builder', label: 'Staff Builder & Access Delegator' },
      { id: 'theses', label: 'Degree Dissertations & Research' }
    ]
  },
  {
    id: 'hod_staff',
    label: 'Staff Under HODs',
    badge: 'STAFF WORKSPACE',
    icon: Users,
    desc: 'Target live faculty workspace for departmental lecturers and coordinators',
    color: 'cyan',
    availablePages: [
      { id: 'all', label: 'Entire Staff Workspace (Full Lockout)' },
      { id: 'handouts', label: 'Handouts & Lecture Materials Uploader' },
      { id: 'theses_review', label: 'Final Year Project Supervisor Desk' },
      { id: 'curriculum_sync', label: 'Course Reserves & Syllabus Coordinator' },
      { id: 'clearance', label: 'Departmental Clearance Validation' }
    ]
  }
];

const PRESETS = [
  {
    name: 'Scheduled Developer Upgrade',
    title: 'Scheduled System Upgrade & Optimizations',
    message: 'Engineering is rolling out scheduled framework upgrades and database index optimizations. All records remain fully synchronized.',
    severity: 'warning',
    duration: '25 minutes'
  },
  {
    name: 'E-Reader Performance Boost',
    title: 'E-Book Reader & PDF Delivery Upgrade',
    message: 'The digital reader engine is being updated with high-speed caching and enhanced offline reading mode.',
    severity: 'info',
    duration: '15 minutes'
  },
  {
    name: 'Emergency Database Maintenance',
    title: 'Urgent Database Maintenance in Progress',
    message: 'Developer operations are performing immediate dual-persistence synchronization. Services will resume shortly.',
    severity: 'critical',
    duration: '45 minutes'
  },
  {
    name: 'Curriculum & Catalog Refresh',
    title: 'New Semester Curriculum Ingestion',
    message: 'The library is ingesting newly accredited departmental syllabi, past questions, and recommended texts.',
    severity: 'info',
    duration: '30 minutes'
  }
];

export default function DeveloperMaintenanceBroadcastController({ showToast }) {
  const [activeTab, setActiveTab] = useState('student');
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [omniSending, setOmniSending] = useState(false);

  // Form states for currently active role tab
  const [formData, setFormData] = useState({
    broadcast_active: false,
    broadcast_title: '',
    broadcast_message: '',
    severity: 'warning',
    maintenance_active: false,
    maintenance_title: '',
    maintenance_message: '',
    estimated_duration: '30 minutes',
    target_scope: 'all',
    affected_pages: ['all']
  });

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const data = await fetchMaintenanceBroadcasts();
      if (data && data.success && data.matrix) {
        setMatrix(data.matrix);
        // Initialize form with active role
        if (data.matrix[activeTab]) {
          setFormData({ ...data.matrix[activeTab] });
        }
      }
    } catch (err) {
      console.error('[BroadcastController] Failed to fetch matrix:', err);
      if (showToast) showToast('Failed to load broadcast matrix', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  // When tab changes, update form data from matrix
  useEffect(() => {
    if (matrix && matrix[activeTab]) {
      setFormData({ ...matrix[activeTab] });
    }
  }, [activeTab, matrix]);

  const currentRoleConfig = ROLE_TABS.find(t => t.id === activeTab) || ROLE_TABS[0];

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      broadcast_title: preset.title,
      broadcast_message: preset.message,
      severity: preset.severity,
      maintenance_title: preset.title,
      maintenance_message: preset.message,
      estimated_duration: preset.duration
    }));
    if (showToast) showToast(`Applied preset: ${preset.name}`, 'info');
  };

  const handleSaveRole = async (overrideState = {}) => {
    try {
      setSaving(true);
      const payload = {
        role: activeTab,
        ...formData,
        ...overrideState
      };

      const res = await updateMaintenanceBroadcast(payload);
      if (res && res.success) {
        setMatrix(res.matrix);
        setFormData(res.matrix[activeTab]);
        if (showToast) {
          showToast(`Updated broadcast & maintenance configuration for ${currentRoleConfig.label}`, 'success');
        }
      } else {
        if (showToast) showToast(res.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      console.error('[BroadcastController] Save error:', err);
      if (showToast) showToast('Failed to update broadcast settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBroadcastQuick = async () => {
    const nextVal = !formData.broadcast_active;
    setFormData(prev => ({ ...prev, broadcast_active: nextVal }));
    await handleSaveRole({ broadcast_active: nextVal });
  };

  const handleToggleMaintenanceQuick = async () => {
    const nextVal = !formData.maintenance_active;
    setFormData(prev => ({ ...prev, maintenance_active: nextVal }));
    await handleSaveRole({ maintenance_active: nextVal });
  };

  const handlePageToggle = (pageId) => {
    setFormData(prev => {
      let nextPages = Array.isArray(prev.affected_pages) ? [...prev.affected_pages] : ['all'];
      if (pageId === 'all') {
        nextPages = ['all'];
      } else {
        nextPages = nextPages.filter(p => p !== 'all');
        if (nextPages.includes(pageId)) {
          nextPages = nextPages.filter(p => p !== pageId);
          if (nextPages.length === 0) nextPages = ['all'];
        } else {
          nextPages.push(pageId);
        }
      }
      return { ...prev, affected_pages: nextPages };
    });
  };

  const handleOmniBroadcast = async () => {
    if (!window.confirm('Broadcast this announcement to ALL 4 ROLES (Students, Admins, HODs, and Staff) simultaneously?')) {
      return;
    }
    try {
      setOmniSending(true);
      const payload = {
        role: 'all',
        broadcast_active: true,
        broadcast_title: formData.broadcast_title,
        broadcast_message: formData.broadcast_message,
        severity: formData.severity
      };
      const res = await updateMaintenanceBroadcast(payload);
      if (res && res.success) {
        setMatrix(res.matrix);
        if (showToast) showToast('OMNI-BROADCAST DEPLOYED to all 4 portals successfully!', 'success');
      }
    } catch (err) {
      if (showToast) showToast('Omni-broadcast failed', 'error');
    } finally {
      setOmniSending(false);
    }
  };

  const handleEmergencyLiftAll = async () => {
    if (!window.confirm('EMERGENCY OVERRIDE: Lift ALL maintenance locks across all student, admin, HOD, and staff portals immediately?')) {
      return;
    }
    try {
      setOmniSending(true);
      const payload = {
        role: 'all',
        maintenance_active: false
      };
      const res = await updateMaintenanceBroadcast(payload);
      if (res && res.success) {
        setMatrix(res.matrix);
        setFormData(prev => ({ ...prev, maintenance_active: false }));
        if (showToast) showToast('All maintenance locks LIFTED immediately.', 'success');
      }
    } catch (err) {
      if (showToast) showToast('Failed to lift locks', 'error');
    } finally {
      setOmniSending(false);
    }
  };

  if (loading && !matrix) {
    return (
      <div className="p-8 text-center bg-[#071324] border border-slate-800 rounded-3xl space-y-4">
        <RefreshCw size={24} className="animate-spin text-cyan-400 mx-auto" />
        <p className="text-sm font-mono text-slate-300">Loading Developer Maintenance &amp; Broadcast Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#071324] border border-cyan-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs font-mono font-bold">
              <Radio size={13} className="animate-pulse text-cyan-400" />
              <span>DEVELOPER BROADCAST &amp; UPGRADE LOCK MATRIX</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Targeted System Broadcasts &amp; Maintenance Mode
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Transmit live announcement banners or initiate targeted maintenance/upgrade lockdowns separately for Students, Admins, HODs, and Staff under HODs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEmergencyLiftAll}
              disabled={omniSending}
              className="px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500 hover:bg-emerald-900 text-emerald-300 font-mono font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Unlock size={14} />
              <span>Lift All Locks</span>
            </button>
            <button
              type="button"
              onClick={loadMatrix}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
              title="Refresh Matrix"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* 4 Role Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {ROLE_TABS.map(tab => {
            const isSelected = activeTab === tab.id;
            const tabMatrix = matrix && matrix[tab.id];
            const hasBroadcast = tabMatrix && tabMatrix.broadcast_active;
            const hasMaintenance = tabMatrix && tabMatrix.maintenance_active;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`p-3.5 rounded-2xl text-left transition relative cursor-pointer border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/95 border-cyan-400 shadow-lg ring-1 ring-cyan-400/30'
                    : 'bg-[#030914] border-slate-800 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex items-center gap-1">
                    {hasBroadcast && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="Broadcast Active" />
                    )}
                    {hasMaintenance && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Maintenance Active" />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{tab.label}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{tab.badge}</p>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded ${hasBroadcast ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-500'}`}>
                    {hasBroadcast ? 'ALERT ON' : 'ALERT OFF'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${hasMaintenance ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-900 text-slate-500'}`}>
                    {hasMaintenance ? 'LOCKED' : 'OPEN'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Message Templates */}
      <div className="bg-[#071324] border border-slate-800 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-amber-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wide">
            Rapid Deployment Presets ({currentRoleConfig.label})
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-3 rounded-xl bg-[#030914] border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-amber-300">
                <span>{preset.name}</span>
                <ChevronRight size={13} className="text-slate-600 group-hover:text-amber-400 transition" />
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{preset.message}</p>
              <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-slate-500">
                <span className="uppercase">{preset.severity}</span>
                <span>•</span>
                <span>{preset.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid: Broadcast Station vs Maintenance Lock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================
            COLUMN 1: TARGETED BROADCAST ANNOUNCEMENT STATION
        ======================================================== */}
        <div className="bg-[#071324] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Radio size={20} className={formData.broadcast_active ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Broadcast Station</span>
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {currentRoleConfig.badge}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Displays live banner atop this role's portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBroadcastQuick}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                formData.broadcast_active
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {formData.broadcast_active ? <CheckCircle2 size={14} /> : <Radio size={14} />}
              <span>{formData.broadcast_active ? 'BROADCASTING' : 'OFF AIR'}</span>
            </button>
          </div>

          {/* Broadcast Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Banner Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'info', label: 'Info (Blue)', icon: Info, border: 'border-sky-500', active: 'bg-sky-950 text-sky-200' },
                  { id: 'warning', label: 'Warning (Amber)', icon: AlertTriangle, border: 'border-amber-500', active: 'bg-amber-950 text-amber-200' },
                  { id: 'critical', label: 'Critical (Red)', icon: AlertOctagon, border: 'border-rose-500', active: 'bg-rose-950 text-rose-200' }
                ].map(sev => {
                  const Icon = sev.icon;
                  const isSel = formData.severity === sev.id;
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: sev.id }))}
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSel ? `${sev.active} ${sev.border} shadow-md` : 'bg-[#030914] border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{sev.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Broadcast Headline / Title
              </label>
              <input
                type="text"
                value={formData.broadcast_title || ''}
                onChange={e => setFormData(prev => ({ ...prev, broadcast_title: e.target.value }))}
                placeholder="e.g. Scheduled Scholar Portal Upgrade Notice"
                className="w-full px-4 py-2.5 rounded-xl bg-[#030914] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Broadcast Body Message
              </label>
              <textarea
                rows={3}
                value={formData.broadcast_message || ''}
                onChange={e => setFormData(prev => ({ ...prev, broadcast_message: e.target.value }))}
                placeholder="Explain the upgrade or announcement to the target audience..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#030914] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {/* Live Preview of Broadcast Banner */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
                <Eye size={12} />
                <span>Live Client View Preview</span>
              </label>
              <div className="p-3 rounded-2xl bg-black border border-slate-800 overflow-hidden">
                <div className={`p-3 rounded-xl border ${
                  formData.severity === 'critical'
                    ? 'bg-rose-950 border-rose-500 text-rose-100'
                    : formData.severity === 'info'
                    ? 'bg-sky-950 border-sky-500 text-sky-100'
                    : 'bg-amber-950 border-amber-500 text-amber-100'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <Radio size={16} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-black/50 border border-white/20">
                          {currentRoleConfig.badge}
                        </span>
                        <h5 className="text-xs font-black text-white truncate">
                          {formData.broadcast_title || 'Institutional Announcement'}
                        </h5>
                      </div>
                      <p className="text-[11px] opacity-90 line-clamp-2">
                        {formData.broadcast_message || 'Broadcast message content will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveRole({ broadcast_active: true })}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Send size={14} />
                <span>{saving ? 'Publishing...' : 'Deploy Broadcast Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleOmniBroadcast}
                disabled={omniSending}
                title="Send this announcement to ALL 4 ROLES simultaneously"
                className="py-2.5 px-3.5 rounded-xl bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 text-cyan-300 font-mono font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>Omni-Broadcast All 4</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMN 2: TARGETED MAINTENANCE & UPGRADE PAGE LOCK
        ======================================================== */}
        <div className="bg-[#071324] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Wrench size={20} className={formData.maintenance_active ? 'animate-spin' : ''} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Maintenance Lock</span>
                  <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-rose-300">
                    ACCESS GUARD
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Enforce solid lockout overlay while performing upgrades
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMaintenanceQuick}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                formData.maintenance_active
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {formData.maintenance_active ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{formData.maintenance_active ? 'LOCKED (MAINTENANCE)' : 'PORTAL UNLOCKED'}</span>
            </button>
          </div>

          {/* Maintenance Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  Maintenance Window / ETA
                </label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={formData.estimated_duration || ''}
                    onChange={e => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                    placeholder="e.g. 20 minutes, 1 hour"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#030914] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-400 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  Target Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, target_scope: 'all', affected_pages: ['all'] }))}
                    className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer text-center ${
                      formData.target_scope === 'all'
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-[#030914] border-slate-800 text-slate-400'
                    }`}
                  >
                    Entire Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, target_scope: 'pages' }))}
                    className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer text-center ${
                      formData.target_scope === 'pages'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-[#030914] border-slate-800 text-slate-400'
                    }`}
                  >
                    Specific Pages
                  </button>
                </div>
              </div>
            </div>

            {/* If specific pages selected, show page checkboxes */}
            {formData.target_scope === 'pages' && (
              <div className="p-3.5 rounded-2xl bg-[#030914] border border-slate-800 space-y-2">
                <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Select Pages to Place Under Maintenance:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentRoleConfig.availablePages.map(page => {
                    const isChecked = Array.isArray(formData.affected_pages) && formData.affected_pages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-rose-950/40 border-rose-700/80 text-rose-200'
                            : 'bg-black/30 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePageToggle(page.id)}
                          className="rounded border-slate-700 text-rose-500 focus:ring-0"
                        />
                        <span className="text-xs font-mono">{page.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Lockout Title
              </label>
              <input
                type="text"
                value={formData.maintenance_title || ''}
                onChange={e => setFormData(prev => ({ ...prev, maintenance_title: e.target.value }))}
                placeholder="e.g. Portal Under Maintenance & Upgrade"
                className="w-full px-4 py-2.5 rounded-xl bg-[#030914] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-400 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                Lockout Message
              </label>
              <textarea
                rows={3}
                value={formData.maintenance_message || ''}
                onChange={e => setFormData(prev => ({ ...prev, maintenance_message: e.target.value }))}
                placeholder="Explain to users what upgrades are happening and when it will be restored..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#030914] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-400 font-sans"
              />
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSaveRole({ maintenance_active: true })}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Lock size={14} />
                <span>{saving ? 'Locking...' : 'Engage Maintenance Lock'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveRole({ maintenance_active: false })}
                disabled={saving}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock size={14} />
                <span>Lift Lock</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer System Telemetry Status */}
      <div className="bg-[#030914] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-cyan-400" />
          <span>Active Role Under Edit: <strong className="text-white">{currentRoleConfig.label}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Dual-Persistence: <strong className="text-emerald-400">SQLite + MySQL Synced</strong></span>
          <span>•</span>
          <span>Last Updated: <strong className="text-slate-200">{formData.updated_at ? new Date(formData.updated_at).toLocaleTimeString() : 'Current Session'}</strong></span>
        </div>
      </div>
    </div>
  );
}

