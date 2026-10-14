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

import MobilePassVerificationModal from './MobilePassVerificationModal';

/**
 * Phone verification page (opened by scanning the workstation QR, route: /qr-approve or /mobile-pass).
 * - Verifies if software/pass is already installed on phone -> Animated mark & immediate login!
 * - If first time -> Pops up dialog to fill in details, verifies against HOD database, prompts to install, and logs in!
 */
export function QrPhoneApprovalPage({ onLogin, onBackToLogin }) {
  const query = window.location.search || (window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '');
  const params = new URLSearchParams(query);
  const challengeId = params.get('challenge') || '';
  const scanToken = params.get('token') || '';
  const matric = params.get('matric') || '';

  return (
    <main className="min-h-screen bg-[#021810] px-4 py-8 text-white flex items-center justify-center">
      <MobilePassVerificationModal
        isOpen={true}
        challengeId={challengeId}
        scanToken={scanToken}
        prefilledMatric={matric}
        onClose={onBackToLogin || (() => window.location.assign('/#/login'))}
        onLoginSuccess={(user) => {
          if (onLogin) {
            onLogin(user);
          } else {
            window.location.hash = '#/scholar/profile';
            window.location.reload();
          }
        }}
      />
    </main>
  );
}
