import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle, Smartphone } from 'lucide-react';
import { QrCodeSvg } from '../common/BarcodeQrStudio';
import { sounds } from '../utils/soundEffects';

const API = import.meta.env.VITE_API_BASE_URL || '';
// Public URL the phone should open so phones on any network connect to the official domain.
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || 'https://fccibadanlibrary.com.ng';
const POLL_INTERVAL_MS = 1500;

/** JSON request with fallback to the backend port when the dev proxy is unavailable. */
async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  let res;
  try {
    res = await fetch(`${API}${path}`, init);
  } catch {
    res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000${path}`, init);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed. Please try again.');
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Workstation QR login (shared library computer).
 * Shows an anonymous QR code — no student details are ever displayed on this screen.
 * When a phone verifies Matric No + PIN + registered phone number, this screen signs in automatically.
 */
export function QrPhoneLogin({ onLogin, onBack }) {
  const [challenge, setChallenge] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | waiting | approved | error
  const [error, setError] = useState('');
  const consumedRef = useRef(false);

  const createChallenge = useCallback(async () => {
    setStatus('loading');
    setError('');
    consumedRef.current = false;
    try {
      const clientUrl = PUBLIC_APP_URL || window.location.origin;
      const data = await apiRequest('/api/auth/qr-login/create', { method: 'POST', body: { clientUrl } });
      setChallenge(data);
      setStatus('waiting');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    createChallenge();
  }, [createChallenge]);

  // Poll for approval from the phone; auto-refresh the QR when it expires or is rejected.
  useEffect(() => {
    if (!challenge || status !== 'waiting') return undefined;
    let active = true;
    let timer;

    const poll = async () => {
      try {
        const data = await apiRequest(
          `/api/auth/qr-login/status/${encodeURIComponent(challenge.challengeId)}`,
          { headers: { 'X-QR-Poll-Token': challenge.pollToken } }
        );
        if (!active) return;

        if (data.status === 'approved' && !consumedRef.current) {
          consumedRef.current = true;
          setStatus('approved');
          const auth = await apiRequest('/api/auth/qr-login/consume', {
            method: 'POST',
            body: { challengeId: challenge.challengeId, pollToken: challenge.pollToken },
          });
          if (!active) return;
          sounds.playSuccessChime();
          onLogin(auth.user, auth.accessToken);
          return;
        }

        if (['expired', 'denied', 'consumed'].includes(data.status)) {
          createChallenge();
          return;
        }
      } catch {
        // Transient network issue: keep polling.
      }
      if (active) timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [challenge, status, onLogin, createChallenge]);

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-emerald-800 bg-[#031b13] p-5 text-white shadow-2xl space-y-4 text-center">
      <div>
        <h2 className="text-base font-bold tracking-wide">Sign in with QR Code</h2>
        <p className="text-xs text-emerald-300 mt-1">
          Scan with your phone, then enter your Matric No, PIN and registered phone number.
        </p>
      </div>

      <div className="mx-auto w-fit rounded-2xl bg-white p-3.5 shadow-2xl min-h-[238px] min-w-[238px] flex items-center justify-center">
        {status === 'waiting' && challenge ? (
          <QrCodeSvg value={challenge.qrUrl} size={210} />
        ) : status === 'approved' ? (
          <CheckCircle size={64} className="text-emerald-600" />
        ) : (
          <RefreshCw size={36} className="text-slate-400 animate-spin" />
        )}
      </div>

      <p className="text-xs font-mono text-emerald-300 flex items-center justify-center gap-2" role="status">
        {status === 'loading' && 'Preparing secure QR code…'}
        {status === 'waiting' && (<><Smartphone size={13} /> Waiting for phone verification…</>)}
        {status === 'approved' && 'Verified. Signing you in…'}
      </p>

      {status === 'error' && (
        <div role="alert" className="flex gap-2 rounded-xl border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-200 text-left">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={createChallenge} className="underline font-semibold">Retry</button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-xl border border-emerald-900/80 bg-black/40 hover:bg-emerald-950 px-3 py-2 text-xs text-emerald-300 hover:text-white transition flex items-center justify-center gap-1.5"
      >
        <ArrowLeft size={13} />
        <span>Back to Matric + PIN Login</span>
      </button>
    </section>
  );
}

/**
 * Phone verification page (opened by scanning the workstation QR, route: /qr-approve).
 * Verifies College Matriculation Number + 4-digit PIN + phone number against the database.
 */
export function QrPhoneApprovalPage({ onLogin, onBackToLogin }) {
  const query = window.location.search || (window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '');
  const params = new URLSearchParams(query);
  const challengeId = params.get('challenge') || '';
  const scanToken = params.get('token') || '';

  const [form, setForm] = useState({ matric: '', pin: '', phone: '' });
  const [phase, setPhase] = useState('checking'); // checking | form | done | invalid
  const [error, setError] = useState('');
  const [phoneMismatch, setPhoneMismatch] = useState(false);
  const [busy, setBusy] = useState(false);

  // Connect to the workstation session immediately after scanning.
  useEffect(() => {
    if (!challengeId || !scanToken) {
      setError('This QR link is incomplete. Scan the QR code shown on the library workstation.');
      setPhase('invalid');
      return;
    }
    const qs = `challengeId=${encodeURIComponent(challengeId)}&scanToken=${encodeURIComponent(scanToken)}`;
    apiRequest(`/api/auth/qr-login/phone/details?${qs}`)
      .then((d) => {
        if (d.status !== 'waiting') throw new Error('This QR code has already been used. Scan the new code on the workstation.');
        setPhase('form');
      })
      .catch((e) => {
        setError(e.message);
        setPhase('invalid');
      });
  }, [challengeId, scanToken]);

  const update = (field) => (e) => {
    const value = field === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'phone') setPhoneMismatch(false);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setPhoneMismatch(false);
    try {
      const res = await apiRequest('/api/auth/qr-login/phone/verify-and-approve', {
        method: 'POST',
        body: { challengeId, scanToken, matric: form.matric.trim().toUpperCase(), pin: form.pin, phone: form.phone.trim() },
      });
      setForm({ matric: '', pin: '', phone: '' });
      setPhase('done');
      sounds.playSuccessChime();

      // Automatically log in on mobile device too
      if (res && res.user) {
        localStorage.setItem('fcc_student_session', JSON.stringify(res.user));
        if (res.accessToken) {
          localStorage.setItem('fcc_access_token', res.accessToken);
        }
        setTimeout(() => {
          if (onLogin) {
            onLogin(res.user, res.accessToken);
          } else {
            window.location.hash = '#/scholar/profile';
            window.location.reload();
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
      setPhoneMismatch(Boolean(err.data?.phoneMismatch));
      if ([409, 410, 429].includes(err.status) || /expired|already|Too many/i.test(err.message)) setPhase('invalid');
      sounds.playErrorBuzz();
    } finally {
      setBusy(false);
    }
  }

  const goHome = () => (onBackToLogin ? onBackToLogin() : window.location.assign('/#/login'));
  const inputClass = 'w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm font-mono text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        <header className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="rounded-2xl bg-emerald-900/80 p-3 text-emerald-400 border border-emerald-700/60">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Verify Library Sign-in</h1>
            <p className="text-xs text-emerald-400">Federal Cooperative College Ibadan</p>
          </div>
        </header>

        {phase === 'checking' && (
          <p className="text-sm text-slate-300 flex items-center justify-center gap-2 py-6">
            <RefreshCw size={16} className="animate-spin" /> Connecting to workstation…
          </p>
        )}

        {phase === 'form' && (
          <form onSubmit={submit} className="space-y-4" autoComplete="off">
            <div className="space-y-1">
              <label htmlFor="qr-matric" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">College Matriculation Number</label>
              <input id="qr-matric" required value={form.matric} onChange={update('matric')} placeholder="e.g. FCC/CEM/2024/042" className={`${inputClass} uppercase`} />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-pin" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Student 4-Digit Security PIN</label>
              <input id="qr-pin" required type="password" inputMode="numeric" value={form.pin} onChange={update('pin')} placeholder="••••" className={`${inputClass} text-center tracking-widest`} />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-phone" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Phone Number on this Device</label>
              <input id="qr-phone" required type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} placeholder="e.g. 080XXXXXXXX" className={`${inputClass} ${phoneMismatch ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}`} />
              <p className="text-[11px] text-slate-400">Must match the phone number registered for your account.</p>
            </div>
            <button
              id="qr-verify-submit"
              type="submit"
              disabled={busy || form.pin.length < 4}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 p-3.5 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {busy ? <><RefreshCw size={16} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={18} /> Verify &amp; Sign In</>}
            </button>
          </form>
        )}

        {phase === 'done' && (
          <div className="text-center space-y-3 py-4">
            <CheckCircle size={56} className="mx-auto text-emerald-400 animate-bounce" />
            <h2 className="text-lg font-bold">✓ Phone Number Verified!</h2>
            <p className="text-xs text-slate-300">
              Access granted. Automatically logging into your Scholar Dashboard on both this phone and the library workstation…
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 pt-1">
              <RefreshCw size={13} className="animate-spin" />
              <span>Entering Scholar Portal…</span>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex gap-2 rounded-xl border border-rose-900 bg-rose-950/70 p-3 text-xs text-rose-200 leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {phase === 'invalid' && (
          <button type="button" onClick={goHome} className="w-full py-2.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition">
            Return to Library Portal
          </button>
        )}
      </section>
    </main>
  );
}
