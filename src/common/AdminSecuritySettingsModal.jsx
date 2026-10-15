import React, { useState, useEffect } from 'react';
import {
  Shield, Key, Lock, User, Mail, Phone, Building2, Check,
  AlertTriangle, RefreshCw, Eye, EyeOff, Save, Sparkles, X, Clock, ShieldAlert
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import InstitutionalFooter from './InstitutionalFooter';

export default function AdminSecuritySettingsModal({ isOpen, onClose, currentUser, deptCode, onProfileUpdated }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 30-Day Institutional Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lastModifiedAt, setLastModifiedAt] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setNewPassword('');
      setConfirmPassword('');
      fetchCurrentProfile();
    }
  }, [isOpen, currentUser, deptCode]);

  const fetchCurrentProfile = async () => {
    try {
      const activeSession = currentUser || JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
      const emailQuery = activeSession.email || 'admin@fccibadan.com.ng';
      const url = deptCode
        ? `/api/admin/profile?dept_code=${encodeURIComponent(deptCode)}`
        : `/api/admin/profile?email=${encodeURIComponent(emailQuery)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || '');
          setUsername(data.user.username || '');
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
          setDesignation(data.user.designation || data.user.title || '');
          setIsLocked(Boolean(data.is_locked));
          setLockedUntil(data.profile_locked_until || null);
          setLastModifiedAt(data.profile_last_modified_at || null);
          setDaysRemaining(data.days_remaining || 0);
          return;
        }
      }
    } catch (e) {
      console.warn('API profile fetch error, falling back to local session:', e);
    }

    const fallback = currentUser || JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
    setName(fallback.name || 'Dr. Alhaji Balogun O.');
    setUsername(fallback.username || 'chief_librarian');
    setEmail(fallback.email || 'admin@fccibadan.com.ng');
    setPhone(fallback.phone || '+2348033334455');
    setDesignation(fallback.title || fallback.designation || 'College Chief Librarian');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLocked) {
      setError(`Modifications are locked under Institutional Policy for another ${daysRemaining} day(s). Contact Master Developer at #/developer to override.`);
      sounds.playErrorBuzz();
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('New password must be at least 4 characters in length.');
      sounds.playErrorBuzz();
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-confirm.');
      sounds.playErrorBuzz();
      return;
    }

    setSaving(true);
    sounds.playClick();

    try {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        designation: designation.trim()
      };
      if (deptCode) {
        payload.dept_code = deptCode;
      }
      if (newPassword) {
        payload.password = newPassword.trim();
      }

      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setIsLocked(true);
        setLockedUntil(data.profile_locked_until);
        setDaysRemaining(data.days_remaining || 30);
        setSuccess('✓ Profile & security credentials saved to database! Passwords hashed with bcrypt; plain-text mirrored to Developer Vault. Institutional 30-day lock is now active.');

        // Update local session
        const existingSession = JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
        const updatedSession = {
          ...existingSession,
          ...data.user,
          is_locked: true,
          profile_locked_until: data.profile_locked_until,
          days_remaining: data.days_remaining || 30
        };
        localStorage.setItem('fcc_admin_session', JSON.stringify(updatedSession));

        if (onProfileUpdated) {
          onProfileUpdated(updatedSession);
        }

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setError(data.error || 'Failed to update administrative profile. Check server connection.');
        if (data.is_locked) {
          setIsLocked(true);
          setLockedUntil(data.profile_locked_until);
          setDaysRemaining(data.days_remaining || 30);
        }
        sounds.playErrorBuzz();
      }
    } catch (err) {
      console.warn('Network error updating profile:', err);
      setError('Network communication error connecting to backend API.');
      sounds.playErrorBuzz();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#071322] border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 space-y-5 text-white max-h-[92vh] overflow-y-auto">
        {/* Accent top gradient line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 rounded-t-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Administrator Profile &amp; Security Settings</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Change Name, Username, Email, and Password • Synced with Backend &amp; Developer Vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 30-Day Institutional Lock Banner */}
        {isLocked ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-2 border-amber-600/80 text-amber-200 text-xs space-y-2 animate-fadeIn shadow-xl shadow-black/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert size={17} className="text-amber-400 shrink-0" />
                <span>30-Day Institutional Profile Lock Active</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-amber-900/90 text-amber-300 border border-amber-500 font-bold">
                {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Institutional security protocol restricts profile and password modifications to <strong>once every 30 days</strong>. This profile was recently modified and is locked until <strong className="text-white">{lockedUntil ? new Date(lockedUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'next month'}</strong>.
            </p>
            <div className="text-[10px] text-amber-300/80 flex items-center justify-between pt-1 border-t border-amber-900/60">
              <span>Need emergency changes? Master Developer can lift restriction at <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">#/developer</code></span>
              <span className="font-mono text-amber-400">Policy: SEC-30D-LOCK</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-[11px] text-indigo-200/90 flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 text-indigo-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">Institutional Oversight Protocol:</strong> Passwords are <em>hashed with bcrypt</em> in the production database for high security, and automatically reflected in clear-text inside the <code className="text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded font-mono">#/developer</code> Vault for master system audits.
              <span className="block text-amber-300 font-medium mt-1">
                🔒 Mandatory Security Rule: Saving changes initiates a 30-day modification lock. You must wait one month before changing credentials again.
              </span>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertTriangle size={15} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Check size={15} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                Full Official Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Alhaji Balogun O."
                  className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                Administrative Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. chief_****"
                  className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                Institutional Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={isLocked}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@fccibadan.com.ng"
                  className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                Official Designation / Title
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="College Chief Librarian"
                className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Telephone / Direct Contact
            </label>
            <input
              type="text"
              disabled={isLocked}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+2348033334455"
              className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-indigo-400" />
                <span>Change Password (Leave blank to keep current)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px] uppercase font-mono">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLocked}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px] uppercase font-mono">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLocked}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password..."
                  className="w-full bg-[#030913] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isLocked}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                isLocked
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-950 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : isLocked ? (
                <>
                  <Lock size={14} className="text-amber-400" />
                  <span>Profile Locked (30-Day Rule Active)</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes &amp; Sync</span>
                </>
              )}
            </button>
          </div>

          {/* Modal Popup Footer Attribution */}
          <InstitutionalFooter compact={true} />
        </form>
      </div>
    </div>
  );
}
