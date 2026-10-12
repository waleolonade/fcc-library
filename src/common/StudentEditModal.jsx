import React, { useState, useEffect } from 'react';
import {
  X, Edit3, Building2, Lock, Sparkles, CheckCircle2,
  AlertCircle, ShieldCheck, Mail, Phone, KeyRound, Award, BookOpen,
  UserCheck, ShieldAlert, Save
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function StudentEditModal({
  isOpen,
  onClose,
  student = null,
  mode = 'hod', // 'hod' | 'admin'
  currentDept = null,
  departments = [],
  onStudentUpdated
}) {
  const isHod = mode === 'hod';

  const hodDeptName = currentDept?.name || 'Co-operative Economics & Management';

  const [name, setName] = useState('');
  const [matric, setMatric] = useState('');
  const [selectedDept, setSelectedDept] = useState(hodDeptName);
  const [level, setLevel] = useState('ND I');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');
  const [borrowQuota, setBorrowQuota] = useState(5);
  const [clearanceStatus, setClearanceStatus] = useState('Active Student');
  const [status, setStatus] = useState('Active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Hydrate fields whenever student changes or modal opens
  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setMatric(student.matric || '');
      setSelectedDept(student.department || (isHod ? hodDeptName : ''));
      setLevel(student.level || 'ND I');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setPin(student.pin || '1234');
      setBorrowQuota(student.borrow_quota ?? student.borrowQuota ?? 5);
      setClearanceStatus(student.clearance_status ?? student.clearanceStatus ?? 'Active Student');
      setStatus(student.status || 'Active');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [student, isOpen, isHod, hodDeptName]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Student full name is required.');
      return;
    }

    if (!matric.trim()) {
      setErrorMessage('Matriculation number is required.');
      return;
    }

    const targetDept = isHod ? hodDeptName : selectedDept;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        matric: matric.trim().toUpperCase(),
        department: targetDept,
        level: level,
        email: email.trim(),
        phone: phone.trim(),
        pin: pin.trim() || '1234',
        borrow_quota: Number(borrowQuota) || 5,
        clearance_status: clearanceStatus,
        status: status
      };

      const patronId = student.id || student.matric;
      const result = await libraryApi.patrons.updatePatron(patronId, payload);

      if (result.success) {
        sounds?.playSuccessChime?.();
        setSuccessMessage(`Scholar ${payload.name} updated successfully in database!`);
        if (onStudentUpdated) {
          onStudentUpdated(result.patron || { ...student, ...payload });
        }
        setTimeout(() => {
          onClose();
        }, 1100);
      } else {
        sounds?.playErrorBuzz?.();
        setErrorMessage(result.message || 'Could not update student. Please check database connectivity.');
      }
    } catch (err) {
      sounds?.playErrorBuzz?.();
      setErrorMessage('Server connection error while updating student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl w-full max-w-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950/20 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/40 text-teal-400 flex items-center justify-center shadow-lg shadow-teal-950/40">
              <Edit3 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Edit Scholar Profile
                </h3>
                {isHod && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                    <Lock size={10} /> HOD Scope
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Update record in institutional SQLite database • {matric}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Full Scholar Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. ADEKUNLE OLAWALE SAMUEL"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white focus:outline-none transition"
            />
          </div>

          {/* Department Selection / Lock */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Department</span>
              {isHod && (
                <span className="text-[10px] text-teal-400 font-normal lowercase flex items-center gap-1">
                  <Lock size={10} /> Locked to your department
                </span>
              )}
            </label>
            {isHod ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-teal-800/50 text-teal-300 font-semibold flex items-center justify-between">
                <span>{hodDeptName}</span>
                <span className="px-2 py-0.5 rounded-lg bg-teal-950 text-teal-400 border border-teal-800 font-mono text-[10px]">
                  {currentDept?.code || 'HOD'}
                </span>
              </div>
            ) : (
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white focus:outline-none transition"
              >
                {departments.map(d => (
                  <option key={d.code || d.name} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Matriculation & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Matriculation Number *
              </label>
              <input
                type="text"
                required
                value={matric}
                onChange={e => setMatric(e.target.value.toUpperCase())}
                placeholder="e.g. FCC/CSC/2026/042"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-teal-400 font-mono text-xs focus:outline-none transition uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Academic Level *</span>
                <span className="text-[10px] text-teal-400 font-mono font-bold lowercase">Tier-Locked</span>
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white focus:outline-none transition text-xs font-semibold"
              >
                <option value="ND I">ND I - National Diploma 1 (Year 1)</option>
                <option value="ND II">ND II - National Diploma 2 (Year 2)</option>
                <option value="HND I">HND I - Higher National Diploma 1</option>
                <option value="HND II">HND II - Higher National Diploma 2 (Final Year)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Institutional Access Policy: ND scholars strictly see only ND books; HND scholars see HND books in their department.
              </p>
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="patron@student.fccibadan.edu.ng"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-mono text-[11px] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Phone Contact
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-mono text-[11px] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Security PIN & Borrow Quota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Security PIN (Portal Login)</span>
                <span className="text-[10px] text-amber-400 font-mono">4-Digits</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-mono text-center tracking-widest text-sm focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Borrowing Quota (Books)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={borrowQuota}
                onChange={e => setBorrowQuota(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-mono text-center focus:outline-none transition"
              />
            </div>
          </div>

          {/* Clearance Status & Academic Standing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Convocation Clearance
              </label>
              <select
                value={clearanceStatus}
                onChange={e => setClearanceStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white focus:outline-none transition"
              >
                <option value="Active Student">Active Student</option>
                <option value="Cleared for Convocation ✓">Cleared for Convocation ✓</option>
                <option value="Under Administrative Clearance">Under Administrative Clearance</option>
                <option value="Graduated">Graduated / Alumni</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                Library Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white focus:outline-none transition"
              >
                <option value="Active">Active (In Good Standing)</option>
                <option value="Suspended">Suspended (Borrowing Blocked)</option>
              </select>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-teal-950 transition hover:scale-[1.01] disabled:opacity-60"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Saving to Database...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
