import React, { useState } from 'react';
import {
  Shield, Users, Key, Clock, DollarSign, Upload, FileText,
  CheckCircle, Plus, Edit2, Trash2, Download, AlertTriangle,
  Building2, GraduationCap, UserCheck, ShieldAlert, Sparkles, Filter
} from 'lucide-react';

export default function InstitutionalRbacPolicies() {
  const [activeSubTab, setActiveSubTab] = useState('rbac'); // 'rbac' | 'policies' | 'batch_import'

  // Tier Borrowing Policies State
  const [tierPolicies, setTierPolicies] = useState([
    {
      tier: 'Students (ND / HND)',
      role: 'student',
      maxBooks: 2,
      loanDays: 14,
      gracePeriodDays: 3,
      dailyFine: 50,
      canReserve: true,
      canAccessTheses: true
    },
    {
      tier: 'Academic Faculty',
      role: 'faculty',
      maxBooks: 5,
      loanDays: 30,
      gracePeriodDays: 7,
      dailyFine: 20,
      canReserve: true,
      canAccessTheses: true
    },
    {
      tier: 'Department Heads (HOD)',
      role: 'hod',
      maxBooks: 10,
      loanDays: 60,
      gracePeriodDays: 14,
      dailyFine: 0,
      canReserve: true,
      canAccessTheses: true
    },
    {
      tier: 'Operational Staff & Librarians',
      role: 'librarian',
      maxBooks: 15,
      loanDays: 90,
      gracePeriodDays: 30,
      dailyFine: 0,
      canReserve: true,
      canAccessTheses: true
    }
  ]);

  // Fine Calculation Rules
  const [fineRules, setFineRules] = useState({
    dailyPenaltyFee: 50,
    lostBookMultiplier: 1.25, // 25% administrative processing surcharge
    maxWaiverLibrarian: 10000,
    maxWaiverDeskStaff: 500
  });

  // Users & Staff List
  const [usersList, setUsersList] = useState([
    { id: 'USR-001', name: 'Dr. Mrs. A. Balogun', email: 'balogun@fccibadan.edu.ng', role: 'super_admin', roleLabel: 'Super Admin & Chief Librarian', dept: 'Library Directorate', status: 'Active' },
    { id: 'USR-002', name: 'Mr. Tunde Bakare', email: 'bakare@fccibadan.edu.ng', role: 'librarian', roleLabel: 'Operational Librarian', dept: 'Circulation & Stacks', status: 'Active' },
    { id: 'USR-003', name: 'Dr. Mrs. F. A. Babalola', email: 'babalola.hod@fccibadan.edu.ng', role: 'hod', roleLabel: 'Head of Department (HOD)', dept: 'Co-operative Economics', status: 'Active' },
    { id: 'USR-004', name: 'Dr. K. E. Okonjo', email: 'okonjo.hod@fccibadan.edu.ng', role: 'hod', roleLabel: 'Head of Department (HOD)', dept: 'Computer Science', status: 'Active' },
    { id: 'USR-005', name: 'Prof. S. N. Varma', email: 'varma@fccibadan.edu.ng', role: 'faculty', roleLabel: 'Faculty Researcher', dept: 'Computer Science', status: 'Active' },
    { id: 'USR-006', name: 'Wale Olonade', email: 'w.olonade@fccibadan.edu.ng', role: 'student', roleLabel: 'Student Scholar', dept: 'Co-operative Economics', status: 'Active' }
  ]);

  // Load live patrons/users from backend API
  React.useEffect(() => {
    fetch('/api/patrons')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const apiUsers = data.map(p => ({
            id: p.matric || p.id,
            name: p.name,
            email: p.email || `${p.matric?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.fccibadan.edu.ng`,
            role: (p.role || (p.level?.includes('Faculty') ? 'faculty' : 'student')),
            roleLabel: p.level || 'Student Scholar',
            dept: p.department || 'General Studies',
            status: 'Active'
          }));
          setUsersList(prev => {
            const map = new Map();
            prev.forEach(u => map.set(u.id, u));
            apiUsers.forEach(u => map.set(u.id, u));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // Batch CSV Import Text Area (Initialized clean)
  const [batchCsvText, setBatchCsvText] = useState('');

  const loadCsvTemplate = () => {
    setBatchCsvText(
`Matric/Staff ID, Name, Email, Department, Role
FCC/CEM/2026/001, John Doe, j.doe@fccibadan.edu.ng, Co-operative Economics, student
FCC/CSC/2026/002, Jane Smith, j.smith@fccibadan.edu.ng, Computer Science, student`
    );
  };

  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [editingPolicy, setEditingPolicy] = useState(null);

  const handleExecuteBatchImport = () => {
    const lines = batchCsvText.trim().split('\n');
    if (lines.length <= 1) return;

    const newUsers = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length >= 4) {
        newUsers.push({
          id: parts[0] || `USR-${Math.floor(100 + Math.random() * 900)}`,
          name: parts[1] || 'Imported User',
          email: parts[2] || '',
          dept: parts[3] || 'General',
          role: parts[4] || 'student',
          roleLabel: parts[4] === 'faculty' ? 'Faculty Researcher' : 'Student Scholar',
          status: 'Active'
        });
      }
    }

    setUsersList([...usersList, ...newUsers]);
    setImportSuccessMsg(`Batch import successful! Ingested ${newUsers.length} institutional user accounts into RBAC directory.`);
    setTimeout(() => setImportSuccessMsg(''), 5000);
  };

  const handleUpdatePolicy = (idx, updated) => {
    const updatedList = [...tierPolicies];
    updatedList[idx] = updated;
    setTierPolicies(updatedList);
    setEditingPolicy(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Shield size={14} className="text-emerald-400" />
          <span>Institutional RBAC & Policy Configuration Engine</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Role-Based Access Control & Global System Policies
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          Super Admin oversight for user tiers (Super Admin, Librarian, HOD, Faculty, Student), circulation loan rules, fine calculation algorithms, and batch SIS student directory import.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start">
        {[
          { id: 'rbac', label: 'User Tiers & RBAC Directory', icon: Users },
          { id: 'policies', label: 'Loan Durations & Fine Rules', icon: Clock },
          { id: 'batch_import', label: 'Batch SIS / CSV Import', icon: Upload }
        ].map(st => {
          const Icon = st.icon;
          const isActive = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* FEEDBACK BANNER */}
      {importSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{importSuccessMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: RBAC DIRECTORY */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Staff & Scholars</span>
              <div className="text-2xl font-black text-white">{usersList.length} Accounts</div>
              <p className="text-[11px] text-emerald-400">Synchronized with campus directory</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-indigo-400 uppercase font-bold">Operational Staff</span>
              <div className="text-2xl font-black text-indigo-300">2 Librarians</div>
              <p className="text-[11px] text-slate-400">Desk & Cataloging Authorities</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-teal-400 uppercase font-bold">Department Heads</span>
              <div className="text-2xl font-black text-teal-300">5 HODs</div>
              <p className="text-[11px] text-slate-400">Staging Pipeline Access</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Patron Scholars</span>
              <div className="text-2xl font-black text-emerald-300">1,820 Active</div>
              <p className="text-[11px] text-slate-400">ND I, ND II, HND I, HND II</p>
            </div>
          </div>

          {/* User List Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Active RBAC Directory</h3>
              <button
                onClick={() => setActiveSubTab('batch_import')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Import Users</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Full Name & Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Assigned Role Tier</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {usersList.map((u) => {
                    const roleBadgeColor = u.role === 'super_admin'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : (u.role === 'hod'
                        ? 'bg-teal-950 text-teal-300 border-teal-800'
                        : (u.role === 'librarian'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          : 'bg-slate-950 text-slate-300 border-slate-800'));

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-emerald-400 font-bold">{u.id}</td>
                        <td className="p-3 font-sans">
                          <div className="font-bold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3 font-sans text-slate-300">{u.dept}</td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                            {u.roleLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: POLICIES & FINES */}
      {activeSubTab === 'policies' && (
        <div className="space-y-6 animate-fadeIn">
          {/* User Tier Borrowing Policies */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Tier-Based Loan Durations & Borrow Limits</h3>
              <p className="text-xs text-slate-400">
                Institutional circulation rules calibrated across Student, Faculty, and HOD tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tierPolicies.map((pol, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {pol.role.toUpperCase()} TIER
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{pol.tier}</h4>
                    </div>
                    <button
                      onClick={() => setEditingPolicy({ idx, ...pol })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
                      title="Edit Policy"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Max Limit</span>
                      <span className="text-white font-bold">{pol.maxBooks} Books</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Duration</span>
                      <span className="text-white font-bold">{pol.loanDays} Days</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Grace Period</span>
                      <span className="text-white font-bold">{pol.gracePeriodDays} Days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fine Rules & Replacement Calculation */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Fine Calculation Rules & Waiver Permissions</h3>
              <p className="text-xs text-slate-400">
                Automated daily overdue penalties and lost-book replacement surcharge policies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Standard Overdue Rate</span>
                <div className="text-xl font-black text-rose-400">₦{fineRules.dailyPenaltyFee}.00 / Day</div>
                <p className="text-[11px] text-slate-400">Accrues after grace period expires</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Lost Book Surcharge</span>
                <div className="text-xl font-black text-amber-400">Cost + 25% Admin Fee</div>
                <p className="text-[11px] text-slate-400">Replacement pricing multiplier: 1.25x</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Chief Librarian Waiver Cap</span>
                <div className="text-xl font-black text-emerald-400">₦{fineRules.maxWaiverLibrarian.toLocaleString()}.00</div>
                <p className="text-[11px] text-slate-400">Max discretionary fine clearance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BATCH IMPORT */}
      {activeSubTab === 'batch_import' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl animate-fadeIn">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Batch Student Information System (SIS) Import</h3>
            <p className="text-xs text-slate-400">
              Paste CSV or Excel export data to register new student scholars and faculty accounts in bulk.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 block font-semibold">
                CSV Format: Matric/ID, Name, Email, Department, Role (student|faculty|hod)
              </label>
              <button
                type="button"
                onClick={loadCsvTemplate}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Load CSV Format Example
              </button>
            </div>
            <textarea
              rows={6}
              value={batchCsvText}
              onChange={e => setBatchCsvText(e.target.value)}
              placeholder="Paste or type CSV lines here (e.g. Matric, Name, Email, Department, Role)..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleExecuteBatchImport}
              disabled={!batchCsvText.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-indigo-950 flex items-center gap-2"
            >
              <Upload size={14} />
              <span>Execute Batch Import ({batchCsvText.trim() ? Math.max(0, batchCsvText.trim().split('\n').length - 1) : 0} records)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
