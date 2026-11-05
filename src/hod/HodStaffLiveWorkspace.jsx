import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Shield, ShieldCheck, Lock, Unlock, Layers, BookOpen, Upload,
  Award, Bookmark, MessageSquare, Building2, Sparkles, CheckCircle2,
  AlertTriangle, Sliders, ArrowLeft, UserCheck, Plus, Edit3, Trash2,
  KeyRound, Play, FileSpreadsheet, UserPlus, Check, ExternalLink, Code2
} from 'lucide-react';
import HodUploadStudio from './HodUploadStudio';
import InstitutionalCommunicationHub from '../common/InstitutionalCommunicationHub';
import { STAFF_PAGE_CATALOG, STAFF_FEATURE_CATALOG } from './HodStaffPageBuilder';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import { logStaffActivity } from '../services/developerApi';
import MaintenanceBroadcastBanner from '../common/MaintenanceBroadcastBanner';
import UniversalNotificationCenter from '../common/UniversalNotificationCenter';
import { subscribeRealtimeEvents } from '../services/realtimeSync';

export default function HodStaffLiveWorkspace({
  currentDept,
  theme,
  staffList = [],
  selectedStaffId,
  setSelectedStaffId,
  onOpenStaffBuilder,
  isStaffUser = false,
  currentUser = null,
  // Live Departmental Data & Handlers passed from HodDashboard
  courses = [],
  uploads = [],
  dissertations = [],
  reservesList = [],
  scholarsList = [],
  catalogBooks = [],
  onOpenAddCourseModal,
  onOpenEditCourse,
  onDeleteCourse,
  onOpenEditSubmission,
  onDeleteSubmission,
  onApproveDissertation,
  onRequestDissertationRevision,
  onOpenUploadDissertationModal,
  onOpenAddReserveModal,
  onOpenEditReserve,
  onDeleteReserve,
  onOpenAddStudentModal,
  onOpenBulkImportModal,
  onEditStudent,
  onToggleScholarClearance,
  onRefreshUploads,
  onRefreshStaff
}) {
  const activeStaff = useMemo(() => {
    if (isStaffUser && currentUser) {
      const found = staffList.find(s =>
        s.id === (currentUser.id || currentUser.staff_id) ||
        s.staff_code === currentUser.staff_code ||
        s.username === currentUser.username
      );
      return found || currentUser;
    }
    if (!staffList || staffList.length === 0) return null;
    return staffList.find(s => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId, isStaffUser, currentUser]);

  // Real-time synchronization when HOD modifies staff permissions or assigns new functions
  const [realtimeAlert, setRealtimeAlert] = useState(null);

  useEffect(() => {
    const handleStaffUpdated = () => {
      if (onRefreshStaff) onRefreshStaff();
    };
    window.addEventListener('fcc-staff-updated', handleStaffUpdated);
    return () => window.removeEventListener('fcc-staff-updated', handleStaffUpdated);
  }, [onRefreshStaff]);

  // Dedicated real-time listener for all staff changes, permissions, presets & status updates
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (!event || !event.action) return;

      const eventAction = String(event.action).toUpperCase();
      const eventStaffId = String(event.id || '');
      const eventStaffCode = String(event.staff_code || '').toUpperCase();
      const currentStaffId = String(activeStaff?.id || '');
      const currentStaffCode = String(activeStaff?.staff_code || '').toUpperCase();

      const isTarget =
        eventStaffId === currentStaffId ||
        (eventStaffCode && eventStaffCode === currentStaffCode) ||
        eventAction === 'STAFF_BULK_PERMISSIONS_UPDATED';

      if (eventAction.startsWith('STAFF_')) {
        if (onRefreshStaff) {
          onRefreshStaff(currentDept?.code);
        }

        if (isTarget) {
          try { sounds.playNotificationChime(); } catch (e) {}

          let alertMsg = 'HOD updated workspace permissions in real time.';
          let alertType = 'info';

          if (eventAction === 'STAFF_PERMISSIONS_UPDATED') {
            alertMsg = `⚡ Permissions updated in real time by HOD (${event?.data?.staff_name || 'Staff'}).`;
          } else if (eventAction === 'STAFF_STATUS_UPDATED') {
            const newStatus = event?.data?.status;
            if (newStatus === 'suspended') {
              alertMsg = `⚠️ Workspace has been SUSPENDED by HOD. Access is locked.`;
              alertType = 'error';
            } else {
              alertMsg = `✅ Workspace reactivated by HOD. All assigned features live.`;
              alertType = 'success';
            }
          } else if (eventAction === 'STAFF_PACKAGE_APPLIED') {
            alertMsg = `📦 HOD assigned "${event?.data?.package_title || 'New Package'}" to your workspace.`;
            alertType = 'success';
          } else if (eventAction === 'STAFF_PRESET_APPLIED') {
            alertMsg = `🎖️ HOD applied role template "${event?.data?.preset_name || 'Role'}" to your workspace.`;
            alertType = 'success';
          } else if (eventAction === 'STAFF_PASSWORD_UPDATED') {
            alertMsg = `🔑 HOD updated access password for this workspace.`;
            alertType = 'warning';
          } else if (eventAction === 'STAFF_REMOVED') {
            alertMsg = `🚫 This staff workspace was removed by HOD.`;
            alertType = 'error';
          }

          setRealtimeAlert({
            type: alertType,
            message: alertMsg,
            timestamp: new Date().toLocaleTimeString()
          });
          setTimeout(() => setRealtimeAlert(null), 8000);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeStaff?.id, activeStaff?.staff_code, currentDept?.code, onRefreshStaff]);

  const allowedPages = activeStaff?.allowed_pages || { overview: true };
  const allowedFeatures = activeStaff?.allowed_features || {};

  // Enabled sub-pages for this staff member
  const enabledPageItems = useMemo(() => {
    return STAFF_PAGE_CATALOG.filter(p => Boolean(allowedPages[p.id]));
  }, [allowedPages]);

  const [activeSubPage, setActiveSubPage] = useState('overview');

  // Ensure activeSubPage is always an enabled page when switching staff
  useEffect(() => {
    if (enabledPageItems.length > 0 && !allowedPages[activeSubPage]) {
      setActiveSubPage(enabledPageItems[0].id);
    }
  }, [activeStaff?.id, allowedPages]);

  // Staff Direct Login / Verification Modal State
  const [showStaffAuthModal, setShowStaffAuthModal] = useState(false);
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Gora & InneAI Quick Tool State inside Staff Overview (if fn_ai_gora_tools is granted)
  const [toolTitle, setToolTitle] = useState('Journal of Co-operative Economics & Management');
  const [toolAuthor, setToolAuthor] = useState(activeStaff?.name || 'Departmental Researcher');
  const [toolResult, setToolResult] = useState(null);
  const [isRunningTool, setIsRunningTool] = useState(false);

  const handleStaffDirectSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      const res = await fetch('/api/hod/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: authIdentifier, password: authPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.staff) {
        sounds.playSuccessChime();
        setSelectedStaffId(data.staff.id);
        setShowStaffAuthModal(false);
        setAuthIdentifier('');
        setAuthPassword('');
        logStaffActivity({
          actor: data.staff.name,
          staff_id: data.staff.id,
          department_code: currentDept?.code || data.staff.department_code,
          action: 'STAFF_LOGIN_SESSION',
          resource_type: 'AuthSession',
          resource_id: data.staff.staff_code,
          details: `Staff member ${data.staff.name} authenticated into departmental live workspace.`
        });
      } else {
        sounds.playErrorBuzz();
        setAuthError(data.message || 'Invalid Staff ID or Password.');
      }
    } catch (err) {
      setAuthError('Could not verify staff credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRunStaffGoraVerify = async () => {
    setIsRunningTool(true);
    try {
      const res = await libraryApi.gora.verifyDocument({
        title: toolTitle,
        author: toolAuthor || activeStaff?.name,
        identifier: `ISSN-${currentDept?.code || 'CEM'}-2026`,
        department: currentDept?.name || 'Academic Department'
      });
      setToolResult({ type: 'gora', data: res });
      sounds.playSuccessChime();
      logStaffActivity({
        actor: activeStaff?.name || 'Department Staff',
        staff_id: activeStaff?.id || 'STF-UNKNOWN',
        department_code: currentDept?.code || activeStaff?.department_code,
        action: 'STAFF_GORA_COMPUTATION',
        resource_type: 'GoraOracle',
        resource_id: toolTitle,
        details: `Staff member executed Gora off-chain computational oracle for "${toolTitle}".`
      });
    } catch (e) {} finally {
      setIsRunningTool(false);
    }
  };

  const handleRunStaffInneAiAnalyze = async () => {
    setIsRunningTool(true);
    try {
      const res = await libraryApi.inneai.analyze({
        title: toolTitle,
        author: toolAuthor || activeStaff?.name,
        abstract: `Departmental manuscript prepared under ${currentDept?.name || 'FCC Ibadan'} curriculum.`
      });
      setToolResult({ type: 'inneai', data: res });
      sounds.playSuccessChime();
      logStaffActivity({
        actor: activeStaff?.name || 'Department Staff',
        staff_id: activeStaff?.id || 'STF-UNKNOWN',
        department_code: currentDept?.code || activeStaff?.department_code,
        action: 'STAFF_INNEAI_ANALYSIS',
        resource_type: 'InneAI',
        resource_id: toolTitle,
        details: `Staff member performed InneAI academic research analysis for "${toolTitle}".`
      });
    } catch (e) {} finally {
      setIsRunningTool(false);
    }
  };

  if (!activeStaff) {
    return (
      <div className="p-12 rounded-3xl bg-[#0b1324] border border-slate-800 text-center space-y-4">
        <Users size={40} className="mx-auto text-slate-500" />
        <h3 className="text-lg font-black text-white">No Departmental Staff Workspace Configured Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Open the Staff Page Builder (`#/hod/staff-builder`) to create a staff account and select the pages, features, and functions they can access.
        </p>
        <button
          type="button"
          onClick={onOpenStaffBuilder}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
        >
          Go to Staff Page Builder &rarr;
        </button>
      </div>
    );
  }

  const isSuspended = (activeStaff.status || 'active') !== 'active';
  const grantedFeaturesCount = Object.values(allowedFeatures).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Targeted Developer Broadcast Banner & Maintenance Lock */}
      <MaintenanceBroadcastBanner role="hod_staff" currentPage={activeSubPage} />

      {/* Live Real-Time Instant Notification Banner */}
      {realtimeAlert && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-2xl transition-all ${
            realtimeAlert.type === 'error'
              ? 'bg-red-950/90 border-red-500/80 text-red-200'
              : realtimeAlert.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
              : realtimeAlert.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
              : 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping shrink-0" />
            <span>{realtimeAlert.message}</span>
            <span className="text-[10px] opacity-70 font-mono ml-2">({realtimeAlert.timestamp})</span>
          </div>
          <button
            type="button"
            onClick={() => setRealtimeAlert(null)}
            className="text-xs font-mono opacity-80 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP STAFF WORKSPACE IDENTITY & HOD EMULATOR SWITCHER BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0a1324] border-2 border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
        <div
          className="h-1.5 w-full absolute top-0 left-0"
          style={{ backgroundColor: theme?.solidPrimary || '#059669' }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow"
                style={{ backgroundColor: theme?.solidPrimary || '#059669' }}
              >
                DELEGATED STAFF WORKSPACE • {activeStaff.staff_code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#162238] border border-slate-700 text-amber-300 text-[10px] font-mono font-bold">
                PAGE 2 OF 2 • #/hod/staff-workspace
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#064e3b] border border-emerald-500 text-emerald-200 text-[10px] font-mono font-bold">
                {enabledPageItems.length} Pages • {grantedFeaturesCount} Functions Unlocked
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeStaff.page_title || `${activeStaff.name} Workspace`}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeStaff.welcome_banner || `Dedicated departmental workspace provisioned by the Head of Department (${currentDept?.name}).`}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
              <span>Staff: <strong className="text-white">{activeStaff.name}</strong></span>
              <span>• Rank: <strong className="text-emerald-300">{activeStaff.designation}</strong></span>
              <span>• Courses: <strong className="text-amber-300">{Array.isArray(activeStaff.assigned_courses) ? activeStaff.assigned_courses.join(', ') : activeStaff.assigned_courses}</strong></span>
            </div>
          </div>

          {/* Right Controls: Notification Center, Switcher & Navigation */}
          {!isStaffUser ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <UniversalNotificationCenter user={activeStaff} role="hod_staff" />

              <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-2 flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase pl-1">Active Staff:</span>
                <select
                  value={activeStaff.id}
                  onChange={e => {
                    sounds.playClick();
                    setSelectedStaffId(e.target.value);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.staff_code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowStaffAuthModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#162238] hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Authenticate directly with a Staff ID and Password"
              >
                <KeyRound size={13} className="text-amber-400" />
                <span>Staff Sign-In</span>
              </button>

              <button
                type="button"
                onClick={onOpenStaffBuilder}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Sliders size={14} />
                <span>Edit Access in Builder</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <UniversalNotificationCenter user={activeStaff} role="hod_staff" />

              <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified Faculty Session</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. DYNAMIC ALLOWED PAGES NAVIGATION BAR (Only pages enabled by HOD are unlocked) */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {STAFF_PAGE_CATALOG.map(page => {
            const Icon = page.icon;
            const isUnlocked = Boolean(allowedPages[page.id]);
            const isActive = activeSubPage === page.id;

            if (!isUnlocked) {
              return (
                <div
                  key={page.id}
                  className="px-3 py-2 rounded-xl bg-[#070d19] border border-slate-800/80 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none"
                  title={`Restricted by HOD: ${page.label} is turned OFF for ${activeStaff.name}`}
                >
                  <Lock size={12} />
                  <span>{page.label}</span>
                </div>
              );
            }

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveSubPage(page.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'bg-[#111c33] hover:bg-[#182747] text-slate-200 border border-slate-700'
                }`}
                style={isActive ? { backgroundColor: theme?.solidPrimary || '#059669' } : undefined}
              >
                <Icon size={14} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suspended Guard */}
      {isSuspended ? (
        <div className="p-10 rounded-3xl bg-[#3b0819] border-2 border-rose-500 text-center space-y-3">
          <Lock size={36} className="mx-auto text-rose-300" />
          <h3 className="text-lg font-black text-white">Staff Workspace Suspended by Head of Department</h3>
          <p className="text-xs text-rose-200 max-w-md mx-auto">
            Access to {activeStaff.name}&apos;s workspace page ({activeStaff.staff_code}) has been temporarily suspended by the HOD. Use the Staff Page Builder to reactivate this page.
          </p>
        </div>
      ) : (
        <>
          {/* ==============================================================
              SUB-PAGE 1: STAFF OVERVIEW & ASSIGNED CAPABILITIES
          ============================================================== */}
          {activeSubPage === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0b1324] border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Department Holdings</span>
                  <div className="text-2xl font-black text-white mt-1">{catalogBooks.length}</div>
                  <span className="text-[11px] text-emerald-400">Books &amp; Academic Journals</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1324] border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned Courses</span>
                  <div className="text-2xl font-black text-cyan-300 mt-1">
                    {Array.isArray(activeStaff.assigned_courses) ? activeStaff.assigned_courses.length : 1}
                  </div>
                  <span className="text-[11px] text-slate-300 truncate block">
                    {Array.isArray(activeStaff.assigned_courses) ? activeStaff.assigned_courses.join(', ') : activeStaff.assigned_courses}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1324] border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Department Dissertations</span>
                  <div className="text-2xl font-black text-amber-300 mt-1">{dissertations.length}</div>
                  <span className="text-[11px] text-slate-400">Capstone Projects</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1324] border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Granted Functions</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{grantedFeaturesCount} / {STAFF_FEATURE_CATALOG.length}</div>
                  <span className="text-[11px] text-slate-400">HOD Delegated Capabilities</span>
                </div>
              </div>

              {/* Active Capabilities Matrix for this Staff Member */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Your HOD-Assigned Feature &amp; Function Clearance Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Green capabilities are active in your workspace; locked items require HOD authorization in `#/hod/staff-builder`
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {STAFF_FEATURE_CATALOG.map(feat => {
                    const granted = Boolean(allowedFeatures[feat.id]);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => {
                          if (granted && allowedPages[feat.page]) {
                            setActiveSubPage(feat.page);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          granted
                            ? 'bg-[#10233d] border-emerald-500/60 text-white cursor-pointer hover:bg-[#162d4f]'
                            : 'bg-[#070d19] border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="font-semibold truncate">{feat.label}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          granted ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {granted ? 'ACTIVE' : 'LOCKED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gora Off-Chain Watermark & InneAI Manuscript Workbench (Enabled when fn_ai_gora_tools is granted) */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-cyan-400" />
                      <span>Gora Off-Chain Watermark Attestation &amp; InneAI Manuscript Analyzer</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Verify academic journal watermarks via `gora-off-chain-computation-api-1` or evaluate manuscripts with InneAI
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                    allowedFeatures.fn_ai_gora_tools
                      ? 'bg-emerald-700 text-white'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}>
                    {allowedFeatures.fn_ai_gora_tools ? 'FUNCTION GRANTED' : 'RESTRICTED BY HOD'}
                  </span>
                </div>

                {allowedFeatures.fn_ai_gora_tools ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <input
                        type="text"
                        value={toolTitle}
                        onChange={e => setToolTitle(e.target.value)}
                        placeholder="Journal or Manuscript Title"
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                      <input
                        type="text"
                        value={toolAuthor}
                        onChange={e => setToolAuthor(e.target.value)}
                        placeholder="Lead Author"
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleRunStaffGoraVerify}
                        disabled={isRunningTool}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Code2 size={14} />
                        <span>Attest with Gora Off-Chain API</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRunStaffInneAiAnalyze}
                        disabled={isRunningTool}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles size={14} />
                        <span>Analyze with InneAI API</span>
                      </button>
                    </div>
                    {toolResult && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-700/60 text-xs font-mono text-cyan-200 space-y-1">
                        {toolResult.type === 'gora' ? (
                          <>
                            <div><strong>Gora Attestation ID:</strong> {toolResult.data?.attestation_id} ({toolResult.data?.off_chain_attestation?.oracle_consensus})</div>
                            <div className="break-all text-emerald-300">SHA-256 Proof: {toolResult.data?.off_chain_attestation?.document_sha256}</div>
                          </>
                        ) : (
                          <>
                            <div><strong>InneAI Rigor Score:</strong> {toolResult.data?.analysis?.readability_and_rigor_score}</div>
                            <div className="text-indigo-300">APA 7th: {toolResult.data?.analysis?.apa_7th_citation}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#070d19] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Lock size={14} className="text-rose-400" />
                    <span>This function (`fn_ai_gora_tools`) is currently disabled for your staff profile by the HOD.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 2: UPLOAD BOOKS & ACADEMIC JOURNALS STUDIO
          ============================================================== */}
          {activeSubPage === 'upload' && (
            <div className="space-y-4 animate-fadeIn">
              {(!allowedFeatures.fn_upload_books && !allowedFeatures.fn_upload_journals) ? (
                <div className="p-8 rounded-3xl bg-[#0b1324] border border-rose-700/60 text-center space-y-2">
                  <Lock size={28} className="mx-auto text-rose-400" />
                  <h4 className="text-sm font-bold text-white">Upload Functions Restricted by HOD</h4>
                  <p className="text-xs text-slate-400">
                    Your workspace has view access to the Upload tab, but both `fn_upload_books` and `fn_upload_journals` are currently turned OFF by the HOD.
                  </p>
                </div>
              ) : (
                <HodUploadStudio
                  user={{
                    name: `${activeStaff.name} (${activeStaff.staff_code})`,
                    staff_id: activeStaff.id || activeStaff.staff_id,
                    staff_code: activeStaff.staff_code,
                    uploaded_by_hod_id: activeStaff.staff_code || activeStaff.id,
                    hod_name: activeStaff.name,
                    department_id: currentDept?.id || `DEP-${currentDept?.code}`,
                    department_name: currentDept?.name,
                    department_code: currentDept?.code,
                    role: 'hod_staff',
                    theme
                  }}
                  onUploadComplete={() => {
                    if (onRefreshUploads) onRefreshUploads();
                  }}
                />
              )}
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 3: CURRICULUM & SYLLABI
          ============================================================== */}
          {activeSubPage === 'courses' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Departmental Courses &amp; Syllabi ({courses.length})</h3>
                  <p className="text-xs text-slate-400">Assigned to {activeStaff.name}: {Array.isArray(activeStaff.assigned_courses) ? activeStaff.assigned_courses.join(', ') : activeStaff.assigned_courses}</p>
                </div>
                {allowedFeatures.fn_manage_courses ? (
                  <button
                    type="button"
                    onClick={onOpenAddCourseModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Add Course to Curriculum</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono flex items-center gap-1.5">
                    <Lock size={12} />
                    <span>Read-Only (Course Editing Locked by HOD)</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.map(c => (
                  <div key={c.code} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold">{c.code}</span>
                        <span className="text-[11px] font-mono text-slate-400">{c.level} • {c.semester}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{c.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Lecturer: {c.lecturer || activeStaff.name}</p>
                    </div>
                    {allowedFeatures.fn_manage_courses && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditCourse && onOpenEditCourse(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                          title="Edit course"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCourse && onDeleteCourse(c.code, c.title)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-rose-300"
                          title="Delete course"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 4: INGESTION PIPELINE & SUBMISSIONS
          ============================================================== */}
          {activeSubPage === 'submissions' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Departmental Ingestion Pipeline ({uploads.length})</h3>
                  <p className="text-xs text-slate-400">Books, Lecture Handouts &amp; Academic Journals submitted from {currentDept?.name}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {uploads.map(up => (
                  <div key={up.id} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono font-bold">{up.resource_type || 'Book'}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono uppercase">{up.status || 'pending'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 truncate">{up.title}</h4>
                      <p className="text-xs text-slate-400">{up.author} • Course: {up.course_code || 'General'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {allowedFeatures.fn_edit_submissions ? (
                        <button
                          type="button"
                          onClick={() => onOpenEditSubmission && onOpenEditSubmission(up)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-500 text-[10px] font-mono flex items-center gap-1">
                          <Lock size={10} /> Edit Locked
                        </span>
                      )}

                      {allowedFeatures.fn_delete_submissions ? (
                        <button
                          type="button"
                          onClick={() => onDeleteSubmission && onDeleteSubmission(up.id, up.title)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Withdraw</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-500 text-[10px] font-mono flex items-center gap-1">
                          <Lock size={10} /> Delete Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 5: HND DISSERTATIONS & STUDENT PROJECTS
          ============================================================== */}
          {activeSubPage === 'dissertations' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">HND Dissertations &amp; Student Projects ({dissertations.length})</h3>
                  <p className="text-xs text-slate-400">Supervision &amp; review queue for {currentDept?.name}</p>
                </div>
                {allowedFeatures.fn_upload_dissertations && (
                  <button
                    type="button"
                    onClick={onOpenUploadDissertationModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>+ Upload Capstone Dissertation</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {dissertations.map(diss => (
                  <div key={diss.id} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-mono font-bold">
                          {diss.status || 'Under Review'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{diss.matric} • {diss.year || 2026}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{diss.title}</h4>
                      <p className="text-xs text-slate-400">Scholar: {diss.author} • Supervisor: {diss.advisor || activeStaff.name}</p>
                    </div>

                    {allowedFeatures.fn_approve_dissertations ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onApproveDissertation) onApproveDissertation(diss.id);
                            logStaffActivity({
                              actor: activeStaff?.name || 'Department Staff',
                              staff_id: activeStaff?.id || 'STF-UNKNOWN',
                              department_code: currentDept?.code || activeStaff?.department_code,
                              action: 'STAFF_APPROVE_DISSERTATION',
                              resource_type: 'Dissertation',
                              resource_id: diss.id || diss.title,
                              details: `Staff member approved and endorsed dissertation "${diss.title || diss.topic}"`
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>Approve &amp; Publish</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onRequestDissertationRevision) onRequestDissertationRevision(diss, 'Revision Requested');
                            logStaffActivity({
                              actor: activeStaff?.name || 'Department Staff',
                              staff_id: activeStaff?.id || 'STF-UNKNOWN',
                              department_code: currentDept?.code || activeStaff?.department_code,
                              action: 'STAFF_REVISE_DISSERTATION',
                              resource_type: 'Dissertation',
                              resource_id: diss.id || diss.title,
                              details: `Staff member requested thesis revision on "${diss.title || diss.topic}"`
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Request Revision
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono flex items-center gap-1">
                        <Lock size={12} /> Approval Locked by HOD
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 6: COURSE RESERVES DESK
          ============================================================== */}
          {activeSubPage === 'reserves' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Course Reserves Shelf ({reservesList.length})</h3>
                  <p className="text-xs text-slate-400">High-demand textbooks placed on restricted in-library loan</p>
                </div>
                {allowedFeatures.fn_manage_reserves && (
                  <button
                    type="button"
                    onClick={onOpenAddReserveModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Place Book on Reserve</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reservesList.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold">{r.reserved_for} • {r.shelf}</span>
                      <h4 className="text-sm font-bold text-white mt-1">{r.title}</h4>
                      <p className="text-xs text-slate-400">{r.author} • {r.copies} Copies ({r.duration})</p>
                    </div>
                    {allowedFeatures.fn_manage_reserves && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditReserve && onOpenEditReserve(r)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReserve && onDeleteReserve(r.id, r.title)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-rose-300"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 7: REGISTERED STUDENTS & CLEARANCE
          ============================================================== */}
          {activeSubPage === 'scholars' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Departmental Scholars &amp; Clearance ({scholarsList.length})</h3>
                  <p className="text-xs text-slate-400">Student registry for {currentDept?.name}</p>
                </div>
                {allowedFeatures.fn_manage_students && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenAddStudentModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span>+ Register Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenBulkImportModal}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Bulk CSV Import</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {scholarsList.map(st => {
                  const isCleared = st.cleared || (st.clearance_status || '').toLowerCase().includes('cleared');
                  return (
                    <div key={st.id || st.matric} className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{st.name}</h4>
                          <p className="text-xs font-mono text-cyan-300">{st.matric} • {st.level || 'HND II'}</p>
                        </div>
                        {allowedFeatures.fn_manage_students && (
                          <button
                            type="button"
                            onClick={() => onEditStudent && onEditStudent(st)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isCleared ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {isCleared ? '✓ Cleared for Convocation' : 'Pending Clearance'}
                        </span>
                        {!isCleared && allowedFeatures.fn_approve_clearance && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onToggleScholarClearance) onToggleScholarClearance(st.id || st.matric);
                              logStaffActivity({
                                actor: activeStaff?.name || 'Department Staff',
                                staff_id: activeStaff?.id || 'STF-UNKNOWN',
                                department_code: currentDept?.code || activeStaff?.department_code,
                                action: 'STAFF_TOGGLE_CLEARANCE',
                                resource_type: 'ScholarClearance',
                                resource_id: st.matric || st.id,
                                details: `Staff member approved library graduation clearance for ${st.name || st.full_name} (${st.matric})`
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Approve Clearance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==============================================================
              SUB-PAGE 8: TRI-PARTY COMMUNICATION DISPATCH
          ============================================================== */}
          {activeSubPage === 'communication' && (
            <div className="animate-fadeIn">
              {allowedFeatures.fn_send_dispatch ? (
                <InstitutionalCommunicationHub
                  currentRole="hod"
                  currentUser={{
                    name: `${activeStaff.name} (${activeStaff.designation})`,
                    matric: activeStaff.staff_code,
                    dept: currentDept?.name,
                    department_code: currentDept?.code
                  }}
                  allowRoleSwitching={false}
                />
              ) : (
                <div className="p-8 rounded-3xl bg-[#0b1324] border border-slate-800 text-center space-y-2">
                  <Lock size={28} className="mx-auto text-rose-400" />
                  <h4 className="text-sm font-bold text-white">Dispatch Messaging Restricted by HOD</h4>
                  <p className="text-xs text-slate-400">
                    The `fn_send_dispatch` capability is currently turned OFF for {activeStaff.name}.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: DIRECT STAFF SIGN-IN / SWITCH USER */}
      {showStaffAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">Departmental Staff Authentication</span>
                <h3 className="text-base font-black text-white">Sign In to Your Staff Workspace</h3>
              </div>
              <button onClick={() => setShowStaffAuthModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={handleStaffDirectSignIn} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Staff Username / Staff Code / Email</label>
                <input
                  type="text"
                  required
                  value={authIdentifier}
                  onChange={e => setAuthIdentifier(e.target.value)}
                  placeholder="e.g. cem_coordinator or STF/CEM/001"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Access Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="Enter your staff password"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffAuthModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer"
                >
                  {isAuthenticating ? 'Verifying...' : 'Unlock Staff Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

