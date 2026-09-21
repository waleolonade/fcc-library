import React, { useState } from 'react';
import {
  Users, Key, RefreshCw, Search, Shield, CheckCircle,
  AlertTriangle, Lock, UserPlus, FileSpreadsheet, Edit, Check
} from 'lucide-react';
import { PATRON_POLICIES } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function AdminPatronManager({
  patrons,
  onUpdatePin,
  onUpdatePolicy
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [customPinInput, setCustomPinInput] = useState('');
  const [pinSuccessFeedback, setPinSuccessFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'policies' | 'sync'

  // Patron Policy state
  const [policies, setPolicies] = useState(PATRON_POLICIES);

  const filteredPatrons = (patrons || []).filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.matric.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeneratePin = (matric) => {
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}`;
    onUpdatePin(matric, randomPin);
    sounds.playSuccessChime();
    setPinSuccessFeedback({ matric, pin: randomPin });
    setTimeout(() => setPinSuccessFeedback(null), 4000);
  };

  const handleCustomPinSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatron || customPinInput.length !== 4) return;
    onUpdatePin(selectedPatron.matric, customPinInput);
    sounds.playSuccessChime();
    setPinSuccessFeedback({ matric: selectedPatron.matric, pin: customPinInput });
    setSelectedPatron(null);
    setCustomPinInput('');
    setTimeout(() => setPinSuccessFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800">
            PATRON REGISTRY & ACCESS AUTHORITY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Patron & PIN Authority Center</h2>
          <p className="text-xs text-slate-400">
            Manage student & staff privileges, generate institutional 4-digit access PINs, and enforce patron borrowing policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            Patron Directory
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'policies' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            Policy Engine
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'sync' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'}`}
          >
            SIS Sync
          </button>
        </div>
      </div>

      {pinSuccessFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span>
              New Security PIN generated for <strong>{pinSuccessFeedback.matric}</strong>:
            </span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-emerald-500 text-white font-mono font-black text-sm tracking-widest">
            {pinSuccessFeedback.pin}
          </span>
        </div>
      )}

      {/* 1. PATRON DIRECTORY & PIN GENERATOR */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-lg">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search patrons by Name, Matric, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              {filteredPatrons.length} Registered Patrons
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-4">Scholar / Patron</th>
                    <th className="p-4">Matric / ID</th>
                    <th className="p-4">Department & Level</th>
                    <th className="p-4">Active PIN</th>
                    <th className="p-4">Borrow Quota</th>
                    <th className="p-4">Clearance Status</th>
                    <th className="p-4 text-right">PIN Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPatrons.map(patron => (
                    <tr key={patron.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{patron.name}</div>
                        <div className="text-[11px] text-slate-400">{patron.email}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-indigo-300">
                        {patron.matric}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-200">{patron.department}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{patron.level}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-900 text-emerald-400 font-mono font-bold text-xs tracking-widest">
                          {patron.pin || '1234'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {patron.activeLoansCount} / {patron.borrowQuota || 5}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          patron.outstandingFines === 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {patron.clearanceStatus || 'Active Student'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleGeneratePin(patron.matric)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-bold transition"
                          title="Generate new random 4-digit PIN"
                        >
                          Auto PIN
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatron(patron);
                            setCustomPinInput(patron.pin || '');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                          title="Set custom PIN manually"
                        >
                          Custom PIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PATRON POLICY ENGINE */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(policies).map(([roleKey, policy]) => (
            <div key={roleKey} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white capitalize">{roleKey} Policy Rules</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800">
                  RULE ID: POL-{roleKey.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Max Physical Loans</label>
                  <input
                    type="number"
                    value={policy.maxLoans}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPolicies({ ...policies, [roleKey]: { ...policy, maxLoans: val } });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Loan Period (Days)</label>
                  <input
                    type="number"
                    value={policy.loanPeriodDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPolicies({ ...policies, [roleKey]: { ...policy, loanPeriodDays: val } });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Allowed Renewals</label>
                  <input
                    type="number"
                    value={policy.renewalsAllowed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPolicies({ ...policies, [roleKey]: { ...policy, renewalsAllowed: val } });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Daily Overdue Penalty (₦)</label>
                  <input
                    type="number"
                    value={policy.finePerDay}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPolicies({ ...policies, [roleKey]: { ...policy, finePerDay: val } });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Direct Payment Gateway: <strong className="text-emerald-400 font-mono">Disabled (PIN Clearance Mode)</strong></div>
                <div>Applies automatically to all patrons classified under this tier.</div>
              </div>

              <button
                onClick={() => {
                  onUpdatePolicy(roleKey, policy);
                  sounds.playSuccessChime();
                  alert(`Updated ${roleKey} policies successfully!`);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
              >
                Save {roleKey} Policy
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. STUDENT INFORMATION SYSTEM (SIS) SYNCHRONIZATION */}
      {activeTab === 'sync' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl max-w-2xl">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Student Information System (SIS) Ingestion</h3>
            <p className="text-xs text-slate-400">
              Synchronize enrolled students, graduated scholars, and departmental transfers from the central College Portal.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Connected SIS Gateway:</span>
              <strong className="text-emerald-400 font-mono">fcc-portal.edu.ng/api/v2/students</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Last Sync Timestamp:</span>
              <span className="text-slate-400 font-mono">Today, 06:00 AM (Automated Cron)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Auto-PIN Issuance:</span>
              <span className="text-emerald-400 font-bold">Enabled for New Intakes</span>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playSuccessChime();
              alert('Synchronized 2,420 student matriculation records and generated PIN tokens.');
            }}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition"
          >
            <RefreshCw size={15} /> Trigger Real-Time SIS Re-Sync
          </button>
        </div>
      )}

      {/* Custom PIN Modal */}
      {selectedPatron && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Update Access PIN for {selectedPatron.name}</h3>
            <p className="text-xs text-slate-400">
              Matriculation Number: <strong className="text-indigo-400 font-mono">{selectedPatron.matric}</strong>
            </p>

            <form onSubmit={handleCustomPinSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Enter 4-Digit Security PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={customPinInput}
                  onChange={(e) => setCustomPinInput(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatron(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
