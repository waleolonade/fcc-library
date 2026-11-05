import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Shield, ShieldCheck, Sliders, CheckCircle2, XCircle,
  Lock, Unlock, Layers, BookOpen, Upload, Award, Bookmark, MessageSquare,
  Building2, Sparkles, Copy, Check, ExternalLink, Trash2, Edit3, Eye,
  EyeOff, RefreshCw, Search, KeyRound, Play, CheckSquare, AlertTriangle,
  FileText, ShieldAlert, Cpu, ArrowRight
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { publishRealtimeEvent } from '../services/realtimeSync';

export const STAFF_PAGE_CATALOG = [
  { id: 'overview', label: 'Department Overview & Holdings', desc: 'Departmental metrics, quick catalog search & Gora/InneAI tools', icon: Building2, badge: 'Core' },
  { id: 'courses', label: 'Curriculum & Syllabi Registry', desc: 'View and manage accredited department courses & reading lists', icon: BookOpen, badge: 'Academic' },
  { id: 'upload', label: 'Book & Academic Journal Upload Studio', desc: 'Single & bulk PDF book/journal upload with auto-metadata & cover scan', icon: Upload, badge: 'Studio' },
  { id: 'submissions', label: 'Ingestion Pipeline & Review Queue', desc: 'Track pending, approved, and rejected department uploads', icon: Layers, badge: 'Pipeline' },
  { id: 'dissertations', label: 'HND Dissertations & Student Projects', desc: 'Vet, endorse, or request revisions on student research projects', icon: Award, badge: 'Research' },
  { id: 'reserves', label: 'Course Reserves Shelf Desk', desc: 'Manage 2-hour restricted textbooks on reserve bays', icon: Bookmark, badge: 'Reserves' },
  { id: 'scholars', label: 'Registered Students & Clearance', desc: 'Departmental student registry and convocation library clearance', icon: Users, badge: 'Registry' },
  { id: 'communication', label: 'Tri-Party Dispatch & Messaging', desc: 'Official communications with HOD, Chief Librarian & Scholars', icon: MessageSquare, badge: 'Dispatch' }
];

export const STAFF_FEATURE_CATALOG = [
  { id: 'fn_upload_books', label: 'Upload Textbooks & Lecture Handouts', desc: 'Upload PDF materials with compression & cover extraction', page: 'upload', category: 'Publishing & Materials' },
  { id: 'fn_upload_journals', label: 'Bulk Upload Academic Journals & Auto-Scan', desc: 'Scan ISSN, DOI, volume, issue & cover picture automatically', page: 'upload', category: 'Publishing & Materials' },
  { id: 'fn_watermark_control', label: 'Digital Watermark Protection Seal', desc: 'Embed cryptographic institutional watermark on uploads', page: 'upload', category: 'Publishing & Materials' },
  { id: 'fn_edit_submissions', label: 'Edit Ingestion Pipeline Metadata', desc: 'Correct titles, authors, course codes & access scopes', page: 'submissions', category: 'Pipeline & Review' },
  { id: 'fn_delete_submissions', label: 'Withdraw / Delete Submissions', desc: 'Permanently remove submissions from the ingestion pipeline', page: 'submissions', category: 'Pipeline & Review' },
  { id: 'fn_manage_courses', label: 'Manage Curriculum Courses & Syllabi', desc: 'Add, edit, or delete accredited departmental courses', page: 'courses', category: 'Academic Curriculum' },
  { id: 'fn_manage_reserves', label: 'Manage Course Reserves Desk', desc: 'Place textbooks on restricted 2-hour reserve shelves', page: 'reserves', category: 'Academic Curriculum' },
  { id: 'fn_approve_dissertations', label: 'Approve / Review Student Dissertations', desc: 'Endorse capstone theses or request scholar revisions', page: 'dissertations', category: 'Research & Theses' },
  { id: 'fn_upload_dissertations', label: 'Direct Capstone Dissertation Ingestion', desc: 'Directly publish finished projects to institutional repository', page: 'dissertations', category: 'Research & Theses' },
  { id: 'fn_manage_students', label: 'Register & Import Department Students', desc: 'Add new scholars or bulk import via CSV/Excel', page: 'scholars', category: 'Students & Registry' },
  { id: 'fn_approve_clearance', label: 'Grant Convocation Library Clearance', desc: 'Sign off on final clearance for graduating scholars', page: 'scholars', category: 'Students & Registry' },
  { id: 'fn_send_dispatch', label: 'Tri-Party Dispatch & Broadcasts', desc: 'Send official memos to Librarian and department scholars', page: 'communication', category: 'Dispatch & Messaging' },
  { id: 'fn_ai_gora_tools', label: 'Gora Oracle & InneAI Synthesis Tools', desc: 'Run Gora off-chain computation & InneAI manuscript rigor', page: 'overview', category: 'Dispatch & Messaging' }
];

// Flexible 2 to 4 Function Preset Packages
export const FUNCTION_PACKAGES = [
  {
    id: 'pack_publishing',
    title: 'Publishing Lead (3 Functions)',
    desc: 'Textbook upload, bulk journal auto-scan & digital watermark protection',
    features: ['fn_upload_books', 'fn_upload_journals', 'fn_watermark_control'],
    pages: ['overview', 'upload', 'submissions']
  },
  {
    id: 'pack_curriculum',
    title: 'Curriculum & Reserves (2 Functions)',
    desc: 'Manage accredited departmental syllabi & 2-hour reserve shelf desk',
    features: ['fn_manage_courses', 'fn_manage_reserves'],
    pages: ['overview', 'courses', 'reserves']
  },
  {
    id: 'pack_theses',
    title: 'Theses & Projects Lead (2 Functions)',
    desc: 'Vet, approve or return student dissertations & upload capstones',
    features: ['fn_approve_dissertations', 'fn_upload_dissertations'],
    pages: ['overview', 'dissertations', 'communication']
  },
  {
    id: 'pack_clearance',
    title: 'Admissions & Clearance Officer (2 Functions)',
    desc: 'Register scholars, bulk import & grant convocation library clearance',
    features: ['fn_manage_students', 'fn_approve_clearance'],
    pages: ['overview', 'scholars', 'communication']
  },
  {
    id: 'pack_lead',
    title: 'Academic Deputy Lead (4 Core Functions)',
    desc: 'Journals bulk-scan, curriculum management, thesis approvals & clearance',
    features: ['fn_upload_journals', 'fn_manage_courses', 'fn_approve_dissertations', 'fn_approve_clearance'],
    pages: ['overview', 'courses', 'upload', 'dissertations', 'scholars', 'communication']
  },
  {
    id: 'pack_full',
    title: 'Full Delegated Authority (All Functions)',
    desc: 'Complete delegated access across all 13 operational capabilities',
    features: STAFF_FEATURE_CATALOG.map(f => f.id),
    pages: STAFF_PAGE_CATALOG.map(p => p.id)
  }
];

export const ROLE_PRESET_TEMPLATES = [
  {
    id: 'deputy_hod',
    name: 'Deputy HOD (Full Delegated Authority)',
    designation: 'Deputy Head of Department',
    badge: 'All Access',
    pages: { overview: true, courses: true, upload: true, submissions: true, dissertations: true, reserves: true, scholars: true, communication: true },
    features: {
      fn_upload_books: true, fn_upload_journals: true, fn_watermark_control: true,
      fn_edit_submissions: true, fn_delete_submissions: true, fn_manage_courses: true,
      fn_manage_reserves: true, fn_approve_dissertations: true, fn_upload_dissertations: true,
      fn_manage_students: true, fn_approve_clearance: true, fn_send_dispatch: true, fn_ai_gora_tools: true
    }
  },
  {
    id: 'journal_publishing_lead',
    name: 'Academic Journal & Book Publishing Lead (3 Functions)',
    designation: 'Senior Lecturer & Publications Editor',
    badge: 'Publishing',
    pages: { overview: true, courses: false, upload: true, submissions: true, dissertations: false, reserves: false, scholars: false, communication: true },
    features: {
      fn_upload_books: true, fn_upload_journals: true, fn_watermark_control: true,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: false,
      fn_manage_reserves: false, fn_approve_dissertations: false, fn_upload_dissertations: false,
      fn_manage_students: false, fn_approve_clearance: false, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  },
  {
    id: 'curriculum_coordinator',
    name: 'Curriculum & Syllabi Coordinator (2 Functions)',
    designation: 'Departmental Curriculum Coordinator',
    badge: 'Curriculum',
    pages: { overview: true, courses: true, upload: false, submissions: false, dissertations: false, reserves: true, scholars: false, communication: false },
    features: {
      fn_upload_books: false, fn_upload_journals: false, fn_watermark_control: false,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: true,
      fn_manage_reserves: true, fn_approve_dissertations: false, fn_upload_dissertations: false,
      fn_manage_students: false, fn_approve_clearance: false, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  },
  {
    id: 'thesis_supervisor',
    name: 'HND Research Project & Thesis Supervisor (2 Functions)',
    designation: 'Senior Lecturer & Project Supervisor',
    badge: 'Research',
    pages: { overview: true, courses: false, upload: false, submissions: false, dissertations: true, reserves: false, scholars: false, communication: true },
    features: {
      fn_upload_books: false, fn_upload_journals: false, fn_watermark_control: false,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: false,
      fn_manage_reserves: false, fn_approve_dissertations: true, fn_upload_dissertations: true,
      fn_manage_students: false, fn_approve_clearance: false, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  },
  {
    id: 'clearance_officer',
    name: 'Student Registry & Convocation Clearance Officer (2 Functions)',
    designation: 'Departmental Exam & Clearance Officer',
    badge: 'Clearance',
    pages: { overview: true, courses: false, upload: false, submissions: false, dissertations: false, reserves: false, scholars: true, communication: true },
    features: {
      fn_upload_books: false, fn_upload_journals: false, fn_watermark_control: false,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: false,
      fn_manage_reserves: false, fn_approve_dissertations: false, fn_upload_dissertations: false,
      fn_manage_students: true, fn_approve_clearance: true, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  },
  {
    id: 'academic_deputy_lead',
    name: 'Academic Deputy Lead (4 Core Functions)',
    designation: 'Principal Lecturer & Academic Deputy',
    badge: '4 Functions',
    pages: { overview: true, courses: true, upload: true, submissions: false, dissertations: true, reserves: false, scholars: true, communication: true },
    features: {
      fn_upload_books: false, fn_upload_journals: true, fn_watermark_control: false,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: true,
      fn_manage_reserves: false, fn_approve_dissertations: true, fn_upload_dissertations: false,
      fn_manage_students: false, fn_approve_clearance: true, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  },
  {
    id: 'read_only_observer',
    name: 'Read-Only Departmental Staff Observer',
    designation: 'Departmental Academic Observer',
    badge: 'Read-Only',
    pages: { overview: true, courses: true, upload: false, submissions: true, dissertations: false, reserves: false, scholars: false, communication: false },
    features: {
      fn_upload_books: false, fn_upload_journals: false, fn_watermark_control: false,
      fn_edit_submissions: false, fn_delete_submissions: false, fn_manage_courses: false,
      fn_manage_reserves: false, fn_approve_dissertations: false, fn_upload_dissertations: false,
      fn_manage_students: false, fn_approve_clearance: false, fn_send_dispatch: false, fn_ai_gora_tools: false
    }
  }
];

export default function HodStaffPageBuilder({
  currentDept,
  theme,
  staffList = [],
  isLoadingStaff = false,
  selectedStaffId,
  setSelectedStaffId,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
  onBulkUpdateStaff,
  onLaunchStaffWorkspace,
  onRefreshStaff
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkMatrixModal, setShowBulkMatrixModal] = useState(false);
  const [selectedBulkStaffIds, setSelectedBulkStaffIds] = useState([]);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [copiedKey, setCopiedKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const deptCode = (currentDept?.code || 'CEM').toUpperCase();
  const deptName = currentDept?.name || `${deptCode} Department`;

  // Dynamic Features Catalog (Default + Developer-Implemented Custom Features)
  const [featureCatalog, setFeatureCatalog] = useState(STAFF_FEATURE_CATALOG);

  useEffect(() => {
    fetch('/api/hod/staff/features-catalog')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.success && Array.isArray(data.features) && data.features.length > 0) {
          setFeatureCatalog(data.features);
        }
      })
      .catch(() => {});
  }, []);

  // Create Modal State with flexible 2 to 4 function assignment
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    designation: 'Senior Lecturer & Course Coordinator',
    staff_code: `STF/${deptCode}/00${(staffList?.length || 0) + 1}`,
    username: `${deptCode.toLowerCase()}_lecturer${(staffList?.length || 0) + 1}`,
    email: '',
    phone: '+234 803 000 0000',
    password: `${deptCode.toLowerCase()}staff123`,
    assigned_courses: `${deptCode} 411, ${deptCode} 312`,
    page_title: `${deptCode} Faculty Staff Academic Workspace`,
    welcome_banner: `Authorized by the Head of Department (${deptName}) to manage assigned departmental academic modules.`,
    preset_id: 'journal_publishing_lead',
    allowed_pages: { ...ROLE_PRESET_TEMPLATES[1].pages },
    allowed_features: { ...ROLE_PRESET_TEMPLATES[1].features }
  });

  // Keep defaults aligned when department switches
  useEffect(() => {
    setNewStaffForm(prev => {
      if (!prev.name.trim()) {
        const nextIdx = (staffList?.length || 0) + 1;
        return {
          ...prev,
          staff_code: `STF/${deptCode}/00${nextIdx}`,
          username: `${deptCode.toLowerCase()}_lecturer${nextIdx}`,
          password: `${deptCode.toLowerCase()}staff123`,
          assigned_courses: `${deptCode} 411, ${deptCode} 312`,
          page_title: `${deptCode} Faculty Staff Academic Workspace`,
          welcome_banner: `Authorized by the Head of Department (${deptName}) to manage assigned departmental academic modules.`
        };
      }
      return prev;
    });
  }, [deptCode, deptName, staffList?.length]);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.designation || '').toLowerCase().includes(q) ||
      (s.staff_code || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.page_title || '').toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  const activeStaff = useMemo(() => {
    if (!staffList || staffList.length === 0) return null;
    return staffList.find(s => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  const showToast = (type, text) => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    sounds.playClick();
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Toggle a single page or feature on the currently selected staff member
  const handleToggleSinglePermission = async (scope, key) => {
    if (!activeStaff) return;
    sounds.playClick();

    let updatedPages = { ...(activeStaff.allowed_pages || {}) };
    let updatedFeatures = { ...(activeStaff.allowed_features || {}) };

    if (scope === 'page') {
      updatedPages[key] = !updatedPages[key];
    } else {
      const willEnable = !updatedFeatures[key];
      updatedFeatures[key] = willEnable;

      if (willEnable) {
        // Auto-enable the corresponding page so it appears on their dashboard
        const featObj = featureCatalog.find(f => f.id === key);
        if (featObj && featObj.page) {
          updatedPages[featObj.page] = true;
        }
      }
    }

    const payload = {
      allowed_pages: updatedPages,
      allowed_features: updatedFeatures
    };

    setIsSaving(true);
    try {
      const res = await onUpdateStaff(activeStaff.id, payload);
      if (res && res.success) {
        showToast('success', `Updated permissions for ${activeStaff.name}. Staff live dashboard updated!`);
        publishRealtimeEvent({
          action: 'STAFF_PERMISSIONS_UPDATED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            allowed_pages: updatedPages,
            allowed_features: updatedFeatures,
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        showToast('error', res?.message || 'Failed to update permission in database.');
      }
    } catch (e) {
      showToast('error', 'Failed to update permission in database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply a quick 2-4 function package to the active staff member
  const handleApplyPackageToActiveStaff = async (pkg) => {
    if (!activeStaff) return;
    sounds.playSuccessChime();

    const newFeatures = {};
    featureCatalog.forEach(f => {
      newFeatures[f.id] = pkg.features.includes(f.id);
    });

    const newPages = { overview: true };
    STAFF_PAGE_CATALOG.forEach(p => {
      newPages[p.id] = pkg.pages.includes(p.id) || p.id === 'overview';
    });

    setIsSaving(true);
    try {
      const res = await onUpdateStaff(activeStaff.id, {
        allowed_pages: newPages,
        allowed_features: newFeatures
      });
      if (res && res.success) {
        showToast('success', `Assigned "${pkg.title}" to ${activeStaff.name}! Workspace synchronized.`);
        publishRealtimeEvent({
          action: 'STAFF_PACKAGE_APPLIED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            package_title: pkg.title,
            allowed_pages: newPages,
            allowed_features: newFeatures,
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        showToast('error', res?.message || 'Could not apply function package.');
      }
    } catch (e) {
      showToast('error', 'Could not apply function package.');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply a Role Preset Template to the active staff member
  const handleApplyPresetToActiveStaff = async (preset) => {
    if (!activeStaff) return;
    sounds.playSuccessChime();
    setIsSaving(true);
    try {
      const res = await onUpdateStaff(activeStaff.id, {
        designation: preset.designation,
        page_title: `${activeStaff.name} — ${preset.name}`,
        allowed_pages: { ...preset.pages },
        allowed_features: { ...preset.features }
      });
      if (res && res.success) {
        showToast('success', `Applied "${preset.name}" permission template to ${activeStaff.name}!`);
        publishRealtimeEvent({
          action: 'STAFF_PRESET_APPLIED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            preset_name: preset.name,
            designation: preset.designation,
            allowed_pages: { ...preset.pages },
            allowed_features: { ...preset.features },
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        showToast('error', res?.message || 'Could not apply role template.');
      }
    } catch (e) {
      showToast('error', 'Could not apply role template.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dedicated Handlers for Launch, Delete, Password Reset & Workspace Status
  const handleLaunchActiveStaffWorkspace = (staffObj) => {
    const target = staffObj || activeStaff;
    if (!target) return;
    sounds.playClick();
    if (target.status === 'suspended') {
      const proceed = window.confirm(
        `Note: ${target.name}'s workspace is currently marked as SUSPENDED in the database.\n\nDo you want to proceed and open this workspace anyway?`
      );
      if (!proceed) return;
    }
    try {
      localStorage.setItem('fcc_active_staff_selection', JSON.stringify(target));
    } catch (e) {}
    showToast('success', `Launching live delegated workspace for ${target.name} (${target.staff_code})...`);
    if (onLaunchStaffWorkspace) {
      onLaunchStaffWorkspace(target);
    }
  };

  const handleDeleteActiveStaff = async () => {
    if (!activeStaff || isSaving) return;
    sounds.playClick();
    const confirmDel = window.confirm(
      `Permanently remove staff workspace for ${activeStaff.name} (${activeStaff.staff_code})?\n\nThis will remove their assigned functions and database record.`
    );
    if (!confirmDel) return;

    setIsSaving(true);
    try {
      const res = await onDeleteStaff(activeStaff.id);
      if (res && res.success) {
        showToast('success', `Staff workspace for ${activeStaff.name} removed from central database.`);
        publishRealtimeEvent({
          action: 'STAFF_REMOVED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
        const remaining = staffList.filter(s => s.id !== activeStaff.id);
        if (remaining.length > 0) {
          setSelectedStaffId(remaining[0].id);
        } else {
          setSelectedStaffId(null);
        }
        if (onRefreshStaff) await onRefreshStaff(deptCode);
      } else {
        showToast('error', res?.message || 'Failed to remove staff workspace from database.');
      }
    } catch (e) {
      showToast('error', 'Error removing staff: ' + (e.message || 'Network error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveStaffStatus = async () => {
    if (!activeStaff || isSaving) return;
    sounds.playClick();
    const newStatus = activeStaff.status === 'active' ? 'suspended' : 'active';
    setIsSaving(true);
    try {
      const res = await onUpdateStaff(activeStaff.id, { status: newStatus });
      if (res && res.success) {
        showToast(
          'success',
          newStatus === 'active'
            ? `Workspace for ${activeStaff.name} reactivated in database.`
            : `Workspace for ${activeStaff.name} suspended. Staff login is now blocked in database.`
        );
        publishRealtimeEvent({
          action: 'STAFF_STATUS_UPDATED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            status: newStatus,
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
        if (onRefreshStaff) await onRefreshStaff(deptCode);
      } else {
        showToast('error', res?.message || 'Failed to update workspace status in database.');
      }
    } catch (e) {
      showToast('error', 'Error updating status: ' + (e.message || 'Network error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStaffPassword = async () => {
    if (!activeStaff || isSaving) return;
    const defaultFallback = `${deptCode.toLowerCase()}staff123`;
    const currentPass = activeStaff.password_plain || defaultFallback;
    const newPass = window.prompt(`Set new access password for ${activeStaff.name} (${activeStaff.staff_code}):`, currentPass);
    if (newPass === null || !newPass.trim()) return;

    setIsSaving(true);
    try {
      const res = await onUpdateStaff(activeStaff.id, { password: newPass.trim() });
      if (res && res.success) {
        setShowPasswordMap(p => ({ ...p, [activeStaff.id]: true }));
        showToast('success', `Password for ${activeStaff.name} updated to "${newPass.trim()}" and saved to database.`);
        publishRealtimeEvent({
          action: 'STAFF_PASSWORD_UPDATED',
          entity: 'hod_staff',
          id: activeStaff.id,
          staff_code: activeStaff.staff_code,
          username: activeStaff.username,
          data: {
            staff_name: activeStaff.name,
            timestamp: new Date().toISOString()
          }
        });
        if (onRefreshStaff) await onRefreshStaff(deptCode);
      } else {
        showToast('error', res?.message || 'Failed to update password in database.');
      }
    } catch (e) {
      showToast('error', 'Error updating password: ' + (e.message || 'Network error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle a feature inside the Create Modal
  const handleToggleModalFeature = (featId) => {
    sounds.playClick();
    setNewStaffForm(prev => {
      const nextFeatures = { ...(prev.allowed_features || {}) };
      const nextPages = { ...(prev.allowed_pages || {}) };
      const willEnable = !nextFeatures[featId];
      nextFeatures[featId] = willEnable;

      if (willEnable) {
        const featObj = featureCatalog.find(f => f.id === featId);
        if (featObj && featObj.page) {
          nextPages[featObj.page] = true;
        }
      }

      return {
        ...prev,
        allowed_features: nextFeatures,
        allowed_pages: nextPages
      };
    });
  };

  // Apply a package preset inside the Create Modal
  const handleApplyModalPackage = (pkg) => {
    sounds.playClick();
    const nextFeatures = {};
    featureCatalog.forEach(f => {
      nextFeatures[f.id] = pkg.features.includes(f.id);
    });
    const nextPages = { overview: true };
    STAFF_PAGE_CATALOG.forEach(p => {
      nextPages[p.id] = pkg.pages.includes(p.id) || p.id === 'overview';
    });

    setNewStaffForm(prev => ({
      ...prev,
      preset_id: pkg.id,
      allowed_features: nextFeatures,
      allowed_pages: nextPages
    }));
  };

  // Submit Create New Staff Page Modal
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim()) {
      showToast('error', 'Please enter the staff member full name.');
      return;
    }

    // Infer department code if staff_code has STF/DEPT/... format
    let targetDept = deptCode;
    if (newStaffForm.staff_code) {
      const match = newStaffForm.staff_code.match(/STF\/([A-Za-z0-9_-]+)\//i);
      if (match && match[1]) {
        targetDept = match[1].toUpperCase();
      }
    }

    setIsSaving(true);
    try {
      const result = await onCreateStaff({
        ...newStaffForm,
        department_code: targetDept,
        department_name: targetDept === deptCode ? deptName : `${targetDept} Department`,
        created_by_hod: currentDept?.hod_name || currentDept?.hod || `HOD (${targetDept})`
      });

      if (result && result.success) {
        setShowCreateModal(false);
        const createdStaff = result.staff || {};
        if (createdStaff?.id) {
          setSelectedStaffId(createdStaff.id);
        }
        if (onRefreshStaff) {
          await onRefreshStaff(targetDept);
        }

        publishRealtimeEvent({
          action: 'STAFF_CREATED',
          entity: 'hod_staff',
          id: createdStaff?.id,
          staff_code: createdStaff?.staff_code || newStaffForm.staff_code,
          username: createdStaff?.username || newStaffForm.username,
          data: {
            staff_name: createdStaff?.name || newStaffForm.name,
            department_code: targetDept,
            designation: createdStaff?.designation || newStaffForm.designation,
            timestamp: new Date().toISOString()
          }
        });

        const nextIdx = (staffList?.length || 0) + 2;
        setNewStaffForm({
          name: '',
          designation: 'Senior Lecturer & Course Coordinator',
          staff_code: `STF/${targetDept}/00${nextIdx}`,
          username: `${targetDept.toLowerCase()}_lecturer${nextIdx}`,
          email: '',
          phone: '+234 803 000 0000',
          password: `${targetDept.toLowerCase()}staff123`,
          assigned_courses: `${targetDept} 411, ${targetDept} 312`,
          page_title: `${targetDept} Faculty Staff Academic Workspace`,
          welcome_banner: `Authorized by the Head of Department (${deptName}) to manage assigned departmental academic modules.`,
          preset_id: 'journal_publishing_lead',
          allowed_pages: { ...ROLE_PRESET_TEMPLATES[1].pages },
          allowed_features: { ...ROLE_PRESET_TEMPLATES[1].features }
        });

        showToast(
          'success',
          `Created custom staff workspace for ${createdStaff?.name || newStaffForm.name}! Staff Code: ${createdStaff?.staff_code || newStaffForm.staff_code} • Password: ${result.plain_password || newStaffForm.password}`
        );
      } else {
        showToast('error', result?.message || 'Failed to create staff workspace. Please verify all fields.');
      }
    } catch (err) {
      showToast('error', 'Failed to create staff workspace: ' + (err.message || 'Network error'));
    } finally {
      setIsSaving(false);
    }
  };

  const activeFeaturesCount = activeStaff
    ? Object.values(activeStaff.allowed_features || {}).filter(Boolean).length
    : 0;

  const modalActiveFeaturesCount = Object.values(newStaffForm.allowed_features || {}).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Executive Header */}
      <div className="p-6 rounded-3xl bg-[#0a1324] border-2 border-slate-800 shadow-2xl relative overflow-hidden">
        <div
          className="h-1.5 w-full absolute top-0 left-0"
          style={{ backgroundColor: theme?.solidPrimary || '#059669' }}
        />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow"
                style={{ backgroundColor: theme?.solidPrimary || '#059669' }}
              >
                HOD DELEGATED RBAC &amp; WORKSPACE ARCHITECT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#162238] border border-slate-700 text-cyan-300 text-[10px] font-mono font-bold">
                PAGE 1 OF 2 • #/hod/staff-builder
              </span>
              <span className="text-xs font-mono text-slate-400">
                {deptName} ({deptCode})
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Departmental Staff Page Builder &amp; Feature/Function Access Control
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create custom workspaces for lecturers and assistants under your authority. Assign 2 to 4 functions to each staff member—as you activate or toggle new capabilities, they immediately appear on that staff member's live dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setSelectedBulkStaffIds(staffList.map(s => s.id));
                setShowBulkMatrixModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-[#162238] hover:bg-[#1e2f4d] border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <Sliders size={14} />
              <span>Bulk Staff Matrix ({staffList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer hover:opacity-95"
              style={{ backgroundColor: theme?.solidPrimary || '#059669' }}
            >
              <UserPlus size={15} />
              <span>+ Create Staff Page &amp; Access</span>
            </button>

            {activeStaff && (
              <button
                type="button"
                onClick={() => handleLaunchActiveStaffWorkspace(activeStaff)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                title="Open Page 2 (#/hod/staff-workspace) to preview and operate this staff member's live page"
              >
                <Play size={14} />
                <span>Open Live Staff Workspace &rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Solid Status Toast */}
      {statusBanner && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xl animate-fadeIn ${
          statusBanner.type === 'success'
            ? 'bg-emerald-950 border-emerald-600 text-emerald-100'
            : 'bg-rose-950 border-rose-600 text-rose-100'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
            <span className="leading-relaxed">{statusBanner.text}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-xs px-2 py-1 rounded bg-black/40 hover:bg-black/60">Dismiss</button>
        </div>
      )}

      {/* Main Two-Column Architect Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 cols): Staff Roster under this HOD */}
        <div className="xl:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0b1324] border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Users size={15} className="text-emerald-400" />
                  <span>Staff Under {deptCode} HOD ({staffList.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">Select a staff member to customize their page &amp; functions</p>
              </div>
              <button
                type="button"
                onClick={onRefreshStaff}
                className="p-1.5 rounded-lg bg-[#162238] hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Refresh staff list"
              >
                <RefreshCw size={13} className={isLoadingStaff ? 'animate-spin text-emerald-400' : ''} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, rank, or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070d19] border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredStaff.map(st => {
                const isSelected = activeStaff?.id === st.id;
                const enabledPagesCount = Object.values(st.allowed_pages || {}).filter(Boolean).length;
                const enabledFeaturesCount = Object.values(st.allowed_features || {}).filter(Boolean).length;
                const isActiveStatus = (st.status || 'active') === 'active';

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedStaffId(st.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#13233e] border-emerald-500 shadow-xl ring-1 ring-emerald-500/50'
                        : 'bg-[#070d19] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">{st.name}</span>
                          <span className={`w-2 h-2 rounded-full ${isActiveStatus ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        </div>
                        <div className="text-[11px] text-emerald-300 font-medium truncate mt-0.5">{st.designation}</div>
                        <div className="text-[10px] font-mono text-cyan-300 mt-0.5">{st.staff_code}</div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#162238] text-amber-300 border border-slate-700 shrink-0">
                        {enabledFeaturesCount} Fns
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{enabledPagesCount} Pages Allowed</span>
                      <span className="text-cyan-400">{st.assigned_courses ? (Array.isArray(st.assigned_courses) ? st.assigned_courses.slice(0, 2).join(', ') : st.assigned_courses) : 'All Courses'}</span>
                    </div>
                  </div>
                );
              })}

              {filteredStaff.length === 0 && (
                <div className="p-6 rounded-2xl bg-[#070d19] border border-slate-800 text-center space-y-2">
                  <Users size={24} className="mx-auto text-slate-500" />
                  <p className="text-xs text-slate-400 font-medium">No departmental staff found.</p>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs text-emerald-400 hover:underline font-bold"
                  >
                    + Add Staff Member Under HOD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Staff Configurator & Flexible Function Matrix */}
        <div className="xl:col-span-8 space-y-5">
          {activeStaff ? (
            <div className="space-y-5">
              {/* Active Staff Dossier & Credentials Card */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {activeStaff.staff_code}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">ID: {activeStaff.id}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{activeStaff.name}</h3>
                    <p className="text-xs text-slate-400">{activeStaff.designation} • {deptName}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchActiveStaffWorkspace(activeStaff)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer hover:scale-105 active:scale-95"
                      title="Launch and enter this staff member's live delegated workspace"
                    >
                      <Play size={13} />
                      <span>Launch Staff Dashboard &rarr;</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleDeleteActiveStaff}
                      className="px-3 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Permanently remove this staff member and delete from database"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Credentials Quick-Copy Drawer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#070d19] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">STAFF LOGIN USERNAME</span>
                      <strong className="text-white">{activeStaff.username}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeStaff.username, 'user')}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy Username"
                    >
                      {copiedKey === 'user' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070d19] border border-slate-800 flex items-center justify-between">
                    <div className="min-w-0 pr-1">
                      <span className="text-[10px] text-slate-500 block">INITIAL ACCESS PASSWORD</span>
                      <strong className="text-emerald-300 tracking-wider break-all">
                        {showPasswordMap[activeStaff.id]
                          ? (activeStaff.password_plain || `${deptCode.toLowerCase()}staff123`)
                          : '••••••••••••'}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setShowPasswordMap(p => ({ ...p, [activeStaff.id]: !p[activeStaff.id] }));
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title={showPasswordMap[activeStaff.id] ? "Hide password" : "View initial access password"}
                      >
                        {showPasswordMap[activeStaff.id] ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} className="text-emerald-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeStaff.password_plain || `${deptCode.toLowerCase()}staff123`, 'pass')}
                        className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedKey === 'pass' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetStaffPassword}
                        className="p-1 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                        title="Change / Reset Initial Access Password"
                      >
                        <KeyRound size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#070d19] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">WORKSPACE STATUS</span>
                      <span className={`font-bold text-xs flex items-center gap-1.5 ${activeStaff.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${activeStaff.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {activeStaff.status === 'active' ? '✓ ACTIVE' : 'SUSPENDED'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleToggleActiveStaffStatus}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow ${
                        activeStaff.status === 'active'
                          ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200'
                          : 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200'
                      }`}
                      title={activeStaff.status === 'active' ? "Suspend staff member access (blocks login)" : "Reactivate staff member workspace"}
                    >
                      {activeStaff.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-CLICK FLEXIBLE 2 TO 4 FUNCTION PACKAGES */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      <span>1-Click 2 to 4 Function Packages</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Click a package to instantly assign 2, 3, or 4 functions to {activeStaff.name}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {activeFeaturesCount} Functions Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {FUNCTION_PACKAGES.map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleApplyPackageToActiveStaff(pkg)}
                      disabled={isSaving}
                      className="p-3 rounded-2xl bg-[#070d19] hover:bg-[#12223d] border border-slate-800 hover:border-emerald-500/60 text-left transition cursor-pointer group space-y-1"
                    >
                      <div className="font-bold text-xs text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>{pkg.title}</span>
                        <ArrowRight size={12} className="text-slate-500 group-hover:text-emerald-400 transition" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{pkg.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* GRANULAR FUNCTION MATRIX: HOD ASSIGNS 2 TO 4 FUNCTIONS */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders size={16} className="text-cyan-400" />
                      <span>Granular Operational Functions &amp; Capabilities ({featureCatalog.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Toggle any function on/off. When activated, the function and its parent page instantly unlock in the staff member's live workspace.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                    {activeFeaturesCount} of {featureCatalog.length} Functions Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {featureCatalog.map(feat => {
                    const isGranted = Boolean(activeStaff.allowed_features?.[feat.id]);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => handleToggleSinglePermission('feature', feat.id)}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                          isGranted
                            ? 'bg-[#10233d] border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-cyan-300">
                              {feat.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">• Page: {feat.page}</span>
                          </div>
                          <div className={`text-xs font-bold ${isGranted ? 'text-white' : 'text-slate-300'}`}>
                            {feat.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">{feat.desc}</div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 border flex items-center gap-1 ${
                          isGranted
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                          {isGranted ? <Check size={11} /> : <Lock size={11} />}
                          <span>{isGranted ? 'ACTIVE' : 'OFF'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ALLOWED PORTAL PAGES LIST */}
              <div className="p-5 rounded-3xl bg-[#0b1324] border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers size={16} className="text-amber-400" />
                      <span>Visible Portal Pages in Staff Navigation ({STAFF_PAGE_CATALOG.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Pages with assigned functions are automatically activated. You can also manually toggle page visibility.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STAFF_PAGE_CATALOG.map(page => {
                    const isAllowed = Boolean(activeStaff.allowed_pages?.[page.id]);
                    const Icon = page.icon;
                    return (
                      <div
                        key={page.id}
                        onClick={() => handleToggleSinglePermission('page', page.id)}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                          isAllowed
                            ? 'bg-[#10233d] border-cyan-500/70 text-white'
                            : 'bg-[#070d19] border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={16} className={isAllowed ? 'text-cyan-400' : 'text-slate-600'} />
                          <span className="font-bold truncate">{page.label}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          isAllowed ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {isAllowed ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#0b1324] border border-slate-800 text-center space-y-3">
              <Users size={40} className="mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">No Staff Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a staff member from the left roster or create a new staff profile to assign functions and configure their workspace.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                + Create Staff Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE STAFF PAGE & ASSIGN 2 TO 4 FUNCTIONS */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#070d19] border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  NEW STAFF WORKSPACE PROVISIONING • {deptCode}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Create Staff Page &amp; Assign 2 to 4 Functions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Staff Full Name &amp; Title *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.name}
                    onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    placeholder="e.g. Dr. Mrs. Funmilayo Bello"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Academic Rank / Designation *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.designation}
                    onChange={e => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                    placeholder="e.g. Senior Lecturer & Course Coordinator"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Staff Code / ID</label>
                  <input
                    type="text"
                    value={newStaffForm.staff_code}
                    onChange={e => setNewStaffForm({ ...newStaffForm, staff_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Login Username</label>
                  <input
                    type="text"
                    value={newStaffForm.username}
                    onChange={e => setNewStaffForm({ ...newStaffForm, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Initial Access Password</label>
                  <input
                    type="text"
                    value={newStaffForm.password}
                    onChange={e => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    placeholder="staff@fccibadan.edu.ng"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Assigned Course Codes (Comma-separated)</label>
                  <input
                    type="text"
                    value={newStaffForm.assigned_courses}
                    onChange={e => setNewStaffForm({ ...newStaffForm, assigned_courses: e.target.value })}
                    placeholder="e.g. OAO 411, OAO 312"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Custom Staff Workspace Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffForm.page_title}
                  onChange={e => setNewStaffForm({ ...newStaffForm, page_title: e.target.value })}
                  placeholder="e.g. OAO Faculty Staff Academic Workspace"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-200 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* SELECT INITIAL PERMISSION PRESET */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <label className="block font-bold text-emerald-300">
                    Select Initial Permission Preset (Customizable below):
                  </label>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {modalActiveFeaturesCount} Functions Assigned
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLE_PRESET_TEMPLATES.map(preset => {
                    const isSelected = newStaffForm.preset_id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setNewStaffForm(prev => ({
                            ...prev,
                            preset_id: preset.id,
                            allowed_pages: { ...preset.pages },
                            allowed_features: { ...preset.features }
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#12223d] border-emerald-500 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-[11px] leading-tight line-clamp-2">{preset.name}</div>
                        <div className="pt-2 flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {preset.badge || 'Preset'}
                          </span>
                          {isSelected && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRANULAR FUNCTION SELECTION (CHECKBOXES) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <label className="block font-bold text-white">
                    Select 2 to 4 Operational Functions to Assign:
                  </label>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200">
                    {modalActiveFeaturesCount} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {featureCatalog.map(feat => {
                    const isSelected = Boolean(newStaffForm.allowed_features?.[feat.id]);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => handleToggleModalFeature(feat.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#10233d] border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[11px] truncate">{feat.label}</div>
                          <div className="text-[9px] text-slate-400">Page: {feat.page}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isSelected ? '✓ YES' : 'NO'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Provisioning Staff Workspace...' : 'Create Staff Page & Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK CROSS-STAFF PERMISSION MATRIX */}
      {showBulkMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#070d19] border-2 border-cyan-500/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  BULK PERMISSION SYNCHRONIZER
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Apply Function Package Across Departmental Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkMatrixModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select a standard function package to batch-apply to all {staffList.length} staff members under {deptName}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FUNCTION_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={async () => {
                    const confirmBulk = window.confirm(`Apply "${pkg.title}" across all ${staffList.length} departmental staff members?`);
                    if (!confirmBulk) return;
                    setIsSaving(true);
                    try {
                      const nextFeatures = {};
                      featureCatalog.forEach(f => { nextFeatures[f.id] = pkg.features.includes(f.id); });
                      const nextPages = { overview: true };
                      STAFF_PAGE_CATALOG.forEach(p => { nextPages[p.id] = pkg.pages.includes(p.id) || p.id === 'overview'; });

                      await onBulkUpdateStaff({
                        staff_ids: staffList.map(s => s.id),
                        allowed_pages: nextPages,
                        allowed_features: nextFeatures
                      });
                      setShowBulkMatrixModal(false);
                      showToast('success', `Applied "${pkg.title}" across all departmental staff.`);
                    } catch (e) {
                      showToast('error', 'Bulk update failed.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-slate-900 hover:bg-[#12223d] border border-slate-800 hover:border-cyan-500 text-left transition cursor-pointer space-y-1"
                >
                  <div className="font-bold text-xs text-white flex items-center justify-between">
                    <span>{pkg.title}</span>
                    <ArrowRight size={12} className="text-cyan-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">{pkg.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkMatrixModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
