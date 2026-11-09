import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  X, 
  RefreshCw, 
  Wrench, 
  Clock, 
  Home, 
  Terminal, 
  ShieldAlert 
} from 'lucide-react';
import { fetchSystemBroadcast } from '../services/developerApi';
import { getInstitutionalLogo } from '../assets/logo';
import { navigateTo } from '../utils/router';

/**
 * MaintenanceBroadcastBanner
 * 
 * Provides:
 * 1. Live Developer Broadcast Announcement Banner (solid styled bar across top of dashboard)
 * 2. Targeted Maintenance & Upgrade Lock (when Developer initiates maintenance for this role/page)
 * 
 * @param {string} role - 'student' | 'admin' | 'hod' | 'hod_staff'
 * @param {string} currentPage - Current subpage identifier (e.g. 'all', 'catalog', 'reader', 'circulation', 'upload')
 */
export default function MaintenanceBroadcastBanner({ role = 'student', currentPage = 'all' }) {
  const [broadcastData, setBroadcastData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const logo = getInstitutionalLogo();

  const loadStatus = async () => {
    try {
      const data = await fetchSystemBroadcast(role);
      if (data && data.success && data.broadcast) {
        setBroadcastData(data.broadcast);
      }
    } catch (err) {
      console.warn('[MaintenanceBroadcastBanner] Error loading broadcast:', err);
    }
  };

  useEffect(() => {
    loadStatus();
    // Poll every 20 seconds for real-time developer broadcast or maintenance updates
    const interval = setInterval(loadStatus, 20000);
    return () => clearInterval(interval);
  }, [role]);

  if (!broadcastData) return null;

  // Determine if this specific page is under active maintenance
  const isMaintenanceActive = broadcastData.maintenance_active === true;
  const isPageAffected = isMaintenanceActive && (
    broadcastData.target_scope === 'all' ||
    (Array.isArray(broadcastData.affected_pages) && (
      broadcastData.affected_pages.includes('all') ||
      broadcastData.affected_pages.includes(currentPage)
    ))
  );

  const handleManualCheck = async () => {
    setCheckingStatus(true);
    await loadStatus();
    setTimeout(() => setCheckingStatus(false), 600);
  };

  // If page is locked under developer maintenance, render the solid full-page overlay
  if (isPageAffected) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#030813] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-xl bg-[#071324] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          {/* Logo & Glow */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-2xl bg-white p-2.5 flex items-center justify-center border-2 border-amber-400 shadow-xl">
              <img src={logo} alt="FCC Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 border border-amber-500 text-amber-300">
              <Wrench size={13} className="animate-spin text-amber-400" />
              <span>SCHEDULED DEVELOPER UPGRADE &amp; MAINTENANCE</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {broadcastData.maintenance_title || 'System Under Upgrade & Maintenance'}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
              {broadcastData.maintenance_message || 'The developer team is actively working on scheduled improvements and system upgrades. This section will be restored as soon as maintenance is concluded.'}
            </p>
          </div>

          {/* Details & Target Pill */}
          <div className="p-4 rounded-2xl bg-[#030914] border border-amber-900/80 text-xs text-amber-200/90 space-y-2 text-left font-sans">
            <div className="font-bold flex items-center justify-between text-amber-400 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>Estimated Window: {broadcastData.estimated_duration || '20 - 30 minutes'}</span>
              </span>
              <span className="bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded border border-amber-800 uppercase text-[10px]">
                Target: {broadcastData.role_name || role.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Active engineering deployment underway. Your session data and catalog records are securely maintained in dual-database storage.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checkingStatus}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkingStatus ? 'animate-spin' : ''} />
              <span>{checkingStatus ? 'Checking Status...' : 'Check If Upgrade Complete'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('/opac')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={14} />
              <span>Library Home</span>
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

          <p className="text-[11px] text-slate-500 pt-2 font-mono">
            FCC Ibadan Library Automation • Telemetry &amp; System Operations
          </p>
        </div>
      </div>
    );
  }

  // If broadcast alert is active and not dismissed, render solid top banner
  if (!broadcastData.broadcast_active || dismissed) {
    return null;
  }

  const severity = broadcastData.severity || 'warning';

  let bannerBg = 'bg-amber-950 border-amber-500 text-amber-100';
  let badgeBg = 'bg-amber-500 text-slate-950';
  let IconComponent = AlertTriangle;

  if (severity === 'critical') {
    bannerBg = 'bg-rose-950 border-rose-500 text-rose-100';
    badgeBg = 'bg-rose-500 text-white';
    IconComponent = AlertOctagon;
  } else if (severity === 'info') {
    bannerBg = 'bg-sky-950 border-sky-500 text-sky-100';
    badgeBg = 'bg-sky-500 text-slate-950';
    IconComponent = Info;
  }

  return (
    <div className={`w-full border-b-2 px-4 py-3 shadow-xl transition-all ${bannerBg}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0 mt-0.5 md:mt-0">
            <Wifi size={18} className="animate-pulse text-amber-400" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded shadow-sm ${badgeBg}`}>
                BROADCAST NOTICE
              </span>
              <span className="text-xs font-mono font-bold opacity-80 uppercase">
                {broadcastData.role_name || role.toUpperCase()}
              </span>
              <h4 className="text-sm font-black tracking-tight text-white">
                {broadcastData.broadcast_title || 'Institutional System Notice'}
              </h4>
            </div>
            <p className="text-xs text-slate-200 leading-snug font-sans">
              {broadcastData.broadcast_message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={loadStatus}
            title="Refresh broadcast"
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            title="Dismiss notification"
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <X size={14} />
            <span className="hidden sm:inline text-[11px] font-mono">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}

