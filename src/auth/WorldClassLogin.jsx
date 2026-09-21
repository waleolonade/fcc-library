import React, { useState } from 'react';
import { User, Shield, Key, ArrowRight, Sparkles, AlertTriangle, CheckCircle, Lock, BookOpen, Compass } from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';

export default function WorldClassLogin({ onLogin, onOpenPublicOpac }) {
  const [activeDoor, setActiveDoor] = useState('student'); // 'student' | 'admin'
  const [matric, setMatric] = useState('');
  const [pin, setPin] = useState('');
  const [adminUser, setAdminUser] = useState('librarian@fccibadan.edu.ng');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');

  const handleStudentLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!matric.trim() || pin.length < 4) {
      setError('Please provide a valid College Matriculation Number and 4-Digit PIN.');
      return;
    }

    const isCEM = matric.toUpperCase().includes('CEM');
    const isCSC = matric.toUpperCase().includes('CSC');
    const isBNF = matric.toUpperCase().includes('BNF');

    onLogin({
      role: 'student',
      matric: matric.trim().toUpperCase(),
      name: isCEM ? "Ibrahim Adekunle" : isCSC ? "Chukwudi Okafor" : isBNF ? "Ridwan Jimoh" : "Folashade Adeleke",
      dept: isCEM ? "Co-operative Economics & Management" : isCSC ? "Computer Science" : isBNF ? "Banking & Finance" : "Agricultural Extension",
      level: "HND II (Final Year)",
      borrowQuota: 5,
      email: `${matric.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.fccibadan.edu.ng`
    });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');
    if (adminPass !== '9999' && adminPass !== 'admin' && adminPass !== 'fcc2026') {
      setError('Invalid Administrative Authority Passkey. (Demo Key: 9999)');
      return;
    }

    onLogin({
      role: 'admin',
      name: "Dr. Mrs. A. Balogun",
      email: adminUser,
      title: "Chief College Librarian & System Architect",
      permissions: ["SUPER_ADMIN", "CIRC_OVERRIDE", "MARC_EXPORT", "KBART_SYNC", "ACQ_APPROVE"]
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-32px)] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden">
      {/* Visual Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Col: Institutional Branding & Standards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400" />
            Next-Gen Integrated Library Services Platform
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {INSTITUTION.name}
            </h1>
            <p className="text-emerald-400 font-medium text-base sm:text-lg">
              Smart Knowledge Hub, Scholarly Discovery & Physical Repository
            </p>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed">
            Engineered beyond conventional OPACs. Real-time federated citation indices, automated RFID self-service, full-text institutional repository, and zero-latency campus intranet delivery.
          </p>

          {/* Standalone Portals & Quick OPAC Exploration link */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenPublicOpac}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 text-xs font-bold transition shadow-lg"
            >
              <Compass size={14} className="text-emerald-400" />
              Discovery OPAC
              <ArrowRight size={12} />
            </button>
            <a
              href="/admin.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/80 border border-indigo-700/60 hover:border-indigo-400 text-indigo-200 text-xs font-bold transition shadow-lg"
              title="Launch Standalone Admin Operations Hub"
            >
              <Shield size={14} className="text-indigo-400" />
              Standalone Admin Hub ↗
            </a>
            <a
              href="/student.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 hover:border-emerald-400 text-emerald-200 text-xs font-bold transition shadow-lg"
              title="Launch Standalone Student Scholar Portal"
            >
              <BookOpen size={14} className="text-emerald-400" />
              Standalone Student Hub ↗
            </a>
          </div>

          {/* Standards Badges Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-200">MARC 21 & Z39.50</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Full Catalog Interop</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-200">OpenAlex & Crossref</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Global Research Graph</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="text-xs font-bold text-slate-200">OAI-PMH & KBART</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Phase III Compliant</div>
            </div>
          </div>
        </div>

        {/* Right Col: High-End Glassmorphism Dual-Doorway Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
            
            {/* Doorway Selector Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => { setActiveDoor('student'); setError(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeDoor === 'student'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User size={15} /> Student Scholar Portal
              </button>
              <button
                type="button"
                onClick={() => { setActiveDoor('admin'); setError(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeDoor === 'admin'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield size={15} /> Staff & Admin Hub
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertTriangle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Student Auth Form */}
            {activeDoor === 'student' ? (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    College Matriculation Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. FCC/CEM/2024/042"
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-mono">MATRIC</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Student 4-Digit Security PIN
                    </label>
                    <span className="text-[11px] text-emerald-400 cursor-pointer hover:underline">Default: 1234</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center text-lg transition"
                    />
                    <Key size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
                >
                  Access Scholar Portal <ArrowRight size={16} />
                </button>

                {/* Quick 1-Click Testing Profiles */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-2">Quick 1-Click Testing Profiles:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setMatric('FCC/CEM/2024/042'); setPin('1234'); }}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono transition"
                    >
                      CEM Scholar (Adekunle)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMatric('FCC/CSC/2024/108'); setPin('4321'); }}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono transition"
                    >
                      CompSci Scholar (Okafor)
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Staff / Admin Auth Form */
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Staff Identity / Officer Email
                  </label>
                  <input
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Master Authority Passkey
                    </label>
                    <span className="text-[11px] text-indigo-400 font-mono">Demo: 9999</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Enter master key (9999)"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition"
                    />
                    <Lock size={16} className="absolute right-3.5 top-3.5 text-slate-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition"
                >
                  <Shield size={16} /> Enter Administration Console
                </button>

                {/* 1-Click Admin Demo */}
                <div className="pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Quick Test:</span>
                  <button
                    type="button"
                    onClick={() => { setAdminPass('9999'); }}
                    className="text-indigo-400 hover:underline font-mono"
                  >
                    Auto-Fill Master Key (9999)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
