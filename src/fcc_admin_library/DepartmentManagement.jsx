import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Search, Filter, GraduationCap, BookOpen, Users,
  FileText, CheckCircle, AlertCircle, Edit3, Trash2, ExternalLink,
  ChevronRight, Sparkles, Shield, Mail, Phone, Lock, Calendar, Layers, X,
  RefreshCw, Database
} from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';

export default function DepartmentManagement({ onSwitchToHodPortal }) {
  const [departments, setDepartments] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    faculty: 'School of Cooperative & Management Studies',
    hod: '',
    hodEmail: '',
    hodPhone: '',
    pin: '1234',
    established: '2026',
    color: 'emerald',
    studentCount: 0,
    description: ''
  });

  // Fetch exclusively from backend database
  const fetchDepartmentsFromBackend = async () => {
    setIsLoading(true);
    try {
      const [resDepts, resPatrons] = await Promise.all([
        fetch('/api/departments', { headers: { 'Accept': 'application/json' } }),
        fetch('/api/patrons', { headers: { 'Accept': 'application/json' } })
      ]);

      if (resDepts.ok) {
        const data = await resDepts.json();
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      }

      if (resPatrons.ok) {
        const pData = await resPatrons.json();
        if (Array.isArray(pData)) {
          setPatrons(pData);
        }
      }
    } catch (err) {
      console.error('Error fetching departments and patrons from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsFromBackend();
  }, []);

  const faculties = useMemo(() => {
    const list = departments.map(d => d.faculty);
    return ['All', ...Array.from(new Set(list))];
  }, [departments]);

  const filteredDepts = useMemo(() => {
    return departments.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hod.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q);
      const matchF = selectedFaculty === 'All' || d.faculty === selectedFaculty;
      return matchQ && matchF;
    });
  }, [departments, searchQuery, selectedFaculty]);

  const handleOpenAddModal = () => {
    sounds.playClick();
    setFormData({
      code: '',
      name: '',
      faculty: faculties[1] || 'School of Cooperative & Management Studies',
      hod: '',
      hodEmail: '',
      hodPhone: '',
      pin: '1234',
      established: new Date().getFullYear().toString(),
      color: 'emerald',
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
      code: dept.code,
      name: dept.name,
      faculty: dept.faculty,
      hod: dept.hod,
      hodEmail: dept.hodEmail,
      hodPhone: dept.hodPhone,
      pin: dept.pin || '1234',
      established: dept.established?.toString() || '1990',
      color: dept.color || 'emerald',
      studentCount: dept.student_count ?? dept.studentCount ?? 0,
      description: dept.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.hod) {
      setFeedbackType('error');
      setFeedbackMsg('Department Code, Name, and Head of Department (HOD) are required.');
      sounds.playErrorBuzz();
      return;
    }

    try {
      const parsedStudents = parseInt(formData.studentCount, 10);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.toUpperCase().trim(),
        faculty: formData.faculty?.trim() || 'School of Cooperative & Management Studies',
        hod_name: formData.hod.trim(),
        hod_email: formData.hodEmail?.trim() || `${formData.code.toLowerCase().trim()}.hod@fccibadan.edu.ng`,
        hod_phone: formData.hodPhone?.trim() || '+234 800 000 0000',
        hod_pin: formData.pin?.trim() || '1234',
        student_count: !isNaN(parsedStudents) && parsedStudents >= 0 ? parsedStudents : 0,
        faculty_count: 8,
        description: formData.description?.trim() || `Department offering accredited programmes in ${formData.name.trim()}.`,
        established: formData.established?.toString().trim() || new Date().getFullYear().toString()
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

  // Solid color themes per academic department (Pure vibrant solids)
  const DEPARTMENT_THEMES = {
    PAD: {
      colorName: 'Ocean Teal',
      solidHex: '#0d9488',
      topBanner: 'bg-teal-500',
      borderSolid: 'border-teal-500',
      cardGlow: 'hover:shadow-teal-950/60 hover:shadow-2xl',
      badge: 'bg-teal-950 text-teal-200 border-teal-500',
      accentText: 'text-teal-400',
      codeBadge: 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950',
      btnSolid: 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-950',
      avatarBg: 'bg-teal-600 text-white ring-teal-400',
      statAccent: 'text-teal-400',
      indicator: 'bg-teal-400',
      cardBg: 'bg-slate-900'
    },
    CSC: {
      colorName: 'Royal Blue',
      solidHex: '#2563eb',
      topBanner: 'bg-blue-600',
      borderSolid: 'border-blue-500',
      cardGlow: 'hover:shadow-blue-950/60 hover:shadow-2xl',
      badge: 'bg-blue-950 text-blue-200 border-blue-500',
      accentText: 'text-blue-400',
      codeBadge: 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950',
      btnSolid: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950',
      avatarBg: 'bg-blue-600 text-white ring-blue-400',
      statAccent: 'text-blue-400',
      indicator: 'bg-blue-400',
      cardBg: 'bg-slate-900'
    },
    CEM: {
      colorName: 'Forest Emerald',
      solidHex: '#059669',
      topBanner: 'bg-emerald-600',
      borderSolid: 'border-emerald-500',
      cardGlow: 'hover:shadow-emerald-950/60 hover:shadow-2xl',
      badge: 'bg-emerald-950 text-emerald-200 border-emerald-500',
      accentText: 'text-emerald-400',
      codeBadge: 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950',
      btnSolid: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950',
      avatarBg: 'bg-emerald-600 text-white ring-emerald-400',
      statAccent: 'text-emerald-400',
      indicator: 'bg-emerald-400',
      cardBg: 'bg-slate-900'
    },
    BNF: {
      colorName: 'Amber Gold',
      solidHex: '#d97706',
      topBanner: 'bg-amber-600',
      borderSolid: 'border-amber-500',
      cardGlow: 'hover:shadow-amber-950/60 hover:shadow-2xl',
      badge: 'bg-amber-950 text-amber-200 border-amber-500',
      accentText: 'text-amber-400',
      codeBadge: 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-950',
      btnSolid: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950',
      avatarBg: 'bg-amber-600 text-white ring-amber-400',
      statAccent: 'text-amber-400',
      indicator: 'bg-amber-400',
      cardBg: 'bg-slate-900'
    },
    AGR: {
      colorName: 'Violet Purple',
      solidHex: '#7c3aed',
      topBanner: 'bg-purple-600',
      borderSolid: 'border-purple-500',
      cardGlow: 'hover:shadow-purple-950/60 hover:shadow-2xl',
      badge: 'bg-purple-950 text-purple-200 border-purple-500',
      accentText: 'text-purple-400',
      codeBadge: 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950',
      btnSolid: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950',
      avatarBg: 'bg-purple-600 text-white ring-purple-400',
      statAccent: 'text-purple-400',
      indicator: 'bg-purple-400',
      cardBg: 'bg-slate-900'
    },
    BAM: {
      colorName: 'Crimson Rose',
      solidHex: '#e11d48',
      topBanner: 'bg-rose-600',
      borderSolid: 'border-rose-500',
      cardGlow: 'hover:shadow-rose-950/60 hover:shadow-2xl',
      badge: 'bg-rose-950 text-rose-200 border-rose-500',
      accentText: 'text-rose-400',
      codeBadge: 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950',
      btnSolid: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950',
      avatarBg: 'bg-rose-600 text-white ring-rose-400',
      statAccent: 'text-rose-400',
      indicator: 'bg-rose-400',
      cardBg: 'bg-slate-900'
    }
  };

  const getDepartmentTheme = (code) => {
    const upper = (code || '').toUpperCase();
    if (DEPARTMENT_THEMES[upper]) return DEPARTMENT_THEMES[upper];
    return DEPARTMENT_THEMES.CEM;
  };

  const getInitials = (name) => {
    if (!name) return 'HD';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/gi, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'HD';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDeptStudentCount = (dept) => {
    if (patrons && patrons.length > 0) {
      const dName = (dept.name || '').toLowerCase();
      const dCode = (dept.code || '').toLowerCase();
      const matched = patrons.filter(p => {
        const pDept = (p.department || '').toLowerCase();
        const pMat = (p.matric || '').toLowerCase();
        return pDept.includes(dName) || dName.includes(pDept) || pDept.includes(dCode) || pMat.includes(`/${dCode}/`) || pMat.includes(dCode);
      });
      return matched.length;
    }
    return dept.student_count ?? dept.studentCount ?? 0;
  };

  const totalStudents = useMemo(() => {
    if (patrons && patrons.length > 0) {
      return patrons.length;
    }
    return departments.reduce((acc, d) => acc + (d.student_count ?? d.studentCount ?? 0), 0);
  }, [patrons, departments]);
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
      ) : filteredDepts.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <Building2 size={36} className="mx-auto text-slate-600" />
          <h4 className="text-base font-bold text-white">No Registered Departments Found in Database</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Only departments registered in the backend database will appear here. Click "Add New Department" above to register an academic department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map(dept => {
            const theme = getDepartmentTheme(dept.code);
            return (
              <div
                key={dept.code}
                className={`relative rounded-3xl bg-slate-900 border-2 ${theme.borderSolid} transition-all duration-300 shadow-2xl ${theme.cardGlow} hover:-translate-y-1.5 flex flex-col justify-between group overflow-hidden`}
              >
                {/* Top Solid Color Header Bar */}
                <div className={`h-2.5 w-full ${theme.topBanner}`} />

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
                        <span className="text-[9px] opacity-75">• NBTE</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                      <Calendar size={11} className="text-slate-500" />
                      <span>EST. {dept.established || '1990'}</span>
                    </div>
                  </div>

                  {/* Title & School / Faculty */}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-black text-white group-hover:${theme.accentText} transition-colors tracking-tight leading-snug`}>
                      {dept.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Building2 size={13} className={`${theme.accentText} shrink-0`} />
                      <span className="truncate">{dept.faculty}</span>
                    </div>
                  </div>

                  {/* Department Description Box */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-2xl border border-slate-800 line-clamp-2">
                    {dept.description || `Accredited academic unit offering National Diploma (ND) and Higher National Diploma (HND) curricula in ${dept.name}.`}
                  </p>

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
                          {dept.hod || dept.hod_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
                          <span className="flex items-center gap-1 truncate" title={dept.hodEmail || dept.hod_email}>
                            <Mail size={11} className="shrink-0 text-slate-500" />
                            <span className="truncate">{dept.hodEmail || dept.hod_email}</span>
                          </span>
                        </div>
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
                    maxLength={6}
                    placeholder="1234"
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
