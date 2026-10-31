import {
  AlertTriangle,
  Check,
  Eye, EyeOff,
  Lock,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  Sparkles, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiBase } from '../api/libraryApi';
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

  // Track original identifiers to match existing row during updates
  const [userId, setUserId] = useState(null);
  const [initialEmail, setInitialEmail] = useState('');
  const [initialUsername, setInitialUsername] = useState('');

  // 2-Week (14 Days) Institutional Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lastModifiedAt, setLastModifiedAt] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);

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
      const emailQuery = activeSession.email || 'admin@fccibadan.edu.ng';
      const usernameQuery = activeSession.username || '';
      const uId = activeSession.id || '';

      const queryParams = new URLSearchParams();
      if (deptCode) queryParams.append('dept_code', deptCode);
      if (emailQuery) queryParams.append('email', emailQuery);
      if (usernameQuery) queryParams.append('username', usernameQuery);
      if (uId) queryParams.append('user_id', uId);

      const url = `${getApiBase()}/admin/profile?${queryParams.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || '');
          setUsername(data.user.username || '');
          setEmail(data.user.email || '');
          setPhone(data.user.phone || '');
          setDesignation(data.user.designation || data.user.title || '');
          setUserId(data.user.id || null);
          setInitialEmail(data.user.email || '');
          setInitialUsername(data.user.username || '');
          setIsLocked(Boolean(data.is_locked));
          setLockedUntil(data.profile_locked_until || null);
          setLastModifiedAt(data.profile_last_modified_at || null);
          setDaysRemaining(data.days_remaining || 0);
          setHoursRemaining(data.hours_remaining || 0);
          setMinutesRemaining(data.minutes_remaining || 0);
          return;
        }
      }
    } catch (e) {
      console.warn('API profile fetch error, falling back to local session:', e);
    }

    const fallback = currentUser || JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
    setName(fallback.name || 'Dr. Alhaji Balogun O.');
    setUsername(fallback.username || 'chief_librarian');
    setEmail(fallback.email || 'admin@fccibadan.edu.ng');
    setPhone(fallback.phone || '+2348033334455');
    setDesignation(fallback.title || fallback.designation || 'College Chief Librarian');
    setUserId(fallback.id || 1);
    setInitialEmail(fallback.email || 'admin@fccibadan.edu.ng');
    setInitialUsername(fallback.username || 'chief_librarian');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLocked) {
      setError(`Modifications are locked under Institutional Policy for another ${daysRemaining} day(s) ${hoursRemaining}h ${minutesRemaining}m. Contact Master Developer at #/developer to override.`);
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
        user_id: userId,
        current_email: initialEmail || email.trim().toLowerCase(),
        current_username: initialUsername || username.trim(),
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

      const res = await fetch(`${getApiBase()}/admin/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setSuccess('✓ Profile and security credentials successfully saved to database! Credentials locked for two weeks (14 days).');
        setNewPassword('');
        setConfirmPassword('');
        setInitialEmail(data.user.email);
        setInitialUsername(data.user.username);
        setIsLocked(true);
        setLockedUntil(data.profile_locked_until);
        setDaysRemaining(14);
        setHoursRemaining(0);
        setMinutesRemaining(0);

        // Update local session
        const existingSession = JSON.parse(localStorage.getItem('fcc_admin_session') || '{}');
        const updatedSession = {
          ...existingSession,
          ...data.user
        };
        localStorage.setItem('fcc_admin_session', JSON.stringify(updatedSession));

        if (onProfileUpdated) {
          onProfileUpdated(updatedSession);
        }

        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(data.error || 'Failed to update administrative profile. Check server connection.');
        if (data.is_locked) {
          setIsLocked(true);
          setLockedUntil(data.profile_locked_until);
          setDaysRemaining(data.days_remaining || 14);
          setHoursRemaining(data.hours_remaining || 0);
          setMinutesRemaining(data.minutes_remaining || 0);
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
                Change Name, Username, Email, and Password • Two-Week Security Lock Protocol
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

        {/* 2-Week Institutional Lock Banner */}
        {isLocked ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-2 border-amber-600/80 text-amber-200 text-xs space-y-2 animate-fadeIn shadow-xl shadow-black/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert size={17} className="text-amber-400 shrink-0" />
                <span>2-Week Institutional Profile Lock Active</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-amber-900/90 text-amber-300 border border-amber-500 font-bold">
                {daysRemaining}d {hoursRemaining}h {minutesRemaining}m Remaining
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Institutional security protocol restricts profile and password modifications to <strong>once every 2 weeks (14 days)</strong>. This profile was recently modified and is locked until <strong className="text-white">{lockedUntil ? new Date(lockedUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'in 2 weeks'}</strong>.
            </p>
            <div className="text-[10px] text-amber-300/80 flex items-center justify-between pt-1 border-t border-amber-900/60">
              <span>Need emergency changes? Master Developer can lift restriction at <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">#/developer</code></span>
              <span className="font-mono text-amber-400">Policy: SEC-14D-LOCK</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-[11px] text-indigo-200/90 flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 text-indigo-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">Institutional Oversight Protocol:</strong> Modifications take immediate effect across Central MySQL (<code className="font-mono bg-black/40 px-1 rounded text-emerald-200">gsashtub_brainfeels_library</code>) and SQLite. Once saved, credentials are <strong>locked for 2 weeks</strong> under college anti-tampering regulations.
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
                  placeholder="@fccibadanlibrary.com.ng"
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
              placeholder="+23480****"
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
