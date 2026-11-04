import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GraduationCap, Upload, FileText, CheckCircle, Clock, AlertTriangle,
  BookOpen, BarChart3, Layers, Building2, LogOut, ArrowRight, Sparkles,
  ExternalLink, Plus, Filter, Search, ShieldCheck, Eye, RefreshCw, Send, Check,
  MessageSquare, Menu, ChevronLeft, ChevronRight, Users, Award, Shield,
  Settings, Bookmark, MapPin, Download, CheckSquare, XCircle, Compass,
  BookCheck, Sliders, Calendar, Phone, Mail, UserCheck, Trash2, FileUp, Image,
  Lock, KeyRound, AlertCircle, EyeOff, UserPlus, FileSpreadsheet, Edit3,
  Camera, CheckCircle2, Copy, Save, User, Edit
} from 'lucide-react';
import { parseCurrentRoute, navigateTo } from '../utils/router';
import HodUploadStudio from './HodUploadStudio';
import InstitutionalCommunicationHub from '../common/InstitutionalCommunicationHub';
import StudentAddModal from '../common/StudentAddModal';
import StudentBulkImportModal from '../common/StudentBulkImportModal';
import StudentEditModal from '../common/StudentEditModal';
import ForgotPasswordModal from '../common/ForgotPasswordModal';
import { libraryApi, getApiBase } from '../api/libraryApi';
import { PATTERNS } from '../utils/backgroundPatterns';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';
import { institutionalConfigService } from '../services/institutionalConfigService';
import { developerConfigService } from '../services/developerConfigService';
import DigitalBookReader from '../common/DigitalBookReader';
import DuplicateBookModal from '../common/DuplicateBookModal';
import { compressPdf, compressCoverImage } from '../utils/pdfCompressor';
import { analyzeUploadedPdf } from '../utils/pdfDeepAnalyzer';
import PdfOptimizerWidget from '../common/PdfOptimizerWidget';
import HodDissertationUploadModal from './HodDissertationUploadModal';
import UniversalNotificationCenter from '../common/UniversalNotificationCenter';
import HodStaffPageBuilder from './HodStaffPageBuilder';
import HodStaffLiveWorkspace from './HodStaffLiveWorkspace';
import MaintenanceBroadcastBanner from '../common/MaintenanceBroadcastBanner';
import { publishRealtimeEvent, subscribeRealtimeEvents } from '../services/realtimeSync';
export {
  HOD_DEPARTMENT_THEMES,
  SOLID_COLOR_PALETTES,
  getDynamicDeptTheme
} from './hodThemeConfig';
import {
  HOD_DEPARTMENT_THEMES,
  SOLID_COLOR_PALETTES,
  getDynamicDeptTheme
} from './hodThemeConfig';

const isLocalhostHost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);


export default function HodDashboard({ user: initialUser, onLogout }) {
  const [departments, setDepartments] = useState(() => {
    // 1. Check cached full departments first
    try {
      const cached = JSON.parse(
        localStorage.getItem('fcc_departments_v48_gov') ||
        localStorage.getItem('fcc_cached_departments') ||
        '[]'
      );
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch (e) {}

    // 2. Immediately seed the logged-in user's department so there is zero initial flash
    return initialUser?.department_code ? [{
      id: initialUser.department_id || `DEP-${initialUser.department_code}`,
      code: initialUser.department_code,
      name: initialUser.department_name || `${initialUser.department_code} Department`,
      hod_name: initialUser.name || 'Head of Department',
      hod: initialUser.name || 'Head of Department',
      hod_email: initialUser.email || '',
      faculty: initialUser.faculty || 'School of Academic Studies'
    }] : [];
  });
  const [currentUser, setCurrentUser] = useState(initialUser);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  // Switch HOD Authentication Modal State
  const [pendingTargetDept, setPendingTargetDept] = useState(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState('');
  const [isVerifyingSwitch, setIsVerifyingSwitch] = useState(false);
  const [showSwitchPassword, setShowSwitchPassword] = useState(false);

  const handleInitiateSwitchDepartment = (targetCode) => {
    if (!targetCode || targetCode.toUpperCase() === (currentDeptCode || '').toUpperCase()) return;
    const targetDept = departments.find(d => (d.code || '').toUpperCase() === targetCode.toUpperCase()) || {
      code: targetCode,
      name: `${targetCode} Department`,
      hod_name: 'Department Head'
    };

    // If active as Central Library Admin, bypass password check and switch immediately
    if (currentUser?.isAdminImpersonation || initialUser?.isAdminImpersonation || currentUser?.role === 'admin') {
      sounds.playSuccessChime();
      const updatedUser = {
        role: 'hod',
        isAdminImpersonation: true,
        adminOriginUser: currentUser?.adminOriginUser || initialUser?.adminOriginUser,
        name: targetDept.hod_name || targetDept.hod || 'Head of Department',
        email: targetDept.hod_email || '',
        department_code: (targetDept.code || '').toUpperCase(),
        department_name: targetDept.name,
        department_id: targetDept.id || `DEP-${(targetDept.code || '').toUpperCase()}`,
        matric: `HOD/${(targetDept.code || '').toUpperCase()}/001`,
        colorTheme: targetDept.color || 'Institutional'
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('fcc_hod_session', JSON.stringify(updatedUser));
      } catch (err) {}
      setSuccessMsg(`Switched to ${targetDept.name} (${targetDept.code}) with Admin Authority.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }

    setPendingTargetDept(targetDept);
    setSwitchPassword('');
    setSwitchPasswordError('');
    setShowSwitchPassword(false);
    sounds.playClick();
  };

  const handleCancelSwitchDepartment = () => {
    setPendingTargetDept(null);
    setSwitchPassword('');
    setSwitchPasswordError('');
    sounds.playClick();
  };

  const handleConfirmSwitchDepartment = async (e) => {
    if (e) e.preventDefault();
    if (!pendingTargetDept) return;

    // If active as Central Library Admin, authorize without credentials
    if (currentUser?.isAdminImpersonation || initialUser?.isAdminImpersonation || currentUser?.role === 'admin') {
      sounds.playSuccessChime();
      const targetCode = (pendingTargetDept.code || '').toUpperCase();
      const updatedUser = {
        role: 'hod',
        isAdminImpersonation: true,
        adminOriginUser: currentUser?.adminOriginUser || initialUser?.adminOriginUser,
        name: pendingTargetDept.hod_name || pendingTargetDept.hod || 'Head of Department',
        email: pendingTargetDept.hod_email || '',
        department_code: targetCode,
        department_name: pendingTargetDept.name,
        department_id: pendingTargetDept.id || `DEP-${targetCode}`,
        matric: `HOD/${targetCode}/001`,
        colorTheme: pendingTargetDept.color || 'Institutional'
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('fcc_hod_session', JSON.stringify(updatedUser));
      } catch (err) {}
      setPendingTargetDept(null);
      setSwitchPassword('');
      setIsVerifyingSwitch(false);
      setSuccessMsg(`Switched to ${pendingTargetDept.name} (${targetCode}) as Central Admin.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      return;
    }

    const trimmedPass = switchPassword.trim();
    if (!trimmedPass) {
      setSwitchPasswordError('Please enter the HOD password to authorize access.');
      sounds.playErrorBuzz();
      return;
    }

    setIsVerifyingSwitch(true);
    setSwitchPasswordError('');

    const targetCode = (pendingTargetDept.code || '').toUpperCase();

    // 1. Try backend API authentication
    try {
      const res = await fetch('/api/hod/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `hod_${targetCode.toLowerCase()}`,
          department_code: targetCode,
          password: trimmedPass
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        const updatedUser = {
          role: 'hod',
          name: data.user.name || pendingTargetDept.hod_name || pendingTargetDept.hod,
          email: data.user.email || pendingTargetDept.hod_email,
          department_code: targetCode,
          department_name: data.user.department_name || pendingTargetDept.name,
          department_id: data.user.department_id || pendingTargetDept.id || `DEP-${targetCode}`,
          matric: data.user.matric || `HOD/${targetCode}/001`
        };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('fcc_hod_session', JSON.stringify(updatedUser));
        } catch (err) {}
        setPendingTargetDept(null);
        setSwitchPassword('');
        setIsVerifyingSwitch(false);
        setSuccessMsg(`Successfully authenticated as Head of Department (${targetCode})`);
        setTimeout(() => setSuccessMsg(''), 4000);
        return;
      } else if (res.status === 401 || res.status === 404) {
        sounds.playErrorBuzz();
        setSwitchPasswordError(data.message || `Incorrect password for ${pendingTargetDept.name} HOD.`);
        setIsVerifyingSwitch(false);
        return;
      }
    } catch (err) {
      console.warn('Backend verification offline, checking local credentials:', err);
    }

    // 2. Strict local fallback verification if offline (only if department has an assigned PIN in record)
    const deptPin = pendingTargetDept?.hod_pin || pendingTargetDept?.pin;
    const isPinMatch = deptPin && String(deptPin).trim() === trimmedPass;

    if (isPinMatch) {
      sounds.playSuccessChime();
      const updatedUser = {
        role: 'hod',
        name: pendingTargetDept.hod_name || pendingTargetDept.hod || 'Head of Department',
        email: pendingTargetDept.hod_email || '',
        department_code: targetCode,
        department_name: pendingTargetDept.name,
        department_id: pendingTargetDept.id || `DEP-${targetCode}`,
        matric: `HOD/${targetCode}/001`,
        colorTheme: pendingTargetDept.color || 'Institutional',
        accentHex: pendingTargetDept.color_hex || '#059669'
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('fcc_hod_session', JSON.stringify(updatedUser));
      } catch (err) {}
      setPendingTargetDept(null);
      setSwitchPassword('');
      setIsVerifyingSwitch(false);
      setSuccessMsg(`Authorized: Switched to ${targetCode} HOD Console`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      sounds.playErrorBuzz();
      setSwitchPasswordError(`Unauthorized: Incorrect password for ${pendingTargetDept.name} HOD.`);
      setIsVerifyingSwitch(false);
    }
  };

  // Check whether the active logged-in user is a Departmental Staff member under the HOD
  const isStaffUser = Boolean(currentUser?.role === 'hod_staff' || initialUser?.role === 'hod_staff');

  // Active department derived from currentUser or initialUser (zero hardcoded CSC fallback)
  const currentDeptCode = currentUser?.department_code || initialUser?.department_code || '';
  const currentDept = useMemo(() => {
    const code = (currentDeptCode || '').toUpperCase();
    if (code) {
      const found = departments.find(d => (d.code || '').toUpperCase() === code);
      if (found) return found;

      // If not yet present in departments array, synthesize immediately from user session
      if (currentUser?.department_code && currentUser.department_code.toUpperCase() === code) {
        return {
          id: currentUser.department_id || `DEP-${code}`,
          code: code,
          name: currentUser.department_name || `${code} Department`,
          faculty: currentUser.faculty || 'School of Academic Studies',
          hod: isStaffUser ? (currentUser.hod_name || 'Head of Department') : (currentUser.name || 'Head of Department'),
          hod_name: isStaffUser ? (currentUser.hod_name || 'Head of Department') : (currentUser.name || 'Head of Department'),
          hodEmail: isStaffUser ? (currentUser.hod_email || '') : (currentUser.email || ''),
          hod_email: isStaffUser ? (currentUser.hod_email || '') : (currentUser.email || ''),
          hodPhone: currentUser.phone || '',
          studentCount: currentUser.student_count || 0,
          student_count: currentUser.student_count || 0,
          uploads_count: 0
        };
      }
    }
    return departments[0] || {
      id: 'DEP-GEN',
      code: 'GEN',
      name: 'Academic Department',
      faculty: 'School of Academic Studies',
      hod: 'Head of Department',
      hod_name: 'Head of Department',
      hodEmail: '',
      hod_email: '',
      hodPhone: '',
      studentCount: 0,
      student_count: 0,
      uploads_count: 0
    };
  }, [departments, currentDeptCode, currentUser, isStaffUser]);

  const theme = useMemo(() => {
    const code = (currentDeptCode || currentDept?.code || '').toUpperCase();
    const name = currentDept?.name || '';
    const color = currentDept?.color || '';
    return getDynamicDeptTheme(code, name, color);
  }, [currentDeptCode, currentDept]);

  const uploadStudioUser = useMemo(() => ({
    ...currentUser,
    department_id: currentDept?.id,
    department_name: currentDept?.name,
    department_code: currentDept?.code,
    name: isStaffUser ? `${currentUser.name} (${currentUser.staff_code || 'Staff'})` : (currentDept?.hod_name || currentDept?.hod),
    role: isStaffUser ? 'hod_staff' : 'hod',
    staff_id: currentUser?.id || currentUser?.staff_id,
    staff_code: currentUser?.staff_code,
    theme
  }), [currentUser, currentDept, theme, isStaffUser]);

  // Master Developer Configuration & Institutional Parameters
  const [devConfig, setDevConfig] = useState(() => developerConfigService.getConfig());
  const [instConfig, setInstConfig] = useState(() => institutionalConfigService.getInstitution());
  const [instPerms, setInstPerms] = useState(() => institutionalConfigService.getPermissions());
  const [instSaving, setInstSaving] = useState(false);
  const [instMsg, setInstMsg] = useState('');

  useEffect(() => {
    const handleConfigSync = () => {
      setDevConfig(developerConfigService.getConfig());
    };
    window.addEventListener('fcc-config-updated', handleConfigSync);

    const handleInstSync = (e) => {
      if (e.detail?.institution) setInstConfig(e.detail.institution);
      if (e.detail?.permissions) setInstPerms(e.detail.permissions);
    };
    window.addEventListener('fcc-institution-updated', handleInstSync);
    institutionalConfigService.fetchFromApi().then(res => {
      if (res?.institution) setInstConfig(res.institution);
      if (res?.permissions) setInstPerms(res.permissions);
    });
    return () => {
      window.removeEventListener('fcc-config-updated', handleConfigSync);
      window.removeEventListener('fcc-institution-updated', handleInstSync);
    };
  }, []);

  const isDeptAllowedInst = useMemo(() => {
    const code = (currentDept?.code || '').toUpperCase();
    const allowed = (instPerms?.allowed_hod_depts || []).map(d => (d || '').toUpperCase());
    return allowed.includes(code);
  }, [currentDept, instPerms]);

  const handleSaveHodInst = async (e) => {
    if (e) e.preventDefault();
    if (!isDeptAllowedInst) return;
    setInstSaving(true);
    setInstMsg('');
    sounds.playClick();
    try {
      const res = await institutionalConfigService.saveInstitution(
        instConfig,
        currentDept.hod_name || currentDept.hod || 'HOD',
        'hod',
        currentDept.code
      );
      if (res.success) {
        sounds.playSuccessChime();
        setInstMsg('Academic session & campus hours updated successfully and broadcast across the college!');
        setTimeout(() => setInstMsg(''), 5000);
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setInstMsg('Failed to update academic session.');
    } finally {
      setInstSaving(false);
    }
  };

  // Active Tab
  // 'overview' | 'courses' | 'upload' | 'submissions' | 'dissertations' | 'reserves' | 'scholars' | 'communication' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Database-backed states
  const [uploads, setUploads] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);

  const [courses, setCourses] = useState([]);
  const [hodUnassignedBooks, setHodUnassignedBooks] = useState([]);
  const [hodCourseStats, setHodCourseStats] = useState(null);
  const [hodCoursesSyncedAt, setHodCoursesSyncedAt] = useState(null);
  const [courseBooksOnly, setCourseBooksOnly] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const [dissertations, setDissertations] = useState([]);
  const [isLoadingDissertations, setIsLoadingDissertations] = useState(false);

  const [reservesList, setReservesList] = useState([]);
  const [isLoadingReserves, setIsLoadingReserves] = useState(false);

  const [scholarsList, setScholarsList] = useState([]);
  const [isLoadingScholars, setIsLoadingScholars] = useState(false);

  // Departmental Staff Portal & RBAC Access Matrix State
  const [staffList, setStaffList] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const [catalogBooks, setCatalogBooks] = useState([]);
  const [isLoadingCatalogBooks, setIsLoadingCatalogBooks] = useState(false);
  const [activeReaderBook, setActiveReaderBook] = useState(null);
  const [duplicateModalInfo, setDuplicateModalInfo] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const bypassQuickUploadDupRef = useRef(false);
  const [selectedCatalogBookDossier, setSelectedCatalogBookDossier] = useState(null);
  const [deptBookSearchQuery, setDeptBookSearchQuery] = useState('');
  const [hodBooksScope, setHodBooksScope] = useState('dept'); // 'dept' | 'all'
  const [hodBooksStatusFilter, setHodBooksStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending'
  const [hodBooksLevelFilter, setHodBooksLevelFilter] = useState('all'); // 'all' | 'ND I' | 'ND II' | 'HND I' | 'HND II'
  const [hodBooksViewMode, setHodBooksViewMode] = useState('grid'); // 'grid' | 'table'

  const [successMsg, setSuccessMsg] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [submissionCategoryFilter, setSubmissionCategoryFilter] = useState('All');
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [editSubmissionForm, setEditSubmissionForm] = useState({
    title: '',
    author: '',
    course_code: '',
    target_level: 'HND II',
    semester: 'First Semester',
    resource_type: 'Book',
    access_scope: 'Public Institution-Wide',
    abstract: '',
    resubmitAsPending: false
  });
  const [isSavingEditSubmission, setIsSavingEditSubmission] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState(new Set());
  const [isBulkDeletingSubmissions, setIsBulkDeletingSubmissions] = useState(false);
  const [submissionNotification, setSubmissionNotification] = useState(null);

  // Modals & Forms
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({
    code: '',
    title: '',
    level: 'HND II',
    semester: 'First Semester',
    lecturer: '',
    syllabus: ''
  });
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseLevelFilter, setCourseLevelFilter] = useState('All');
  const [courseSemesterFilter, setCourseSemesterFilter] = useState('All');
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCourseForm, setEditCourseForm] = useState({
    code: '',
    title: '',
    level: 'HND II',
    semester: 'First Semester',
    lecturer: '',
    syllabus: '',
    enrolled_students: 65
  });
  const [isSavingEditCourse, setIsSavingEditCourse] = useState(false);
  const [deletingCourseCode, setDeletingCourseCode] = useState(null);
  const [selectedCourseSyllabusDossier, setSelectedCourseSyllabusDossier] = useState(null);
  const [courseNotification, setCourseNotification] = useState(null);

  const [showAddReserveModal, setShowAddReserveModal] = useState(false);
  const [newReserveForm, setNewReserveForm] = useState({
    title: '',
    author: '',
    shelf: 'Reserve Desk Bay 1',
    copies: 3,
    reservedFor: '',
    duration: '2 Hours In-Library Reading Only'
  });
  const [reserveSearchTerm, setReserveSearchTerm] = useState('');
  const [reserveShelfFilter, setReserveShelfFilter] = useState('All');
  const [reserveDurationFilter, setReserveDurationFilter] = useState('All');
  const [editingReserve, setEditingReserve] = useState(null);
  const [editReserveForm, setEditReserveForm] = useState({
    id: null,
    title: '',
    author: '',
    reserved_for: '',
    shelf: 'Reserve Desk Bay 1',
    duration: '2 Hours In-Library Reading Only',
    copies: 3,
    status: 'active'
  });
  const [isSavingEditReserve, setIsSavingEditReserve] = useState(false);
  const [deletingReserveId, setDeletingReserveId] = useState(null);
  const [reserveNotification, setReserveNotification] = useState(null);


  // Scholars search & filter & modals
  const [scholarSearchTerm, setScholarSearchTerm] = useState('');
  const [scholarLevelFilter, setScholarLevelFilter] = useState('All');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingScholar, setEditingScholar] = useState(null);

  // Dissertations modal & review workflow
  const [selectedDissertationForModal, setSelectedDissertationForModal] = useState(null);
  const [dissertationStatusFilter, setDissertationStatusFilter] = useState('All');
  const [dissertationSearch, setDissertationSearch] = useState('');
  const [revisionTarget, setRevisionTarget] = useState(null); // { diss, mode: 'Revision Requested' | 'Rejected' }
  const [revisionNoteDraft, setRevisionNoteDraft] = useState('');
  const [dissertationActionId, setDissertationActionId] = useState(null);
  const [dissertationError, setDissertationError] = useState('');

  // Settings profile form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLocked, setProfileLocked] = useState(false);
  const [profileLockedUntil, setProfileLockedUntil] = useState(null);
  const [profileDaysRemaining, setProfileDaysRemaining] = useState(0);
  const [profileHoursRemaining, setProfileHoursRemaining] = useState(0);
  const [profileMinutesRemaining, setProfileMinutesRemaining] = useState(0);
  const [showHodPass, setShowHodPass] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [resetLinkSending, setResetLinkSending] = useState(false);
  const [resetLinkSentInfo, setResetLinkSentInfo] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [copiedResetLink, setCopiedResetLink] = useState(false);
  const fileInputRef = useRef(null);
  const [profileForm, setProfileForm] = useState({
    hod: '',
    hodEmail: '',
    hodPhone: '',
    office: 'Block B, Room 14 (Faculty Annex)',
    consultationHours: 'Tuesdays & Thursdays, 10:00 AM - 2:00 PM',
    password: ''
  });

  // Quick Book/PDF Upload State (Directly on Overview Page)
  const [quickUploadForm, setQuickUploadForm] = useState({
    title: '',
    author: '',
    course_code: 'CEM 411',
    target_level: 'HND II',
    semester: 'First Semester',
    resource_type: 'Lecture Handout / E-Book',
    access_scope: 'Public Institution-Wide',
    file_name: '',
    file_data_url: '',
    cover_image: '',
    cover_name: '',
    abstract: ''
  });
  const [quickUploadCustomLevel, setQuickUploadCustomLevel] = useState('');
  const [overviewUploadMode, setOverviewUploadMode] = useState('bulk');
  const [editingQuickUploadId, setEditingQuickUploadId] = useState('');
  const [courseCustomLevel, setCourseCustomLevel] = useState('');
  const [isSubmittingQuickUpload, setIsSubmittingQuickUpload] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const quickFileInputRef = useRef(null);
  const quickCoverInputRef = useRef(null);

  // Intelligent PDF Compression States
  const [quickUploadRawFile, setQuickUploadRawFile] = useState(null);
  const [quickUploadIsCompressing, setQuickUploadIsCompressing] = useState(false);
  const [quickUploadProgress, setQuickUploadProgress] = useState({ percent: 0, message: '' });
  const [quickUploadCompressionResult, setQuickUploadCompressionResult] = useState(null);
  const [quickUploadPreset, setQuickUploadPreset] = useState('recommended');
  const [quickUploadPreviewPdf, setQuickUploadPreviewPdf] = useState('');
  const [isDissertationUploadModalOpen, setIsDissertationUploadModalOpen] = useState(false);

  // 1. Fetch Departments from Backend Database
  const fetchDepartments = async () => {
    try {
      const endpoint = `${getApiBase()}/departments`;
      let res;
      try {
        res = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
      } catch (netErr) {
        if (isLocalhostHost) {
          try {
            res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/departments`, { headers: { 'Accept': 'application/json' } });
          } catch (e) {}
        }
      }
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          try {
            departmentService._cached = data;
            localStorage.setItem('fcc_departments_v48_gov', JSON.stringify(data));
          } catch (storageErr) {}
          return;
        }
      }
    } catch (e) {
      console.warn('Departments fetch fallback:', e);
    }
    const cached = departmentService.getDepartments();
    if (cached && cached.length > 0) {
      setDepartments(cached);
    }
  };

  // 2. Fetch Courses from Backend Database
  //    Primary source: GET /api/hod/courses → courses enriched ONLY with HOD-uploaded books.
  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const deptName = currentDept?.name || '';
      const deptCode = currentDept?.code || '';
      const deptId = currentDept?.id || '';

      const hodQs = `department_code=${encodeURIComponent(deptCode)}&department_id=${encodeURIComponent(deptId)}&department=${encodeURIComponent(deptName)}`;
      try {
        let hodRes = await fetch(`/api/hod/courses?${hodQs}`).catch(() => null);
        if ((!hodRes || !hodRes.ok) && isLocalhostHost) {
          hodRes = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/courses?${hodQs}`).catch(() => null);
        }
        if (hodRes && hodRes.ok) {
          const payload = await hodRes.json();
          if (payload && Array.isArray(payload.courses)) {
            setCourses(payload.courses);
            setHodUnassignedBooks(Array.isArray(payload.unassigned_books) ? payload.unassigned_books : []);
            setHodCourseStats(payload.stats || null);
            setHodCoursesSyncedAt(payload.generated_at || new Date().toISOString());
            return;
          }
        }
      } catch (hodErr) {
        console.warn('HOD courses endpoint unavailable, falling back to /api/courses:', hodErr);
      }

      const endpoint = `${getApiBase()}/courses?department=${encodeURIComponent(deptName)}&department_code=${encodeURIComponent(deptCode)}`;
      let res;
      try {
        res = await fetch(endpoint);
      } catch (netErr) {
        if (isLocalhostHost) {
          try {
            res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/courses?department=${encodeURIComponent(deptName)}&department_code=${encodeURIComponent(deptCode)}`);
          } catch (e) {}
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          return;
        }
      }

      // Fallback: fetch all courses from API
      const allEndpoint = `${getApiBase()}/courses`;
      let allRes;
      try {
        allRes = await fetch(allEndpoint);
      } catch (err) {
        if (isLocalhostHost) {
          try {
            allRes = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/courses`);
          } catch (e) {}
        }
      }
      if (allRes && allRes.ok) {
        const allData = await allRes.json();
        if (Array.isArray(allData)) {
          const deptMatch = allData.filter(c => {
            const cDept = (c.department || '').toLowerCase();
            const cCode = (c.code || '').toUpperCase();
            return (deptCode && cCode.startsWith(deptCode)) || (deptName && cDept.includes(deptName.toLowerCase()));
          });
          setCourses(deptMatch.length > 0 ? deptMatch : allData);
          return;
        }
      }
      setCourses([]);
    } catch (e) {
      console.warn('Courses fetch error:', e);
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // 3. Fetch Theses / Dissertations from Backend Database (strictly scoped to this department)
  const fetchDissertations = async () => {
    setIsLoadingDissertations(true);
    setDissertationError('');
    try {
      const params = new URLSearchParams();
      if (currentDept?.code) params.set('department_code', currentDept.code);
      if (currentDept?.name) params.set('department', currentDept.name);
      const res = await fetch(`/api/theses?${params.toString()}`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setDissertations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Theses fetch error:', e);
      setDissertationError('Could not load dissertations from the database. Check that the backend server is running.');
      setDissertations([]);
    } finally {
      setIsLoadingDissertations(false);
    }
  };

  // 4. Fetch Course Reserves from Backend Database
  const fetchReserves = async () => {
    setIsLoadingReserves(true);
    try {
      const deptCode = currentDept?.code || '';
      const deptName = currentDept?.name || '';
      const endpoint = `${getApiBase()}/course-reserves?department_code=${encodeURIComponent(deptCode)}&department=${encodeURIComponent(deptName)}`;
      let res;
      try {
        res = await fetch(endpoint);
      } catch (netErr) {
        if (isLocalhostHost) {
          try {
            res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/course-reserves?department_code=${encodeURIComponent(deptCode)}&department=${encodeURIComponent(deptName)}`);
          } catch (e) {}
        }
      }
      if (res && res.ok) {
        const data = await res.json();
        setReservesList(Array.isArray(data) ? data : []);
      } else {
        setReservesList([]);
      }
    } catch (e) {
      console.warn('Reserves fetch error:', e);
      setReservesList([]);
    } finally {
      setIsLoadingReserves(false);
    }
  };


  // 5. Fetch Scholars (Patrons) from Backend Database (Strictly for current HOD department alone)
  const fetchScholars = async () => {
    setIsLoadingScholars(true);
    try {
      const deptName = currentDept?.name || '';
      const deptCode = currentDept?.code || '';
      const res = await fetch(`/api/patrons?department=${encodeURIComponent(deptName)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Strictly filter so scholars belong only to this HOD's department
          const strictlyDept = data.filter(s => {
            const d = (s.department || '').toLowerCase();
            const curr = deptName.toLowerCase();
            const code = deptCode.toLowerCase();
            return d.includes(curr) || curr.includes(d) || (s.matric || '').toLowerCase().includes(`/${code}/`);
          });
          setScholarsList(strictlyDept);
          return;
        }
      }
      setScholarsList([]);
    } catch (e) {
      console.warn('Scholars fetch error:', e);
      setScholarsList([]);
    } finally {
      setIsLoadingScholars(false);
    }
  };

  // 5b. Fetch Department Staff & Access Matrix from Backend Database
  const fetchStaffList = async (targetDeptCode = null) => {
    setIsLoadingStaff(true);
    try {
      const deptCode = targetDeptCode || currentDept?.code || currentUser?.department_code || 'CEM';
      const endpoint = `${getApiBase()}/hod/staff?department_code=${encodeURIComponent(deptCode)}`;
      let res;
      try {
        res = await fetch(endpoint);
      } catch (netErr) {
        if (isLocalhostHost) {
          try {
            res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/staff?department_code=${encodeURIComponent(deptCode)}`);
          } catch (e) {}
        }
      }
      if (res && res.ok) {
        const data = await res.json();
        if ((data.success || data.status === 'success') && Array.isArray(data.staff)) {
          setStaffList(data.staff);
          setSelectedStaffId(prev => {
            if (isStaffUser && currentUser?.id) {
              const myRecord = data.staff.find(s => s.id === currentUser.id || s.staff_code === currentUser.staff_code || s.username === currentUser.username);
              if (myRecord) return myRecord.id;
              return currentUser.id;
            }
            if (prev && data.staff.some(s => s.id === prev)) return prev;
            return data.staff.length > 0 ? data.staff[0].id : null;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load departmental staff:', e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleCreateStaff = async (staffPayload) => {
    try {
      const endpoint = `${getApiBase()}/hod/staff`;
      const deptCode = staffPayload.department_code || currentDept?.code || currentUser?.department_code || 'CEM';
      const deptName = staffPayload.department_name || currentDept?.name || currentUser?.department_name || `${deptCode} Department`;
      const fullPayload = {
        ...staffPayload,
        department_code: deptCode,
        department_name: deptName
      };
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
          });
        }
      }
      if (res) {
        const data = await res.json();
        if (data.success || data.status === 'success') {
          sounds.playSuccessChime();
          if (data.staff) {
            setStaffList(prev => {
              const filtered = (prev || []).filter(s => s.id !== data.staff.id);
              return [data.staff, ...filtered];
            });
            if (data.staff.id) setSelectedStaffId(data.staff.id);
          }
          await fetchStaffList(fullPayload.department_code);
          window.dispatchEvent(new CustomEvent('fcc-staff-updated', { detail: data.staff }));
          return { success: true, staff: data.staff, plain_password: data.plain_password || staffPayload.password };
        } else {
          sounds.playErrorBuzz();
          return { success: false, message: data.message || 'Staff workspace creation failed' };
        }
      }
      return { success: false, message: 'Server communication failed' };
    } catch (err) {
      sounds.playErrorBuzz();
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const handleUpdateStaff = async (id, staffPayload) => {
    try {
      const endpoint = `${getApiBase()}/hod/staff/${id}`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffPayload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/staff/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffPayload)
          });
        }
      }
      if (res) {
        const data = await res.json();
        if (data.success || data.status === 'success') {
          sounds.playSuccessChime();
          await fetchStaffList();
          window.dispatchEvent(new CustomEvent('fcc-staff-updated', { detail: data.staff }));
          return { success: true, staff: data.staff };
        } else {
          sounds.playErrorBuzz();
          return { success: false, message: data.message || 'Staff update failed' };
        }
      }
      return { success: false, message: 'Server communication failed' };
    } catch (err) {
      sounds.playErrorBuzz();
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      const endpoint = `${getApiBase()}/hod/staff/${id}`;
      let res;
      try {
        res = await fetch(endpoint, { method: 'DELETE' });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/staff/${id}`, { method: 'DELETE' });
        }
      }
      if (res) {
        const data = await res.json();
        if (data.success || data.status === 'success') {
          sounds.playSuccessChime();
          await fetchStaffList();
          window.dispatchEvent(new CustomEvent('fcc-staff-updated', { detail: { id } }));
          return { success: true };
        } else {
          sounds.playErrorBuzz();
          return { success: false, message: data.message || 'Staff deletion failed' };
        }
      }
      return { success: false, message: 'Server communication failed' };
    } catch (err) {
      sounds.playErrorBuzz();
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const handleBulkUpdateStaff = async (bulkPayload) => {
    try {
      const endpoint = `${getApiBase()}/hod/staff/bulk-permissions`;
      const fullPayload = {
        department_code: currentDept?.code || currentUser?.department_code || 'CEM',
        ...bulkPayload
      };
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/hod/staff/bulk-permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
          });
        }
      }
      if (res) {
        const data = await res.json();
        if (data.success || data.status === 'success') {
          sounds.playSuccessChime();
          await fetchStaffList();
          window.dispatchEvent(new CustomEvent('fcc-staff-updated', { detail: data.staff }));
          return { success: true, count: data.count };
        } else {
          sounds.playErrorBuzz();
          return { success: false, message: data.message || 'Bulk update failed' };
        }
      }
      return { success: false, message: 'Server communication failed' };
    } catch (err) {
      sounds.playErrorBuzz();
      return { success: false, message: err.message || 'Network error' };
    }
  };

  // 6. Fetch Department Uploads from Backend Database
  const fetchDepartmentUploads = async () => {
    setIsLoadingUploads(true);
    try {
      const deptId = currentDept?.id || `DEP-${currentDept?.code || 'CEM'}`;
      const deptCode = currentDept?.code || 'CEM';
      const endpoint = `${getApiBase()}/department-uploads?department_id=${encodeURIComponent(deptId)}&department_code=${encodeURIComponent(deptCode)}`;
      let res;
      try {
        res = await fetch(endpoint);
      } catch (netErr) {
        if (isLocalhostHost) {
          try {
            res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/department-uploads?department_id=${encodeURIComponent(deptId)}&department_code=${encodeURIComponent(deptCode)}`);
          } catch (e) {}
        }
      }

      let serverUploads = [];
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          serverUploads = data;
        }
      }

      // Auto-sync any local-only pending uploads into the database
      let localPending = [];
      try {
        localPending = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
      } catch (e) {}

      if (Array.isArray(localPending) && localPending.length > 0) {
        const existingIds = new Set(serverUploads.map(d => d.id));
        const unsynced = localPending.filter(lp => lp && lp.id && !existingIds.has(lp.id) && (lp.status === 'pending' || !lp.status));

        if (unsynced.length > 0) {
          for (const item of unsynced) {
            try {
              const syncPayload = {
                title: item.title,
                author: item.author,
                department_id: item.department_id || deptId,
                department_name: item.department_name || currentDept?.name,
                uploaded_by_hod_id: item.uploaded_by_hod_id,
                hod_name: item.hod_name,
                course_code: item.course_code,
                target_level: item.target_level,
                semester: item.semester,
                resource_type: item.resource_type || 'Book',
                access_scope: item.access_scope || 'Public Institution-Wide',
                file_name: item.file_name,
                file_data_url: item.file_data_url || '',
                cover_image: item.cover_image || '',
                review_notes: item.review_notes
              };

              const syncRes = await fetch(`${getApiBase()}/department-uploads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(syncPayload)
              });

              if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData.success && syncData.upload) {
                  serverUploads.unshift(syncData.upload);
                  // Remove old local-only ID and replace with server record
                  localPending = localPending.filter(p => p.id !== item.id);
                  localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(localPending));
                }
              }
            } catch (syncErr) {
              console.warn('Auto-sync submission to database error:', syncErr);
            }
          }
        }
      }

      setUploads(serverUploads);
    } catch (e) {
      console.warn('Backend uploads fetch error:', e);
      try {
        const local = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        setUploads(local);
      } catch (err) {
        setUploads([]);
      }
    } finally {
      setIsLoadingUploads(false);
    }
  };

  // Attach / Change Front Cover Artwork for an Ingestion Item
  const handleAttachCoverToUpload = async (uploadId, file) => {
    if (!uploadId || !file) return;
    try {
      sounds.playClick();
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, cover_image: dataUrl } : u));
        
        try {
          const endpoint = `${getApiBase()}/department-uploads/${uploadId}/update`;
          let res;
          try {
            res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cover_image: dataUrl })
            });
          } catch (netErr) {
            if (isLocalhostHost) {
              const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/department-uploads/${uploadId}/update`;
              res = await fetch(directApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cover_image: dataUrl })
              });
            }
          }
          if (res && res.ok) {
            sounds.playSuccessChime();
            setSubmissionNotification({ type: 'success', message: 'Front cover artwork updated in database!' });
            setTimeout(() => setSubmissionNotification(null), 4000);
          }
        } catch (err) {
          console.warn('Cover update server error:', err);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      sounds.playErrorBuzz();
    }
  };

  // Withdraw / Delete a Department Ingestion Item
  const handleDeleteSubmission = async (uploadId, title) => {
    if (!uploadId) return;
    const confirmDelete = window.confirm(`Permanently withdraw and delete "${title || 'this submission'}" from the ingestion pipeline database?`);
    if (!confirmDelete) return;

    sounds.playClick();
    setDeletingSubmissionId(uploadId);
    try {
      const endpoint = `${getApiBase()}/department-uploads/${uploadId}`;
      let res;
      try {
        res = await fetch(endpoint, { method: 'DELETE' });
      } catch (netErr) {
        if (isLocalhostHost) {
          const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/department-uploads/${uploadId}`;
          res = await fetch(directApi, { method: 'DELETE' });
        }
      }

      const targetUpload = uploads.find(u => u.id === uploadId || u.book_id === uploadId);
      const targetBookId = targetUpload?.book_id;
      const targetTitle = targetUpload?.title || title;

      try {
        const local = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(local.filter(u => u.id !== uploadId && u.book_id !== uploadId && (!targetTitle || u.title !== targetTitle))));
      } catch (e) {}

      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const filteredCatalog = currentCatalog.filter(b =>
          b.id !== uploadId &&
          b.id !== targetBookId &&
          b.upload_id !== uploadId &&
          b.book_id !== uploadId &&
          (!targetTitle || b.title !== targetTitle)
        );
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(filteredCatalog));
        localStorage.setItem('fcc_db_catalog', JSON.stringify(filteredCatalog));
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: filteredCatalog }));
      } catch (e) {}

      setUploads(prev => prev.filter(u => u.id !== uploadId && u.book_id !== uploadId && (!targetTitle || u.title !== targetTitle)));
      setCatalogBooks(prev => prev.filter(b => b.id !== uploadId && b.id !== targetBookId && b.upload_id !== uploadId && b.book_id !== uploadId && (!targetTitle || b.title !== targetTitle)));
      fetchCourses();
      sounds.playSuccessChime();

      publishRealtimeEvent({
        action: 'DELETE',
        entity: 'upload',
        id: uploadId,
        ids: [uploadId, targetBookId].filter(Boolean),
        title: targetTitle
      });

      setSubmissionNotification({ type: 'success', message: `Submission "${title}" successfully removed from database.` });
      setTimeout(() => setSubmissionNotification(null), 4000);
    } catch (err) {
      sounds.playErrorBuzz();
      setSubmissionNotification({ type: 'error', message: 'Error deleting submission from backend database.' });
      setTimeout(() => setSubmissionNotification(null), 4000);
    } finally {
      setDeletingSubmissionId(null);
    }
  };

  // Toggle selection for a submission
  const toggleSelectSubmission = (id) => {
    setSelectedSubmissionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all visible filtered submissions
  const toggleSelectAllSubmissions = () => {
    if (selectedSubmissionIds.size === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedSubmissionIds(new Set());
    } else {
      setSelectedSubmissionIds(new Set(filteredSubmissions.map(u => u.id)));
    }
  };

  // Bulk Delete Submissions from Database
  const handleBulkDeleteSubmissions = async () => {
    const count = selectedSubmissionIds.size;
    if (count === 0) return;

    const confirmDelete = window.confirm(`Permanently withdraw and delete ${count} selected submission(s) from the database?`);
    if (!confirmDelete) return;

    sounds.playClick();
    setIsBulkDeletingSubmissions(true);
    const idsArray = Array.from(selectedSubmissionIds);

    try {
      const endpoint = `${getApiBase()}/department-uploads/bulk-delete`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: idsArray, user_name: currentDept?.hod_name || currentDept?.name || 'HOD' })
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/department-uploads/bulk-delete`;
          res = await fetch(directApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsArray, user_name: currentDept?.hod_name || currentDept?.name || 'HOD' })
          });
        }
      }

      const idSet = new Set(idsArray);
      const deletedBookIdSet = new Set(
        uploads.filter(u => idSet.has(u.id) || idSet.has(u.book_id)).map(u => u.book_id).filter(Boolean)
      );
      const deletedTitleSet = new Set(
        uploads.filter(u => idSet.has(u.id) || idSet.has(u.book_id)).map(u => u.title).filter(Boolean)
      );

      setUploads(prev => prev.filter(u => !idSet.has(u.id) && !idSet.has(u.book_id) && !deletedTitleSet.has(u.title)));
      setCatalogBooks(prev => prev.filter(b => !idSet.has(b.id) && !idSet.has(b.upload_id) && !deletedBookIdSet.has(b.id) && !deletedTitleSet.has(b.title)));

      try {
        const local = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(local.filter(u => !idSet.has(u.id) && !idSet.has(u.book_id) && !deletedTitleSet.has(u.title))));
      } catch (e) {}

      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const filteredCatalog = currentCatalog.filter(b =>
          !idSet.has(b.id) &&
          !deletedBookIdSet.has(b.id) &&
          !deletedTitleSet.has(b.title)
        );
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(filteredCatalog));
        localStorage.setItem('fcc_db_catalog', JSON.stringify(filteredCatalog));
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: filteredCatalog }));
      } catch (e) {}

      setSelectedSubmissionIds(new Set());
      sounds.playSuccessChime();

      publishRealtimeEvent({
        action: 'DELETE',
        entity: 'upload',
        ids: idsArray,
        title: `${idsArray.length} submissions deleted in bulk`
      });

      setSubmissionNotification({
        type: 'success',
        message: `✓ Successfully deleted ${count} submission(s) from the database.`
      });
      setTimeout(() => setSubmissionNotification(null), 4000);
    } catch (err) {
      sounds.playErrorBuzz();
      setSubmissionNotification({
        type: 'error',
        message: 'Error deleting selected submissions from database.'
      });
      setTimeout(() => setSubmissionNotification(null), 4000);
    } finally {
      setIsBulkDeletingSubmissions(false);
    }
  };

  // Open Edit Modal for an Ingestion Item
  const handleOpenEditSubmission = (up) => {
    sounds.playClick();
    let extra = {};
    if (typeof up.review_notes === 'string' && up.review_notes.startsWith('{')) {
      try { extra = JSON.parse(up.review_notes); } catch (e) {}
    }
    setEditingSubmission(up);
    setEditSubmissionForm({
      title: up.title || '',
      author: up.author || '',
      course_code: up.course_code || '',
      target_level: up.target_level || 'HND II',
      semester: up.semester || 'First Semester',
      resource_type: up.resource_type || 'Book',
      access_scope: up.access_scope || 'Public Institution-Wide',
      abstract: extra.abstract || up.abstract || '',
      resubmitAsPending: up.status === 'rejected' || up.status === 'declined'
    });
  };

  // Save Edit Changes to Backend Database
  const handleSaveEditSubmission = async (e) => {
    if (e) e.preventDefault();
    if (!editingSubmission) return;

    setIsSavingEditSubmission(true);
    sounds.playClick();

    try {
      const payload = {
        title: editSubmissionForm.title.trim(),
        author: editSubmissionForm.author.trim(),
        course_code: editSubmissionForm.course_code.trim(),
        target_level: editSubmissionForm.target_level,
        semester: editSubmissionForm.semester,
        resource_type: editSubmissionForm.resource_type,
        access_scope: editSubmissionForm.access_scope,
        abstract: editSubmissionForm.abstract.trim(),
        ...(editSubmissionForm.resubmitAsPending ? { status: 'pending' } : {})
      };

      const endpoint = `${getApiBase()}/department-uploads/${editingSubmission.id}/update`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/department-uploads/${editingSubmission.id}/update`;
          res = await fetch(directApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        setUploads(prev => prev.map(u => u.id === editingSubmission.id ? { ...u, ...payload, ...(editSubmissionForm.resubmitAsPending ? { status: 'pending' } : {}) } : u));
        setSubmissionNotification({
          type: 'success',
          message: editSubmissionForm.resubmitAsPending
            ? 'Resource updated & resubmitted into Pending Review queue!'
            : 'Submission details updated successfully in database!'
        });
        setEditingSubmission(null);
        setTimeout(() => setSubmissionNotification(null), 4000);
        fetchDepartmentUploads();
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setSubmissionNotification({ type: 'error', message: 'Failed to update submission in database.' });
      setTimeout(() => setSubmissionNotification(null), 4000);
    } finally {
      setIsSavingEditSubmission(false);
    }
  };

  // 7. Match books to this HOD's department
  const isBookInDepartment = (book, dept) => {
    if (!book || !dept) return false;
    const deptCode = (dept.code || '').trim().toUpperCase();
    const deptId = (dept.id || '').trim().toUpperCase();
    const deptName = (dept.name || '').trim().toLowerCase();

    const bDeptId = (book.department_id || '').trim().toUpperCase();
    const bDeptCode = (book.department_code || '').trim().toUpperCase();
    const bDeptName = (book.department || '').trim().toLowerCase();
    const bCall = (book.call_number || book.callNumber || '').toUpperCase();
    const bCourse = (book.course_code || book.courseCode || '').toUpperCase();

    if (bDeptId && (bDeptId === deptId || bDeptId === `DEP-${deptCode}`)) return true;
    if (bDeptCode && bDeptCode === deptCode) return true;
    if (deptCode && (bCall.includes(`-${deptCode}-`) || bCall.includes(`.${deptCode}.`) || bCall.includes(`/${deptCode}/`) || bCourse.startsWith(deptCode))) {
      return true;
    }
    if (deptName && bDeptName && (bDeptName.includes(deptName) || deptName.includes(bDeptName))) {
      return true;
    }
    if (deptCode && bDeptName.toUpperCase().includes(deptCode)) {
      return true;
    }
    return false;
  };

  // 8. Fetch Only HOD-Uploaded Curriculum Books from Central Database via API
  const fetchCatalogBooks = async (explicitScope) => {
    setIsLoadingCatalogBooks(true);
    try {
      const activeScope = explicitScope || hodBooksScope;
      const deptCode = (currentDept?.code || '').trim();
      const deptId = (currentDept?.id || '').trim();

      let url = '/api/hod/books';
      if (activeScope === 'dept' && (deptCode || deptId)) {
        url += `?department_code=${encodeURIComponent(deptCode)}&department_id=${encodeURIComponent(deptId)}`;
      }

      let res = await fetch(url);
      if (!res.ok && isLocalhostHost) {
        const directApi = `${window.location.protocol}//${window.location.hostname}:8000${url}`;
        res = await fetch(directApi);
      }

      if (res.ok) {
        const data = await res.json();
        const booksList = Array.isArray(data) ? data : [];
        setCatalogBooks(booksList);
      } else {
        setCatalogBooks([]);
      }
    } catch (e) {
      console.warn('Backend HOD books fetch error:', e);
      setCatalogBooks([]);
    } finally {
      setIsLoadingCatalogBooks(false);
    }
  };

  // Derived books for current HOD department or all HOD uploads
  const currentDeptCatalogBooks = useMemo(() => {
    return catalogBooks.filter(b => {
      if (hodBooksScope === 'all') return true;
      return isBookInDepartment(b, currentDept);
    }).filter(b => {
      if (hodBooksStatusFilter === 'approved') return b.status === 'approved' || b.is_published;
      if (hodBooksStatusFilter === 'pending') return b.status !== 'approved' && !b.is_published;
      return true;
    }).filter(b => {
      if (hodBooksLevelFilter === 'all') return true;
      const lvl = (b.target_level || b.targetLevel || '').toUpperCase();
      return lvl.includes(hodBooksLevelFilter.toUpperCase());
    });
  }, [catalogBooks, currentDept, hodBooksScope, hodBooksStatusFilter, hodBooksLevelFilter]);

  const filteredDeptCatalogBooks = useMemo(() => {
    if (!deptBookSearchQuery.trim()) return currentDeptCatalogBooks;
    const q = deptBookSearchQuery.trim().toLowerCase();
    return currentDeptCatalogBooks.filter(b => {
      const title = (b.title || '').toLowerCase();
      const author = (b.author || '').toLowerCase();
      const call = (b.call_number || b.callNumber || '').toLowerCase();
      const isbn = (b.isbn || '').toLowerCase();
      const crs = (b.course_code || b.courseCode || '').toLowerCase();
      const deptName = (b.department || '').toLowerCase();
      return title.includes(q) || author.includes(q) || call.includes(q) || isbn.includes(q) || crs.includes(q) || deptName.includes(q);
    });
  }, [currentDeptCatalogBooks, deptBookSearchQuery]);

  // Derived Submissions Counts & Filtered Pipeline Queue
  const submissionCounts = useMemo(() => {
    const all = uploads.length;
    const pending = uploads.filter(u => {
      const s = String(u.status || '').toLowerCase();
      return s === 'pending' || (s !== 'approved' && s !== 'rejected' && s !== 'declined');
    }).length;
    const approved = uploads.filter(u => String(u.status || '').toLowerCase() === 'approved').length;
    const rejected = uploads.filter(u => {
      const s = String(u.status || '').toLowerCase();
      return s === 'rejected' || s === 'declined';
    }).length;
    return { all, pending, approved, rejected };
  }, [uploads]);

  const filteredSubmissions = useMemo(() => {
    return uploads.filter(up => {
      const s = String(up.status || '').toLowerCase();
      const isApproved = s === 'approved';
      const isRejected = s === 'rejected' || s === 'declined';
      const isPending = !isApproved && !isRejected;

      // 1. Status Filter
      if (filterType === 'Pending' && !isPending) return false;
      if (filterType === 'Approved' && !isApproved) return false;
      if (filterType === 'Rejected' && !isRejected) return false;

      // 2. Category Filter
      let extra = {};
      if (typeof up.review_notes === 'string' && up.review_notes.startsWith('{')) {
        try { extra = JSON.parse(up.review_notes); } catch (e) {}
      }
      const resType = String(up.resource_type || '').toLowerCase();
      const cat = extra.uploadCategory || up.upload_category || (
        (resType.includes('project') || resType.includes('thesis') || resType.includes('dissertation')) ? 'project' :
        (resType.includes('journal') || resType.includes('article')) ? 'journal' :
        (resType.includes('handout') || resType.includes('lecture')) ? 'handout' : 'book'
      );
      if (submissionCategoryFilter !== 'All' && cat !== submissionCategoryFilter) {
        return false;
      }

      // 3. Search Term Query
      if (submissionSearchTerm.trim()) {
        const q = submissionSearchTerm.trim().toLowerCase();
        const title = (up.title || '').toLowerCase();
        const author = (up.author || '').toLowerCase();
        const code = (up.course_code || '').toLowerCase();
        const id = (up.id || '').toLowerCase();
        const fileName = (up.file_name || '').toLowerCase();
        const targetLevel = (up.target_level || '').toLowerCase();
        const notes = (typeof up.review_notes === 'string' ? up.review_notes : '').toLowerCase();
        return title.includes(q) || author.includes(q) || code.includes(q) || id.includes(q) || fileName.includes(q) || targetLevel.includes(q) || notes.includes(q);
      }

      return true;
    });
  }, [uploads, filterType, submissionCategoryFilter, submissionSearchTerm]);

  // Derived Courses Counts & Filtered Curriculum List
  const courseCounts = useMemo(() => {
    const all = courses.length;
    const nd1 = courses.filter(c => String(c.level || '').toUpperCase().includes('ND I') && !String(c.level || '').toUpperCase().includes('ND II')).length;
    const nd2 = courses.filter(c => String(c.level || '').toUpperCase().includes('ND II')).length;
    const hnd1 = courses.filter(c => String(c.level || '').toUpperCase().includes('HND I') && !String(c.level || '').toUpperCase().includes('HND II')).length;
    const hnd2 = courses.filter(c => String(c.level || '').toUpperCase().includes('HND II')).length;
    return { all, nd1, nd2, hnd1, hnd2 };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // 1. Level Filter
      if (courseLevelFilter !== 'All') {
        const cLevel = String(c.level || '').toUpperCase();
        if (courseLevelFilter === 'ND I' && (!cLevel.includes('ND I') || cLevel.includes('ND II'))) return false;
        if (courseLevelFilter === 'ND II' && !cLevel.includes('ND II')) return false;
        if (courseLevelFilter === 'HND I' && (!cLevel.includes('HND I') || cLevel.includes('HND II'))) return false;
        if (courseLevelFilter === 'HND II' && !cLevel.includes('HND II')) return false;
      }

      // 2. Semester Filter
      if (courseSemesterFilter !== 'All') {
        const cSem = String(c.semester || '').toLowerCase();
        if (courseSemesterFilter === 'First Semester' && !cSem.includes('first') && !cSem.includes('1')) return false;
        if (courseSemesterFilter === 'Second Semester' && !cSem.includes('second') && !cSem.includes('2')) return false;
      }

      // 3. Search Query (course fields + titles/authors of HOD-uploaded books)
      if (courseSearchTerm.trim()) {
        const q = courseSearchTerm.trim().toLowerCase();
        const code = (c.code || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const lecturer = (c.lecturer || '').toLowerCase();
        const syllabus = (c.syllabus || '').toLowerCase();
        const dept = (c.department || '').toLowerCase();
        const bookHit = (c.hodBooks || []).some(b =>
          (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q)
        );
        if (!(code.includes(q) || title.includes(q) || lecturer.includes(q) || syllabus.includes(q) || dept.includes(q) || bookHit)) return false;
      }

      // 4. Only courses that have HOD-uploaded books
      if (courseBooksOnly && !((c.hodBooks || []).length > 0)) return false;

      return true;
    }).sort((a, b) => {
      const diff = (b.hodBooks?.length || 0) - (a.hodBooks?.length || 0);
      return diff !== 0 ? diff : String(a.code || '').localeCompare(String(b.code || ''));
    });
  }, [courses, courseLevelFilter, courseSemesterFilter, courseSearchTerm, courseBooksOnly]);

  // Derived Reserve Counts & Filtered Reserves List
  const reserveCounts = useMemo(() => {
    const all = reservesList.length;
    const bay1 = reservesList.filter(r => (r.shelf || '').includes('Bay 1')).length;
    const bay2 = reservesList.filter(r => (r.shelf || '').includes('Bay 2')).length;
    const bay3 = reservesList.filter(r => (r.shelf || '').includes('Bay 3')).length;
    const carrel = reservesList.filter(r => (r.shelf || '').includes('Carrel') || (r.shelf || '').includes('Stack')).length;
    return { all, bay1, bay2, bay3, carrel };
  }, [reservesList]);

  const filteredReserves = useMemo(() => {
    return reservesList.filter(r => {
      // 1. Shelf location filter
      if (reserveShelfFilter !== 'All') {
        const shelf = String(r.shelf || '').toLowerCase();
        if (reserveShelfFilter === 'Bay 1' && !shelf.includes('bay 1')) return false;
        if (reserveShelfFilter === 'Bay 2' && !shelf.includes('bay 2')) return false;
        if (reserveShelfFilter === 'Bay 3' && !shelf.includes('bay 3')) return false;
        if (reserveShelfFilter === 'Carrel' && !shelf.includes('carrel') && !shelf.includes('stack')) return false;
      }

      // 2. Duration filter
      if (reserveDurationFilter !== 'All') {
        const dur = String(r.duration || '').toLowerCase();
        if (reserveDurationFilter === '2 Hours' && !dur.includes('2 hour')) return false;
        if (reserveDurationFilter === 'Overnight' && !dur.includes('overnight')) return false;
        if (reserveDurationFilter === 'Weekend' && !dur.includes('weekend')) return false;
      }

      // 3. Search query
      if (reserveSearchTerm.trim()) {
        const q = reserveSearchTerm.trim().toLowerCase();
        const title = (r.title || '').toLowerCase();
        const author = (r.author || '').toLowerCase();
        const forCourse = (r.reserved_for || '').toLowerCase();
        const shelf = (r.shelf || '').toLowerCase();
        const duration = (r.duration || '').toLowerCase();
        return title.includes(q) || author.includes(q) || forCourse.includes(q) || shelf.includes(q) || duration.includes(q);
      }

      return true;
    });
  }, [reservesList, reserveShelfFilter, reserveDurationFilter, reserveSearchTerm]);

  // Initial Load & Route Listener
  useEffect(() => {
    fetchDepartments();
    fetchCatalogBooks();
    fetchStaffList();

    const handleDepartmentsUpdated = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setDepartments(e.detail);
      }
    };
    const handleSubmissionsUpdated = () => {
      fetchDepartmentUploads();
    };
    const handleCoursesUpdated = () => {
      fetchCourses();
    };
    const handleReservesUpdated = () => {
      fetchReserves();
    };
    const handleStaffUpdated = () => {
      fetchStaffList();
    };

    window.addEventListener('fcc-departments-updated', handleDepartmentsUpdated);
    window.addEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
    window.addEventListener('fcc-courses-updated', handleCoursesUpdated);
    window.addEventListener('fcc-reserves-updated', handleReservesUpdated);
    window.addEventListener('fcc-staff-updated', handleStaffUpdated);

    return () => {
      window.removeEventListener('fcc-departments-updated', handleDepartmentsUpdated);
      window.removeEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
      window.removeEventListener('fcc-courses-updated', handleCoursesUpdated);
      window.removeEventListener('fcc-reserves-updated', handleReservesUpdated);
      window.removeEventListener('fcc-staff-updated', handleStaffUpdated);
    };
  }, []);

  // Real-Time Cross-System Synchronization for HOD Dashboard
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (!event || !event.action) return;

      const deletedIds = new Set([
        event.id,
        ...(Array.isArray(event.ids) ? event.ids : [])
      ].filter(Boolean).map(String));
      const deletedTitle = (event.title || '').trim().toLowerCase();

      const matchesTarget = (item) => {
        if (!item) return false;
        const itemId = String(item.id || item.upload_id || item.book_id || '');
        if (itemId && deletedIds.has(itemId)) return true;
        if (item.upload_id && deletedIds.has(String(item.upload_id))) return true;
        if (item.book_id && deletedIds.has(String(item.book_id))) return true;
        if (deletedTitle && (item.title || '').trim().toLowerCase() === deletedTitle) return true;
        return false;
      };

      if (event.action === 'DELETE') {
        setActiveReaderBook(prev => {
          if (prev && matchesTarget(prev)) {
            try { sounds.playWarning(); } catch (e) {}
            setSubmissionNotification({
              type: 'warning',
              message: `⚠️ Institutional Document Withdrawn: "${prev.title || 'Document'}" was deleted from repository in real time. Reader access closed.`
            });
            return null;
          }
          return prev;
        });

        setSelectedCatalogBookDossier(prev => (prev && matchesTarget(prev) ? null : prev));
        setUploads(prev => prev.filter(u => !matchesTarget(u)));
        setCatalogBooks(prev => prev.filter(b => !matchesTarget(b)));
      } else if (event.action === 'UPLOAD' || event.action === 'APPROVE' || event.action === 'MODIFY') {
        fetchDepartmentUploads();
        fetchCatalogBooks();
        setActiveReaderBook(prev => (prev && matchesTarget(prev) && event.data ? { ...prev, ...event.data } : prev));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentDept) {
      fetchCourses();
      fetchDissertations();
      fetchReserves();
      fetchScholars();
      fetchDepartmentUploads();
      fetchCatalogBooks();
      fetchStaffList();

      setProfileForm({
        hod: currentDept.hod_name || currentDept.hod || '',
        hodEmail: currentDept.hod_email || currentDept.hodEmail || '',
        hodPhone: currentDept.hodPhone || '+234 803 234 5678',
        office: 'Block B, Room 14 (Faculty Annex)',
        consultationHours: 'Tuesdays & Thursdays, 10:00 AM - 2:00 PM',
        password: ''
      });
      if (currentDept.hod_photo || currentDept.photo_url || currentDept.avatar) {
        setProfilePhoto(currentDept.hod_photo || currentDept.photo_url || currentDept.avatar);
      }

      checkHodProfileLock(currentDept.code);

      setQuickUploadForm(prev => ({
        ...prev,
        author: currentDept.hod_name || currentDept.hod || 'Faculty Unit',
        course_code: `${currentDept.code} 411`
      }));
    }
  }, [currentDept?.id, currentDept?.code]);

  const checkHodProfileLock = async (code) => {
    try {
      const deptCode = code || currentDept?.code;
      if (!deptCode) return;
      const res = await fetch(`/api/admin/profile?dept_code=${encodeURIComponent(deptCode)}`);
      if (res.ok) {
        const data = await res.json();
        setProfileLocked(Boolean(data.is_locked));
        setProfileLockedUntil(data.profile_locked_until || null);
        setProfileDaysRemaining(data.days_remaining || 0);
        setProfileHoursRemaining(data.hours_remaining || 0);
        setProfileMinutesRemaining(data.minutes_remaining || 0);
        if (data.user?.avatar || data.user?.hod_photo) {
          setProfilePhoto(data.user.avatar || data.user.hod_photo);
        }
      }
    } catch (e) {}
  };

  const handleProfilePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Selected image exceeds 5MB size limit.' });
      sounds.playErrorBuzz();
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      setProfilePhoto(dataUrl);
      setProfileMsg({ type: 'success', text: '✓ Photo selected! Click "Save Changes & Sync" below to persist to database.' });
      sounds.playSuccessChime();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setProfileMsg({ type: 'success', text: 'Photo removed. Click "Save Changes & Sync" below to persist.' });
    sounds.playClick();
  };

  const handleSendResetLink = async () => {
    setResetLinkSending(true);
    setProfileMsg({ type: '', text: '' });
    sounds.playClick();
    try {
      const res = await fetch('/api/hod/send-reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_code: currentDept.code,
          email: currentDept.hod_email || profileForm.hodEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setResetLinkSentInfo(data);
        setProfileMsg({
          type: 'success',
          text: `✓ Official Password / PIN Reset link has been dispatched to ${data.recipient || currentDept.hod_email}! Valid for 30 minutes.`
        });
      } else {
        sounds.playErrorBuzz();
        setProfileMsg({
          type: 'error',
          text: data.error || 'Failed to dispatch password reset link.'
        });
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setProfileMsg({
        type: 'error',
        text: 'Error connecting to password reset service.'
      });
    } finally {
      setResetLinkSending(false);
    }
  };

  const handleCopyResetLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedResetLink(true);
    sounds.playClick();
    setTimeout(() => setCopiedResetLink(false), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (profileLocked) {
      setProfileMsg({
        type: 'error',
        text: `Security Lock Active: Under institutional policy, credential updates are restricted to once every 2 weeks (14 days). Remaining: ${profileDaysRemaining}d ${profileHoursRemaining}h ${profileMinutesRemaining}m. Contact Master Developer at #/developer to override.`
      });
      sounds.playErrorBuzz();
      return;
    }

    setProfileSaving(true);
    sounds.playClick();

    try {
      const payload = {
        name: profileForm.hod.trim(),
        email: (currentDept.hod_email || profileForm.hodEmail).trim().toLowerCase(), // Institutional Email (Permanent)
        phone: profileForm.hodPhone.trim(),
        designation: `Head of Department (${currentDept.code})`,
        dept_code: currentDept.code,
        avatar: profilePhoto || null
      };
      if (profileForm.password && profileForm.password.trim()) {
        payload.password = profileForm.password.trim();
      }

      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setProfileLocked(true);
        setProfileLockedUntil(data.profile_locked_until);
        setProfileDaysRemaining(data.days_remaining || 14);
        setProfileHoursRemaining(data.hours_remaining || 0);
        setProfileMinutesRemaining(data.minutes_remaining || 0);

        if (data.reset_link_sent && data.reset_link_info) {
          setResetLinkSentInfo(data.reset_link_info);
          setProfileMsg({
            type: 'success',
            text: `✓ HOD credentials & photo updated in database! An official password reset link was dispatched to ${payload.email}. 2-Week institutional lock active.`
          });
        } else {
          setProfileMsg({
            type: 'success',
            text: '✓ Official HOD credentials & photo updated in database! Mandatory 2-Week (14-Day) institutional security lock is now active.'
          });
        }

        // Update local state
        setCurrentDept(prev => ({
          ...prev,
          hod_name: payload.name,
          hod: payload.name,
          hod_email: payload.email,
          hodEmail: payload.email,
          hodPhone: payload.phone,
          hod_photo: profilePhoto || prev.hod_photo,
          avatar: profilePhoto || prev.avatar
        }));

        setTimeout(() => setIsEditingProfile(false), 2400);
      } else {
        if (data.is_locked) {
          setProfileLocked(true);
          setProfileLockedUntil(data.profile_locked_until);
          setProfileDaysRemaining(data.days_remaining || 14);
          setProfileHoursRemaining(data.hours_remaining || 0);
          setProfileMinutesRemaining(data.minutes_remaining || 0);
        }
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update HOD profile in database.' });
        sounds.playErrorBuzz();
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Error connecting to database API.' });
      sounds.playErrorBuzz();
    } finally {
      setProfileSaving(false);
    }
  };

  // Sync activeTab with URL Hash & Notification Click Events
  useEffect(() => {
    const syncFromHash = (e) => {
      const targetPath = e?.detail?.route || parseCurrentRoute().path;
      if (targetPath.startsWith('/hod/')) {
        const sub = targetPath.replace('/hod/', '').split('/')[0];
        const aliasMap = {
          'profile': 'settings',
          'journals': 'upload',
          'books': 'overview',
          'theses': 'dissertations',
          'communications': 'communication',
          'comms': 'communication',
          'staff-builder': 'staff_builder',
          'staffbuilder': 'staff_builder',
          'staff-workspace': 'staff_workspace',
          'staffworkspace': 'staff_workspace',
          'staff': 'staff_builder'
        };
        const resolved = aliasMap[sub] || sub;
        if (isStaffUser && (resolved === 'staff_builder' || resolved === 'settings')) {
          setActiveTab('staff_workspace');
          navigateTo('/hod/staff-workspace');
          return;
        }
        const valid = ['overview', 'courses', 'upload', 'submissions', 'dissertations', 'reserves', 'scholars', 'communication', 'settings', 'staff_builder', 'staff_workspace'];
        if (valid.includes(resolved)) {
          setActiveTab(resolved);
        }
      } else if (targetPath === '/hod') {
        setActiveTab(isStaffUser ? 'staff_workspace' : 'overview');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('fcc-notification-navigate', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('fcc-notification-navigate', syncFromHash);
    };
  }, [isStaffUser]);

  const handleTabSwitch = (tabId) => {
    if (isStaffUser && (tabId === 'staff_builder' || tabId === 'settings')) {
      return;
    }
    sounds.playClick();
    setActiveTab(tabId);
    const slug = tabId === 'staff_builder' ? 'staff-builder' : (tabId === 'staff_workspace' ? 'staff-workspace' : tabId);
    navigateTo(`/hod/${slug}`);
  };

  const handleSwitchDepartment = (deptCode) => {
    sounds.playSuccessChime();
    const found = departments.find(d => (d.code || '').toUpperCase() === deptCode.toUpperCase());
    if (found) {
      setCurrentUser(prev => ({
        ...prev,
        department_code: found.code,
        department_name: found.name,
        department_id: found.id,
        name: found.hod_name || found.hod,
        matric: `HOD/${found.code}/001`
      }));
      setSuccessMsg(`Switched view to Department of ${found.name} (${found.code})`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Quick Book / PDF Upload Handler with Automatic Deep PDF Analysis, Cover Extraction & Compression
  const handleQuickFileSelected = async (file, chosenPreset = quickUploadPreset) => {
    if (!file) return;
    setQuickUploadRawFile(file);
    sounds.playClick();

    setQuickUploadForm(prev => ({
      ...prev,
      file_name: file.name,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }));

    // Run Deep PDF / Book Metadata & Cover Image Scanner
    try {
      const defaultAuthor = currentDept?.hod_name || currentDept?.hod || 'Department Faculty Unit';
      analyzeUploadedPdf(file, {
        defaultDeptCode: currentDept?.code || 'CEM',
        defaultAuthor
      }).then((analysis) => {
        if (analysis && analysis.success && analysis.extracted) {
          const ext = analysis.extracted;
          setQuickUploadForm(prev => ({
            ...prev,
            title: ext.title || prev.title,
            author: ext.author || prev.author,
            course_code: ext.courseCode || prev.course_code,
            target_level: ext.targetLevel || prev.target_level,
            resource_type: ext.resourceType || prev.resource_type,
            abstract: ext.abstract || prev.abstract,
            cover_image: ext.coverImage || prev.cover_image,
            cover_name: ext.coverImage
              ? `${ext.coverSourceLabel || 'Auto-Extracted PDF Cover Picture'}`
              : prev.cover_name
          }));
        }
      }).catch(() => {});
    } catch (e) {}

    // If it's a PDF, automatically run intelligent stream compression
    if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
      setQuickUploadIsCompressing(true);
      try {
        const comp = await compressPdf(file, {
          preset: chosenPreset,
          onProgress: (p) => setQuickUploadProgress(p)
        });
        setQuickUploadCompressionResult(comp);
        setQuickUploadForm(prev => ({
          ...prev,
          file_name: file.name,
          file_data_url: comp.dataUrl,
          file_size: comp.compressedFormatted
        }));
        sounds.playSuccessChime();
      } catch (err) {
        console.warn('Quick PDF compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          setQuickUploadForm(prev => ({
            ...prev,
            file_data_url: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      } finally {
        setQuickUploadIsCompressing(false);
      }
    } else {
      // Non-PDF documents (e.g. EPUB, TXT)
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuickUploadForm(prev => ({
          ...prev,
          file_data_url: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Book Cover Artwork Handler with Automatic WebP/JPEG Optimization
  const handleQuickCoverSelected = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    try {
      const compressed = await compressCoverImage(file, 600, 0.82);
      if (compressed) {
        setQuickUploadForm(prev => ({
          ...prev,
          cover_image: compressed.dataUrl,
          cover_name: `${file.name} (Compressed to ${compressed.sizeFormatted})`
        }));
        sounds.playSuccessChime();
        return;
      }
    } catch (e) {
      console.warn('Cover compression fallback:', e);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setQuickUploadForm(prev => ({
        ...prev,
        cover_image: e.target.result,
        cover_name: file.name
      }));
      sounds.playSuccessChime();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectExistingForQuickEdit = (uploadId) => {
    setEditingQuickUploadId(uploadId);
    if (!uploadId) {
      setQuickUploadForm({
        title: '',
        author: currentDept.hod_name || currentDept.hod || '',
        course_code: `${currentDept.code} 411`,
        target_level: 'HND II',
        semester: 'First Semester',
        resource_type: 'Lecture Handout / E-Book',
        access_scope: 'Public Institution-Wide',
        file_name: '',
        file_data_url: '',
        cover_image: '',
        cover_name: '',
        abstract: ''
      });
      setQuickUploadCustomLevel('');
      return;
    }
    const found = uploads.find(u => String(u.id) === String(uploadId));
    if (found) {
      sounds.playClick();
      setQuickUploadForm({
        title: found.title || '',
        author: found.author || currentDept.hod_name || currentDept.hod || '',
        course_code: found.course_code || `${currentDept.code} 411`,
        target_level: found.target_level || 'HND II',
        semester: found.semester || 'First Semester',
        resource_type: found.resource_type || 'Lecture Handout / E-Book',
        access_scope: found.access_scope || 'Public Institution-Wide',
        file_name: found.file_name || '',
        file_data_url: '',
        cover_image: found.cover_image || '',
        cover_name: found.cover_image ? 'Existing Database Cover' : '',
        abstract: found.abstract || ''
      });
      setQuickUploadCustomLevel('');
    }
  };

  const handleQuickUploadSubmit = async (e) => {
    e.preventDefault();
    if (!quickUploadForm.title.trim()) {
      alert('Please enter a Title for the book or PDF resource.');
      return;
    }
    if (!bypassQuickUploadDupRef.current) {
      try {
        const dupRes = await libraryApi.catalog.checkDuplicate({
          title: quickUploadForm.title.trim(),
          author: quickUploadForm.author.trim(),
          fileName: quickUploadForm.file_name
        });
        if (dupRes && dupRes.isDuplicate) {
          setDuplicateModalInfo(dupRes);
          setIsDuplicateModalOpen(true);
          try { sounds.playWarning(); } catch {}
          return;
        }
      } catch (e) {}
    }
    bypassQuickUploadDupRef.current = false;

    setIsSubmittingQuickUpload(true);
    try {
      const effectiveLevel = quickUploadForm.target_level === 'Other'
        ? (quickUploadCustomLevel.trim() || 'Other')
        : quickUploadForm.target_level;

      const deptId = currentDept.id || `DEP-${currentDept.code}`;
      const payload = {
        title: quickUploadForm.title.trim(),
        author: quickUploadForm.author.trim() || (currentDept.hod_name || currentDept.hod || 'Faculty Lecturer'),
        department_id: deptId,
        department_name: currentDept.name,
        uploaded_by_hod_id: currentUser?.matric || `HOD-${currentDept.code}`,
        hod_name: currentDept.hod_name || currentDept.hod,
        course_code: quickUploadForm.course_code,
        target_level: effectiveLevel,
        semester: quickUploadForm.semester,
        resource_type: quickUploadForm.resource_type || 'Lecture Handout / E-Book',
        file_name: quickUploadForm.file_name || `${quickUploadForm.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
        file_data_url: quickUploadForm.file_data_url || undefined,
        cover_image: quickUploadForm.cover_image || undefined,
        access_scope: quickUploadForm.access_scope || 'Public Institution-Wide',
        abstract: quickUploadForm.abstract || `Official course material published for ${quickUploadForm.course_code} (${effectiveLevel}) students.`
      };

      const endpoint = editingQuickUploadId
        ? `${getApiBase()}/department-uploads/${encodeURIComponent(editingQuickUploadId)}/update`
        : `${getApiBase()}/department-uploads`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        const isDirect = data.direct_published === true || data.upload?.status === 'approved';
        const savedUpload = {
          ...data.upload,
          status: isDirect ? 'approved' : (data.upload?.status || 'pending'),
          direct_published: isDirect
        };
        if (savedUpload) {
          if (editingQuickUploadId) {
            setUploads(prev => prev.map(u => String(u.id) === String(editingQuickUploadId) ? savedUpload : u));
          } else {
            setUploads(prev => [savedUpload, ...prev]);
          }
        }
        fetchCourses();
        fetchCatalogBooks();
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: savedUpload }));
        if (editingQuickUploadId) {
          window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: data.book || savedUpload }));
          setSuccessMsg(`✓ Database record "${payload.title}" (${editingQuickUploadId}) updated and synchronized!`);
        } else if (isDirect) {
          window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: data.book || savedUpload }));
          setSuccessMsg(`✓ "${payload.title}" has been published directly to students! It is immediately accessible in the Student Scholar Portal and OPAC.`);
        } else {
          setSuccessMsg(`✓ "${payload.title}" submitted for Central Library Review. Your submission is now in the Admin Review Queue at #/admin/hod-submissions.`);
        }
        setTimeout(() => setSuccessMsg(''), 10000);

        // Reset quick form
        setEditingQuickUploadId('');
        setQuickUploadForm({
          title: '',
          author: currentDept.hod_name || currentDept.hod || '',
          course_code: `${currentDept.code} 411`,
          target_level: 'HND II',
          semester: 'First Semester',
          resource_type: 'Lecture Handout / E-Book',
          access_scope: 'Public Institution-Wide',
          file_name: '',
          file_data_url: '',
          cover_image: '',
          cover_name: '',
          abstract: ''
        });
        setQuickUploadCustomLevel('');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Network error while saving resource to backend database.');
    } finally {
      setIsSubmittingQuickUpload(false);
    }
  };

  // Add Course to Database
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseForm.code || !newCourseForm.title) {
      alert('Course Code and Course Title are required.');
      return;
    }
    sounds.playClick();
    try {
      const effectiveLevel = newCourseForm.level === 'Other'
        ? (courseCustomLevel.trim() || 'Other')
        : newCourseForm.level;

      const payload = {
        code: newCourseForm.code.toUpperCase().trim(),
        title: newCourseForm.title.trim(),
        department: currentDept.name,
        faculty: currentDept.faculty,
        level: effectiveLevel,
        semester: newCourseForm.semester || 'First Semester',
        lecturer: newCourseForm.lecturer.trim() || (currentDept.hod_name || currentDept.hod),
        syllabus: newCourseForm.syllabus?.trim() || `Accredited curriculum module for ${newCourseForm.code.toUpperCase().trim()} (${effectiveLevel}).`,
        enrolled_students: 65
      };

      const endpoint = `${getApiBase()}/courses`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (res && res.ok) {
        sounds.playSuccessChime();
        setCourses(prev => [data, ...prev.filter(c => c.code !== data.code)]);
        setShowAddCourseModal(false);
        setNewCourseForm({ code: '', title: '', level: 'HND II', semester: 'First Semester', lecturer: '', syllabus: '' });
        setCourseCustomLevel('');
        setCourseNotification({ type: 'success', message: `Course ${payload.code} successfully registered in database!` });
        setTimeout(() => setCourseNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-courses-updated', { detail: data }));
      } else {
        sounds.playErrorBuzz();
        alert(data.message || 'Error registering course in database.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      alert('Network error connecting to backend server to register course.');
    }
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course) => {
    sounds.playClick();
    setEditingCourse(course);
    setEditCourseForm({
      code: course.code || '',
      title: course.title || '',
      level: course.level || 'HND II',
      semester: course.semester || 'First Semester',
      lecturer: course.lecturer || '',
      syllabus: course.syllabus || '',
      enrolled_students: course.enrolledStudents || course.enrolled_students || 65
    });
  };

  // Save Edit Course Changes to Database
  const handleSaveEditCourse = async (e) => {
    if (e) e.preventDefault();
    if (!editingCourse) return;

    setIsSavingEditCourse(true);
    sounds.playClick();

    try {
      const payload = {
        title: editCourseForm.title.trim(),
        level: editCourseForm.level,
        semester: editCourseForm.semester,
        lecturer: editCourseForm.lecturer.trim(),
        syllabus: editCourseForm.syllabus.trim(),
        enrolled_students: Number(editCourseForm.enrolled_students) || 65,
        department: currentDept.name
      };

      const endpoint = `${getApiBase()}/courses/${encodeURIComponent(editingCourse.code)}/update`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/courses/${encodeURIComponent(editingCourse.code)}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        setCourses(prev => prev.map(c => c.code === editingCourse.code ? { ...c, ...payload } : c));
        setEditingCourse(null);
        setCourseNotification({ type: 'success', message: `Course ${editingCourse.code} updated successfully in database!` });
        setTimeout(() => setCourseNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-courses-updated', { detail: payload }));
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setCourseNotification({ type: 'error', message: 'Failed to update course in database.' });
      setTimeout(() => setCourseNotification(null), 4000);
    } finally {
      setIsSavingEditCourse(false);
    }
  };

  // De-register / Delete Course from Database
  const handleDeleteCourse = async (courseCode, courseTitle) => {
    if (!courseCode) return;
    const confirmDelete = window.confirm(`Permanently de-register course "${courseCode} - ${courseTitle || ''}" from the academic database?`);
    if (!confirmDelete) return;

    sounds.playClick();
    setDeletingCourseCode(courseCode);

    try {
      const endpoint = `${getApiBase()}/courses/${encodeURIComponent(courseCode)}`;
      let res;
      try {
        res = await fetch(endpoint, { method: 'DELETE' });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/courses/${encodeURIComponent(courseCode)}`, { method: 'DELETE' });
        }
      }

      if (res && res.ok) {
        sounds.playSuccessChime();
        setCourses(prev => prev.filter(c => c.code !== courseCode));
        setCourseNotification({ type: 'success', message: `Course ${courseCode} de-registered from database.` });
        setTimeout(() => setCourseNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-courses-updated', { detail: { code: courseCode } }));
      } else {
        sounds.playErrorBuzz();
        setCourseNotification({ type: 'error', message: 'Failed to delete course from database.' });
        setTimeout(() => setCourseNotification(null), 4000);
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setCourseNotification({ type: 'error', message: 'Network error deleting course.' });
      setTimeout(() => setCourseNotification(null), 4000);
    } finally {
      setDeletingCourseCode(null);
    }
  };

  // Place Book on Reserve in Database
  const handleAddReserve = async (e) => {
    e.preventDefault();
    if (!newReserveForm.title) {
      alert('Book Title is required.');
      return;
    }
    try {
      const payload = {
        title: newReserveForm.title.trim(),
        author: newReserveForm.author.trim() || (currentDept.hod_name || currentDept.hod),
        department_code: currentDept.code,
        department_name: currentDept.name,
        reserved_for: (newReserveForm.reservedFor || `${currentDept.code} 401`).toUpperCase().trim(),
        shelf: newReserveForm.shelf,
        duration: newReserveForm.duration,
        copies: Number(newReserveForm.copies) || 3
      };

      const endpoint = `${getApiBase()}/course-reserves`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/course-reserves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        setReservesList(prev => [data.reserve, ...prev]);
        sounds.playSuccessChime();
        setShowAddReserveModal(false);
        setNewReserveForm({
          title: '',
          author: '',
          shelf: 'Reserve Desk Bay 1',
          copies: 3,
          reservedFor: '',
          duration: '2 Hours In-Library Reading Only'
        });
        setReserveNotification({ type: 'success', message: `Textbook "${payload.title}" placed on reserve shelf in database!` });
        setTimeout(() => setReserveNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-reserves-updated', { detail: data.reserve }));
      } else {
        sounds.playErrorBuzz();
        alert(data.message || 'Failed to place book on reserve.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      alert('Network error connecting to backend server while saving reserve.');
    }
  };

  // Open Edit Reserve Modal
  const handleOpenEditReserve = (reserve) => {
    sounds.playClick();
    setEditingReserve(reserve);
    setEditReserveForm({
      id: reserve.id,
      title: reserve.title || '',
      author: reserve.author || '',
      reserved_for: reserve.reserved_for || '',
      shelf: reserve.shelf || 'Reserve Desk Bay 1',
      duration: reserve.duration || '2 Hours In-Library Reading Only',
      copies: Number(reserve.copies) || 3,
      status: reserve.status || 'active'
    });
  };

  // Save Edit Course Reserve Changes
  const handleSaveEditReserve = async (e) => {
    if (e) e.preventDefault();
    if (!editingReserve) return;

    setIsSavingEditReserve(true);
    sounds.playClick();

    try {
      const payload = {
        title: editReserveForm.title.trim(),
        author: editReserveForm.author.trim(),
        department_code: currentDept.code,
        department_name: currentDept.name,
        reserved_for: (editReserveForm.reserved_for || '').toUpperCase().trim(),
        shelf: editReserveForm.shelf,
        duration: editReserveForm.duration,
        copies: Number(editReserveForm.copies) || 3,
        status: editReserveForm.status
      };

      const endpoint = `${getApiBase()}/course-reserves/${editingReserve.id}/update`;
      let res;
      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/course-reserves/${editingReserve.id}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }

      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        setReservesList(prev => prev.map(r => r.id === editingReserve.id ? { ...r, ...payload } : r));
        setEditingReserve(null);
        setReserveNotification({ type: 'success', message: `Reserve textbook #${editingReserve.id} updated successfully in database!` });
        setTimeout(() => setReserveNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-reserves-updated', { detail: payload }));
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setReserveNotification({ type: 'error', message: 'Failed to update reserve book in database.' });
      setTimeout(() => setReserveNotification(null), 4000);
    } finally {
      setIsSavingEditReserve(false);
    }
  };

  // Delete Course Reserve from Database
  const handleDeleteReserve = async (id, title) => {
    const confirmDelete = window.confirm(`Remove textbook "${title || `#${id}`}" from the course reserve shelf in the database?`);
    if (!confirmDelete) return;

    sounds.playClick();
    setDeletingReserveId(id);

    try {
      const endpoint = `${getApiBase()}/course-reserves/${id}`;
      let res;
      try {
        res = await fetch(endpoint, { method: 'DELETE' });
      } catch (netErr) {
        if (isLocalhostHost) {
          res = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/course-reserves/${id}`, { method: 'DELETE' });
        }
      }

      if (res && res.ok) {
        setReservesList(prev => prev.filter(r => r.id !== id));
        sounds.playSuccessChime();
        setReserveNotification({ type: 'success', message: 'Book removed from course reserve shelf.' });
        setTimeout(() => setReserveNotification(null), 4000);
        window.dispatchEvent(new CustomEvent('fcc-reserves-updated', { detail: { id } }));
      } else {
        sounds.playErrorBuzz();
        setReserveNotification({ type: 'error', message: 'Failed to delete book from reserve shelf.' });
        setTimeout(() => setReserveNotification(null), 4000);
      }
    } catch (e) {
      sounds.playErrorBuzz();
      setReserveNotification({ type: 'error', message: 'Network error deleting reserve book.' });
      setTimeout(() => setReserveNotification(null), 4000);
    } finally {
      setDeletingReserveId(null);
    }
  };


  // Persist a dissertation review decision to the database
  const updateDissertationStatus = async (id, status, revisionNote = '') => {
    setDissertationActionId(id);
    setDissertationError('');
    try {
      const res = await fetch(`/api/theses/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          status,
          revision_note: revisionNote,
          reviewed_by: currentUser?.name || currentDept.hod_name || currentDept.hod || 'Head of Department'
        })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || `Server responded ${res.status}`);

      const updated = payload.thesis;
      setDissertations(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
      setSelectedDissertationForModal(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
      window.dispatchEvent(new CustomEvent('fcc-theses-updated', { detail: updated }));
      return true;
    } catch (e) {
      setDissertationError(`Action failed: ${e.message}`);
      return false;
    } finally {
      setDissertationActionId(null);
    }
  };

  // Approve Dissertation in Database
  const handleApproveDissertation = async (id) => {
    if (await updateDissertationStatus(id, 'Published')) {
      sounds.playSuccessChime();
      setSuccessMsg('Dissertation endorsed and published to the institutional repository.');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // Open the revision / rejection note dialog
  const handleRequestRevision = (diss, mode = 'Revision Requested') => {
    setRevisionTarget({ diss, mode });
    setRevisionNoteDraft(diss.revision_note || '');
  };

  const submitRevisionNote = async () => {
    if (!revisionTarget || !revisionNoteDraft.trim()) return;
    const { diss, mode } = revisionTarget;
    if (await updateDissertationStatus(diss.id, mode, revisionNoteDraft.trim())) {
      sounds.playClick();
      setSuccessMsg(mode === 'Rejected' ? 'Dissertation marked as not approved. Scholar notified.' : 'Revision request saved and returned to the scholar.');
      setTimeout(() => setSuccessMsg(''), 3500);
      setRevisionTarget(null);
      setRevisionNoteDraft('');
    }
  };

  const normalizeThesisStatus = (s) => (s || 'Under Review');
  const dissertationCounts = useMemo(() => {
    const c = { All: dissertations.length, 'Under Review': 0, Published: 0, 'Revision Requested': 0, Rejected: 0 };
    dissertations.forEach(d => {
      const s = normalizeThesisStatus(d.status);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [dissertations]);

  const visibleDissertations = useMemo(() => {
    const q = dissertationSearch.trim().toLowerCase();
    return dissertations.filter(d => {
      if (dissertationStatusFilter !== 'All' && normalizeThesisStatus(d.status) !== dissertationStatusFilter) return false;
      if (!q) return true;
      return [d.title, d.author, d.matric, d.advisor, d.abstract].some(v => (v || '').toLowerCase().includes(q));
    });
  }, [dissertations, dissertationStatusFilter, dissertationSearch]);

  const formatDate = (v) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Grant Convocation Clearance in Database
  const handleToggleScholarClearance = async (patronId) => {
    try {
      const res = await fetch(`/api/patrons/${patronId}/clearance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearance_status: 'Cleared for Convocation ✓' })
      });
      if (res.ok) {
        setScholarsList(prev => prev.map(s => {
          if (s.id === patronId || s.matric === patronId) {
            return { ...s, clearance_status: 'Cleared for Convocation ✓', cleared: true };
          }
          return s;
        }));
        sounds.playSuccessChime();
        setSuccessMsg('Graduation clearance approved with HOD seal and saved in database!');
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    } catch (e) {}
  };

  // Remove Scholar Record
  const handleDeleteScholar = async (patronId, scholarName) => {
    if (!confirm(`Are you sure you want to remove scholar ${scholarName} from your department registry?`)) return;
    try {
      await libraryApi.patrons.deletePatron(patronId);
      setScholarsList(prev => prev.filter(s => s.id !== patronId && s.matric !== patronId));
      sounds.playClick();
      setSuccessMsg(`Scholar ${scholarName} removed from department registry.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (e) {
      alert('Could not remove scholar.');
    }
  };


  // Filter scholars
  const filteredScholars = scholarsList.filter(s => {
    const matchesSearch = !scholarSearchTerm.trim() ||
      (s.name || '').toLowerCase().includes(scholarSearchTerm.toLowerCase()) ||
      (s.matric || '').toLowerCase().includes(scholarSearchTerm.toLowerCase());
    const matchesLevel = scholarLevelFilter === 'All'
      ? true
      : scholarLevelFilter === 'Other'
        ? !['ND I', 'ND II', 'HND I', 'HND II', 'GNS'].some(l => (s.level || '').toUpperCase().includes(l))
        : (s.level || '').toUpperCase().includes(scholarLevelFilter.toUpperCase());
    return matchesSearch && matchesLevel;
  });

  const pendingUploadsCount = uploads.filter(u => u.status === 'pending').length;

  // Sidebar navigation structure (respecting Developer Master Portal hodPages toggles and Staff RBAC)
  const navSections = useMemo(() => {
    if (isStaffUser) {
      const allowedPages = currentUser?.allowed_pages || { overview: true };

      const portalItems = [
        { id: 'staff_workspace', label: 'My Staff Workspace', icon: Users, badge: 'Active' },
        allowedPages.overview ? { id: 'overview', label: 'Department Overview', icon: Building2 } : null,
        allowedPages.courses ? { id: 'courses', label: 'Curriculum & Syllabi', icon: BookOpen, badge: courses.length } : null,
        allowedPages.upload ? { id: 'upload', label: 'Upload Materials', icon: Upload, badge: 'Studio' } : null,
        allowedPages.submissions ? { id: 'submissions', label: 'Ingestion Pipeline', icon: Layers, badge: pendingUploadsCount || undefined } : null,
      ].filter(Boolean);

      const researchItems = [
        allowedPages.dissertations ? { id: 'dissertations', label: 'HND Dissertations', icon: Award, badge: dissertations.filter(d => (d.status || '').toLowerCase().includes('review') || (d.status || '').toLowerCase().includes('pending')).length, badgeAlert: true } : null,
        allowedPages.reserves ? { id: 'reserves', label: 'Course Reserves', icon: Bookmark, badge: reservesList.length } : null,
        allowedPages.scholars ? { id: 'scholars', label: 'Registered Students', icon: Users, badge: scholarsList.length } : null,
        allowedPages.communication ? { id: 'communication', label: 'Tri-Party Dispatch', icon: MessageSquare, badge: 'Live' } : null,
      ].filter(Boolean);

      return [
        { title: 'MY STAFF WORKSPACE', items: portalItems },
        ...(researchItems.length > 0 ? [{ title: 'DELEGATED ACADEMIC DUTIES', items: researchItems }] : [])
      ];
    }

    return [
      {
        title: 'DEPARTMENT PORTAL',
        items: [
          { id: 'overview', label: 'Department Overview', icon: Building2 },
          { id: 'courses', label: 'Curriculum & Syllabi', icon: BookOpen, badge: courses.length },
          { id: 'upload', label: 'Upload Materials', icon: Upload, badge: 'Studio' },
          { id: 'submissions', label: 'Ingestion Pipeline', icon: Layers, badge: pendingUploadsCount || undefined }
        ].filter(it => devConfig?.hodPages?.[it.id]?.enabled !== false)
      },
      {
        title: 'ACADEMIC & RESEARCH',
        items: [
          { id: 'dissertations', label: 'HND Dissertations', icon: Award, badge: dissertations.filter(d => (d.status || '').toLowerCase().includes('review') || (d.status || '').toLowerCase().includes('pending')).length, badgeAlert: true },
          { id: 'reserves', label: 'Course Reserves', icon: Bookmark, badge: reservesList.length },
          { id: 'scholars', label: 'Registered Students', icon: Users, badge: scholarsList.length }
        ].filter(it => devConfig?.hodPages?.[it.id]?.enabled !== false)
      },
      {
        title: 'STAFF WORKSPACES & RBAC',
        items: [
          { id: 'staff_builder', label: 'Staff Page Builder', icon: Sliders, badge: 'RBAC' },
          { id: 'staff_workspace', label: 'Staff Live Workspace', icon: Users, badge: staffList.length ? String(staffList.length) : 'Live' }
        ].filter(it => devConfig?.hodPages?.[it.id]?.enabled !== false)
      },
      {
        title: 'DISPATCH & SETTINGS',
        items: [
          { id: 'communication', label: 'Tri-Party Dispatch', icon: MessageSquare, badge: 'Live' },
          { id: 'settings', label: 'HOD Profile & Security', icon: Settings }
        ].filter(it => devConfig?.hodPages?.[it.id]?.enabled !== false)
      }
    ].filter(sec => sec.items.length > 0);
  }, [isStaffUser, currentUser, devConfig, courses.length, pendingUploadsCount, dissertations, reservesList.length, scholarsList.length, staffList.length]);

  return (
    <div
      className="min-h-screen lg:min-h-0 lg:h-screen lg:max-h-full lg:overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans"
      style={{ backgroundImage: PATTERNS.hod }}
    >
      {/* Top Department Solid Color Stripe */}
      <div className="h-2 w-full shrink-0 shadow-md transition-colors duration-500" style={{ backgroundColor: theme.solidPrimary }} />

      {/* Targeted Developer Broadcast Banner & Maintenance Lock */}
      <MaintenanceBroadcastBanner role={isStaffUser ? 'hod_staff' : 'hod'} currentPage={activeTab} />

      {/* 1. TOP INSTITUTIONAL NAVIGATION BAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <Menu size={18} />
          </button>

          <div
            className="w-10 h-10 rounded-xl border p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md"
            style={{ borderColor: theme.solidPrimary }}
          >
            <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-[10px]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">
                {isStaffUser ? `${currentDept.code} • ACADEMIC STAFF WORKSPACE` : `${currentDept.code} HOD PORTAL`}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-sm"
                style={{ backgroundColor: theme.solidPrimary }}
              >
                {isStaffUser ? 'DELEGATED STAFF' : `${theme.colorName.toUpperCase()} THEME`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {isStaffUser
                ? `${currentUser?.name} (${currentUser?.designation || 'Academic Staff'}) • Appointed by HOD ${currentDept.hod_name || currentDept.hod}`
                : `${currentDept.name} • ${currentDept.hod_name || currentDept.hod}`}
            </p>
          </div>
        </div>

        {/* Center: Department Switcher for HOD, or Staff Identity Banner for Staff */}
        {!isStaffUser ? (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs shadow-inner">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Lock size={12} className="text-amber-400 shrink-0" title="Password Required to Switch" />
              <Building2 size={13} style={{ color: theme.solidPrimary }} />
              <span>Switch HOD:</span>
            </span>
            <select
              value={currentDept.code}
              onChange={(e) => handleInitiateSwitchDepartment(e.target.value)}
              className="bg-transparent font-bold border-none focus:outline-none cursor-pointer text-xs"
              style={{ color: theme.accent }}
              title="Select department to switch (password required)"
            >
              {departments.map((d) => (
                <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                  {d.code} - {d.name} ({d.hod_name || d.hod})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#0f172a] border border-slate-800 text-xs shadow-inner">
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>{currentUser?.staff_code || 'STAFF'}</span>
            </span>
            <span className="text-slate-400">• {currentDept.name}</span>
          </div>
        )}

        {/* Right User Actions */}
        <div className="flex items-center gap-3">
          <UniversalNotificationCenter
            user={{
              ...(currentUser || {}),
              name: currentDept.hod_name || currentDept.hod || currentUser?.name,
              email: currentDept.hod_email || currentUser?.email,
              department_code: currentDept.code,
              role: 'hod'
            }}
            role="hod"
          />

          <button
            onClick={() => navigateTo('/scholar/library_search')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <Compass size={14} style={{ color: theme.accent }} />
            <span>Scholar View</span>
          </button>

          {/* Interactive HOD Profile Pill (or Staff Identity Pill for staff) */}
          {!isStaffUser ? (
            <button
              type="button"
              onClick={() => handleTabSwitch('settings')}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer group text-left shadow-sm"
              title="View & Edit HOD Profile"
            >
              <div className="relative shrink-0">
                {profilePhoto || currentDept.hod_photo ? (
                  <img
                    src={profilePhoto || currentDept.hod_photo}
                    alt={currentDept.hod_name || currentDept.hod}
                    className="w-8 h-8 rounded-xl object-cover border shadow-sm"
                    style={{ borderColor: theme.solidPrimary }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white border shadow-sm"
                    style={{ backgroundColor: theme.solidDark, borderColor: theme.solidPrimary }}
                  >
                    {(currentDept.hod_name || currentDept.hod || 'HD').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active HOD" />
              </div>

              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white group-hover:text-teal-300 transition line-clamp-1">
                  {currentDept.hod_name || currentDept.hod}
                </div>
                <div className="text-[10px] font-mono flex items-center gap-1 justify-end" style={{ color: theme.accent }}>
                  <span>Head of Dept ({currentDept.code})</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 group-hover:underline">Profile &rarr;</span>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-sm text-left">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white border shadow-sm"
                style={{ backgroundColor: theme.solidDark, borderColor: theme.solidPrimary }}
              >
                {(currentUser?.name || 'ST').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white line-clamp-1">
                  {currentUser?.name || 'Department Staff'}
                </div>
                <div className="text-[10px] font-mono text-emerald-400">
                  {currentUser?.designation || 'Academic Staff'}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => onLogout ? onLogout() : navigateTo('/hod/login')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Admin Master Impersonation Quick-Return Banner */}
      {(currentUser?.isAdminImpersonation || initialUser?.isAdminImpersonation) && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/50 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-white shadow-xl text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-black text-amber-300 uppercase tracking-wider text-[11px]">Admin Master Mode:</span>
            <span>You have full administrative authority over <strong>{currentDept.name} ({currentDept.code})</strong> without password.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onLogout) onLogout();
                else navigateTo('/admin/overview');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/60 text-indigo-100 hover:text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-amber-400" />
              <span>Return to Chief Librarian Console &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Department Dedicated Solid Color Brand Bar */}
      <div
        className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white shadow-md text-xs font-bold transition-all duration-500"
        style={{ backgroundColor: theme.solidPrimary }}
      >
        <div className="flex items-center gap-2.5">
          <GraduationCap size={16} />
          <span>{currentDept.name} ({currentDept.code}) - Head of Department: {currentDept.hod_name || currentDept.hod}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] bg-black/20 px-2.5 py-1 rounded-lg">
          <span>Solid Theme: {theme.colorName}</span>
          <span>•</span>
          <span>Uploads: {uploads.length > 0 ? uploads.length : (currentDept.uploads_count ?? currentDept.uploadsCount ?? 13)}</span>
        </div>
      </div>

      {/* 2. BODY LAYOUT */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar (fully hideable, scrolls independently of main) */}
        {sidebarOpen && (
        <aside
          className="w-64 h-full min-h-0 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden z-30 animate-fadeIn"
        >
          {sidebarOpen && (
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Active Department
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-sm"
                  style={{ backgroundColor: theme.solidPrimary }}
                >
                  {currentDept.code}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 line-clamp-1">
                {currentDept.faculty || 'School of Academic Studies'}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? theme.activeTab
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
                                  ? 'bg-white/20 text-white'
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

          {sidebarOpen && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-center">
              <span className="text-[10px] font-mono text-slate-500 block">
                FCC ILS Live SQLite Engine
              </span>
            </div>
          )}
        </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 space-y-6">
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

          {/* ============================================================== */}
          {/* VIEW 1: OVERVIEW TAB (#/hod) WITH DIRECT BOOK / PDF UPLOAD */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Institutional Hero Banner */}
              <div className={`rounded-3xl bg-gradient-to-r ${theme.bannerGradient} border p-6 sm:p-8 shadow-2xl relative overflow-hidden`}>
                <div className="relative z-10 space-y-3 max-w-2xl">
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-mono font-bold text-white uppercase tracking-wider shadow"
                    style={{ backgroundColor: theme.solidPrimary }}
                  >
                    {currentDept.code} ACADEMIC JURISDICTION • {theme.colorName.toUpperCase()} HOD PORTAL
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentDept.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Upload textbooks, syllabi, past exams, and research monographs for your {currentDept.code} scholars. Once approved by Admin, only students in your department will have access to them.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleTabSwitch('upload')}
                      className={`px-4 py-2 rounded-xl ${theme.btnPrimary} font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer`}
                    >
                      <Upload size={14} /> Full Upload Studio
                    </button>
                    <button
                      onClick={() => handleTabSwitch('staff_builder')}
                      className="px-4 py-2 rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-100 border border-teal-500/50 font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
                    >
                      <Sliders size={14} className="text-teal-300" /> Staff Page Builder
                    </button>
                    <button
                      onClick={() => handleTabSwitch('staff_workspace')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users size={14} className="text-cyan-400" /> Staff Workspaces ({staffList.length})
                    </button>
                    <button
                      onClick={() => handleTabSwitch('dissertations')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <Award size={14} className="text-teal-400" /> Theses ({dissertations.length})
                    </button>
                    <button
                      onClick={() => handleTabSwitch('courses')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <BookOpen size={14} className="text-indigo-400" /> Syllabi ({courses.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* DIRECT QUICK BOOK / PDF UPLOAD & BULK BATCH INGESTION FOR STUDENT ACCESS */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/40 shadow-2xl space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400">
                      <FileUp size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Bulk Batch Ingestion & Book / PDF Upload for Students & Scholars
                      </h3>
                      <p className="text-xs text-slate-400">
                        Fetch courses, authors & existing books directly from the database via API, edit all 6 metadata fields manually, and sync with SQLite & MySQL.
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggle: Bulk Batch Ingestion vs Single Quick Upload */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setOverviewUploadMode('bulk');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          overviewUploadMode === 'bulk'
                            ? 'bg-teal-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layers size={13} />
                        <span>Bulk Batch Ingestion (DB Connected)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setOverviewUploadMode('single');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          overviewUploadMode === 'single'
                            ? 'bg-teal-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileUp size={13} />
                        <span>Single Book / Material Form</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTabSwitch('upload')}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800"
                    >
                      <span>Full Studio Tab</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* MODE 1: BULK BATCH INGESTION STUDIO EMBEDDED DIRECTLY ON #/hod/overview */}
                {overviewUploadMode === 'bulk' && (
                  <div className="animate-fadeIn">
                    <HodUploadStudio
                      user={uploadStudioUser}
                      theme={theme}
                      onUploadSuccess={(newUp) => {
                        if (newUp) {
                          const items = Array.isArray(newUp) ? newUp : [newUp];
                          setUploads(prev => {
                            const newIds = new Set(items.map(i => String(i?.id)));
                            return [...items, ...prev.filter(u => u && !newIds.has(String(u?.id)))];
                          });
                        }
                        if (typeof fetchDepartmentUploads === 'function') fetchDepartmentUploads();
                        if (typeof fetchCourses === 'function') fetchCourses();
                        if (typeof fetchCatalogBooks === 'function') fetchCatalogBooks();
                        const titleText = Array.isArray(newUp)
                          ? `${newUp.length} books`
                          : (newUp?.title || 'Batch');
                        setSuccessMsg(`✓ Resource "${titleText}" synchronized with the Central Library Database!`);
                      }}
                    />
                  </div>
                )}

                {/* MODE 2: SINGLE BOOK / MATERIAL UPLOAD FORM (DB-CONNECTED & MANUALLY EDITABLE) */}
                {overviewUploadMode === 'single' && (
                <form onSubmit={handleQuickUploadSubmit} className="space-y-4 animate-fadeIn">
                  {/* Live Database Datalists for Single Form */}
                  <datalist id="overview-db-titles-list">
                    {Array.from(new Set(uploads.map(u => u.title).filter(Boolean))).map((t, idx) => (
                      <option key={`ov-title-${idx}`} value={t} />
                    ))}
                  </datalist>
                  <datalist id="overview-db-authors-list">
                    {Array.from(new Set([
                      currentDept.hod_name || currentDept.hod,
                      `${currentDept.name} Faculty Unit`,
                      ...uploads.map(u => u.author),
                      ...courses.map(c => c.lecturer)
                    ].filter(Boolean))).map((a, idx) => (
                      <option key={`ov-author-${idx}`} value={a} />
                    ))}
                  </datalist>
                  <datalist id="overview-db-courses-list">
                    {Array.from(new Set([
                      ...courses.map(c => c.code),
                      ...uploads.map(u => u.course_code)
                    ].filter(Boolean))).map((cCode, idx) => (
                      <option key={`ov-course-${idx}`} value={cCode} />
                    ))}
                  </datalist>
                  <datalist id="overview-db-levels-list">
                    {Array.from(new Set([
                      'ND I', 'ND II', 'HND I', 'HND II', 'All Levels', 'GNS (General Studies)', 'Post-HND / Staff',
                      ...uploads.map(u => u.target_level),
                      ...courses.map(c => c.level)
                    ].filter(Boolean))).map((lvl, idx) => (
                      <option key={`ov-lvl-${idx}`} value={lvl} />
                    ))}
                  </datalist>
                  <datalist id="overview-db-categories-list">
                    {Array.from(new Set([
                      'Lecture Handout / E-Book',
                      'Core Textbook Monograph',
                      'Past Exam Questions Compendium',
                      'Research Dissertation',
                      'Laboratory Guide',
                      'Academic Journal',
                      'Book',
                      ...uploads.map(u => u.resource_type)
                    ].filter(Boolean))).map((cat, idx) => (
                      <option key={`ov-cat-${idx}`} value={cat} />
                    ))}
                  </datalist>
                  <datalist id="overview-db-scopes-list">
                    {Array.from(new Set([
                      'Public Institution-Wide',
                      'Restricted to Department Students Only',
                      `Departmental Only (${currentDept.code} Students)`,
                      ...uploads.map(u => u.access_scope)
                    ].filter(Boolean))).map((scp, idx) => (
                      <option key={`ov-scp-${idx}`} value={scp} />
                    ))}
                  </datalist>

                  {/* Fetch & Load Existing Database Book Bar */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <BookOpen size={15} className="text-teal-400 shrink-0" />
                      <span className="font-semibold">
                        {editingQuickUploadId
                          ? `Editing Database Book #${editingQuickUploadId} (Manual Override Active)`
                          : 'Create New Book or Load Existing Book from Database to Edit:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={editingQuickUploadId}
                        onChange={(e) => handleSelectExistingForQuickEdit(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500 max-w-xs"
                      >
                        <option value="">+ New Book / Material Upload</option>
                        {uploads.map(u => (
                          <option key={u.id} value={u.id}>
                            [{u.course_code || currentDept.code}] {u.title} ({u.author || 'Faculty'})
                          </option>
                        ))}
                      </select>
                      {editingQuickUploadId && (
                        <button
                          type="button"
                          onClick={() => handleSelectExistingForQuickEdit('')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Reset to New
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Two-Column Document & Cover Artwork Upload Zone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Main PDF / Monograph Document */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingFile(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleQuickFileSelected(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => quickFileInputRef.current?.click()}
                      className={`p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition group flex flex-col items-center justify-center min-h-[150px] relative ${
                        isDraggingFile
                          ? 'border-teal-400 bg-teal-950/40 ring-2 ring-teal-500/50'
                          : 'border-teal-500/30 hover:border-teal-500/60 bg-slate-950/60'
                      }`}
                    >
                      <input
                        type="file"
                        ref={quickFileInputRef}
                        onChange={(e) => e.target.files && handleQuickFileSelected(e.target.files[0])}
                        accept=".pdf,.epub,.docx,.txt"
                        className="hidden"
                      />
                      <div className="p-3 rounded-2xl bg-teal-950/80 text-teal-400 border border-teal-800/80 group-hover:scale-110 transition shrink-0">
                        <Upload size={24} />
                      </div>
                      <div className="mt-2.5 text-xs font-bold text-white">
                        {quickUploadForm.file_name ? (
                          <div className="space-y-0.5">
                            <span className="text-teal-300 flex items-center justify-center gap-1">
                              <CheckCircle size={13} className="text-teal-400" />
                              <span>{quickUploadForm.file_name}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">Document Attached Ready for Upload</span>
                          </div>
                        ) : (
                          <span>Click or Drag & Drop PDF / Manuscript</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">PDF, EPUB, DOCX (Up to 50 MB)</p>
                    </div>

                    {/* 2. Cover Image Artwork Box */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCover(true); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingCover(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingCover(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleQuickCoverSelected(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`p-4 rounded-2xl border-2 border-dashed transition group relative min-h-[150px] flex items-center justify-center ${
                        isDraggingCover
                          ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/50'
                          : 'border-emerald-500/30 hover:border-emerald-500/60 bg-slate-950/60'
                      }`}
                    >
                      <input
                        type="file"
                        ref={quickCoverInputRef}
                        onChange={(e) => e.target.files && handleQuickCoverSelected(e.target.files[0])}
                        accept="image/*,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                      />
                      {quickUploadForm.cover_image ? (
                        <div className="flex items-center gap-4 w-full p-1">
                          {/* Book Ratio Cover Mockup */}
                          <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl shrink-0 bg-slate-900 relative">
                            <img
                              src={quickUploadForm.cover_image}
                              alt="Front Cover Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/fcc-logo.png';
                              }}
                            />
                            {/* Spine overlay */}
                            <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
                            {/* Sheen */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2 text-left">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <CheckCircle size={15} />
                              <span>Front Cover Artwork Attached</span>
                            </div>
                            <p className="text-xs text-white truncate font-medium">
                              {quickUploadForm.cover_name || 'Front Cover Picture'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ✓ Synchronizes to OPAC, Student Catalog, and Reader
                            </p>
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickCoverInputRef.current?.click();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
                              >
                                <RefreshCw size={11} />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickUploadForm(prev => ({ ...prev, cover_image: '', cover_name: '' }));
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition border border-rose-800/60"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => quickCoverInputRef.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer py-2"
                        >
                          <div className="p-3 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 group-hover:scale-110 transition shrink-0">
                            <Image size={24} />
                          </div>
                          <div className="mt-2.5 text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Upload Front Cover Artwork</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-normal">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            PNG, JPG, WEBP (Drag & drop or click to browse)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Intelligent Compression Widget Feedback */}
                  {(quickUploadRawFile || quickUploadIsCompressing || quickUploadCompressionResult) && (
                    <PdfOptimizerWidget
                      compressionResult={quickUploadCompressionResult}
                      isCompressing={quickUploadIsCompressing}
                      progress={quickUploadProgress}
                      activePreset={quickUploadPreset}
                      onSelectPreset={(p) => setQuickUploadPreset(p)}
                      onRecompress={(p) => quickUploadRawFile && handleQuickFileSelected(quickUploadRawFile, p)}
                      onPreviewPdf={(url) => setQuickUploadPreviewPdf(url)}
                      themeColor="#0d9488"
                      accentColor="#2dd4bf"
                    />
                  )}

                  {/* Form Inputs Grid — All 6 Requested Fields Connected to DB & Manually Editable */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                    {/* 1. Book / Material Title * */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Book / Material Title *</label>
                      <input
                        type="text"
                        list="overview-db-titles-list"
                        placeholder="e.g. Cooperative Econometrics & Statistical Analysis"
                        value={quickUploadForm.title}
                        onChange={e => setQuickUploadForm({ ...quickUploadForm, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* 2. Author / Faculty Unit * */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Author / Faculty Unit *</label>
                      <input
                        type="text"
                        list="overview-db-authors-list"
                        placeholder="e.g. Dr. Mrs. F. A. Babalola"
                        value={quickUploadForm.author}
                        onChange={e => setQuickUploadForm({ ...quickUploadForm, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* 3. Course Code */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Code</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          list="overview-db-courses-list"
                          placeholder="e.g. CEM 411"
                          value={quickUploadForm.course_code}
                          onChange={e => setQuickUploadForm({ ...quickUploadForm, course_code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                        />
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) setQuickUploadForm({ ...quickUploadForm, course_code: e.target.value });
                          }}
                          className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                          title="Select Course Code from Database"
                        >
                          <option value="">DB Courses</option>
                          {Array.from(new Set([...courses.map(c => c.code), ...uploads.map(u => u.course_code)].filter(Boolean))).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 4. Target Academic Level */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Target Academic Level</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          list="overview-db-levels-list"
                          placeholder="e.g. ND I, ND II, HND I, HND II"
                          value={quickUploadForm.target_level}
                          onChange={e => setQuickUploadForm({ ...quickUploadForm, target_level: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-medium"
                        />
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) setQuickUploadForm({ ...quickUploadForm, target_level: e.target.value });
                          }}
                          className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:border-teal-500 focus:outline-none"
                          title="Select Target Academic Level from Database"
                        >
                          <option value="">DB Levels</option>
                          <option value="ND I">ND I</option>
                          <option value="ND II">ND II</option>
                          <option value="HND I">HND I</option>
                          <option value="HND II">HND II</option>
                          <option value="All Levels">All Levels</option>
                          <option value="GNS (General Studies)">GNS</option>
                          <option value="Post-HND / Staff">Post-HND / Staff</option>
                        </select>
                      </div>
                    </div>

                    {/* 5. Resource Category (Default: Lecture Handout / E-Book) */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Resource Category</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          list="overview-db-categories-list"
                          placeholder="Lecture Handout / E-Book"
                          value={quickUploadForm.resource_type}
                          onChange={e => setQuickUploadForm({ ...quickUploadForm, resource_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-medium"
                        />
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) setQuickUploadForm({ ...quickUploadForm, resource_type: e.target.value });
                          }}
                          className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:border-teal-500 focus:outline-none"
                          title="Select Resource Category from Database"
                        >
                          <option value="">Categories</option>
                          <option value="Lecture Handout / E-Book">Lecture Handout / E-Book</option>
                          <option value="Core Textbook Monograph">Core Textbook Monograph</option>
                          <option value="Past Exam Questions Compendium">Past Exam Questions Compendium</option>
                          <option value="Research Dissertation">Research Dissertation</option>
                          <option value="Laboratory Guide">Laboratory Guide</option>
                        </select>
                      </div>
                    </div>

                    {/* 6. Student Access Scope */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Student Access Scope</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          list="overview-db-scopes-list"
                          placeholder="Public Institution-Wide"
                          value={quickUploadForm.access_scope}
                          onChange={e => setQuickUploadForm({ ...quickUploadForm, access_scope: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none font-medium"
                        />
                        <select
                          value=""
                          onChange={e => {
                            if (e.target.value) setQuickUploadForm({ ...quickUploadForm, access_scope: e.target.value });
                          }}
                          className="w-28 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] focus:border-teal-500 focus:outline-none"
                          title="Select Student Access Scope from Database"
                        >
                          <option value="">Scopes</option>
                          <option value="Public Institution-Wide">Public Institution-Wide</option>
                          <option value="Restricted to Department Students Only">Restricted to Department Students Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      ✓ Connected to Backend API (`/api/department-uploads`) — Select from DB or edit any field manually.
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmittingQuickUpload}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950 transition disabled:opacity-50"
                    >
                      {isSubmittingQuickUpload ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving to Database...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{editingQuickUploadId ? `Update Book #${editingQuickUploadId} in Database` : 'Save & Submit to Database'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                )}
              </div>

              {/* Department Key Metrics Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div
                  onClick={() => {
                    const el = document.getElementById('department-catalog-holdings-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/40 hover:border-teal-400 cursor-pointer transition space-y-2 group shadow-lg"
                >
                  <div className="flex items-center justify-between text-teal-400">
                    <span className="text-xs font-semibold">Department Books</span>
                    <BookOpen size={18} className="group-hover:scale-110 transition" />
                  </div>
                  <div className="text-2xl font-black text-white">{currentDeptCatalogBooks.length}</div>
                  <div className="text-[11px] text-teal-300 font-mono">HOD Uploaded Books</div>
                </div>

                <div
                  onClick={() => handleTabSwitch('scholars')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Active Scholars</span>
                    <Users size={16} className="text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{scholarsList.length}</div>
                  <div className="text-[11px] text-teal-400 font-mono">Registered Students</div>
                </div>

                <div
                  onClick={() => handleTabSwitch('courses')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Courses & Syllabi</span>
                    <BookOpen size={16} className="text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{courses.length}</div>
                  <div className="text-[11px] text-indigo-400 font-mono">Curriculum Modules</div>
                </div>

                <div
                  onClick={() => handleTabSwitch('dissertations')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Theses & Dissertations</span>
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-300">{dissertations.length}</div>
                  <div className="text-[11px] text-amber-400 font-mono">Archived & Review</div>
                </div>

                <div
                  onClick={() => handleTabSwitch('reserves')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Books on Reserve</span>
                    <Bookmark size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{reservesList.length}</div>
                  <div className="text-[11px] text-emerald-400 font-mono">2-Hour Reading Desk</div>
                </div>
              </div>

              {/* Department Books & Institutional Catalog Holdings Section */}
              <div id="department-catalog-holdings-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Background decorative ambient glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Section Header with Live API Sync Status */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-slate-800/80 pb-5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-teal-950 text-teal-400 border border-teal-700/60 shadow-lg shadow-teal-950/40">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex flex-wrap items-center gap-2.5">
                        <span>HOD Uploaded Books & Curriculum Holdings</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-700">
                          {filteredDeptCatalogBooks.length} {hodBooksScope === 'all' ? 'Institutional Uploads' : `Books in ${currentDept.code}`}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Database API
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Authentic textbooks, course monographs, and syllabi uploaded by Heads of Department. Streamed in full binary fidelity directly from the institutional library database.
                      </p>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="flex items-center gap-2.5 self-start xl:self-center">
                    <button
                      onClick={() => handleTabSwitch('studio')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-teal-950/50 active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Upload New Book as HOD</span>
                    </button>
                    <button
                      onClick={() => fetchCatalogBooks()}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                      title="Sync and refresh books from database"
                    >
                      <RefreshCw size={14} className={isLoadingCatalogBooks ? 'animate-spin text-teal-400' : ''} />
                    </button>
                  </div>
                </div>

                {/* Interactive Multi-Dimensional Filter Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  {/* Left: Scope & Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Department Scope Selector */}
                    <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        onClick={() => {
                          setHodBooksScope('dept');
                          fetchCatalogBooks('dept');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          hodBooksScope === 'dept'
                            ? 'bg-teal-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📍 My Dept ({currentDept.code})
                      </button>
                      <button
                        onClick={() => {
                          setHodBooksScope('all');
                          fetchCatalogBooks('all');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          hodBooksScope === 'all'
                            ? 'bg-teal-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🌐 All HOD Uploads
                      </button>
                    </div>

                    {/* Status Filter */}
                    <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setHodBooksStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          hodBooksStatusFilter === 'all'
                            ? 'bg-slate-800 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHodBooksStatusFilter('approved')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                          hodBooksStatusFilter === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Published
                      </button>
                      <button
                        onClick={() => setHodBooksStatusFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                          hodBooksStatusFilter === 'pending'
                            ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        In Review
                      </button>
                    </div>

                    {/* Academic Level Filter */}
                    <select
                      value={hodBooksLevelFilter}
                      onChange={(e) => setHodBooksLevelFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    >
                      <option value="all">All Academic Levels</option>
                      <option value="ND I">ND I</option>
                      <option value="ND II">ND II</option>
                      <option value="HND I">HND I</option>
                      <option value="HND II">HND II</option>
                    </select>
                  </div>

                  {/* Right: Search & View Mode Switcher */}
                  <div className="flex items-center gap-2">
                    {/* Search inside department books */}
                    <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={deptBookSearchQuery}
                        onChange={(e) => setDeptBookSearchQuery(e.target.value)}
                        placeholder="Search title, author, course code..."
                        className="w-full pl-9 pr-7 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                      />
                      {deptBookSearchQuery && (
                        <button
                          onClick={() => setDeptBookSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* View Mode Toggle: Grid vs Table */}
                    <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setHodBooksViewMode('grid')}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          hodBooksViewMode === 'grid'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="3D Book Cards Grid View"
                      >
                        <Layers size={14} />
                      </button>
                      <button
                        onClick={() => setHodBooksViewMode('table')}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          hodBooksViewMode === 'table'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Enterprise Dense Table View"
                      >
                        <FileSpreadsheet size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Render: Empty State vs Grid vs Table */}
                {filteredDeptCatalogBooks.length === 0 ? (
                  <div className="p-12 text-center bg-slate-950/70 rounded-2xl border border-dashed border-slate-800 space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <BookOpen size={28} />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-base font-bold text-slate-200">
                        {deptBookSearchQuery
                          ? `No HOD books found matching "${deptBookSearchQuery}"`
                          : hodBooksScope === 'dept'
                          ? `No Uploaded Books Found for ${currentDept.name} (${currentDept.code})`
                          : 'No HOD Books Found in Database'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {hodBooksScope === 'dept'
                          ? `The Head of Department for ${currentDept.name} has not published curriculum textbooks yet, or submissions are currently in queue.`
                          : 'No HOD departmental uploads currently match the active filters.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {hodBooksScope === 'dept' && catalogBooks.length > 0 && (
                        <button
                          onClick={() => {
                            setHodBooksScope('all');
                            fetchCatalogBooks('all');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                        >
                          View All HOD Uploads Across Polytechnic ({catalogBooks.length})
                        </button>
                      )}
                      <button
                        onClick={() => handleTabSwitch('studio')}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-950"
                      >
                        <Plus size={14} />
                        <span>Upload Textbook for {currentDept.code}</span>
                      </button>
                    </div>
                  </div>
                ) : hodBooksViewMode === 'grid' ? (
                  /* 3D Realistic Showcase Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredDeptCatalogBooks.map((book, idx) => {
                      const coverUrl = book.cover_image || book.coverImage || book.cover || '/assets/fcc-logo.png';
                      const isApproved = book.status === 'approved' || book.is_published;
                      const downloadUrl = book.id ? `/api/books/${encodeURIComponent(book.id)}/pdf/download` : `${book.pdfUrl || book.file_url || `/api/catalog/${book.id}/file`}?download=1`;

                      return (
                        <div
                          key={book.id || book.upload_id || idx}
                          className="bg-slate-950 rounded-2xl border border-slate-800/90 p-4 flex flex-col justify-between space-y-3.5 hover:border-teal-500/60 hover:shadow-2xl hover:shadow-teal-950/30 transition group relative overflow-hidden"
                        >
                          {/* 3D Realistic Cover Artwork Presentation */}
                          <div
                            onClick={() => setActiveReaderBook(book)}
                            className="w-full h-52 rounded-xl overflow-hidden relative shadow-2xl shadow-black border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 group-hover:border-teal-500/70 transition cursor-pointer"
                            title="Click to Open and Read Full Textbook in E-Reader"
                          >
                            <img
                              src={coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/fcc-logo.png';
                              }}
                            />
                            {/* Realistic Textbook Spine Shadow */}
                            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none" />
                            {/* Subtle Glossy Foil Sheen */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                            {/* Corner Badges */}
                            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono bg-black/85 backdrop-blur-md text-teal-300 border border-teal-500/50 shadow">
                                {book.course_code || book.courseCode || currentDept.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[8px] font-bold font-mono border backdrop-blur-md shadow ${
                                  isApproved
                                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60'
                                    : 'bg-amber-950/90 text-amber-300 border-amber-600/60'
                                }`}
                              >
                                {isApproved ? '✓ PUBLISHED' : '⏳ IN REVIEW'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-indigo-950/90 text-indigo-300 border border-indigo-600/50">
                                {book.target_level || book.targetLevel || 'CURRICULUM'}
                              </span>
                            </div>

                            {/* Hover Overlay with Primary CTA */}
                            <div className="absolute inset-0 bg-teal-950/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center p-4">
                              <span className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition">
                                <BookOpen size={15} />
                                <span>Read Full PDF</span>
                              </span>
                            </div>
                          </div>

                          {/* Bibliographic Details */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="text-teal-400 truncate max-w-[140px] font-semibold">
                                {book.call_number || book.callNumber || `FCC-HOD-${book.id}`}
                              </span>
                              <span>{book.year || '2026'}</span>
                            </div>

                            <h4
                              onClick={() => setActiveReaderBook(book)}
                              className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-teal-300 transition cursor-pointer"
                              title={book.title}
                            >
                              {book.title}
                            </h4>

                            <p className="text-[11px] text-slate-400 truncate">
                              By {book.author || book.uploaded_by || 'HOD Scholar'}
                            </p>

                            <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900">
                              <span className="truncate max-w-[130px] text-slate-400">
                                {book.department || currentDept.name}
                              </span>
                              <span className="text-teal-400 font-mono font-medium">
                                HOD Upload
                              </span>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2.5 border-t border-slate-900 flex items-center gap-1.5">
                            <button
                              onClick={() => setActiveReaderBook(book)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-950 transition active:scale-95"
                              title="Open and Read Full Binary PDF"
                            >
                              <BookOpen size={13} />
                              <span>Read</span>
                            </button>
                            <a
                              href={downloadUrl}
                              download
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                              title="Download Full PDF File"
                            >
                              <Download size={13} />
                            </a>
                            <button
                              onClick={() => setSelectedCatalogBookDossier(book)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                              title="Inspect Bibliographic Record & Metadata"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubmission(book.upload_id || book.id, book.title)}
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-900/60 transition"
                              title="Withdraw and Delete Book from Database"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Enterprise Tabular View */
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Book & Author</th>
                          <th className="py-3 px-3 font-semibold">Course & Level</th>
                          <th className="py-3 px-3 font-semibold">Department</th>
                          <th className="py-3 px-3 font-semibold">Classification</th>
                          <th className="py-3 px-3 font-semibold text-center">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {filteredDeptCatalogBooks.map((book, idx) => {
                          const isApproved = book.status === 'approved' || book.is_published;
                          const downloadUrl = book.id ? `/api/books/${encodeURIComponent(book.id)}/pdf/download` : `${book.pdfUrl || book.file_url || `/api/catalog/${book.id}/file`}?download=1`;

                          return (
                            <tr key={book.id || idx} className="hover:bg-slate-900/50 transition">
                              <td className="py-3 px-4 font-sans">
                                <div className="flex items-center gap-3">
                                  <div
                                    onClick={() => setActiveReaderBook(book)}
                                    className="w-10 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 cursor-pointer shadow"
                                  >
                                    <img
                                      src={book.cover_image || book.coverImage || '/assets/fcc-logo.png'}
                                      alt={book.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/assets/fcc-logo.png';
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div
                                      onClick={() => setActiveReaderBook(book)}
                                      className="font-bold text-white hover:text-teal-300 cursor-pointer truncate max-w-xs sm:max-w-md"
                                      title={book.title}
                                    >
                                      {book.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      By {book.author || book.uploaded_by || 'HOD Scholar'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-sans">
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-teal-950 text-teal-300 border border-teal-800">
                                    {book.course_code || book.courseCode || currentDept.code}
                                  </span>
                                  <div className="text-[10px] text-slate-400">
                                    {book.target_level || book.targetLevel || 'Curriculum'}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-sans text-slate-300">
                                {book.department || currentDept.name}
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  <div className="text-teal-400 font-semibold">{book.call_number || `FCC-HOD-${book.id}`}</div>
                                  <div className="text-[10px] text-slate-400 font-sans">{book.shelf_location || 'E-Library'}</div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                    isApproved
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                                      : 'bg-amber-950 text-amber-300 border-amber-700/60'
                                  }`}
                                >
                                  {isApproved ? 'PUBLISHED' : 'IN REVIEW'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setActiveReaderBook(book)}
                                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                                  >
                                    <BookOpen size={12} />
                                    <span>Read</span>
                                  </button>
                                  <a
                                    href={downloadUrl}
                                    download
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                    title="Download File"
                                  >
                                    <Download size={13} />
                                  </a>
                                  <button
                                    onClick={() => setSelectedCatalogBookDossier(book)}
                                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                    title="Inspect Dossier"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubmission(book.upload_id || book.id, book.title)}
                                    className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-white transition"
                                    title="Withdraw / Delete"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Department Upload Submissions Pipeline Gallery */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>HOD Upload Submissions Pipeline</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {uploads.length} In Review
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Track syllabus monographs and materials submitted by HOD for Central Library Directorate approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTabSwitch('submissions')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Layers size={13} />
                      <span>Full Submissions Queue</span>
                    </button>
                    <button
                      onClick={fetchDepartmentUploads}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Refresh uploads from database"
                    >
                      <RefreshCw size={13} className={isLoadingUploads ? 'animate-spin text-indigo-400' : ''} />
                    </button>
                  </div>
                </div>

                {uploads.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 space-y-2">
                    <BookOpen size={28} className="mx-auto text-slate-600" />
                    <h4 className="text-sm font-bold text-slate-300">No New Uploads Pending in Pipeline</h4>
                    <p className="text-xs text-slate-500">
                      Use the Quick Upload form above to submit new textbooks, lecture notes, or past papers to the library catalog.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {uploads.slice(0, 8).map((up, idx) => {
                      const isApproved = up.status === 'approved';
                      const isRejected = up.status === 'rejected';

                      return (
                        <div
                          key={up.id || idx}
                          className="bg-slate-950 rounded-2xl border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3 hover:border-indigo-500/50 hover:shadow-xl transition group relative overflow-hidden"
                        >
                          {/* Front Cover Artwork Presentation */}
                          <div className="w-full h-40 rounded-xl overflow-hidden relative shadow-lg shadow-black/80 border border-slate-800 bg-slate-900 group-hover:border-indigo-500/60 transition">
                            {up.cover_image ? (
                              <img
                                src={up.cover_image}
                                alt={up.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/fcc-logo.png';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full p-3 flex flex-col justify-between text-left relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
                                <div className="space-y-1 relative z-10">
                                  <span className="text-[7.5px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                                    FCC • {currentDept.code}
                                  </span>
                                  <div className="h-0.5 w-4 bg-indigo-400 rounded-full" />
                                  <h4 className="text-[10px] font-bold text-white line-clamp-3 leading-snug font-serif">
                                    {up.title}
                                  </h4>
                                </div>
                                <div className="relative z-10 text-[8px] text-slate-400 font-mono truncate">
                                  {up.author}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                            <div className="absolute top-2 right-2 z-10">
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono bg-black/80 backdrop-blur-sm text-indigo-300 border border-indigo-500/40 shadow">
                                {up.course_code || currentDept.code}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isApproved
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : isRejected
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                              }`}>
                                {isApproved ? '✓ Published in Catalog' : (isRejected ? '✕ Declined' : '● Pending Review')}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {up.target_level || 'HND II'}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition">
                              {up.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              By {up.author}
                            </p>
                          </div>

                          {/* Cover Actions Footer */}
                          <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-1 text-[11px]">
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 text-[10px] font-semibold transition border border-indigo-500/30 hover:border-indigo-400 flex items-center gap-1">
                              <Image size={11} />
                              <span>{up.cover_image ? 'Update Cover' : 'Attach Cover'}</span>
                              <input
                                type="file"
                                accept="image/*,.png,.jpg,.jpeg,.webp"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleAttachCoverToUpload(up.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>

                            <button
                              onClick={() => handleTabSwitch('submissions')}
                              className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-0.5"
                            >
                              <span>Details</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    View and register accredited modules directly to the SQLite courses catalog.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('reserves')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2"
                >
                  <Bookmark size={20} className="text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Course Reserves Desk</h4>
                  <p className="text-xs text-slate-400">
                    Designate high-demand textbooks on restricted 2-hour reserve desk in the central database.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('communication')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2"
                >
                  <MessageSquare size={20} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Tri-Party Dispatch</h4>
                  <p className="text-xs text-slate-400">
                    Collaborate live with the Central College Librarian and student scholars via official dispatch.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('staff_builder')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition cursor-pointer space-y-2 group"
                >
                  <Sliders size={20} className="text-teal-400 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Staff Page &amp; Access Builder</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">RBAC</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Create custom departmental staff pages and configure granular operational access permissions.
                  </p>
                </div>

                <div
                  onClick={() => handleTabSwitch('staff_workspace')}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer space-y-2 group"
                >
                  <Users size={20} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Delegated Staff Workspaces</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">{staffList.length} Active</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Switch into live workspaces for departmental lecturers, project supervisors, and clearance officers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: COURSES & SYLLABI TAB (#/hod/courses) */}
          {/* ============================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Floating or Top Toast Notification */}
              {courseNotification && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fadeIn ${
                  courseNotification.type === 'error'
                    ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                    : 'bg-teal-950/90 border-teal-800 text-teal-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {courseNotification.type === 'error' ? <AlertCircle size={16} className="text-rose-400" /> : <CheckCircle size={16} className="text-teal-400" />}
                    <span>{courseNotification.message}</span>
                  </div>
                  <button onClick={() => setCourseNotification(null)} className="text-slate-400 hover:text-white p-1">
                    <XCircle size={15} />
                  </button>
                </div>
              )}

              {/* 1. Header Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      {currentDept.code} CURRICULUM & SYLLABI
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live SQLite & MySQL Synced
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Departmental Course Syllabi & Reserve Reading Lists</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Accredited curriculum modules for {currentDept.name}. Direct link between academic courses, prescribed reading reserves, and digital library textbooks.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={fetchCourses}
                    disabled={isLoadingCourses}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/60"
                    title="Refresh courses from database"
                  >
                    <RefreshCw size={13} className={isLoadingCourses ? 'animate-spin text-teal-400' : ''} />
                    <span>{isLoadingCourses ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddCourseModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-950 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Register New Course</span>
                  </button>
                </div>
              </div>

              {/* 1b. Live HOD Book Holdings Stats (from /api/hod/courses) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Registered Courses', value: hodCourseStats?.courses ?? courses.length, icon: Layers, tone: 'text-slate-200', ring: 'border-slate-800' },
                  { label: 'Courses with HOD Books', value: hodCourseStats?.courses_with_books ?? courses.filter(c => (c.hodBooks || []).length > 0).length, icon: BookCheck, tone: 'text-teal-300', ring: 'border-teal-900/70' },
                  { label: 'HOD-Uploaded Books', value: hodCourseStats?.total_books ?? 0, icon: BookOpen, tone: 'text-indigo-300', ring: 'border-indigo-900/70' },
                  { label: 'Published', value: hodCourseStats?.published ?? 0, icon: CheckCircle, tone: 'text-emerald-300', ring: 'border-emerald-900/70' },
                  { label: 'In Review', value: hodCourseStats?.pending ?? 0, icon: Clock, tone: 'text-amber-300', ring: 'border-amber-900/70' },
                  { label: 'Unassigned to Course', value: hodCourseStats?.unassigned ?? hodUnassignedBooks.length, icon: AlertTriangle, tone: 'text-rose-300', ring: 'border-rose-900/70' }
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className={`p-4 rounded-2xl bg-slate-900 border ${stat.ring} flex items-center gap-3 hover:-translate-y-0.5 transition`}>
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        <Icon size={16} className={stat.tone} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xl font-black font-mono leading-none ${stat.tone}`}>{isLoadingCourses && !hodCourseStats ? '…' : stat.value}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1 truncate">{stat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {hodCoursesSyncedAt && (
                <p className="text-[10px] text-slate-500 -mt-3 px-1 font-mono">
                  Source: GET /api/hod/courses · HOD uploads only · synced {new Date(hodCoursesSyncedAt).toLocaleTimeString()}
                </p>
              )}

              {/* Add Course Modal */}
              {showAddCourseModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-teal-400" />
                      <span>Register New Academic Course in Database ({currentDept.code})</span>
                    </h4>
                    <button
                      onClick={() => setShowAddCourseModal(false)}
                      className="text-xs text-slate-400 hover:text-white p-1"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Code *</label>
                      <input
                        type="text"
                        placeholder={`e.g. ${currentDept.code} 315`}
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
                        <option value="ND I">ND I</option>
                        <option value="ND II">ND II</option>
                        <option value="HND I">HND I</option>
                        <option value="HND II">HND II</option>
                        <option value="GNS">GNS (General Studies)</option>
                        <option value="Post-HND">Post-HND</option>
                        <option value="Other">Other</option>
                      </select>
                      {newCourseForm.level === 'Other' && (
                        <input
                          type="text"
                          placeholder="Specify custom level..."
                          value={courseCustomLevel}
                          onChange={e => setCourseCustomLevel(e.target.value)}
                          className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-teal-500/50 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                          required
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                      <select
                        value={newCourseForm.semester}
                        onChange={e => setNewCourseForm({ ...newCourseForm, semester: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option value="First Semester">First Semester</option>
                        <option value="Second Semester">Second Semester</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Course Lecturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. A. Adebayo"
                        value={newCourseForm.lecturer}
                        onChange={e => setNewCourseForm({ ...newCourseForm, lecturer: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Curriculum Syllabus Overview</label>
                      <input
                        type="text"
                        placeholder="Key competencies, laboratory sessions, or learning outcomes..."
                        value={newCourseForm.syllabus}
                        onChange={e => setNewCourseForm({ ...newCourseForm, syllabus: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddCourseModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-950 transition"
                      >
                        Save Course to Database
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Search & Level/Semester Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Level Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'All', label: 'All Levels', count: courseCounts.all },
                      { id: 'ND I', label: 'ND I', count: courseCounts.nd1 },
                      { id: 'ND II', label: 'ND II', count: courseCounts.nd2 },
                      { id: 'HND I', label: 'HND I', count: courseCounts.hnd1 },
                      { id: 'HND II', label: 'HND II', count: courseCounts.hnd2 }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { sounds.playClick(); setCourseLevelFilter(tab.id); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          courseLevelFilter === tab.id
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          courseLevelFilter === tab.id ? 'bg-teal-800 text-teal-100' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Semester Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Semester:</span>
                    <select
                      value={courseSemesterFilter}
                      onChange={e => setCourseSemesterFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none font-medium"
                    >
                      <option value="All">All Semesters</option>
                      <option value="First Semester">First Semester</option>
                      <option value="Second Semester">Second Semester</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={courseSearchTerm}
                    onChange={e => setCourseSearchTerm(e.target.value)}
                    placeholder="Search courses by code, title, assigned lecturer, syllabus keywords..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-teal-500 focus:outline-none transition"
                  />
                  {courseSearchTerm && (
                    <button
                      onClick={() => setCourseSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Active Filter Summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Showing <strong className="text-white font-mono">{filteredCourses.length}</strong> of <strong className="text-white font-mono">{courses.length}</strong> accredited modules
                    </span>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setCourseBooksOnly(v => !v); }}
                      aria-pressed={courseBooksOnly}
                      className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 border transition ${
                        courseBooksOnly
                          ? 'bg-teal-600 text-white border-teal-500 shadow shadow-teal-950'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-teal-700'
                      }`}
                    >
                      <BookCheck size={12} />
                      <span>With HOD Books Only</span>
                    </button>
                  </div>
                  {(courseLevelFilter !== 'All' || courseSemesterFilter !== 'All' || courseSearchTerm.trim() || courseBooksOnly) && (
                    <button
                      onClick={() => {
                        setCourseLevelFilter('All');
                        setCourseSemesterFilter('All');
                        setCourseSearchTerm('');
                        setCourseBooksOnly(false);
                      }}
                      className="text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Courses Grid */}
              {filteredCourses.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <BookOpen size={36} className="mx-auto text-slate-600" />
                  <h4 className="text-base font-bold text-white">
                    {courses.length === 0 ? 'No Courses Registered in Database for this Department' : 'No Courses Match Your Filter Criteria'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {courses.length === 0
                      ? 'Click "Register New Course" above to add accredited curriculum modules and reserve reading lists directly into the SQLite database.'
                      : 'Try broadening your search term or reset the academic level and semester filters.'}
                  </p>
                  {courses.length > 0 && (
                    <button
                      onClick={() => {
                        setCourseLevelFilter('All');
                        setCourseSemesterFilter('All');
                        setCourseSearchTerm('');
                        setCourseBooksOnly(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((c, idx) => {
                    const cCode = c.code || '';
                    // Only books HODs uploaded for this exact course (served by /api/hod/courses)
                    const normCode = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                    const linkedBooks = Array.isArray(c.hodBooks)
                      ? c.hodBooks
                      : catalogBooks.filter(b => normCode(b.course_code || b.courseCode) === normCode(cCode) && normCode(cCode) !== '');
                    const publishedCount = linkedBooks.filter(b => b.status === 'approved' || b.is_published).length;
                    const reviewCount = linkedBooks.length - publishedCount;

                    return (
                      <div
                        key={c.code || idx}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-600/50 hover:shadow-xl hover:shadow-teal-950/20 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Badges row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-teal-950 text-teal-300 border border-teal-800/80 tracking-wider">
                              {c.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {c.level || 'HND II'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-teal-400 border border-teal-900/60">
                                {c.semester || 'First Semester'}
                              </span>
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition line-clamp-2">
                              {c.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                              <User size={12} className="text-teal-400 shrink-0" />
                              <span className="truncate">
                                Lecturer: <strong className="text-slate-200">{c.lecturer || currentDept.hod_name || currentDept.hod}</strong>
                              </span>
                            </p>
                          </div>

                          {/* Syllabus Snippet */}
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                            <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider mb-0.5">Syllabus Scope</span>
                            <p className="line-clamp-2 italic">
                              {c.syllabus || 'Comprehensive polytechnic curriculum module covering theoretical frameworks, practical laboratory case studies, and terminal semester examination requirements.'}
                            </p>
                          </div>

                          {/* HOD-Uploaded Books for this Course (only HOD uploads, fetched via API) */}
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                <BookOpen size={12} className="text-teal-400" />
                                <span>HOD-Uploaded Books:</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                  linkedBooks.length > 0
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {linkedBooks.length} {linkedBooks.length === 1 ? 'Book' : 'Books'}
                                </span>
                                {reviewCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-800" title="Awaiting librarian approval">
                                    {reviewCount} in review
                                  </span>
                                )}
                              </div>
                            </div>

                            {linkedBooks.length === 0 ? (
                              <div className="p-2.5 rounded-xl border border-dashed border-slate-800 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                                <span>No HOD book uploaded for {cCode} yet.</span>
                                <button
                                  onClick={() => { sounds.playClick(); handleTabSwitch('upload'); }}
                                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 shrink-0"
                                >
                                  <FileUp size={11} /> Upload
                                </button>
                              </div>
                            ) : (
                              <ul className="space-y-1.5">
                                {linkedBooks.slice(0, 3).map((book, bIdx) => {
                                  const isApproved = book.status === 'approved' || book.is_published;
                                  const downloadUrl = book.id ? `/api/books/${encodeURIComponent(book.id)}/pdf/download` : `${book.pdfUrl || book.file_url || `/api/catalog/${book.id}/file`}?download=1`;
                                  return (
                                    <li
                                      key={book.id || book.upload_id || bIdx}
                                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-teal-700/70 transition flex items-center gap-2.5 group/book"
                                    >
                                      <button
                                        onClick={() => setActiveReaderBook(book)}
                                        className="w-8 h-11 rounded-md overflow-hidden border border-slate-700 shrink-0 relative shadow-md shadow-black"
                                        title="Open in e-reader"
                                      >
                                        <img
                                          src={book.cover_image || book.coverImage || '/assets/fcc-logo.png'}
                                          alt=""
                                          loading="lazy"
                                          className="w-full h-full object-cover"
                                          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/fcc-logo.png'; }}
                                        />
                                        <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/80 to-transparent" />
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <button
                                          onClick={() => setActiveReaderBook(book)}
                                          className="block w-full text-left text-[11px] font-bold text-white truncate group-hover/book:text-teal-300 transition"
                                          title={book.title}
                                        >
                                          {book.title}
                                        </button>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isApproved ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                                          <span className="truncate">{isApproved ? 'Published' : 'In review'} · {book.author || book.uploaded_by || 'HOD'}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => setActiveReaderBook(book)}
                                          className="p-1.5 rounded-lg bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-800 transition"
                                          title="Read"
                                          aria-label={`Read ${book.title}`}
                                        >
                                          <Eye size={12} />
                                        </button>
                                        <a
                                          href={downloadUrl}
                                          className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                                          title="Download PDF"
                                          aria-label={`Download ${book.title}`}
                                        >
                                          <Download size={12} />
                                        </a>
                                      </div>
                                    </li>
                                  );
                                })}
                                {linkedBooks.length > 3 && (
                                  <li>
                                    <button
                                      onClick={() => { sounds.playClick(); setSelectedCourseSyllabusDossier({ course: c, linkedBooks }); }}
                                      className="w-full text-[10px] text-teal-400 hover:text-teal-300 font-bold py-1"
                                    >
                                      + {linkedBooks.length - 3} more HOD {linkedBooks.length - 3 === 1 ? 'book' : 'books'} — view all
                                    </button>
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setSelectedCourseSyllabusDossier({ course: c, linkedBooks });
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700/60"
                              title="Inspect full syllabus and HOD-uploaded books"
                            >
                              <FileText size={13} className="text-teal-400" />
                              <span>Syllabus Dossier</span>
                            </button>

                            <button
                              onClick={() => {
                                sounds.playClick();
                                handleTabSwitch('upload');
                              }}
                              className="py-2 px-3 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-300 font-bold text-xs flex items-center justify-center gap-1 border border-teal-800 transition"
                              title={`Upload a book for ${cCode}`}
                            >
                              <FileUp size={12} />
                              <span>Upload Book</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                            <button
                              onClick={() => handleOpenEditCourse(c)}
                              className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition"
                            >
                              <Edit size={12} className="text-teal-400" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCourse(c.code, c.title)}
                              disabled={deletingCourseCode === c.code}
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              <span>{deletingCourseCode === c.code ? 'Deleting...' : 'De-Register'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. HOD uploads whose course code is not a registered course */}
              {hodUnassignedBooks.length > 0 && (
                <section className="p-5 rounded-3xl bg-slate-900 border border-amber-900/60 space-y-3" aria-labelledby="hod-unassigned-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 id="hod-unassigned-heading" className="text-sm font-bold text-white flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-400" />
                        HOD Books Not Linked to a Registered Course ({hodUnassignedBooks.length})
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        These were uploaded by the HOD with a course code that isn't registered above. Register the course code to group them automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddCourseModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus size={12} /> Register Course
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {hodUnassignedBooks.map((book, uIdx) => (
                      <div key={book.id || book.upload_id || uIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                        <div className="min-w-0 flex-1">
                          <button onClick={() => setActiveReaderBook(book)} className="block w-full text-left text-[11px] font-bold text-white truncate hover:text-teal-300" title={book.title}>
                            {book.title}
                          </button>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {book.course_code || 'No course code'} · {book.status === 'approved' ? 'Published' : 'In review'}
                          </p>
                        </div>
                        <button onClick={() => setActiveReaderBook(book)} className="p-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900" title="Read">
                          <Eye size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: UPLOAD STUDIO TAB (#/hod/upload) */}
          {/* ============================================================== */}
          {activeTab === 'upload' && (
            <div className="animate-fadeIn">
              <HodUploadStudio
                user={uploadStudioUser}
                theme={theme}
                onUploadSuccess={(newUp) => {
                  if (newUp) {
                    const items = Array.isArray(newUp) ? newUp : [newUp];
                    setUploads(prev => {
                      const newIds = new Set(items.map(i => String(i?.id)));
                      return [...items, ...prev.filter(u => u && !newIds.has(String(u?.id)))];
                    });
                  }
                  if (typeof fetchDepartmentUploads === 'function') fetchDepartmentUploads();
                  if (typeof fetchCourses === 'function') fetchCourses();
                  if (typeof fetchCatalogBooks === 'function') fetchCatalogBooks();
                  const titleText = Array.isArray(newUp) ? `${newUp.length} books` : (newUp?.title || 'Resource');
                  setSuccessMsg(`✓ Resource "${titleText}" successfully synchronized with the Central Library!`);
                  handleTabSwitch('submissions');
                }}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: STAGING SUBMISSIONS TAB (#/hod/submissions) */}
          {/* ============================================================== */}
          {activeTab === 'submissions' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Floating or Top Toast Notification */}
              {submissionNotification && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fadeIn ${
                  submissionNotification.type === 'error'
                    ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                    : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {submissionNotification.type === 'error' ? <AlertCircle size={16} className="text-rose-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
                    <span>{submissionNotification.message}</span>
                  </div>
                  <button onClick={() => setSubmissionNotification(null)} className="text-slate-400 hover:text-white p-1">
                    <XCircle size={15} />
                  </button>
                </div>
              )}

              {/* 1. Header Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      {currentDept.code} ACADEMIC PIPELINE
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live SQLite & MySQL DB
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Department Resource Ingestion Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Status of curriculum syllabi, textbooks, monographs, and research dissertations submitted to the central library review database.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={fetchDepartmentUploads}
                    disabled={isLoadingUploads}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/60"
                    title="Refresh data from database"
                  >
                    <RefreshCw size={13} className={isLoadingUploads ? 'animate-spin text-teal-400' : ''} />
                    <span>{isLoadingUploads ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <button
                    onClick={() => handleTabSwitch('upload')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-950 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Upload New Resource</span>
                  </button>
                </div>
              </div>

              {/* 2. Filter & Search Controls Bar */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'All', label: 'All', count: submissionCounts.all },
                      { id: 'Pending', label: 'Pending Review', count: submissionCounts.pending, color: 'text-amber-300', dot: 'bg-amber-400' },
                      { id: 'Approved', label: 'Approved', count: submissionCounts.approved, color: 'text-emerald-300', dot: 'bg-emerald-400' },
                      { id: 'Rejected', label: 'Rejected', count: submissionCounts.rejected, color: 'text-rose-300', dot: 'bg-rose-400' }
                    ].map(tab => {
                      const isActive = filterType === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            sounds.playClick();
                            setFilterType(tab.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                          }`}
                        >
                          {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                          <span>{tab.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            isActive ? 'bg-teal-800 text-white' : 'bg-slate-950 text-slate-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Category Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 shrink-0">Category:</span>
                    <select
                      value={submissionCategoryFilter}
                      onChange={(e) => {
                        sounds.playClick();
                        setSubmissionCategoryFilter(e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:border-teal-500 focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="book">📚 Books & Monographs</option>
                      <option value="project">🎓 Student Projects / Theses</option>
                      <option value="journal">📰 Academic Journals</option>
                      <option value="handout">📄 Lecture Handouts</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={submissionSearchTerm}
                    onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                    placeholder="Search submissions by title, author, course code, call number, or submission ID..."
                    className="w-full px-4 py-2.5 pl-9 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500 transition shadow-inner font-medium"
                  />
                  {submissionSearchTerm && (
                    <button
                      onClick={() => setSubmissionSearchTerm('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Filter info indicator */}
                {(submissionSearchTerm || submissionCategoryFilter !== 'All' || filterType !== 'All') && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>
                      Showing <strong className="text-white">{filteredSubmissions.length}</strong> of <strong className="text-white">{uploads.length}</strong> submissions in pipeline
                    </span>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setFilterType('All');
                        setSubmissionCategoryFilter('All');
                        setSubmissionSearchTerm('');
                      }}
                      className="text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Action & Selection Bar */}
              {filteredSubmissions.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedSubmissionIds.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={toggleSelectAllSubmissions}
                        className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-700 focus:ring-teal-500 cursor-pointer"
                      />
                      <span>Select All ({filteredSubmissions.length})</span>
                    </label>
                    {selectedSubmissionIds.size > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-teal-950 text-teal-300 border border-teal-800">
                        {selectedSubmissionIds.size} selected
                      </span>
                    )}
                  </div>

                  {selectedSubmissionIds.size > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBulkDeleteSubmissions}
                        disabled={isBulkDeletingSubmissions}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={13} className={isBulkDeletingSubmissions ? 'animate-spin' : ''} />
                        <span>{isBulkDeletingSubmissions ? 'Deleting...' : `Delete Selected (${selectedSubmissionIds.size}) from Database`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionIds(new Set())}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Select items via checkboxes to delete in bulk or one by one
                    </span>
                  )}
                </div>
              )}

              {/* 3. Submissions Cards List */}
              {filteredSubmissions.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 space-y-3">
                  <Layers size={36} className="mx-auto text-slate-500" />
                  <div className="text-base font-bold text-white">
                    {uploads.length === 0 ? 'No Ingestion Records in Pipeline' : 'No Submissions Match Active Filter'}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {uploads.length === 0
                      ? 'Upload new syllabus materials, past questions, monographs, or research dissertations into the database.'
                      : 'Try adjusting your search query, status tab, or category filter to locate your curriculum items.'}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {uploads.length > 0 && (
                      <button
                        onClick={() => {
                          setFilterType('All');
                          setSubmissionCategoryFilter('All');
                          setSubmissionSearchTerm('');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={() => handleTabSwitch('upload')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-950"
                    >
                      Launch Upload Studio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((up, idx) => {
                    const statusStr = String(up.status || '').toLowerCase();
                    const isApproved = statusStr === 'approved';
                    const isRejected = statusStr === 'rejected' || statusStr === 'declined';
                    const isPending = !isApproved && !isRejected;

                    // Extract extra metadata
                    let extra = {};
                    if (typeof up.review_notes === 'string' && up.review_notes.startsWith('{')) {
                      try { extra = JSON.parse(up.review_notes); } catch (e) {}
                    }
                    const resType = String(up.resource_type || '').toLowerCase();
                    const cat = extra.uploadCategory || up.upload_category || (
                      (resType.includes('project') || resType.includes('thesis') || resType.includes('dissertation')) ? 'project' :
                      (resType.includes('journal') || resType.includes('article')) ? 'journal' :
                      (resType.includes('handout') || resType.includes('lecture')) ? 'handout' : 'book'
                    );

                    const declineNotes = isRejected ? (up.review_notes || up.decline_reason || 'Document requires syllabus or metadata alignment before publication.') : '';

                    return (
                      <div
                        key={up.id || idx}
                        className={`p-5 rounded-3xl border transition space-y-4 shadow-xl ${
                          selectedSubmissionIds.has(up.id)
                            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border-rose-600/70 ring-1 ring-rose-500/30'
                            : (isRejected
                              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border-rose-800/80 hover:border-rose-600'
                              : (isApproved
                                ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border-emerald-800/60 hover:border-emerald-600'
                                : 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/15 border-slate-800 hover:border-amber-600/50'))
                        }`}
                      >
                        {/* Top Badges Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded-lg hover:bg-slate-800/80 transition" title="Select for bulk action">
                              <input
                                type="checkbox"
                                checked={selectedSubmissionIds.has(up.id)}
                                onChange={() => toggleSelectSubmission(up.id)}
                                className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-700 focus:ring-teal-500 cursor-pointer"
                              />
                            </label>
                            <span className="text-xs font-mono font-bold text-teal-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shadow-inner">
                              {up.course_code || currentDept.code}
                            </span>

                            {/* Category Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              cat === 'project'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : (cat === 'journal'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : (cat === 'handout' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-teal-950 text-teal-300 border border-teal-800'))
                            }`}>
                              {cat === 'project' ? '🎓 Student Project' : (cat === 'journal' ? '📰 Academic Journal' : (cat === 'handout' ? '📄 Lecture Handout' : '📚 Book / Monograph'))}
                            </span>

                            {/* Academic Level */}
                            {up.target_level && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                                {up.target_level} • {up.semester || 'First Semester'}
                              </span>
                            )}

                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                                : (isRejected
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700/80'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700/80')
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-400' : (isRejected ? 'bg-rose-400' : 'bg-amber-400 animate-pulse')}`} />
                              <span>{isApproved ? '✓ Approved & Published' : (isRejected ? '✕ Declined by Admin' : '● In Review Queue')}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              ID: {up.id}
                            </span>
                          </div>
                        </div>

                        {/* Middle Content Row: Artwork + Details */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
                          {/* Front Cover Artwork Thumbnail with Hover Zoom */}
                          <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-2xl overflow-hidden shrink-0 relative shadow-2xl shadow-black/80 border border-slate-700/90 bg-slate-950 self-center sm:self-start group">
                            {up.cover_image ? (
                              <img
                                src={up.cover_image}
                                alt={up.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/fcc-logo.png';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full p-2.5 flex flex-col justify-between text-left relative overflow-hidden bg-gradient-to-br from-teal-950 via-slate-900 to-black">
                                <span className="text-[7.5px] font-mono text-teal-400 font-bold uppercase truncate">FCC • {currentDept.code}</span>
                                <span className="text-[9px] font-bold text-white line-clamp-3 leading-tight font-serif">{up.title}</span>
                                <span className="text-[7.5px] text-slate-400 font-mono truncate">{up.course_code || 'SYLLABUS'}</span>
                              </div>
                            )}
                            <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-2 w-full">
                            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                              {up.title}
                            </h4>

                            <p className="text-xs text-slate-300">
                              By <strong className="text-teal-300">{up.author || currentDept.hod_name || currentDept.hod}</strong>
                              <span className="text-slate-500 mx-1.5">•</span>
                              <span className="text-slate-400 font-mono">{up.file_size || 'Document File'}</span>
                              <span className="text-slate-500 mx-1.5">•</span>
                              <span className="text-slate-400">{up.file_name || 'curriculum.pdf'}</span>
                            </p>

                            {/* Abstract / Notes Snippet */}
                            {(extra.abstract || up.abstract) && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                                {extra.abstract || up.abstract}
                              </p>
                            )}

                            {/* Attach Cover Artwork Button */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-teal-300 text-xs font-semibold transition border border-teal-500/30 hover:border-teal-400 flex items-center gap-1.5 shadow-sm">
                                <Image size={13} />
                                <span>{up.cover_image ? 'Change Front Cover Artwork' : 'Attach Front Cover Artwork'}</span>
                                <input
                                  type="file"
                                  accept="image/*,.png,.jpg,.jpeg,.webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleAttachCoverToUpload(up.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>

                              <span className="text-[11px] text-slate-500">
                                Scope: <strong className="text-slate-300">{up.access_scope || 'Public Institution-Wide'}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* If Declined: High-Impact Feedback Banner with 1-Click Revise Button */}
                        {isRejected && (
                          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-rose-300">
                                <XCircle size={16} className="text-rose-400 shrink-0" />
                                <span>Decline Feedback from Central Library Administration:</span>
                              </div>
                              <span className="text-[10px] text-rose-400/80 font-mono">Status: Action Required</span>
                            </div>

                            <p className="text-slate-200 pl-6 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-rose-900/60 font-medium">
                              {declineNotes}
                            </p>

                            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-6">
                              <span className="text-[11px] text-rose-300">
                                Address the feedback above and revise metadata or syllabus alignment to resubmit.
                              </span>
                              <button
                                onClick={() => handleOpenEditSubmission(up)}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-950 self-start sm:self-auto"
                              >
                                <Edit3 size={13} />
                                <span>Revise & Resubmit to Review Queue</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If Approved: Official Catalog Details Banner with Live OPAC & Reader Buttons */}
                        {isApproved && (
                          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-3 font-mono">
                              <div>
                                <span className="text-emerald-400 font-bold block text-[10px]">CATALOG CALL NUMBER</span>
                                <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                  {up.assigned_call_number || `CEM.411/${up.id}`}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">SHELF LOCATION</span>
                                <span className="text-slate-200 font-semibold">{up.assigned_shelf || 'Digital Library Stacks'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start md:self-auto">
                              <button
                                onClick={async () => {
                                  sounds.playClick();
                                  let fileData = up.file_data_url;
                                  if (!fileData) {
                                    try {
                                      const res = await fetch(`${getApiBase()}/department-uploads/${up.id}`);
                                      if (res.ok) {
                                        const full = await res.json();
                                        fileData = full.file_data_url;
                                      }
                                    } catch (e) {}
                                  }
                                  setActiveReaderBook({
                                    id: up.book_id || up.id,
                                    title: up.title,
                                    author: up.author,
                                    file_data_url: fileData,
                                    pdfUrl: `${getApiBase()}/department-uploads/${up.id}/file`,
                                    cover_image: up.cover_image,
                                    course_code: up.course_code
                                  });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-teal-950"
                              >
                                <BookOpen size={13} />
                                <span>Read Digital Copy</span>
                              </button>

                              <button
                                onClick={() => navigateTo('/opac')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
                              >
                                <ExternalLink size={13} />
                                <span>View in OPAC</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If Pending: Information callout */}
                        {isPending && (
                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-center justify-between gap-2 text-xs text-amber-200">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-amber-400 shrink-0" />
                              <span>Staged in Ingestion Queue. Awaiting review and Dewey/LC call number cataloging by Chief College Librarian.</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-400 shrink-0 hidden sm:inline">Staging ID: {up.id}</span>
                          </div>
                        )}

                        {/* Bottom Actions Toolbar */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">
                            {up.created_at ? `Ingested: ${new Date(up.created_at).toLocaleDateString()}` : 'Curriculum Staging'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditSubmission(up)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700"
                            >
                              <Edit3 size={12} />
                              <span>Edit Details</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSubmission(up.id, up.title)}
                              disabled={deletingSubmissionId === up.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs transition flex items-center gap-1.5 border border-rose-800/80 disabled:opacity-50"
                              title="Withdraw and delete submission"
                            >
                              <Trash2 size={12} />
                              <span>{deletingSubmissionId === up.id ? 'Deleting...' : 'Withdraw / Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: HND DISSERTATIONS TAB (#/hod/dissertations) */}
          {/* ============================================================== */}
          {activeTab === 'dissertations' && (
            <div className="space-y-6 animate-fadeIn">

              {/* ── Header ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={18} className="text-teal-400" />
                    <h3 className="text-xl font-bold text-white">
                      {currentDept.code} Dissertation Endorsement &amp; Review Queue
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    All theses fetched live from the central database - only <span className="text-teal-300 font-semibold">{currentDept.name}</span> submissions are shown.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={() => setIsDissertationUploadModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-950"
                  >
                    <Award size={14} />
                    <span>Ingest & Endorse Dissertation</span>
                  </button>

                  <button
                    id="btn-refresh-dissertations"
                    onClick={fetchDissertations}
                    disabled={isLoadingDissertations}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isLoadingDissertations ? 'animate-spin text-teal-400' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* ── Error Banner ── */}
              {dissertationError && (
                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  {dissertationError}
                  <button onClick={() => setDissertationError('')} className="ml-auto text-rose-400 hover:text-rose-200">✕</button>
                </div>
              )}

              {/* ── Status Filter Tabs + Search ── */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['All', 'Under Review', 'Published', 'Revision Requested', 'Rejected'].map(s => (
                    <button
                      key={s}
                      onClick={() => setDissertationStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                        dissertationStatusFilter === s
                          ? s === 'Published' ? 'bg-emerald-600 text-white shadow'
                          : s === 'Under Review' ? 'bg-amber-600 text-white shadow'
                          : s === 'Revision Requested' ? 'bg-rose-600 text-white shadow'
                          : s === 'Rejected' ? 'bg-slate-600 text-white shadow'
                          : 'bg-teal-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                      {dissertationCounts[s] !== undefined && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] font-bold">
                          {dissertationCounts[s]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-0">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="input-dissertation-search"
                    type="text"
                    placeholder="Search title, author, matric, supervisor…"
                    value={dissertationSearch}
                    onChange={e => setDissertationSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* ── Revision / Rejection Note Dialog ── */}
              {revisionTarget && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className={revisionTarget.mode === 'Rejected' ? 'text-rose-400' : 'text-amber-400'} />
                      <h4 className="text-base font-bold text-white">
                        {revisionTarget.mode === 'Rejected' ? 'Reject Dissertation' : 'Request Revision'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-200">{revisionTarget.diss.title}</strong> by {revisionTarget.diss.author} ({revisionTarget.diss.matric})
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {revisionTarget.mode === 'Rejected' ? 'Rejection reason *' : 'Revision instructions for scholar *'}
                      </label>
                      <textarea
                        id="textarea-revision-note"
                        rows={4}
                        value={revisionNoteDraft}
                        onChange={e => setRevisionNoteDraft(e.target.value)}
                        placeholder={revisionTarget.mode === 'Rejected'
                          ? 'State the reason this dissertation cannot be accepted…'
                          : 'Detail exactly what the scholar must correct before resubmission…'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                      />
                    </div>
                    {dissertationError && <p className="text-xs text-rose-400">{dissertationError}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => { setRevisionTarget(null); setRevisionNoteDraft(''); setDissertationError(''); }}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-submit-revision-note"
                        onClick={submitRevisionNote}
                        disabled={!revisionNoteDraft.trim() || !!dissertationActionId}
                        className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow transition disabled:opacity-50 ${
                          revisionTarget.mode === 'Rejected' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
                        }`}
                      >
                        {dissertationActionId ? 'Saving…' : revisionTarget.mode === 'Rejected' ? 'Reject Submission' : 'Send Revision Request'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dossier / Detail Inline Panel ── */}
              {selectedDissertationForModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/40 shadow-2xl animate-fadeIn space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award size={20} className="text-teal-400" />
                      <h4 className="text-base font-bold text-white">Manuscript Dossier</h4>
                    </div>
                    <button onClick={() => setSelectedDissertationForModal(null)} className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800">✕ Close</button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <h5 className="text-sm font-bold text-white">{selectedDissertationForModal.title}</h5>
                    <p className="text-slate-400">
                      Author: <strong className="text-teal-300">{selectedDissertationForModal.author}</strong>
                      &nbsp;•&nbsp;<span className="font-mono text-teal-400">{selectedDissertationForModal.matric}</span>
                    </p>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                      {selectedDissertationForModal.abstract || <em className="text-slate-500">No abstract provided.</em>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        ['YEAR', selectedDissertationForModal.year || '—', 'text-emerald-400'],
                        ['ADVISOR', selectedDissertationForModal.advisor || currentDept.hod_name || currentDept.hod, 'text-white'],
                        ['STATUS', selectedDissertationForModal.status, 'text-teal-400'],
                        ['SUBMITTED', formatDate(selectedDissertationForModal.submitted_at), 'text-slate-300'],
                      ].map(([label, val, cls]) => (
                        <div key={label} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">{label}</span>
                          <span className={`text-xs font-bold ${cls} break-words`}>{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                    {selectedDissertationForModal.revision_note && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs">
                        <span className="text-[10px] font-bold text-amber-400 block mb-1">REVISION NOTE</span>
                        {selectedDissertationForModal.revision_note}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedDissertationForModal.has_file && (
                        <a href={`/api/theses/${selectedDissertationForModal.id}/file`} target="_blank" rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1 transition">
                          <Eye size={13} /> View PDF
                        </a>
                      )}
                      {selectedDissertationForModal.has_file && (
                        <a href={`/api/theses/${selectedDissertationForModal.id}/file?download=1`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1 transition">
                          <Download size={13} /> Download
                        </a>
                      )}
                      {selectedDissertationForModal.doi && (
                        <a href={`https://doi.org/${selectedDissertationForModal.doi}`} target="_blank" rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 hover:text-white transition">
                          <ExternalLink size={13} /> DOI
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => { handleRequestRevision(selectedDissertationForModal, 'Rejected'); setSelectedDissertationForModal(null); }}
                      className="px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-xs font-semibold border border-rose-800 transition"
                    >Reject</button>
                    <button
                      onClick={() => { handleRequestRevision(selectedDissertationForModal, 'Revision Requested'); setSelectedDissertationForModal(null); }}
                      className="px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 text-xs font-semibold border border-amber-800 transition"
                    >Request Revision</button>
                    {selectedDissertationForModal.status !== 'Published' && (
                      <button
                        id={`btn-approve-modal-${selectedDissertationForModal.id}`}
                        onClick={() => { handleApproveDissertation(selectedDissertationForModal.id); setSelectedDissertationForModal(null); }}
                        disabled={!!dissertationActionId}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
                      >
                        {dissertationActionId === selectedDissertationForModal.id ? 'Publishing…' : 'Endorse & Publish to Repository'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Loading Skeleton ── */}
              {isLoadingDissertations && (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse" />)}
                </div>
              )}

              {/* ── Empty State ── */}
              {!isLoadingDissertations && visibleDissertations.length === 0 && !dissertationError && (
                <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <Award size={36} className="mx-auto text-slate-600" />
                  <h4 className="text-base font-bold text-white">
                    {dissertations.length === 0
                      ? `No dissertations on record for ${currentDept.name}`
                      : 'No dissertations match the current filter'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {dissertations.length === 0
                      ? 'When students submit dissertation manuscripts through the Scholar portal they will appear here for HOD endorsement.'
                      : 'Try "All" or clear the search term.'}
                  </p>
                </div>
              )}

              {/* ── Dissertation Cards ── */}
              {!isLoadingDissertations && visibleDissertations.length > 0 && (
                <div className="space-y-4">
                  {visibleDissertations.map(diss => {
                    const isPending   = diss.status === 'Under Review';
                    const isPublished = diss.status === 'Published';
                    const isRevision  = diss.status === 'Revision Requested';
                    const isRejected  = diss.status === 'Rejected';
                    const isBusy      = dissertationActionId === diss.id;
                    return (
                      <div key={diss.id} className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-3 ${
                        isPending ? 'border-amber-700/50 shadow-amber-950/20 shadow-lg'
                        : isPublished ? 'border-emerald-800/50'
                        : isRevision ? 'border-rose-800/50'
                        : isRejected ? 'border-slate-700/40 opacity-70'
                        : 'border-slate-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-teal-400">{diss.matric}</span>
                              <span className="text-xs text-slate-400">• {diss.author} ({diss.year || new Date().getFullYear()})</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPublished ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : isPending  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : isRevision ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>{diss.status}</span>
                              {diss.has_file && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">PDF</span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-white">{diss.title}</h4>
                          </div>
                          <div className="text-right shrink-0 text-[10px] text-slate-600 space-y-0.5">
                            <div>{diss.file_size || ''}</div>
                            <div>{diss.degree || 'HND Dissertation'}</div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 line-clamp-3">
                          {diss.abstract || <em className="text-slate-500">No abstract.</em>}
                        </p>

                        {diss.revision_note && (
                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
                            <span className="text-[10px] font-bold text-amber-400 mr-1">REVISION NOTE:</span>
                            {diss.revision_note}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-slate-400">Supervisor: <strong className="text-white">{diss.advisor || currentDept.hod_name || currentDept.hod || '—'}</strong></span>
                            {diss.submitted_at && <div className="text-[10px] text-slate-600">Submitted: {formatDate(diss.submitted_at)}</div>}
                            {diss.reviewed_by && diss.reviewed_at && <div className="text-[10px] text-slate-600">Reviewed by {diss.reviewed_by} on {formatDate(diss.reviewed_at)}</div>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button id={`btn-inspect-${diss.id}`} onClick={() => setSelectedDissertationForModal(diss)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold border border-slate-700 transition flex items-center gap-1">
                              <Eye size={12} /> Inspect Dossier
                            </button>
                            {!isPublished && !isRejected && (<>
                              <button id={`btn-endorse-${diss.id}`} onClick={() => handleApproveDissertation(diss.id)} disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow disabled:opacity-50">
                                {isBusy ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                                {isBusy ? 'Publishing…' : 'Endorse & Publish'}
                              </button>
                              <button id={`btn-revision-${diss.id}`} onClick={() => handleRequestRevision(diss, 'Revision Requested')} disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700 transition disabled:opacity-50">
                                Request Revision
                              </button>
                              <button id={`btn-reject-${diss.id}`} onClick={() => handleRequestRevision(diss, 'Rejected')} disabled={isBusy}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900 text-rose-400 font-semibold border border-rose-800/50 transition disabled:opacity-50">
                                Reject
                              </button>
                            </>)}
                            {isPublished && diss.has_file && (
                              <a href={`/api/theses/${diss.id}/file?download=1`}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition">
                                <Download size={12} /> Download PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: COURSE RESERVES TAB (#/hod/reserves) */}
          {/* ============================================================== */}
          {activeTab === 'reserves' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Floating or Top Toast Notification */}
              {reserveNotification && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fadeIn ${
                  reserveNotification.type === 'error'
                    ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                    : 'bg-teal-950/90 border-teal-800 text-teal-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {reserveNotification.type === 'error' ? <AlertCircle size={16} className="text-rose-400" /> : <CheckCircle size={16} className="text-teal-400" />}
                    <span>{reserveNotification.message}</span>
                  </div>
                  <button onClick={() => setReserveNotification(null)} className="text-slate-400 hover:text-white p-1">
                    <XCircle size={15} />
                  </button>
                </div>
              )}

              {/* 1. Header Banner */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      {currentDept.code} COURSE RESERVES DESK
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Central Database
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Course Reserves & High-Demand Shelf Desk</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Textbooks and core reference monographs restricted for short-loan examination consultation. Managed directly by the {currentDept.name} Head of Department.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={fetchReserves}
                    disabled={isLoadingReserves}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/60"
                    title="Refresh course reserves from database"
                  >
                    <RefreshCw size={13} className={isLoadingReserves ? 'animate-spin text-teal-400' : ''} />
                    <span>{isLoadingReserves ? 'Syncing...' : 'Refresh'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddReserveModal(true)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-950 active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Place Book on Reserve</span>
                  </button>
                </div>
              </div>

              {/* Add Reserve Modal */}
              {showAddReserveModal && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Bookmark size={18} className="text-teal-400" />
                      <span>Place Textbook on Course Reserve Shelf (Database)</span>
                    </h4>
                    <button onClick={() => setShowAddReserveModal(false)} className="text-xs text-slate-400 hover:text-white p-1">Cancel</button>
                  </div>
                  <form onSubmit={handleAddReserve} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Book Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Modern Operating System Principles"
                        value={newReserveForm.title}
                        onChange={e => setNewReserveForm({ ...newReserveForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Author / Contributors</label>
                      <input
                        type="text"
                        placeholder="e.g. Prof. A. O. Adebayo"
                        value={newReserveForm.author}
                        onChange={e => setNewReserveForm({ ...newReserveForm, author: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Target Course Code</label>
                      <input
                        type="text"
                        placeholder={`e.g. ${currentDept.code} 411`}
                        value={newReserveForm.reservedFor}
                        onChange={e => setNewReserveForm({ ...newReserveForm, reservedFor: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-teal-500 focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Reserve Bay / Location</label>
                      <select
                        value={newReserveForm.shelf}
                        onChange={e => setNewReserveForm({ ...newReserveForm, shelf: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option>Reserve Desk Bay 1</option>
                        <option>Reserve Desk Bay 2</option>
                        <option>Reserve Desk Bay 3</option>
                        <option>Faculty Carrel Stack A</option>
                        <option>Central Reserve Bay B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Reserve Restriction Rule</label>
                      <select
                        value={newReserveForm.duration}
                        onChange={e => setNewReserveForm({ ...newReserveForm, duration: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                      >
                        <option>2 Hours In-Library Reading Only</option>
                        <option>Overnight Loan (After 4 PM)</option>
                        <option>Weekend Restricted Borrowing</option>
                        <option>Faculty In-Session Consultation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Copies on Reserve</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={newReserveForm.copies}
                        onChange={e => setNewReserveForm({ ...newReserveForm, copies: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddReserveModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg shadow-teal-950 transition"
                      >
                        Place on Reserve Desk (Database)
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. Search & Shelf Location Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Shelf Location Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'All', label: 'All Shelves', count: reserveCounts.all },
                      { id: 'Bay 1', label: 'Reserve Bay 1', count: reserveCounts.bay1 },
                      { id: 'Bay 2', label: 'Reserve Bay 2', count: reserveCounts.bay2 },
                      { id: 'Bay 3', label: 'Reserve Bay 3', count: reserveCounts.bay3 },
                      { id: 'Carrel', label: 'Faculty Carrel', count: reserveCounts.carrel }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { sounds.playClick(); setReserveShelfFilter(tab.id); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          reserveShelfFilter === tab.id
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          reserveShelfFilter === tab.id ? 'bg-teal-800 text-teal-100' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Duration Rule Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Borrowing Rule:</span>
                    <select
                      value={reserveDurationFilter}
                      onChange={e => setReserveDurationFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none font-medium"
                    >
                      <option value="All">All Loan Rules</option>
                      <option value="2 Hours">2 Hours In-Library</option>
                      <option value="Overnight">Overnight Loan</option>
                      <option value="Weekend">Weekend Restricted</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={reserveSearchTerm}
                    onChange={e => setReserveSearchTerm(e.target.value)}
                    placeholder="Search reserve shelf by book title, author, target course (e.g. CSC 211), shelf bay..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-teal-500 focus:outline-none transition"
                  />
                  {reserveSearchTerm && (
                    <button
                      onClick={() => setReserveSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                {/* Active Filter Summary */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                  <span>
                    Showing <strong className="text-white font-mono">{filteredReserves.length}</strong> of <strong className="text-white font-mono">{reservesList.length}</strong> reserved textbooks
                  </span>
                  {(reserveShelfFilter !== 'All' || reserveDurationFilter !== 'All' || reserveSearchTerm.trim()) && (
                    <button
                      onClick={() => {
                        setReserveShelfFilter('All');
                        setReserveDurationFilter('All');
                        setReserveSearchTerm('');
                      }}
                      className="text-teal-400 hover:text-teal-300 font-semibold"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Reserves Grid */}
              {filteredReserves.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                  <Bookmark size={36} className="mx-auto text-slate-600" />
                  <h4 className="text-base font-bold text-white">
                    {reservesList.length === 0 ? 'No Textbooks Currently on Reserve Desk' : 'No Reserves Match Your Search Criteria'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {reservesList.length === 0
                      ? 'Click "Place Book on Reserve" above to restrict high-demand textbooks for 2-hour in-library examination consultation.'
                      : 'Try resetting the shelf bay or loan rule filter.'}
                  </p>
                  {reservesList.length > 0 && (
                    <button
                      onClick={() => {
                        setReserveShelfFilter('All');
                        setReserveDurationFilter('All');
                        setReserveSearchTerm('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReserves.map((res) => {
                    // Match with catalog book if available
                    const matchedBook = catalogBooks.find(b => {
                      const bTitle = (b.title || '').toLowerCase();
                      const rTitle = (res.title || '').toLowerCase();
                      return bTitle === rTitle || bTitle.includes(rTitle) || rTitle.includes(bTitle);
                    });

                    return (
                      <div
                        key={res.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-600/50 hover:shadow-xl hover:shadow-teal-950/20 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Badges row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-teal-950 text-teal-300 border border-teal-800/80 tracking-wider">
                              {res.reserved_for || `${currentDept.code} CORE`}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950 text-amber-300 border border-amber-900/60">
                              {res.duration || '2 Hours In-Library'}
                            </span>
                          </div>

                          {/* Title & Author */}
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition line-clamp-2">
                              {res.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                              <User size={12} className="text-teal-400 shrink-0" />
                              <span className="truncate">{res.author || 'Academic Faculty'}</span>
                            </p>
                          </div>

                          {/* Location & Copies Badge */}
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Shelf Bay</span>
                              <span className="font-mono text-slate-200 font-bold">{res.shelf || 'Reserve Desk Bay 1'}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Holding</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {res.copies || 3} Copies
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800/80 space-y-2">
                          {matchedBook && (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setActiveReaderBook(matchedBook);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-teal-950"
                              title="Open digital copy in interactive reader"
                            >
                              <BookOpen size={13} />
                              <span>Open in Digital Reader</span>
                            </button>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                            <button
                              onClick={() => handleOpenEditReserve(res)}
                              className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition"
                            >
                              <Edit size={12} className="text-teal-400" />
                              <span>Edit Parameters</span>
                            </button>

                            <button
                              onClick={() => handleDeleteReserve(res.id, res.title)}
                              disabled={deletingReserveId === res.id}
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              <span>{deletingReserveId === res.id ? 'Removing...' : 'Remove from Desk'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 7: SCHOLARS DIRECTORY TAB (#/hod/scholars) */}
          {/* ============================================================== */}
          {activeTab === 'scholars' && (
            <div className="space-y-6 animate-fadeIn">
              {/* HOD Profile & Clearance Status Card (Prominent on Scholars Page) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-32 bg-teal-500/5 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                  <div className="relative shrink-0">
                    {profilePhoto || currentDept.hod_photo ? (
                      <img
                        src={profilePhoto || currentDept.hod_photo}
                        alt={currentDept.hod_name || currentDept.hod}
                        className="w-16 h-16 rounded-2xl object-cover border-2 shadow-lg"
                        style={{ borderColor: theme.solidPrimary }}
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg text-white border-2 shadow-lg"
                        style={{ backgroundColor: theme.solidDark, borderColor: theme.solidPrimary }}
                      >
                        {(currentDept.hod_name || currentDept.hod || 'HD').split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleTabSwitch('settings');
                        setIsEditingProfile(true);
                      }}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-md transition cursor-pointer"
                      title="Update Profile Photo"
                    >
                      <Camera size={12} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-white">{currentDept.hod_name || currentDept.hod}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                        Head of Department • {currentDept.code}
                      </span>
                      {profileLocked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700 flex items-center gap-1">
                          <Lock size={10} /> 14-Day Lock ({profileDaysRemaining}d {profileHoursRemaining}h remaining)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-500" />
                        <span className="font-mono text-slate-300">{currentDept.hod_email || currentDept.hodEmail}</span>
                        <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/50 flex items-center gap-0.5">
                          <Lock size={9} /> Fixed Email
                        </span>
                      </span>
                      {profileForm.hodPhone && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Phone size={12} className="text-slate-500" />
                          <span>{profileForm.hodPhone}</span>
                        </span>
                      )}
                      {profileForm.office && (
                        <span className="flex items-center gap-1 text-slate-400 hidden sm:inline-flex">
                          <MapPin size={12} className="text-slate-500" />
                          <span>{profileForm.office}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      handleTabSwitch('settings');
                      setIsEditingProfile(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  >
                    <Edit3 size={14} className="text-teal-400" />
                    <span>Edit Profile &amp; Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={resetLinkSending}
                    className="px-3.5 py-2 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {resetLinkSending ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Reset Password/PIN Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Reset Link Banner on Scholars Page if Dispatched */}
              {resetLinkSentInfo && (
                <div className="p-4 rounded-2xl bg-teal-950/90 border border-teal-500/70 text-teal-200 text-xs space-y-2 shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-teal-400" />
                      <span>Security Password / PIN Reset Link Dispatched to {resetLinkSentInfo.recipient || currentDept.hod_email}!</span>
                    </span>
                    <span className="text-[10px] font-mono bg-teal-900/90 px-2 py-0.5 rounded text-teal-300 border border-teal-700">Valid 30 mins</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-teal-800/60 font-mono text-[11px]">
                    <span className="truncate flex-1 text-teal-300">{resetLinkSentInfo.reset_link || resetLinkSentInfo.link}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyResetLink(resetLinkSentInfo.reset_link || resetLinkSentInfo.link)}
                        className="px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={11} />
                        <span>{copiedResetLink ? '✓ Copied' : 'Copy Link'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        Reset Credentials Now &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                      <Lock size={10} /> HOD DEPARTMENT PRIVILEGE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">CODE: {currentDept.code}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{currentDept.name} Registered Students</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Exclusively fetched from database for {currentDept.name}. Register individual students or batch import full department rosters.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-teal-950 text-teal-300 font-mono text-xs font-bold border border-teal-800">
                    {scholarsList.length} Registered Students
                  </span>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-950 transition"
                  >
                    <UserPlus size={14} />
                    <span>+ Add Student</span>
                  </button>
                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-600/40 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Bulk Import Roster</span>
                  </button>
                  <button
                    onClick={fetchScholars}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                    title="Refresh database records"
                  >
                    <RefreshCw size={13} className={isLoadingScholars ? 'animate-spin text-teal-400' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
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
                  {['All', 'ND I', 'ND II', 'HND I', 'HND II', 'GNS', 'Other'].map(lvl => (
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

              {filteredScholars.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto">
                    <Users size={32} />
                  </div>
                  <h4 className="text-base font-bold text-white">No Scholars Found for {currentDept.name}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Under HOD departmental privileges, you can add students or bulk import student class rosters specifically for {currentDept.name}.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950 transition"
                    >
                      <UserPlus size={15} />
                      <span>+ Register Single Student</span>
                    </button>
                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-600/40 font-bold text-xs flex items-center gap-2 transition"
                    >
                      <FileSpreadsheet size={15} />
                      <span>Bulk Import Class Roster (CSV)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScholars.map((st) => {
                    const isCleared = (st.clearance_status || '').includes('Cleared') || st.cleared;
                    return (
                      <div key={st.id || st.matric} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2.5 shadow-lg flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white truncate max-w-[170px]" title={st.name}>{st.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                              {st.level || 'ND I'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-teal-400 font-semibold">{st.matric}</div>
                          {st.email && (
                            <div className="text-[10px] text-slate-400 truncate" title={st.email}>{st.email}</div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-[11px] text-slate-400">
                            <span>Clearance: <strong className={isCleared ? 'text-teal-400' : 'text-amber-400'}>{st.clearance_status || 'Active Student'}</strong></span>
                            <span>{st.active_loans_count || st.loans || 0} Loans</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isCleared ? (
                              <button
                                onClick={() => handleToggleScholarClearance(st.id || st.matric)}
                                className="flex-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md shadow-teal-950"
                              >
                                <UserCheck size={13} />
                                <span>Clear Convocation</span>
                              </button>
                            ) : (
                              <span className="flex-1 py-1 text-center rounded-xl bg-teal-950/60 text-teal-300 text-[11px] font-mono border border-teal-800/60">
                                ✓ Cleared for Graduation
                              </span>
                            )}
                            <button
                              onClick={() => setEditingScholar(st)}
                              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-teal-900/40 text-slate-400 hover:text-teal-300 flex items-center justify-center transition border border-slate-700/60"
                              title="Edit scholar profile"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteScholar(st.id || st.matric, st.name)}
                              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition border border-slate-700/60"
                              title="Remove scholar record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* HOD Modals */}
              <StudentAddModal
                isOpen={showAddStudentModal}
                onClose={() => setShowAddStudentModal(false)}
                mode="hod"
                currentDept={currentDept}
                departments={departments}
                onStudentAdded={(newPatron) => {
                  setScholarsList(prev => [newPatron, ...prev.filter(p => p.matric !== newPatron.matric)]);
                  fetchScholars();
                }}
              />

              <StudentEditModal
                isOpen={Boolean(editingScholar)}
                onClose={() => setEditingScholar(null)}
                student={editingScholar}
                mode="hod"
                currentDept={currentDept}
                departments={departments}
                onStudentUpdated={(updated) => {
                  setScholarsList(prev => prev.map(s => (s.id === updated.id || s.matric === updated.matric) ? { ...s, ...updated } : s));
                  fetchScholars();
                }}
              />

              <StudentBulkImportModal
                isOpen={showBulkImportModal}
                onClose={() => setShowBulkImportModal(false)}
                mode="hod"
                currentDept={currentDept}
                departments={departments}
                onImportComplete={() => fetchScholars()}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 8: COMMUNICATION DISPATCH TAB (#/hod/communication) */}
          {/* ============================================================== */}
          {activeTab === 'communication' && (
            <div className="animate-fadeIn">
              <InstitutionalCommunicationHub
                currentRole="hod"
                currentUser={{
                  name: currentDept.hod_name || currentDept.hod,
                  matric: `HOD/${currentDept.code}/001`,
                  dept: currentDept.name,
                  department_code: currentDept.code
                }}
                allowRoleSwitching={false}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 9: SETTINGS TAB (#/hod/settings) */}
          {/* ============================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                      <ShieldCheck size={11} /> OFFICIAL HOD PROFILE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">CODE: {currentDept.code}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Department Head Profile &amp; Security Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage departmental executive identity, profile photograph, official credentials, and clearance PIN.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={resetLinkSending}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {resetLinkSending ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Password/PIN Reset Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Settings size={14} /> {isEditingProfile ? 'Close Editor' : 'Edit HOD Profile'}
                  </button>
                </div>
              </div>

              {/* Active Reset Link Banner in Settings if Dispatched */}
              {resetLinkSentInfo && (
                <div className="p-4 rounded-2xl bg-teal-950/90 border border-teal-500/70 text-teal-200 text-xs space-y-2 shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-teal-400" />
                      <span>Official Password / PIN Reset Link Dispatched to {resetLinkSentInfo.recipient || currentDept.hod_email}!</span>
                    </span>
                    <span className="text-[10px] font-mono bg-teal-900/90 px-2 py-0.5 rounded text-teal-300 border border-teal-700">Valid 30 mins</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-teal-800/60 font-mono text-[11px]">
                    <span className="truncate flex-1 text-teal-300">{resetLinkSentInfo.reset_link || resetLinkSentInfo.link}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyResetLink(resetLinkSentInfo.reset_link || resetLinkSentInfo.link)}
                        className="px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={11} />
                        <span>{copiedResetLink ? '✓ Copied' : 'Copy Link'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition cursor-pointer"
                      >
                        Reset Credentials Now &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900 border border-teal-500/50 shadow-2xl space-y-5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield size={16} className="text-teal-400" />
                      <span>Update HOD Profile, Photo &amp; Security Credentials</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-teal-400 border border-slate-700">
                      SEC-14D-LOCK ENFORCED
                    </span>
                  </div>

                  {profileLocked && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-2 border-amber-600/80 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <Lock size={16} className="text-amber-400 shrink-0" />
                          <span>2-Week Institutional Security Lock Active</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-amber-900/90 text-amber-300 border border-amber-500 font-bold">
                          {profileDaysRemaining}d {profileHoursRemaining}h {profileMinutesRemaining}m Remaining
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-200/90">
                        Under Federal College Security Policy, HOD and Administrator credential modifications are restricted to once every two weeks (14 days) to prevent unauthorized tampering. You must wait until <strong className="text-white">{profileLockedUntil ? new Date(profileLockedUntil).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'after 2 weeks'}</strong> before modifying your credentials again.
                      </p>
                      <div className="text-[10px] text-amber-300/80 flex items-center justify-between pt-1 border-t border-amber-900/60">
                        <span>Emergency alterations require Master Developer Override clearance at <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">#/developer</code></span>
                        <span className="font-mono text-amber-400">Policy: SEC-14D-LOCK</span>
                      </div>
                    </div>
                  )}

                  {profileMsg.text && (
                    <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                        : 'bg-rose-950 border border-rose-800 text-rose-200'
                    }`}>
                      {profileMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  {/* 1. HOD PROFILE PHOTO UPLOAD STUDIO */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <label className="block font-bold text-slate-200">Department Head Profile Photograph</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative shrink-0">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt="HOD Profile Preview"
                            className="w-24 h-24 rounded-2xl object-cover border-2 shadow-xl ring-2 ring-teal-500/30"
                            style={{ borderColor: theme.solidPrimary }}
                          />
                        ) : (
                          <div
                            className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-2xl text-white border-2 shadow-xl"
                            style={{ backgroundColor: theme.solidDark, borderColor: theme.solidPrimary }}
                          >
                            <span>{(profileForm.hod || currentDept.hod_name || 'HD').split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                            <span className="text-[9px] font-mono opacity-60">NO PHOTO</span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-teal-500 text-white shadow">
                          <Camera size={12} />
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleProfilePhotoSelect}
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                          disabled={profileLocked}
                        />
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            disabled={profileLocked}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
                          >
                            <Upload size={13} />
                            <span>{profilePhoto ? 'Change Photo' : 'Upload Photograph'}</span>
                          </button>
                          {profilePhoto && (
                            <button
                              type="button"
                              disabled={profileLocked}
                              onClick={handleRemoveProfilePhoto}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-800/70 transition cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Recommended: Square image (JPG, PNG, WebP) under 5MB. Photo will appear on the HOD Portal, Scholars Directory, and Official Dispatch signatures.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. PERSONAL DETAILS & IMMUTABLE EMAIL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Head of Department (HOD) Name *</label>
                      <input
                        type="text"
                        disabled={profileLocked}
                        value={profileForm.hod}
                        onChange={e => setProfileForm({ ...profileForm, hod: e.target.value })}
                        placeholder="e.g. Dr. Jane Doe"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* Official Institutional Email - LOCKED ("except email") */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-300">Official Institutional Email (Locked) *</label>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={9} /> Permanent Email
                        </span>
                      </div>
                      <input
                        type="email"
                        disabled
                        readOnly
                        value={currentDept.hod_email || currentDept.hodEmail || profileForm.hodEmail}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
                        title="Institutional email address is assigned permanently by Academic Registry and cannot be modified."
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Official departmental communications and password reset tokens are strictly dispatched to this verified address.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Official Phone Line</label>
                      <input
                        type="text"
                        disabled={profileLocked}
                        value={profileForm.hodPhone}
                        onChange={e => setProfileForm({ ...profileForm, hodPhone: e.target.value })}
                        placeholder="+234 803 000 0000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Office Location</label>
                      <input
                        type="text"
                        disabled={profileLocked}
                        value={profileForm.office}
                        onChange={e => setProfileForm({ ...profileForm, office: e.target.value })}
                        placeholder="e.g. Block B, Room 14"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-300 mb-1">Consultation Hours</label>
                      <input
                        type="text"
                        disabled={profileLocked}
                        value={profileForm.consultationHours}
                        onChange={e => setProfileForm({ ...profileForm, consultationHours: e.target.value })}
                        placeholder="e.g. Tuesdays & Thursdays, 10:00 AM - 2:00 PM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* 3. PASSWORD & CLEARANCE PIN RESET LINK PANEL */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-950 to-slate-950 border border-teal-800/60 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <KeyRound size={15} className="text-teal-400" />
                          <span>HOD Password &amp; Clearance PIN Security Management</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Request an official cryptographic password/PIN reset link sent directly to your institutional email.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendResetLink}
                        disabled={resetLinkSending}
                        className="shrink-0 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
                      >
                        {resetLinkSending ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>Send Reset Link to Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-300">
                          Direct Password / Clearance PIN Update (Leave blank to keep current)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowHodPass(!showHodPass)}
                          className="text-[11px] text-teal-400 hover:text-white cursor-pointer"
                        >
                          {showHodPass ? 'Hide' : 'Reveal'}
                        </button>
                      </div>
                      <input
                        type={showHodPass ? 'text' : 'password'}
                        disabled={profileLocked}
                        value={profileForm.password}
                        onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                        placeholder="Enter new HOD login password/PIN..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-mono focus:border-teal-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Note: During manual password change, the institutional system automatically generates and dispatches an emergency reset verification link to {currentDept.hod_email || profileForm.hodEmail}.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving || profileLocked}
                      className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer ${
                        profileLocked
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          : 'bg-teal-600 hover:bg-teal-500 text-white'
                      }`}
                    >
                      {profileSaving ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving to Database...</span>
                        </>
                      ) : profileLocked ? (
                        <>
                          <Lock size={13} className="text-amber-400" />
                          <span>Locked for 2 Weeks ({profileDaysRemaining}d {profileHoursRemaining}h remaining)</span>
                        </>
                      ) : (
                        <>
                          <Save size={13} />
                          <span>Save Changes &amp; Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Hero Dossier Card */}
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                    <div className="relative shrink-0">
                      {profilePhoto || currentDept.hod_photo ? (
                        <img
                          src={profilePhoto || currentDept.hod_photo}
                          alt={currentDept.hod_name || currentDept.hod}
                          className="w-24 h-24 rounded-3xl object-cover border-2 shadow-2xl"
                          style={{ borderColor: theme.solidPrimary }}
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-3xl text-white border-2 shadow-2xl"
                          style={{ backgroundColor: theme.solidDark, borderColor: theme.solidPrimary }}
                        >
                          {(currentDept.hod_name || currentDept.hod || 'HD').split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active HOD" />
                    </div>

                    <div className="space-y-2 flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                        <h4 className="text-xl font-bold text-white">{currentDept.hod_name || currentDept.hod}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                          Head of Department ({currentDept.code})
                        </span>
                        {profileLocked && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                            <Lock size={10} /> 14-Day Lock ({profileDaysRemaining}d remaining)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 justify-center md:justify-start">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-500" />
                          <span className="font-mono text-slate-200">{currentDept.hod_email || currentDept.hodEmail}</span>
                          <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/50">
                            Permanent Email
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-500" />
                          <span>{profileForm.hodPhone || '+234 803 234 5678'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-500" />
                          <span>{profileForm.office || 'Block B, Room 14 (Faculty Annex)'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-center md:justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Edit3 size={14} />
                        <span>Edit Profile &amp; Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendResetLink}
                        disabled={resetLinkSending}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {resetLinkSending ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} />
                            <span>Send Reset Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Attribute Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-mono text-[10px]">DEPARTMENT CODE</span>
                      <div className="text-base font-bold text-teal-400">{currentDept.code}</div>
                      <div className="text-[11px] text-slate-400">{currentDept.name}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-mono text-[10px]">FACULTY / SCHOOL</span>
                      <div className="text-base font-bold text-white">{currentDept.faculty || 'School of Cooperative & Management Studies'}</div>
                      <div className="text-[11px] text-slate-400">Accredited Academic Division</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-mono text-[10px]">CONSULTATION HOURS</span>
                      <div className="text-base font-bold text-white">{profileForm.consultationHours || 'Tues & Thurs, 10 AM - 2 PM'}</div>
                      <div className="text-[11px] text-slate-400">Office: {profileForm.office}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTITUTIONAL ACADEMIC CALENDAR & HOURS (ASSIGNED HOD CLEARANCE) */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDeptAllowedInst
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isDeptAllowedInst ? '✓ DEVELOPER ASSIGNED HOD AUTHORITY' : 'RESTRICTED CLEARANCE'}
                      </span>
                      <span className="text-[11px] text-teal-400 font-mono">export const INSTITUTION</span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1">
                      Institutional Academic Session &amp; Operating Hours
                    </h4>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      {isDeptAllowedInst
                        ? 'Your department has been granted developer clearance to modify academic sessions, semesters, and library hours for the institution.'
                        : 'Modification authority for this module is restricted. The Developer Master Portal (/#/developer) can grant editing privileges to this HOD.'}
                    </p>
                  </div>

                  {isDeptAllowedInst && (
                    <button
                      type="button"
                      onClick={handleSaveHodInst}
                      disabled={instSaving}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{instSaving ? 'Saving...' : 'Update College Calendar'}</span>
                    </button>
                  )}
                </div>

                {instMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={15} />
                    <span>{instMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Current Academic Session</label>
                    <input
                      type="text"
                      disabled={!isDeptAllowedInst}
                      value={instConfig.currentSession || ''}
                      onChange={e => setInstConfig({ ...instConfig, currentSession: e.target.value })}
                      placeholder="2026/2027 Academic Session"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-bold focus:border-teal-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Current Semester</label>
                    <input
                      type="text"
                      disabled={!isDeptAllowedInst}
                      value={instConfig.currentSemester || ''}
                      onChange={e => setInstConfig({ ...instConfig, currentSemester: e.target.value })}
                      placeholder="Second Semester"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-bold focus:border-teal-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Library / Virtual Hub Hours</label>
                    <input
                      type="text"
                      disabled={!isDeptAllowedInst}
                      value={instConfig.todayHours || ''}
                      onChange={e => setInstConfig({ ...instConfig, todayHours: e.target.value })}
                      placeholder="08:00 AM – 08:00 PM (24/7 Virtual Hub)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 10: STAFF PAGE BUILDER TAB (#/hod/staff-builder) */}
          {/* ============================================================== */}
          {activeTab === 'staff_builder' && (
            <div className="animate-fadeIn">
              <HodStaffPageBuilder
                currentDept={currentDept}
                theme={theme}
                staffList={staffList}
                isLoadingStaff={isLoadingStaff}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
                onCreateStaff={handleCreateStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onBulkUpdateStaff={handleBulkUpdateStaff}
                onLaunchStaffWorkspace={(staff) => {
                  const sId = typeof staff === 'object' ? staff?.id : staff;
                  if (sId) setSelectedStaffId(sId);
                  handleTabSwitch('staff_workspace');
                }}
                onRefreshStaff={fetchStaffList}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 11: STAFF LIVE WORKSPACE TAB (#/hod/staff-workspace) */}
          {/* ============================================================== */}
          {activeTab === 'staff_workspace' && (
            <div className="animate-fadeIn">
              <HodStaffLiveWorkspace
                currentDept={currentDept}
                theme={theme}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
                onOpenStaffBuilder={() => handleTabSwitch('staff_builder')}
                isStaffUser={isStaffUser}
                currentUser={currentUser}
                courses={courses}
                uploads={uploads}
                dissertations={dissertations}
                reservesList={reservesList}
                scholarsList={scholarsList}
                catalogBooks={catalogBooks}
                onOpenAddCourseModal={() => setShowAddCourseModal(true)}
                onOpenEditCourse={(course) => setEditingCourse(course)}
                onDeleteCourse={handleDeleteCourse}
                onOpenEditSubmission={(sub) => {
                  setEditingSubmission(sub);
                  setEditSubmissionForm({
                    title: sub.title || '',
                    author: sub.author || '',
                    course_code: sub.course_code || '',
                    target_level: sub.target_level || 'HND II',
                    semester: sub.semester || 'First Semester',
                    resource_type: sub.resource_type || 'Book',
                    access_scope: sub.access_scope || 'Public Institution-Wide'
                  });
                }}
                onDeleteSubmission={handleDeleteSubmission}
                onApproveDissertation={handleApproveDissertation}
                onRequestDissertationRevision={handleRequestRevision}
                onOpenUploadDissertationModal={() => setIsDissertationUploadModalOpen(true)}
                onOpenAddReserveModal={() => setShowAddReserveModal(true)}
                onOpenEditReserve={(res) => handleOpenEditReserve(res)}
                onDeleteReserve={(resId, title) => handleDeleteReserve(resId, title)}
                onOpenAddStudentModal={() => setShowAddStudentModal(true)}
                onOpenBulkImportModal={() => setShowBulkImportModal(true)}
                onEditStudent={(stud) => setEditingScholar(stud)}
                onToggleScholarClearance={handleToggleScholarClearance}
                onRefreshUploads={fetchDepartmentUploads}
                onRefreshStaff={fetchStaffList}
              />
            </div>
          )}
        </main>
      </div>

      {/* Switch HOD Authorization Password Modal */}
      {pendingTargetDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-5">
            {/* Target Department Solid Color Bar */}
            <div
              className="h-1.5 w-full rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  HOD_DEPARTMENT_THEMES[(pendingTargetDept.code || '').toUpperCase()]?.solidPrimary || '#1d4ed8'
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{
                    backgroundColor:
                      HOD_DEPARTMENT_THEMES[(pendingTargetDept.code || '').toUpperCase()]?.solidPrimary || '#1d4ed8'
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">HOD Authentication Required</h3>
                  <p className="text-[11px] text-slate-400">Department Switching Authorization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelSwitchDepartment}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                title="Cancel"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Target Department Details Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Target Department:
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-sm"
                  style={{
                    backgroundColor:
                      HOD_DEPARTMENT_THEMES[(pendingTargetDept.code || '').toUpperCase()]?.solidPrimary || '#1d4ed8'
                  }}
                >
                  {pendingTargetDept.code}
                </span>
              </div>
              <div className="text-sm font-bold text-white">{pendingTargetDept.name}</div>
              <div className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                <span className="text-slate-400">Head of Department:</span>
                <strong className="text-white">
                  {pendingTargetDept.hod_name || pendingTargetDept.hod || 'Department Head'}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent unauthorized access to this department's uploads, curriculum, and submissions, please enter the HOD password for <strong>{pendingTargetDept.name} ({pendingTargetDept.code})</strong>:
            </p>

            {/* Error Notification */}
            {switchPasswordError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                <span>{switchPasswordError}</span>
              </div>
            )}

            {/* Password Verification Form */}
            <form onSubmit={handleConfirmSwitchDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter {pendingTargetDept.code} HOD Password:
                </label>
                <div className="relative">
                  <input
                    type={showSwitchPassword ? 'text' : 'password'}
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder={`Enter password for ${pendingTargetDept.code} HOD`}
                    className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-medium focus:outline-none transition shadow-inner font-mono"
                    autoFocus
                    required
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                  >
                    {showSwitchPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                {(currentUser?.isAdminImpersonation || initialUser?.isAdminImpersonation || currentUser?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={handleConfirmSwitchDepartment}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 mr-auto"
                  >
                    <ShieldCheck size={14} className="text-amber-300" />
                    <span>Bypass (Admin Master)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelSwitchDepartment}
                  disabled={isVerifyingSwitch}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingSwitch}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor:
                      HOD_DEPARTMENT_THEMES[(pendingTargetDept.code || '').toUpperCase()]?.solidPrimary || '#1d4ed8'
                  }}
                >
                  <KeyRound size={14} />
                  <span>{isVerifyingSwitch ? 'Verifying Password...' : `Authorize & Switch to ${pendingTargetDept.code}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Digital Book Reader Modal for HOD */}
      {activeReaderBook && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
          <div className="w-full h-full max-w-7xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-teal-500/30 flex flex-col relative">
            <DigitalBookReader
              book={activeReaderBook}
              onClose={() => setActiveReaderBook(null)}
              user={currentUser}
            />
          </div>
        </div>
      )}

      {/* Catalog Book Bibliographic Dossier Modal for HOD */}
      {selectedCatalogBookDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-teal-400" />
                <h4 className="text-base font-bold text-white">Curriculum Book Dossier</h4>
              </div>
              <button
                onClick={() => setSelectedCatalogBookDossier(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-32 h-44 rounded-xl overflow-hidden border border-slate-800 shrink-0 shadow-lg relative bg-slate-950">
                <img
                  src={getBookCoverUrl(selectedCatalogBookDossier)}
                  alt={selectedCatalogBookDossier.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
              </div>

              <div className="space-y-2 flex-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  {selectedCatalogBookDossier.course_code || selectedCatalogBookDossier.courseCode || currentDept.code}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {selectedCatalogBookDossier.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Author: <strong className="text-teal-300">{selectedCatalogBookDossier.author || 'FCC Faculty Scholar'}</strong>
                </p>
                <p className="text-xs text-slate-400">
                  Department: <strong className="text-white">{selectedCatalogBookDossier.department || currentDept.name}</strong>
                </p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CALL NUMBER</span>
                <span className="font-mono text-teal-300 font-bold text-[11px] truncate block">
                  {selectedCatalogBookDossier.call_number || selectedCatalogBookDossier.callNumber || 'FCC-CALL'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ISBN</span>
                <span className="font-mono text-white text-[11px] truncate block">
                  {selectedCatalogBookDossier.isbn || 'FCC-DIGITAL'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">YEAR</span>
                <span className="text-emerald-400 font-bold text-[11px]">
                  {selectedCatalogBookDossier.publication_year || selectedCatalogBookDossier.year || '2026'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">HOLDINGS</span>
                <span className="text-white font-bold text-[11px]">
                  {selectedCatalogBookDossier.copies_available ?? 1}/{selectedCatalogBookDossier.copies_total ?? 1} copies
                </span>
              </div>
            </div>

            {/* Abstract */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                Monograph Abstract & Syllabus Description:
              </span>
              {selectedCatalogBookDossier.abstract || (
                <span className="text-slate-400">
                  Official peer-reviewed curriculum reading resource approved for Federal Cooperative College, Ibadan degree and higher national diploma examinations.
                </span>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedCatalogBookDossier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const b = selectedCatalogBookDossier;
                  setSelectedCatalogBookDossier(null);
                  setActiveReaderBook(b);
                }}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 flex items-center gap-2 transition active:scale-95"
              >
                <BookOpen size={14} />
                <span>Open in Digital Reader</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Submission Modal for HOD Ingestion Pipeline */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Edit Resource Metadata</h4>
                  <p className="text-[11px] text-slate-400">ID: {editingSubmission.id} • {editingSubmission.department_name || currentDept.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmission} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={editSubmissionForm.title}
                  onChange={e => setEditSubmissionForm({ ...editSubmissionForm, title: e.target.value })}
                  placeholder="e.g. Advanced Operating Systems Concepts"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Author / Faculty Contributors *</label>
                  <input
                    type="text"
                    required
                    value={editSubmissionForm.author}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, author: e.target.value })}
                    placeholder="e.g. Dr. A. Silberschatz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={editSubmissionForm.course_code}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, course_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CSC 312"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Academic Level</label>
                  <select
                    value={editSubmissionForm.target_level}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, target_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="ND I">ND I</option>
                    <option value="ND II">ND II</option>
                    <option value="HND I">HND I</option>
                    <option value="HND II">HND II</option>
                    <option value="GNS">GNS (General Studies)</option>
                    <option value="Post-HND">Post-HND</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={editSubmissionForm.semester}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Resource Type</label>
                  <select
                    value={editSubmissionForm.resource_type}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, resource_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="Book">📚 Book / Monograph</option>
                    <option value="Student Project">🎓 Student Project / Thesis</option>
                    <option value="Journal">📰 Academic Journal</option>
                    <option value="Lecture Handout">📄 Lecture Handout / Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Access Scope</label>
                <select
                  value={editSubmissionForm.access_scope}
                  onChange={e => setEditSubmissionForm({ ...editSubmissionForm, access_scope: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                >
                  <option value="Public Institution-Wide">Public Institution-Wide (All College Scholars)</option>
                  <option value="Restricted to Department Students Only">Restricted to {currentDept.code} Department Scholars Only</option>
                  <option value="Faculty Staff Only">Faculty Staff / Lecturers Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Abstract & Syllabus Description</label>
                <textarea
                  rows={3}
                  value={editSubmissionForm.abstract}
                  onChange={e => setEditSubmissionForm({ ...editSubmissionForm, abstract: e.target.value })}
                  placeholder="Summary of syllabus coverage, topics, chapters, and examination relevance..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* If previously rejected, option to resubmit as pending */}
              {(editingSubmission.status === 'rejected' || editingSubmission.status === 'declined') && (
                <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-800/60 flex items-start gap-2.5 text-xs text-teal-200">
                  <input
                    type="checkbox"
                    id="resubmitAsPendingCheck"
                    checked={editSubmissionForm.resubmitAsPending}
                    onChange={e => setEditSubmissionForm({ ...editSubmissionForm, resubmitAsPending: e.target.checked })}
                    className="mt-0.5 rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="resubmitAsPendingCheck" className="cursor-pointer">
                    <strong className="block text-white font-semibold">Resubmit for Review (Reset Status to Pending)</strong>
                    <span className="text-[11px] text-teal-300/80">
                      Checking this resets the status back to 'Pending' so the Central Library Admin can review and publish this revised resource.
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  disabled={isSavingEditSubmission}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditSubmission}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isSavingEditSubmission ? 'Saving to Database...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Edit size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Edit Academic Course Module</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{editingCourse.code} • {currentDept.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Code (Read-Only)</label>
                <input
                  type="text"
                  disabled
                  value={editCourseForm.code}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-teal-300 font-mono font-bold uppercase cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editCourseForm.title}
                  onChange={e => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                  placeholder="e.g. Object-Oriented Programming"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Academic Level</label>
                  <select
                    value={editCourseForm.level}
                    onChange={e => setEditCourseForm({ ...editCourseForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="ND I">ND I</option>
                    <option value="ND II">ND II</option>
                    <option value="HND I">HND I</option>
                    <option value="HND II">HND II</option>
                    <option value="GNS">GNS (General Studies)</option>
                    <option value="Post-HND">Post-HND</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={editCourseForm.semester}
                    onChange={e => setEditCourseForm({ ...editCourseForm, semester: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Lecturer</label>
                  <input
                    type="text"
                    value={editCourseForm.lecturer}
                    onChange={e => setEditCourseForm({ ...editCourseForm, lecturer: e.target.value })}
                    placeholder="e.g. Dr. A. Adebayo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Enrolled Scholars Estimate</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={editCourseForm.enrolled_students}
                    onChange={e => setEditCourseForm({ ...editCourseForm, enrolled_students: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Curriculum Syllabus Overview & Competencies</label>
                <textarea
                  rows={3}
                  value={editCourseForm.syllabus}
                  onChange={e => setEditCourseForm({ ...editCourseForm, syllabus: e.target.value })}
                  placeholder="Summary of course modules, lecture topics, laboratory practicals, and examination coverage..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:border-teal-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  disabled={isSavingEditCourse}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditCourse}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isSavingEditCourse ? 'Updating Database...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Syllabus & Prescribed Reading List Dossier Modal */}
      {selectedCourseSyllabusDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    {selectedCourseSyllabusDossier.course.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedCourseSyllabusDossier.course.level || 'HND II'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-teal-400 border border-teal-900/60">
                    {selectedCourseSyllabusDossier.course.semester || 'First Semester'}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {selectedCourseSyllabusDossier.course.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Lecturer: <strong className="text-slate-200">{selectedCourseSyllabusDossier.course.lecturer || currentDept.hod_name || currentDept.hod}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseSyllabusDossier(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Syllabus Details */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Official Curriculum Syllabus:
              </span>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                {selectedCourseSyllabusDossier.course.syllabus || (
                  <p className="italic text-slate-400">
                    Standard Federal Polytechnic curriculum module accredited by NBTE. Encompasses core theoretical principles, hands-on laboratory workshops, case studies, continuous assessment assignments, and the final semester examination.
                  </p>
                )}
              </div>
            </div>

            {/* HOD-Uploaded Books for this Course */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  HOD-Uploaded Books for this Course:
                </span>
                <span className="text-[11px] font-mono font-bold text-teal-400">
                  {selectedCourseSyllabusDossier.linkedBooks?.length || 0} {(selectedCourseSyllabusDossier.linkedBooks?.length || 0) === 1 ? 'Book' : 'Books'}
                </span>
              </div>

              {(!selectedCourseSyllabusDossier.linkedBooks || selectedCourseSyllabusDossier.linkedBooks.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
                  <p>No HOD has uploaded a book for {selectedCourseSyllabusDossier.course.code} yet.</p>
                  <button
                    onClick={() => {
                      setSelectedCourseSyllabusDossier(null);
                      handleTabSwitch('upload');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1 transition"
                  >
                    <FileUp size={12} />
                    <span>Upload a Book for this Course</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedCourseSyllabusDossier.linkedBooks.map((book, bIdx) => {
                    const isApproved = book.status === 'approved' || book.is_published;
                    const downloadUrl = book.id ? `/api/books/${encodeURIComponent(book.id)}/pdf/download` : `${book.pdfUrl || book.file_url || `/api/catalog/${book.id}/file`}?download=1`;
                    return (
                      <div
                        key={book.id || bIdx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-teal-500/50 transition"
                      >
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate" title={book.title}>{book.title}</h5>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {book.author || book.uploaded_by || 'HOD'} • <span className="font-mono text-teal-300">{book.call_number || book.callNumber || book.shelf_location || 'HOD Upload'}</span>
                            {' '}• <span className={isApproved ? 'text-emerald-400' : 'text-amber-400'}>{isApproved ? 'Published' : 'In review'}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedCourseSyllabusDossier(null);
                              setActiveReaderBook(book);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-800 text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <BookOpen size={12} />
                            <span>Read</span>
                          </button>
                          <a
                            href={downloadUrl}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition"
                            title="Download PDF"
                            aria-label={`Download ${book.title}`}
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* HOD Uploaded Course Materials & Handouts */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <FileText size={13} className="text-indigo-400" />
                  <span>HOD Course Materials & Lecture Handouts:</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-400">
                  {selectedCourseSyllabusDossier.course?.lectureMaterials?.length || 0} Files
                </span>
              </div>

              {(!selectedCourseSyllabusDossier.course?.lectureMaterials || selectedCourseSyllabusDossier.course.lectureMaterials.length === 0) ? (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                  <p>No lecture handouts or reading packs have been uploaded for {selectedCourseSyllabusDossier.course?.code} yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedCourseSyllabusDossier.course.lectureMaterials.map((mat, mIdx) => (
                    <div
                      key={mat.id || mIdx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {mat.status || 'Active'}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate">{mat.title}</h5>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Lecturer: {mat.lecturer || mat.author || 'Faculty'} • File: <span className="font-mono text-indigo-300">{mat.fileName || mat.file || 'document.pdf'}</span>
                        </p>
                      </div>
                      {mat.fileUrl ? (
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-800 text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                        >
                          <Download size={12} />
                          <span>Open PDF</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Archived</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Examination Papers & Marking Guides */}
            {selectedCourseSyllabusDossier.course?.pastQuestions && selectedCourseSyllabusDossier.course.pastQuestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Award size={13} className="text-amber-400" />
                    <span>Past Examination Archive & Model Papers:</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    {selectedCourseSyllabusDossier.course.pastQuestions.length} Exams
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCourseSyllabusDossier.course.pastQuestions.map((pq, pIdx) => (
                    <div
                      key={pq.id || pIdx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition"
                    >
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{pq.title}</h5>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Year: <strong className="text-slate-200">{pq.year || 'Accredited'}</strong> • {pq.semester || 'Semester Exam'}
                        </p>
                      </div>
                      {pq.fileUrl ? (
                        <a
                          href={pq.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-800 text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Exam Archive</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  const c = selectedCourseSyllabusDossier.course;
                  setSelectedCourseSyllabusDossier(null);
                  handleOpenEditCourse(c);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit size={13} />
                <span>Edit Syllabus</span>
              </button>

              <button
                onClick={() => setSelectedCourseSyllabusDossier(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Reserve Parameters Modal */}
      {editingReserve && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Edit Course Reserve Shelf Record</h4>
                  <p className="text-[11px] text-slate-400">Record ID: #{editingReserve.id} • {currentDept.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingReserve(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditReserve} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={editReserveForm.title}
                  onChange={e => setEditReserveForm({ ...editReserveForm, title: e.target.value })}
                  placeholder="e.g. Database System Concepts"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Author / Contributors</label>
                <input
                  type="text"
                  value={editReserveForm.author}
                  onChange={e => setEditReserveForm({ ...editReserveForm, author: e.target.value })}
                  placeholder="e.g. A. Silberschatz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Course Code</label>
                  <input
                    type="text"
                    value={editReserveForm.reserved_for}
                    onChange={e => setEditReserveForm({ ...editReserveForm, reserved_for: e.target.value.toUpperCase() })}
                    placeholder="e.g. CSC 211"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Reserve Bay / Location</label>
                  <select
                    value={editReserveForm.shelf}
                    onChange={e => setEditReserveForm({ ...editReserveForm, shelf: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option>Reserve Desk Bay 1</option>
                    <option>Reserve Desk Bay 2</option>
                    <option>Reserve Desk Bay 3</option>
                    <option>Faculty Carrel Stack A</option>
                    <option>Central Reserve Bay B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Borrowing Restriction Rule</label>
                  <select
                    value={editReserveForm.duration}
                    onChange={e => setEditReserveForm({ ...editReserveForm, duration: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-teal-500 focus:outline-none font-medium"
                  >
                    <option>2 Hours In-Library Reading Only</option>
                    <option>Overnight Loan (After 4 PM)</option>
                    <option>Weekend Restricted Borrowing</option>
                    <option>Faculty In-Session Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Copies on Reserve Shelf</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editReserveForm.copies}
                    onChange={e => setEditReserveForm({ ...editReserveForm, copies: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-medium focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingReserve(null)}
                  disabled={isSavingEditReserve}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditReserve}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{isSavingEditReserve ? 'Updating Database...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Institutional Forgot Password / PIN Reset Modal */}
      {showResetModal && (
        <ForgotPasswordModal
          isOpen={showResetModal}
          initialRole="hod"
          initialIdentifier={currentDept?.code || 'CSC'}
          onClose={() => setShowResetModal(false)}
          onResetSuccess={() => {
            setShowResetModal(false);
            setProfileMsg({
              type: 'success',
              text: '✓ Password/PIN credentials successfully reset in database! You may now sign in with your new credentials.'
            });
            sounds.playSuccessChime();
          }}
        />
      )}

      {/* Dedicated HOD Dissertation / Capstone Ingestion Modal with Built-in Compression */}
      <HodDissertationUploadModal
        isOpen={isDissertationUploadModalOpen}
        onClose={() => setIsDissertationUploadModalOpen(false)}
        department={currentDept}
        onSuccess={() => {
          fetchDissertations();
          setSuccessMsg('✓ Capstone dissertation manuscript compressed, endorsed, and registered into the institutional repository!');
          setTimeout(() => setSuccessMsg(''), 8000);
        }}
      />

      {/* Quick Upload Compressed PDF Preview Modal */}
      {quickUploadPreviewPdf && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col p-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-t-2xl border border-slate-700">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <Sparkles size={14} className="text-teal-400" />
              <span>Verifying Compressed PDF Quality (In-Browser Rendering)</span>
            </span>
            <button
              onClick={() => setQuickUploadPreviewPdf('')}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              ✕ Close Preview
            </button>
          </div>
          <iframe
            src={quickUploadPreviewPdf}
            className="w-full h-full rounded-b-2xl border border-slate-700 bg-white"
            title="Compressed PDF Preview"
          />
        </div>
      )}

      {/* Institutional Duplicate Detection & Tracing Modal in HOD Dashboard */}
      <DuplicateBookModal
        isOpen={isDuplicateModalOpen}
        duplicateInfo={duplicateModalInfo}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setDuplicateModalInfo(null);
        }}
        onProceedAnyway={() => {
          bypassQuickUploadDupRef.current = true;
          setIsDuplicateModalOpen(false);
          handleSaveQuickUpload({ preventDefault: () => {} });
        }}
        onTrace={(book) => {
          setIsDuplicateModalOpen(false);
          const targetCard = duplicateModalInfo?.card_number || duplicateModalInfo?.book?.card_number || duplicateModalInfo?.book?.id || book?.id;
          if (targetCard && typeof window !== 'undefined') {
            window.location.hash = `#/reader/${encodeURIComponent(targetCard)}`;
          }
        }}
      />
    </div>
  );
}
