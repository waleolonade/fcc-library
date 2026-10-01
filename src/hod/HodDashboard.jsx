import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, Upload, FileText, CheckCircle, Clock, AlertTriangle,
  BookOpen, BarChart3, Layers, Building2, LogOut, ArrowRight, Sparkles,
  ExternalLink, Plus, Filter, Search, ShieldCheck, Eye, RefreshCw, Send, Check,
  MessageSquare, Menu, ChevronLeft, ChevronRight, Users, Award, Shield,
  Settings, Bookmark, MapPin, Download, CheckSquare, XCircle, Compass,
  BookCheck, Sliders, Calendar, Phone, Mail, UserCheck
} from 'lucide-react';
import { parseCurrentRoute, navigateTo } from '../utils/router';
import HodUploadStudio from './HodUploadStudio';
import InstitutionalCommunicationHub from '../common/InstitutionalCommunicationHub';
import { PATTERNS } from '../utils/backgroundPatterns';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';

export default function HodDashboard({ user: initialUser, onLogout }) {
  const [departments, setDepartments] = useState(() => departmentService.getDepartments());
  const [currentUser, setCurrentUser] = useState(initialUser);

  // Active department derived from currentUser or first department
  const currentDeptCode = currentUser?.department_code || 'CEM';
  const currentDept = useMemo(() => {
    return departments.find(d => d.code.toUpperCase() === currentDeptCode.toUpperCase()) || departments[0] || {
      code: 'CEM',
      name: 'Co-operative Economics & Management',
      faculty: 'School of Cooperative & Management Studies',
      hod: 'Dr. Mrs. F. A. Babalola',
      hodEmail: 'f.babalola@fccibadan.edu.ng',
      hodPhone: '+234 803 234 5678',
      studentCount: 420
    };
  }, [departments, currentDeptCode]);

  // Active Tab
  // 'overview' | 'courses' | 'upload' | 'submissions' | 'dissertations' | 'reserves' | 'scholars' | 'communication' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [uploads, setUploads] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Department Dissertations
  const [dissertations, setDissertations] = useState([
    {
      id: `DIS-${currentDept.code}-01`,
      studentName: 'Wale Olonade',
      matric: `FCC/${currentDept.code}/2024/042`,
      level: 'HND II',
      title: `Liquidity Management Frameworks for Agrarian Co-operative Societies in Oyo State`,
      supervisor: currentDept.hod,
      submittedDate: '2026-09-18',
      status: 'pending_hod_approval',
      pages: 124,
      fileSize: '3.4 MB',
      plagiarismScore: 7,
      abstract: 'Investigating operational resilience, funding velocity, and audit compliance across regional institutions in southwest Nigeria.'
    },
    {
      id: `DIS-${currentDept.code}-02`,
      studentName: 'Adeyemi Kemi',
      matric: `FCC/${currentDept.code}/2024/029`,
      level: 'HND II',
      title: `Digitization and Automated Internal Controls in ${currentDept.name} Enterprises`,
      supervisor: 'Prof. A. O. Adebayo',
      submittedDate: '2026-09-22',
      status: 'approved',
      pages: 142,
      fileSize: '4.1 MB',
      plagiarismScore: 9,
      abstract: 'Evaluating transition from manual double-entry accounting ledgers to cloud-hosted relational ledger infrastructure.'
    },
    {
      id: `DIS-${currentDept.code}-03`,
      studentName: 'Bello Farouk',
      matric: `FCC/${currentDept.code}/2024/051`,
      level: 'HND II',
      title: `Risk Governance and Loan Recovery Protocols in Agro-Allied Cooperatives`,
      supervisor: currentDept.hod,
      submittedDate: '2026-09-28',
      status: 'revision_requested',
      pages: 98,
      fileSize: '2.8 MB',
      plagiarismScore: 11,
      abstract: 'Assessing default rates in micro-credit lending and testing structural regression models on farmer yields.'
    }
  ]);

  // Interactive Curriculum / Courses State
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    code: '',
    title: '',
    level: 'HND II',
    semester: 'First Semester',
    books: 4,
    lecturer: ''
  });

  // Course Reserves State
  const [showAddReserveModal, setShowAddReserveModal] = useState(false);
  const [reservesList, setReservesList] = useState([
    { id: 1, title: `Principles and Practice of ${currentDept.name}`, author: 'Prof. A. O. Adebayo', shelf: 'Reserve Desk Bay 1', copies: 6, reservedFor: `${currentDept.code} 111`, duration: '2 Hours In-Library' },
    { id: 2, title: `Applied Quantitative Methods & Analytics in ${currentDept.name}`, author: 'Dr. K. E. Okonjo', shelf: 'Reserve Desk Bay 2', copies: 4, reservedFor: `${currentDept.code} 211`, duration: '2 Hours In-Library' },
    { id: 3, title: 'Case Studies in Enterprise Administration', author: 'Chief Librarian Press', shelf: 'Reserve Desk Bay 3', copies: 5, reservedFor: `${currentDept.code} 311`, duration: 'Overnight Loan (After 4 PM)' }
  ]);
  const [newReserveForm, setNewReserveForm] = useState({
    title: '',
    author: '',
    shelf: 'Reserve Desk Bay 1',
    copies: 3,
    reservedFor: `${currentDept.code} 401`,
    duration: '2 Hours In-Library'
  });

  // Department Scholars State
  const [scholarSearchTerm, setScholarSearchTerm] = useState('');
  const [scholarLevelFilter, setScholarLevelFilter] = useState('All');
  const [scholarsList, setScholarsList] = useState([
    { id: 1, name: 'Wale Olonade', matric: `FCC/${currentDept.code}/2024/042`, level: 'HND II', status: 'Good Standing', cleared: true, loans: 2 },
    { id: 2, name: 'Adebayo Oluwaseun', matric: `FCC/${currentDept.code}/2024/018`, level: 'HND II', status: 'Good Standing', cleared: true, loans: 1 },
    { id: 3, name: 'Fatima Sanusi', matric: `FCC/${currentDept.code}/2024/089`, level: 'ND II', status: 'Good Standing', cleared: true, loans: 3 },
    { id: 4, name: 'Chukwuemeka Obi', matric: `FCC/${currentDept.code}/2025/005`, level: 'ND I', status: 'Good Standing', cleared: true, loans: 0 },
    { id: 5, name: 'Ogunlesi Tunde', matric: `FCC/${currentDept.code}/2024/014`, level: 'HND II', status: 'Thesis Pending', cleared: false, loans: 1 },
    { id: 6, name: 'Adeyemi Kemi', matric: `FCC/${currentDept.code}/2024/029`, level: 'HND II', status: 'Thesis Approved', cleared: true, loans: 2 }
  ]);

  // Selected Dissertation Inspection Modal State
  const [selectedDissertationForModal, setSelectedDissertationForModal] = useState(null);

  // Settings Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    hod: currentDept.hod,
    hodEmail: currentDept.hodEmail,
    hodPhone: currentDept.hodPhone,
    office: 'Block B, Room 14 (Faculty Annex)',
    consultationHours: 'Tuesdays & Thursdays, 10:00 AM - 2:00 PM'
  });

  // Update profile form whenever current department switches
  useEffect(() => {
    setProfileForm({
      hod: currentDept.hod,
      hodEmail: currentDept.hodEmail,
      hodPhone: currentDept.hodPhone,
      office: 'Block B, Room 14 (Faculty Annex)',
      consultationHours: 'Tuesdays & Thursdays, 10:00 AM - 2:00 PM'
    });
  }, [currentDept]);

  // Subscribe to department updates from service
  useEffect(() => {
    const unsub = departmentService.subscribe((updated) => {
      setDepartments(updated);
    });
    return unsub;
  }, []);

  // Sync activeTab with URL Hash
  useEffect(() => {
    const syncFromHash = () => {
      const { path } = parseCurrentRoute();
      if (path.startsWith('/hod/')) {
        const sub = path.replace('/hod/', '').split('/')[0];
        const valid = ['overview', 'courses', 'upload', 'submissions', 'dissertations', 'reserves', 'scholars', 'communication', 'settings'];
        if (valid.includes(sub)) {
          setActiveTab(sub);
        }
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const handleTabSwitch = (tabId) => {
    sounds.playClick();
    setActiveTab(tabId);
    navigateTo(`/hod/${tabId}`);
  };

  const handleSwitchDepartment = (deptCode) => {
    sounds.playSuccessChime();
    const found = departmentService.getDepartmentByCode(deptCode);
    setCurrentUser(prev => ({
      ...prev,
      department_code: found.code,
      department_name: found.name,
      department_id: found.id,
      name: found.hod,
      matric: `HOD/${found.code}/001`
    }));
    setSuccessMsg(`Switched view to Department of ${found.name} (${found.code})`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Fetch department uploads from Laravel backend or mock
  const fetchDepartmentUploads = async () => {
    setIsLoadingUploads(true);
    try {
      const deptId = currentDept?.id || 'DEP-CEM';
      const res = await fetch(`/api/department-uploads?department_id=${encodeURIComponent(deptId)}`);
      if (res.ok) {
        const data = await res.json();
        setUploads(data);
      }
    } catch (e) {
      console.warn('Backend uploads fetch fallback');
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchDepartmentUploads();
  }, [currentDeptCode]);

  const pendingCount = uploads.filter(u => u.status === 'pending').length;
  const approvedCount = uploads.filter(u => u.status === 'approved').length;

  const handleApproveDissertation = (id) => {
    sounds.playSuccessChime();
    setDissertations(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d));
    setSuccessMsg('Dissertation endorsed by HOD and queued for Central Library cataloguing!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleRequestRevision = (id) => {
    sounds.playClick();
    const note = prompt('Enter revision instructions for scholar:', 'Please update methodology chapter with empirical variance test.');
    if (note) {
      setDissertations(prev => prev.map(d => d.id === id ? { ...d, status: 'revision_requested', revisionNote: note } : d));
      setSuccessMsg('Revision notice dispatched to scholar portal!');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // Handlers
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourseForm.code || !newCourseForm.title) {
      alert('Course Code and Course Title are required.');
      return;
    }
    try {
      departmentService.addCourseToDepartment(currentDept.code, newCourseForm);
      sounds.playSuccessChime();
      setShowAddCourseModal(false);
      setNewCourseForm({ code: '', title: '', level: 'HND II', semester: 'First Semester', books: 4, lecturer: '' });
      setSuccessMsg(`New course ${newCourseForm.code} registered under ${currentDept.name}!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddReserve = (e) => {
    e.preventDefault();
    if (!newReserveForm.title) {
      alert('Book Title is required.');
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...newReserveForm,
      reservedFor: newReserveForm.reservedFor || `${currentDept.code} 301`,
      copies: Number(newReserveForm.copies) || 2
    };
    setReservesList([newEntry, ...reservesList]);
    sounds.playSuccessChime();
    setShowAddReserveModal(false);
    setNewReserveForm({ title: '', author: '', shelf: 'Reserve Desk Bay 1', copies: 3, reservedFor: `${currentDept.code} 401`, duration: '2 Hours In-Library' });
    setSuccessMsg(`Book "${newEntry.title}" placed on restricted 2-hour reserve shelf!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleToggleScholarClearance = (id) => {
    sounds.playSuccessChime();
    setScholarsList(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          cleared: true,
          status: 'Cleared for Convocation ✓'
        };
      }
      return s;
    }));
    setSuccessMsg('Library borrowing and graduation clearance approved with HOD seal!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    departmentService.updateDepartment(currentDept.code, {
      hod: profileForm.hod,
      hodEmail: profileForm.hodEmail,
      hodPhone: profileForm.hodPhone
    });
    sounds.playSuccessChime();
    setIsEditingProfile(false);
    setSuccessMsg('Department profile & HOD credentials updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Department Courses list
  const departmentCourses = currentDept.courses || [
    { code: `${currentDept.code} 101`, title: `Foundations of ${currentDept.name} I`, level: 'ND I', books: 4 },
    { code: `${currentDept.code} 201`, title: `Advanced Principles of ${currentDept.name}`, level: 'ND II', books: 6 },
    { code: `${currentDept.code} 301`, title: `Professional Practice & Field Seminar`, level: 'HND I', books: 7 },
    { code: `${currentDept.code} 401`, title: `Final Dissertation & Enterprise Policy`, level: 'HND II', books: 9 }
  ];

  // Filter scholars
  const filteredScholars = scholarsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(scholarSearchTerm.toLowerCase()) || s.matric.toLowerCase().includes(scholarSearchTerm.toLowerCase());
    const matchesLevel = scholarLevelFilter === 'All' || s.level === scholarLevelFilter;
    return matchesSearch && matchesLevel;
  });

  // Sidebar navigation structure
  const navSections = [
    {
      title: 'DEPARTMENT PORTAL',
      items: [
        { id: 'overview', label: 'Department Overview', icon: Building2 },
        { id: 'courses', label: 'Curriculum & Syllabi', icon: BookOpen, badge: departmentCourses.length },
        { id: 'upload', label: 'Upload Materials', icon: Upload, badge: 'Staging' },
        { id: 'submissions', label: 'Ingestion Pipeline', icon: Layers, badge: pendingCount || undefined }
      ]
    },
    {
      title: 'ACADEMIC & RESEARCH',
      items: [
        { id: 'dissertations', label: 'HND Dissertations', icon: Award, badge: dissertations.filter(d => d.status === 'pending_hod_approval').length, badgeAlert: true },
        { id: 'reserves', label: 'Course Reserves', icon: Bookmark },
        { id: 'scholars', label: 'Department Scholars', icon: Users, badge: currentDept.studentCount }
      ]
    },
    {
      title: 'DISPATCH & SETTINGS',
      items: [
        { id: 'communication', label: 'Tri-Party Dispatch', icon: MessageSquare, badge: 'Live' },
        { id: 'settings', label: 'Department Profile', icon: Settings }
      ]
    }
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white"
      style={{ backgroundImage: PATTERNS.hod }}
    >
      {/* 1. TOP INSTITUTIONAL NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-teal-500/40 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-[10px]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{currentDept.code} HOD PORTAL</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                TIER 3 RBAC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {currentDept.name}
            </p>
          </div>
        </div>

        {/* Center: Department Switcher for Multi-Department Heads */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Building2 size={13} className="text-teal-400" /> Dept:
          </span>
          <select
            value={currentDept.code}
            onChange={(e) => handleSwitchDepartment(e.target.value)}
            className="bg-transparent text-teal-300 font-bold border-none focus:outline-none cursor-pointer text-xs"
          >
            {departments.map((d) => (
              <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                {d.code} — {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/scholar/home')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Compass size={14} className="text-teal-400" />
            <span>Scholar View</span>
          </button>

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">{currentDept.hod}</div>
            <div className="text-[10px] text-teal-400 font-mono">Head of Department</div>
          </div>

          <button
            onClick={() => onLogout ? onLogout() : navigateTo('/hod/login')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT (COLLAPSIBLE SIDEBAR + MAIN CONTENT VIEW) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left HOD Sidebar */}
        <aside
          className={`border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-300 z-30 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          {/* Department Badge Header in Sidebar */}
          {sidebarOpen && (
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Active Faculty School
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  {currentDept.code}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">
                {currentDept.faculty}
              </div>
            </div>
          )}

          {/* Navigation Menu Links */}
          <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
            {navSections.map((sec, secIdx) => (
              <div key={secIdx} className="space-y-1">
                {sidebarOpen && (
                  <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    {sec.title}
                  </div>
                )}
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSwitch(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                      {sidebarOpen && (
                        <>
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                item.badgeAlert
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : isActive
                                  ? 'bg-teal-800 text-teal-200'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer with Department Switcher on Mobile/Collapsed */}
          {sidebarOpen && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-center">
              <span className="text-[10px] font-mono text-slate-500 block">
                FCC ILS HOD Engine v4.8
              </span>
            </div>
          )}
        </aside>

        {/* Main Interactive Subpage View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Notification Alert Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-teal-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-teal-400 hover:text-white">✕</button>
            </div>
          )}

          {/* VIEW 1: DEPARTMENT OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Institutional Hero Banner */}
              <div className="rounded-3xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-3 max-w-2xl">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase tracking-wider">
                    {currentDept.code} ACADEMIC JURISDICTION
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentDept.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {currentDept.description || 'Managing departmental curriculum syllabi, reading lists, final-year HND dissertations, and course textbook reserves.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleTabSwitch('upload')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-900/40 transition"
                    >
                      <Upload size={14} /> Upload Syllabus or Handout
                    </button>
                    <button
                      onClick={() => handleTabSwitch('dissertations')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <Award size={14} className="text-teal-400" /> Review Dissertations ({dissertations.filter(d => d.status === 'pending_hod_approval').length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Department Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Active Scholars</span>
                    <Users size={16} className="text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{currentDept.studentCount || 340}</div>
                  <div className="text-[11px] text-teal-400 font-mono">ND I, ND II, HND I, HND II</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Syllabi on Reserve</span>
                    <BookOpen size={16} className="text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{departmentCourses.length}</div>
                  <div className="text-[11px] text-indigo-400 font-mono">Accredited Modules</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Theses Pending Sign-off</span>
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-300">
                    {dissertations.filter(d => d.status === 'pending_hod_approval').length}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono">Final Year 2026</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Repository Holdings</span>
                    <Layers size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{currentDept.curriculumBooksCount || 48}</div>
                  <div className="text-[11px] text-emerald-400 font-mono">Texts & Monographs</div>
                </div>
              </div>

              {/* Quick Navigation Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => handleTabSwitch('courses')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2"
                >
                  <BookOpen size={20} className="text-teal-400" />
                  <h4 className="text-sm font-bold text-white">Curriculum & Course Syllabi</h4>
                  <p className="text-xs text-slate-400">
                    Map recommended reference monographs and lecture texts to official departmental course codes.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('reserves')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2"
                >
                  <Bookmark size={20} className="text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Course Reserves Desk</h4>
                  <p className="text-xs text-slate-400">
                    Designate high-demand textbooks on restricted 2-hour reserve shelf for examinations.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('communication')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2"
                >
                  <MessageSquare size={20} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Tri-Party Dispatch</h4>
                  <p className="text-xs text-slate-400">
                    Send acquisition requests and curriculum memorandums directly to the Chief College Librarian.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: COURSES & SYLLABI */}
          {activeTab === 'courses' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Departmental Course Syllabi & Reserve Reading Lists</h3>
                  <p className="text-xs text-slate-400 mt-1">Prescribed curriculum textbooks and academic modules for {currentDept.name}.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddCourseModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <Plus size={14} /> Register New Course
                  </button>
                  <button
                    onClick={() => handleTabSwitch('upload')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Upload size={14} /> Upload Syllabus PDF
                  </button>
                </div>
              </div>

              {/* Add Course Modal */}
              {showAddCourseModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-teal-400" />
                      <span>Register New Academic Course ({currentDept.code})</span>
                    </h4>
                    <button
                      onClick={() => setShowAddCourseModal(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. CEM 315"
                        value={newCourseForm.code}
                        onChange={e => setNewCourseForm({ ...newCourseForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Cooperative Micro-Credit Auditing"
                        value={newCourseForm.title}
                        onChange={e => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Academic Level</label>
                      <select
                        value={newCourseForm.level}
                        onChange={e => setNewCourseForm({ ...newCourseForm, level: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option>ND I</option>
                        <option>ND II</option>
                        <option>HND I</option>
                        <option>HND II</option>
                        <option>Post-HND</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Lecturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. A. Adebayo"
                        value={newCourseForm.lecturer}
                        onChange={e => setNewCourseForm({ ...newCourseForm, lecturer: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCourseModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow"
                      >
                        Commit to Department Syllabus
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentCourses.map((c, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-600/40 transition space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                          {c.code}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{c.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {c.level}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Prescribed Core Texts: <strong className="text-white">{c.books || 4} Books</strong></span>
                      <span className="text-teal-400 font-medium">On Physical Reserve ✓</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 text-[11px]">NBTE Accredited</span>
                      <button
                        onClick={() => {
                          setNewReserveForm(prev => ({ ...prev, reservedFor: c.code }));
                          setShowAddReserveModal(true);
                          handleTabSwitch('reserves');
                        }}
                        className="text-teal-400 hover:text-teal-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <Bookmark size={12} /> Assign Reserve Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: UPLOAD STUDIO */}
          {activeTab === 'upload' && (
            <div className="animate-fadeIn">
              <HodUploadStudio
                user={currentUser}
                onUploadSuccess={(newUp) => {
                  setUploads([newUp, ...uploads]);
                  setSuccessMsg(`Resource "${newUp.title}" uploaded to department staging queue!`);
                  handleTabSwitch('submissions');
                }}
              />
            </div>
          )}

          {/* VIEW 4: STAGING SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Department Resource Ingestion Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-1">Review status of curriculum packs submitted to Central College Library.</p>
                </div>
                <div className="flex items-center gap-2">
                  {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
                    <button
                      key={st}
                      onClick={() => setFilterType(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        filterType === st ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {uploads.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 space-y-3">
                  <Layers size={32} className="mx-auto text-slate-500" />
                  <div className="text-sm font-bold text-slate-300">No Ingestion Records in Pipeline</div>
                  <p className="text-xs text-slate-500">Upload new syllabus materials, past questions, or reading lists using the studio.</p>
                  <button onClick={() => handleTabSwitch('upload')} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">
                    Launch Upload Studio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploads.map((up, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-teal-400">{up.course_code || currentDept.code}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            up.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            up.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {up.status || 'Pending Review'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{up.title}</h4>
                        <p className="text-xs text-slate-400">{up.author || currentDept.hod} • {up.file_size || '2.4 MB'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: HND DISSERTATIONS REVIEW DESK */}
          {activeTab === 'dissertations' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <h3 className="text-xl font-bold text-white">
                  {currentDept.code} Dissertation Endorsement & Review Queue
                </h3>
                <p className="text-xs text-slate-400">
                  Validate student theses manuscripts for academic integrity, faculty supervisor sign-off, and repository archival.
                </p>
              </div>

              {/* Dissertation Inspection Modal */}
              {selectedDissertationForModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award size={20} className="text-teal-400" />
                      <h4 className="text-base font-bold text-white">HND Manuscript Integrity Dossier</h4>
                    </div>
                    <button onClick={() => setSelectedDissertationForModal(null)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <h5 className="text-sm font-bold text-white">{selectedDissertationForModal.title}</h5>
                    <div className="text-slate-400">
                      Author: <strong className="text-teal-300">{selectedDissertationForModal.studentName}</strong> ({selectedDissertationForModal.matric})
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                      {selectedDissertationForModal.abstract}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">SIMILARITY INDEX</span>
                        <span className="text-base font-bold text-emerald-400">{selectedDissertationForModal.plagiarismScore || 8}% (Clear)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">SUPERVISOR</span>
                        <span className="text-xs font-bold text-white">{selectedDissertationForModal.supervisor}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">PAGES</span>
                        <span className="text-xs font-bold text-white">{selectedDissertationForModal.pages} Pages</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">FORMAT</span>
                        <span className="text-xs font-bold text-teal-400">Archival PDF/A</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleRequestRevision(selectedDissertationForModal.id)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => {
                        handleApproveDissertation(selectedDissertationForModal.id);
                        setSelectedDissertationForModal(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                    >
                      Approve & Sign-Off to Central Catalog
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {dissertations.map(diss => (
                  <div key={diss.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-400">{diss.matric}</span>
                          <span className="text-xs text-slate-400">• {diss.studentName} ({diss.level})</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            diss.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            diss.status === 'revision_requested' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {diss.status === 'approved' ? 'HOD Approved ✓' : diss.status === 'revision_requested' ? 'Revision Pending' : 'Pending HOD Sign-off'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{diss.title}</h4>
                      </div>
                      <span className="text-xs text-slate-500 font-mono shrink-0">
                        {diss.pages} Pages • {diss.fileSize}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      {diss.abstract}
                    </p>

                    {diss.revisionNote && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
                        <strong>HOD Revision Directive:</strong> {diss.revisionNote}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-400">Supervisor: <strong className="text-white">{diss.supervisor}</strong></span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDissertationForModal(diss)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold border border-slate-700 transition flex items-center gap-1"
                        >
                          <Eye size={13} /> Inspect Dossier
                        </button>
                        {diss.status !== 'approved' && (
                          <button
                            onClick={() => handleApproveDissertation(diss.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow"
                          >
                            <Check size={13} /> Endorse
                          </button>
                        )}
                        <button
                          onClick={() => handleRequestRevision(diss.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition"
                        >
                          Request Revision
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 6: COURSE RESERVES */}
          {activeTab === 'reserves' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Course Reserves Desk ({currentDept.code})</h3>
                  <p className="text-xs text-slate-400 mt-1">High-demand books placed on restricted 2-hour in-library reserve for examination periods.</p>
                </div>
                <button
                  onClick={() => setShowAddReserveModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Plus size={14} /> Place Book on Reserve
                </button>
              </div>

              {/* Add Reserve Modal */}
              {showAddReserveModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Bookmark size={18} className="text-teal-400" />
                      <span>Place Textbook on Course Reserve Shelf</span>
                    </h4>
                    <button onClick={() => setShowAddReserveModal(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                  </div>
                  <form onSubmit={handleAddReserve} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Book Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Modern Agricultural Cooperatives"
                        value={newReserveForm.title}
                        onChange={e => setNewReserveForm({ ...newReserveForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Author</label>
                      <input
                        type="text"
                        placeholder="e.g. Prof. A. O. Adebayo"
                        value={newReserveForm.author}
                        onChange={e => setNewReserveForm({ ...newReserveForm, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Target Course Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CEM 411"
                        value={newReserveForm.reservedFor}
                        onChange={e => setNewReserveForm({ ...newReserveForm, reservedFor: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Reserve Bay / Location</label>
                      <select
                        value={newReserveForm.shelf}
                        onChange={e => setNewReserveForm({ ...newReserveForm, shelf: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option>Reserve Desk Bay 1</option>
                        <option>Reserve Desk Bay 2</option>
                        <option>Reserve Desk Bay 3</option>
                        <option>Faculty Carrel Stack A</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Reserve Restriction Rule</label>
                      <select
                        value={newReserveForm.duration}
                        onChange={e => setNewReserveForm({ ...newReserveForm, duration: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option>2 Hours In-Library Reading Only</option>
                        <option>Overnight Loan (After 4 PM)</option>
                        <option>Weekend Restricted Borrowing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Copies on Reserve</label>
                      <input
                        type="number"
                        min="1"
                        value={newReserveForm.copies}
                        onChange={e => setNewReserveForm({ ...newReserveForm, copies: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddReserveModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">
                        Cancel
                      </button>
                      <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow">
                        Place on Reserve Desk
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservesList.map((res, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300">
                        {res.reservedFor}
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-950 px-2 py-0.5 rounded">
                        {res.duration || '2 Hours In-Library'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">{res.title}</h4>
                    <p className="text-xs text-slate-400">{res.author}</p>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-300">
                      <span>Location: <strong className="text-white">{res.shelf}</strong></span>
                      <span className="text-emerald-400 font-bold">{res.copies} Copies Reserved</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 7: SCHOLARS DIRECTORY */}
          {activeTab === 'scholars' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">{currentDept.name} Scholars Registry</h3>
                  <p className="text-xs text-slate-400 mt-1">Active registered student patrons with library borrowing clearance.</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-teal-950 text-teal-300 font-mono text-xs font-bold border border-teal-800">
                  {currentDept.studentCount || 340} Active Scholars
                </span>
              </div>

              {/* Scholar Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search scholars by name or matriculation number..."
                    value={scholarSearchTerm}
                    onChange={e => setScholarSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['All', 'ND I', 'ND II', 'HND I', 'HND II'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setScholarLevelFilter(lvl)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        scholarLevelFilter === lvl ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredScholars.map((st) => (
                  <div key={st.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{st.name}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300">
                        {st.level}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{st.matric}</div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                      <span>Clearance: <strong className={st.cleared ? 'text-teal-400' : 'text-amber-400'}>{st.status}</strong></span>
                      <span>{st.loans} Active Loans</span>
                    </div>
                    {!st.cleared && (
                      <button
                        onClick={() => handleToggleScholarClearance(st.id)}
                        className="w-full mt-2 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <UserCheck size={13} /> Grant Convocation Clearance
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: COMMUNICATION DISPATCH */}
          {activeTab === 'communication' && (
            <div className="animate-fadeIn">
              <InstitutionalCommunicationHub
                currentRole="hod"
                currentUser={{
                  name: currentDept.hod,
                  matric: `HOD/${currentDept.code}/001`,
                  dept: currentDept.name,
                  department_code: currentDept.code
                }}
                allowRoleSwitching={false}
              />
            </div>
          )}

          {/* VIEW 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">Departmental Security & Profile Settings</h3>
                  <p className="text-xs text-slate-400 mt-1">Institutional configuration and official contact credentials for {currentDept.code}.</p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Settings size={14} /> {isEditingProfile ? 'Close Editor' : 'Edit HOD Profile'}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl space-y-4 text-xs">
                  <h4 className="text-sm font-bold text-white">Update Official HOD Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Head of Department (HOD) Name</label>
                      <input
                        type="text"
                        value={profileForm.hod}
                        onChange={e => setProfileForm({ ...profileForm, hod: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Official Institutional Email</label>
                      <input
                        type="email"
                        value={profileForm.hodEmail}
                        onChange={e => setProfileForm({ ...profileForm, hodEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Official Phone Line</label>
                      <input
                        type="text"
                        value={profileForm.hodPhone}
                        onChange={e => setProfileForm({ ...profileForm, hodPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Office Location</label>
                      <input
                        type="text"
                        value={profileForm.office}
                        onChange={e => setProfileForm({ ...profileForm, office: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Consultation Hours</label>
                      <input
                        type="text"
                        value={profileForm.consultationHours}
                        onChange={e => setProfileForm({ ...profileForm, consultationHours: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow">
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">DEPARTMENT CODE</span>
                    <div className="text-base font-bold text-teal-400">{currentDept.code}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">HEAD OF DEPARTMENT</span>
                    <div className="text-base font-bold text-white">{currentDept.hod}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">HOD OFFICIAL EMAIL</span>
                    <div className="text-base font-bold text-white">{currentDept.hodEmail}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">OFFICIAL PHONE</span>
                    <div className="text-base font-bold text-white">{currentDept.hodPhone || '+234 803 000 0000'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">FACULTY / SCHOOL</span>
                    <div className="text-base font-bold text-white">{currentDept.faculty}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-mono">ESTABLISHED YEAR</span>
                    <div className="text-base font-bold text-white">{currentDept.established || 1976}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
