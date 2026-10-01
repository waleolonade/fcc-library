import React from 'react';
import { Shield, ArrowRight, BookOpen, Sparkles, CheckCircle2, Zap, Database } from 'lucide-react';
import { navigateTo } from '../utils/router';

// =========================================================================
// USER TO FCC ADMIN LIBRARY DIRECT BRIDGE
// Connects Student/Scholar portal with FCC Admin Library & Laravel 11 Backend
// =========================================================================

export default function UserFccAdminBridge({ currentUser, activeLoansCount = 0, onSwitchToAdmin }) {
  const handleGoToAdmin = () => {
    if (onSwitchToAdmin) {
      onSwitchToAdmin();
    } else {
      navigateTo('/admin/overview');
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Shield size={22} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">FCC Admin Library Connection</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live link to Circulation Desk, MARC 21 Cataloguer & Laravel 11 Institutional Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigateTo('/scholar/communication')}
            id="bridge-to-dispatch-hub-btn"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={14} />
            <span>Message My HOD & Library</span>
          </button>

          <button
            onClick={handleGoToAdmin}
            id="bridge-to-fcc-admin-btn"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Admin Library</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
