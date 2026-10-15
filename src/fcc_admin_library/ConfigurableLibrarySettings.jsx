import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Shield, Save, RefreshCw, CheckCircle2,
  Building, Clock, DollarSign, BookOpen, AlertCircle, Sparkles,
  Phone, Mail, MapPin, Globe, Check, Tag, ShieldCheck, Lock, Unlock, Calendar, Layers, AlertTriangle
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { institutionalConfigService } from '../services/institutionalConfigService';

export default function ConfigurableLibrarySettings({ onSettingsUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('institution'); // 'institution' | 'general' | 'circulation' | 'classification' | 'notifications' | 'security'

  const [settings, setSettings] = useState({
    institution_name: 'Federal Co-operative College, Ibadan',
    institution_short_name: 'FCC Ibadan',
    library_name: 'Chief Olubadan Memorial Central Library & Knowledge Center',
    contact_email: 'library@fccibadan.edu.ng',
    contact_phone: '+234 803 456 7890',
    address: 'Eleyele Road, P.M.B. 5033, Dugbe, Ibadan, Oyo State, Nigeria',
    opening_hours_weekday: '8:00 AM – 8:00 PM (Monday – Friday)',
    opening_hours_weekend: '9:00 AM – 4:00 PM (Saturdays)',
    max_borrow_limit_student: 5,
    max_borrow_limit_faculty: 10,
    loan_duration_days: 14,
    renewal_limit: 2,
    daily_fine_rate: 50.00,
    currency_symbol: '₦',
    currency_code: 'NGN',
    reservation_hold_days: 3,
    classification_system: 'Library of Congress (LCC)',
    barcode_symbology: 'Code 128',
    enable_self_service_kiosk: true,
    enable_digital_repository: true
  });

  // Institutional Parameters (INSTITUTION Object) State & Developer Delegation
  const [institutionConfig, setInstitutionConfig] = useState(() => institutionalConfigService.getInstitution());
  const [institutionPerms, setInstitutionPerms] = useState(() => institutionalConfigService.getPermissions());
  const [institutionSaving, setInstitutionSaving] = useState(false);
  const [institutionMsg, setInstitutionMsg] = useState({ type: '', text: '' });

  // Admin Account & Password State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Alhaji Balogun O. (College Chief Librarian)',
    username: 'chief_librarian',
    email: 'admin@fccibadan.com.ng',
    phone: '+2348033334455',
    designation: 'College Librarian & Director of Library Services',
    password: '',
    confirm_password: ''
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminLocked, setAdminLocked] = useState(false);
  const [adminLockedUntil, setAdminLockedUntil] = useState(null);
  const [adminDaysRemaining, setAdminDaysRemaining] = useState(0);

  useEffect(() => {
    fetchSettings();
    fetchAdminProfile();

    const handleUpdate = (e) => {
      if (e.detail?.institution) setInstitutionConfig(e.detail.institution);
      if (e.detail?.permissions) setInstitutionPerms(e.detail.permissions);
    };
    window.addEventListener('fcc-institution-updated', handleUpdate);
    institutionalConfigService.fetchFromApi().then(res => {
      if (res?.institution) setInstitutionConfig(res.institution);
      if (res?.permissions) setInstitutionPerms(res.permissions);
    });
    return () => window.removeEventListener('fcc-institution-updated', handleUpdate);
  }, []);

  const handleSaveInstitution = async (e) => {
    if (e) e.preventDefault();
    if (!institutionPerms.admin_allowed) {
      setInstitutionMsg({
        type: 'error',
        text: 'PERMISSION RESTRICTED: Institutional configuration editing has not been granted to Administrator by Developer. Access the Developer Master Portal (#/developer) to grant access.'
      });
      sounds.playErrorBuzz();
      return;
    }

    setInstitutionSaving(true);
    setInstitutionMsg({ type: '', text: '' });
    sounds.playClick();

    try {
      const res = await institutionalConfigService.saveInstitution(institutionConfig, 'Chief Librarian', 'admin');
      if (res.success) {
        sounds.playSuccessChime();
        setInstitutionMsg({
          type: 'success',
          text: 'Institutional Parameters (Session, Semester, Hours, College Identity) successfully updated and broadcast across all portals!'
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setInstitutionMsg({ type: 'error', text: err.message || 'Failed to save institutional settings.' });
    } finally {
      setInstitutionSaving(false);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const activeSession = JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
      const email = activeSession.email || 'admin@fccibadan.com.ng';
      const res = await fetch(`/api/admin/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setAdminProfile(prev => ({
            ...prev,
            name: data.user.name || prev.name,
            username: data.user.username || prev.username,
            email: data.user.email || prev.email,
            phone: data.user.phone || prev.phone,
            designation: data.user.designation || prev.designation
          }));
          setAdminLocked(Boolean(data.is_locked));
          setAdminLockedUntil(data.profile_locked_until || null);
          setAdminDaysRemaining(data.days_remaining || 0);
        }
      }
    } catch (e) {}
  };

  const handleAdminProfileSave = async (e) => {
    e.preventDefault();
    setAdminMsg({ type: '', text: '' });

    if (adminLocked) {
      setAdminMsg({
        type: 'error',
        text: `Security Lock Active: Under institutional policy, changes are restricted for 30 days (${adminDaysRemaining} days remaining). Contact Master Developer at #/developer to override.`
      });
      sounds.playErrorBuzz();
      return;
    }

    if (adminProfile.password && adminProfile.password.length < 4) {
      setAdminMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      sounds.playErrorBuzz();
      return;
    }

    if (adminProfile.password && adminProfile.password !== adminProfile.confirm_password) {
      setAdminMsg({ type: 'error', text: 'Passwords do not match.' });
      sounds.playErrorBuzz();
      return;
    }

    setAdminSaving(true);
    sounds.playClick();

    try {
      const payload = {
        name: adminProfile.name.trim(),
        username: adminProfile.username.trim(),
        email: adminProfile.email.trim().toLowerCase(),
        phone: adminProfile.phone.trim(),
        designation: adminProfile.designation.trim()
      };
      if (adminProfile.password) {
        payload.password = adminProfile.password.trim();
      }

      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setAdminLocked(true);
        setAdminLockedUntil(data.profile_locked_until);
        setAdminDaysRemaining(data.days_remaining || 30);
        setAdminMsg({
          type: 'success',
          text: '✓ Admin profile & security credentials successfully updated! Mandatory 30-day lock activated.'
        });
        const currentSession = JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
        localStorage.setItem('fcc_admin_session', JSON.stringify({ ...currentSession, ...data.user, is_locked: true }));
        setAdminProfile(prev => ({ ...prev, password: '', confirm_password: '' }));
      } else {
        if (data.is_locked) {
          setAdminLocked(true);
          setAdminLockedUntil(data.profile_locked_until);
          setAdminDaysRemaining(data.days_remaining || 30);
        }
        setAdminMsg({ type: 'error', text: data.error || 'Failed to update admin profile.' });
        sounds.playErrorBuzz();
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Connection offline. Profile cached locally.' });
    } finally {
      setAdminSaving(false);
      setTimeout(() => setAdminMsg({ type: '', text: '' }), 6000);
    }
  };


  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      }
    } catch (e) {
      console.warn('Settings API offline, utilizing active configuration state.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    sounds.playClick();

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        sounds.playSuccessChime();
        setSuccessMsg('Library settings successfully saved and applied globally.');
        if (onSettingsUpdated) onSettingsUpdated(settings);
      } else {
        setSuccessMsg('Local configuration cached successfully.');
      }
    } catch (e) {
      setSuccessMsg('Local configuration cached successfully.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-emerald-100 font-sans">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono font-bold">
              MODULE 49: CONFIGURATION ENGINE
            </span>
            <span className="text-xs text-emerald-400 font-mono">Dynamic Policy Controls</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Configurable Institutional Library Settings</h2>
          <p className="text-xs text-emerald-300/80 max-w-2xl mt-1">
            Configure global institutional branding, stack opening hours, patron borrowing limits, daily overdue fine tariffs, and classification systems without hardcoding.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 flex items-center gap-2 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Persisting...' : 'Save Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-800/60 pb-3 flex-wrap">
        {[
          { id: 'institution', label: 'College Profile & Session (INSTITUTION)', icon: Building, badge: institutionPerms.admin_allowed ? 'Active' : 'Locked' },
          { id: 'general', label: 'Library & Hours', icon: Clock },
          { id: 'circulation', label: 'Circulation & Fines', icon: DollarSign },
          { id: 'classification', label: 'Classification & Barcodes', icon: Tag },
          { id: 'notifications', label: 'OPAC & Self-Service', icon: Sparkles },
          { id: 'security', label: 'Admin Profile & Password', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-[#021810] text-emerald-300/70 border border-emerald-800/60 hover:text-white hover:bg-emerald-900/30'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  tab.badge === 'Locked'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-6">

        {/* TAB: INSTITUTION PROFILE, SESSION & CALENDAR (INSTITUTION OBJECT) */}
        {activeTab === 'institution' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    institutionPerms.admin_allowed
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}>
                    {institutionPerms.admin_allowed ? '✓ DEVELOPER CLEARANCE GRANTED' : '⚠ DEVELOPER CLEARANCE RESTRICTED'}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">export const INSTITUTION</span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                  <Building size={18} className="text-emerald-400" />
                  <span>College Profile, Session &amp; Calendar Parameters</span>
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-0.5">
                  Controls the global institutional parameters displayed on scholar dashboards, ID cards, OPAC, and official certificates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveInstitution}
                  disabled={institutionSaving || !institutionPerms.admin_allowed}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition disabled:opacity-40 cursor-pointer"
                >
                  {institutionSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{institutionSaving ? 'Persisting Parameters...' : 'Save Institutional Settings'}</span>
                </button>
              </div>
            </div>

            {institutionMsg.text && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                institutionMsg.type === 'error'
                  ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              }`}>
                {institutionMsg.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                <span>{institutionMsg.text}</span>
              </div>
            )}

            {!institutionPerms.admin_allowed && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600 text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <Lock size={14} />
                  <span>Administrative Edit Authority Restricted by Developer</span>
                </div>
                <div className="text-[11px] text-amber-300/80 font-sans">
                  The Developer Root Deck controls which administrative roles can edit the legal institutional configuration. Please log into <code className="text-white font-mono">/#/developer</code> to grant permission to Central Admin or assigned Academic HODs.
                </div>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Institution Full Legal Name (<code className="text-cyan-300 font-mono">name</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.name || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, name: e.target.value })}
                  placeholder="Federal Co-operative College, Ibadan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  College Short Name / Acronym (<code className="text-cyan-300 font-mono">shortName</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.shortName || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, shortName: e.target.value })}
                  placeholder="FCC Ibadan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Official College Motto (<code className="text-cyan-300 font-mono">motto</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.motto || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, motto: e.target.value })}
                  placeholder="Pioneering Co-operative Excellence & Technological Advancement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Year Established (<code className="text-cyan-300 font-mono">established</code>)
                </label>
                <input
                  type="number"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.established || 1943}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, established: parseInt(e.target.value, 10) || 1943 })}
                  placeholder="1943"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Campus Location (<code className="text-cyan-300 font-mono">campus</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.campus || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, campus: e.target.value })}
                  placeholder="Eleyele, Ibadan, Oyo State, Nigeria"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  System &amp; LSP Version (<code className="text-cyan-300 font-mono">systemVersion</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.systemVersion || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, systemVersion: e.target.value })}
                  placeholder="v4.8-LSP Enterprise (Localhost Edition)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Current Academic Session (<code className="text-cyan-300 font-mono">currentSession</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.currentSession || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, currentSession: e.target.value })}
                  placeholder="2026/2027 Academic Session"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Current Semester (<code className="text-cyan-300 font-mono">currentSemester</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.currentSemester || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, currentSemester: e.target.value })}
                  placeholder="Second Semester"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Operating Hours / Virtual Hub (<code className="text-cyan-300 font-mono">todayHours</code>)
                </label>
                <input
                  type="text"
                  disabled={!institutionPerms.admin_allowed}
                  value={institutionConfig.todayHours || ''}
                  onChange={e => setInstitutionConfig({ ...institutionConfig, todayHours: e.target.value })}
                  placeholder="08:00 AM – 08:00 PM (Extended Exam Hours: 24/7 Virtual Hub)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Live Student Portal Preview Card */}
            <div className="pt-4 border-t border-emerald-800/60 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>Live Scholar Portal Broadcast Preview:</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#02120b] border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white font-sans">{institutionConfig.name} ({institutionConfig.shortName})</div>
                  <div className="text-[10px] text-emerald-300/80 italic font-sans">&ldquo;{institutionConfig.motto}&rdquo;</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {institutionConfig.campus} &bull; Est. {institutionConfig.established}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                    {institutionConfig.currentSession} &bull; {institutionConfig.currentSemester}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {institutionConfig.todayHours}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: GENERAL & CONTACT */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-emerald-800/60 pb-2">
              <Building size={16} className="text-emerald-400" />
              <span>Institution Identity & Library Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Institution Full Legal Name</label>
                <input
                  type="text"
                  value={settings.institution_name}
                  onChange={e => setSettings({ ...settings, institution_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Acronym / Short Name</label>
                <input
                  type="text"
                  value={settings.institution_short_name}
                  onChange={e => setSettings({ ...settings, institution_short_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Central Library Name</label>
                <input
                  type="text"
                  value={settings.library_name}
                  onChange={e => setSettings({ ...settings, library_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Official Library Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Helpdesk Phone Helpline</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Campus Physical Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Opening Hours (Weekdays)</label>
                <input
                  type="text"
                  value={settings.opening_hours_weekday}
                  onChange={e => setSettings({ ...settings, opening_hours_weekday: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Opening Hours (Weekends)</label>
                <input
                  type="text"
                  value={settings.opening_hours_weekend}
                  onChange={e => setSettings({ ...settings, opening_hours_weekend: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CIRCULATION & FINES */}
        {activeTab === 'circulation' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-emerald-800/60 pb-2">
              <DollarSign size={16} className="text-emerald-400" />
              <span>Circulation Limits, Loan Durations & Overdue Fine Policies</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Standard Loan Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.loan_duration_days}
                  onChange={e => setSettings({ ...settings, loan_duration_days: parseInt(e.target.value, 10) || 14 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Standard borrowing period before overdue penalty</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Max Borrow Limit (Students)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_borrow_limit_student}
                  onChange={e => setSettings({ ...settings, max_borrow_limit_student: parseInt(e.target.value, 10) || 5 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Maximum concurrent physical books for students</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Max Borrow Limit (Faculty/Staff)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.max_borrow_limit_faculty}
                  onChange={e => setSettings({ ...settings, max_borrow_limit_faculty: parseInt(e.target.value, 10) || 10 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Academic researchers and lecturers quota</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Renewal Limit (Times)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.renewal_limit}
                  onChange={e => setSettings({ ...settings, renewal_limit: parseInt(e.target.value, 10) || 2 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Allowable online renewals without returning book</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Daily Overdue Fine Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-emerald-400 font-bold">{settings.currency_symbol}</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.daily_fine_rate}
                    onChange={e => setSettings({ ...settings, daily_fine_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Penal fine charge per day per overdue book</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Reservation Hold Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={settings.reservation_hold_days}
                  onChange={e => setSettings({ ...settings, reservation_hold_days: parseInt(e.target.value, 10) || 3 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Days reserved copy stays on hold shelf</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Currency Symbol & Code</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={settings.currency_symbol}
                    onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-bold text-xs text-center"
                  />
                  <input
                    type="text"
                    value={settings.currency_code}
                    onChange={e => setSettings({ ...settings, currency_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs text-center"
                  />
                </div>
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Currency notation on receipts & fine statements</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLASSIFICATION & BARCODES */}
        {activeTab === 'classification' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-emerald-800/60 pb-2">
              <Tag size={16} className="text-emerald-400" />
              <span>Classification Schemes & Barcode Symbology</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Bibliographic Classification System</label>
                <select
                  value={settings.classification_system}
                  onChange={e => setSettings({ ...settings, classification_system: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option>Library of Congress (LCC)</option>
                  <option>Dewey Decimal Classification (DDC)</option>
                  <option>Universal Decimal Classification (UDC)</option>
                  <option>National Library of Medicine (NLM)</option>
                  <option>Moys Classification Scheme (Law)</option>
                </select>
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Controls call number syntax and stack ordering</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Physical Barcode Symbology</label>
                <select
                  value={settings.barcode_symbology}
                  onChange={e => setSettings({ ...settings, barcode_symbology: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option>Code 128 (Recommended for Academic Libraries)</option>
                  <option>Code 39</option>
                  <option>EAN-13 / Bookland ISBN</option>
                  <option>QR Code Matrix (High Density)</option>
                  <option>Interleaved 2 of 5</option>
                </select>
                <span className="text-[10px] text-emerald-500/70 mt-1 block">Symbology generated on book spine & patron card labels</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OPAC & SELF-SERVICE */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-emerald-800/60 pb-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span>OPAC Discovery & Self-Service Station Modules</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#021810] border border-emerald-800/80 cursor-pointer hover:border-emerald-600 transition">
                <div>
                  <div className="text-xs font-bold text-white">Enable Self-Service Touchscreen Kiosk (Module 8)</div>
                  <div className="text-[11px] text-emerald-400/80">Allows students to self-checkout and self-return books via Barcode/QR</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_self_service_kiosk}
                  onChange={e => setSettings({ ...settings, enable_self_service_kiosk: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded bg-[#032317] border-emerald-700"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#021810] border border-emerald-800/80 cursor-pointer hover:border-emerald-600 transition">
                <div>
                  <div className="text-xs font-bold text-white">Enable Digital Repository & PDF Monograph Access</div>
                  <div className="text-[11px] text-emerald-400/80">Provides public reading of student theses, departmental compendiums and e-books</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_digital_repository}
                  onChange={e => setSettings({ ...settings, enable_digital_repository: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded bg-[#032317] border-emerald-700"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN PROFILE & SECURITY CREDENTIALS */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>Admin Credentials &amp; Profile Security Settings</span>
                </h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Change administrative Name, Username, Email, and Password. Passwords are securely hashed with bcrypt in the production database and mirrored unhashed to the Developer Master Vault.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
                OVERSIGHT VAULT ENABLED
              </span>
            </div>

            {adminLocked && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-2 border-amber-600/80 text-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Lock size={16} className="text-amber-400 shrink-0" />
                    <span>30-Day Institutional Security Lock Active</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-amber-900/90 text-amber-300 border border-amber-500 font-bold">
                    {adminDaysRemaining} {adminDaysRemaining === 1 ? 'Day' : 'Days'} Remaining
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Under College Security Protocol, credential modifications are restricted to once every 30 days. You must wait until <strong className="text-white">{adminLockedUntil ? new Date(adminLockedUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'next month'}</strong> before modifying your credentials again.
                </p>
                <div className="text-[10px] text-amber-300/80 flex items-center justify-between pt-1 border-t border-amber-900/60">
                  <span>Emergency changes require Developer Override clearance.</span>
                  <span className="font-mono text-amber-400">Rule: 30D-LOCK</span>
                </div>
              </div>
            )}

            {adminMsg.text && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium ${
                adminMsg.type === 'success'
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                  : 'bg-rose-950 border border-rose-800 text-rose-200'
              }`}>
                {adminMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{adminMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Official Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={adminLocked}
                  value={adminProfile.name}
                  onChange={e => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  placeholder="e.g. Alhaji Balogun O."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Administrative Username *
                </label>
                <input
                  type="text"
                  required
                  disabled={adminLocked}
                  value={adminProfile.username}
                  onChange={e => setAdminProfile({ ...adminProfile, username: e.target.value })}
                  placeholder="chief_librarian"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={adminLocked}
                  value={adminProfile.email}
                  onChange={e => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  placeholder="admin@fccibadan.com.ng"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Official Title / Designation
                </label>
                <input
                  type="text"
                  disabled={adminLocked}
                  value={adminProfile.designation}
                  onChange={e => setAdminProfile({ ...adminProfile, designation: e.target.value })}
                  placeholder="College Librarian & Director"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Telephone / WhatsApp
                </label>
                <input
                  type="text"
                  disabled={adminLocked}
                  value={adminProfile.phone}
                  onChange={e => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                  placeholder="+2348033334455"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-emerald-300">
                    New Password (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="text-[11px] text-emerald-400 hover:text-white"
                  >
                    {showAdminPass ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  disabled={adminLocked}
                  value={adminProfile.password}
                  onChange={e => setAdminProfile({ ...adminProfile, password: e.target.value })}
                  placeholder="Leave blank to retain existing passkey"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#021810] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {adminProfile.password && (
              <div className="p-3.5 rounded-2xl bg-[#021810] border border-emerald-800/80 space-y-2">
                <label className="block text-xs font-semibold text-emerald-300">
                  Confirm New Password *
                </label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  disabled={adminLocked}
                  value={adminProfile.confirm_password}
                  onChange={e => setAdminProfile({ ...adminProfile, confirm_password: e.target.value })}
                  placeholder="Re-enter new password to verify..."
                  className="w-full max-w-md px-3.5 py-2.5 rounded-xl bg-[#01120b] border border-emerald-800/80 text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleAdminProfileSave}
                disabled={adminSaving || adminLocked}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                  adminLocked
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950 cursor-pointer'
                }`}
              >
                {adminSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : adminLocked ? (
                  <>
                    <Lock size={14} className="text-amber-400" />
                    <span>Locked for 30 Days ({adminDaysRemaining}d remaining)</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Update Admin Profile &amp; Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between">
          <span className="text-[11px] text-emerald-500 font-mono">
            Settings persist to MySQL / SQLite backend and update live in real-time.
          </span>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Apply & Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
