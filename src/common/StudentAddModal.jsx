import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, Building2, Lock, Sparkles, CheckCircle2,
  AlertCircle, ShieldCheck, Mail, Phone, KeyRound, Award, BookOpen
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function StudentAddModal({
  isOpen,
  onClose,
  mode = 'hod', // 'hod' | 'admin'
  currentDept = null, // { name: '...', code: '...' }
  departments = [],
  onStudentAdded
}) {
  const isHod = mode === 'hod';

  // Resolved department name and code
  const hodDeptName = currentDept?.name || 'Co-operative Economics & Management';
  const hodDeptCode = currentDept?.code || 'CEM';

  const [name, setName] = useState('');
  const [matric, setMatric] = useState('');
  const [autoGenMatric, setAutoGenMatric] = useState(true);
  const [selectedDept, setSelectedDept] = useState(isHod ? hodDeptName : (departments[0]?.name || hodDeptName));
  const [level, setLevel] = useState('ND I');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');
  const [borrowQuota, setBorrowQuota] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Update selected department if mode is HOD or departments load
  useEffect(() => {
    if (isHod) {
      setSelectedDept(hodDeptName);
    } else if (!selectedDept && departments.length > 0) {
      setSelectedDept(departments[0]?.name || '');
    }
  }, [isHod, hodDeptName, departments]);

  // Derive department code for matric generator
  const activeDeptCode = isHod
    ? hodDeptCode
    : (departments.find(d => d.name === selectedDept)?.code || selectedDept.slice(0, 3).toUpperCase() || 'FCC');

  // Preview matriculation number
  const previewMatric = autoGenMatric
    ? `FCC/${activeDeptCode}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
    : matric;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Student full name is required.');
      return;
    }

    const targetDept = isHod ? hodDeptName : selectedDept;
    if (!targetDept) {
      setErrorMessage('Please assign a department for this student.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalMatric = autoGenMatric ? previewMatric : matric.trim();
      const payload = {
        name: name.trim(),
        matric: finalMatric,
        department: targetDept,
        level: level,
        programme: level.includes('HND') ? 'Higher National Diploma' : 'National Diploma',
        email: email.trim() || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@fccibadan.edu.ng`,
        phone: phone.trim() || '+234 800 000 0000',
        pin: pin.trim() || '1234',
        borrowQuota: Number(borrowQuota) || 5,
        clearanceStatus: 'Active Student',
        status: 'Active'
      };

      const result = await libraryApi.patrons.addPatron(payload);

      if (result.success) {
        sounds?.playSuccessChime?.();
        setSuccessMessage(`Scholar ${payload.name} registered successfully with Matric: ${finalMatric}!`);
        if (onStudentAdded) {
          onStudentAdded(result.patron);
        }
        setTimeout(() => {
          onClose();
          setName('');
          setMatric('');
          setEmail('');
          setPhone('');
          setSuccessMessage('');
        }, 1200);
      } else {
        setErrorMessage(result.message || 'Failed to save student.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isHod ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isHod ? 'Register Department Student' : 'Add Scholar & Assign Department'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isHod
                  ? `Department Privilege: Restricted to ${hodDeptName} alone`
                  : 'College Central Registry: Assign to any academic department'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Department Field (Locked for HOD, Selectable for Admin) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 size={14} className={isHod ? 'text-teal-400' : 'text-indigo-400'} />
                <span>Department {isHod ? '(Restricted to your department)' : '(Assign Department)'}</span>
              </span>
              {isHod && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                  <Lock size={10} /> Locked to HOD Console
                </span>
              )}
            </label>

            {isHod ? (
              <div className="relative">
                <input
                  type="text"
                  value={hodDeptName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-semibold cursor-not-allowed select-none"
                />
                <div className="absolute right-3.5 top-3 text-teal-400 text-xs flex items-center gap-1 font-mono">
                  <ShieldCheck size={14} /> {hodDeptCode}
                </div>
              </div>
            ) : (
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                required
              >
                {departments.length > 0 ? (
                  departments.map(d => (
                    <option key={d.code || d.name} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Co-operative Economics & Management">Co-operative Economics & Management (CEM)</option>
                    <option value="Computer Science & Information Technology">Computer Science & Information Technology (CSC)</option>
                    <option value="Banking & Finance">Banking & Finance (BNF)</option>
                    <option value="Agricultural Extension & Management">Agricultural Extension & Management (AGR)</option>
                    <option value="Business Administration & Management">Business Administration & Management (BAM)</option>
                    <option value="Public Administration">Public Administration (PAD)</option>
                  </>
                )}
              </select>
            )}
            <p className="text-[11px] text-slate-500">
              {isHod
                ? 'HOD privilege policy: You can only register and clear students within your appointed department.'
                : 'Admin authority: You can assign this student to any department across the institution.'}
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Student Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Oluwaseun Adeleke"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Matriculation Number */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Matriculation Number</label>
              <button
                type="button"
                onClick={() => setAutoGenMatric(!autoGenMatric)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>{autoGenMatric ? 'Manual Entry' : 'Auto-Generate'}</span>
              </button>
            </div>
            {autoGenMatric ? (
              <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-xs font-mono text-indigo-400 flex items-center justify-between">
                <span>{previewMatric}</span>
                <span className="text-[10px] text-slate-500 font-sans">Auto-Generated on save</span>
              </div>
            ) : (
              <input
                type="text"
                value={matric}
                onChange={e => setMatric(e.target.value)}
                placeholder={`e.g. FCC/${activeDeptCode}/2026/042`}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            )}
          </div>

          {/* Academic Level & Quota */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Academic Level</span>
                <span className="text-[10px] text-teal-400 font-mono">Tier-Locked</span>
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none font-semibold"
              >
                <option value="ND I">ND I - National Diploma 1 (Year 1)</option>
                <option value="ND II">ND II - National Diploma 2 (Year 2)</option>
                <option value="HND I">HND I - Higher National Diploma 1</option>
                <option value="HND II">HND II - Higher National Diploma 2 (Final Year)</option>
              </select>
              <p className="text-[10px] text-slate-400 leading-tight">
                ND students will only see ND books; HND students will see HND books for this department.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Borrow Quota (Books)</label>
              <input
                type="number"
                min="1"
                max="15"
                value={borrowQuota}
                onChange={e => setBorrowQuota(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Details: Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Mail size={12} className="text-slate-500" />
                <span>Student Email (Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="scholar@fccibadan.edu.ng"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Phone size={12} className="text-slate-500" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Default PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <KeyRound size={12} className="text-slate-500" />
              <span>Library Portal PIN</span>
            </label>
            <input
              type="text"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="1234"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">Student uses this PIN to authenticate at digital kiosks and borrow books.</p>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                isHod
                  ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-950'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Register Scholar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
