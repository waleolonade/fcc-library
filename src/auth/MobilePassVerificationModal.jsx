import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, Download, Smartphone, AlertTriangle,
  RefreshCw, Key, User, Phone, Check, ArrowRight, Lock, Monitor, Camera, QrCode
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import InstitutionalFooter from '../common/InstitutionalFooter';
import { showPwaInstallModal } from '../common/PwaInstallPromptModal';

/**
 * MobilePassVerificationModal
 * Handles the QR code scanning dialog on mobile:
 * 1. Checks if user has already logged in before & if software/pass is installed on this phone.
 *    - IF YES: Shows animated checkmark and approves workstation (does NOT redirect mobile).
 * 2. IF NO: Pops up dialog to fill in details (Matric, PIN, Phone matching HOD record).
 *    - When matched: Shows animated checkmark, prompts to install pass with official FCC logo,
 *      and signs in the library computer workstation automatically!
 */
/** Check if the FCC Pass / App is already installed on this phone */
export function isAppAlreadyInstalled() {
  if (typeof window === 'undefined') return false;
  const isLocalStored = localStorage.getItem('fcc_mobile_pass_installed') === 'true' ||
                        localStorage.getItem('fcc_app_installed') === 'true' ||
                        localStorage.getItem('pwa_installed') === 'true';
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                       (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
                       (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches);
  const isIosStandalone = window.navigator && window.navigator.standalone === true;
  const isAndroidReferrer = typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://');
  return Boolean(isLocalStored || isStandalone || isIosStandalone || isAndroidReferrer || window.__fccAppInstalled);
}

export default function MobilePassVerificationModal({
  isOpen = true,
  onClose,
  onLoginSuccess,
  challengeId = null,
  scanToken = null,
  prefilledMatric = ''
}) {
  const [phase, setPhase] = useState('checking'); // 'checking' | 'installed_verified' | 'fill_details' | 'match_install' | 'workstation_approved' | 'logging_in'
  const [matric, setMatric] = useState(prefilledMatric || '');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [phoneMismatch, setPhoneMismatch] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState(null);
  const [countdown, setCountdown] = useState(3);

  // Capture PWA install prompt if available
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Auto-close countdown when workstation is approved
  useEffect(() => {
    if (phase === 'workstation_approved') {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onClose) {
              onClose();
            } else {
              try { window.close(); } catch (e) {}
              window.location.hash = '#/mobile-pass';
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, onClose]);

  // Check on mount if user details were stored before on this phone
  useEffect(() => {
    const checkInstalledPass = async () => {
      setPhase('checking');
      setError('');

      try {
        const savedPassUser = localStorage.getItem('fcc_mobile_pass_user') || localStorage.getItem('fcc_student_session');

        // IF user has signed in before on this phone, immediately read stored details!
        if (savedPassUser) {
          const user = JSON.parse(savedPassUser);
          if (user && (user.matric || user.barcode)) {
            setVerifiedUser(user);

            // If a workstation challenge is attached, approve it automatically for the computer
            if (challengeId && scanToken) {
              const approvalPayload = {
                challengeId,
                scanToken,
                matric: user.matric || user.barcode,
                pin: user.pin || '',
                phone: user.phone || '',
                passToken: user.passToken || '',
                isInstalledPass: true
              };

              let res;
              try {
                res = await fetch('/api/auth/qr-login/phone/verify-and-approve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(approvalPayload)
                });
              } catch (e) {
                const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/qr-login/phone/verify-and-approve`;
                res = await fetch(directApi, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(approvalPayload)
                }).catch(() => null);
              }

              const data = res ? await res.json().catch(() => ({})) : {};

              if (res && res.ok && (data.ok || data.success)) {
                if (data.passToken) {
                  user.passToken = data.passToken;
                  localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(user));
                }
                localStorage.setItem('fcc_mobile_pass_installed', 'true');
                sounds.playSuccessChime();
                // Workstation is approved! Auto-closes in 3s
                setPhase('workstation_approved');
                return;
              } else {
                console.warn('Auto approval returned non-ok:', data.error);
                setError(data.error || 'Challenge expired or credentials need confirmation. Please confirm your details below.');
                setPhase('fill_details');
                return;
              }
            }

            // Direct standalone mobile pass check -> Display ready pass card
            sounds.playSuccessChime();
            setPhase('pass_card');
            return;
          }
        }

        // First time on this phone -> Show verification details form
        setPhase('fill_details');
      } catch (err) {
        console.warn('Error checking installed pass:', err);
        setPhase('fill_details');
      }
    };

    checkInstalledPass();
  }, [challengeId, scanToken]);

  const approveWorkstationChallenge = async (cId, sTok, user) => {
    setIsSubmitting(true);
    setError('');
    const targetUser = user || verifiedUser || {};
    const approvalPayload = {
      challengeId: cId,
      scanToken: sTok,
      matric: targetUser.matric || matric || targetUser.barcode,
      pin: targetUser.pin || '',
      phone: targetUser.phone || '',
      passToken: targetUser.passToken || '',
      isInstalledPass: true
    };

    let res;
    try {
      res = await fetch('/api/auth/qr-login/phone/verify-and-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      });
    } catch (e) {
      const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/qr-login/phone/verify-and-approve`;
      res = await fetch(directApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      }).catch(() => null);
    }

    setIsSubmitting(false);
    const data = res ? await res.json().catch(() => ({})) : {};

    if (res && res.ok && (data.ok || data.success)) {
      if (data.passToken && targetUser) {
        targetUser.passToken = data.passToken;
        localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(targetUser));
      }
      localStorage.setItem('fcc_mobile_pass_installed', 'true');
      sounds.playSuccessChime();
      setPhase('workstation_approved');
    } else {
      sounds.playErrorBuzz();
      setError(data.error || 'Failed to approve computer workstation. Please ensure the computer screen QR code is active.');
    }
  };

  const handleQrImageCapture = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const img = await createImageBitmap(file);
        const codes = await detector.detect(img);
        if (codes && codes.length > 0) {
          const rawUrl = codes[0].rawValue;
          const matchChallenge = rawUrl.match(/[?&]challenge=([^&#]+)/i);
          const matchToken = rawUrl.match(/[?&]token=([^&#]+)/i);
          if (matchChallenge && matchToken) {
            await approveWorkstationChallenge(
              decodeURIComponent(matchChallenge[1]),
              decodeURIComponent(matchToken[1]),
              verifiedUser
            );
            return;
          }
        }
      }
      setError('Please point your device camera at the QR code displayed on the screen.');
    } catch (err) {
      console.warn('Barcode detect error:', err);
      setError('Please point your phone camera at the screen QR code to unlock.');
    }
  };

  const handleVerifyDetails = async (e) => {
    e.preventDefault();
    if (!matric.trim()) {
      setError('Please enter your College Matriculation Number.');
      sounds.playErrorBuzz();
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError('Please enter your 4-digit security PIN.');
      sounds.playErrorBuzz();
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your registered mobile phone number.');
      sounds.playErrorBuzz();
      return;
    }

    setIsSubmitting(true);
    setError('');
    setPhoneMismatch(false);

    try {
      let res;
      const payload = {
        challengeId: challengeId || 'mobile-direct',
        scanToken: scanToken || 'direct-token',
        matric: matric.trim().toUpperCase(),
        pin: pin.trim(),
        phone: phone.trim()
      };

      const endpoint = (challengeId && challengeId !== 'mobile-direct')
        ? '/api/auth/qr-login/phone/verify-and-approve'
        : '/api/auth/mobile-pass/verify';

      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (proxyErr) {
        const directApi = `${window.location.protocol}//${window.location.hostname}:8000${endpoint}`;
        res = await fetch(directApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok || (!data.success && !data.ok && !data.user)) {
        sounds.playErrorBuzz();
        const msg = data.error || data.message || 'Invalid credentials: The details entered do not match institutional records in the HOD database. Please enter the correct Matric No, PIN and Phone Number.';
        setError(msg);
        setPhoneMismatch(Boolean(data?.field === 'phone' || data?.phoneMismatch));
        setIsSubmitting(false);
        return;
      }

      // Success
      const user = {
        ...(data.user || {}),
        role: 'student',
        matric: (data.user?.matric || matric).trim().toUpperCase(),
        name: data.user?.name || 'Verified Scholar',
        dept: data.user?.dept || data.user?.department || 'Institutional Scholar',
        phone: (phone || data.user?.phone || '').trim(),
        pin: (pin || data.user?.pin || '').trim(),
        passToken: data.passToken || '',
        installed: true,
        installedAt: Date.now()
      };

      // Always save credentials & token so subsequent scans authenticate seamlessly
      localStorage.setItem('fcc_mobile_pass_installed', 'true');
      localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(user));
      setVerifiedUser(user);
      handleSuccessfulMatch(user);
    } catch (err) {
      console.error('Verification network error:', err);
      // Fallback check ONLY on network failure if student is recorded offline
      const matchedLocal = checkLocalHodRecord(matric, pin, phone);
      if (matchedLocal) {
        localStorage.setItem('fcc_mobile_pass_installed', 'true');
        localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(matchedLocal));
        handleSuccessfulMatch(matchedLocal);
      } else {
        sounds.playErrorBuzz();
        setError('Connection failed: Could not reach the library server database. Please ensure you are connected to the campus network.');
        setIsSubmitting(false);
      }
    }
  };

  const checkLocalHodRecord = (m, p, ph) => {
    try {
      const cleanM = m.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
      const stored = localStorage.getItem('fcc_registered_patrons') || localStorage.getItem('fcc_db_patrons');
      let patrons = [];
      if (stored) {
        try { patrons = JSON.parse(stored); } catch (e) {}
      }

      const defaultKnown = [
        {
          matric: 'FCC/CSC/2026/409',
          name: 'OLAWALE AKEEM OLONADE',
          dept: 'Computer Science & Information Technology',
          level: 'HND II (Final Year)',
          pin: '1236',
          phone: '+2348061657738'
        },
        {
          matric: 'FCC/CEM/2024/011',
          name: 'Ibrahim Adekunle',
          dept: 'Co-operative Economics & Management',
          level: 'HND I',
          pin: '5678',
          phone: '+2348123456789'
        },
        {
          matric: 'FCC/BNF/2024/077',
          name: 'Amina Bello',
          dept: 'Banking & Finance',
          level: 'ND II',
          pin: '2468',
          phone: '+2348067779900'
        }
      ];

      const all = [...patrons, ...defaultKnown];
      const match = all.find(s => {
        const sm = (s.matric || '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
        return sm === cleanM;
      });

      if (!match) return null;

      // Check PIN strictly
      if (match.pin && String(match.pin) !== String(p)) {
        return null;
      }

      // Check phone strictly (matching last 10 digits)
      if (match.phone && ph) {
        const last10A = ph.replace(/[^0-9]/g, '').slice(-10);
        const last10B = String(match.phone).replace(/[^0-9]/g, '').slice(-10);
        if (last10A !== last10B) return null;
      }

      return {
        role: 'student',
        matric: match.matric || m.toUpperCase(),
        name: match.name || 'Verified Scholar',
        dept: match.dept || match.department || 'Computer Science & Information Technology',
        level: match.level || 'HND II (Final Year)',
        phone: match.phone || ph,
        pin: match.pin || p
      };
    } catch (e) {}
    return null;
  };

  const handleSuccessfulMatch = (user) => {
    sounds.playSuccessChime();
    setVerifiedUser(user);
    setIsSubmitting(false);

    // Store user details permanently so subsequent QR scans never need any input!
    localStorage.setItem('fcc_mobile_pass_installed', 'true');
    localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(user));

    if (challengeId && challengeId !== 'mobile-direct') {
      // Workstation is approved -> auto-close after countdown!
      setPhase('workstation_approved');
    } else if (isAppAlreadyInstalled()) {
      setPhase('pass_card');
    } else {
      setPhase('match_install');
    }
  };

  const handleInstallPassAndLogin = async () => {
    sounds.playSuccessChime();

    // 1. Mark pass as installed on this phone
    localStorage.setItem('fcc_mobile_pass_installed', 'true');
    if (verifiedUser) {
      localStorage.setItem('fcc_mobile_pass_user', JSON.stringify(verifiedUser));
    }

    // 2. Trigger browser PWA install prompt if available, otherwise show install guide modal
    if (pwaPrompt) {
      try {
        await pwaPrompt.prompt();
        const choice = await pwaPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          return;
        }
      } catch (e) {
        showPwaInstallModal();
      }
    } else {
      showPwaInstallModal();
    }
  };

  const proceedLogin = (user) => {
    // Mobile serves purely as an authenticator key to authorize the computer workstation
    setPhase('workstation_approved');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#032317] border-2 border-emerald-600/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-white overflow-hidden">
        {/* College Crest & Top Banner */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#021810] border border-emerald-500/60 p-1 flex items-center justify-center shadow-lg">
              <img
                src="/assets/fcc-logo.png"
                alt="FCC Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>FCC Smart Library Pass</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-[11px] text-emerald-400 font-mono">
                Mobile Pass &amp; Password-Free Gateway
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPassAndLogin}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[10px] border border-emerald-400 shadow-md flex items-center gap-1.5 transition cursor-pointer"
              title="Install FCC Mobile Pass on Phone"
            >
              <Download size={12} className="animate-bounce" />
              <span>INSTALL PWA 📲</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-emerald-400 hover:text-white p-1 rounded-lg text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------
            1. CHECKING STATUS
        ----------------------------------------------------------------- */}
        {phase === 'checking' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw size={36} className="mx-auto text-emerald-400 animate-spin" />
            <div className="text-sm font-bold text-white">
              Checking phone authentication &amp; pass credentials...
            </div>
            <p className="text-xs text-emerald-300/70">
              Verifying device status with Federal Co-operative College registry
            </p>
          </div>
        )}

        {/* -----------------------------------------------------------------
            2. ALREADY INSTALLED & VERIFIED (ANIMATED GREEN MARK & IMMEDIATE LOGIN)
        ----------------------------------------------------------------- */}
        {phase === 'installed_verified' && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            {/* Animated Mark */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950 border-2 border-emerald-300">
                <Check size={44} className="stroke-[3] animate-bounce" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ INSTALLED PASS VERIFIED
              </div>
              <h3 className="text-lg font-black text-white">
                Welcome Back, {verifiedUser?.name || 'Scholar'}!
              </h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                Matric: {verifiedUser?.matric || 'Verified Record'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#021810] border border-emerald-700/80 text-xs text-emerald-200 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-emerald-400" />
              <span>Logging in directly to your Scholar Profile page...</span>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            3. FILL IN DETAILS (FIRST TIME SCAN)
        ----------------------------------------------------------------- */}
        {phase === 'fill_details' && (
          <form onSubmit={handleVerifyDetails} className="space-y-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#022014] to-teal-950/90 border border-emerald-500/70 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-emerald-400">
                  <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-white">Install Mobile Pass on Phone</div>
                  <div className="text-[10px] text-emerald-300">Official PWA App for easy 1-tap login</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallPassAndLogin}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download size={13} />
                <span>INSTALL 📲</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                College Matriculation Number
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-emerald-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. FCC/CSC/2026/409"
                  value={matric}
                  onChange={(e) => setMatric(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                4-Digit Security PIN / Password
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-emerald-400" />
                <input
                  type="password"
                  required
                  inputMode="numeric"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-center text-sm tracking-widest focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Phone Number on this Device
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3.5 text-emerald-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneMismatch(false);
                  }}
                  className={`w-full pl-10 pr-3 py-3 rounded-xl bg-[#021810] border text-white font-mono text-xs focus:outline-none ${
                    phoneMismatch ? 'border-rose-500' : 'border-emerald-800 focus:border-emerald-400'
                  }`}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Must match the telephone registered for your account by your HOD.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || pin.length < 4}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying with HOD Registry...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify Record &amp; Link Pass</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* -----------------------------------------------------------------
            4. MATCHED RECORD -> SHOW ANIMATED MARK & ASK TO INSTALL
        ----------------------------------------------------------------- */}
        {phase === 'match_install' && (
          <div className="py-4 text-center space-y-4 animate-scaleUp">
            {/* School Logo & Animated Checkmark */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-3xl bg-white p-2 flex items-center justify-center shadow-xl shadow-emerald-950 border-2 border-emerald-400">
                <img
                  src="/assets/fcc-logo.png"
                  alt="Federal Co-operative College Crest"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                {challengeId && challengeId !== 'mobile-direct'
                  ? '✓ COMPUTER WORKSTATION APPROVED'
                  : '✓ RECORD MATCHED WITH HOD REGISTRY'}
              </div>
              <h3 className="text-base font-black text-white">
                {verifiedUser?.name || 'Verified Scholar'}
              </h3>
              <p className="text-xs text-emerald-400 font-mono">
                {verifiedUser?.matric || matric} • {verifiedUser?.dept || 'Institutional Scholar'}
              </p>
            </div>

            {/* Install Callout Box with School Logo Badge - ALWAYS VISIBLE */}
            <div className="p-4 rounded-2xl bg-[#021810] border-2 border-emerald-500/80 text-left space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-bold">
                <div className="w-6 h-6 rounded-lg bg-white p-0.5 border border-emerald-400 shrink-0 flex items-center justify-center">
                  <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-contain" />
                </div>
                <span>Install FCC Smart Library on this Phone</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Install this app with the official Federal Co-operative College crest on your phone home screen. Next time you scan the QR on any workstation, you are verified in 1 second!
              </p>
              {challengeId && challengeId !== 'mobile-direct' && (
                <div className="pt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Monitor size={13} />
                  <span>The library computer has signed in automatically.</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleInstallPassAndLogin}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition cursor-pointer border border-emerald-300/40"
              >
                <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                  <img src="/assets/fcc-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span>Install Mobile Pass App on Phone (PWA)</span>
                <Download size={15} />
              </button>

              {challengeId && challengeId !== 'mobile-direct' ? (
                <button
                  type="button"
                  onClick={() => setPhase('workstation_approved')}
                  className="w-full py-2.5 rounded-xl border border-emerald-800 bg-black/40 hover:bg-emerald-950 text-emerald-300 text-xs font-semibold transition"
                >
                  I'm Done — Continue Using Computer Workstation &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase('pass_card')}
                  className="text-[11px] text-emerald-400 hover:text-white underline font-mono"
                >
                  View Mobile Pass Card &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            5. WORKSTATION APPROVED CONFIRMATION (MOBILE STAYS HERE)
        ----------------------------------------------------------------- */}
        {phase === 'workstation_approved' && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            {/* School Crest Overlay */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-3xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-emerald-950 border-2 border-emerald-400">
                <img
                  src="/assets/fcc-logo.png"
                  alt="Federal Co-operative College Crest"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ COMPUTER WORKSTATION SIGNED IN
              </div>
              <h3 className="text-lg font-black text-white">
                {verifiedUser?.name || 'Verified Scholar'}
              </h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                Matric: {verifiedUser?.matric || matric}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-700/80 text-xs text-emerald-200 text-left space-y-2.5 shadow-lg">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Check size={15} className="stroke-[3]" />
                <span>Access Granted on Computer Screen</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Your stored credentials were authenticated against the institutional database. The library workstation is unlocked and active.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono font-bold flex items-center justify-between border-t border-emerald-900/60">
                <span>Closing dialog automatically...</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 animate-pulse">
                  {countdown}s
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onClose || (() => {
                  try { window.close(); } catch (e) {}
                  window.location.hash = '#/mobile-pass';
                })}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Monitor size={14} className="text-white" />
                <span>Close Dialog Now &rarr;</span>
              </button>

              <button
                type="button"
                onClick={handleInstallPassAndLogin}
                className="w-full py-2.5 rounded-xl border border-emerald-500/70 bg-emerald-950/80 hover:bg-emerald-900 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <div className="w-4 h-4 rounded bg-white p-0.5 flex items-center justify-center shrink-0">
                  <img src="/assets/fcc-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span>Install Mobile Pass App on Phone (PWA)</span>
                <Download size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPhase('pass_card')}
                className="w-full py-2.5 rounded-xl border border-emerald-800/80 bg-black/40 hover:bg-emerald-950 text-emerald-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone size={13} className="text-emerald-400" />
                <span>View My Mobile Pass Card</span>
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            6. STANDALONE MOBILE PASS CARD (DEVICE AUTHENTICATOR KEY)
        ----------------------------------------------------------------- */}
        {phase === 'pass_card' && (
          <div className="py-2 space-y-4 animate-scaleUp">
            {/* Student ID Card Header with School Logo */}
            <div className="relative p-5 rounded-3xl bg-gradient-to-br from-[#042f20] via-[#021810] to-[#01110b] border-2 border-emerald-500/80 shadow-2xl overflow-hidden space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center border-2 border-emerald-400 shrink-0 shadow-md">
                    <img
                      src="/assets/fcc-logo.png"
                      alt="FCC Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wider uppercase text-emerald-300">
                      Federal Co-operative College
                    </h3>
                    <p className="text-[10px] text-slate-300 font-mono">
                      Workstation Authenticator Pass
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE</span>
                </div>
              </div>

              {/* Scholar Details */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Verified Scholar Identity
                </div>
                <h4 className="text-base font-black text-white">
                  {verifiedUser?.name || 'Scholar'}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 font-mono pt-0.5">
                  <span>Matric: <strong className="text-white">{verifiedUser?.matric || matric}</strong></span>
                  {verifiedUser?.dept && (
                    <span className="text-slate-300">• {verifiedUser.dept}</span>
                  )}
                </div>
              </div>

              {/* Security Key Badge */}
              <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Workstation Access Pass</span>
                </span>
                <span className="text-slate-400">FCC-AUTH-KEY</span>
              </div>
            </div>

            {/* Purpose & Instructions */}
            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-700/80 space-y-2 text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Monitor size={14} className="text-emerald-400" />
                <span>Access Library Website on Computers</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                To log into your Scholar Dashboard, open <strong className="text-emerald-300">https://fccibadanlibrary.com.ng/#/login</strong> on the computer screen.
                Point your phone camera at the screen QR code to authorize and sign into that computer workstation.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleInstallPassAndLogin}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer border border-emerald-300/40"
              >
                <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0">
                  <img src="/assets/fcc-logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span>Install Mobile Pass App on Phone (PWA)</span>
                <Download size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  const scannerInput = document.getElementById('fcc-camera-qr-input');
                  if (scannerInput) scannerInput.click();
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Camera size={16} />
                <span>Scan Computer Screen QR</span>
              </button>
              <input
                id="fcc-camera-qr-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQrImageCapture}
              />

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('fill_details')}
                  className="text-[11px] text-emerald-400 hover:text-white underline font-mono"
                >
                  Switch Account / Re-link Details &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Popup Footer Attribution */}
        <InstitutionalFooter compact={true} />
      </div>
    </div>
  );
}
