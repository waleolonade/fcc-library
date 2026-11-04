import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GraduationCap, KeyRound, ArrowRight, ShieldCheck,
  Building2, Sparkles, BookOpen, AlertCircle, ArrowLeft,
  User, Lock, Eye, EyeOff, CheckCircle2, Shield,
  Users, UserCheck, Sliders, ChevronDown, Check
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import TwoFactorOtpModal from '../common/TwoFactorOtpModal';
import ForgotPasswordModal from '../common/ForgotPasswordModal';
import { storeUserSession } from '../utils/authSessionManager';
import { getApiBase } from '../api/libraryApi';
import { HOD_DEPARTMENT_THEMES } from '../hod/hodThemeConfig';

export const HOD_DIRECTORY = [];

export default function HodLogin({ onLogin, onBackToPublic }) {
  // Dual Purpose Mode: 'hod' (Head of Department) vs 'staff' (Departmental Academic Staff)
  const [loginMode, setLoginMode] = useState('hod');

  // Input states & fast autofocus references
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDeptCode, setSelectedDeptCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Dynamic departments fetched from database
  const [departments, setDepartments] = useState(() => {
    try {
      const cached = JSON.parse(
        localStorage.getItem('fcc_departments_v48_gov') ||
        localStorage.getItem('fcc_cached_departments') ||
        '[]'
      );
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    fetch(`${getApiBase()}/departments`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          try {
            localStorage.setItem('fcc_cached_departments', JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // 2FA OTP & Recovery Modal states
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Detect which HOD or department matches the input
  const matchedDept = useMemo(() => {
    if (selectedDeptCode) {
      const found = departments.find(d => (d.code || '').toUpperCase() === selectedDeptCode.toUpperCase());
      if (found) return found;
    }

    const u = username.trim().toLowerCase();
    if (!u) return null;

    return departments.find(d => {
      const c = (d.code || '').toLowerCase();
      const n = (d.name || '').toLowerCase();
      const e = (d.hod_email || '').toLowerCase();
      const h = (d.hod_name || d.hod || '').toLowerCase();
      return c === u || `hod_${c}` === u || e === u || n.includes(u) || h.includes(u);
    }) || null;
  }, [selectedDeptCode, username, departments]);

  // Dynamic Theme Colors
  const activeDeptCode = (matchedDept?.code || selectedDeptCode || 'CEM').toUpperCase();
  const themeObj = HOD_DEPARTMENT_THEMES[activeDeptCode] || HOD_DEPARTMENT_THEMES['CEM'] || {
    solidPrimary: '#0d9488',
    solidDark: '#134e4a',
    accentHex: '#14b8a6',
    colorName: 'Teal'
  };

  const activeAccent = themeObj.solidPrimary || '#0d9488';

  // Fast department select: Never autofill passwords, and keep credentials blank for staff security
  const handleSelectDept = (deptCode) => {
    sounds.playClick();
    setSelectedDeptCode(deptCode);
    setErrorMsg('');
    setSuccessNotice('');

    if (loginMode === 'staff') {
      // SECURITY REQUIREMENT: Never auto-fill credentials for staff
      // Staff member must input their username and password manually
      setUsername('');
      setPassword('');
    } else {
      // In HOD mode, set username convenience if department exists, but never autofill password
      const found = departments.find(d => d.code === deptCode);
      if (found) {
        setUsername(`hod_${found.code.toLowerCase()}`);
      }
      setPassword('');
    }

    // Ultra-fast auto-focus on the username input
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 40);
  };

  // Switch between HOD and Staff Login Mode
  const handleModeSwitch = (mode) => {
    sounds.playClick();
    setLoginMode(mode);
    setErrorMsg('');
    setSuccessNotice('');
    setUsername('');
    setPassword('');

    // Fast focus on username input
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 40);
  };

  // Step 1: Submit Credentials to Request 2FA OTP
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');
    setIsLoading(true);

    const inputUser = username.trim();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setErrorMsg(
        loginMode === 'hod'
          ? 'Please enter your HOD Username and Official Password / PIN.'
          : 'Please enter your Departmental Staff Code / Email and Password.'
      );
      sounds.playErrorBuzz();
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = `${getApiBase()}/auth/otp/send-login-otp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: loginMode === 'staff' ? 'hod_staff' : 'hod',
          identifier: inputUser,
          password: inputPass
        })
      });

      const data = await res.json().catch(() => ({}));
      setIsLoading(false);

      if (res.ok && data.success) {
        if (data.otp_required) {
          sounds.playClick();
          setOtpChallenge(data);
          setShowTwoFactor(true);
          return;
        } else {
          // 2FA OTP is paused in Developer Master settings: Log in directly
          handleOtpVerified({
            user: data.user,
            token: data.token
          });
          return;
        }
      } else {
        sounds.playErrorBuzz();
        setErrorMsg(
          data.error ||
          data.message ||
          (loginMode === 'hod'
            ? 'Access Denied: Unrecognized HOD username or incorrect security credentials.'
            : 'Access Denied: Unrecognized departmental staff credentials or workspace suspended.')
        );
        return;
      }
    } catch (err) {
      setIsLoading(false);
      sounds.playErrorBuzz();
      setErrorMsg('Central database authentication offline. Please verify institutional API is accessible.');
      return;
    }
  };

  // Step 2: Handle Verified OTP & Launch Workspace
  const handleOtpVerified = (verifiedData) => {
    setShowTwoFactor(false);
    sounds.playSuccessChime();

    const verifiedUser = verifiedData.user || {};
    const isStaff = verifiedUser.role === 'hod_staff' || loginMode === 'staff';

    if (isStaff) {
      const staffSession = {
        ...verifiedUser,
        role: 'hod_staff',
        id: verifiedUser.id || verifiedUser.staff_id,
        staff_id: verifiedUser.id || verifiedUser.staff_id,
        staff_code: verifiedUser.staff_code || verifiedUser.matric,
        name: verifiedUser.name || 'Departmental Staff',
        email: verifiedUser.email || '',
        department_code: (verifiedUser.department_code || activeDeptCode).toUpperCase(),
        department_name: verifiedUser.department_name || `${activeDeptCode} Department`,
        department_id: verifiedUser.department_id || `DEP-${activeDeptCode}`,
        allowed_pages: verifiedUser.allowed_pages || { overview: true },
        allowed_features: verifiedUser.allowed_features || {},
        designation: verifiedUser.designation || 'Academic Staff',
        colorTheme: themeObj.colorName,
        accentHex: themeObj.solidPrimary
      };

      storeUserSession(staffSession, verifiedData.token, 'hod');
      try {
        localStorage.setItem('fcc_hod_session', JSON.stringify(staffSession));
        localStorage.setItem('fcc_active_staff_session', JSON.stringify(staffSession));
      } catch (e) {}

      if (onLogin) onLogin(staffSession);
    } else {
      const targetDeptCode = (verifiedUser.department_code || matchedDept?.code || activeDeptCode).toUpperCase();
      const targetDeptName = verifiedUser.department_name || matchedDept?.name || `${targetDeptCode} Department`;
      const targetDeptId = verifiedUser.department_id || `DEP-${targetDeptCode}`;

      const hodSession = {
        ...verifiedUser,
        role: 'hod',
        department_code: targetDeptCode,
        department_name: targetDeptName,
        department_id: targetDeptId,
        name: verifiedUser.name || matchedDept?.hod_name || matchedDept?.hod || 'Head of Department',
        email: verifiedUser.email || matchedDept?.hod_email || `hod_${targetDeptCode.toLowerCase()}@fccibadan.edu.ng`,
        matric: `HOD/${targetDeptCode}/001`,
        colorTheme: themeObj.colorName,
        accentHex: themeObj.solidPrimary
      };

      storeUserSession(hodSession, verifiedData.token, 'hod');
      try {
        localStorage.setItem('fcc_hod_session', JSON.stringify(hodSession));
      } catch (e) {}

      if (onLogin) onLogin(hodSession);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans overflow-hidden">
      {/* Dynamic Background Ambience responding to active department accent */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-25"
        style={{ backgroundColor: activeAccent }}
      />

      {/* Top Brand Bar */}
      <div className="mb-5 text-center space-y-2 z-10 flex flex-col items-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-2xl overflow-hidden mb-1">
          <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold shadow">
          <GraduationCap size={14} className="text-amber-400" />
          <span>{INSTITUTION.name} • HOD &amp; Staff Gateway</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
          Departmental Access Portal
        </h1>
        <p className="text-xs text-slate-400 max-w-md">
          Unified secure gateway for Heads of Department (HODs) and appointed Departmental Academic Staff with mandatory Two-Factor OTP.
        </p>
      </div>

      {/* Main Authentication Box */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5">
        {/* Dynamic Solid Top Color Stripe */}
        <div
          className="h-1.5 w-full rounded-full transition-all duration-500 mb-1"
          style={{ backgroundColor: activeAccent }}
        />

        {/* DUAL PURPOSE MODE SWITCHER: HOD vs DEPARTMENT STAFF */}
        <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => handleModeSwitch('hod')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              loginMode === 'hod'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={15} style={{ color: loginMode === 'hod' ? activeAccent : undefined }} />
            <span>Head of Department</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('staff')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              loginMode === 'staff'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={15} className="text-cyan-400" />
            <span>Department Staff</span>
          </button>
        </div>

        {/* Header Summary */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {loginMode === 'hod' ? (
                <>
                  <ShieldCheck size={16} style={{ color: activeAccent }} />
                  <span>HOD Executive Portal Sign In</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} className="text-cyan-400" />
                  <span>Departmental Staff Workspace Sign In</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loginMode === 'hod'
                ? (matchedDept ? `Jurisdiction: ${matchedDept.name}` : 'Enter your HOD credentials or department code')
                : 'Enter the staff ID and password provisioned by your HOD'}
            </p>
          </div>

          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-white shadow"
            style={{ backgroundColor: activeAccent }}
          >
            {activeDeptCode}
          </span>
        </div>

        {/* Solid Background Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg animate-fadeIn">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold text-rose-300">Authentication Failed</strong>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Solid Background Success Alert */}
        {successNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Department Selection Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Academic Department</span>
              {matchedDept && (
                <span className="text-[10px] font-mono font-bold text-teal-400">
                  {matchedDept.name}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={selectedDeptCode}
                onChange={(e) => handleSelectDept(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400 transition shadow-inner appearance-none cursor-pointer"
              >
                <option value="">-- Choose Academic Department ({departments.length} Available) --</option>
                {departments.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.code} • {d.name} {d.hod_name ? `(HOD: ${d.hod_name})` : ''}
                  </option>
                ))}
              </select>
              <Building2 size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown size={16} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Secure Staff Authorization Advisory (No password autofill) */}
          {loginMode === 'staff' && selectedDeptCode && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300 animate-fadeIn">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-400 shrink-0" />
                <span>Department: <strong className="text-white">{selectedDeptCode} Academic Staff</strong></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                MANUAL AUTH REQUIRED
              </span>
            </div>
          )}

          {/* Identifier Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{loginMode === 'hod' ? 'HOD Username / Official Email' : 'Staff Code / Username / Email'}</span>
              <span className="text-[10px] font-mono text-slate-500">Case-Insensitive</span>
            </label>
            <div className="relative">
              <input
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder={
                  loginMode === 'hod'
                    ? 'e.g. hod_csc or csc.hod@fccibadan.edu.ng'
                    : 'e.g. STF/CSC/001 or staff username'
                }
                className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-cyan-400 transition shadow-inner font-mono"
                required
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          {/* Password Input (No autofill, protected with autocomplete="new-password") */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{loginMode === 'hod' ? 'HOD Official Password / PIN' : 'Staff Workspace Password'}</span>
              <span className="text-[10px] font-mono text-amber-400/80">Secured Input</span>
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder={loginMode === 'hod' ? 'Enter your HOD password or PIN' : 'Enter your staff workspace password'}
                className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none focus:border-cyan-400 transition shadow-inner font-mono"
                required
              />
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Security & Reset Links */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowForgotModal(true);
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold hover:underline cursor-pointer transition text-left text-[11px]"
            >
              Forgot Password / PIN?
            </button>
            <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Mandatory 2FA OTP</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: activeAccent }}
          >
            <span>
              {isLoading
                ? 'Verifying Credentials...'
                : loginMode === 'hod'
                ? `Proceed to HOD 2FA Gate`
                : `Proceed to Staff 2FA Gate`}
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
            href="#/opac"
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Public Catalog
          </a>

          <a
            href="#/admin/login"
            className="text-slate-400 hover:text-slate-200"
          >
            Chief Librarian Login
          </a>
        </div>
      </div>

      {/* Strict Enterprise Two-Factor OTP Modal (Solid Background, 6-digit PIN Input) */}
      {showTwoFactor && otpChallenge && (
        <TwoFactorOtpModal
          isOpen={showTwoFactor}
          challengeId={otpChallenge.challenge_id}
          maskedDestination={otpChallenge.masked_destination}
          role={loginMode === 'staff' ? 'hod_staff' : 'hod'}
          userName={otpChallenge.user_name || (loginMode === 'hod' ? (matchedDept?.hod_name || 'Department Head') : 'Departmental Staff')}
          identifier={username.trim()}
          onClose={() => setShowTwoFactor(false)}
          onVerified={handleOtpVerified}
          onVerifySuccess={handleOtpVerified}
        />
      )}

      {/* Universal Institutional Password / PIN Reset Modal */}
      {showForgotModal && (
        <ForgotPasswordModal
          isOpen={showForgotModal}
          initialRole={loginMode === 'staff' ? 'hod_staff' : 'hod'}
          onClose={() => setShowForgotModal(false)}
          onSuccess={() => {
            setShowForgotModal(false);
          }}
        />
      )}
    </div>
  );
}
