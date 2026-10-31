import React, { useState, useEffect } from 'react';
import {
  X, KeyRound, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft,
  RefreshCw, Lock, Mail, User, Phone, Sparkles, Building2, GraduationCap, Clipboard
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { getApiBase } from '../api/libraryApi';

export default function ForgotPasswordModal({
  isOpen = false,
  initialRole = 'admin',
  initialIdentifier = '',
  onClose,
  onResetSuccess
}) {
  const [role, setRole] = useState(() => {
    return ['admin', 'hod', 'student'].includes(initialRole) ? initialRole : 'admin';
  });
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [step, setStep] = useState(1); // 1: Identifier | 2: OTP | 3: New Password/PIN | 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetChallengeId, setResetChallengeId] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [userName, setUserName] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Synchronize when dialog opens with caller's initial role & identifier
  useEffect(() => {
    if (isOpen) {
      const validRole = ['admin', 'hod', 'student'].includes(initialRole) ? initialRole : 'admin';
      setRole(validRole);
      setIdentifier(initialIdentifier || '');
      setStep(1);
      setError('');
      setOtp('');
      setNewCredential('');
      setConfirmCredential('');
    }
  }, [isOpen, initialRole, initialIdentifier]);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please provide your Matriculation Number, Staff Email, or Department Code.');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      const res = await fetch(`${getApiBase()}/auth/password-reset/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), role })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setResetChallengeId(data.reset_challenge_id);
        setMaskedTarget(data.masked_target || '');
        setUserName(data.user_name || '');
        setStep(2);
      } else {
        sounds.playErrorBuzz();
        setError(data.error || 'Account not found. Please verify your details.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setError('Unable to reach server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      const res = await fetch(`${getApiBase()}/auth/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_challenge_id: resetChallengeId,
          otp: otp.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setVerifiedToken(data.verified_token);
        setStep(3);
      } else {
        sounds.playErrorBuzz();
        setError(data.error || 'Incorrect OTP code. Please check and try again.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setError('Verification failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Confirm New Password / PIN
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');

    const isPin = role === 'student' || role === 'hod';
    const minLen = isPin ? 4 : 6;

    if (newCredential.length < minLen) {
      setError(isPin ? 'Security PIN must be at least 4 digits.' : 'Password must be at least 6 characters.');
      return;
    }

    if (newCredential !== confirmCredential) {
      setError('Passwords / PINs do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      const res = await fetch(`${getApiBase()}/auth/password-reset/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_token: verifiedToken,
          new_credential: newCredential
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setStep(4);
        if (onResetSuccess) {
          onResetSuccess();
        }
      } else {
        sounds.playErrorBuzz();
        setError(data.error || 'Failed to update credentials. Please retry.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setError('Could not update credentials. Check network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#021810] border border-emerald-600/70 rounded-3xl shadow-2xl p-6 sm:p-7 text-emerald-50 space-y-5 ring-1 ring-emerald-500/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-950/80 transition"
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-md">
            <KeyRound size={22} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {step === 4 ? 'Credentials Updated' : 'Reset Password / Security PIN'}
          </h2>
          <p className="text-xs text-emerald-400/80 max-w-xs mx-auto">
            {step === 1 && 'Identify your institutional account to receive a verified 6-digit OTP.'}
            {step === 2 && `Enter the 6-digit OTP code sent to ${maskedTarget || 'your registered contact'}.`}
            {step === 3 && 'Choose a new, secure credentials code for your account.'}
            {step === 4 && 'Your security credentials have been updated successfully!'}
          </p>
        </div>

        {/* Institutional Role Selector Tabs (Only on Step 1, Dev completely removed) */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#01140d] border border-emerald-900/60 rounded-2xl text-[11px] font-medium text-center">
            {[
              { id: 'admin', label: 'Administrator', icon: Lock },
              { id: 'hod', label: 'Department HOD', icon: Building2 },
              { id: 'student', label: 'Scholar / Student', icon: GraduationCap }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = role === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setRole(tab.id);
                    setError('');
                  }}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950 ring-1 ring-emerald-400'
                      : 'text-emerald-300/60 hover:text-white hover:bg-emerald-950/60'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-emerald-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2 animate-shake">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: IDENTITY LOOKUP FORM                                  */}
        {/* ============================================================== */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {role === 'admin' && 'Staff Institutional Email or Administrator Username'}
                {role === 'hod' && 'Department Code or HOD Email (e.g. CSC, BAM)'}
                {role === 'student' && 'Student Matriculation Number or Barcode'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'e.g. librarian@fccibadanlibrary.com.ng or admin'
                      : role === 'hod'
                      ? 'e.g. CSC or okonjo.hod@fccibadan.edu.ng'
                      : 'e.g. FCC/CSC/2026/409'
                  }
                  required
                  autoFocus
                  className="w-full bg-[#01140d] border border-emerald-800/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-emerald-400/70 mt-1.5 font-sans">
                {role === 'admin' && 'A 6-digit OTP will be dispatched to your registered institutional staff email.'}
                {role === 'hod' && 'A 6-digit OTP will be dispatched to the official academic department HOD email.'}
                {role === 'student' && 'A 6-digit OTP will be dispatched to your registered student email / phone.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Looking up account…</span>
                </>
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 2: ENTER OTP CODE                                         */}
        {/* ============================================================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#01140d] border border-emerald-900/60 text-xs text-emerald-300/90 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Account Verified:</span>
                <span className="text-white font-bold">{userName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Delivered to:</span>
                <span className="font-mono text-emerald-400">{maskedTarget}</span>
              </div>
            </div>

            {/* Real Live Email Delivery Confirmation Banner */}
            <div className="p-3 rounded-2xl bg-[#032317] border border-emerald-700/60 text-xs flex items-center gap-2.5 text-emerald-200">
              <Mail size={16} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                A 6-digit password reset verification code has been dispatched to <strong className="text-white font-mono">{maskedTarget || 'your registered email'}</strong>. Please check your inbox.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                required
                autoFocus
                className="w-full bg-[#01140d] border border-emerald-800/80 rounded-2xl py-3 px-3.5 text-center text-lg tracking-[0.5em] text-white placeholder-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              />
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      const digits = (text || '').replace(/\D/g, '').slice(0, 6);
                      if (digits.length === 6) {
                        setOtp(digits);
                        sounds.playSuccessChime();
                      } else if (digits.length > 0) {
                        setOtp(digits);
                        sounds.playClick();
                      } else {
                        setError('Clipboard does not contain a 6-digit code. Please click to copy from your email.');
                        sounds.playErrorBuzz();
                      }
                    } catch (e) {
                      setError('Clipboard access not granted. Please enter the code directly.');
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-[#032317] hover:bg-emerald-950 border border-emerald-700/80 text-[11px] font-semibold text-emerald-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Paste 6-digit OTP copied from your email"
                >
                  <Clipboard size={12} className="text-emerald-400" />
                  <span>Paste Copied Code from Email</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-3 rounded-2xl bg-[#01140d] hover:bg-emerald-950 border border-emerald-800/80 text-xs font-semibold text-emerald-300 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <span>Verify Code</span>}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 3: SET NEW PASSWORD OR PIN                               */}
        {/* ============================================================== */}
        {step === 3 && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                {role === 'student' || role === 'hod' ? 'New 4-Digit Security PIN' : 'New Password (min 6 chars)'}
              </label>
              <input
                type={showPassword ? 'text' : (role === 'student' || role === 'hod' ? 'number' : 'password')}
                maxLength={role === 'student' || role === 'hod' ? 8 : 40}
                value={newCredential}
                onChange={(e) => setNewCredential(e.target.value)}
                placeholder={role === 'student' || role === 'hod' ? 'e.g. 1234' : '••••••••'}
                required
                autoFocus
                className="w-full bg-[#01140d] border border-emerald-800/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                Confirm {role === 'student' || role === 'hod' ? 'Security PIN' : 'Password'}
              </label>
              <input
                type={showPassword ? 'text' : (role === 'student' || role === 'hod' ? 'number' : 'password')}
                maxLength={role === 'student' || role === 'hod' ? 8 : 40}
                value={confirmCredential}
                onChange={(e) => setConfirmCredential(e.target.value)}
                placeholder={role === 'student' || role === 'hod' ? 'Confirm 4-digit PIN' : 'Confirm password'}
                required
                className="w-full bg-[#01140d] border border-emerald-800/80 rounded-2xl py-2.5 px-3.5 text-xs text-white placeholder-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-credential-toggle"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-emerald-800 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="show-credential-toggle" className="text-[11px] text-emerald-400 cursor-pointer">
                Show credentials
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Updating Database…</span>
                </>
              ) : (
                <>
                  <span>Save New Credentials</span>
                  <CheckCircle2 size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 4: SUCCESS CONFIRMATION                                   */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Successful!</h3>
              <p className="text-xs text-emerald-300/80 mt-1">
                Your new {role === 'student' || role === 'hod' ? 'Security PIN' : 'Password'} has been securely updated in the Federal Co-operative College database.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
            >
              Back to Login Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
