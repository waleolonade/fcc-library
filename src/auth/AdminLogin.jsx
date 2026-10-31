import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    Eye, EyeOff,
    Key,
    Lock,
    RefreshCw,
    Shield
} from 'lucide-react';
import { useState } from 'react';
import { getApiBase } from '../api/libraryApi';
import fccLogo from '../assets/fcc-logo.png';
import InstitutionalFooter from '../common/InstitutionalFooter';
import TwoFactorOtpModal from '../common/TwoFactorOtpModal';
import ForgotPasswordModal from '../common/ForgotPasswordModal';
import { navigateTo } from '../utils/router';
import { sounds } from '../utils/soundEffects';
import { storeUserSession } from '../utils/authSessionManager';

export default function AdminLogin({ onLogin }) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA OTP and Recovery modal states
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setError('');

    const emailTrimmed = adminEmail.trim();
    const passTrimmed = adminPass.trim();

    if (!emailTrimmed) {
      setError('Please enter your administrative email address or username.');
      sounds.playErrorBuzz();
      return;
    }
    if (!passTrimmed) {
      setError('Please enter your administrative password.');
      sounds.playErrorBuzz();
      return;
    }

    setLoading(true);

    try {
      // Enterprise 2FA Gateway: First verify primary administrative credentials and issue OTP
      const res = await fetch(`${getApiBase()}/auth/otp/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          identifier: emailTrimmed,
          password: passTrimmed
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setLoading(false);
        if (data.otp_required) {
          sounds.playClick();
          setOtpChallenge(data);
          setShowTwoFactor(true);
          return;
        } else {
          // 2FA OTP is paused by Developer Master: Log in immediately without OTP
          handleOtpVerified({
            user: data.user,
            token: data.token
          });
          return;
        }
      }

      setLoading(false);
      sounds.playErrorBuzz();
      const errorMsg = data.error || data.message || 'Access Denied: Invalid Administrative Credentials. Please verify your email/username and password.';
      setError(errorMsg);
    } catch (err) {
      console.warn('Backend API connection error during admin login:', err);
      setLoading(false);
      sounds.playErrorBuzz();
      setError('Connection to campus database gateway failed. Please ensure the server is running and try again.');
    }
  };

  const handleOtpVerified = (verifiedData) => {
    setShowTwoFactor(false);
    sounds.playSuccessChime();
    const adminUser = {
      ...(verifiedData?.user || {}),
      role: verifiedData?.user?.role || 'admin',
      email: verifiedData?.user?.email || adminEmail.trim() || 'admin@fccibadan.edu.ng',
      name: verifiedData?.user?.name || 'Library Administrator'
    };
    storeUserSession(adminUser, verifiedData?.token, 'admin');

    if (onLogin) {
      onLogin(adminUser);
    }

    // Explicitly transition window hash to dashboard
    window.location.hash = '#/admin/overview';
    navigateTo('/admin/overview');
  };

  const setHelperCredentials = (email, pass) => {
    setAdminEmail(email);
    setAdminPass(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#e8f5e9] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-end max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <a
            href="#/opac"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:border-emerald-500 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 shadow-sm transition"
          >
            <ArrowLeft size={13} />
            <span>Public OPAC</span>
          </a>
          <a
            href="#/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm transition"
          >
            <span>Scholar Portal</span>
          </a>
        </div>
      </header>

      {/* Main 2-Column Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-6 sm:my-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* LEFT COLUMN: Professional Context on HOW TO LOGIN */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Protocol Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold shadow-sm">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>OFFICIAL ADMINISTRATIVE CLEARANCE PROTOCOL</span>
            </div>

            {/* Title & Concise Summary */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-950 tracking-tight leading-tight">
                How to Authenticate &amp; Access Staff Console
              </h1>
              <p className="text-xs sm:text-sm text-emerald-900/85 leading-relaxed font-sans font-medium">
                Follow this mandatory procedure to verify administrative authority and unlock institutional library management systems.
              </p>
            </div>

            {/* Step-by-Step Instructions Grid */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-400 transition flex items-start gap-3.5 shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0 text-white font-mono font-black text-xs shadow-sm">
                  01
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Input Staff Identifier or Email</span>
                    <Key size={13} className="text-emerald-700" />
                  </h2>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                    Enter your assigned institutional email (<code className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-mono font-semibold">admin@*************</code>, <code className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-mono font-semibold">librarian@********</code>) or verified staff username (<code className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-mono font-semibold">chief**********</code>).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-400 transition flex items-start gap-3.5 shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center shrink-0 text-white font-mono font-black text-xs shadow-sm">
                  02
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Supply Administrative Passkey</span>
                    <Lock size={13} className="text-teal-700" />
                  </h2>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                    Input your personal administrative password or official institutional clearance key (<code className="text-emerald-900 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded font-mono font-semibold">******</code>). Passwords are cryptographically hashed and verified against the backend database.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-400 transition flex items-start gap-3.5 shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center shrink-0 text-white font-mono font-black text-xs shadow-sm">
                  03
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Automated Token &amp; Privilege Clearance</span>
                    <CheckCircle2 size={13} className="text-emerald-700" />
                  </h2>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                    The backend API validates credentials and provisions an administrative TLS session token, granting access to MARC21 cataloguing, acquisitions, circulation override, and patron records.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 hover:border-emerald-400 transition flex items-start gap-3.5 shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-xl bg-teal-800 flex items-center justify-center shrink-0 text-white font-mono font-black text-xs shadow-sm">
                  04
                </div>
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Credential Management &amp; Recovery</span>
                    <Building2 size={13} className="text-teal-700" />
                  </h2>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans">
                    Administrators can change their name, username, and password inside the Admin Overview Settings tab. All credential changes reflect instantly in the Developer Master Portal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Sleek Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white border-2 border-emerald-600/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 space-y-6 relative overflow-hidden">
              {/* Top accent bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />

              {/* Header Title with Official Shield */}
              <div className="text-center space-y-3">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
                  <div className="absolute inset-0 rounded-3xl bg-emerald-500/15 animate-pulse blur-md" />
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-3 flex items-center justify-center shadow-lg border-2 border-emerald-300">
                    <img src={fccLogo} alt="FCC Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                  Administrative Gateway
                </h2>
                <p className="text-xs text-emerald-800/80 font-medium max-w-xs mx-auto">
                  Directorate of Library &amp; Information Services • Staff Authentication
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 leading-relaxed font-medium">{error}</div>
                </div>
              )}

              <form onSubmit={handleAdminAuth} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5 text-[11px]">
                    Administrative Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono transition shadow-inner"
                      placeholder="e.g. admin@fccibadan.edu.ng or chief_librarian"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      Administrative Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Enter administrative passkey..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-mono transition shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-emerald-700 transition"
                      title={showPass ? 'Hide passkey' : 'Show passkey'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setShowForgotModal(true);
                    }}
                    className="text-emerald-700 hover:text-emerald-950 font-semibold hover:underline cursor-pointer transition text-left"
                  >
                    Forgot Administrative Password?
                  </button>
                  <span className="text-emerald-800/60 font-mono text-[10px] uppercase font-bold tracking-wider">
                    2FA Mandated
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-white" />
                      <span>Authenticating Administrative Authority...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={15} />
                      <span>Unlock Administrative Library Console</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Strict Enterprise Two-Factor OTP Modal */}
      {showTwoFactor && otpChallenge && (
        <TwoFactorOtpModal
          isOpen={showTwoFactor}
          challengeId={otpChallenge.challenge_id}
          maskedDestination={otpChallenge.masked_destination}
          role="admin"
          userName={otpChallenge.user_name || 'Library Administrator'}
          identifier={adminEmail.trim()}
          onClose={() => setShowTwoFactor(false)}
          onVerified={handleOtpVerified}
          onVerifySuccess={handleOtpVerified}
        />
      )}

      {/* Universal Institutional Password / PIN Reset Modal */}
      {showForgotModal && (
        <ForgotPasswordModal
          isOpen={showForgotModal}
          initialRole="admin"
          onClose={() => setShowForgotModal(false)}
          onSuccess={() => {
            setShowForgotModal(false);
          }}
        />
      )}

      {/* Global Institutional Copyright & Attribution Footer */}
      <InstitutionalFooter light={true} className="bg-transparent border-t-0 py-2" />
    </div>
  );
}
