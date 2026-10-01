import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Search, Filter, GraduationCap, BookOpen, Users,
  FileText, CheckCircle, AlertCircle, Edit3, Trash2, ExternalLink,
  ChevronRight, Sparkles, Shield, Mail, Phone, Lock, Calendar, Layers, X
} from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';

export default function DepartmentManagement({ onSwitchToHodPortal }) {
  const [departments, setDepartments] = useState(() => departmentService.getDepartments());
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
    studentCount: 150,
    description: ''
  });

  useEffect(() => {
    const unsubscribe = departmentService.subscribe((updated) => {
      setDepartments(updated);
    });
    return unsubscribe;
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
      studentCount: 150,
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
      studentCount: dept.studentCount || 150,
      description: dept.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveDepartment = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.hod) {
      setFeedbackType('error');
      setFeedbackMsg('Department Code, Name, and Head of Department (HOD) are required.');
      sounds.playErrorBuzz();
      return;
    }

    try {
      if (editingDept) {
        departmentService.updateDepartment(editingDept.code, formData);
        setFeedbackType('success');
        setFeedbackMsg(`Department ${formData.code} (${formData.name}) updated successfully!`);
      } else {
        departmentService.addDepartment(formData);
        setFeedbackType('success');
        setFeedbackMsg(`New Department ${formData.code} successfully registered with active HOD Portal!`);
      }
      sounds.playSuccessChime();
      setIsAddModalOpen(false);
      setDepartments(departmentService.getDepartments());
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMsg(err.message || 'Error saving department.');
      sounds.playErrorBuzz();
    }
  };

  const handleDeleteDepartment = (code) => {
    if (confirm(`Are you sure you want to decommission Department ${code}? This will archive associated syllabus catalogs.`)) {
      try {
        departmentService.deleteDepartment(code);
        setFeedbackType('success');
        setFeedbackMsg(`Department ${code} removed from institution.`);
        sounds.playSuccessChime();
        setDepartments(departmentService.getDepartments());
      } catch (err) {
        setFeedbackType('error');
        setFeedbackMsg(err.message);
        sounds.playErrorBuzz();
      }
    }
  };

  // Color classes map
  const colorMap = {
    emerald: { bg: 'bg-emerald-950/40', border: 'border-emerald-600/40', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', accent: 'text-emerald-400' },
    teal: { bg: 'bg-teal-950/40', border: 'border-teal-600/40', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40', accent: 'text-teal-400' },
    indigo: { bg: 'bg-indigo-950/40', border: 'border-indigo-600/40', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', accent: 'text-indigo-400' },
    amber: { bg: 'bg-amber-950/40', border: 'border-amber-600/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', accent: 'text-amber-400' },
    purple: { bg: 'bg-purple-950/40', border: 'border-purple-600/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', accent: 'text-purple-400' },
    cyan: { bg: 'bg-cyan-950/40', border: 'border-cyan-600/40', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', accent: 'text-cyan-400' }
  };

  const totalStudents = useMemo(() => departments.reduce((acc, d) => acc + (d.studentCount || 0), 0), [departments]);
  const totalCourses = useMemo(() => departments.reduce((acc, d) => acc + (d.coursesCount || 0), 0), [departments]);
  const totalTheses = useMemo(() => departments.reduce((acc, d) => acc + (d.hndProjectsCount || 0), 0), [departments]);

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

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-950 transition shrink-0"
          >
            <Plus size={16} />
            <span>Add New Department</span>
          </button>
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
            <span className="text-[10px] font-mono uppercase text-slate-400">Enrolled Scholars</span>
            <div className="text-2xl font-black text-white">{totalStudents.toLocaleString()}</div>
            <p className="text-[11px] text-teal-400">Across ND & HND tiers</p>
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

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map(dept => {
          const theme = colorMap[dept.color] || colorMap.emerald;
          return (
            <div
              key={dept.code}
              className={`p-5 rounded-3xl bg-slate-900 border ${theme.border} hover:border-emerald-500/60 transition-all shadow-xl flex flex-col justify-between group space-y-4 relative overflow-hidden`}
            >
              <div className="space-y-3">
                {/* Header: Code & Faculty */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl font-mono text-xs font-black bg-slate-950 border border-slate-800 text-white">
                      {dept.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                      {dept.status || 'Active'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    EST. {dept.established}
                  </span>
                </div>

                {/* Name & Faculty */}
                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition leading-snug">
                    {dept.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {dept.faculty}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {dept.description}
                </p>

                {/* HOD Profile Box */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>HEAD OF DEPARTMENT</span>
                    <span className="text-emerald-400 font-bold">PIN: {dept.pin || '••••'}</span>
                  </div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <GraduationCap size={14} className={theme.accent} />
                    <span>{dept.hod}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{dept.hodEmail}</span>
                    <span className="font-mono text-slate-500">{dept.hodPhone}</span>
                  </div>
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-bold text-white">{dept.studentCount || 0}</div>
                    <div className="text-[9px] text-slate-400 font-mono">Students</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-bold text-teal-400">{dept.coursesCount || dept.courses?.length || 0}</div>
                    <div className="text-[9px] text-slate-400 font-mono">Courses</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs font-bold text-amber-400">{dept.hndProjectsCount || 0}</div>
                    <div className="text-[9px] text-slate-400 font-mono">Dissertations</div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                {/* Switch to HOD Portal for this department */}
                <button
                  onClick={() => {
                    sounds.playSuccessChime();
                    if (onSwitchToHodPortal) {
                      onSwitchToHodPortal(dept);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold flex items-center gap-1 shadow transition text-xs"
                  title={`Open dedicated ${dept.code} HOD Portal`}
                >
                  <span>Launch HOD Portal</span>
                  <ExternalLink size={12} />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(dept)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit Department Details"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(dept.code)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white transition"
                    title="Archive Department"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
