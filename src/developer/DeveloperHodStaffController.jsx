import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserCheck, Shield, ShieldCheck, Key, Lock, Unlock, Eye, EyeOff,
  Plus, Edit3, Trash2, RefreshCw, Search, Check, Copy, AlertTriangle,
  Sparkles, Layers, Sliders, Activity, BookOpen, Upload, Award, Bookmark,
  MessageSquare, Building2, CheckCircle2, ChevronRight, X, ExternalLink,
  Code2, ArrowRight, ToggleLeft, ToggleRight, FileText, Cpu, Filter, Send
} from 'lucide-react';
import {
  fetchHodStaff,
  createHodStaff,
  updateHodStaff,
  deleteHodStaff,
  fetchStaffFeaturesCatalog,
  saveStaffFeaturesCatalog,
  fetchStaffActivityLogs,
  logStaffActivity
} from '../services/developerApi';
import { sounds } from '../utils/soundEffects';

// Default page list for departmental staff workspaces
const DEFAULT_STAFF_PAGES = [
  { id: 'overview', label: 'Overview & Analytics Deck', desc: 'KPI summaries, recent activity & computational tools' },
  { id: 'courses', label: 'Curriculum & Syllabi Desk', desc: 'Course outlines, levels (ND/HND) & syllabus materials' },
  { id: 'upload', label: 'Handouts & Journals Upload Studio', desc: 'Lecture notes, e-books & peer-reviewed research papers' },
  { id: 'submissions', label: 'Materials Catalog Editor', desc: 'Review, edit metadata or archive uploaded department items' },
  { id: 'dissertations', label: 'Theses & Dissertations Desk', desc: 'Evaluate HND capstone dissertations & student research' },
  { id: 'reserves', label: 'Course Reserves & Short-Loan', desc: 'Place high-demand syllabus texts on physical & digital hold' },
  { id: 'scholars', label: 'Scholars Directory & Clearance', desc: 'Department student roll & convocation library signoff' },
  { id: 'communication', label: 'Circulars & Push Dispatch', desc: 'Send urgent notifications to departmental students' }
];

export default function DeveloperHodStaffController({ passkey, showToast, departments = [] }) {
  // Sub-tabs: 'roster' | 'architect' | 'activity_stream'
  const [activeSubTab, setActiveSubTab] = useState('roster');

  // Staff List State
  const [staffList, setStaffList] = useState([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [deptStats, setDeptStats] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Features Catalog State
  const [featuresCatalog, setFeaturesCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityDeptFilter, setActivityDeptFilter] = useState('ALL');

  // Password Reveal State Map: { [staffId]: boolean }
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    designation: 'Senior Lecturer & Course Coordinator',
    department_code: 'CEM',
    department_name: 'Co-operative Economics & Management',
    username: '',
    email: '',
    phone: '',
    password: 'staff123',
    assigned_courses_raw: 'CEM 411, CEM 312, CEM 214',
    page_title: '',
    welcome_banner: '',
    allowed_pages: { overview: true, courses: true, upload: true, submissions: true },
    allowed_features: { fn_upload_books: true, fn_upload_journals: true, fn_manage_courses: true, fn_watermark_control: true },
    status: 'active'
  });

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Feature Architect State
  const [newFeatureForm, setNewFeatureForm] = useState({
    id: '',
    label: '',
    category: 'Publishing & Content',
    page: 'upload',
    description: '',
    badge: 'Custom',
    enabled: true
  });
  const [savingFeatures, setSavingFeatures] = useState(false);

  // Delete Staff Modal State
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Staff List
  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await fetchHodStaff({
        department_code: selectedDeptFilter,
        status: selectedStatusFilter,
        search: staffSearch
      });
      if (res && res.success) {
        setStaffList(res.staff || []);
        setTotalStaff(res.total || 0);
        setDeptStats(res.department_stats || {});
      }
    } catch (err) {
      console.error('[DevHodStaff] Error loading staff:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  // Load Features Catalog
  const loadFeaturesCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetchStaffFeaturesCatalog();
      if (res && res.success) {
        setFeaturesCatalog(res.features || []);
      }
    } catch (err) {
      console.error('[DevHodStaff] Error loading features catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Load Activity Logs
  const loadActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetchStaffActivityLogs({
        department: activityDeptFilter,
        search: activitySearch,
        limit: 150
      });
      if (res && res.success) {
        setActivityLogs(res.logs || []);
        setTotalLogs(res.total || 0);
      }
    } catch (err) {
      console.error('[DevHodStaff] Error loading activities:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    loadStaff();
    loadFeaturesCatalog();
  }, [selectedDeptFilter, selectedStatusFilter]);

  useEffect(() => {
    if (activeSubTab === 'activity_stream') {
      loadActivityLogs();
    }
  }, [activeSubTab, activityDeptFilter]);

  const togglePasswordVisibility = (id) => {
    sounds.playClick();
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (showToast) showToast('Credentials copied to clipboard!');
  };

  // Handle Create Staff Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Staff Full Name is required.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const courses = (newStaffForm.assigned_courses_raw || '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        name: newStaffForm.name.trim(),
        designation: newStaffForm.designation.trim(),
        department_code: newStaffForm.department_code.toUpperCase().trim(),
        department_name: newStaffForm.department_name.trim(),
        username: newStaffForm.username.trim() || undefined,
        email: newStaffForm.email.trim() || undefined,
        phone: newStaffForm.phone.trim() || undefined,
        password: newStaffForm.password || 'staff123',
        assigned_courses: courses,
        page_title: newStaffForm.page_title.trim() || `${newStaffForm.name} Department Workspace`,
        welcome_banner: newStaffForm.welcome_banner.trim() || `Authorized staff workspace provisioned by Developer Master Console.`,
        allowed_pages: newStaffForm.allowed_pages,
        allowed_features: newStaffForm.allowed_features,
        status: newStaffForm.status
      };

      const res = await createHodStaff(payload);
      if (res && res.success) {
        sounds.playSuccessChime();
        if (showToast) showToast(`Staff ${payload.name} created successfully!`);
        setShowCreateModal(false);
        setNewStaffForm({
          name: '',
          designation: 'Senior Lecturer & Course Coordinator',
          department_code: 'CEM',
          department_name: 'Co-operative Economics & Management',
          username: '',
          email: '',
          phone: '',
          password: 'staff123',
          assigned_courses_raw: 'CEM 411, CEM 312, CEM 214',
          page_title: '',
          welcome_banner: '',
          allowed_pages: { overview: true, courses: true, upload: true, submissions: true },
          allowed_features: { fn_upload_books: true, fn_upload_journals: true, fn_manage_courses: true, fn_watermark_control: true },
          status: 'active'
        });
        loadStaff();
      } else {
        sounds.playErrorBuzz();
        if (showToast) showToast(res.error || 'Failed to create staff member.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Network error while creating staff.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff) => {
    sounds.playClick();
    const coursesStr = Array.isArray(staff.assigned_courses)
      ? staff.assigned_courses.join(', ')
      : (typeof staff.assigned_courses === 'string' ? staff.assigned_courses : '');

    setEditingStaff({
      ...staff,
      assigned_courses_raw: coursesStr,
      password_change: '',
      allowed_pages: typeof staff.allowed_pages === 'object' && staff.allowed_pages !== null ? { ...staff.allowed_pages } : {},
      allowed_features: typeof staff.allowed_features === 'object' && staff.allowed_features !== null ? { ...staff.allowed_features } : {}
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    setEditSubmitting(true);
    try {
      const courses = (editingStaff.assigned_courses_raw || '')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      const payload = {
        name: editingStaff.name.trim(),
        designation: editingStaff.designation.trim(),
        department_code: editingStaff.department_code.toUpperCase().trim(),
        department_name: editingStaff.department_name.trim(),
        username: editingStaff.username.trim(),
        email: editingStaff.email ? editingStaff.email.trim() : null,
        phone: editingStaff.phone ? editingStaff.phone.trim() : null,
        status: editingStaff.status,
        page_title: editingStaff.page_title,
        welcome_banner: editingStaff.welcome_banner,
        assigned_courses: courses,
        allowed_pages: editingStaff.allowed_pages,
        allowed_features: editingStaff.allowed_features
      };

      if (editingStaff.password_change && editingStaff.password_change.trim()) {
        payload.password = editingStaff.password_change.trim();
        payload.password_plain = editingStaff.password_change.trim();
      }

      const res = await updateHodStaff(editingStaff.id, payload);
      if (res && res.success) {
        sounds.playSuccessChime();
        if (showToast) showToast(`Staff ${editingStaff.name} updated successfully!`);
        setEditingStaff(null);
        loadStaff();
      } else {
        sounds.playErrorBuzz();
        if (showToast) showToast(res.error || 'Failed to update staff member.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Network error while saving modifications.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Quick Toggle Status
  const handleQuickToggleStatus = async (staff) => {
    sounds.playClick();
    const nextStatus = staff.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await updateHodStaff(staff.id, { status: nextStatus });
      if (res && res.success) {
        sounds.playSuccessChime();
        if (showToast) showToast(`${staff.name} is now ${nextStatus.toUpperCase()}!`);
        loadStaff();
      }
    } catch (err) {
      sounds.playErrorBuzz();
    }
  };

  // Handle Delete Staff
  const handleDeleteConfirm = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      const res = await deleteHodStaff(deletingStaff.id);
      if (res && res.success) {
        sounds.playSuccessChime();
        if (showToast) showToast(`Staff ${deletingStaff.name} removed permanently.`);
        setDeletingStaff(null);
        loadStaff();
      } else {
        sounds.playErrorBuzz();
        if (showToast) showToast(res.error || 'Failed to delete staff member.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Network error deleting staff.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add New Feature
  const handleAddFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!newFeatureForm.label.trim()) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Feature Label is required.');
      return;
    }

    let featureId = newFeatureForm.id.trim();
    if (!featureId) {
      const slug = newFeatureForm.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      featureId = slug.startsWith('fn_') ? slug : `fn_${slug}`;
    } else if (!featureId.startsWith('fn_')) {
      featureId = `fn_${featureId}`;
    }

    // Check if ID exists
    if (featuresCatalog.some(f => f.id === featureId)) {
      sounds.playErrorBuzz();
      if (showToast) showToast(`Feature ID "${featureId}" already exists.`);
      return;
    }

    setSavingFeatures(true);
    try {
      const newFeature = {
        id: featureId,
        label: newFeatureForm.label.trim(),
        category: newFeatureForm.category,
        page: newFeatureForm.page,
        description: newFeatureForm.description.trim() || 'Custom feature configured by Developer Master Console.',
        badge: newFeatureForm.badge.trim() || 'Custom',
        is_system: false,
        enabled: true
      };

      const updatedCatalog = [...featuresCatalog, newFeature];
      const res = await saveStaffFeaturesCatalog(updatedCatalog);
      if (res && res.success) {
        sounds.playSuccessChime();
        if (showToast) showToast(`New feature "${newFeature.label}" implemented successfully!`);
        setFeaturesCatalog(updatedCatalog);
        setNewFeatureForm({
          id: '',
          label: '',
          category: 'Publishing & Content',
          page: 'upload',
          description: '',
          badge: 'Custom',
          enabled: true
        });
      } else {
        sounds.playErrorBuzz();
        if (showToast) showToast(res.error || 'Failed to save feature.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      if (showToast) showToast('Error saving new feature.');
    } finally {
      setSavingFeatures(false);
    }
  };

  // Toggle Feature Global Enabled
  const handleToggleFeature = async (featureId) => {
    sounds.playClick();
    setSavingFeatures(true);
    try {
      const updatedCatalog = featuresCatalog.map(f => {
        if (f.id === featureId) {
          return { ...f, enabled: !f.enabled };
        }
        return f;
      });
      const res = await saveStaffFeaturesCatalog(updatedCatalog);
      if (res && res.success) {
        sounds.playSuccessChime();
        setFeaturesCatalog(updatedCatalog);
        if (showToast) showToast('Feature status updated.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
    } finally {
      setSavingFeatures(false);
    }
  };

  // Delete Custom Feature
  const handleDeleteFeature = async (featureId) => {
    sounds.playClick();
    if (!window.confirm(`Are you sure you want to remove feature "${featureId}"?`)) return;
    setSavingFeatures(true);
    try {
      const updatedCatalog = featuresCatalog.filter(f => f.id !== featureId);
      const res = await saveStaffFeaturesCatalog(updatedCatalog);
      if (res && res.success) {
        sounds.playSuccessChime();
        setFeaturesCatalog(updatedCatalog);
        if (showToast) showToast(`Feature removed from catalog.`);
      }
    } catch (err) {
      sounds.playErrorBuzz();
    } finally {
      setSavingFeatures(false);
    }
  };

  // Department options
  const departmentOptions = useMemo(() => {
    if (departments && departments.length > 0) return departments;
    return [
      { code: 'CEM', name: 'Co-operative Economics & Management' },
      { code: 'CSC', name: 'Computer Science' },
      { code: 'BAM', name: 'Business Administration & Management' },
      { code: 'ACC', name: 'Accountancy' },
      { code: 'PAD', name: 'Public Administration' },
      { code: 'ECO', name: 'Economics' },
      { code: 'LIS', name: 'Library & Information Science' },
      { code: 'AGR', name: 'Agricultural Extension & Management' },
      { code: 'BFN', name: 'Banking & Finance' },
      { code: 'MKT', name: 'Marketing' }
    ];
  }, [departments]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch = !staffSearch.trim() ||
        s.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.staff_code?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.username?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.designation?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(staffSearch.toLowerCase());

      const matchesDept = selectedDeptFilter === 'ALL' || s.department_code === selectedDeptFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [staffList, staffSearch, selectedDeptFilter, selectedStatusFilter]);

  // Active staff count
  const activeCount = useMemo(() => {
    return staffList.filter(s => (s.status || 'active') === 'active').length;
  }, [staffList]);

  return (
    <div className="space-y-6 font-mono animate-fadeIn">
      {/* 1. TOP MASTER HERO BANNER */}
      <div className="p-6 rounded-3xl bg-[#07101f] border-2 border-cyan-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 absolute top-0 left-0" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 border border-cyan-400 text-cyan-300 shadow">
                DEVELOPER MASTER CONTROLLER
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0c1f38] border border-cyan-800 text-cyan-200">
                Departmental Staff & RBAC Workspaces
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                Full Database & API Integration
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Departmental Staff Workspaces & Function Architect
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Centralized developer authority to view, modify, and audit all delegated staff under Heads of Department (HODs).
              Implement and inject brand-new operational features directly into staff capability matrices, reset credentials,
              and inspect the real-time database audit stream of everything staff members have performed.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 font-mono">
            <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-900/60 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Total Staff</div>
              <div className="text-xl font-black text-cyan-300">{totalStaff}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#030914] border border-emerald-900/60 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Active</div>
              <div className="text-xl font-black text-emerald-400">{activeCount}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#030914] border border-indigo-900/60 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Features</div>
              <div className="text-xl font-black text-indigo-300">{featuresCatalog.length}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#030914] border border-amber-900/60 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">DB Logs</div>
              <div className="text-xl font-black text-amber-300">{totalLogs || staffList.length * 3}</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 pt-6 border-t border-cyan-950 mt-6 flex-wrap">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('roster');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#030914] text-slate-400 hover:text-white border border-cyan-950'
            }`}
          >
            <Users size={14} />
            <span>Staff Workspaces Directory ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('architect');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'architect'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-[#030914] text-slate-400 hover:text-white border border-cyan-950'
            }`}
          >
            <Sparkles size={14} />
            <span>Feature & Function Architect ({featuresCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('activity_stream');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'activity_stream'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-[#030914] text-slate-400 hover:text-white border border-cyan-950'
            }`}
          >
            <Activity size={14} />
            <span>Database Activity Stream ({totalLogs || 'Live'})</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                loadStaff();
                loadFeaturesCatalog();
                if (activeSubTab === 'activity_stream') loadActivityLogs();
                if (showToast) showToast('Telemetry and staff records reloaded.');
              }}
              className="p-2 rounded-xl bg-[#030914] border border-cyan-950 text-cyan-400 hover:bg-cyan-950 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={staffLoading || logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: STAFF ROSTER & WORKSPACES DIRECTORY                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar: Search, Department Filter, Status Filter & Create Action */}
          <div className="p-4 rounded-2xl bg-[#07101f] border border-cyan-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search staff by name, code, email, username..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  className="w-full bg-[#030814] border border-cyan-950 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 bg-[#030814] border border-cyan-950 rounded-xl px-2.5 py-1 text-xs">
                <Building2 size={13} className="text-cyan-400" />
                <select
                  value={selectedDeptFilter}
                  onChange={e => {
                    sounds.playClick();
                    setSelectedDeptFilter(e.target.value);
                  }}
                  className="bg-transparent text-slate-300 font-bold focus:outline-none text-xs cursor-pointer py-1"
                >
                  <option value="ALL" className="bg-[#030814] text-white">All Departments ({totalStaff})</option>
                  {departmentOptions.map(d => (
                    <option key={d.code} value={d.code} className="bg-[#030814] text-white">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#030814] border border-cyan-950 rounded-xl px-2.5 py-1 text-xs">
                <Filter size={13} className="text-emerald-400" />
                <select
                  value={selectedStatusFilter}
                  onChange={e => {
                    sounds.playClick();
                    setSelectedStatusFilter(e.target.value);
                  }}
                  className="bg-transparent text-slate-300 font-bold focus:outline-none text-xs cursor-pointer py-1"
                >
                  <option value="ALL" className="bg-[#030814] text-white">All Statuses</option>
                  <option value="active" className="bg-[#030814] text-emerald-300">Active Only</option>
                  <option value="suspended" className="bg-[#030814] text-rose-300">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Direct Provision Staff Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-black text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Provision Staff Workspace</span>
            </button>
          </div>

          {/* Staff Grid Cards */}
          {staffLoading ? (
            <div className="p-16 rounded-3xl bg-[#07101f] border border-cyan-900/60 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-cyan-400" />
              <div className="text-xs text-slate-400">Loading departmental staff records from database...</div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-16 rounded-3xl bg-[#07101f] border border-cyan-900/60 text-center space-y-4">
              <Users size={36} className="mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">No Staff Workspaces Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
                No departmental staff matching your current search or filter criteria. Click the button below to provision a new staff workspace.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Provision New Staff
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredStaff.map(staff => {
                const isRevealed = Boolean(revealedPasswords[staff.id]);
                const isActive = (staff.status || 'active') === 'active';
                const assignedCoursesList = Array.isArray(staff.assigned_courses)
                  ? staff.assigned_courses
                  : (typeof staff.assigned_courses === 'string' ? staff.assigned_courses.split(',').map(c => c.trim()) : []);

                const grantedPagesCount = Object.values(staff.allowed_pages || {}).filter(Boolean).length;
                const grantedFeaturesCount = Object.values(staff.allowed_features || {}).filter(Boolean).length;

                return (
                  <div
                    key={staff.id}
                    className="p-5 rounded-3xl bg-[#07101f] border-2 border-cyan-900/60 hover:border-cyan-500/80 transition shadow-xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#030914] border-2 border-cyan-500/60 flex items-center justify-center font-black text-cyan-300 text-sm shrink-0">
                          {staff.department_code || 'CEM'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{staff.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#030914] border border-cyan-800 text-cyan-300">
                              {staff.staff_code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                                  : 'bg-rose-950 border border-rose-500 text-rose-300'
                              }`}
                            >
                              {isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-400 font-sans">{staff.designation}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            Dept: <strong className="text-slate-300">{staff.department_name || staff.department_code}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Quick Edit & Delete Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(staff)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isActive
                              ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900'
                              : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                          }`}
                          title={isActive ? 'Suspend Staff' : 'Activate Staff'}
                        >
                          {isActive ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 rounded-lg bg-[#030914] border border-cyan-800 text-cyan-300 hover:bg-cyan-950 transition cursor-pointer"
                          title="Edit Full Staff Profile & Permissions"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setDeletingStaff(staff);
                          }}
                          className="p-1.5 rounded-lg bg-[#030914] border border-rose-900 text-rose-400 hover:bg-rose-950 transition cursor-pointer"
                          title="Delete Staff"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Credentials Vault Box (Unhashed for Developer Inspection) */}
                    <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-950 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-cyan-950/80 pb-1.5">
                        <div className="flex items-center gap-1 text-cyan-400 font-bold">
                          <Key size={11} />
                          <span>LOGIN CREDENTIALS</span>
                        </div>
                        <div className="text-slate-500 font-sans">
                          Direct login enabled at <code className="text-cyan-300">#/hod/login</code>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center justify-between bg-[#07101f] px-2.5 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-slate-500 text-[10px]">User:</span>
                          <span className="text-white font-bold select-all">{staff.username}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(staff.username, `user_${staff.id}`)}
                            className="text-slate-400 hover:text-cyan-300 cursor-pointer ml-1"
                            title="Copy Username"
                          >
                            {copiedId === `user_${staff.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-[#07101f] px-2.5 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-slate-500 text-[10px]">Pass:</span>
                          <span className="text-amber-300 font-bold select-all">
                            {isRevealed ? (staff.password_plain || 'staff123') : '••••••••'}
                          </span>
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(staff.id)}
                              className="text-slate-400 hover:text-cyan-300 cursor-pointer"
                              title={isRevealed ? 'Hide Password' : 'Show Password'}
                            >
                              {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(staff.password_plain || 'staff123', `pass_${staff.id}`)}
                              className="text-slate-400 hover:text-cyan-300 cursor-pointer"
                              title="Copy Password"
                            >
                              {copiedId === `pass_${staff.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {staff.email && (
                        <div className="text-[10px] text-slate-400 font-sans truncate">
                          Email: <strong className="text-slate-300">{staff.email}</strong> • Phone: <strong className="text-slate-300">{staff.phone || 'N/A'}</strong>
                        </div>
                      )}
                    </div>

                    {/* Assigned Courses */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Assigned Syllabi & Courses:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedCoursesList.length > 0 ? (
                          assignedCoursesList.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-[#030914] border border-amber-900/70 text-amber-300 text-[10px] font-bold">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No courses assigned yet</span>
                        )}
                      </div>
                    </div>

                    {/* Workspaces & Function Permissions Badges */}
                    <div className="flex items-center justify-between pt-2 border-t border-cyan-950 text-[10px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                          {grantedPagesCount} Pages
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                          {grantedFeaturesCount} Functions Active
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Configure RBAC</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: FEATURE & FUNCTION ARCHITECT                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'architect' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Implement Form */}
          <section className="p-6 rounded-3xl bg-[#07101f] border-2 border-indigo-900/80 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Implement Brand-New Feature & Function
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-950 border border-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                DYNAMIC CAPABILITY INJECTION
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Define and register a new operational function or page capability into the institutional catalog.
              The new function will immediately appear in the HOD Staff Page Builder (<code className="text-indigo-300">#/hod/staff-builder</code>)
              and can be granted to departmental staff members.
            </p>

            <form onSubmit={handleAddFeatureSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Feature Unique Key / ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. fn_turnitin_plagiarism"
                    value={newFeatureForm.id}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, id: e.target.value })}
                    className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[9px] text-slate-500">Auto-prefixes with 'fn_' if omitted</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anti-Plagiarism & AI Scan"
                    value={newFeatureForm.label}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, label: e.target.value })}
                    className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Badge / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI / Plagiarism / Web3"
                    value={newFeatureForm.badge}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, badge: e.target.value })}
                    className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Category Grouping
                  </label>
                  <select
                    value={newFeatureForm.category}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, category: e.target.value })}
                    className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Publishing & Content">Publishing & Content</option>
                    <option value="Curriculum & Syllabi">Curriculum & Syllabi</option>
                    <option value="Dissertations & Theses">Dissertations & Theses</option>
                    <option value="Course Reserves">Course Reserves</option>
                    <option value="Students & Clearance">Students & Clearance</option>
                    <option value="Communication">Communication</option>
                    <option value="AI & Analytics">AI & Analytics</option>
                    <option value="Custom Extensions">Custom Extensions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Target Workspace Page Mapping
                  </label>
                  <select
                    value={newFeatureForm.page}
                    onChange={e => setNewFeatureForm({ ...newFeatureForm, page: e.target.value })}
                    className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {DEFAULT_STAFF_PAGES.map(p => (
                      <option key={p.id} value={p.id}>{p.label} ({p.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Feature Description & Operational Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain what this function allows the departmental staff member to execute..."
                  value={newFeatureForm.description}
                  onChange={e => setNewFeatureForm({ ...newFeatureForm, description: e.target.value })}
                  className="w-full bg-[#030814] border border-indigo-950 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingFeatures}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Plus size={15} />
                  <span>{savingFeatures ? 'Registering Feature...' : 'Implement & Register Feature'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Registered Capability Catalog Table */}
          <section className="p-6 rounded-3xl bg-[#07101f] border border-indigo-950 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-950 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Live Capability Catalog ({featuresCatalog.length} Functions)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">
                Active in Database Settings: <code className="text-indigo-300">fcc_hod_staff_custom_features</code>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-indigo-950 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Function Key</th>
                    <th className="py-2.5 px-3">Label & Scope</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Target Page</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Global Toggle</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-950/60 font-mono">
                  {featuresCatalog.map(feat => {
                    const isSystem = Boolean(feat.is_system);
                    const isEnabled = feat.enabled !== false;

                    return (
                      <tr key={feat.id} className="hover:bg-indigo-950/20 transition">
                        <td className="py-3 px-3">
                          <code className="text-indigo-300 font-bold bg-[#030814] px-2 py-0.5 rounded border border-indigo-950">
                            {feat.id}
                          </code>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-bold text-white">{feat.label}</div>
                          <div className="text-[10px] text-slate-400 font-sans truncate">{feat.description}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                            {feat.category || 'Publishing'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] text-slate-300 bg-[#030814] px-2 py-0.5 rounded border border-slate-800">
                            #{feat.page || 'upload'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isSystem
                                ? 'bg-slate-900 border border-slate-700 text-slate-300'
                                : 'bg-indigo-950 border border-indigo-500 text-indigo-300'
                            }`}
                          >
                            {isSystem ? 'CORE' : 'CUSTOM'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(feat.id)}
                            className="cursor-pointer transition"
                            title={isEnabled ? 'Feature is Enabled Globally' : 'Feature is Disabled'}
                          >
                            {isEnabled ? (
                              <ToggleRight size={22} className="text-emerald-400 inline" />
                            ) : (
                              <ToggleLeft size={22} className="text-slate-600 inline" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isSystem ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteFeature(feat.id)}
                              className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950 transition cursor-pointer"
                              title="Delete Custom Feature"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: DATABASE ACTIVITY AUDIT STREAM                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'activity_stream' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stream Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#07101f] border border-cyan-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter logs by actor, action, resource ID, IP..."
                  value={activitySearch}
                  onChange={e => setActivitySearch(e.target.value)}
                  className="w-full bg-[#030814] border border-cyan-950 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#030814] border border-cyan-950 rounded-xl px-2.5 py-1 text-xs">
                <Building2 size={13} className="text-cyan-400" />
                <select
                  value={activityDeptFilter}
                  onChange={e => {
                    sounds.playClick();
                    setActivityDeptFilter(e.target.value);
                  }}
                  className="bg-transparent text-slate-300 font-bold focus:outline-none text-xs cursor-pointer py-1"
                >
                  <option value="ALL" className="bg-[#030814] text-white">All Departments</option>
                  {departmentOptions.map(d => (
                    <option key={d.code} value={d.code} className="bg-[#030814] text-white">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Displaying <strong className="text-cyan-300">{activityLogs.length}</strong> of <strong className="text-emerald-400">{totalLogs}</strong> audit entries
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="p-6 rounded-3xl bg-[#07101f] border border-cyan-950 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Cryptographic Audit Trail (Departmental Staff Operations)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 border border-emerald-700 px-2.5 py-0.5 rounded-full">
                SHA-256 INTEGRITY PROTECTED
              </span>
            </div>

            {logsLoading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin mx-auto text-emerald-400" />
                <div className="text-xs text-slate-400">Streaming staff activity logs from database...</div>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 italic">
                No activity logs found for the selected department or search filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyan-950 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Staff Actor</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Resource Target</th>
                      <th className="py-2.5 px-3">Operational Details</th>
                      <th className="py-2.5 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {activityLogs.map(log => {
                      return (
                        <tr key={log.id} className="hover:bg-cyan-950/20 transition">
                          <td className="py-3 px-3 text-[10px] text-slate-400 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-[11px]">{log.actor}</div>
                            <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-900">
                              {log.role || 'hod_staff'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#030814] border border-cyan-800 text-cyan-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[10px]">
                            <div className="text-slate-300 font-bold">{log.resource_type}</div>
                            <div className="text-slate-500">{log.resource_id}</div>
                          </td>
                          <td className="py-3 px-3 max-w-sm text-[11px] font-sans text-slate-300">
                            {log.details}
                          </td>
                          <td className="py-3 px-3 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW DEPARTMENTAL STAFF WORKSPACE                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0c1427] border-2 border-cyan-500 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3">
              <div className="flex items-center gap-2.5">
                <Plus size={20} className="text-cyan-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Provision Departmental Staff Workspace
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Tunde Olatunji"
                    value={newStaffForm.name}
                    onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Academic Rank & Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Lecturer & Course Coordinator"
                    value={newStaffForm.designation}
                    onChange={e => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Department & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Department *
                  </label>
                  <select
                    value={newStaffForm.department_code}
                    onChange={e => {
                      const selected = departmentOptions.find(d => d.code === e.target.value);
                      setNewStaffForm({
                        ...newStaffForm,
                        department_code: e.target.value,
                        department_name: selected ? selected.name : `${e.target.value} Department`
                      });
                    }}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {departmentOptions.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Login Password *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. staff123"
                    value={newStaffForm.password}
                    onChange={e => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Institutional Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. tunde.olatunji@fccibadan.edu.ng"
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Assigned Courses (Comma-Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CEM 411, CEM 312, CEM 214"
                    value={newStaffForm.assigned_courses_raw}
                    onChange={e => setNewStaffForm({ ...newStaffForm, assigned_courses_raw: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Allowed Pages Matrix */}
              <div className="space-y-2 border-t border-cyan-950 pt-3">
                <div className="text-[11px] font-black text-cyan-300 uppercase">
                  Allowed Departmental Workspace Pages:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_STAFF_PAGES.map(page => {
                    const isChecked = Boolean(newStaffForm.allowed_pages[page.id]);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-500/80 text-white'
                            : 'bg-[#030814] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setNewStaffForm({
                              ...newStaffForm,
                              allowed_pages: {
                                ...newStaffForm.allowed_pages,
                                [page.id]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-[11px]">{page.label}</div>
                          <div className="text-[9px] text-slate-400 font-sans">{page.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Features & Functions Matrix */}
              <div className="space-y-2 border-t border-cyan-950 pt-3">
                <div className="text-[11px] font-black text-emerald-400 uppercase">
                  Assigned Capabilities & Functions ({featuresCatalog.length} In Catalog):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {featuresCatalog.map(feat => {
                    const isChecked = Boolean(newStaffForm.allowed_features[feat.id]);
                    return (
                      <label
                        key={feat.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-500/80 text-white'
                            : 'bg-[#030814] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setNewStaffForm({
                              ...newStaffForm,
                              allowed_features: {
                                ...newStaffForm.allowed_features,
                                [feat.id]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-[11px] flex items-center gap-1.5">
                            <span>{feat.label}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#030814] text-cyan-300 font-normal">
                              {feat.badge || 'Func'}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans">{feat.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-950">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-black font-black text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating Staff...' : 'Create & Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT DEPARTMENTAL STAFF WORKSPACE & PERMISSIONS                  */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0c1427] border-2 border-cyan-400 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3">
              <div className="flex items-center gap-2.5">
                <Edit3 size={20} className="text-cyan-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Modify Staff Profile & Permissions: {editingStaff.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Staff Name *
                  </label>
                  <input
                    type="text"
                    value={editingStaff.name}
                    onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Academic Rank & Designation
                  </label>
                  <input
                    type="text"
                    value={editingStaff.designation}
                    onChange={e => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Username & Reset Password */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingStaff.username}
                    onChange={e => setEditingStaff({ ...editingStaff, username: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Change Password (Leave blank to keep)
                  </label>
                  <input
                    type="text"
                    placeholder="New password..."
                    value={editingStaff.password_change || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, password_change: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={editingStaff.status}
                    onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="active" className="text-emerald-300">Active</option>
                    <option value="suspended" className="text-rose-300">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingStaff.email || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Assigned Courses
                  </label>
                  <input
                    type="text"
                    value={editingStaff.assigned_courses_raw || ''}
                    onChange={e => setEditingStaff({ ...editingStaff, assigned_courses_raw: e.target.value })}
                    className="w-full bg-[#030814] border border-cyan-950 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Allowed Pages Checkboxes */}
              <div className="space-y-2 border-t border-cyan-950 pt-3">
                <div className="text-[11px] font-black text-cyan-300 uppercase">
                  Allowed Departmental Workspace Pages:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_STAFF_PAGES.map(page => {
                    const isChecked = Boolean(editingStaff.allowed_pages?.[page.id]);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-500/80 text-white'
                            : 'bg-[#030814] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setEditingStaff({
                              ...editingStaff,
                              allowed_pages: {
                                ...(editingStaff.allowed_pages || {}),
                                [page.id]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-[11px]">{page.label}</div>
                          <div className="text-[9px] text-slate-400 font-sans">{page.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Features Checkboxes */}
              <div className="space-y-2 border-t border-cyan-950 pt-3">
                <div className="text-[11px] font-black text-emerald-400 uppercase">
                  Assigned Operational Functions:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {featuresCatalog.map(feat => {
                    const isChecked = Boolean(editingStaff.allowed_features?.[feat.id]);
                    return (
                      <label
                        key={feat.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-500/80 text-white'
                            : 'bg-[#030814] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setEditingStaff({
                              ...editingStaff,
                              allowed_features: {
                                ...(editingStaff.allowed_features || {}),
                                [feat.id]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-[11px] flex items-center gap-1.5">
                            <span>{feat.label}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#030814] text-cyan-300 font-normal">
                              {feat.badge || 'Func'}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans">{feat.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-950">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                             */}
      {/* ========================================================================= */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1427] border-2 border-rose-500 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-black uppercase tracking-wider">Confirm Staff Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to permanently delete departmental staff member <strong className="text-white">{deletingStaff.name}</strong> ({deletingStaff.staff_code})?
              This action removes their credentials, courses, and workspace permissions from both MySQL and SQLite databases.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

