import React, { useState } from 'react';
import {
  User, Shield, Key, ArrowRight, Sparkles, AlertTriangle, CheckCircle,
  Lock, BookOpen, Compass, QrCode, Barcode, Mail, Phone, RefreshCw,
  Cpu, Building, Check
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { QrCodeSvg, BarcodeSvg } from '../common/BarcodeQrStudio';
import { PATTERNS } from '../utils/backgroundPatterns';

export default function WorldClassLogin({ onLogin, onOpenPublicOpac }) {
  const [authRole, setAuthRole] = useState('student'); // 'student' | 'staff'
  const [studentMethod, setStudentMethod] = useState('matric'); // 'matric' | 'email' | 'otp' | 'qr' | 'barcode'

  // Student inputs
  const [matric, setMatric] = useState('FCC/CEM/2024/042');
  const [pin, setPin] = useState('1234');
  const [email, setEmail] = useState('patron@student.fccibadan.edu.ng');
  const [password, setPassword] = useState('scholar2026');
  const [otpPhone, setOtpPhone] = useState('+234 803 456 7890');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('FCC-STU-00125');

  // Staff inputs
  const [staffId, setStaffId] = useState('FCC/STAFF/082');
  const [staffEmail, setStaffEmail] = useState('babalola@fccibadan.edu.ng');
  const [staffPassword, setStaffPassword] = useState('Staff@2026');
  const [staffMfa, setStaffMfa] = useState('');

  const [error, setError] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);

  // Student login submission
  const handleStudentSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');

    let patronName = 'Wale Olonade';
    let patronDept = 'Co-operative Economics & Management';
    let patronMatric = matric.trim().toUpperCase() || 'FCC/CEM/2024/042';

    if (studentMethod === 'matric') {
      if (!matric.trim() || pin.length < 4) {
        setError('Please provide a valid Matriculation Number and 4-digit PIN.');
        sounds.playErrorBuzz();
        return;
      }
    } else if (studentMethod === 'email') {
      if (!email.includes('@')) {
        setError('Please provide a valid institutional email address.');
        sounds.playErrorBuzz();
        return;
      }
    } else if (studentMethod === 'otp') {
      if (!otpSent) {
        setOtpSent(true);
        sounds.playClick();
        return;
      }
      if (otpCode !== '8921' && otpCode.length < 4) {
        setError('Invalid OTP code. Please enter 8921 to verify.');
        sounds.playErrorBuzz();
        return;
      }
    } else if (studentMethod === 'barcode') {
      if (!scannedBarcode.trim()) {
        setError('Please scan or enter student library barcode.');
        sounds.playErrorBuzz();
        return;
      }
    }

    if (patronMatric.includes('CSC')) {
      patronName = 'Chukwudi Okafor';
      patronDept = 'Computer Science';
    } else if (patronMatric.includes('BNF')) {
      patronName = 'Ridwan Jimoh';
      patronDept = 'Banking & Finance';
    }

    sounds.playSuccessChime();
    onLogin({
      role: 'student',
      matric: patronMatric,
      name: patronName,
      dept: patronDept,
      level: 'HND II (Final Year)',
      borrowQuota: 5,
      email: email || `${patronMatric.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.fccibadan.edu.ng`,
      phone: otpPhone
    });
  };

  // Staff login submission
  const handleStaffSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!staffId.trim() || !staffEmail.includes('@')) {
      setError('Please provide a valid Staff ID and institutional email.');
      sounds.playErrorBuzz();
      return;
    }

    sounds.playSuccessChime();
    onLogin({
      role: 'student', // Staff patron mode in scholar portal
      matric: staffId.trim().toUpperCase(),
      name: 'Dr. Mrs. F. A. Babalola',
      dept: 'Faculty of Co-operative Economics & Management',
      level: 'Senior Faculty / HOD',
      borrowQuota: 10,
      email: staffEmail
    });
  };

  // QR Code Instant Scan
  const handleTriggerQrScan = () => {
    setIsScanningQr(true);
    sounds.playScannerBeep();
    setTimeout(() => {
      setIsScanningQr(false);
      sounds.playSuccessChime();
      onLogin({
        role: 'student',
        matric: 'FCC/CEM/2024/042',
        name: 'Wale Olonade',
        dept: 'Co-operative Economics & Management',
        level: 'HND II (Final Year)',
        borrowQuota: 5,
        email: 'w.olonade@student.fccibadan.edu.ng'
      });
    }, 1200);
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
            Module 6 — Patron Authentication & SIS Integration Gateway
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
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* =======================================================
                STUDENT AUTHENTICATION MODES (MODULE 6 & 7)
            ======================================================= */}
            {authRole === 'student' && (
              <div className="space-y-4">
                {/* 5 Auth Method Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {[
                    { id: 'matric', label: 'Matric + PIN', icon: Key },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'otp', label: 'SMS OTP', icon: Phone },
                    { id: 'qr', label: 'Scan QR Card', icon: QrCode },
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
                          <span className="text-[10px] text-emerald-400">Default: 1234</span>
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
                    </>
                  )}

                  {/* METHOD 2: INSTITUTIONAL EMAIL */}
                  {studentMethod === 'email' && (
                    <>
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1 uppercase tracking-wider">
                          Institutional Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="patron@student.fccibadan.edu.ng"
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1 uppercase tracking-wider">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </>
                  )}

                  {/* METHOD 3: SMS OTP */}
                  {studentMethod === 'otp' && (
                    <>
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1 uppercase tracking-wider">
                          Registered Phone Number (SIS Database)
                        </label>
                        <input
                          type="tel"
                          value={otpPhone}
                          onChange={e => setOtpPhone(e.target.value)}
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {otpSent && (
                        <div className="p-3 rounded-xl bg-[#021810] border border-emerald-800 space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-emerald-400">SMS OTP Sent to {otpPhone}</span>
                            <span className="text-amber-400 font-bold">Use: 8921</span>
                          </div>
                          <input
                            type="text"
                            maxLength={4}
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="Enter 4-Digit OTP"
                            className="w-full bg-[#032317] border border-emerald-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* METHOD 4: QR CARD SCANNER */}
                  {studentMethod === 'qr' && (
                    <div className="text-center py-4 space-y-3">
                      <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
                        <QrCodeSvg value="fcc-patron:STU/2026/00125:FCC/CEM/2024/042" size={130} />
                      </div>
                      <p className="text-emerald-300 text-xs">
                        Hold your student ID card in front of your device camera or tap below to authenticate.
                      </p>
                      <button
                        type="button"
                        onClick={handleTriggerQrScan}
                        disabled={isScanningQr}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
                      >
                        <QrCode size={16} />
                        <span>{isScanningQr ? 'Scanning Optical QR Matrix...' : '1-Click Scan Student QR Card'}</span>
                      </button>
                    </div>
                  )}

                  {/* METHOD 5: BARCODE SCANNER */}
                  {studentMethod === 'barcode' && (
                    <div className="space-y-3 text-center">
                      <div className="p-3 bg-white rounded-2xl shadow-lg">
                        <BarcodeSvg value={scannedBarcode} height={42} className="text-black" />
                      </div>
                      <div>
                        <label className="block text-emerald-300 font-semibold mb-1 text-left uppercase tracking-wider">
                          Scan or Type Student Barcode
                        </label>
                        <input
                          type="text"
                          value={scannedBarcode}
                          onChange={e => setScannedBarcode(e.target.value)}
                          className="w-full bg-[#021810] border border-emerald-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-center text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {studentMethod !== 'qr' && (
                    <button
                      type="submit"
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                    >
                      <span>{studentMethod === 'otp' && !otpSent ? 'Request SMS OTP Code' : 'Access Scholar Portal'}</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </form>

                {/* 1-Click Testing Profiles */}
                <div className="pt-3 border-t border-emerald-800/60">
                  <div className="text-[11px] text-emerald-400/80 mb-1.5">1-Click Testing Patrons:</div>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setMatric('FCC/CEM/2024/042'); setPin('1234'); setStudentMethod('matric'); }}
                      className="px-2 py-1 rounded bg-[#021810] hover:bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono"
                    >
                      Wale Olonade (CEM)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMatric('FCC/CSC/2024/108'); setPin('1234'); setStudentMethod('matric'); }}
                      className="px-2 py-1 rounded bg-[#021810] hover:bg-emerald-950 text-indigo-300 border border-emerald-800 font-mono"
                    >
                      Chukwudi (CSC)
                    </button>
                  </div>
                </div>
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
    </div>
  );
}
