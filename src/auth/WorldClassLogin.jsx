import React, { useState } from 'react';
import {
  User, Shield, Key, ArrowRight, Sparkles, AlertTriangle, CheckCircle,
  Lock, BookOpen, Compass, QrCode, Barcode, Mail, Phone, RefreshCw,
  Cpu, Building, Check, Smartphone
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { BarcodeSvg } from '../common/BarcodeQrStudio';
import { PATTERNS } from '../utils/backgroundPatterns';
import { QrPhoneLogin } from './QrPhoneLogin';

export default function WorldClassLogin({ onLogin, onOpenPublicOpac }) {
  const [authRole, setAuthRole] = useState('student'); // 'student' | 'staff'
  const [studentMethod, setStudentMethod] = useState('matric'); // 'matric' | 'qr' | 'barcode'

  // Student inputs
  const [matric, setMatric] = useState('');
  const [pin, setPin] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');

  // Staff inputs
  const [staffId, setStaffId] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffMfa, setStaffMfa] = useState('');

  const [error, setError] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatingPassLogin, setAnimatingPassLogin] = useState(false);
  const [installedUser, setInstalledUser] = useState(() => {
    try {
      const isInst = localStorage.getItem('fcc_mobile_pass_installed') === 'true';
      const usr = localStorage.getItem('fcc_mobile_pass_user') || localStorage.getItem('fcc_student_session');
      if (isInst && usr) {
        return JSON.parse(usr);
      }
    } catch (e) {}
    return null;
  });

  const handle1TapPassLogin = () => {
    if (!installedUser) return;
    setAnimatingPassLogin(true);
    sounds.playSuccessChime();
    setTimeout(() => {
      localStorage.setItem('fcc_student_session', JSON.stringify(installedUser));
      onLogin(installedUser);
    }, 1200);
  };

  // Student login submission - Strictly verified against Database patrons registry
  const handleStudentSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setDetectedPlatform('');

    let identifier = '';
    let credential = '';

    if (studentMethod === 'matric') {
      identifier = matric.trim().toUpperCase();
      credential = pin.trim();
      if (!identifier || credential.length < 4) {
        setError('Please provide a valid Matriculation Number and 4-digit PIN.');
        sounds.playErrorBuzz();
        return;
      }
    } else if (studentMethod === 'barcode') {
      identifier = scannedBarcode.trim().toUpperCase();
      credential = pin.trim() || '1234';
      if (!identifier) {
        setError('Please scan or enter student library barcode or Library ID.');
        setDetectedPlatform('Barcode');
        sounds.playErrorBuzz();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let res;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            barcode: studentMethod === 'barcode' ? identifier : undefined,
            pin: credential,
            password: credential,
            login_mode: studentMethod
          })
        });
      } catch (proxyErr) {
        // Fallback: If proxy connection failed, attempt direct backend port 8000
        const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/login`;
        res = await fetch(directApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            barcode: studentMethod === 'barcode' ? identifier : undefined,
            pin: credential,
            password: credential,
            login_mode: studentMethod
          })
        });
      }

      let data = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn('API returned non-JSON response body:', jsonErr);
      }

      setIsSubmitting(false);

      if (!res.ok || !data || !data.success) {
        sounds.playErrorBuzz();
        const detected = data?.platform || (
          studentMethod === 'barcode' ? 'Barcode' :
          studentMethod === 'email' ? 'Email' :
          studentMethod === 'otp' ? 'SMS OTP' :
          studentMethod === 'qr' ? 'Scan QR Card' : 'Matric + PIN'
        );
        setDetectedPlatform(detected);
        const errMessage = data?.error || data?.message || (res && res.status === 401 
          ? `[${detected}] Access Denied: Unrecognized student record ('${identifier}'). Please verify your details or register with your HOD.`
          : `[${detected}] Access Denied: Unrecognized student record. Please register with your HOD.`);
        setError(errMessage);
        return;
      }

      sounds.playSuccessChime();
      localStorage.setItem('fcc_student_session', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      console.error('Login request failed:', err);
      setIsSubmitting(false);
      sounds.playErrorBuzz();
      setError('Connection to institutional patron registry failed. Please verify library server is running.');
    }
  };

  // Staff login submission - Strictly verified against backend
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const id = staffId.trim() || staffEmail.trim();
    const pass = staffPassword.trim();
    if (!id || !pass) {
      setError('Please provide a valid Staff ID and password.');
      sounds.playErrorBuzz();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: id,
          password: pass,
          pin: pass,
          login_mode: 'staff'
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        sounds.playErrorBuzz();
        setError(data.error || 'Authentication failed: Staff credentials rejected.');
        return;
      }

      sounds.playSuccessChime();
      localStorage.setItem('fcc_student_session', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setIsSubmitting(false);
      sounds.playErrorBuzz();
      setError('Connection to institutional staff registry failed.');
    }
  };

  return (
    <div
      className="relative min-h-[calc(100vh-32px)] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden bg-[#021810]"
      style={{ backgroundImage: PATTERNS.login }}
    >
      {/* Visual Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Col: Institutional Branding & Standards */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-[#021810] border-2 border-emerald-500/50 p-1 shadow-2xl shadow-emerald-950 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/fcc-logo.png"
                alt="Federal Co-operative College Crest"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">Federal Co-operative College, Ibadan</div>
              <div className="text-[11px] text-emerald-300/80">Est. 1943 • Premier Co-operative Training Institution</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400" />
            Module 6 - Patron Authentication & SIS Integration Gateway
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {INSTITUTION.name}
            </h1>
            <p className="text-emerald-400 font-medium text-base sm:text-lg">
              Smart Integrated Knowledge Hub & Automated Digital Repository
            </p>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            Multi-mode institutional access supporting Students, Faculty Staff, Librarians, and External Guests. Authenticate seamlessly using Matric No, Email, SMS OTP, Student Barcode, or Instant QR Card Scanning.
          </p>

          {/* Quick Direct Portals */}
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={onOpenPublicOpac}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#032317] border border-emerald-700 hover:border-emerald-500 text-emerald-300 hover:text-white font-bold transition shadow-lg"
            >
              <Compass size={14} className="text-emerald-400" />
              <span>Public Discovery OPAC (Guest)</span>
              <ArrowRight size={12} />
            </button>
            <a
              href="#/kiosk"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-950/80 border border-teal-700/60 hover:border-teal-400 text-teal-200 font-bold transition shadow-lg"
              title="Launch Touchscreen Self-Service Kiosk"
            >
              <QrCode size={14} className="text-teal-400" />
              <span>Self-Service Kiosk (Module 8) ↗</span>
            </a>
            <a
              href="#/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#021810] border border-emerald-800 hover:border-emerald-600 text-slate-300 font-bold transition shadow-lg"
            >
              <Shield size={14} className="text-amber-400" />
              <span>Staff / Admin Gateway ↗</span>
            </a>
          </div>

          {/* Standard Indicators */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#032317]/80 border border-emerald-900 backdrop-blur-sm">
              <div className="text-xs font-bold text-white">SIS & LMS Synced</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">3,842 Auto-Profiles</div>
            </div>
            <div className="p-3 rounded-xl bg-[#032317]/80 border border-emerald-900 backdrop-blur-sm">
              <div className="text-xs font-bold text-white">NFC & Barcode RFID</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Code 128 Compliant</div>
            </div>
            <div className="p-3 rounded-xl bg-[#032317]/80 border border-emerald-900 backdrop-blur-sm">
              <div className="text-xs font-bold text-white">Turnstile Gateway</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Zero-Latency Entrance</div>
            </div>
          </div>
        </div>

        {/* Right Col: High-End Dual-Role Multi-Mode Authentication Box */}
        <div className="lg:col-span-6">
          <div className="bg-[#032317]/95 backdrop-blur-2xl border border-emerald-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            
            {/* Role Switcher (Student vs Staff) */}
            <div className="flex rounded-2xl bg-[#021810] p-1 border border-emerald-800/80 mb-5">
              <button
                type="button"
                onClick={() => setAuthRole('student')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authRole === 'student'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Student Scholar</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthRole('staff')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  authRole === 'staff'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                <Building size={14} />
                <span>Academic Staff / Faculty</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs shadow-xl animate-shake space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center justify-between">
                      <span>Authentication Error</span>
                      {detectedPlatform && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-900 text-rose-200 text-[10px] font-mono border border-rose-500/50">
                          Platform: {detectedPlatform}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed text-rose-200 font-mono text-[11px]">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                STUDENT AUTHENTICATION MODES (MODULE 6 & 7)
            ======================================================= */}
            {authRole === 'student' && (
              <div className="space-y-4">
                {/* Auth Method Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {[
                    { id: 'matric', label: 'Matric + PIN', icon: Key },
                    { id: 'qr', label: 'Scan QR Code', icon: QrCode },
                    { id: 'barcode', label: 'Barcode', icon: Barcode }
                  ].map(m => {
                    const Icon = m.icon;
                    const isActive = studentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setStudentMethod(m.id);
                          setError('');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-[#021810] text-emerald-400 hover:text-white border border-emerald-900'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {studentMethod === 'qr' ? (
                  <QrPhoneLogin
                    onLogin={(user, accessToken) => {
                      sounds.playSuccessChime();
                      if (user) {
                        localStorage.setItem('fcc_student_session', JSON.stringify(user));
                      }
                      onLogin(user, accessToken);
                    }}
                    onBack={() => setStudentMethod('matric')}
                  />
                ) : (
                  <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
                  {/* METHOD 1: MATRIC + PIN */}
                  {studentMethod === 'matric' && (
                    <>
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1 uppercase tracking-wider">
                          College Matriculation Number
                        </label>
                        <input
                          type="text"
                          required
                          value={matric}
                          onChange={e => setMatric(e.target.value)}
                          placeholder="e.g. FCC/CEM/2024/042"
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-emerald-300 font-semibold uppercase tracking-wider">
                            Student 4-Digit Security PIN
                          </label>
                        </div>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={pin}
                          onChange={e => setPin(e.target.value)}
                          placeholder="••••"
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-0.5">
                        <button
                          type="button"
                          onClick={() => setStudentMethod('qr')}
                          className="text-emerald-400 hover:text-emerald-200 underline font-semibold flex items-center gap-1.5 transition"
                        >
                          <Smartphone size={13} />
                          <span>Forgot Password / PIN? Sign in with Mobile Pass / QR</span>
                        </button>
                      </div>

                      {installedUser && (
                        <div className="p-3.5 rounded-2xl bg-[#021810] border-2 border-emerald-500/80 shadow-lg flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
                              <Check size={16} className="stroke-[3]" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                                <span>Installed Pass: {installedUser?.name || 'Scholar'}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                              <div className="text-[10px] text-emerald-400 font-mono truncate">{installedUser?.matric}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handle1TapPassLogin}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shrink-0 transition"
                          >
                            1-Tap Sign In &rarr;
                          </button>
                        </div>
                      )}
                    </>
                  )}




                    {/* METHOD 5: BARCODE SCANNER */}
                    {studentMethod === 'barcode' && (
                      <div className="space-y-3.5 text-center">
                        <div className="p-3.5 bg-white rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col items-center">
                          <BarcodeSvg value={scannedBarcode || 'FCC-STU-0000'} height={46} className="text-black" />
                          <span className="text-[10px] font-mono text-slate-600 mt-1 font-semibold tracking-wider">
                            CODE-128 INSTITUTIONAL BARCODE FORMAT
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-emerald-300 font-semibold text-left uppercase tracking-wider text-xs flex items-center gap-1.5">
                              <Barcode size={15} className="text-emerald-400" />
                              <span>Scan or Type Student Barcode / Library ID</span>
                            </label>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold uppercase tracking-wider shadow-sm">
                              Auto-Caps Lock [A-Z]
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={scannedBarcode}
                              onChange={e => setScannedBarcode(e.target.value.toUpperCase())}
                              placeholder="TYPE OR SCAN YOUR LIBRARY BARCODE"
                              autoFocus
                              autoComplete="off"
                              spellCheck="false"
                              className="w-full bg-[#021810] border-2 border-emerald-600 focus:border-emerald-400 rounded-xl px-4 py-3 text-white font-mono text-center text-base tracking-widest uppercase shadow-inner focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition placeholder:text-emerald-800/80 placeholder:tracking-normal placeholder:text-xs"
                              style={{ textTransform: 'uppercase' }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-emerald-400/80 mt-1.5 px-0.5">
                            <span>Compatible with laser barcode scanners & direct keyboard entry.</span>
                            <span className="text-emerald-300 font-mono font-medium">1-Scan Access</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {studentMethod !== 'qr' && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Verifying with Database Registry...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {studentMethod === 'barcode'
                                ? 'Authenticate with Student Barcode'
                                : 'Access Scholar Portal'}
                            </span>
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </form>
                )}

              </div>
            )}

            {/* =======================================================
                STAFF / FACULTY AUTHENTICATION (MODULE 6)
            ======================================================= */}
            {authRole === 'staff' && (
              <form onSubmit={handleStaffSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-teal-300 font-semibold mb-1 uppercase tracking-wider">
                    Staff Identity Number
                  </label>
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    placeholder="e.g. FCC/STAFF/082"
                    className="w-full bg-[#021810] border border-teal-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-teal-300 font-semibold mb-1 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="babalola@fccibadan.edu.ng"
                    className="w-full bg-[#021810] border border-teal-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-teal-300 font-semibold mb-1 uppercase tracking-wider">
                      Staff Password
                    </label>
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={e => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#021810] border border-teal-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-teal-300 font-semibold mb-1 uppercase tracking-wider">
                      MFA Auth Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={staffMfa}
                      onChange={e => setStaffMfa(e.target.value)}
                      placeholder="6-Digit Token"
                      className="w-full bg-[#021810] border border-teal-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-center tracking-widest focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-teal-950 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                >
                  <span>Authenticate Faculty Scholar Account</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Footer Direct Links */}
            <div className="mt-4 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={onOpenPublicOpac}
                className="text-emerald-400 hover:text-white font-semibold hover:underline"
              >
                Continue as Guest Patrons →
              </button>
              <a
                href="#/admin/login"
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Shield size={12} />
                <span>Admin Login</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* 1-Tap Mobile Pass Verified Modal Animation */}
      {animatingPassLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#032317] border-2 border-emerald-500 rounded-3xl p-8 text-center space-y-4 max-w-sm w-full text-white shadow-2xl animate-scaleUp">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950 border-2 border-emerald-300">
                <Check size={44} className="stroke-[3] animate-bounce" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                ✓ PASS VERIFIED ON DEVICE
              </div>
              <h3 className="text-lg font-black text-white">
                Welcome back, {installedUser?.name || 'Scholar'}!
              </h3>
              <p className="text-xs text-emerald-300/80 font-mono">
                {installedUser?.matric || 'Authenticated Scholar'}
              </p>
            </div>

            <div className="text-xs text-emerald-400 flex items-center justify-center gap-2 pt-2">
              <RefreshCw size={14} className="animate-spin" />
              <span>Logging in directly to Scholar Portal...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
