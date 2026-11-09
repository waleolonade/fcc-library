import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, CheckCircle2, Download, Smartphone, AlertTriangle,
  RefreshCw, Key, User, Phone, Check, ArrowRight, Lock, Monitor, Camera, QrCode,
  KeyRound, Shield, LogOut, Sparkles, Building2, ExternalLink
} from 'lucide-react';
import fccLogo from '../assets/fcc-logo.png';
import { sounds } from '../utils/soundEffects';
import InstitutionalFooter from '../common/InstitutionalFooter';
import { showPwaInstallModal, getDeferredInstallPrompt } from '../common/PwaInstallPromptModal';
import ForgotPasswordModal from '../common/ForgotPasswordModal';
import {
  getDeviceProfile,
  saveDeviceProfile,
  getDeviceToken,
  saveDeviceToken,
  removeDeviceToken,
  clearAllDeviceData
} from './deviceStore';
import { clearAllAuthStores } from '../utils/authSessionManager';

/**
 * Check if the FCC Mobile Pass PWA is genuinely installed or running as an activated authenticator
 */
export function isAppAlreadyInstalled() {
  if (typeof window === 'undefined') return false;
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                       (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
                       (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches);
  const isIosStandalone = window.navigator && window.navigator.standalone === true;
  const isAndroidReferrer = typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://');
  const isSoftwareInstalled = localStorage.getItem('fcc_mobile_pass_installed') === 'true' ||
                              localStorage.getItem('fcc_app_installed') === 'true';
  return Boolean(isStandalone || isIosStandalone || isAndroidReferrer || isSoftwareInstalled);
}

/**
 * Deep verification to check if the app is installed on this device
 * (Queries standalone modes and Chromium getInstalledRelatedApps)
 */
export async function verifyAppInstalledOnPhone() {
  if (typeof window === 'undefined') return false;
  if (isAppAlreadyInstalled()) return true;

  if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
    try {
      const related = await navigator.getInstalledRelatedApps();
      if (Array.isArray(related) && related.length > 0) {
        return true;
      }
    } catch (e) {
      // Security or manifest restriction
    }
  }

  return false;
}

/**
 * MobilePassVerificationModal
 * 5-Step PWA-based QR Authentication System:
 * Step 1: First-time scan shows a small, world-class popup box prompting to install FCC Login Pass PWA.
 * Step 2: Details input for Matric Number, PIN, and Phone Number.
 * Step 3: Backend verifies all 3 details against institutional database and registers device credential into IndexedDB.
 * Step 4: Workstation terminal displays active QR challenge.
 * Step 5: Returning scan automatically approves workstation login without repeated typing!
 */
export default function MobilePassVerificationModal({
  isOpen = true,
  onClose,
  onLoginSuccess,
  challengeId = null,
  scanToken = null,
  prefilledMatric = ''
}) {
  // Phases: 'checking' | 'step1_install' | 'fill_details' | 'auto_authenticating' | 'match_install' | 'workstation_approved' | 'pass_card'
  const [phase, setPhase] = useState('checking');
  const [role, setRole] = useState('student'); // 'student' | 'admin' | 'hod'
  const [matric, setMatric] = useState(prefilledMatric || '');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [phoneMismatch, setPhoneMismatch] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState(() => getDeferredInstallPrompt());
  const [countdown, setCountdown] = useState(3);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showManualInstallGuide, setShowManualInstallGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatusText, setInstallStatusText] = useState('');

  // Capture PWA install prompt whenever available in browser
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    const handlePromptReady = () => {
      setPwaPrompt(getDeferredInstallPrompt());
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('fcc-pwa-install-ready', handlePromptReady);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('fcc-pwa-install-ready', handlePromptReady);
    };
  }, []);

  // Listen for completed PWA installation
  useEffect(() => {
    const handleAppInstalled = () => {
      setInstallSuccess(true);
      sounds.playSuccessChime();
      try { localStorage.setItem('fcc_mobile_pass_installed', 'true'); } catch (e) {}
      setTimeout(() => {
        if (verifiedUser && (verifiedUser.matric || verifiedUser.identifier)) {
          if (challengeId && scanToken) {
            approveWorkstationChallenge(challengeId, scanToken, verifiedUser);
          } else {
            setPhase('pass_card');
          }
        } else {
          setPhase('fill_details');
        }
      }, 1500);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [verifiedUser, challengeId, scanToken]);

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

  // Verify on phone if app is installed and check device vault
  useEffect(() => {
    const inspectVault = async () => {
      setPhase('checking');
      setError('');

      try {
        // Step 1: Strictly check if the app is already installed on this phone
        const isInstalled = await verifyAppInstalledOnPhone();

        // Step 2: Read stored device profile from IndexedDB or local vault
        let storedProfile = await getDeviceProfile();
        if (!storedProfile) {
          const rawLocal = localStorage.getItem('fcc_mobile_pass_vault') || localStorage.getItem('fcc_mobile_pass_user');
          if (rawLocal) {
            try { storedProfile = JSON.parse(rawLocal); } catch (e) {}
          }
        }

        if (storedProfile && (storedProfile.matric || storedProfile.barcode || storedProfile.identifier)) {
          setVerifiedUser(storedProfile);
          if (storedProfile.role) setRole(storedProfile.role);
        }

        // IF APP IS NOT INSTALLED ON THIS PHONE (e.g. opened in mobile browser via camera QR scan):
        // Always display Step 1: Install Authentication Software!
        if (!isInstalled) {
          setPhase('step1_install');
          return;
        }

        // IF APP IS INSTALLED ON THIS PHONE:
        if (storedProfile && (storedProfile.matric || storedProfile.barcode || storedProfile.identifier)) {
          // If a workstation challenge is attached -> Auto-approve computer workstation!
          if (challengeId && scanToken) {
            setPhase('auto_authenticating');
            setTimeout(() => {
              approveWorkstationChallenge(challengeId, scanToken, storedProfile);
            }, 600);
            return;
          }

          // No workstation challenge (opened installed PWA directly) -> Display active pass card
          sounds.playSuccessChime();
          setPhase('pass_card');
          return;
        }

        // App is installed, but no registered credentials yet -> Prompt for Matric, PIN, Phone
        setPhase('fill_details');
      } catch (err) {
        console.warn('Error reading device vault:', err);
        setPhase('step1_install');
      }
    };

    inspectVault();
  }, [challengeId, scanToken]);

  // Approve workstation challenge using phone's registered credentials
  const approveWorkstationChallenge = async (cId, sTok, user) => {
    setIsSubmitting(true);
    setError('');
    const targetUser = user || verifiedUser || {};
    const approvalPayload = {
      challengeId: cId,
      scanToken: sTok,
      role: targetUser.role || role || 'student',
      matric: targetUser.matric || matric || targetUser.barcode || '',
      identifier: targetUser.identifier || targetUser.matric || matric || '',
      pin: targetUser.pin || pin || '',
      credential: targetUser.pin || targetUser.password || pin || '',
      phone: targetUser.phone || phone || '',
      passToken: targetUser.passToken || '',
      isInstalledPass: true
    };

    let res;
    const endpoint = '/api/auth/qr-login/phone/verify-and-approve';
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload)
      });
    } catch (e) {
      const directApi = `${window.location.protocol}//${window.location.hostname}:8000${endpoint}`;
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
      }
      // Update device vault
      await saveDeviceProfile(targetUser);
      if (data.passToken) await saveDeviceToken(data.passToken);
      localStorage.setItem('fcc_mobile_pass_installed', 'true');
      sounds.playSuccessChime();
      setPhase('workstation_approved');
    } else {
      sounds.playErrorBuzz();
      setError(data.error || 'The QR login request has expired or could not be approved. Please enter your credentials below.');
      setPhase('fill_details');
    }
  };

  // Step 3 & 4: Verify details against institution database & register phone
  const handleVerifyDetails = async (e) => {
    e.preventDefault();
    if (role === 'student') {
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
    } else {
      if (!adminIdentifier.trim() || !adminPassword.trim()) {
        setError('Please enter your official staff credentials.');
        sounds.playErrorBuzz();
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setPhoneMismatch(false);

    try {
      let res;
      const isStudent = role === 'student';
      const payload = {
        challengeId: challengeId || 'mobile-direct',
        scanToken: scanToken || 'direct-token',
        role,
        matric: isStudent ? matric.trim().toUpperCase() : adminIdentifier.trim(),
        identifier: isStudent ? matric.trim().toUpperCase() : adminIdentifier.trim(),
        pin: isStudent ? pin.trim() : adminPassword.trim(),
        credential: isStudent ? pin.trim() : adminPassword.trim(),
        phone: isStudent ? phone.trim() : ''
      };

      const endpoint = (challengeId && challengeId !== 'mobile-direct')
        ? (isStudent ? '/api/auth/qr-login/phone/verify-and-approve' : '/api/auth/qr-login/phone/verify-multi-role')
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
        const msg = data.error || data.message || 'The supplied student details could not be verified against the Federal Co-operative College database. Please verify your Matric No, PIN, and Phone Number.';
        setError(msg);
        setPhoneMismatch(Boolean(data?.field === 'phone' || data?.phoneMismatch));
        setIsSubmitting(false);
        return;
      }

      // Success: package authenticated profile
      const user = {
        ...(data.user || {}),
        role,
        matric: (data.user?.matric || matric).trim().toUpperCase(),
        name: data.user?.name || (isStudent ? 'Verified Scholar' : 'Authorized Staff'),
        dept: data.user?.dept || data.user?.department || (isStudent ? 'Institutional Scholar' : 'Library Directorate'),
        phone: (phone || data.user?.phone || '').trim(),
        pin: (pin || data.user?.pin || '').trim(),
        passToken: data.passToken || '',
        installed: true,
        installedAt: Date.now()
      };

      // Wipe any previous user credentials from vault to guarantee zero cross-contamination
      await clearAllDeviceData();
      clearAllAuthStores({ reason: 'new_mobile_pass_registered' });

      // Save credentials into permanent IndexedDB device vault
      await saveDeviceProfile(user);
      if (data.passToken) await saveDeviceToken(data.passToken);
      localStorage.setItem('fcc_mobile_pass_installed', 'true');
      setVerifiedUser(user);
      sounds.playSuccessChime();

      if (challengeId && challengeId !== 'mobile-direct') {
        // Computer workstation is approved automatically!
        setPhase('workstation_approved');
      } else if (isAppAlreadyInstalled()) {
        setPhase('pass_card');
      } else {
        setPhase('match_install');
      }
    } catch (err) {
      console.error('Verification error:', err);
      sounds.playErrorBuzz();
      setError('Connection failed: Could not reach the library server. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger complete software installation pipeline on this device
  const handleInstallApp = async () => {
    sounds.playClick();
    setIsInstalling(true);
    setInstallProgress(20);
    setInstallStatusText('Initializing offline security engine...');

    // Trigger browser native install sheet if supported
    const promptToUse = pwaPrompt || getDeferredInstallPrompt();
    if (promptToUse) {
      try {
        promptToUse.prompt();
        promptToUse.userChoice.then((choice) => {
          if (choice && choice.outcome === 'accepted') {
            console.log('PWA installation accepted by user');
          }
        }).catch(() => {});
      } catch (e) {
        console.warn('Native prompt call:', e);
      }
    }

    // Step 1: Pre-cache offline application shell
    setTimeout(async () => {
      setInstallProgress(55);
      setInstallStatusText('Provisioning device cryptographic vault...');

      try {
        if ('caches' in window) {
          const cache = await caches.open('fcc-mobile-pass-v2');
          await cache.addAll(['/', '/manifest.json', '/icon-192.png', '/icon-512.png']).catch(() => {});
        }
      } catch (e) {}

      // Step 2: Register device security key in IndexedDB and persistent local storage
      setTimeout(async () => {
        setInstallProgress(85);
        setInstallStatusText('Registering phone as physical security pass...');

        const deviceKey = 'fcc_key_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        try {
          await saveDeviceToken(deviceKey);
          localStorage.setItem('fcc_mobile_pass_installed', 'true');
          localStorage.setItem('fcc_app_installed', 'true');
          localStorage.setItem('fcc_installed_at', Date.now().toString());
        } catch (e) {}

        // Step 3: Complete activation and advance
        setTimeout(() => {
          setInstallProgress(100);
          setInstallStatusText('Software Installed & Activated!');
          setIsInstalling(false);
          setInstallSuccess(true);
          sounds.playSuccessChime();

          setTimeout(() => {
            if (verifiedUser && (verifiedUser.matric || verifiedUser.identifier)) {
              if (challengeId && scanToken) {
                approveWorkstationChallenge(challengeId, scanToken, verifiedUser);
              } else {
                setPhase('pass_card');
              }
            } else {
              setPhase('fill_details');
            }
          }, 800);
        }, 400);
      }, 500);
    }, 400);
  };

  // Revoke / Disconnect this phone & clear all stored tokens
  const handleRevokeDevice = async () => {
    if (!window.confirm('Disconnect this phone? You will need to enter your Matric Number, PIN, and Phone Number again on next login.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await clearAllDeviceData();
      clearAllAuthStores({ reason: 'mobile_pass_revoked' });
      setVerifiedUser(null);
      setMatric('');
      setPin('');
      setPhone('');
      sounds.playClick();
      setPhase('fill_details');
    } catch (e) {
      console.error('Revocation error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // QR capture for mobile camera barcode detection
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
      setError('Point your camera at the screen QR code to unlock.');
    }
  };

  if (!isOpen) return null;

  // STEP 1: JUST THE BUTTON ALONE (NO FULL CARD, NO SURROUNDING CONTEXT)
  if (phase === 'step1_install') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#021810] text-white animate-fadeIn">
        <div className="w-full max-w-xs flex flex-col items-center text-center space-y-4 animate-scaleUp">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-2xl border-2 border-emerald-400 flex items-center justify-center">
            <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white tracking-wide">
              FCC Authentication Pass
            </h2>
            <p className="text-[11px] text-emerald-400 font-mono">
              Library Passwordless Login
            </p>
          </div>

          {installSuccess ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-center space-y-1.5 animate-scaleUp">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Check size={22} className="stroke-[3]" />
              </div>
              <div className="text-xs font-bold text-white">Software Installed & Activated!</div>
              <p className="text-[10px] text-emerald-300">Opening authentication form...</p>
            </div>
          ) : isInstalling ? (
            <div className="w-full p-4 rounded-2xl bg-[#032317] border border-emerald-500/80 text-center space-y-2.5 animate-fadeIn">
              <RefreshCw size={24} className="mx-auto text-emerald-400 animate-spin" />
              <div className="text-xs font-bold text-white tracking-wide">
                {installStatusText}
              </div>
              <div className="w-full bg-emerald-950/80 rounded-full h-2 overflow-hidden border border-emerald-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${installProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">{installProgress}% Complete</p>
            </div>
          ) : (
            <>
              {/* THE BUTTON ALONE */}
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-300/50 cursor-pointer"
              >
                <Download size={18} className="animate-bounce" />
                <span className="tracking-wide uppercase">Install App on Phone 📲</span>
              </button>

              {/* Simple Clean Text Link */}
              <button
                type="button"
                onClick={() => {
                  if (verifiedUser && (verifiedUser.matric || verifiedUser.identifier) && challengeId && scanToken) {
                    approveWorkstationChallenge(challengeId, scanToken, verifiedUser);
                  } else {
                    setPhase('fill_details');
                  }
                }}
                className="text-xs text-slate-400 hover:text-emerald-300 transition underline underline-offset-4 cursor-pointer pt-1"
              >
                Continue without installing &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#032317] border-2 border-emerald-600/80 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-white overflow-hidden">
        
        {/* Top Header Banner with School Logo */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
              <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>FCC Login Pass</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-[10px] text-emerald-400 font-mono">
                Official PWA Workstation Authenticator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAppAlreadyInstalled() && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="py-1 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[10px] border border-emerald-400 shadow flex items-center gap-1 transition cursor-pointer"
                title="Install FCC Login Pass on Phone"
              >
                <Download size={11} className="animate-bounce" />
                <span>INSTALL PWA</span>
              </button>
            )}
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
            PHASE: CHECKING VAULT CREDENTIALS
        ----------------------------------------------------------------- */}
        {phase === 'checking' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw size={36} className="mx-auto text-emerald-400 animate-spin" />
            <div className="text-sm font-bold text-white">
              Checking phone authentication credentials...
            </div>
            <p className="text-xs text-emerald-300/70">
              Verifying device vault with Federal Co-operative College registry
            </p>
          </div>
        )}

        {/* -----------------------------------------------------------------
            STEP 2: ENTER STUDENT DETAILS (MATRIC, PIN, PHONE)
        ----------------------------------------------------------------- */}
        {phase === 'fill_details' && (
          <form onSubmit={handleVerifyDetails} className="space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2">
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Register This Phone Once</span>
                </div>
                <div className="text-[10px] text-emerald-300">
                  Verify your identity against the institution database
                </div>
              </div>
              <div className="flex rounded-lg bg-black/40 p-0.5 border border-emerald-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-2.5 py-0.5 rounded transition ${role === 'student' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Scholar
                </button>
                <button
                  type="button"
                  onClick={() => setRole('hod')}
                  className={`px-2.5 py-0.5 rounded transition ${role === 'hod' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  HOD
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`px-2.5 py-0.5 rounded transition ${role === 'admin' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            {role === 'student' ? (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    College Matriculation Number
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. FCC/CSC/2026/409"
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                      4-Digit Security PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="text-[10px] text-emerald-400 hover:text-white underline font-mono cursor-pointer"
                    >
                      Forgot PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <Key size={15} className="absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="password"
                      required
                      inputMode="numeric"
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-center text-sm tracking-widest focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    Registered Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08061657738"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneMismatch(false);
                      }}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border text-white font-mono text-xs focus:outline-none ${
                        phoneMismatch ? 'border-rose-500' : 'border-emerald-800 focus:border-emerald-400'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Must match the telephone number registered for your account in the HOD database.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    {role === 'hod' ? 'HOD Department Code or Username' : 'Admin Staff Email or Username'}
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="text"
                      required
                      placeholder={role === 'hod' ? 'e.g. CSC or hod_csc' : 'admin@fccibadan.edu.ng'}
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                      {role === 'hod' ? 'HOD Security Password / PIN' : 'Admin Master Password / PIN'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="text-[10px] text-teal-400 hover:text-white underline font-mono cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-3 text-emerald-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#021810] border border-emerald-800 text-white text-xs focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-400" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (role === 'student' && pin.length < 4)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Verifying Against Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify and Register Phone 🛡️</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* -----------------------------------------------------------------
            STEP 5: RETURNING USER AUTO-AUTHENTICATING WORKSTATION
        ----------------------------------------------------------------- */}
        {phase === 'auto_authenticating' && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950 border-2 border-emerald-300">
                <RefreshCw size={36} className="animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ REGISTERED PHONE DETECTED
              </div>
              <h3 className="text-base font-black text-white">
                Auto-Logging In: {verifiedUser?.name || 'Scholar'}
              </h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                Matric: {verifiedUser?.matric || verifiedUser?.barcode}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#021810] border border-emerald-700/80 text-xs text-emerald-200 flex items-center justify-center gap-2 shadow-inner">
              <Monitor size={14} className="text-emerald-400" />
              <span>Approving computer workstation automatically...</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-emerald-400 hover:text-white underline font-mono text-[11px]"
              >
                Reset PIN / Password?
              </button>
              <span className="text-emerald-800">•</span>
              <button
                type="button"
                onClick={handleRevokeDevice}
                className="text-rose-400 hover:text-rose-300 underline font-mono text-[11px]"
              >
                Disconnect Phone
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            CONFIRMATION: WORKSTATION APPROVED (AUTOMATIC LOGIN SUCCESSFUL)
        ----------------------------------------------------------------- */}
        {phase === 'workstation_approved' && (
          <div className="py-6 text-center space-y-4 animate-scaleUp">
            {/* School Crest & Animated Checkmark */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-3xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-emerald-950 border-2 border-emerald-400">
                <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ WORKSTATION UNLOCKED &amp; SIGNED IN
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
                <Check size={16} className="stroke-[3]" />
                <span>Computer Workstation Unlocked</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Your phone successfully authenticated the workstation login challenge. The computer screen is now redirected to your Scholar Dashboard.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-mono font-bold flex items-center justify-between border-t border-emerald-900/60">
                <span>Closing dialog automatically...</span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 animate-pulse">
                  {countdown}s
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onClose || (() => {
                  try { window.close(); } catch (e) {}
                  window.location.hash = '#/mobile-pass';
                })}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Monitor size={14} className="text-white" />
                <span>Done - Return to Workstation Screen &rarr;</span>
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
            FIRST-TIME MATCHED -> PROMPT TO INSTALL PWA
        ----------------------------------------------------------------- */}
        {phase === 'match_install' && (
          <div className="py-3 text-center space-y-3 animate-scaleUp">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border-2 border-emerald-400">
                <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ IDENTITY VERIFIED &amp; PHONE REGISTERED
              </div>
              <h3 className="text-base font-black text-white">
                {verifiedUser?.name || 'Verified Scholar'}
              </h3>
              <p className="text-xs text-emerald-400 font-mono">
                {verifiedUser?.matric || matric}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#021810] border border-emerald-500/80 text-left space-y-1.5 shadow-lg">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Smartphone size={14} className="text-emerald-400" />
                <span>Install FCC Login Pass on Phone</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Add this authentication pass to your phone home screen for instant 1-second auto-login on all campus computers.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download size={14} />
                <span>Install App on Phone (PWA) 📲</span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('pass_card')}
                className="w-full py-2.5 rounded-xl border border-emerald-800 bg-black/40 hover:bg-emerald-950 text-emerald-300 text-xs font-semibold"
              >
                View Pass Card &rarr;
              </button>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            STANDALONE MOBILE PASS CARD (DEVICE AUTHENTICATOR KEY)
        ----------------------------------------------------------------- */}
        {phase === 'pass_card' && (
          <div className="py-2 space-y-3.5 animate-scaleUp">
            {/* ID Card Display */}
            <div className="relative p-4 rounded-3xl bg-gradient-to-br from-[#042f20] via-[#021810] to-[#01110b] border-2 border-emerald-500/80 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border-2 border-emerald-400 shrink-0">
                    <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
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
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE</span>
                </div>
              </div>

              {/* Scholar Details */}
              <div className="space-y-0.5 text-left">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Registered Device Identity
                </div>
                <h4 className="text-base font-black text-white">
                  {verifiedUser?.name || 'Scholar'}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200 font-mono">
                  <span>Matric: <strong className="text-white">{verifiedUser?.matric || matric}</strong></span>
                  {verifiedUser?.dept && (
                    <span className="text-slate-300">• {verifiedUser.dept}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Workstation Auto-Unlock Key</span>
                </span>
                <span className="text-slate-400">FCC-DEVICE-AUTH</span>
              </div>
            </div>

            {/* Instruction */}
            <div className="p-3.5 rounded-2xl bg-[#021810] border border-emerald-700/80 space-y-1.5 text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Monitor size={14} className="text-emerald-400" />
                <span>To Log In on a Computer Screen:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Open <strong className="text-emerald-300">https://fccibadanlibrary.com.ng/#/login</strong> on the workstation. Point your phone camera at the screen QR code to auto-login.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const scannerInput = document.getElementById('fcc-camera-qr-input');
                  if (scannerInput) scannerInput.click();
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Camera size={16} />
                <span>Scan Computer Screen QR Now</span>
              </button>
              <input
                id="fcc-camera-qr-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleQrImageCapture}
              />

              <div className="flex items-center justify-between pt-1 px-1 text-xs">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-[11px] text-emerald-400 hover:text-white underline font-mono flex items-center gap-1"
                >
                  <KeyRound size={12} />
                  <span>Reset PIN / Password</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevokeDevice}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline font-mono flex items-center gap-1"
                >
                  <LogOut size={12} />
                  <span>Disconnect Phone</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Popup Footer Attribution */}
        <InstitutionalFooter compact={true} />
      </div>

      {/* Forgot Password / PIN Reset Modal */}
      {showResetModal && (
        <ForgotPasswordModal
          isOpen={showResetModal}
          initialRole={role}
          initialIdentifier={verifiedUser?.matric || matric || adminIdentifier}
          onClose={() => setShowResetModal(false)}
          onResetSuccess={() => {
            setShowResetModal(false);
            sounds.playSuccessChime();
            alert('Your security PIN / Password has been reset successfully! Please log in with your new PIN.');
          }}
        />
      )}
    </div>
  );
}
