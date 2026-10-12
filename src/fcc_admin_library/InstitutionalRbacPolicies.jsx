import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, Users, Clock, Upload, CheckCircle, AlertCircle, Edit2, Plus,
  Search, Filter, RefreshCw, X, Save, Check, Key, UserPlus, Sliders,
  Database, DollarSign, Award, Layers, Lock, Unlock, BookOpen, ChevronRight
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function InstitutionalRbacPolicies() {
  const [activeSubTab, setActiveSubTab] = useState('rbac'); // 'rbac' | 'policies' | 'batch_import'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. RBAC Directory State
  const [usersList, setUsersList] = useState([]);
  const [rbacStats, setRbacStats] = useState({
    total: 0,
    librarians: 0,
    hods: 0,
    faculty: 0,
    students: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // 2. Policies & Fines State
  const [tierPolicies, setTierPolicies] = useState([
    {
      tier: 'Students (ND / HND)',
      role: 'student',
      maxBooks: 5,
      loanDays: 14,
      gracePeriodDays: 3,
      dailyFine: 50,
      canReserve: true,
      canAccessTheses: true
    },
    {
      tier: 'Academic Faculty',
      role: 'faculty',
      maxBooks: 10,
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

  const [fineRules, setFineRules] = useState({
    dailyPenaltyFee: 50,
    lostBookMultiplier: 1.25,
    maxWaiverLibrarian: 10000,
    maxWaiverDeskStaff: 500
  });

  // 3. Modals State
  const [editingTierPolicy, setEditingTierPolicy] = useState(null);
  const [isEditingFineRules, setIsEditingFineRules] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // New Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('librarian');
  const [newStaffDept, setNewStaffDept] = useState('Library Directorate');

  // 4. Batch SIS / CSV Import State
  const [batchCsvText, setBatchCsvText] = useState('');
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);

  const showFeedback = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      sounds?.playErrorBuzz?.();
      setTimeout(() => setErrorMsg(''), 6000);
    } else {
      setFeedbackMsg(msg);
      sounds?.playSuccessChime?.();
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

  // Fetch Policies and Directory from Central SQLite Database
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [policiesRes, rbacRes] = await Promise.all([
        libraryApi.policies.getPolicies(),
        libraryApi.rbac.getDirectory()
      ]);

      if (policiesRes && policiesRes.success) {
        if (policiesRes.tier_policies && Array.isArray(policiesRes.tier_policies)) {
          setTierPolicies(policiesRes.tier_policies);
        }
        if (policiesRes.fine_rules) {
          setFineRules(policiesRes.fine_rules);
        }
      }

      if (rbacRes && rbacRes.success) {
        setUsersList(rbacRes.users || []);
        if (rbacRes.stats) {
          setRbacStats(rbacRes.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching policies or RBAC directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Subscribe to live backend sync updates
  useEffect(() => {
    const unsubscribe = libraryApi.subscribe(event => {
      if (event && (event.type === 'POLICIES_UPDATED' || event.type === 'RBAC_UPDATED' || event.type === 'PATRONS_UPDATED')) {
        fetchAllData();
      }
    });
    return () => unsubscribe();
  }, [fetchAllData]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set();
    usersList.forEach(u => {
      if (u.dept) set.add(u.dept);
    });
    return Array.from(set).sort();
  }, [usersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (deptFilter !== 'all' && u.dept !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchId = (u.id || '').toLowerCase().includes(q);
        const matchDept = (u.dept || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [usersList, roleFilter, deptFilter, searchQuery]);

  // Save Tier Policy to Database
  const handleSaveTierPolicy = async (e) => {
    e.preventDefault();
    if (!editingTierPolicy) return;

    setIsSaving(true);
    try {
      const res = await libraryApi.policies.updateTier(editingTierPolicy.role, editingTierPolicy);
      if (res && res.success) {
        setTierPolicies(res.tier_policies || tierPolicies.map(p => p.role === editingTierPolicy.role ? editingTierPolicy : p));
        setEditingTierPolicy(null);
        showFeedback(`Borrowing policy for '${editingTierPolicy.tier}' updated and persisted to SQLite database.`);
      } else {
        showFeedback(res?.message || 'Failed to update policy in database.', true);
      }
    } catch (err) {
      showFeedback('Server error saving policy to database.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Fine Rules to Database
  const handleSaveFineRules = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await libraryApi.policies.updateFineRules(fineRules);
      if (res && res.success) {
        setIsEditingFineRules(false);
        showFeedback('Fine calculation rules and waiver caps saved to SQLite database.');
      } else {
        showFeedback(res?.message || 'Failed to update fine rules in database.', true);
      }
    } catch (err) {
      showFeedback('Server error saving fine rules.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Update User Role/Status in Database
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!editingUserRole) return;

    setIsSaving(true);
    try {
      const res = await libraryApi.rbac.updateUserRole(editingUserRole.id, {
        role: editingUserRole.role,
        status: editingUserRole.status,
        borrow_quota: editingUserRole.borrow_quota
      });

      if (res && res.success) {
        setEditingUserRole(null);
        showFeedback(`Role and privileges for ${editingUserRole.name} updated in database.`);
        fetchAllData();
      } else {
        showFeedback(res?.message || 'Failed to update user role in database.', true);
      }
    } catch (err) {
      showFeedback('Server error updating user role.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Staff Account in Database
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showFeedback('Please provide full name and institutional email.', true);
      return;
    }

    setIsSaving(true);
    try {
      const res = await libraryApi.rbac.createStaffUser({
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        role: newStaffRole,
        department: newStaffDept
      });

      if (res && res.success) {
        setIsAddingStaff(false);
        setNewStaffName('');
        setNewStaffEmail('');
        showFeedback(`Staff account for ${newStaffName} created and saved in SQLite database!`);
        fetchAllData();
      } else {
        showFeedback(res?.message || 'Failed to create staff account in database.', true);
      }
    } catch (err) {
      showFeedback('Server error creating staff account.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Load CSV Format Template
  const loadCsvTemplate = () => {
    setBatchCsvText(
`Matric/Staff ID, Name, Email, Department, Role, Level, Quota
FCC/CEM/2026/101, Tobiloba Adeleke, t.adeleke@student.fccibadan.edu.ng, Co-operative Economics & Management, student, ND I, 5
FCC/CSC/2026/102, Fatima Mohammed, f.mohammed@student.fccibadan.edu.ng, Computer Science & Information Technology, student, HND I, 5
FCC/BNF/2026/103, Emeka Eze, e.eze@student.fccibadan.edu.ng, Banking & Finance, student, ND II, 5
FCC/FAC/2026/001, Dr. Samuel K. Johnson, s.johnson@fccibadan.edu.ng, Computer Science & Information Technology, faculty, Academic Faculty, 10`
    );
    sounds?.playClick?.();
  };

  // Execute Batch CSV Import via Backend Database API
  const handleExecuteBatchImport = async () => {
    const rawLines = batchCsvText.trim().split('\n');
    if (rawLines.length <= 1) {
      showFeedback('Please paste at least one student or staff data row.', true);
      return;
    }

    const students = [];
    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        const matric = parts[0];
        const name = parts[1];
        const email = parts[2] || '';
        const dept = parts[3] || 'Co-operative Economics & Management';
        const role = (parts[4] || 'student').toLowerCase();
        const level = parts[5] || (role === 'faculty' ? 'Academic Faculty' : 'ND I');
        const quota = parseInt(parts[6], 10) || (role === 'faculty' ? 10 : 5);

        students.push({
          matric,
          name,
          email,
          department: dept,
          role,
          level,
          borrow_quota: quota
        });
      }
    }

    if (students.length === 0) {
      showFeedback('Could not parse any valid student or staff records from CSV text.', true);
      return;
    }

    setIsExecutingBatch(true);
    try {
      const res = await libraryApi.patrons.bulkStore({ students });
      if (res && res.success) {
        showFeedback(`Batch import complete! Ingested and synchronized ${res.imported_count || students.length} accounts directly into SQLite database.`);
        setBatchCsvText('');
        fetchAllData();
        setTimeout(() => setActiveSubTab('rbac'), 1500);
      } else {
        showFeedback(res?.message || 'Database bulk import error.', true);
      }
    } catch (err) {
      showFeedback('Server error during batch import to database.', true);
    } finally {
      setIsExecutingBatch(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 absolute top-0 left-0" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Shield size={14} className="text-emerald-400" />
              <span>Institutional RBAC & Policy Configuration Engine</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Role-Based Access Control & Global System Policies
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Super Admin institutional oversight for user tiers, loan duration policies, fine calculation algorithms, and batch SIS student directory synchronization with the central SQLite database.
            </p>
          </div>

          <button
            onClick={() => {
              sounds?.playClick?.();
              fetchAllData();
            }}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              isLoading ? 'opacity-70 cursor-wait' : ''
            }`}
            title="Refresh policies and users from central database"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-teal-400' : 'text-slate-400'} />
            <span>{isLoading ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start">
        {[
          { id: 'rbac', label: 'User Tiers & RBAC Directory', icon: Users, badge: rbacStats.total },
          { id: 'policies', label: 'Loan Durations & Fine Rules', icon: Clock },
          { id: 'batch_import', label: 'Batch SIS / CSV Import', icon: Upload }
        ].map(st => {
          const Icon = st.icon;
          const isActive = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => {
                setActiveSubTab(st.id);
                sounds?.playClick?.();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              <span>{st.label}</span>
              {st.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {st.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FEEDBACK BANNERS */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 1: RBAC DIRECTORY
          ========================================================================= */}
      {activeSubTab === 'rbac' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Live Database KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                <Users size={12} className="text-slate-400" />
                <span>Total Registered Accounts</span>
              </span>
              <div className="text-2xl font-black text-white">{rbacStats.total} Records</div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Database size={11} /> Live SQLite Directory
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                <Shield size={12} className="text-indigo-400" />
                <span>Operational Staff</span>
              </span>
              <div className="text-2xl font-black text-indigo-300">{rbacStats.librarians} Librarians</div>
              <p className="text-[11px] text-slate-400">Desk & Cataloguing Authorities</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-teal-400 uppercase font-bold flex items-center gap-1">
                <Award size={12} className="text-teal-400" />
                <span>Department Heads</span>
              </span>
              <div className="text-2xl font-black text-teal-300">{rbacStats.hods} HODs</div>
              <p className="text-[11px] text-slate-400">Curriculum Staging & Approvals</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                <BookOpen size={12} className="text-emerald-400" />
                <span>Patron Scholars</span>
              </span>
              <div className="text-2xl font-black text-emerald-300">{rbacStats.students} Students</div>
              <p className="text-[11px] text-slate-400">ND I, ND II, HND I, HND II</p>
            </div>
          </div>

          {/* User List Table & Filter Header */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Institutional RBAC Directory</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {filteredUsers.length} shown
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage role privilege assignments, borrowing quotas, and active account status.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddingStaff(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus size={13} />
                  <span>Add Staff Account</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('batch_import')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Bulk Import</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, Matric / Staff ID, Email or Department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Role & Dept Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Role Tiers</option>
                  <option value="super_admin">Super Admins</option>
                  <option value="librarian">Librarians</option>
                  <option value="hod">HODs</option>
                  <option value="faculty">Faculty</option>
                  <option value="student">Students</option>
                </select>

                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500 max-w-[200px]"
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3.5">User / Matric ID</th>
                    <th className="p-3.5">Full Name & Email</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Assigned Role Tier</th>
                    <th className="p-3.5">Quota</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No user records match the search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleBadgeColor = u.role === 'super_admin'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : (u.role === 'hod'
                          ? 'bg-teal-950 text-teal-300 border-teal-800'
                          : (u.role === 'librarian'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                            : (u.role === 'faculty'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800')));

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 text-emerald-400 font-bold">{u.id}</td>
                          <td className="p-3.5 font-sans">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="p-3.5 font-sans text-slate-300">{u.dept}</td>
                          <td className="p-3.5 font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                              {u.roleLabel || u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {u.borrow_quota ? `${u.borrow_quota} bks` : '—'}
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${
                              u.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`} />
                              {u.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-sans">
                            <button
                              onClick={() => setEditingUserRole({ ...u })}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                              title="Modify role, status or quota in database"
                            >
                              Edit Role
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: POLICIES & FINES
          ========================================================================= */}
      {activeSubTab === 'policies' && (
        <div className="space-y-6 animate-fadeIn">
          {/* User Tier Borrowing Policies */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  <span>Tier-Based Loan Durations & Borrow Limits</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Institutional circulation rules calibrated across Student, Faculty, HOD, and Staff tiers. Stored directly in central database.
                </p>
              </div>

              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg shrink-0">
                <span>Database Sync Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tierPolicies.map((pol, idx) => (
                <div key={pol.role || idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-slate-700 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {pol.role.toUpperCase()} TIER
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{pol.tier}</h4>
                    </div>
                    <button
                      onClick={() => {
                        sounds?.playClick?.();
                        setEditingTierPolicy({ ...pol });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      title="Edit Policy in SQLite Database"
                    >
                      <Edit2 size={12} className="text-indigo-400" />
                      <span>Edit Policy</span>
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

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Daily Fine: <strong className="text-rose-400 font-mono">₦{pol.dailyFine || 0}.00</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 ${pol.canReserve ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {pol.canReserve ? <Check size={11} /> : <X size={11} />} Reserve
                      </span>
                      <span className={`flex items-center gap-1 ${pol.canAccessTheses ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {pol.canAccessTheses ? <Check size={11} /> : <X size={11} />} Theses
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fine Rules & Replacement Calculation */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-rose-400" />
                  <span>Fine Calculation Rules & Waiver Permissions</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Automated daily overdue penalties and lost-book replacement surcharge policies stored in database.
                </p>
              </div>

              <button
                onClick={() => {
                  sounds?.playClick?.();
                  setIsEditingFineRules(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Sliders size={13} className="text-rose-400" />
                <span>Configure Fine Rules</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Standard Overdue Rate</span>
                <div className="text-xl font-black text-rose-400">₦{fineRules.dailyPenaltyFee}.00 / Day</div>
                <p className="text-[11px] text-slate-400">Accrues after grace period expires</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Lost Book Surcharge</span>
                <div className="text-xl font-black text-amber-400">Cost + {Math.round((fineRules.lostBookMultiplier - 1) * 100)}% Admin Surcharge</div>
                <p className="text-[11px] text-slate-400">Replacement multiplier: {fineRules.lostBookMultiplier}x</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase block text-[10px]">Chief Librarian Waiver Cap</span>
                <div className="text-xl font-black text-emerald-400">₦{Number(fineRules.maxWaiverLibrarian || 10000).toLocaleString()}.00</div>
                <p className="text-[11px] text-slate-400">Max discretionary fine clearance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: BATCH SIS / CSV IMPORT
          ========================================================================= */}
      {activeSubTab === 'batch_import' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl animate-fadeIn">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload size={16} className="text-indigo-400" />
                <span>Batch Student Information System (SIS) Import</span>
              </h3>
              <p className="text-xs text-slate-400">
                Paste CSV student roster to register and synchronize student scholars directly into the central SQLite database.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
              Direct DB Ingestion
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 block font-semibold">
                CSV Headers: Matric/Staff ID, Name, Email, Department, Role (student|faculty), Level, Quota
              </label>
              <button
                type="button"
                onClick={loadCsvTemplate}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <span>Load CSV Format Example</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={batchCsvText}
              onChange={e => setBatchCsvText(e.target.value)}
              placeholder="Paste CSV lines here (e.g. FCC/CSC/2026/042, John Doe, j.doe@student.fccibadan.edu.ng, Computer Science, student, ND I, 5)..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400">
              Records are committed to the institutional <code className="text-emerald-400">patrons</code> SQLite table with default PIN 1234.
            </p>

            <button
              onClick={handleExecuteBatchImport}
              disabled={!batchCsvText.trim() || isExecutingBatch}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-indigo-950 flex items-center gap-2 cursor-pointer"
            >
              <Upload size={14} className={isExecutingBatch ? 'animate-bounce' : ''} />
              <span>
                {isExecutingBatch
                  ? 'Saving to Database...'
                  : `Execute Batch Import (${batchCsvText.trim() ? Math.max(0, batchCsvText.trim().split('\n').filter(l => l.trim()).length - 1) : 0} records)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EDIT TIER POLICY
          ========================================================================= */}
      {editingTierPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders size={16} className="text-indigo-400" />
                  <span>Configure {editingTierPolicy.tier}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update borrowing limits and duration rules in the SQLite database.
                </p>
              </div>
              <button
                onClick={() => setEditingTierPolicy(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTierPolicy} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Max Books Borrow Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingTierPolicy.maxBooks}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, maxBooks: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Loan Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editingTierPolicy.loanDays}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, loanDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Grace Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editingTierPolicy.gracePeriodDays}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, gracePeriodDays: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Daily Overdue Fine (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={editingTierPolicy.dailyFine}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, dailyFine: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTierPolicy.canReserve}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, canReserve: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-200">Permit Title Reservations & Hold Shelf Booking</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTierPolicy.canAccessTheses}
                    onChange={e => setEditingTierPolicy({ ...editingTierPolicy, canAccessTheses: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-200">Allow Capstone Research & Dissertations Archive Access</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTierPolicy(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Policy to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIGURE FINE RULES
          ========================================================================= */}
      {isEditingFineRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-rose-400" />
                  <span>Configure Fine & Waiver Parameters</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Update global institutional penalties and waiver allowances.
                </p>
              </div>
              <button
                onClick={() => setIsEditingFineRules(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFineRules} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Standard Daily Penalty Fee (₦ / day)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={fineRules.dailyPenaltyFee}
                  onChange={e => setFineRules({ ...fineRules, dailyPenaltyFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Lost Book Replacement Surcharge Multiplier</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  step="0.05"
                  value={fineRules.lostBookMultiplier}
                  onChange={e => setFineRules({ ...fineRules, lostBookMultiplier: parseFloat(e.target.value) || 1.25 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
                <p className="text-[10px] text-slate-500">e.g. 1.25 equals Book Cost + 25% administrative surcharge</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Chief Librarian Waiver Cap (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={fineRules.maxWaiverLibrarian}
                    onChange={e => setFineRules({ ...fineRules, maxWaiverLibrarian: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Circulation Desk Waiver Cap (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={fineRules.maxWaiverDeskStaff}
                    onChange={e => setFineRules({ ...fineRules, maxWaiverDeskStaff: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingFineRules(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-950"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Fine Rules'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT USER ROLE & PRIVILEGES
          ========================================================================= */}
      {editingUserRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key size={16} className="text-teal-400" />
                  <span>Edit Account Privileges</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {editingUserRole.name} • {editingUserRole.id}
                </p>
              </div>
              <button
                onClick={() => setEditingUserRole(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUserRole} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Assigned Role Tier</label>
                <select
                  value={editingUserRole.role}
                  onChange={e => setEditingUserRole({ ...editingUserRole, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                >
                  <option value="student">Student Scholar</option>
                  <option value="faculty">Academic Faculty Member</option>
                  <option value="hod">Head of Department (HOD)</option>
                  <option value="librarian">Operational Librarian</option>
                  <option value="super_admin">Super Admin & Chief Librarian</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Account Status</label>
                  <select
                    value={editingUserRole.status || 'Active'}
                    onChange={e => setEditingUserRole({ ...editingUserRole, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated / Alumni</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Borrow Quota (Books)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editingUserRole.borrow_quota || 5}
                    onChange={e => setEditingUserRole({ ...editingUserRole, borrow_quota: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUserRole(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-teal-950"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save Role Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: ADD STAFF ACCOUNT
          ========================================================================= */}
      {isAddingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-indigo-400" />
                  <span>Register Institutional Staff</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Create librarian or faculty staff account directly in SQLite database.
                </p>
              </div>
              <button
                onClick={() => setIsAddingStaff(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Staff Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Adeola Johnson"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Institutional Email *</label>
                <input
                  type="email"
                  placeholder="e.g. a.johnson@fccibadan.edu.ng"
                  value={newStaffEmail}
                  onChange={e => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Staff Role</label>
                  <select
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="librarian">Operational Librarian</option>
                    <option value="faculty">Academic Faculty</option>
                    <option value="super_admin">Library Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Department / Unit</label>
                  <select
                    value={newStaffDept}
                    onChange={e => setNewStaffDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="Library Directorate">Library Directorate</option>
                    <option value="Circulation & Stacks">Circulation & Stacks</option>
                    <option value="Cataloguing & Metadata">Cataloguing & Metadata</option>
                    <option value="Computer Science & Information Technology">Computer Science</option>
                    <option value="Co-operative Economics & Management">Co-operative Economics</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Registering...' : 'Register Staff Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
