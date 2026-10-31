import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Search, Filter, GraduationCap, BookOpen, Users,
  FileText, CheckCircle, AlertCircle, Edit3, Trash2, ExternalLink,
  ChevronRight, Sparkles, Shield, Mail, Phone, Lock, Calendar, Layers, X,
  RefreshCw, Database
} from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';
import {
  SOLID_COLOR_PALETTES,
  getUsedDepartmentColors,
  getAvailableDepartmentColor,
  normalizeColorKey,
  getDynamicDeptTheme
} from '../hod/hodThemeConfig';

export default function DepartmentManagement({ onSwitchToHodPortal }) {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  // Form State for Adding / Editing Department
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    faculty: '',
    hod: '',
    hodEmail: '',
    hodPhone: '',
    pin: '',
    established: '',
    color: 'emerald',
    studentCount: 0,
    description: ''
  });

  // Fetch exclusively from backend database (MySQL `departments` table)
  const fetchDepartmentsFromBackend = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const resDepts = await fetch('/api/departments', { headers: { 'Accept': 'application/json' } });
      if (!resDepts.ok) {
        throw new Error(`Server responded with ${resDepts.status}`);
      }
      const data = await resDepts.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments from backend:', err);
      setDepartments([]);
      setLoadError('Could not load departments from the database. Please refresh or check the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsFromBackend();
  }, []);

  const faculties = useMemo(() => {
    const list = departments.map(d => (d.faculty || '').trim()).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [departments]);

  const filteredDepts = useMemo(() => {
    return departments.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q ||
        (d.name || '').toLowerCase().includes(q) ||
        (d.code || '').toLowerCase().includes(q) ||
        (d.hod || d.hod_name || '').toLowerCase().includes(q) ||
        (d.faculty || '').toLowerCase().includes(q);
      const matchF = selectedFaculty === 'All' || d.faculty === selectedFaculty;
      return matchQ && matchF;
    });
  }, [departments, searchQuery, selectedFaculty]);

  const handleOpenAddModal = () => {
    sounds.playClick();
    const nextFreeColor = getAvailableDepartmentColor(departments);
    setFormData({
      code: '',
      name: '',
      faculty: faculties[1] || '',
      hod: '',
      hodEmail: '',
      hodPhone: '',
      pin: '',
      established: new Date().getFullYear().toString(),
      color: nextFreeColor,
      studentCount: 0,
      description: ''
    });
    setEditingDept(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    sounds.playClick();
    setEditingDept(dept);
    setFormData({
      code: dept.code || '',
      name: dept.name || '',
      faculty: dept.faculty || '',
      hod: dept.hod || dept.hod_name || '',
      hodEmail: dept.hodEmail || dept.hod_email || '',
      hodPhone: dept.hodPhone || dept.hod_phone || '',
      pin: dept.pin || dept.hod_pin || '',
      established: dept.established?.toString() || '',
      color: dept.color || 'emerald',
      studentCount: dept.student_count ?? dept.studentCount ?? 0,
      description: dept.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.hod || (!editingDept && !formData.pin?.trim())) {
      setFeedbackType('error');
      setFeedbackMsg('Department Code, Name, HOD Name, and HOD Security PIN are required.');
      sounds.playErrorBuzz();
      return;
    }

    const chosenColor = normalizeColorKey(formData.color);
    const usedColors = getUsedDepartmentColors(departments, editingDept?.id || editingDept?.code);
    if (usedColors[chosenColor]) {
      const conflictDept = usedColors[chosenColor];
      setFeedbackType('error');
      setFeedbackMsg(`Color "${chosenColor}" is already assigned to Department ${conflictDept}. Each academic department must have a distinct solid color!`);
      sounds.playErrorBuzz();
      return;
    }

    try {
      const parsedStudents = parseInt(formData.studentCount, 10);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        faculty: formData.faculty?.trim() || '',
        hod_name: formData.hod.trim(),
        hod_email: formData.hodEmail?.trim() || '',
        hod_phone: formData.hodPhone?.trim() || '',
        hod_pin: formData.pin?.trim() || (editingDept?.hod_pin || editingDept?.pin || ''),
        student_count: !isNaN(parsedStudents) && parsedStudents >= 0 ? parsedStudents : 0,
        description: formData.description?.trim() || '',
        established: formData.established?.toString().trim() || '',
        color: chosenColor
      };

      let res;
      if (editingDept) {
        const deptId = editingDept.id || editingDept.code;
        res = await fetch(`/api/departments/${encodeURIComponent(deptId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (res.ok && resData.success) {
        sounds.playSuccessChime();
        setFeedbackType('success');
        setFeedbackMsg(resData.message || 'Department successfully saved in database!');
        setIsAddModalOpen(false);
        await fetchDepartmentsFromBackend();
        setTimeout(() => setFeedbackMsg(''), 4000);
      } else {
        throw new Error(resData.message || 'Error saving department to database.');
      }
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMsg(err.message || 'Error saving department to database.');
      sounds.playErrorBuzz();
    }
  };

  const handleDeleteDepartment = async (deptOrCode) => {
    const dept = typeof deptOrCode === 'object' ? deptOrCode : (departments.find(d => d.code === deptOrCode) || { code: deptOrCode });
    const deptId = dept.id || dept.code;
    const deptName = dept.name || dept.code;
    if (confirm(`Are you sure you want to delete Department ${dept.code} (${deptName}) from the database?`)) {
      try {
        const res = await fetch(`/api/departments/${encodeURIComponent(deptId)}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          sounds.playSuccessChime();
          setFeedbackType('success');
          setFeedbackMsg(resData.message || `Department ${dept.code} removed from database.`);
          await fetchDepartmentsFromBackend();
          setTimeout(() => setFeedbackMsg(''), 4000);
        } else {
          throw new Error(resData.message || 'Error deleting department');
        }
      } catch (err) {
        setFeedbackType('error');
        setFeedbackMsg(err.message);
        sounds.playErrorBuzz();
      }
    }
  };

  // Solid color themes per academic department (Dynamic pure vibrant solids)
  const getDepartmentTheme = (deptOrCode) => {
    const dept = typeof deptOrCode === 'object' && deptOrCode !== null ? deptOrCode : departments.find(d => d.code === deptOrCode);
    const code = (dept?.code || (typeof deptOrCode === 'string' ? deptOrCode : '') || 'GEN').toUpperCase();
    
    // Resolve dynamic theme using database color or exclusive palette
    const dyn = getDynamicDeptTheme(code, dept?.name, dept?.color, departments);
    const palKey = dyn.colorKey || normalizeColorKey(dept?.color);
    const pal = SOLID_COLOR_PALETTES[palKey] || SOLID_COLOR_PALETTES.emerald;

    return {
      colorName: dyn.colorName || pal.name,
      solidHex: dyn.solidPrimary || pal.solid,
      topBanner: dyn.borderSolid ? dyn.borderSolid.replace('border-', 'bg-') : 'bg-emerald-600',
      borderSolid: dyn.borderSolid || pal.border || 'border-emerald-500',
      cardGlow: 'hover:shadow-2xl',
      badge: dyn.badgeClass || pal.badge,
      accentText: dyn.textAccent || pal.txt,
      codeBadge: `${dyn.btnPrimary || pal.btn} border shadow-md`,
      btnSolid: dyn.btnPrimary || pal.btn,
      avatarBg: `${dyn.btnPrimary || pal.btn} ring-2 ring-white/20`,
      statAccent: dyn.textAccent || pal.txt,
      indicator: dyn.textAccent ? dyn.textAccent.replace('text-', 'bg-') : 'bg-emerald-400',
      cardBg: 'bg-slate-900'
    };
  };

  const getInitials = (name) => {
    if (!name) return 'HD';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/gi, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'HD';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Student count is computed server-side from the live patrons table
  const getDeptStudentCount = (dept) => Number(dept.student_count ?? dept.studentCount ?? 0) || 0;

  const totalStudents = useMemo(
    () => departments.reduce((acc, d) => acc + getDeptStudentCount(d), 0),
    [departments]
  );
  const totalCourses = useMemo(() => departments.reduce((acc, d) => acc + (d.courses_count ?? d.coursesCount ?? 0), 0), [departments]);
  const totalTheses = useMemo(() => departments.reduce((acc, d) => acc + (d.theses_count ?? d.hndProjectsCount ?? 0), 0), [departments]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-800/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950 shrink-0">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Academic Units Management
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {departments.length} Units Active
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                Departments & HOD Authority Matrix
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Create and manage academic departments, assign HOD leadership, configure departmental syllabi reading lists, and provision dedicated departmental portals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDepartmentsFromBackend}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shrink-0"
              title="Refresh departments from database"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-950 transition shrink-0"
            >
              <Plus size={16} />
              <span>Add New Department</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn ${
            feedbackType === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackType === 'success' ? <CheckCircle size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg('')} className="hover:opacity-75">✕</button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Departments</span>
            <div className="text-2xl font-black text-white">{departments.length}</div>
            <p className="text-[11px] text-emerald-400">Active Academic Programs</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Registered Students</span>
            <div className="text-2xl font-black text-white">{totalStudents.toLocaleString()}</div>
            <p className="text-[11px] text-teal-400">Live Database Roster</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Curriculum Courses</span>
            <div className="text-2xl font-black text-white">{totalCourses}</div>
            <p className="text-[11px] text-indigo-400">With reserve reading lists</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">HND Dissertations</span>
            <div className="text-2xl font-black text-white">{totalTheses}</div>
            <p className="text-[11px] text-amber-400">Archived in institutional ETD</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search departments by code (CEM, CSC), name, HOD, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Faculty:</span>
          {faculties.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFaculty(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedFaculty === f
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Department Cards Grid or Empty / Loading State */}
      {isLoading ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <RefreshCw size={36} className="mx-auto text-emerald-400 animate-spin" />
          <h4 className="text-base font-bold text-white">Fetching Registered Departments from Database...</h4>
          <p className="text-xs text-slate-400">Loading live academic units from backend database.</p>
        </div>
      ) : loadError ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-rose-900/60 space-y-3">
          <AlertCircle size={36} className="mx-auto text-rose-400" />
          <h4 className="text-base font-bold text-white">Unable to Load Departments</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{loadError}</p>
          <button
            onClick={fetchDepartmentsFromBackend}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <Building2 size={36} className="mx-auto text-slate-600" />
          <h4 className="text-base font-bold text-white">
            {departments.length === 0 ? 'No Departments Registered Yet' : 'No Departments Match Your Search'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {departments.length === 0
              ? 'Departments created by the Admin or Developer portal will appear here. Click "Add New Department" above to register one.'
              : 'Try a different search term or faculty filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map(dept => {
            const theme = getDepartmentTheme(dept);
            return (
              <div
                key={dept.code}
                style={{ borderColor: theme.solidHex }}
                className={`relative rounded-3xl bg-slate-900 border-2 transition-all duration-300 shadow-2xl ${theme.cardGlow} hover:-translate-y-1.5 flex flex-col justify-between group overflow-hidden`}
              >
                {/* Top Solid Color Header Bar */}
                <div className="h-2.5 w-full" style={{ backgroundColor: theme.solidHex }} />

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Header: Code, Accreditation Badge, Established */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3.5 py-1 rounded-xl font-mono text-xs font-black tracking-wider ${theme.codeBadge} border shadow flex items-center gap-1.5`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {dept.code}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${theme.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.indicator} animate-pulse`} />
                        <span>{dept.status || 'Active'}</span>
                      </span>
                    </div>
                    {dept.established && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                        <Calendar size={11} className="text-slate-500" />
                        <span>EST. {dept.established}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & School / Faculty */}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-black text-white group-hover:${theme.accentText} transition-colors tracking-tight leading-snug`}>
                      {dept.name}
                    </h3>
                    {dept.faculty && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Building2 size={13} className={`${theme.accentText} shrink-0`} />
                        <span className="truncate">{dept.faculty}</span>
                      </div>
                    )}
                  </div>

                  {/* Department Description Box (only when stored in database) */}
                  {dept.description && (
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-2xl border border-slate-800 line-clamp-2">
                      {dept.description}
                    </p>
                  )}

                  {/* 3 Live Metrics: Students, Courses, Dissertations */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    {/* 1. Students Metric */}
                    <div className={`relative overflow-hidden p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:${theme.borderSolid} transition-all flex flex-col justify-between group/stat`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Registered Students</span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Users size={12} />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-white tracking-tight">
                          {getDeptStudentCount(dept).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          DB
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                        <Database size={9} className="text-emerald-500/70 shrink-0" />
                        <span>Live Database</span>
                      </div>
                    </div>

                    {/* 2. Courses Metric */}
                    <div className={`relative overflow-hidden p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:${theme.borderSolid} transition-all flex flex-col justify-between group/stat`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Courses</span>
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <BookOpen size={12} />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className={`text-xl font-black ${theme.accentText} tracking-tight`}>
                          {(dept.courses_count ?? dept.coursesCount ?? 0).toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-semibold ${theme.accentText}`}>
                          Units
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                        Curricula
                      </div>
                    </div>

                    {/* 3. Dissertations Metric */}
                    <div className={`relative overflow-hidden p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:${theme.borderSolid} transition-all flex flex-col justify-between group/stat`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Dissertations</span>
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <FileText size={12} />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-amber-300 tracking-tight">
                          {(dept.theses_count ?? dept.hndProjectsCount ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-semibold text-amber-400">
                          HND
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
                        Institutional
                      </div>
                    </div>
                  </div>

                  {/* HOD Profile Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        <GraduationCap size={13} className={theme.accentText} />
                        <span>HEAD OF DEPARTMENT</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300">
                        PIN: {dept.pin || dept.hod_pin || '••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${theme.avatarBg} ring-2 flex items-center justify-center font-black text-xs shrink-0 shadow-md`}>
                        {getInitials(dept.hod || dept.hod_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">
                          {dept.hod || dept.hod_name || <span className="text-slate-500 italic font-medium">HOD not assigned</span>}
                        </div>
                        {(dept.hodEmail || dept.hod_email) && (
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
                            <span className="flex items-center gap-1 truncate" title={dept.hodEmail || dept.hod_email}>
                              <Mail size={11} className="shrink-0 text-slate-500" />
                              <span className="truncate">{dept.hodEmail || dept.hod_email}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Footer */}
                <div className="p-5 pt-0 flex items-center gap-2">
                  {/* Launch HOD Portal Button with SOLID color */}
                  <button
                    onClick={() => {
                      sounds.playSuccessChime();
                      if (onSwitchToHodPortal) {
                        onSwitchToHodPortal(dept);
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group/btn transform active:scale-[0.98] ${theme.btnSolid}`}
                    title={`Open dedicated ${dept.code} HOD Portal`}
                  >
                    <Sparkles size={14} className="text-white" />
                    <span className="tracking-wide">Launch HOD Portal</span>
                    <ExternalLink size={14} className="text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(dept)}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition shadow-sm"
                      title="Edit Department Details"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept)}
                      className="p-3 rounded-2xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900 text-rose-400 hover:text-white transition shadow-sm"
                      title="Delete Department"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingDept ? `Edit Department (${editingDept.code})` : 'Register New Academic Department'}
                </h3>
                <p className="text-xs text-slate-400">
                  Provision institutional department with automated HOD portal and curriculum reserves.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SLT, ACC, PAD"
                    value={formData.code}
                    disabled={Boolean(editingDept)}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Department Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Laboratory Technology"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Faculty / Academic School</label>
                <input
                  type="text"
                  placeholder="e.g. School of Applied Sciences & Technology"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Head of Department (HOD) Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. A. B. Adeleke"
                    value={formData.hod}
                    onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">HOD Institutional Email</label>
                  <input
                    type="email"
                    placeholder="hod.dept@fccibadan.edu.ng"
                    value={formData.hodEmail}
                    onChange={(e) => setFormData({ ...formData, hodEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Official Phone</label>
                  <input
                    type="text"
                    placeholder="+234 803 000 0000"
                    value={formData.hodPhone}
                    onChange={(e) => setFormData({ ...formData, hodPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">HOD Portal PIN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Set Security PIN"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Year Established</label>
                  <input
                    type="number"
                    value={formData.established}
                    onChange={(e) => setFormData({ ...formData, established: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
                  <span>Department Solid Brand Color & Theme (Must Be Unique)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">1 Exclusive Color Per Dept</span>
                </label>

                {(() => {
                  const usedColors = getUsedDepartmentColors(departments, editingDept?.id || editingDept?.code);
                  const selectedColorKey = normalizeColorKey(formData.color);
                  const isCurrentChosenUsed = usedColors[selectedColorKey];
                  const paletteList = Object.values(SOLID_COLOR_PALETTES).filter(c => c.key && !['purple', 'red', 'mint', 'gold'].includes(c.key));

                  return (
                    <div className="space-y-2">
                      {isCurrentChosenUsed && (
                        <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-2">
                          <AlertCircle size={15} className="text-rose-400 shrink-0" />
                          <span>This solid color is already assigned to <strong>Department {isCurrentChosenUsed}</strong>. Each department must have a distinct color.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                        {paletteList.map(c => {
                          const isSelected = selectedColorKey === c.key;
                          const occupiedBy = usedColors[c.key];

                          return (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, color: c.key });
                                if (occupiedBy) {
                                  sounds.playErrorBuzz();
                                } else {
                                  sounds.playClick();
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-400 bg-emerald-950/70 text-white shadow-md ring-1 ring-emerald-400'
                                  : occupiedBy
                                  ? 'border-slate-800/80 bg-slate-950/60 text-slate-500 hover:border-slate-700'
                                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.solid }} />
                                <span className="truncate text-[11px]">{c.name}</span>
                              </div>
                              {occupiedBy ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono shrink-0 ml-1">
                                  {occupiedBy}
                                </span>
                              ) : isSelected ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Curriculum & Research Scope Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline key academic disciplines, research laboratories, and dissertation fields..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950 transition flex items-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  <span>{editingDept ? 'Save Changes' : 'Confirm Registration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
