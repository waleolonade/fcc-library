import React, { useState, useEffect } from 'react';
import {
  Smartphone, Download, X, Check, ShieldCheck, Share2, PlusSquare,
  QrCode, Sparkles, ExternalLink, RefreshCw, ArrowRight, Monitor, Info, CheckCircle2
} from 'lucide-react';
import fccLogo from '../assets/fcc-logo.png';
import { sounds } from '../utils/soundEffects';
import { QrCodeSvg } from './BarcodeQrStudio';

let deferredPromptGlobal = null;

// Capture PWA install prompt globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e;
    window.dispatchEvent(new CustomEvent('fcc-pwa-install-ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPromptGlobal = null;
    try {
      localStorage.setItem('fcc_mobile_pass_installed', 'true');
    } catch (e) {}
  });
}

/** Global trigger helper for any button across the app */
export function showPwaInstallModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fcc-show-pwa-install'));
  }
}

export default function PwaInstallPromptModal({ autoPromptOnMobile = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [canInstallNative, setCanInstallNative] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'qr'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const standaloneCheck =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    // Check if native deferred prompt is already waiting
    if (deferredPromptGlobal) {
      setCanInstallNative(true);
    }

    const handlePromptReady = () => {
      setCanInstallNative(true);
    };

    const handleOpenModal = () => {
      setIsOpen(true);
      setShowManualSteps(false);
      try { sounds.playClick(); } catch (e) {}
    };

    window.addEventListener('fcc-pwa-install-ready', handlePromptReady);
    window.addEventListener('fcc-show-pwa-install', handleOpenModal);

    // Auto-prompt on mobile if not already dismissed in this session and not already standalone
    if (autoPromptOnMobile && !standaloneCheck) {
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
      const dismissed = sessionStorage.getItem('fcc_pwa_prompt_dismissed') === 'true';

      if (isMobile && !dismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('fcc-pwa-install-ready', handlePromptReady);
      window.removeEventListener('fcc-show-pwa-install', handleOpenModal);
    };
  }, [autoPromptOnMobile]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('fcc_pwa_prompt_dismissed', 'true');
    } catch (e) {}
  };

  const handleInstallClick = async () => {
    try { sounds.playClick(); } catch (e) {}

    if (deferredPromptGlobal) {
      setInstalling(true);
      try {
        await deferredPromptGlobal.prompt();
        const { outcome } = await deferredPromptGlobal.userChoice;
        if (outcome === 'accepted') {
          setInstalledSuccess(true);
          try { sounds.playSuccessChime(); } catch (e) {}
          try { localStorage.setItem('fcc_mobile_pass_installed', 'true'); } catch (e) {}
          setTimeout(() => {
            setIsOpen(false);
          }, 2000);
          return;
        }
      } catch (err) {
        console.warn('PWA install error:', err);
      } finally {
        setInstalling(false);
        deferredPromptGlobal = null;
        setCanInstallNative(false);
      }
    }

    // Always reveal the interactive step-by-step guidance if deferred prompt was not triggered
    setShowManualSteps(true);
  };

  if (!isOpen) {
    return null;
  }

  const directMobileUrl = `${window.location.origin}/#/mobile-pass`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#021810] border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-emerald-950 overflow-hidden space-y-5 animate-scaleUp">
        {/* Top glowing accent banner */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 border border-emerald-800/80 text-slate-400 hover:text-white hover:border-emerald-600 transition cursor-pointer"
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Header with College Crest & PWA Badge */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="relative w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border-2 border-emerald-400 shrink-0">
            <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-[10px] font-mono font-bold text-emerald-300">
              <Sparkles size={11} className="text-emerald-400" />
              <span>OFFICIAL MOBILE LOGIN PASS (PWA)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
              Install FCC Pass on Your Phone
            </h3>
            <p className="text-[11px] text-emerald-300/80">
              Dedicated mobile app for instant 1-tap library workstation login
            </p>
          </div>
        </div>

        {/* Success Feedback */}
        {installedSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <Check size={20} className="stroke-[3]" />
            </div>
            <div className="text-xs font-bold text-white">App Installed Successfully!</div>
            <p className="text-[11px] text-emerald-300/80">
              FCC Mobile Pass has been added to your phone home screen.
            </p>
          </div>
        ) : (
          <>
            {/* Feature Highlights */}
            <div className="space-y-2 bg-[#01110b] border border-emerald-900/80 rounded-2xl p-3 text-xs">
              <div className="flex items-start gap-2.5 text-slate-300">
                <div className="w-5 h-5 rounded-lg bg-emerald-900/80 text-emerald-300 flex items-center justify-center shrink-0 text-[11px] font-bold">
                  ⚡
                </div>
                <div className="text-[11px]">
                  <strong className="text-white">Instant Sign-In:</strong> Scan computer screen QR or tap to unlock any library computer in 1 second.
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-slate-300">
                <div className="w-5 h-5 rounded-lg bg-teal-900/80 text-teal-300 flex items-center justify-center shrink-0 text-[11px] font-bold">
                  🛡️
                </div>
                <div className="text-[11px]">
                  <strong className="text-white">High Security:</strong> Never type your student password or PIN on public library keyboards.
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: On This Phone VS Scan with Another Phone */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/60 border border-emerald-900 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('direct')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'direct'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={14} />
                <span>On This Device</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode size={14} />
                <span>Scan Phone QR</span>
              </button>
            </div>

            {/* TAB CONTENT: DIRECT INSTALL (ALWAYS SHOWS INSTALL BUTTON) */}
            {activeTab === 'direct' && (
              <div className="space-y-3">
                {/* PRIMARY ALWAYS-VISIBLE INSTALL BUTTON */}
                <button
                  id="btn-pwa-install-action"
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] border border-emerald-300/40 cursor-pointer"
                >
                  {installing ? (
                    <>
                      <RefreshCw size={17} className="animate-spin text-white" />
                      <span>Opening Installation Prompt...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 shadow">
                        <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
                      </div>
                      <span className="tracking-wide">INSTALL FCC PASS ON PHONE (PWA)</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Clear instructions if deferred prompt is not natively available or user wants guidance */}
                {(showManualSteps || isIos || !canInstallNative) && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/80 space-y-2 text-xs animate-fadeIn">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11.5px]">
                      <Info size={14} className="text-cyan-400" />
                      <span>
                        {isIos
                          ? 'How to Add to Home Screen on iPhone / iPad (Safari):'
                          : 'How to Add to Home Screen on Android / Chrome:'}
                      </span>
                    </div>

                    {isIos ? (
                      <ol className="space-y-1.5 text-[11px] text-slate-200 list-decimal list-inside leading-relaxed">
                        <li>
                          Tap the <strong className="text-white inline-flex items-center gap-1"><Share2 size={12} className="text-cyan-400" /> Share button</strong> in Safari’s bottom bar.
                        </li>
                        <li>
                          Scroll down and tap <strong className="text-white inline-flex items-center gap-1"><PlusSquare size={12} className="text-emerald-400" /> "Add to Home Screen"</strong>.
                        </li>
                        <li>
                          Tap <strong className="text-emerald-300">"Add"</strong> in top-right. FCC Pass with College crest is now installed!
                        </li>
                      </ol>
                    ) : (
                      <ol className="space-y-1.5 text-[11px] text-slate-200 list-decimal list-inside leading-relaxed">
                        <li>
                          Tap your browser menu <strong className="text-white">⋮ (three dots)</strong> in the top-right corner.
                        </li>
                        <li>
                          Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                        </li>
                        <li>
                          Tap <strong className="text-emerald-300">"Install"</strong> — FCC Pass will be added directly to your phone apps!
                        </li>
                      </ol>
                    )}
                  </div>
                )}

                {/* Direct Mobile Pass Link */}
                <a
                  href="#/mobile-pass"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-black/40 hover:bg-emerald-950 border border-emerald-800 text-emerald-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Smartphone size={13} />
                  <span>Open Mobile Pass Authenticator Page Now</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            )}

            {/* TAB CONTENT: QR CODE SCAN */}
            {activeTab === 'qr' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-800/80 text-center space-y-2.5">
                  <div className="text-[11px] text-emerald-300 font-semibold">
                    Point your mobile phone camera at this QR code to open & install FCC Mobile Pass:
                  </div>
                  <div className="p-2.5 bg-white rounded-2xl inline-block shadow-lg border-2 border-emerald-400">
                    <QrCodeSvg value={directMobileUrl} size={130} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Direct Link: {directMobileUrl}
                  </div>
                </div>

                {/* Also provide the install button right here too */}
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download size={14} />
                  <span>Or Install Directly on this Device (PWA)</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-emerald-900/60">
          <a
            href="#/mobile-pass"
            onClick={() => setIsOpen(false)}
            className="text-emerald-400 hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <span>Preview Mobile Pass Web Screen</span>
            <ExternalLink size={11} />
          </a>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
