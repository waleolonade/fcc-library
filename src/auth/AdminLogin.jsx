import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Key,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Database,
  Building2,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { navigateTo } from '../utils/router';
import { PATTERNS } from '../utils/backgroundPatterns';

export default function AdminLogin({ onLogin }) {
  const [adminEmail, setAdminEmail] = useState('librarian@fccibadan.edu.ng');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminAuth = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Valid credentials check
      if (adminPass !== '9999' && adminPass !== 'admin' && adminPass !== 'fcc2026') {
        setError('Invalid Administrative Security Passkey. (Demo Key: 9999)');
        return;
      }

      onLogin({
        role: 'admin',
        matric: 'FCC/STAFF/001',
        name: "Dr. Mrs. A. Balogun",
        email: adminEmail,
        title: "Chief College Librarian & System Architect",
        dept: "Library Directorate",
        permissions: ["SUPER_ADMIN", "CIRC_OVERRIDE", "MARC_EXPORT", "KBART_SYNC", "ACQ_APPROVE", "API_MANAGEMENT"]
      });
      navigateTo('/admin/overview');
    }, 400);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      style={{ backgroundImage: PATTERNS.adminLogin }}
    >
      {/* Visual Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-indigo-500/40 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-950 shrink-0 overflow-hidden">
            <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{INSTITUTION.shortName}</div>
            <div className="text-[10px] text-indigo-400 font-mono">Administrative Control Console</div>
          </div>
        </div>

        <button
          onClick={() => navigateTo('/login')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={13} />
          <span>Student Portal</span>
        </button>
      </div>

      {/* Center Login Box */}
      <div className="relative z-10 w-full max-w-md mx-auto my-8">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-indigo-500/40 p-1 flex items-center justify-center mx-auto shadow-xl shadow-indigo-950/60 overflow-hidden">
              <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Administrative Gateway
            </h2>
            <p className="text-xs text-slate-400">
              Authorized College Librarians & System Architects Only
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuth} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold uppercase tracking-wider mb-1.5">
                Staff Email / Institutional ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                  placeholder="librarian@fccibadan.edu.ng"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-300 font-semibold uppercase tracking-wider">
                  Admin Authority Passkey
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">Demo: 9999</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Enter 4-digit master passkey..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono tracking-widest transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Key size={15} />
              <span>{loading ? 'Authenticating Authority...' : 'Unlock FCC Admin Library'}</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminEmail('librarian@fccibadan.edu.ng');
                setAdminPass('9999');
                onLogin({
                  role: 'admin',
                  matric: 'FCC/STAFF/001',
                  name: "Dr. Mrs. A. Balogun",
                  email: 'librarian@fccibadan.edu.ng',
                  title: "Chief College Librarian & System Architect",
                  dept: "Library Directorate",
                  permissions: ["SUPER_ADMIN", "CIRC_OVERRIDE", "MARC_EXPORT", "KBART_SYNC", "ACQ_APPROVE", "API_MANAGEMENT"]
                });
                navigateTo('/admin/overview');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>1-Click Instant Demo Staff Sign-In (Chief Librarian)</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <a
              href="#/opac"
              className="hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft size={12} />
              <span>Public OPAC</span>
            </a>
            <a
              href="#/hod/login"
              className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              <Building2 size={13} />
              <span>HOD Gateway</span>
            </a>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1 text-center text-[10px] text-slate-400 font-mono">
            <div className="text-emerald-400 font-semibold">Laravel 11.57 & SQLite Dual Engine</div>
            <div>Direct Access: Circulation, MARC21, API Hub, Policies & Shelves</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-xs text-slate-500">
        Federal Cooperative College, Ibadan • Directorate of Library & Information Services
      </div>
    </div>
  );
}
