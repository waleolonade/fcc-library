import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, ShieldCheck, Lock, RefreshCw, X, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, Sparkles, Mail, Clipboard
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

import { getApiBase } from '../api/libraryApi';

export default function TwoFactorOtpModal({
  isOpen = false,
  challengeId = '',
  role = 'admin',
  userName = 'Authorized Staff',
  maskedDestination = '',
  onVerifySuccess,
  onVerified,
  onClose
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError('');
      setTimeLeft(600);
      setRemainingAttempts(5);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Two-Factor verification code has expired. Please re-enter your credentials.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    sounds.playClick();

    const triggerSuccess = (userData, tokenData) => {
      sounds.playSuccessChime();
      const callback = onVerified || onVerifySuccess;
      if (callback) {
        callback({
          user: userData,
          token: tokenData
        });
      }
    };

    try {
      const payload = {
        challenge_id: challengeId,
        otp: cleanOtp
      };

      let res;
      const endpoint = `${getApiBase()}/auth/otp/verify-login-otp`;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (proxyErr) {
        const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/otp/verify-login-otp`;
        res = await fetch(directApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (res && res.ok && data.success) {
        triggerSuccess(data.user, data.token);
        return;
      }

      sounds?.playErrorBuzz?.();
      const err = data.error || 'Access Denied: Incorrect Two-Factor OTP code. Please check your email.';
      setError(err);
      setRemainingAttempts((prev) => Math.max(0, prev - 1));
    } catch (err) {
      sounds?.playErrorBuzz?.();
      setError('Connection failure while verifying OTP with campus server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#021810] border-2 border-emerald-500/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-emerald-50 space-y-5 ring-2 ring-emerald-500/30">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-950/80 transition"
            title="Cancel authentication"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-950">
            <Lock size={26} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/80 text-[10px] font-mono text-emerald-300 uppercase font-bold tracking-wider">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>Strict 2FA Gate Required</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {role === 'developer'
              ? 'Developer Master Authentication'
              : role === 'hod'
              ? 'HOD Department Console 2FA'
              : role === 'hod_staff'
              ? 'Department Staff 2FA Verification'
              : 'Chief Librarian & Admin 2FA Gate'}
          </h2>
          <p className="text-xs text-emerald-300/80 max-w-xs mx-auto">
            Access to this console is strictly protected. Please enter the 6-digit OTP code sent to your registered device.
          </p>
        </div>

        {/* User Identity Details Card */}
        <div className="p-3.5 rounded-2xl bg-[#01140d] border border-emerald-900/80 text-xs space-y-1.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400/80 font-medium">Authenticating User:</span>
            <span className="text-white font-bold">{userName}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-400/80">Delivered To:</span>
            <span className="font-mono text-emerald-300 font-semibold">
              {maskedDestination || 'Registered Institution Contact'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-900/60">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock size={11} /> Code Expiry:
            </span>
            <span className="font-mono text-amber-400 font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Real Live Email Delivery Confirmation Banner */}
        <div className="p-3 rounded-2xl bg-[#032317] border border-emerald-700/60 text-xs flex items-center gap-2.5 text-emerald-200">
          <Mail size={16} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            A 6-digit security verification code has been dispatched to <strong className="text-white font-mono">{maskedDestination || 'your registered institutional email'}</strong>. Please check your email inbox to enter your code.
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2 animate-shake">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-center text-xs font-bold text-emerald-300 mb-2 uppercase tracking-wider">
              Enter 6-Digit One-Time Password
            </label>
            <input
              ref={inputRef}
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              required
              disabled={timeLeft <= 0 || remainingAttempts <= 0}
              className="w-full bg-[#01140d] border-2 border-emerald-700/80 focus:border-emerald-400 rounded-2xl py-3 px-3 text-center text-2xl tracking-[0.6em] text-white placeholder-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 font-mono font-bold transition"
            />
            <div className="flex justify-center mt-2.5">
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
                    setError('Clipboard access not granted. Please paste code directly into the input field.');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#032317] hover:bg-emerald-950 border border-emerald-700/80 text-[11px] font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Paste 6-digit OTP copied from your email"
              >
                <Clipboard size={13} className="text-emerald-400" />
                <span>Paste Copied Code from Email</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || timeLeft <= 0 || remainingAttempts <= 0 || otp.trim().length !== 6}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Verifying with Cryptographic Server…</span>
              </>
            ) : (
              <>
                <span>Authorize & Unlock Dashboard</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-emerald-500/70 font-mono">
          STRICT SECURITY PROTOCOL: Dashboard access is rejected if the code is invalid or expired.
        </p>
      </div>
    </div>
  );
}
