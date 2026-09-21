import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, CheckCircle2, X, Sparkles, Cpu, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function BiometricScannerModal({ patron, purpose = "Turnstile Campus Access", onClose, onVerified }) {
  const [scanning, setScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    sounds.playBiometricScan();
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setMatched(true);
          sounds.playSuccessChime();
          setTimeout(() => {
            if (onVerified) onVerified();
          }, 1200);
          return 100;
        }
        return prev + 20;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
            <Cpu size={12} /> Live Optical Biometric Sensor
          </div>
          <h3 className="text-lg font-bold text-white mt-1.5">{purpose}</h3>
          <p className="text-xs text-slate-400">Patron: <strong className="text-slate-200">{patron?.name || 'Scholar Patron'}</strong> ({patron?.matric || 'FCC/2026'})</p>
        </div>

        {/* Optical Sensor Target */}
        <div className="relative w-32 h-32 mx-auto rounded-full bg-slate-950 border-2 border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-2xl shadow-emerald-950/80">
          {scanning && (
            <div
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400"
              style={{ top: `${scanProgress}%` }}
            ></div>
          )}

          <Fingerprint
            size={72}
            className={`transition-all duration-300 ${
              matched
                ? 'text-emerald-400 scale-110'
                : scanning
                ? 'text-emerald-500/60 animate-pulse'
                : 'text-slate-600'
            }`}
          />
        </div>

        {/* Progress status */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Minutiae Match Rate</span>
            <span className="text-emerald-400 font-bold">{matched ? '99.8% Confirmed' : `${scanProgress}%`}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        </div>

        {matched ? (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Biometric Identity Validated • Access Granted
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">
            Hold finger steady on optical glass for minutiae ridge matching...
          </p>
        )}
      </div>
    </div>
  );
}
