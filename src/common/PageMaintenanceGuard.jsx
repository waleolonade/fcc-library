import React from 'react';
import { ShieldAlert, ArrowLeft, Terminal, AlertTriangle, RefreshCw } from 'lucide-react';
import { getInstitutionalLogo } from '../assets/logo';
import { navigateTo } from '../utils/router';

export default function PageMaintenanceGuard({
  pageTitle = 'This Service',
  maintenanceMsg = 'This section of the library platform is temporarily undergoing scheduled developer maintenance.',
  onReturnToSafePage
}) {
  const logo = getInstitutionalLogo();

  return (
    <div className="min-h-screen bg-[#030813] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono">
      {/* Visual Ambient Halo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-[#071324]/90 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center space-y-6 backdrop-blur-xl">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-white p-2.5 flex items-center justify-center border-2 border-amber-400 shadow-xl">
            <img src={logo} alt="FCC Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 border border-amber-500 text-amber-300">
            SYSTEM NOTICE: SERVICE TEMPORARILY RESTRICTED
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            {pageTitle} Offline
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
            {maintenanceMsg}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#030914] border border-amber-900/60 text-xs text-amber-200/90 space-y-1.5 text-left font-sans">
          <div className="font-bold flex items-center gap-1.5 text-amber-400 font-mono">
            <AlertTriangle size={14} />
            <span>Developer Directorate Override Active</span>
          </div>
          <p className="text-[11px] text-slate-400">
            This module has been placed under administrative restriction via the Master Control Deck. All other operational services remain active.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnToSafePage || (() => navigateTo('/opac'))}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Public Discovery</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('/developer')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Terminal size={14} />
            <span>Developer Deck</span>
          </button>
        </div>
      </div>

      <footer className="relative z-10 text-center text-xs text-slate-600 mt-6">
        Federal Co-operative College, Ibadan • Systems &amp; Network Infrastructure
      </footer>
    </div>
  );
}
