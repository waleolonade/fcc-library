import React, { useState } from 'react';
import {
  GraduationCap, KeyRound, ArrowRight, ShieldCheck,
  Building2, Sparkles, BookOpen, AlertCircle, ArrowLeft,
  User, Lock, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

// Known HOD department credentials for quick reference & resilient authentication
export const HOD_DIRECTORY = [
  {
    code: 'CSC',
    name: 'Computer Science & Information Technology',
    hod: 'Dr. K. E. Okonjo',
    username: 'hod_csc',
    email: 'okonjo.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Royal Blue',
    accentHex: '#1d4ed8',
    solidBorder: 'border-blue-500'
  },
  {
    code: 'CEM',
    name: 'Co-operative Economics & Management',
    hod: 'Dr. Mrs. F. A. Babalola',
    username: 'hod_cem',
    email: 'babalola.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Forest Emerald',
    accentHex: '#059669',
    solidBorder: 'border-emerald-500'
  },
  {
    code: 'BNF',
    name: 'Banking & Finance',
    hod: 'Mrs. Folake Sanusi',
    username: 'hod_bnf',
    email: 'sanusi.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Amber Gold',
    accentHex: '#d97706',
    solidBorder: 'border-amber-500'
  },
  {
    code: 'AGR',
    name: 'Agricultural Extension & Management',
    hod: 'Dr. A. O. Olabode',
    username: 'hod_agr',
    email: 'olabode.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Violet Purple',
    accentHex: '#7c3aed',
    solidBorder: 'border-violet-500'
  },
  {
    code: 'BAM',
    name: 'Business Administration & Management',
    hod: 'Dr. T. M. Adewale',
    username: 'hod_bam',
    email: 'adewale.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Crimson Red',
    accentHex: '#e11d48',
    solidBorder: 'border-rose-500'
  },
  {
    code: 'PAD',
    name: 'Public Administration',
    hod: 'Dr. Mrs. B. O. Adeleke',
    username: 'hod_pad',
    email: 'adeleke.hod@fccibadan.edu.ng',
    password: 'password123',
    colorName: 'Ocean Teal',
    accentHex: '#0d9488',
    solidBorder: 'border-teal-500'
  }
];

export default function HodLogin({ onLogin, onBackToPublic }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Detect which HOD account matches the typed username in real-time
  const matchedHod = HOD_DIRECTORY.find(h => {
    const u = username.trim().toLowerCase();
    if (!u) return false;
    return (
      h.username.toLowerCase() === u ||
      h.code.toLowerCase() === u ||
      h.email.toLowerCase() === u ||
      h.hod.toLowerCase().includes(u)
    );
  }) || null;

  const activeAccent = matchedHod ? matchedHod.accentHex : '#059669';

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setErrorMsg('Please enter both your HOD Username and Password.');
      sounds.playErrorBuzz();
      setIsLoading(false);
      return;
    }

    // Strict Backend API Database Authentication
    try {
      const res = await fetch('/api/hod/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: inputUser,
          username: inputUser,
          password: inputPass,
          pin: inputPass,
          login_mode: 'hod'
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        const hodSession = {
          ...data.user,
          colorTheme: matchedHod ? matchedHod.colorName : 'Institutional',
          accentHex: matchedHod ? matchedHod.accentHex : '#059669'
        };
        localStorage.setItem('fcc_hod_session', JSON.stringify(hodSession));
        onLogin(hodSession);
        return;
      } else {
        sounds.playErrorBuzz();
        setErrorMsg(data.error || data.message || 'Access Denied: Unrecognized HOD username or incorrect security password.');
        return;
      }
    } catch (err) {
      setIsLoading(false);
      sounds.playErrorBuzz();
      setErrorMsg('Central database authentication offline. Please verify institutional API is accessible.');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans overflow-hidden">
      {/* Dynamic Background Ambience responding to active HOD accent */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-25"
        style={{ backgroundColor: activeAccent }}
      />

      {/* Top Brand Bar */}
      <div className="mb-6 text-center space-y-2 z-10 flex flex-col items-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-2xl overflow-hidden mb-1">
          <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold shadow">
          <GraduationCap size={14} className="text-amber-400" />
          <span>HOD Department Portal • Tier 3 RBAC</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
          Head of Department Login
        </h1>
        <p className="text-xs text-slate-400">
          Sign in with your HOD credentials to access your department's dedicated dashboard.
        </p>
      </div>

      {/* Main Authentication Box */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-5">
        {/* Dynamic Solid Stripe */}
        <div
          className="h-1.5 w-full rounded-full transition-all duration-500 mb-2"
          style={{ backgroundColor: activeAccent }}
        />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Sign In to HOD Portal</h2>
            <p className="text-xs text-slate-400">
              {matchedHod ? (
                <>Department: <strong className="text-white">{matchedHod.name}</strong></>
              ) : (
                'Enter your department username and password'
              )}
            </p>
          </div>
          {matchedHod && (
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow"
              style={{ backgroundColor: matchedHod.accentHex }}
            >
              {matchedHod.code}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              HOD Username / Staff Identifier
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter HOD username"
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm font-medium focus:outline-none transition shadow-inner font-mono"
                required
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              HOD Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your HOD password"
                className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm font-medium focus:outline-none transition shadow-inner font-mono"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            style={{ backgroundColor: activeAccent }}
          >
            <span>
              {isLoading
                ? 'Authenticating...'
                : matchedHod
                ? `Login to ${matchedHod.code} Dashboard`
                : 'Sign In to Department Dashboard'}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={onBackToPublic}
            className="hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Public OPAC</span>
          </button>

          <a
            href="#/scholar/library_search"
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Student Catalog
          </a>

          <a
            href="#/admin/login"
            className="text-slate-400 hover:text-slate-200"
          >
            Staff Console
          </a>
        </div>
      </div>
    </div>
  );
}
