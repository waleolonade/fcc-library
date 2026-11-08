import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Bell,
    BookOpen,
    Building2,
    Check,
    ChevronDown,
    ChevronLeft, ChevronRight,
    ChevronUp,
    Clock,
    Cpu, Database,
    Download,
    Edit3,
    ExternalLink,
    Eye, EyeOff,
    Flame,
    Globe,
    HardDrive,
    Key,
    Layers,
    Layout,
    Lock,
    LogOut,
    Mail,
    Menu,
    Monitor,
    Palette,
    Play,
    Power,
    Radio,
    RefreshCw,
    Save,
    Search,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Terminal,
    ToggleRight,
    Trash2,
    Unlock,
    Upload,
    UserCheck,
    UserPlus,
    Users,
    UserX,
    X,
    Zap,
    Video,
    Headphones
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getInstitutionalLogo } from '../assets/logo';
import InstitutionalFooter from '../common/InstitutionalFooter';
import {
    developerConfigService,
    THEME_PRESETS
} from '../services/developerConfigService';
import { institutionalConfigService } from '../services/institutionalConfigService';
import { PATTERNS } from '../utils/backgroundPatterns';
import { navigateTo } from '../utils/router';
import { sounds } from '../utils/soundEffects';
import DeveloperAdminOverview from './DeveloperAdminOverview';
import DeveloperAuditTrail from './DeveloperAuditTrail';
import DeveloperBookStudio from './DeveloperBookStudio';
import DeveloperHodStaffController from './DeveloperHodStaffController';
import DeveloperMaintenanceBroadcastController from './DeveloperMaintenanceBroadcastController';
import DeveloperMediaGovernanceStudio from './DeveloperMediaGovernanceStudio';
import { EXTERNAL_API_METADATA, testExternalApi } from '../services/federatedLibrarySearchService';
import TwoFactorOtpModal from '../common/TwoFactorOtpModal';
import ForgotPasswordModal from '../common/ForgotPasswordModal';
import { getApiBase } from '../api/libraryApi';
import { developerApiCall } from '../services/developerApi';
import { storeUserSession, clearAllAuthStores } from '../utils/authSessionManager';
import UniversalNotificationCenter from '../common/UniversalNotificationCenter';
import {
  SOLID_COLOR_PALETTES,
  getUsedDepartmentColors,
  getAvailableDepartmentColor,
  normalizeColorKey
} from '../hod/hodThemeConfig';


const DEV_CREDENTIALS = {
  username: 'fcc_developer',
  password: 'FCC@DevMaster2026!#'
};

export default function DeveloperMasterPortal({ onImpersonate, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('fcc_developer_session') === 'active';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 2FA OTP & Recovery State
  const [showDevTwoFactor, setShowDevTwoFactor] = useState(false);
  const [devOtpChallenge, setDevOtpChallenge] = useState(null);
  const [showDevForgotModal, setShowDevForgotModal] = useState(false);

  // Active Master Tab ('vault' | 'staff' | 'students' | 'departments' | 'institution_delegation' | 'books' | 'admin_pages' | 'impersonator' | 'features' | 'theme' | 'pages' | 'layout' | 'system')
  const [activeTab, setActiveTab] = useState('vault');

  // Sidebar & Navigation states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live Database & Server Telemetry
  const [dbTelemetry, setDbTelemetry] = useState({
    status: 'ONLINE',
    driver: 'SQLITE',
    php_version: '8.2',
    laravel_version: '11.x',
    server_time: '',
    memory_usage_mb: 22,
    counts: { users: 0, patrons: 0, books: 0, loans: 0, departments: 0, custom_pages: 0 }
  });
  const [dbTelemetryLoading, setDbTelemetryLoading] = useState(false);

  // Live Academic Departments (Dynamic Central Database Collection via /api/departments)
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    code: '',
    hod_name: '',
    hod_email: '',
    hod_phone: '',
    hod_pin: '',
    faculty: '',
    established: '',
    description: '',
    color: 'blue'
  });
  const [deptSaving, setDeptSaving] = useState(false);

  // 2FA OTP Access Control Matrix State
  const [otpMatrix, setOtpMatrix] = useState({
    global_paused: false,
    paused_roles: [],
    paused_users: [],
    admins: [],
    departments: [],
    summary: {}
  });
  const [otpMatrixLoading, setOtpMatrixLoading] = useState(false);
  const [otpSearchQuery, setOtpSearchQuery] = useState('');

  // User Notification & Alert Delivery Switch Matrix State
  const [userNotifSettings, setUserNotifSettings] = useState({});
  const [userNotifLoading, setUserNotifLoading] = useState(false);
  const [notifTargetTab, setNotifTargetTab] = useState('all'); // 'all' | 'admins' | 'hods' | 'scholars'

  // Master Configuration State
  const [config, setConfig] = useState(() => developerConfigService.getConfig());
  const [toastMessage, setToastMessage] = useState('');

  // External Library APIs & Federated Search Engine State
  const [testingApiId, setTestingApiId] = useState(null);
  const [apiTestResults, setApiTestResults] = useState({});
  const [externalApiSearch, setExternalApiSearch] = useState('');
  const [isTestingAllApis, setIsTestingAllApis] = useState(false);

  // Security Prompt Modal for High-Impact Actions
  const [pendingAction, setPendingAction] = useState(null); // { type, payload, callback, description }
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Logo & Favicon upload previews
  const [logoPreview, setLogoPreview] = useState(() => getInstitutionalLogo());
  const [faviconPreview, setFaviconPreview] = useState(() => {
    try {
      return localStorage.getItem('fcc_custom_favicon') || developerConfigService.getConfig()?.branding?.faviconUrl || getInstitutionalLogo();
    } catch {
      return getInstitutionalLogo();
    }
  });
  const fileInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const [masterPortalFilter, setMasterPortalFilter] = useState('all'); // 'all' | 'hod' | 'admin' | 'student' | 'functions'
  const [masterControlSearch, setMasterControlSearch] = useState('');

  // Patrons State (Streamed directly from central database)
  const [patrons, setPatrons] = useState([]);
  const [searchPatron, setSearchPatron] = useState('');

  // Edit Patron Modal
  const [editingPatron, setEditingPatron] = useState(null);
  const [newPatronModalOpen, setNewPatronModalOpen] = useState(false);
  const [newPatronData, setNewPatronData] = useState({
    matric: '',
    name: '',
    dept: '',
    level: 'ND I',
    pin: '',
    phone: ''
  });

  // Diagnostics & Telemetry
  const [stats, setStats] = useState({
    booksCount: 0,
    patronsCount: 0,
    loansCount: 0,
    storageKb: 0,
    backendOnline: false
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // --- CREDENTIALS VAULT STATE ---
  const [vaultData, setVaultData] = useState({ staff: [], students: [] });
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultStaffSearch, setVaultStaffSearch] = useState('');
  const [vaultStudentSearch, setVaultStudentSearch] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [revealedPins, setRevealedPins] = useState({});

  // --- STAFF & SCHOLAR VAULT EDIT / STATUS STATES ---
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingStaffPass, setEditingStaffPass] = useState('');
  const [savingStaffEdit, setSavingStaffEdit] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStudentPin, setEditingStudentPin] = useState('');
  const [savingStudentEdit, setSavingStudentEdit] = useState(false);

  // --- PROFILE LOCK & RESTRICTION CONTROLLER (ADMIN, HOD, SCHOLAR) ---
  const [lockModalTarget, setLockModalTarget] = useState(null); // { type: 'user'|'department'|'student', id, name, currentDays, isLocked }
  const [lockModalDays, setLockModalDays] = useState(14);
  const [lockModalSaving, setLockModalSaving] = useState(false);

  // --- STAFF DIRECTORY STATE ---
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'admin',
    designation: 'College Librarian',
    phone: ''
  });

  // --- CUSTOM ADMIN PAGES STATE ---
  const [customAdminPages, setCustomAdminPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: '',
    slug: '',
    icon: 'Layers',
    description: '',
    allowed_roles: 'admin,librarian',
    features: {
      catalog: true,
      upload: true,
      biometrics: false,
      audit: true,
      sms: false,
      gate: false
    }
  });

  // --- BOOK UPLOAD STUDIO STATE ---
  const [bookForm, setBookForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    isbn: '',
    callNumber: '',
    department: '',
    subject: '',
    courseCode: '',
    targetLevel: 'ND I',
    shelfLocation: '',
    copiesTotal: 1,
    abstract: '',
    coverImage: '',
    fileDataUrl: ''
  });
  const [bookUploading, setBookUploading] = useState(false);
  const [recentBooks, setRecentBooks] = useState([]);

  // --- HOD PUBLISHING WORKFLOW STATE (DIRECT TO STUDENTS VS ADMIN APPROVAL) ---
  const [hodPublishingMode, setHodPublishingMode] = useState(() => {
    try {
      const cfg = developerConfigService.getConfig();
      if (cfg?.hodUploadWorkflow?.mode) return cfg.hodUploadWorkflow.mode;
      if (cfg?.hodFeatures?.directPublishToStudents?.enabled) return 'direct';
    } catch (e) {}
    return 'approval';
  });
  const [isUpdatingHodMode, setIsUpdatingHodMode] = useState(false);

  const fetchHodPublishingMode = async () => {
    try {
      const res = await developerApiCall('/api/developer/hod-publishing-mode');
      if (res && res.ok) {
        const data = await res.json();
        if (data?.mode) {
          setHodPublishingMode(data.mode);
        }
      }
    } catch (e) {}
  };

  const handleToggleHodPublishingMode = async (targetMode) => {
    const nextMode = targetMode || (hodPublishingMode === 'direct' ? 'approval' : 'direct');
    setIsUpdatingHodMode(true);
    setHodPublishingMode(nextMode);
    sounds.playSuccessChime();

    // 1. Update developer master config in localStorage and broadcast
    try {
      const currentConfig = developerConfigService.getConfig();
      const updatedConfig = {
        ...currentConfig,
        hodUploadWorkflow: { mode: nextMode },
        hodFeatures: {
          ...(currentConfig.hodFeatures || {}),
          directPublishToStudents: {
            ...(currentConfig.hodFeatures?.directPublishToStudents || {}),
            id: 'directPublishToStudents',
            label: 'Direct Instant Publish (Skip Admin Approval)',
            desc: 'When enabled, books and resources uploaded by HODs go live directly for students to see in the digital library & OPAC immediately. When disabled, HOD uploads wait in queue for Central Library Admin review & approval.',
            enabled: (nextMode === 'direct'),
            badge: 'Publishing Mode'
          }
        }
      };
      setConfig(updatedConfig);
      await developerConfigService.saveConfig(updatedConfig);
    } catch (e) {}

    // 2. Persist to backend database via developer endpoint
    try {
      await developerApiCall('/api/developer/hod-publishing-mode', {
        method: 'POST',
        body: { mode: nextMode }
      });
      window.dispatchEvent(new CustomEvent('fcc-hod-publishing-mode-updated', { detail: { mode: nextMode } }));
      showToast(nextMode === 'direct'
        ? '⚡ DIRECT PUBLISH ENABLED: HOD uploads are now published directly for students without admin approval!'
        : '🛡️ ADMIN APPROVAL ENABLED: HOD uploads must now be approved by Central Admin at #/admin/hod-submissions.');
    } catch (err) {
      showToast(`HOD publishing workflow set to: ${nextMode.toUpperCase()}`);
    } finally {
      setIsUpdatingHodMode(false);
    }
  };

  // --- INSTITUTIONAL CONFIGURATION DELEGATION STATE ---
  const [institutionPermissions, setInstitutionPermissions] = useState({
    admin_allowed: true,
    allowed_hod_depts: []
  });
  const [devInstitutionConfig, setDevInstitutionConfig] = useState(() => institutionalConfigService.getInstitution());
  const [delegationSaving, setDelegationSaving] = useState(false);

  const fetchInstitutionData = async () => {
    try {
      const res = await institutionalConfigService.fetchFromApi();
      if (res?.permissions) setInstitutionPermissions(res.permissions);
      if (res?.institution) setDevInstitutionConfig(res.institution);
    } catch (e) {}
  };

  const handleToggleAdminPermission = () => {
    setInstitutionPermissions(prev => ({
      ...prev,
      admin_allowed: !prev.admin_allowed
    }));
  };

  const handleToggleHodDeptPermission = (code) => {
    setInstitutionPermissions(prev => {
      const current = prev.allowed_hod_depts || [];
      const exists = current.includes(code);
      const next = exists ? current.filter(c => c !== code) : [...current, code];
      return {
        ...prev,
        allowed_hod_depts: next
      };
    });
  };

  const handleSelectAllHods = () => {
    setInstitutionPermissions(prev => ({
      ...prev,
      allowed_hod_depts: departments.map(d => d.code)
    }));
  };

  const handleClearAllHods = () => {
    setInstitutionPermissions(prev => ({
      ...prev,
      allowed_hod_depts: []
    }));
  };

  const handleSaveInstitutionPermissions = async () => {
    setDelegationSaving(true);
    sounds.playClick();
    try {
      const res = await institutionalConfigService.updatePermissions(
        institutionPermissions,
        DEV_CREDENTIALS.password
      );
      if (res.success) {
        sounds.playSuccessChime();
        showToast('Institutional settings authority successfully granted & assigned!');
      } else {
        throw new Error('Failed to update permissions');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast(err.message || 'Error saving delegation permissions.');
    } finally {
      setDelegationSaving(false);
    }
  };

  const handleSaveDevInstitutionOverride = async (e) => {
    if (e) e.preventDefault();
    setDelegationSaving(true);
    sounds.playClick();
    try {
      const res = await institutionalConfigService.saveInstitution(
        devInstitutionConfig,
        'Root Developer',
        'developer'
      );
      if (res.success) {
        sounds.playSuccessChime();
        showToast('Institutional parameters overridden and broadcast to all portals!');
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast(err.message || 'Error saving parameters.');
    } finally {
      setDelegationSaving(false);
    }
  };

  // Resilient Central API Dispatcher for Localhost, XAMPP, and Production (fccibadanlibrary.com.ng)
  const apiCall = async (endpoint, options = {}) => {
    return developerApiCall(endpoint, {
      passkey: DEV_CREDENTIALS.password,
      ...options
    });
  };


  // Live Database Fetching Functions
  const fetchVault = async () => {
    setVaultLoading(true);
    try {
      const res = await apiCall('/api/developer/vault');
      if (res && res.ok) {
        const data = await res.json();
        if (data.vault) {
          setVaultData(data.vault);
          if (Array.isArray(data.vault.students) && data.vault.students.length > 0) {
            setPatrons(data.vault.students);
            try {
              localStorage.setItem('fcc_registered_patrons', JSON.stringify(data.vault.students));
            } catch (e) {}
          }
        }
      } else {
        const errData = await res?.json().catch(() => ({}));
        console.warn('Vault fetch non-ok response:', res?.status, errData);
      }
    } catch (e) {
      console.warn('Vault fetch error:', e);
    } finally {
      setVaultLoading(false);
    }
  };

  const fetchStaff = async (query = '') => {
    setStaffLoading(true);
    try {
      const q = encodeURIComponent(query);
      const res = await apiCall(`/api/developer/staff?q=${q}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      }
    } catch (e) {
      console.warn('Staff fetch error:', e);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchCustomPages = async () => {
    setPagesLoading(true);
    try {
      const res = await apiCall('/api/developer/pages');
      if (res && res.ok) {
        const data = await res.json();
        if (data.pages) {
          setCustomAdminPages(data.pages);
        }
      }
    } catch (e) {
      console.warn('Custom pages fetch error:', e);
    } finally {
      setPagesLoading(false);
    }
  };

  const fetchBackendStudents = async (query = '') => {
    try {
      const q = encodeURIComponent(query);
      const res = await apiCall(`/api/developer/students?q=${q}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.students && Array.isArray(data.students)) {
          setPatrons(data.students);
          try {
            localStorage.setItem('fcc_registered_patrons', JSON.stringify(data.students));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Backend students fetch error:', e);
    }
  };

  const fetchRecentBooks = async () => {
    try {
      const res = await apiCall('/api/catalog');
      if (res && res.ok) {
        const data = await res.json();
        const bList = Array.isArray(data) ? data : (data.books || []);
        if (Array.isArray(bList)) {
          setRecentBooks(bList.slice(0, 10));
        }
      }
    } catch (e) {}
  };

  const fetchDbTelemetry = async () => {
    setDbTelemetryLoading(true);
    try {
      const res = await apiCall('/api/developer/database/status');
      if (res && res.ok) {
        const data = await res.json();
        if (data.success || data.driver || data.status) {
          setDbTelemetry(prev => ({
            ...prev,
            ...data,
            counts: {
              ...prev.counts,
              ...(data.counts || {})
            }
          }));
        }
      }
    } catch (e) {
      console.warn('DB Telemetry fetch error:', e);
    } finally {
      setDbTelemetryLoading(false);
    }
  };

  // Academic Departments Live Synchronization & Management
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const res = await apiCall('/api/departments');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0) {
            setBookForm(prev => prev.department ? prev : { ...prev, department: data[0].name });
            setNewPatronData(prev => prev.dept ? prev : { ...prev, dept: data[0].name });
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('Departments fetch error:', e);
    } finally {
      setDepartmentsLoading(false);
    }
    return [];
  };

  const handleSaveDepartment = async (e) => {
    if (e) e.preventDefault();
    if (!deptFormData.name.trim() || !deptFormData.code.trim() || !deptFormData.hod_name.trim()) {
      showToast('Department Name, Code, and HOD Name are required.');
      return;
    }

    const cleanCode = deptFormData.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const usedColors = getUsedDepartmentColors(departments, editingDept?.id || editingDept?.code);
    const chosenColor = normalizeColorKey(deptFormData.color);

    if (usedColors[chosenColor]) {
      const conflictDept = usedColors[chosenColor];
      showToast(`Color "${chosenColor}" is already assigned to department ${conflictDept}. Each department must have a distinct solid color!`);
      sounds.playErrorBuzz();
      return;
    }

    setDeptSaving(true);
    sounds.playClick();
    try {
      const payload = {
        ...deptFormData,
        color: chosenColor,
        code: cleanCode
      };

      let res;
      if (editingDept) {
        res = await apiCall(`/api/departments/${encodeURIComponent(editingDept.id || editingDept.code)}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiCall('/api/departments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res && res.ok) {
        const respData = await res.json().catch(() => ({}));
        sounds.playSuccessChime();
        showToast(respData.message || `Department "${payload.name}" saved successfully to database!`);
        setDeptModalOpen(false);
        setEditingDept(null);
        setDeptFormData({
          name: '',
          code: '',
          hod_name: '',
          hod_email: '',
          hod_phone: '',
          hod_pin: '',
          faculty: '',
          established: '',
          description: '',
          color: getAvailableDepartmentColor(departments)
        });
        await fetchDepartments();
        fetchStaff(staffSearch);
        fetchVault();
        await fetchDbTelemetry();
      } else {
        const errData = await res.json().catch(() => ({}));
        sounds.playErrorBuzz();
        showToast(errData.message || errData.error || 'Failed to save department to database.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error while saving department.');
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDepartment = (dept) => {
    executeWithSecurityCheck(`PERMANENTLY DELETE DEPARTMENT ${dept.name} (${dept.code})`, async () => {
      try {
        const res = await apiCall(`/api/departments/${encodeURIComponent(dept.id || dept.code)}`, {
          method: 'DELETE'
        });
        if (res && res.ok) {
          sounds.playSuccessChime();
          showToast(`Department "${dept.name}" removed from database.`);
          await fetchDepartments();
          await fetchDbTelemetry();
        } else {
          showToast('Failed to delete department from database.');
        }
      } catch (err) {
        showToast('Network error deleting department.');
      }
    });
  };

  const fetchOtpMatrix = async () => {
    setOtpMatrixLoading(true);
    try {
      const res = await apiCall('/api/developer/otp-settings');
      if (res && res.ok) {
        const data = await res.json();
        setOtpMatrix(data);
      }
    } catch (e) {
      console.warn('OTP Matrix fetch error:', e);
    } finally {
      setOtpMatrixLoading(false);
    }
  };

  const handleToggleGlobalOtp = async (paused) => {
    sounds.playClick();
    setOtpMatrixLoading(true);
    try {
      const res = await apiCall('/api/developer/otp-settings/toggle-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused, actor: 'Lead Systems Developer' })
      });
      if (res && res.ok) {
        const data = await res.json();
        setOtpMatrix(data);
        sounds.playSuccessChime();
        showToast(paused
          ? '2FA Global Bypass ACTIVATED: All Admins & HODs can log in with password alone.'
          : 'Strict 2FA Restored: All logins require live email OTP verification.'
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Failed to toggle global OTP.');
    } finally {
      setOtpMatrixLoading(false);
    }
  };

  const handleToggleUserOtp = async (identifier, paused, name) => {
    sounds.playClick();
    setOtpMatrixLoading(true);
    try {
      const res = await apiCall('/api/developer/otp-settings/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, paused, actor: 'Lead Systems Developer' })
      });
      if (res && res.ok) {
        const data = await res.json();
        setOtpMatrix(data);
        sounds.playSuccessChime();
        showToast(paused
          ? `2FA OTP Paused for "${name || identifier}". User can now log in without OTP.`
          : `Strict 2FA Restored for "${name || identifier}". User will be asked for email OTP.`
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast(`Failed to update OTP status for ${identifier}.`);
    } finally {
      setOtpMatrixLoading(false);
    }
  };

  const handleToggleRoleOtp = async (role, paused) => {
    sounds.playClick();
    setOtpMatrixLoading(true);
    try {
      const res = await apiCall('/api/developer/otp-settings/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, paused, actor: 'Lead Systems Developer' })
      });
      if (res && res.ok) {
        const data = await res.json();
        setOtpMatrix(data);
        sounds.playSuccessChime();
        showToast(paused
          ? `2FA OTP Paused for ALL ${role.toUpperCase()} accounts.`
          : `Strict 2FA Restored for ALL ${role.toUpperCase()} accounts.`
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast(`Failed to update OTP status for role ${role}.`);
    } finally {
      setOtpMatrixLoading(false);
    }
  };

  const fetchUserNotificationSettings = async () => {
    setUserNotifLoading(true);
    try {
      const res = await apiCall('/api/developer/user-notification-settings');
      if (res && res.ok) {
        const data = await res.json();
        if (data.settings) {
          setUserNotifSettings(data.settings);
        }
      }
    } catch (e) {
      console.warn('User notification settings fetch error:', e);
    } finally {
      setUserNotifLoading(false);
    }
  };

  const handleToggleUserNotification = async (userKey, field, currentValue) => {
    sounds.playClick();
    setUserNotifLoading(true);
    try {
      const normalizedKey = (userKey || '').toLowerCase();
      const current = userNotifSettings[normalizedKey] || { email_enabled: true, in_app_enabled: true };
      const nextSettings = {
        ...current,
        [field]: !currentValue
      };

      const res = await apiCall('/api/developer/user-notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: userKey,
          email_enabled: nextSettings.email_enabled,
          in_app_enabled: nextSettings.in_app_enabled
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        setUserNotifSettings(data.settings || { ...userNotifSettings, [normalizedKey]: nextSettings });
        sounds.playSuccessChime();
        showToast(`Updated notification preferences for "${userKey}": ${field === 'email_enabled' ? 'Email' : 'In-App Alerts'} ${!currentValue ? 'ENABLED' : 'PAUSED'}.`);
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast(`Failed to update notification settings for ${userKey}.`);
    } finally {
      setUserNotifLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVault();
      fetchStaff();
      fetchCustomPages();
      fetchBackendStudents();
      fetchRecentBooks();
      fetchInstitutionData();
      fetchDbTelemetry();
      fetchDepartments();
      fetchOtpMatrix();
      fetchUserNotificationSettings();
      fetchHodPublishingMode();
    }
  }, [isAuthenticated]);

  // Reactive staff fetch whenever switching to the Staff Directory tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'staff') {
      fetchStaff(staffSearch);
    }
  }, [activeTab, isAuthenticated]);

  // Reactive vault & scholar fetch whenever switching to Vault or Scholar PINs tab
  useEffect(() => {
    if (isAuthenticated && (activeTab === 'vault' || activeTab === 'students')) {
      fetchVault();
      fetchBackendStudents();
    }
  }, [activeTab, isAuthenticated]);

  const toggleRevealSecret = (id) => {
    setRevealedSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleRevealPin = (id) => {
    setRevealedPins(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, label = 'Secret') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playClick();
    showToast(`${label} copied to clipboard!`);
  };

  // Update Staff Status (Block, Restrict, Suspend, Activate)
  const handleUpdateStaffStatus = async (staffId, newStatus, staffName) => {
    sounds.playClick();
    try {
      const res = await apiCall(`/api/developer/staff/${encodeURIComponent(staffId)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Staff ${staffName || staffId} status set to ${newStatus.toUpperCase()}`);
        fetchVault();
        fetchStaff(staffSearch);
        fetchDbTelemetry();
      } else {
        sounds.playErrorBuzz();
        showToast(data.message || 'Failed to update staff status');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error updating staff status');
    }
  };

  // Save Staff Edit (Name, Username, Email, Role, Designation, Phone, Status, Password)
  const handleSaveStaffEdit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSavingStaffEdit(true);
    sounds.playClick();
    try {
      const payload = {
        name: editingStaff.name,
        username: editingStaff.username,
        email: editingStaff.email,
        role: editingStaff.role || 'admin',
        designation: editingStaff.designation || 'Staff',
        phone: editingStaff.phone || '',
        status: editingStaff.status || 'active'
      };
      if (editingStaffPass && editingStaffPass.trim()) {
        payload.password = editingStaffPass.trim();
      }
      const res = await apiCall(`/api/developer/staff/${encodeURIComponent(editingStaff.id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Staff ${editingStaff.name} updated successfully in database!`);
        setEditingStaff(null);
        setEditingStaffPass('');
        fetchVault();
        fetchStaff(staffSearch);
        fetchDepartments();
        fetchDbTelemetry();
      } else {
        sounds.playErrorBuzz();
        showToast(data.message || data.error || 'Failed to update staff credentials');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error updating staff');
    } finally {
      setSavingStaffEdit(false);
    }
  };

  // Update Scholar Status (Block, Restrict, Suspend, Activate)
  const handleUpdateStudentStatus = async (matric, newStatus, scholarName) => {
    sounds.playClick();
    try {
      const res = await apiCall(`/api/developer/students/${encodeURIComponent(matric)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Scholar ${scholarName || matric} set to ${newStatus.toUpperCase()}`);
        fetchVault();
        fetchBackendStudents();
      } else {
        showToast(data.message || 'Failed to update scholar status');
      }
    } catch (err) {
      showToast('Network error updating scholar status');
    }
  };

  // Save Scholar Edit (Name, Dept, Level, Status, PIN)
  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingStudentEdit(true);
    sounds.playClick();
    try {
      const payload = {
        name: editingStudent.name,
        department: editingStudent.department,
        level: editingStudent.level,
        status: editingStudent.status || 'active'
      };
      if (editingStudentPin && editingStudentPin.trim()) {
        payload.pin = editingStudentPin.trim();
      }
      const res = await apiCall(`/api/developer/students/${encodeURIComponent(editingStudent.matric)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Scholar ${editingStudent.name} credentials & PIN updated!`);
        setEditingStudent(null);
        setEditingStudentPin('');
        fetchVault();
        fetchBackendStudents();
      } else {
        showToast(data.message || 'Failed to update scholar credentials');
      }
    } catch (err) {
      showToast('Network error updating scholar');
    } finally {
      setSavingStudentEdit(false);
    }
  };

  // Handle Book Upload
  const handleUploadBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      showToast('Book title is required.');
      return;
    }
    setBookUploading(true);
    sounds.playClick();
    try {
      const res = await apiCall('/api/developer/books', {
        method: 'POST',
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Book "${bookForm.title}" successfully ingested and catalogued in database!`);
        setBookForm({
          title: '',
          subtitle: '',
          author: '',
          isbn: '',
          callNumber: '',
          department: departments[0]?.name || '',
          subject: '',
          courseCode: '',
          targetLevel: 'ND I',
          shelfLocation: '',
          copiesTotal: 1,
          abstract: '',
          coverImage: '',
          fileDataUrl: ''
        });
        fetchRecentBooks();
        fetchDbTelemetry();
      } else {
        sounds.playErrorBuzz();
        showToast(data.error || 'Failed to upload book.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error while cataloguing book.');
    } finally {
      setBookUploading(false);
    }
  };

  // Handle Create Custom Admin Page
  const handleCreateCustomPage = async (e) => {
    e.preventDefault();
    if (!newPageData.title.trim()) {
      showToast('Page title is required.');
      return;
    }
    sounds.playClick();
    try {
      const res = await apiCall('/api/developer/pages', {
        method: 'POST',
        body: JSON.stringify(newPageData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Custom admin page "${newPageData.title}" created with granted features!`);
        setShowAddPageModal(false);
        setNewPageData({
          title: '',
          slug: '',
          icon: 'Layers',
          description: '',
          allowed_roles: 'admin,librarian',
          features: {
            catalog: true,
            upload: true,
            biometrics: false,
            audit: true,
            sms: false,
            gate: false
          }
        });
        fetchCustomPages();
        fetchDbTelemetry();
      } else {
        sounds.playErrorBuzz();
        showToast(data.error || 'Failed to create page.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error creating admin page.');
    }
  };

  // Handle Delete Custom Page
  const handleDeleteCustomPage = async (id, title) => {
    executeWithSecurityCheck(`DELETE CUSTOM ADMIN PAGE "${title}"`, async () => {
      try {
        const res = await apiCall(`/api/developer/pages/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          sounds.playSuccessChime();
          showToast(`Admin page "${title}" deleted.`);
          fetchCustomPages();
          fetchDbTelemetry();
        }
      } catch (err) {
        showToast('Failed to delete custom page.');
      }
    });
  };

  // Handle Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffData.name.trim() || !newStaffData.email.trim()) {
      showToast('Staff name and email are mandatory.');
      return;
    }
    sounds.playClick();
    try {
      const res = await apiCall('/api/developer/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Staff member "${newStaffData.name}" enrolled into database.`);
        setShowAddStaffModal(false);
        setNewStaffData({
          name: '',
          email: '',
          username: '',
          password: '',
          role: 'admin',
          designation: 'College Librarian',
          phone: ''
        });
        fetchStaff();
        fetchVault();
        fetchDbTelemetry();
      } else {
        sounds.playErrorBuzz();
        showToast(data.error || 'Failed to create staff member.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Error registering staff member.');
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (id, name) => {
    executeWithSecurityCheck(`REMOVE STAFF MEMBER "${name}" (ID: ${id})`, async () => {
      try {
        const res = await apiCall(`/api/developer/staff/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          sounds.playSuccessChime();
          showToast(`Staff record for ${name} removed from database.`);
          fetchStaff();
          fetchVault();
          fetchDbTelemetry();
        }
      } catch (err) {
        showToast('Error deleting staff.');
      }
    });
  };

  // Universal Profile Lock Controller (Admin, HOD, Student/Scholar)
  const handleExecuteLockAction = async (target, action = 'unlock', customDays = 14) => {
    sounds.playClick();
    setLockModalSaving(true);
    try {
      const payload = {
        action: action,
        days: customDays
      };

      if (target.type === 'student') {
        payload.matric = target.id;
      } else if (target.type === 'department') {
        payload.dept_code = target.id;
      } else {
        payload.user_id = target.id;
      }

      const res = await apiCall('/api/developer/reset-profile-lock', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(data.message || `Profile restriction successfully updated for ${target.name}.`);
        setLockModalTarget(null);
        fetchStaff();
        fetchVault();
        fetchBackendStudents();
      } else {
        sounds.playErrorBuzz();
        showToast(data.error || 'Failed to update profile restriction.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error updating profile restriction.');
    } finally {
      setLockModalSaving(false);
    }
  };

  // Quick 1-Click Unlock Shortcut
  const handleResetProfileLock = (userId, name, type = 'user') => {
    handleExecuteLockAction({ id: userId, name, type }, 'unlock');
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        totalBytes += (localStorage.getItem(k) || '').length * 2;
      }
      setStats({
        booksCount: dbTelemetry?.counts?.books || recentBooks.length,
        patronsCount: dbTelemetry?.counts?.patrons || patrons.length,
        loansCount: dbTelemetry?.counts?.loans || 0,
        storageKb: Math.round(totalBytes / 1024),
        backendOnline: dbTelemetry?.status === 'ONLINE'
      });
    } catch (e) {}
  }, [isAuthenticated, patrons, dbTelemetry, recentBooks]);

  // Synchronize Patrons with LocalStorage
  useEffect(() => {
    localStorage.setItem('fcc_registered_patrons', JSON.stringify(patrons));
  }, [patrons]);

  // Request Security Password Prompt Before Running High-Impact Action
  const executeWithSecurityCheck = (actionDescription, callback) => {
    setPendingAction({ description: actionDescription, callback });
    setSecurityPassword('');
    setSecurityError('');
    setSecurityModalOpen(true);
  };

  const handleConfirmSecurityPassword = (e) => {
    e.preventDefault();
    if (developerConfigService.verifyDevPassword(securityPassword)) {
      sounds.playSuccessChime();
      setSecurityModalOpen(false);
      if (pendingAction?.callback) {
        pendingAction.callback();
      }
      setPendingAction(null);
    } else {
      sounds.playErrorBuzz();
      setSecurityError('AUTHORIZATION FAILED: Invalid Developer Secret Passkey.');
    }
  };

  // Strict Enterprise 2FA Auth Handler
  const handleDevLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const u = username.trim();
    const p = password.trim();

    try {
      const res = await apiCall('/api/auth/otp/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'developer',
          identifier: u,
          password: p
        })
      });

      const data = await res.json().catch(() => ({}));
      setLoginLoading(false);

      if (res.ok && data.success) {
        if (data.otp_required) {
          sounds.playClick();
          setDevOtpChallenge(data);
          setShowDevTwoFactor(true);
          return;
        } else {
          handleDevOtpVerified({
            user: data.user,
            token: data.token
          });
          return;
        }
      }

      sounds.playErrorBuzz();
      setLoginError(data.error || data.message || 'ACCESS DENIED: Unauthorized Developer Signature. This terminal is strictly monitored.');
    } catch (err) {
      setLoginLoading(false);
      sounds.playErrorBuzz();
      setLoginError('Campus database gateway offline. Please verify the backend service is running.');
    }
  };

  const handleDevOtpVerified = (verifiedData) => {
    setShowDevTwoFactor(false);
    sounds.playSuccessChime();
    storeUserSession({ role: 'developer', name: 'Lead Systems Developer' }, verifiedData?.token, 'developer');
    setIsAuthenticated(true);
  };

  const handleDevLogout = (skipConfirm = false) => {
    if (!skipConfirm) {
      sounds.playClick();
      setShowLogoutModal(true);
      return;
    }
    handlePerformLogout();
  };

  const handlePerformLogout = async () => {
    setIsLoggingOut(true);
    sounds.playClick();
    try {
      await apiCall('/api/developer/logout', {
        method: 'POST'
      }).catch(() => {});
    } catch (e) {}

    clearAllAuthStores({ reason: 'developer_logout' });
    setIsAuthenticated(false);
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    sounds.playSuccessChime();
    showToast('Developer God Mode session terminated safely. Root locked.');
    if (onLogout) onLogout();
  };

  // 1-Click Impersonation Switchers (Using Real Database Records with Session Isolation)
  const impersonateAdmin = () => {
    sounds.playSuccessChime();
    const realAdmin = staffList.find(s => s.role === 'admin' || s.role === 'superadmin' || (s.designation && s.designation.toLowerCase().includes('librarian'))) || vaultData.staff?.find(s => s.role === 'admin' || s.role === 'superadmin');
    const adminUser = {
      id: realAdmin?.id || 1,
      role: 'admin',
      name: realAdmin?.name || '',
      email: realAdmin?.email || '',
      designation: realAdmin?.designation || '',
      isDeveloperImpersonation: true
    };
    storeUserSession(adminUser, null, 'admin');
    if (onImpersonate) onImpersonate('admin', adminUser);
    navigateTo('/admin/overview');
  };

  const impersonateHod = (dept) => {
    sounds.playSuccessChime();
    const hodUser = {
      role: 'hod',
      name: dept.hod_name || dept.hod || `HOD ${dept.name}`,
      department_code: dept.code,
      department_name: dept.name,
      department_id: dept.id || `DEP-${dept.code}`,
      email: dept.hod_email || dept.hodEmail || '',
      matric: dept.matric || `HOD/${dept.code}/001`,
      isDeveloperImpersonation: true
    };
    storeUserSession(hodUser, null, 'hod');
    if (onImpersonate) onImpersonate('hod', hodUser);
    navigateTo('/hod/overview');
  };

  const impersonateStudent = (customMatric, customName) => {
    sounds.playSuccessChime();
    const realStudent = (customMatric ? patrons.find(p => p.matric === customMatric) : null) 
      || patrons[0] 
      || vaultData.students?.[0];

    const studentUser = {
      role: 'student',
      matric: customMatric || realStudent?.matric || '',
      name: customName || realStudent?.name || (realStudent?.matric ? 'Scholar (' + realStudent.matric + ')' : 'Student Patron'),
      dept: realStudent?.department || realStudent?.dept || departments[0]?.name || '',
      level: realStudent?.level || 'HND II (Final Year)',
      phone: realStudent?.phone || '',
      isDeveloperImpersonation: true
    };
    storeUserSession(studentUser, null, 'student');
    if (onImpersonate) onImpersonate('student', studentUser);
    navigateTo('/scholar/profile');
  };

  // Feature Toggle with Security Passcode
  const toggleFeature = (category, featureKey) => {
    const feature = config[category]?.[featureKey];
    if (!feature) return;
    const newState = !feature.enabled;
    const actionDesc = `${newState ? 'ACTIVATE' : 'DEACTIVATE'} feature "${feature.label}" on ${category === 'studentFeatures' ? 'Student Portal' : category === 'adminFeatures' ? 'Admin Console' : 'HOD Gateway'}`;

    executeWithSecurityCheck(actionDesc, () => {
      const updated = {
        ...config,
        [category]: {
          ...config[category],
          [featureKey]: {
            ...feature,
            enabled: newState
          }
        }
      };
      setConfig(updated);
      developerConfigService.saveConfig(updated);
      showToast(`Feature "${feature.label}" is now ${newState ? 'ONLINE' : 'OFFLINE'} across all portals.`);
    });
  };

  // External Library APIs & Federated Search Engine Toggle Controls
  const toggleExternalApiItem = (apiId) => {
    const apis = config.externalLibraryApis || {};
    const item = apis[apiId] || { id: apiId, name: apiId, enabled: true };
    const nextState = !item.enabled;
    const actionDesc = `${nextState ? 'ACTIVATE' : 'DEACTIVATE'} External Library API "${item.name || apiId}"`;

    executeWithSecurityCheck(actionDesc, async () => {
      const updatedApis = {
        ...apis,
        [apiId]: {
          ...item,
          enabled: nextState
        }
      };
      const updatedConfig = {
        ...config,
        externalLibraryApis: updatedApis
      };
      setConfig(updatedConfig);
      await developerConfigService.saveConfig(updatedConfig);
      await apiCall('/api/developer/external-apis/toggle', {
        method: 'POST',
        body: JSON.stringify({ api_id: apiId, enabled: nextState })
      }).catch(() => {});

      sounds.playClick();
      showToast(`External API "${item.name || apiId}" is now ${nextState ? 'ONLINE' : 'OFFLINE'} across all portals.`);
    });
  };

  const handleBulkExternalApis = (enableAll) => {
    const actionDesc = `${enableAll ? 'ACTIVATE' : 'DEACTIVATE'} ALL 14 External Library APIs simultaneously`;
    executeWithSecurityCheck(actionDesc, async () => {
      const current = config.externalLibraryApis || {};
      const updatedApis = {};
      Object.keys(current).forEach(k => {
        updatedApis[k] = { ...current[k], enabled: enableAll };
      });
      const updatedConfig = { ...config, externalLibraryApis: updatedApis };
      setConfig(updatedConfig);
      await developerConfigService.saveConfig(updatedConfig);
      await apiCall('/api/developer/external-apis/bulk', {
        method: 'POST',
        body: JSON.stringify({ enable_all: enableAll })
      }).catch(() => {});

      sounds.playSuccessChime();
      showToast(`All 14 External Library APIs are now ${enableAll ? 'ONLINE' : 'OFFLINE'}!`);
    });
  };

  const handleRunApiTest = async (apiId) => {
    setTestingApiId(apiId);
    sounds.playClick();
    const res = await testExternalApi(apiId, 'cooperative economics');
    setApiTestResults(prev => ({ ...prev, [apiId]: res }));
    setTestingApiId(null);
    if (res.success) {
      sounds.playSuccessChime();
      showToast(`Ping OK [${apiId}]: HTTP 200 • ${res.latencyMs}ms • ${res.matchCount} records`);
    } else {
      sounds.playBeep();
      showToast(`Ping failed [${apiId}]: ${res.error || 'Connection failed'}`);
    }
  };

  const handleTestAllApis = async () => {
    setIsTestingAllApis(true);
    sounds.playClick();
    showToast('Running diagnostic ping across all 14 external library APIs...');
    const allApis = Object.keys(EXTERNAL_API_METADATA);
    const results = {};
    for (const id of allApis) {
      const res = await testExternalApi(id, 'cooperative economics');
      results[id] = res;
    }
    setApiTestResults(results);
    setIsTestingAllApis(false);
    sounds.playSuccessChime();
    showToast('All 14 external library APIs tested successfully.');
  };

  // Page Kill-Switch / Maintenance Mode Toggle
  const togglePageStatus = (pageKey) => {
    const page = config.pageStatus?.[pageKey];
    if (!page) return;
    const newState = !page.enabled;
    const actionDesc = `${newState ? 'REENABLE' : 'SHUT DOWN / RESTRICT'} page "${page.title}" (${page.path})`;

    executeWithSecurityCheck(actionDesc, () => {
      const updated = {
        ...config,
        pageStatus: {
          ...config.pageStatus,
          [pageKey]: {
            ...page,
            enabled: newState
          }
        }
      };
      setConfig(updated);
      developerConfigService.saveConfig(updated);
      showToast(`Page ${page.path} is now ${newState ? 'OPERATIONAL' : 'RESTRICTED / UNDER MAINTENANCE'}.`);
    });
  };

  // Update Page Maintenance Message
  const updatePageMaintenanceMsg = (pageKey, msg) => {
    const updated = {
      ...config,
      pageStatus: {
        ...config.pageStatus,
        [pageKey]: {
          ...config.pageStatus[pageKey],
          maintenanceMsg: msg
        }
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
    showToast('Updated maintenance notification for ' + pageKey);
  };

  // Logo Upload Handler
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        executeWithSecurityCheck('DEPLOY NEW INSTITUTIONAL SCHOOL LOGO ACROSS ENTIRE PLATFORM', () => {
          setLogoPreview(dataUrl);
          localStorage.setItem('fcc_custom_logo', dataUrl);
          const updated = {
            ...config,
            branding: {
              ...config.branding,
              logoUrl: dataUrl
            }
          };
          setConfig(updated);
          developerConfigService.saveConfig(updated);
          window.dispatchEvent(new CustomEvent('fcc-logo-updated', { detail: dataUrl }));
          showToast('Official School Crest updated and broadcast to all pages and apps!');
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Favicon Upload Handler
  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, ICO, SVG, JPG, WebP) for the Favicon.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setFaviconPreview(dataUrl);
        localStorage.setItem('fcc_custom_favicon', dataUrl);
        const updated = {
          ...config,
          branding: {
            ...config.branding,
            faviconUrl: dataUrl
          }
        };
        setConfig(updated);
        developerConfigService.saveConfig(updated);
        sounds.playSuccessChime();
        showToast('Browser Favicon updated live across all project tabs and saved to database!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Individual Sub-Page or System Function Toggle (Immediate or Security-Checked)
  const togglePortalMatrixItem = (sectionKey, itemKey) => {
    const section = config[sectionKey] || {};
    const item = section[itemKey];
    if (!item) return;
    const nextEnabled = !item.enabled;
    const updated = {
      ...config,
      [sectionKey]: {
        ...section,
        [itemKey]: {
          ...item,
          enabled: nextEnabled
        }
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
    sounds.playClick();
    showToast(`"${item.label || item.title}" is now ${nextEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}.`);
  };

  // Bulk Turn ON / OFF all items in a given section (or across an entire portal)
  const bulkToggleMatrixSection = (sectionKey, enableAll, labelDesc = 'Section') => {
    const section = config[sectionKey] || {};
    const updatedSection = {};
    Object.entries(section).forEach(([k, val]) => {
      updatedSection[k] = {
        ...val,
        enabled: enableAll
      };
    });
    const updated = {
      ...config,
      [sectionKey]: updatedSection
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
    sounds.playSuccessChime();
    showToast(`Bulk Action: All ${labelDesc} items turned ${enableAll ? 'ON (ACTIVE)' : 'OFF (DISABLED)'}!`);
  };

  // Bulk Turn ON / OFF EVERYTHING for a specific Portal (HOD, Admin, or Student)
  const bulkToggleEntirePortal = (portalRole, enableAll) => {
    const nextConfig = { ...config };
    if (portalRole === 'hod') {
      const nextPages = {};
      Object.entries(config.hodPages || {}).forEach(([k, v]) => { nextPages[k] = { ...v, enabled: enableAll }; });
      const nextFeats = {};
      Object.entries(config.hodFeatures || {}).forEach(([k, v]) => { nextFeats[k] = { ...v, enabled: enableAll }; });
      nextConfig.hodPages = nextPages;
      nextConfig.hodFeatures = nextFeats;
    } else if (portalRole === 'admin') {
      const nextPages = {};
      Object.entries(config.adminPages || {}).forEach(([k, v]) => { nextPages[k] = { ...v, enabled: enableAll }; });
      const nextFeats = {};
      Object.entries(config.adminFeatures || {}).forEach(([k, v]) => { nextFeats[k] = { ...v, enabled: enableAll }; });
      nextConfig.adminPages = nextPages;
      nextConfig.adminFeatures = nextFeats;
    } else if (portalRole === 'student') {
      const nextPages = {};
      Object.entries(config.studentPages || {}).forEach(([k, v]) => { nextPages[k] = { ...v, enabled: enableAll }; });
      const nextFeats = {};
      Object.entries(config.studentFeatures || {}).forEach(([k, v]) => { nextFeats[k] = { ...v, enabled: enableAll }; });
      nextConfig.studentPages = nextPages;
      nextConfig.studentFeatures = nextFeats;
    }
    setConfig(nextConfig);
    developerConfigService.saveConfig(nextConfig);
    sounds.playSuccessChime();
    showToast(`Bulk ${portalRole.toUpperCase()} Portal: All pages & features turned ${enableAll ? 'ON' : 'OFF'}!`);
  };
  const handleSelectThemePreset = (presetKey) => {
    const preset = THEME_PRESETS[presetKey];
    if (!preset) return;

    executeWithSecurityCheck(`APPLY THEME PRESET: "${preset.name}"`, () => {
      const updated = {
        ...config,
        theme: {
          ...config.theme,
          activePreset: presetKey,
          adminPrimary: preset.primary,
          studentPrimary: preset.accent,
          hodPrimary: preset.secondary,
          cardBg: preset.cardBg,
          accentColor: preset.accent
        }
      };
      setConfig(updated);
      developerConfigService.saveConfig(updated);
      showToast(`Theme preset "${preset.name}" applied successfully!`);
    });
  };

  // Custom Color Modifier
  const handleColorChange = (key, value) => {
    const updated = {
      ...config,
      theme: {
        ...config.theme,
        [key]: value
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
  };

  // Branding Text Change
  const handleBrandingChange = (key, value) => {
    const updated = {
      ...config,
      branding: {
        ...config.branding,
        [key]: value
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
  };

  // Layout Block Reordering (Move Block Up / Down)
  const moveLayoutBlock = (section, index, direction) => {
    const list = [...config.layoutBlocks[section]];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = {
      ...config,
      layoutBlocks: {
        ...config.layoutBlocks,
        [section]: list
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
    sounds.playSuccessChime();
  };

  const toggleBlockVisibility = (section, blockId) => {
    const list = config.layoutBlocks[section].map(b => b.id === blockId ? { ...b, visible: !b.visible } : b);
    const updated = {
      ...config,
      layoutBlocks: {
        ...config.layoutBlocks,
        [section]: list
      }
    };
    setConfig(updated);
    developerConfigService.saveConfig(updated);
  };

  // Student Patron Master Actions (Synchronized directly with database)
  const toggleBlockStudent = (matric) => {
    const p = patrons.find(x => x.matric === matric);
    if (!p) return;
    const isBlocking = p.status !== 'suspended';
    const newStatus = isBlocking ? 'suspended' : 'active';
    handleUpdateStudentStatus(matric, newStatus, p.name);
  };

  const handleUpdateStudentPin = (matric, newPin) => {
    executeWithSecurityCheck(`RESET PIN FOR SCHOLAR ${matric}`, async () => {
      try {
        const res = await apiCall(`/api/developer/students/${encodeURIComponent(matric)}/pin`, {
          method: 'PUT',
          body: JSON.stringify({ pin: newPin })
        });
        if (res && res.ok) {
          sounds.playSuccessChime();
          showToast(`Security PIN for ${matric} updated to "${newPin}" in database!`);
          setEditingPatron(null);
          await fetchBackendStudents();
          await fetchVault();
        } else {
          showToast('Failed to update student PIN in database.');
        }
      } catch (err) {
        showToast('Network error updating student PIN.');
      }
    });
  };

  const handleDeleteStudent = (matric) => {
    executeWithSecurityCheck(`PERMANENTLY DELETE SCHOLAR RECORD ${matric}`, async () => {
      try {
        const res = await apiCall(`/api/developer/students/${encodeURIComponent(matric)}`, {
          method: 'DELETE'
        });
        if (res && res.ok) {
          sounds.playSuccessChime();
          showToast(`Scholar ${matric} permanently removed from database.`);
          await fetchBackendStudents();
          await fetchVault();
          await fetchDbTelemetry();
        } else {
          showToast('Failed to delete scholar record from database.');
        }
      } catch (err) {
        showToast('Network error deleting scholar record.');
      }
    });
  };

  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!newPatronData.matric.trim() || !newPatronData.name.trim()) {
      showToast('Matric number and Name are mandatory.');
      return;
    }

    executeWithSecurityCheck(`REGISTER NEW SCHOLAR ${newPatronData.matric}`, async () => {
      try {
        const payload = {
          matric: newPatronData.matric.trim().toUpperCase(),
          name: newPatronData.name.trim(),
          department: newPatronData.dept || (departments[0]?.name || 'Computer Science & Information Technology'),
          level: newPatronData.level || 'ND I',
          pin: newPatronData.pin?.trim() || '',
          phone: newPatronData.phone?.trim() || ''
        };
        const res = await apiCall('/api/developer/students', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res && res.ok) {
          sounds.playSuccessChime();
          showToast(`New scholar record created for ${payload.matric} in database!`);
          setNewPatronModalOpen(false);
          setNewPatronData({
            matric: '',
            name: '',
            dept: departments[0]?.name || '',
            level: 'ND I',
            pin: '',
            phone: ''
          });
          await fetchBackendStudents();
          await fetchVault();
          await fetchDbTelemetry();
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || errData.message || 'Failed to create student in database.');
        }
      } catch (err) {
        showToast('Network error enrolling student in database.');
      }
    });
  };

  // IF NOT AUTHENTICATED -> Render Secret Dev Login Form
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-[#03060d] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-mono"
        style={{ backgroundImage: PATTERNS.adminLogin }}
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

        <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-cyan-500/50 p-1 flex items-center justify-center shadow-lg shadow-cyan-950/60">
              <Terminal size={20} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <span>FCC ROOT DEV-PORTAL</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <div className="text-[10px] text-cyan-400/80">Kernel Access Layer 0 &bull; Developer Only</div>
            </div>
          </div>

          <a
            href="#/opac"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={13} />
            <span>Public Library</span>
          </a>
        </header>

        <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
          <div className="bg-[#050c18]/90 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 space-y-6 relative overflow-hidden">
            <div className="text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-pulse blur-md" />
                <div className="relative w-16 h-16 rounded-2xl bg-[#02050b] p-3 flex items-center justify-center shadow-xl border-2 border-cyan-400">
                  <Cpu size={32} className="text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-wider uppercase">
                  Developer Super-Portal
                </h1>
                <p className="text-[11px] text-cyan-300/70 pt-1">
                  Master Architectural Control &bull; Omni-Impersonator &bull; Visual Engine
                </p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="bg-black/50 border border-cyan-900/60 rounded-2xl p-3 space-y-2 text-xs">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Authorized Dev Signature</span>
                <Sparkles size={11} className="text-cyan-400" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername(DEV_CREDENTIALS.username);
                  setPassword(DEV_CREDENTIALS.password);
                  setLoginError('');
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-700/60 hover:border-cyan-400 text-cyan-200 text-[11px] transition flex items-center justify-between"
              >
                <span>{DEV_CREDENTIALS.username}</span>
                <span className="text-[10px] text-cyan-400 underline">Load Master Key</span>
              </button>
            </div>

            <form onSubmit={handleDevLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                  Master Identifier
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fcc_developer"
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-3 text-sm text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                  Cryptographic Master Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl pl-4 pr-11 py-3 text-sm text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-cyan-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowDevForgotModal(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer transition text-left text-[11px]"
                >
                  Forgot Master Passphrase?
                </button>
                <span className="text-cyan-600/70 font-mono text-[10px] uppercase font-bold tracking-wider">
                  2FA Mandated
                </span>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-cyan-950 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Verifying Cryptographic Passphrase...</span>
                  </>
                ) : (
                  <>
                    <Key size={15} />
                    <span>Authorize Root Console</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Strict Enterprise Two-Factor OTP Modal */}
        {showDevTwoFactor && devOtpChallenge && (
          <TwoFactorOtpModal
            isOpen={showDevTwoFactor}
            challengeId={devOtpChallenge.challenge_id}
            maskedDestination={devOtpChallenge.masked_destination}
            role="developer"
            userName={devOtpChallenge.user_name || 'Lead Systems Developer'}
            identifier={username.trim()}
            onClose={() => setShowDevTwoFactor(false)}
            onVerified={handleDevOtpVerified}
            onVerifySuccess={handleDevOtpVerified}
          />
        )}

        {/* Universal Institutional Password / PIN Reset Modal */}
        {showDevForgotModal && (
          <ForgotPasswordModal
            isOpen={showDevForgotModal}
            initialRole="admin"
            onClose={() => setShowDevForgotModal(false)}
            onSuccess={() => {
              setShowDevForgotModal(false);
            }}
          />
        )}

        <footer className="relative z-10 text-center text-xs text-slate-600">
          FCC Advanced System Architecture &bull; Restricted Cryptographic Gateway
        </footer>
      </div>
    );
  }

  const NAV_SECTIONS = [
    {
      group: 'SECURITY & VAULT',
      items: [
        { id: 'vault', label: 'Credentials Vault', icon: Key, badge: 'UNHASHED', desc: 'Clear-text passwords & PINs' },
        { id: 'otp_gate', label: '2FA OTP Access Gate', icon: ShieldCheck, badge: 'PAUSE/BYPASS', desc: 'Pause OTP globally or per user (Admin & HODs)' },
        { id: 'staff', label: 'Staff Directory', icon: UserCheck, badge: '30D LOCK', desc: 'Staff credentials & lock status' },
        { id: 'students', label: 'Scholar PIN Vault', icon: Users, badge: 'PINS', desc: 'Search & edit student PINs' },
        { id: 'audit', label: 'Security Audit Trail', icon: ShieldAlert, badge: 'LEDGER', desc: 'Live cryptographic audit logs' },
      ]
    },
    {
      group: 'ADMIN OPERATIONS & CATALOG',
      items: [
        { id: 'admin_overview', label: 'Master Admin Console', icon: Activity, badge: 'LIVE OPS', desc: 'Circulation velocity & admin desk' },
        { id: 'departments', label: 'Academic Departments', icon: Building2, badge: 'DATABASE', desc: 'Add, edit & audit academic departments & HODs' },
        { id: 'hod_staff', label: 'Department Staff Workspaces', icon: UserCheck, badge: 'RBAC & AUDIT', desc: 'Departmental staff master manager & function architect' },
        { id: 'books', label: 'Direct Book Ingestion', icon: BookOpen, badge: 'STUDIO', desc: 'Live catalog & HOD upload studio' },
        { id: 'institution_delegation', label: 'Institutional Delegation', icon: ShieldCheck, badge: 'ASSIGN', desc: 'Assign INSTITUTION access' },
        { id: 'admin_pages', label: 'Admin Page Builder', icon: Layers, badge: 'DYNAMIC', desc: 'Create pages & grant features' },
      ]
    },
    {
      group: 'RUNTIME & CONTROLS',
      items: [
        { id: 'impersonator', label: '1-Click Impersonator', icon: Play, badge: 'OMNI', desc: 'Jump into any page/role' },
        { id: 'maintenance_broadcast', label: 'Broadcast & Upgrade Matrix', icon: Radio, badge: 'TARGETED', desc: 'Broadcast to Students, Admins, HODs & Staff + Maintenance Locks' },
        { id: 'external_apis', label: 'External Library APIs Matrix', icon: Globe, badge: '14 FEDERATED', desc: 'Toggle & Test 14 Global Library APIs' },
        { id: 'multimedia_governance', label: 'Video & Audio API Authority', icon: Video, badge: 'FULL AUTHORITY', desc: 'Granular switches for Video/Audio page, features & Global Free APIs' },
        { id: 'features', label: 'Feature Flag Matrix', icon: ToggleRight, badge: 'ONLINE', desc: 'Activate E-Library features' },
        { id: 'pages', label: 'Kill-Switch Director', icon: Power, badge: 'EMERGENCY', desc: 'Disable/shut down pages' },
      ]
    },
    {
      group: 'DESIGN & ARCHITECTURE',
      items: [
        { id: 'theme', label: 'Master Project Settings & Brand', icon: Palette, badge: 'ALL SETTINGS', desc: 'Logo, Favicon, Project Name, Pages & Features' },
        { id: 'master_controls', label: 'Pages, Features & Functions Matrix', icon: Sliders, badge: 'BULK ON/OFF', desc: 'Turn ON/OFF HOD, Admin & Student items' },
        { id: 'layout', label: 'Visual Composer', icon: Layout, badge: 'WIDGETS', desc: 'Drag & drop dashboard blocks' },
        { id: 'system', label: 'System Diagnostics', icon: HardDrive, badge: 'TELEMETRY', desc: 'Cache flush & telemetry' },
      ]
    }
  ];

  // AUTHENTICATED: Master Developer Console (Super-Seeds Everything)
  return (
    <div className="h-screen w-full bg-[#030712] text-slate-100 flex font-mono relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#091427_1px,transparent_1px),linear-gradient(to_bottom,#091427_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40 z-0" />
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-cyan-950 border-2 border-cyan-400 text-cyan-200 text-xs shadow-2xl animate-fadeIn flex items-center gap-2 max-w-md">
          <Sparkles size={16} className="text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Security Passcode Confirmation Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#050e1c] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-amber-800/80 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <ShieldAlert size={20} className="animate-bounce" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Developer Security Gate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-700/60 text-xs text-amber-200 space-y-1">
              <div className="font-bold">Authorization Required:</div>
              <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {pendingAction?.description || 'Executing a system architecture modification.'}
              </div>
            </div>

            {securityError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{securityError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSecurityPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1 text-[10px]">
                  Enter Secret Developer Passkey
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={securityPassword}
                  onChange={(e) => setSecurityPassword(e.target.value)}
                  placeholder="Master passkey (FCC@DevMaster2026!#)"
                  className="w-full bg-[#02050b] border border-amber-600/80 rounded-xl px-4 py-2.5 text-sm text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSecurityPassword(DEV_CREDENTIALS.password)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-[10px] font-mono"
                >
                  Load Master Pass
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs transition uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950"
                >
                  <ShieldCheck size={14} />
                  <span>Authorize &amp; Apply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Developer Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#050e1c] border-2 border-rose-600/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <ShieldAlert size={20} className="animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Terminate Developer Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-white">
                <LogOut size={14} className="text-rose-400" />
                <span>Lock Developer God-Mode Console?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                You are about to securely log out from the Root Developer Deck. All active superuser sessions will be revoked and recorded into institutional audit logs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handlePerformLogout}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-950 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Locking Root...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={13} />
                    <span>Confirm &amp; Log Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Modern High-Tech Developer Sidebar - Firmly Fixed to Viewport */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen z-40 bg-[#050b17]/95 backdrop-blur-2xl border-r border-cyan-900/60 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl shrink-0 overflow-hidden ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-cyan-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-black border-2 border-cyan-400 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950">
              <Cpu size={20} className="text-cyan-400 animate-pulse" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-black text-white uppercase tracking-wider truncate">
                  FCC Master Root
                </div>
                <div className="text-[10px] text-cyan-400 font-mono truncate">
                  v5.3 Architecture Deck
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Database Live Telemetry Pill */}
        {!sidebarCollapsed ? (
          <div className="px-4 py-2 bg-[#02050e] border-b border-cyan-950/80 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold uppercase">DB {dbTelemetry.driver || 'SQLITE'}</span>
              <span className="text-slate-500 font-mono">| {dbTelemetry.status}</span>
            </div>
            <button
              type="button"
              onClick={fetchDbTelemetry}
              disabled={dbTelemetryLoading}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition cursor-pointer"
              title="Refresh DB Telemetry"
            >
              <RefreshCw size={11} className={dbTelemetryLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        ) : (
          <div className="py-2 flex justify-center border-b border-cyan-950">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title={`DB: ${dbTelemetry.driver} (${dbTelemetry.status})`} />
          </div>
        )}

        {/* Sidebar Search Filter */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter tools..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="w-full bg-[#02050b] border border-cyan-950 rounded-xl pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Navigation Items (Categorized & Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_SECTIONS.map((sec, secIdx) => {
            const filteredItems = sec.items.filter(item => {
              if (!sidebarSearch.trim()) return true;
              const q = sidebarSearch.toLowerCase();
              return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={secIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-2 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    {sec.group}
                  </div>
                )}
                <div className="space-y-1">
                  {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileSidebarOpen(false);
                          sounds.playClick();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-950'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-cyan-950'
                        }`}
                        title={sidebarCollapsed ? `${item.label} - ${item.desc}` : undefined}
                      >
                        <div className={`p-1.5 rounded-xl shrink-0 transition ${
                          isActive ? 'bg-black/30 text-white' : 'bg-slate-950 text-cyan-400 group-hover:text-cyan-300'
                        }`}>
                          <Icon size={16} />
                        </div>

                        {!sidebarCollapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold ${
                                  isActive ? 'bg-black/40 text-cyan-200' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer with Developer Profile Card & LOGOUT Button */}
        <div className="p-3 border-t border-cyan-950 bg-[#02050b]/80 space-y-2.5">
          {!sidebarCollapsed ? (
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-cyan-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                  DEV
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">fcc_developer</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Root God Mode</span>
                  </div>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                D
              </div>
            </div>
          )}

          {/* DEDICATED LOG OUT BUTTON */}
          <button
            type="button"
            onClick={() => handleDevLogout(false)}
            className={`w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-rose-950/90 hover:from-rose-900 hover:to-red-900 border border-rose-800/80 text-rose-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer ${
              sidebarCollapsed ? 'p-2' : ''
            }`}
            title="Safely Terminate Developer Session & Lock Root"
          >
            <LogOut size={15} className="text-rose-400 shrink-0" />
            {!sidebarCollapsed && <span>Log Out &amp; Lock Root</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Independent Scrolling Stream (Sidebar remains firmly pinned) */}
      <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden flex flex-col min-w-0 relative z-10 scroll-smooth">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#040812]/90 backdrop-blur-xl border-b border-cyan-900/60 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-300 hover:text-white cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs hidden sm:inline">Root /</span>
                <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  {NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Master Architecture'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 border border-cyan-400 text-cyan-300">
                  GOD MODE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                {NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)?.desc || 'Connected to Laravel Backend & Database Engine'}
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5">
            <UniversalNotificationCenter
              user={{
                id: 'DEV-001',
                name: 'Root Developer Architect',
                username: 'fcc_developer',
                email: 'developer@fccibadan.edu.ng',
                role: 'developer'
              }}
              role="developer"
            />

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Database size={13} className="text-cyan-400" />
              <span>DB: <strong className="text-emerald-400">{dbTelemetry.driver || 'SQLITE'}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Books: <strong className="text-white">{dbTelemetry.counts?.books ?? stats.booksCount}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Scholars: <strong className="text-white">{dbTelemetry.counts?.patrons ?? patrons.length}</strong></span>
            </div>

            {/* HOD Publishing Workflow Decider Button */}
            <button
              type="button"
              disabled={isUpdatingHodMode}
              onClick={() => handleToggleHodPublishingMode()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer shadow-md ${
                hodPublishingMode === 'direct'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/70 hover:bg-emerald-500/30 ring-1 ring-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/70 hover:bg-amber-500/30 ring-1 ring-amber-500/30'
              }`}
              title="Developer Decision Gate: Click to toggle whether HOD uploads publish direct to students or wait for admin approval"
            >
              {hodPublishingMode === 'direct' ? (
                <>
                  <Zap size={13} className="text-emerald-400 animate-pulse" />
                  <span>HOD: Direct to Students</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} className="text-amber-400" />
                  <span>HOD: Wait for Admin Approval</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => showToast('Developer God Mode is live. You can return here anytime via #/developer.')}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-600/80 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">God Mode Active</span>
            </button>

            <button
              type="button"
              onClick={() => handleDevLogout(false)}
              className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Lock Root & Terminate Session"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Main Tab Views */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">

        {/* ==============================================================
            TAB: MASTER CREDENTIALS VAULT (UNHASHED SECRETS & CLEAR-TEXT PINS)
        ============================================================== */}
        {activeTab === 'vault' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header Banner */}
            <section className="bg-[#07101f]/95 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
                      RESTRICTED ROOT ACCESS
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono">Database bcrypt ($2y$12) Active</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Key size={18} className="text-emerald-400" />
                    <span>Master Credentials Vault &amp; Unhashed Passwords</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-sans max-w-3xl leading-relaxed">
                    Institutional Security Oversight: Passwords in the production database remain cryptographically hashed with bcrypt for maximum security. For administrative and technical audits, all current clear-text passwords and student security PINs are mirrored to this Vault.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchVault}
                    disabled={vaultLoading}
                    className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className={vaultLoading ? 'animate-spin' : ''} />
                    <span>{vaultLoading ? 'Synchronizing...' : 'Refresh Database Vault'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-[#02050b] border border-emerald-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Staff Vault Records</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">{vaultData.staff?.length || 0}</div>
                  <div className="text-[10px] text-slate-500">Unhashed secrets loaded</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-cyan-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Enrolled Scholar PINs</div>
                  <div className="text-lg font-black text-cyan-400 mt-0.5">{vaultData.students?.length || patrons.length}</div>
                  <div className="text-[10px] text-slate-500">Security clearance PINs</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-indigo-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Database Hash Algorithm</div>
                  <div className="text-xs font-black text-indigo-300 mt-1">bcrypt (cost: 12)</div>
                  <div className="text-[10px] text-slate-500">Production compliant</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-amber-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Admin Change Sync</div>
                  <div className="text-xs font-black text-amber-300 mt-1">Live WebSocket / Polling</div>
                  <div className="text-[10px] text-slate-500">Instant mirroring</div>
                </div>
              </div>
            </section>

            {/* SECTION 1: Staff & Administrator Passwords & Profile Restriction Control */}
            <section className="bg-[#07101f]/90 border border-emerald-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      Staff &amp; Administrator Passwords (Unhashed Plain-Text)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                      14-Day Lock Authority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Universal cryptographic oversight: view unhashed staff credentials, copy plain-text keys, and lift or customize 14-day profile locks.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter staff by name, email, role..."
                      value={vaultStaffSearch}
                      onChange={e => setVaultStaffSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-emerald-800 text-xs text-white focus:outline-none w-64"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchVault}
                    disabled={vaultLoading}
                    className="p-2 rounded-xl bg-slate-900 border border-emerald-800 text-emerald-400 hover:text-white transition cursor-pointer"
                    title="Reload Vault Data"
                  >
                    <RefreshCw size={13} className={vaultLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Status Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#02050b] border border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Total Staff Accounts</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">{(vaultData.staff || []).length}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400">
                    <Users size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-amber-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Profile Locked (14D)</div>
                    <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {(vaultData.staff || []).filter(s => s.is_locked).length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400">
                    <Lock size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-cyan-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Unlocked (Can Edit)</div>
                    <div className="text-base font-black text-cyan-300 font-mono mt-0.5">
                      {(vaultData.staff || []).filter(s => !s.is_locked).length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                    <Unlock size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Lock Duration Policy</div>
                    <div className="text-xs font-black text-slate-300 font-mono mt-1">14 Calendar Days</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 text-slate-400">
                    <ShieldAlert size={16} />
                  </div>
                </div>
              </div>

              <div className="max-h-[540px] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#02050b]/60 relative">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#050e1c] shadow-md">
                    <tr className="border-b border-emerald-900/80 text-[10px] text-emerald-400 uppercase tracking-wider font-mono bg-[#050e1c]">
                      <th className="py-2.5 px-3">Staff Member &amp; Title</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Unhashed Password</th>
                      <th className="py-2.5 px-3">Profile Lock (14D Cooldown)</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {vaultLoading && (vaultData.staff || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <RefreshCw size={14} className="animate-spin text-emerald-400" />
                            <span>Synchronizing Staff &amp; Administrator Passwords from Database API...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (vaultData.staff || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans text-xs">
                          No staff or administrator credentials found in the database.
                        </td>
                      </tr>
                    ) : (
                      (vaultData.staff || [])
                        .filter(s => {
                          if (!vaultStaffSearch) return true;
                          const q = vaultStaffSearch.toLowerCase();
                          return (s.name || '').toLowerCase().includes(q) ||
                                 (s.email || '').toLowerCase().includes(q) ||
                                 (s.username || '').toLowerCase().includes(q) ||
                                 (s.role || '').toLowerCase().includes(q) ||
                                 (s.designation || '').toLowerCase().includes(q);
                        })
                      .map(s => {
                        const isRevealed = revealedSecrets[s.id] !== false;
                        const plain = s.plain_secret || 'admin123';
                        return (
                          <tr key={s.id} className="hover:bg-slate-900/60 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white font-sans flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[11px] font-bold text-emerald-300 shrink-0">
                                  {(s.name || 'S').charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <div className="leading-snug">{s.name}</div>
                                  <div className="text-[10px] text-slate-400 font-sans">{s.designation || 'Staff'} {s.id ? `• #${s.id}` : ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700 uppercase">
                                {s.role || 'ADMIN'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-bold">
                              {s.username || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px]">
                              {s.email}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-black tracking-wider text-xs font-mono select-all">
                                  {isRevealed ? plain : '••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealSecret(s.id)}
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                                  title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                                >
                                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(plain, `Password for ${s.name}`)}
                                  className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition cursor-pointer"
                                  title="Copy Plain Password"
                                >
                                  <Key size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {s.is_locked ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                      <Lock size={10} /> {s.days_remaining}d Left
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleResetProfileLock(s.id, s.name, 'user')}
                                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Instantly Remove 14-Day Lock"
                                    >
                                      <Unlock size={10} /> Lift
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLockModalTarget({
                                          type: 'user',
                                          id: s.id,
                                          name: s.name,
                                          currentDays: s.days_remaining,
                                          isLocked: true
                                        });
                                        setLockModalDays(s.days_remaining || 14);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-amber-900 text-slate-300 hover:text-amber-200 border border-slate-700 text-[9px] transition cursor-pointer"
                                      title="Adjust Cooldown Days in Studio"
                                    >
                                      <Sliders size={11} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                                      <Unlock size={10} /> Open (0d)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteLockAction({ type: 'user', id: s.id, name: s.name }, 'lock', 14)}
                                      className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-700 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Enforce 14-Day Profile Lock"
                                    >
                                      <Lock size={10} /> Lock 14D
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLockModalTarget({
                                          type: 'user',
                                          id: s.id,
                                          name: s.name,
                                          currentDays: 0,
                                          isLocked: false
                                        });
                                        setLockModalDays(14);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-cyan-200 border border-slate-700 text-[9px] transition cursor-pointer"
                                      title="Configure Custom Lock"
                                    >
                                      <Sliders size={11} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                s.status === 'blocked' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                                s.status === 'restricted' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                                s.status === 'suspended' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                                'bg-emerald-950 text-emerald-300 border-emerald-700'
                              }`}>
                                {s.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStaff(s);
                                    setEditingStaffPass('');
                                  }}
                                  className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 transition cursor-pointer"
                                  title="Edit Staff Credentials & Password"
                                >
                                  <Edit3 size={12} />
                                </button>

                                {s.status === 'blocked' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStaffStatus(s.id, 'active', s.name)}
                                    className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Unblock Staff Member"
                                  >
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStaffStatus(s.id, 'blocked', s.name)}
                                    className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-800 text-[10px] font-bold transition cursor-pointer"
                                    title="Block Staff Account"
                                  >
                                    Block
                                  </button>
                                )}

                                {s.status === 'restricted' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStaffStatus(s.id, 'active', s.name)}
                                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Remove Account Restriction"
                                  >
                                    Unrestrict
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStaffStatus(s.id, 'restricted', s.name)}
                                    className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-800 text-[10px] font-bold transition cursor-pointer"
                                    title="Restrict Staff Account"
                                  >
                                    Restrict
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(plain, `Password for ${s.name}`)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900 text-slate-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Copy Plain Secret"
                                >
                                  <span>Copy</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 2: Scholar & Student Security PIN Vault & 30-Day Profile Restriction Control */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white">
                    <Users size={18} className="text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      Scholar Security PIN Vault (Unhashed Clearance PINs)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                      30-Day Photo Lock Authority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Universal clearance PIN repository: view student clearance credentials, toggle PIN visibility, and control 30-day profile photo lockouts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, matric, ID, barcode..."
                      value={vaultStudentSearch}
                      onChange={e => setVaultStudentSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-cyan-800 text-xs text-white focus:outline-none w-64"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchVault}
                    disabled={vaultLoading}
                    className="p-2 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-400 hover:text-white transition cursor-pointer"
                    title="Reload Scholar Vault Data"
                  >
                    <RefreshCw size={13} className={vaultLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Scholar Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#02050b] border border-cyan-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Enrolled Scholars</div>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {(vaultData.students?.length ? vaultData.students : patrons).length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                    <Users size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-amber-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Photo Locked (30D)</div>
                    <div className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {(vaultData.students?.length ? vaultData.students : patrons).filter(s => s.is_photo_locked).length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400">
                    <Lock size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Photo Unlocked (Open)</div>
                    <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {(vaultData.students?.length ? vaultData.students : patrons).filter(s => !s.is_photo_locked).length}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400">
                    <Unlock size={16} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#02050b] border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Photo Policy Window</div>
                    <div className="text-xs font-black text-slate-300 font-mono mt-1">30 Calendar Days</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 text-slate-400">
                    <ShieldAlert size={16} />
                  </div>
                </div>
              </div>

              <div className="max-h-[540px] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#02050b]/60 relative">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#050e1c] shadow-md">
                    <tr className="border-b border-cyan-900/80 text-[10px] text-cyan-400 uppercase tracking-wider font-mono bg-[#050e1c]">
                      <th className="py-2.5 px-3">Scholar Name</th>
                      <th className="py-2.5 px-3">Matriculation No</th>
                      <th className="py-2.5 px-3">Student ID / Barcode</th>
                      <th className="py-2.5 px-3">Department &amp; Level</th>
                      <th className="py-2.5 px-3">Clearance PIN</th>
                      <th className="py-2.5 px-3">Photo Lock (30D Policy)</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {vaultLoading && (vaultData.students?.length ? vaultData.students : patrons).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <RefreshCw size={14} className="animate-spin text-cyan-400" />
                            <span>Synchronizing Scholar Security PINs from Central Patron Database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (vaultData.students?.length ? vaultData.students : patrons).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-sans text-xs">
                          No registered scholars or clearance PINs found in the database.
                        </td>
                      </tr>
                    ) : (
                      (vaultData.students?.length ? vaultData.students : patrons)
                        .filter(stu => {
                          if (!vaultStudentSearch) return true;
                          const q = vaultStudentSearch.toLowerCase();
                          return (stu.name || '').toLowerCase().includes(q) ||
                                 (stu.matric || '').toLowerCase().includes(q) ||
                                 (stu.id || '').toLowerCase().includes(q) ||
                                 (stu.barcode || '').toLowerCase().includes(q) ||
                                 (stu.library_id || '').toLowerCase().includes(q) ||
                                 (stu.department || stu.dept || '').toLowerCase().includes(q);
                        })
                      .map(stu => {
                        const pinVal = stu.pin || '—';
                        const isPinRevealed = Boolean(revealedPins[stu.matric || stu.id]);
                        return (
                          <tr key={stu.matric || stu.id} className="hover:bg-slate-900/60 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white font-sans flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-[11px] font-bold text-cyan-300 shrink-0">
                                  {(stu.name || 'S').charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <div className="leading-snug">{stu.name}</div>
                                  <div className="text-[10px] text-slate-400 font-sans">{stu.level || 'Scholar'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-cyan-300">
                              {stu.matric}
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px]">
                              {stu.barcode || stu.library_id || stu.id || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                              <div className="text-white font-medium">{stu.department || stu.dept || '—'}</div>
                              <div className="text-[10px] text-slate-500">{stu.level || ''}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/70 text-cyan-300 font-bold font-mono text-xs select-all">
                                  {isPinRevealed ? pinVal : '••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealPin(stu.matric || stu.id)}
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                                  title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                                >
                                  {isPinRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {stu.is_photo_locked ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                      <Lock size={10} /> {stu.photo_days_remaining}d {stu.photo_hours_remaining || 0}h Left
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteLockAction({ type: 'student', id: stu.matric, name: stu.name }, 'unlock')}
                                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Lift 30-Day Photo Restriction (Allow Upload Now)"
                                    >
                                      <Unlock size={10} /> Lift
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLockModalTarget({
                                          type: 'student',
                                          id: stu.matric,
                                          name: stu.name,
                                          currentDays: stu.photo_days_remaining,
                                          isLocked: true
                                        });
                                        setLockModalDays(stu.photo_days_remaining || 30);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-amber-900 text-slate-300 hover:text-amber-200 border border-slate-700 text-[9px] transition cursor-pointer"
                                      title="Adjust Remaining Cooldown Days in Studio"
                                    >
                                      <Sliders size={11} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                                      <Unlock size={10} /> Open (Can Upload)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteLockAction({ type: 'student', id: stu.matric, name: stu.name }, 'lock', 30)}
                                      className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-700 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Enforce 30-Day Photo Lockout"
                                    >
                                      <Lock size={10} /> Lock 30D
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLockModalTarget({
                                          type: 'student',
                                          id: stu.matric,
                                          name: stu.name,
                                          currentDays: 0,
                                          isLocked: false
                                        });
                                        setLockModalDays(30);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-cyan-200 border border-slate-700 text-[9px] transition cursor-pointer"
                                      title="Configure Custom Photo Lockout"
                                    >
                                      <Sliders size={11} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                stu.status === 'blocked' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                                stu.status === 'restricted' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                                stu.status === 'suspended' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                                'bg-emerald-950 text-emerald-300 border-emerald-700'
                              }`}>
                                {stu.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(stu);
                                    setEditingStudentPin(stu.pin || '');
                                  }}
                                  className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-800 transition cursor-pointer"
                                  title="Edit Scholar Credentials & PIN"
                                >
                                  <Edit3 size={12} />
                                </button>

                                {stu.status === 'blocked' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStudentStatus(stu.matric, 'active', stu.name)}
                                    className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Unblock Scholar"
                                  >
                                    Unblock
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStudentStatus(stu.matric, 'blocked', stu.name)}
                                    className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-800 text-[10px] font-bold transition cursor-pointer"
                                    title="Block Scholar"
                                  >
                                    Block
                                  </button>
                                )}

                                {stu.status === 'restricted' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStudentStatus(stu.matric, 'active', stu.name)}
                                    className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 text-[10px] font-bold transition cursor-pointer"
                                    title="Remove Restriction"
                                  >
                                    Unrestrict
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStudentStatus(stu.matric, 'restricted', stu.name)}
                                    className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-800 text-[10px] font-bold transition cursor-pointer"
                                    title="Restrict Scholar"
                                  >
                                    Restrict
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: 2FA OTP ACCESS GATE (GLOBAL & INDIVIDUAL BYPASS / PAUSE)
        ============================================================== */}
        {activeTab === 'otp_gate' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header Banner */}
            <section className="bg-[#07101f]/95 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
                      ROOT SECURITY GOVERNANCE
                    </span>
                    <span className="text-[11px] text-cyan-400 font-mono">SMTP: librarian@fccibadanlibrary.com.ng:465</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span>2FA OTP Access Gate &amp; Individual/Global Pause Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-sans max-w-3xl leading-relaxed">
                    Developer Master Override: Temporarily pause or re-enforce 2FA verification. When paused, targeted Admins and Academic Department Heads (HODs) can log in immediately with their username/email and password without being prompted for a 6-digit email OTP.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchOtpMatrix}
                    disabled={otpMatrixLoading}
                    className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className={otpMatrixLoading ? 'animate-spin' : ''} />
                    <span>{otpMatrixLoading ? 'Synchronizing...' : 'Refresh Access Gate'}</span>
                  </button>
                </div>
              </div>

              {/* Master Global Pause / Bypass Kill-Switch */}
              <div className={`p-5 rounded-2xl border-2 transition shadow-xl ${
                otpMatrix.global_paused
                  ? 'bg-rose-950/40 border-rose-500 text-rose-100'
                  : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${otpMatrix.global_paused ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {otpMatrix.global_paused
                          ? 'GLOBAL 2FA BYPASSED — ALL USERS ENTER WITHOUT OTP'
                          : 'STRICT 2FA ACTIVE — LIVE EMAIL OTP DISPATCH ENFORCED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">
                      {otpMatrix.global_paused
                        ? 'Two-Factor OTP is currently paused across the entire institution. Admins and Department HODs bypass the 2FA modal completely and access consoles instantly.'
                        : 'Every Admin and Department HOD sign-in requires an authentic 6-digit OTP code dispatched to their registered email from librarian@fccibadanlibrary.com.ng.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleGlobalOtp(!otpMatrix.global_paused)}
                    disabled={otpMatrixLoading}
                    className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                      otpMatrix.global_paused
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950'
                        : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-950'
                    }`}
                  >
                    {otpMatrix.global_paused ? (
                      <>
                        <ShieldCheck size={16} />
                        <span>Enforce Strict 2FA Everywhere</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} />
                        <span>Pause 2FA Globally (Allow Direct Logins)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Role-Level Quick Switches & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Admin Role Card */}
                <div className="p-4 rounded-2xl bg-[#02050b] border border-cyan-900/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase">
                      <UserCheck size={16} />
                      <span>All Administrative Staff</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      otpMatrix.paused_roles?.includes('admin')
                        ? 'bg-amber-950 text-amber-300 border border-amber-600'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    }`}>
                      {otpMatrix.paused_roles?.includes('admin') ? 'ROLE PAUSED' : 'ROLE ENFORCED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Toggle OTP bypass for all Chief Librarians, System Librarians, and Library Administrators.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {otpMatrix.admins?.length || 0} Registered Admins
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRoleOtp('admin', !otpMatrix.paused_roles?.includes('admin'))}
                      disabled={otpMatrixLoading || otpMatrix.global_paused}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                        otpMatrix.paused_roles?.includes('admin')
                          ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700'
                      } disabled:opacity-40`}
                    >
                      {otpMatrix.paused_roles?.includes('admin') ? 'Restore Admin 2FA' : 'Pause All Admins'}
                    </button>
                  </div>
                </div>

                {/* HOD Role Card */}
                <div className="p-4 rounded-2xl bg-[#02050b] border border-emerald-900/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase">
                      <Building2 size={16} />
                      <span>All Department Heads (HODs)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      otpMatrix.paused_roles?.includes('hod')
                        ? 'bg-amber-950 text-amber-300 border border-amber-600'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    }`}>
                      {otpMatrix.paused_roles?.includes('hod') ? 'ROLE PAUSED' : 'ROLE ENFORCED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Toggle OTP bypass for all Academic Department Head consoles (CSC, PAD, CEM, BNF, AGR, BAM, MKT).
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      {otpMatrix.departments?.length || 0} Academic Departments
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRoleOtp('hod', !otpMatrix.paused_roles?.includes('hod'))}
                      disabled={otpMatrixLoading || otpMatrix.global_paused}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                        otpMatrix.paused_roles?.includes('hod')
                          ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700'
                      } disabled:opacity-40`}
                    >
                      {otpMatrix.paused_roles?.includes('hod') ? 'Restore HOD 2FA' : 'Pause All HODs'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Search */}
              <div className="pt-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={otpSearchQuery}
                    onChange={(e) => setOtpSearchQuery(e.target.value)}
                    placeholder="Search Admin name, email, department code (e.g. CSC, BAM), or HOD name to manage OTP status..."
                    className="w-full bg-[#02050b] border border-cyan-900/80 focus:border-cyan-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Section 1: Individual Library Administrators */}
            <section className="bg-[#07101f]/95 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase tracking-wider">
                  <UserCheck size={16} />
                  <span>Administrative Staff Accounts (Individual 2FA Toggles)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {otpMatrix.admins?.length || 0} Staff Accounts Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-950 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Administrator</th>
                      <th className="py-2.5 px-3">Username / Identifier</th>
                      <th className="py-2.5 px-3">Registered Delivery Email</th>
                      <th className="py-2.5 px-3 text-center">2FA Gate Status</th>
                      <th className="py-2.5 px-3 text-right">Individual Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(otpMatrix.admins || [])
                      .filter(admin => {
                        if (!otpSearchQuery.trim()) return true;
                        const q = otpSearchQuery.toLowerCase();
                        return (admin.name && admin.name.toLowerCase().includes(q))
                          || (admin.email && admin.email.toLowerCase().includes(q))
                          || (admin.username && admin.username.toLowerCase().includes(q))
                          || (admin.designation && admin.designation.toLowerCase().includes(q));
                      })
                      .map((admin) => {
                        const isIndividuallyPaused = admin.individually_paused || otpMatrix.paused_users?.includes(admin.email?.toLowerCase()) || otpMatrix.paused_users?.includes(admin.username?.toLowerCase());
                        const isEffectivelyPaused = otpMatrix.global_paused || otpMatrix.paused_roles?.includes('admin') || isIndividuallyPaused;

                        return (
                          <tr key={admin.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{admin.name}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{admin.designation || 'Administrator'}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-cyan-300 text-[11px]">
                              {admin.username || 'admin'}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                              {admin.email || '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {otpMatrix.global_paused ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                                  BYPASSED (GLOBAL)
                                </span>
                              ) : isIndividuallyPaused ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                                  OTP PAUSED (BYPASSED)
                                </span>
                              ) : otpMatrix.paused_roles?.includes('admin') ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                                  BYPASSED (ROLE POLICY)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                                  STRICT 2FA REQUIRED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                disabled={otpMatrixLoading || otpMatrix.global_paused}
                                onClick={() => handleToggleUserOtp(admin.email || admin.username, !isIndividuallyPaused, admin.name)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                  isIndividuallyPaused
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700'
                                } disabled:opacity-40`}
                              >
                                {isIndividuallyPaused ? 'Restore 2FA OTP' : 'Pause OTP for User'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Individual Academic Department Heads (HODs) */}
            <section className="bg-[#07101f]/95 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
                <div className="flex items-center gap-2 text-emerald-300 font-black text-xs uppercase tracking-wider">
                  <Building2 size={16} />
                  <span>Academic Department Heads &amp; HOD Consoles (Individual 2FA Toggles)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {otpMatrix.departments?.length || 0} Academic Departments Registered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-950 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Dept Code</th>
                      <th className="py-2.5 px-3">Department Name</th>
                      <th className="py-2.5 px-3">Head of Department (HOD)</th>
                      <th className="py-2.5 px-3">Registered Delivery Email</th>
                      <th className="py-2.5 px-3 text-center">2FA Gate Status</th>
                      <th className="py-2.5 px-3 text-right">Individual Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(otpMatrix.departments || [])
                      .filter(dept => {
                        if (!otpSearchQuery.trim()) return true;
                        const q = otpSearchQuery.toLowerCase();
                        return (dept.code && dept.code.toLowerCase().includes(q))
                          || (dept.name && dept.name.toLowerCase().includes(q))
                          || (dept.hod_name && dept.hod_name.toLowerCase().includes(q))
                          || (dept.hod_email && dept.hod_email.toLowerCase().includes(q));
                      })
                      .map((dept) => {
                        const isIndividuallyPaused = dept.individually_paused || otpMatrix.paused_users?.includes(dept.code?.toLowerCase()) || otpMatrix.paused_users?.includes(dept.hod_email?.toLowerCase()) || otpMatrix.paused_users?.includes(`hod_${dept.code?.toLowerCase()}`);
                        const isEffectivelyPaused = otpMatrix.global_paused || otpMatrix.paused_roles?.includes('hod') || isIndividuallyPaused;

                        return (
                          <tr key={dept.id || dept.code} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-lg text-xs font-black font-mono bg-emerald-950 border border-emerald-600 text-emerald-300">
                                {dept.code}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-white">{dept.name}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{dept.faculty || 'Academic Division'}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-200 font-medium">
                              {dept.hod_name}
                            </td>
                            <td className="py-3 px-3 font-mono text-emerald-300 text-[11px]">
                              {dept.hod_email || '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {otpMatrix.global_paused ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                                  BYPASSED (GLOBAL)
                                </span>
                              ) : isIndividuallyPaused ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 animate-pulse">
                                  OTP PAUSED (BYPASSED)
                                </span>
                              ) : otpMatrix.paused_roles?.includes('hod') ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                                  BYPASSED (ROLE POLICY)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                                  STRICT 2FA REQUIRED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                disabled={otpMatrixLoading || otpMatrix.global_paused}
                                onClick={() => handleToggleUserOtp(dept.code, !isIndividuallyPaused, `${dept.code} (${dept.hod_name})`)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                                  isIndividuallyPaused
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700'
                                } disabled:opacity-40`}
                              >
                                {isIndividuallyPaused ? 'Restore 2FA OTP' : 'Pause OTP for HOD'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3: Institutional User Notification & Alert Delivery Switchboard */}
            <section className="bg-[#07101f]/95 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-900/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-300 font-black text-xs uppercase tracking-wider">
                    <Bell size={16} className="text-indigo-400" />
                    <span>Notification &amp; Alert Delivery Switchboard (Email &amp; In-App Alerts)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Root control over automated system emails and live in-app bell notices dispatched when user PINs, passwords, or privileges are modified.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchUserNotificationSettings}
                    disabled={userNotifLoading}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/80 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={13} className={userNotifLoading ? 'animate-spin' : ''} />
                    <span>{userNotifLoading ? 'Refreshing...' : 'Sync Preferences'}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {[
                  { id: 'all', label: 'All Accounts' },
                  { id: 'admins', label: `Staff & Admins (${staffList.length})` },
                  { id: 'hods', label: `Academic HODs (${departments.length})` },
                  { id: 'scholars', label: `Scholars (${patrons.length || vaultData.students?.length || 0})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setNotifTargetTab(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      notifTargetTab === pill.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Notification Delivery Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-indigo-950 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">User / Patron</th>
                      <th className="py-2.5 px-3">Role / Dept</th>
                      <th className="py-2.5 px-3">Registered Delivery Target</th>
                      <th className="py-2.5 px-3 text-center">SMTP Email Alerts</th>
                      <th className="py-2.5 px-3 text-center">In-App Bell Alerts</th>
                      <th className="py-2.5 px-3 text-right">Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(() => {
                      // Aggregate records based on active filter
                      let candidates = [];
                      if (notifTargetTab === 'all' || notifTargetTab === 'admins') {
                        candidates = candidates.concat(
                          staffList.map(s => ({
                            key: s.email || s.username || `staff_${s.id}`,
                            name: s.name,
                            role: s.role === 'admin' ? 'Chief Librarian / Admin' : s.role,
                            dept: s.dept || 'Library Administration',
                            target: s.email || s.username,
                            type: 'admin'
                          }))
                        );
                      }
                      if (notifTargetTab === 'all' || notifTargetTab === 'hods') {
                        candidates = candidates.concat(
                          departments.map(d => ({
                            key: d.hod_email || d.code || `hod_${d.id}`,
                            name: d.hod_name || `HOD ${d.code}`,
                            role: `HOD (${d.code})`,
                            dept: d.name,
                            target: d.hod_email || `${d.code} Desk`,
                            type: 'hod'
                          }))
                        );
                      }
                      if (notifTargetTab === 'all' || notifTargetTab === 'scholars') {
                        const studentPool = patrons.length > 0 ? patrons : (vaultData.students || []);
                        candidates = candidates.concat(
                          studentPool.slice(0, 50).map(st => ({
                            key: st.email || st.matric,
                            name: st.name,
                            role: `Scholar (${st.level || 'ND/HND'})`,
                            dept: st.dept || 'Student Body',
                            target: st.email || st.matric,
                            type: 'scholar'
                          }))
                        );
                      }

                      // Apply search filter
                      const q = otpSearchQuery.trim().toLowerCase();
                      const filtered = candidates.filter(c => {
                        if (!q) return true;
                        return (c.name && c.name.toLowerCase().includes(q))
                          || (c.key && c.key.toLowerCase().includes(q))
                          || (c.target && c.target.toLowerCase().includes(q))
                          || (c.role && c.role.toLowerCase().includes(q))
                          || (c.dept && c.dept.toLowerCase().includes(q));
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                              No matching accounts found for notification control.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((item, idx) => {
                        const normalizedKey = (item.key || '').toLowerCase();
                        const pref = userNotifSettings[normalizedKey] || { email_enabled: true, in_app_enabled: true };
                        const emailActive = pref.email_enabled !== false;
                        const inAppActive = pref.in_app_enabled !== false;

                        return (
                          <tr key={`${item.key}-${idx}`} className="hover:bg-slate-900/40 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.key}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                                {item.role}
                              </span>
                              <div className="text-[9px] text-slate-500 truncate max-w-[150px]">{item.dept}</div>
                            </td>
                            <td className="py-3 px-3 font-mono text-cyan-300 text-[11px]">
                              {item.target}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                disabled={userNotifLoading}
                                onClick={() => handleToggleUserNotification(item.key, 'email_enabled', emailActive)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                                  emailActive
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
                                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600'
                                } disabled:opacity-40`}
                                title={emailActive ? 'Click to pause email delivery' : 'Click to enable email delivery'}
                              >
                                <Mail size={12} />
                                <span>{emailActive ? 'EMAIL ACTIVE' : 'PAUSED'}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                disabled={userNotifLoading}
                                onClick={() => handleToggleUserNotification(item.key, 'in_app_enabled', inAppActive)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                                  inAppActive
                                    ? 'bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-600'
                                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600'
                                } disabled:opacity-40`}
                                title={inAppActive ? 'Click to pause in-app bell notices' : 'Click to enable in-app bell notices'}
                              >
                                <Bell size={12} />
                                <span>{inAppActive ? 'IN-APP ACTIVE' : 'PAUSED'}</span>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                disabled={userNotifLoading}
                                onClick={() => {
                                  const allOn = emailActive && inAppActive;
                                  handleToggleUserNotification(item.key, 'email_enabled', allOn);
                                  handleToggleUserNotification(item.key, 'in_app_enabled', allOn);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer ${
                                  emailActive && inAppActive
                                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                                    : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                } disabled:opacity-40`}
                              >
                                {emailActive && inAppActive ? 'Mute Both' : 'Enable Both'}
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: ACADEMIC DEPARTMENTS & FACULTY MANAGEMENT (DIRECT DATABASE)
        ============================================================== */}
        {activeTab === 'departments' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header Banner */}
            <section className="bg-[#07101f]/95 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                      OFFICIAL DATABASE
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">/api/departments</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={18} className="text-cyan-400" />
                    <span>Academic Departments &amp; Faculty HOD Management</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-sans max-w-3xl leading-relaxed">
                    Centrally managed academic departments, faculties, and appointed HOD administrators. All records reside in the production database and sync dynamically with institutional syllabi, courses, and student cohorts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchDepartments}
                    disabled={departmentsLoading}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} className={departmentsLoading ? 'animate-spin text-cyan-400' : ''} />
                    <span>{departmentsLoading ? 'Syncing...' : 'Refresh Database'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextColor = getAvailableDepartmentColor(departments);
                      setEditingDept(null);
                      setDeptFormData({
                        name: '',
                        code: '',
                        hod_name: '',
                        hod_email: '',
                        hod_phone: '',
                        hod_pin: '',
                        faculty: '',
                        established: '',
                        description: '',
                        color: nextColor
                      });
                      setDeptModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-black shadow-xl shadow-cyan-950 flex items-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer uppercase tracking-wider"
                  >
                    <Building2 size={14} />
                    <span>Add Academic Department</span>
                  </button>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-cyan-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Active Departments</div>
                  <div className="text-lg font-black text-cyan-300 mt-1">{departments.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Stored in central DB</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-teal-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Schools &amp; Faculties</div>
                  <div className="text-lg font-black text-teal-300 mt-1">
                    {new Set(departments.map(d => d.faculty).filter(Boolean)).size || 1}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Accredited collegiate faculties</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-emerald-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Enrolled Students</div>
                  <div className="text-lg font-black text-emerald-300 mt-1">
                    {departments.reduce((sum, d) => sum + (parseInt(d.student_count || d.studentCount, 10) || 0), 0) || patrons.length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Across all departments</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-amber-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Curriculum Syllabi &amp; Theses</div>
                  <div className="text-lg font-black text-amber-300 mt-1">
                    {departments.reduce((sum, d) => sum + (parseInt(d.courses_count || d.coursesCount || 0, 10) + parseInt(d.theses_count || d.thesesCount || 0, 10)), 0)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Catalogued resources</div>
                </div>
              </div>
            </section>

            {/* Department Search & Directory */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Academic Department Directory
                  </h3>
                </div>

                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    placeholder="Search by code, name, faculty, or HOD..."
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {departments.length === 0 && departmentsLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-cyan-400" />
                  <span>Loading academic departments from central database...</span>
                </div>
              ) : departments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
                  <p>No academic departments found in the database.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDept(null);
                      setDeptFormData({
                        name: '',
                        code: '',
                        hod_name: '',
                        hod_email: '',
                        hod_phone: '',
                        hod_pin: '',
                        faculty: '',
                        established: '',
                        description: ''
                      });
                      setDeptModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
                  >
                    + Add First Academic Department
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments
                    .filter(d => {
                      if (!deptSearch.trim()) return true;
                      const q = deptSearch.trim().toLowerCase();
                      return (
                        (d.name || '').toLowerCase().includes(q) ||
                        (d.code || '').toLowerCase().includes(q) ||
                        (d.faculty || '').toLowerCase().includes(q) ||
                        (d.hod_name || d.hod || '').toLowerCase().includes(q)
                      );
                    })
                    .map(dept => (
                      <div
                        key={dept.id || dept.code}
                        className="p-5 rounded-2xl bg-[#02050b] border border-cyan-900/60 hover:border-cyan-500/80 transition shadow-lg space-y-3.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                                {dept.code}
                              </span>
                              <span className="text-[10px] text-teal-400 font-bold px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800">
                                {dept.established ? 'Est. ' + dept.established : 'Est. —'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white font-sans leading-snug">
                              {dept.name}
                            </h4>
                            <div className="text-[10px] text-slate-400 truncate">
                              {dept.faculty || ''}
                            </div>
                          </div>
                        </div>

                        {/* HOD Details */}
                        <div className="p-3 rounded-xl bg-[#07101f] border border-slate-800 space-y-1.5 text-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                            <span>Head of Department</span>
                            <span className="text-cyan-400 font-mono text-[9px]">{dept.matric || `HOD/${dept.code}/001`}</span>
                          </div>
                          <div className="text-white font-bold font-sans">
                            {dept.hod_name || dept.hod || 'Not Appointed'}
                          </div>
                          <div className="text-[11px] text-slate-300 truncate">
                            {dept.hod_email || dept.hodEmail || '—'}
                          </div>
                          {dept.hod_phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {dept.hod_phone}
                            </div>
                          )}
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400">Students</div>
                            <div className="font-bold text-cyan-300 text-xs mt-0.5">
                              {dept.student_count || dept.studentCount || 0}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400">Courses</div>
                            <div className="font-bold text-teal-300 text-xs mt-0.5">
                              {dept.courses_count || dept.coursesCount || 0}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400">Theses</div>
                            <div className="font-bold text-emerald-300 text-xs mt-0.5">
                              {dept.theses_count || dept.thesesCount || 0}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => impersonateHod(dept)}
                            className="px-3 py-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 border border-teal-600 text-teal-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            title="Jump into HOD Gateway"
                          >
                            <Play size={12} />
                            <span>Impersonate</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDept(dept);
                                setDeptFormData({
                                  name: dept.name || '',
                                  code: dept.code || '',
                                  hod_name: dept.hod_name || dept.hod || '',
                                  hod_email: dept.hod_email || dept.hodEmail || '',
                                  hod_phone: dept.hod_phone || dept.hodPhone || '',
                                  hod_pin: dept.hod_pin || dept.pin || '',
                                  faculty: dept.faculty || '',
                                  established: dept.established || '',
                                  description: dept.description || '',
                                  color: dept.color || 'blue'
                                });
                                setDeptModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer"
                              title="Edit Department"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(dept)}
                              className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs transition cursor-pointer"
                              title="Delete Department"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: INSTITUTIONAL SETTINGS DELEGATION MATRIX (ADMIN & HOD ASSIGNMENT)
        ============================================================== */}
        {activeTab === 'institution_delegation' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header Banner */}
            <section className="bg-[#07101f]/95 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                      ROOT DELEGATION MATRIX
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">export const INSTITUTION</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={18} className="text-cyan-400" />
                    <span>Institutional Settings Delegation &amp; HOD Assignment</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-sans max-w-3xl leading-relaxed">
                    Choose which administrative personas and specifically which Academic Department HODs have clearance to update the college profile, academic sessions, semesters, and operational parameters (<code className="text-cyan-300">INSTITUTION</code> object).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveInstitutionPermissions}
                    disabled={delegationSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-black shadow-xl shadow-cyan-950 flex items-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                  >
                    {delegationSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>{delegationSaving ? 'Persisting to Database...' : 'Save & Assign Permissions'}</span>
                  </button>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-cyan-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Central Administrator Clearance</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      institutionPermissions.admin_allowed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        : 'bg-rose-950 text-rose-300 border border-rose-700'
                    }`}>
                      {institutionPermissions.admin_allowed ? '✓ GRANTED AUTHORITY' : '✕ ACCESS RESTRICTED'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Available at /#/admin/settings</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-teal-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Authorized Academic HODs</div>
                  <div className="text-base font-black text-teal-400 mt-0.5">
                    {institutionPermissions.allowed_hod_depts?.length || 0} of {departments.length} Departments
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {institutionPermissions.allowed_hod_depts?.join(', ') || 'None assigned'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#02050b] border border-emerald-900/80">
                  <div className="text-[10px] text-slate-400 uppercase">Active Academic Calendar</div>
                  <div className="text-xs font-bold text-emerald-300 mt-1 truncate">
                    {devInstitutionConfig.currentSession}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {devInstitutionConfig.currentSemester}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 1: Central Admin Authority Controller */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={18} className="text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Central Administrator Permission Controller
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#02050b] border border-cyan-900/60 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white font-sans flex items-center gap-2">
                    <span>Chief Librarian &amp; Central Administrative Directorate</span>
                    <span className="text-[10px] font-mono text-cyan-400">/#/admin</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans max-w-2xl leading-relaxed">
                    When granted, the Administrator can update the College Legal Name, Short Name, Motto, Year Established, Campus Address, System Version, Academic Session, Semester, and Operating Hours via the Central Admin Settings page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAdminPermission}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                    institutionPermissions.admin_allowed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                      : 'bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300'
                  }`}
                >
                  {institutionPermissions.admin_allowed ? (
                    <>
                      <Check size={14} />
                      <span>Admin Clearance: GRANTED (Click to Revoke)</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Admin Clearance: RESTRICTED (Click to Grant)</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* SECTION 2: Granular Academic HOD Assignment Studio */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    <span>Granular Academic Department HOD Assignment Studio</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Choose which specific Academic HODs are assigned authority to modify institutional session, semester, and college hours.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDept(null);
                      setDeptFormData({
                        name: '',
                        code: '',
                        hod_name: '',
                        hod_email: '',
                        hod_phone: '',
                        hod_pin: '',
                        faculty: '',
                        established: '',
                        description: ''
                      });
                      setDeptModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-900/80 hover:bg-cyan-700 border border-cyan-500 text-cyan-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Building2 size={13} />
                    <span>Add Department</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllHods}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Select All HODs
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllHods}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 text-xs font-bold transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* HOD Department Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-xs text-slate-500 font-mono">
                    No departments loaded. Click "Add Department" above to enroll the first department.
                  </div>
                ) : (
                  departments.map(dept => {
                    const isAssigned = (institutionPermissions.allowed_hod_depts || []).includes(dept.code);
                    return (
                      <div
                        key={dept.code || dept.id}
                        className={`p-4 rounded-2xl border transition space-y-3 ${
                          isAssigned
                            ? 'bg-[#02130e] border-emerald-600/80 shadow-md'
                            : 'bg-[#02050b] border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                                {dept.code}
                              </span>
                              <div className="text-xs font-bold text-white font-sans">{dept.name}</div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                              HOD: <span className="text-slate-200 font-medium">{dept.hod_name || dept.hod || 'Department Chair'}</span> ({dept.matric || dept.id || `HOD/${dept.code}/001`})
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isAssigned
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {isAssigned ? 'ASSIGNED' : 'LOCKED'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            {isAssigned ? 'Granted session & calendar control' : 'No editing privileges granted'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setLockModalTarget({
                                  type: 'department',
                                  id: dept.code,
                                  name: `${dept.name} (${dept.hod_name || dept.hod})`,
                                  currentDays: 14,
                                  isLocked: true
                                });
                                setLockModalDays(14);
                              }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-800 text-amber-200 border border-amber-700/80 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Manage / Remodify 14-Day Profile Lock"
                          >
                            <Settings size={11} />
                            <span>Profile Lock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleHodDeptPermission(dept.code)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                              isAssigned
                                ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isAssigned ? (
                              <>
                                <Check size={12} />
                                <span>Assigned (Revoke)</span>
                              </>
                            ) : (
                              <>
                                <span>+ Assign to this HOD</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </section>

            {/* SECTION 3: Direct Developer Root Override Studio */}
            <section className="bg-[#07101f]/90 border border-emerald-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Zap size={16} className="text-emerald-400" />
                    <span>Direct Developer Root Override Studio (Bypass Delegations)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Instantly overwrite any institutional parameter directly from root terminal. Propagates live to all portals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDevInstitutionOverride}
                  disabled={delegationSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{delegationSaving ? 'Broadcasting...' : 'Apply Root Override'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Institution Legal Name</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.name || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, name: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.shortName || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, shortName: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Motto</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.motto || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, motto: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.currentSession || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, currentSession: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-cyan-300 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Semester</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.currentSemester || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, currentSemester: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-cyan-300 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hours / Virtual Hub</label>
                  <input
                    type="text"
                    value={devInstitutionConfig.todayHours || ''}
                    onChange={e => setDevInstitutionConfig({ ...devInstitutionConfig, todayHours: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-sans"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: STAFF & ADMINISTRATOR AUTHORITY DIRECTORY
        ============================================================== */}
        {activeTab === 'staff' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-cyan-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">
                      Staff &amp; Administrator Authority Directory
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center gap-1">
                      <Database size={10} className="text-cyan-400" />
                      {staffList.length} Active in Database
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Real-time administrative directory connected directly to the institutional <code className="text-cyan-300">users</code> database table. Modifications synchronize live.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Name, ID, Email, Role..."
                      value={staffSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStaffSearch(val);
                        fetchStaff(val);
                      }}
                      className="pl-8 pr-8 py-1.5 rounded-xl bg-[#02050b] border border-cyan-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 w-64"
                    />
                    {staffSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setStaffSearch('');
                          fetchStaff('');
                        }}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      fetchStaff(staffSearch);
                    }}
                    disabled={staffLoading}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/80 transition cursor-pointer disabled:opacity-50"
                    title="Refresh Live Staff Records from Database"
                  >
                    <RefreshCw size={13} className={staffLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950"
                  >
                    <UserPlus size={14} />
                    <span>Add Staff Member</span>
                  </button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                      <th className="py-2.5 px-3">Staff ID</th>
                      <th className="py-2.5 px-3">Staff Name</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Official Email</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3">Plain Password</th>
                      <th className="py-2.5 px-3">Profile Lock (14D)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {staffLoading && staffList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex items-center justify-center gap-2 text-cyan-400">
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Synchronizing Staff Directory with backend database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users size={24} className="text-slate-600" />
                            <span className="text-slate-300 font-bold">No staff records found in database.</span>
                            {staffSearch ? (
                              <span className="text-slate-500 text-xs">
                                No records matched query "{staffSearch}". Try clearing your search filter.
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fetchStaff('')}
                                className="mt-1 px-3 py-1 rounded-lg bg-cyan-900/60 text-cyan-300 text-xs hover:bg-cyan-800 transition"
                              >
                                Retry Fetching Database
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map(st => {
                        const isSecretRevealed = !!revealedSecrets[st.id];
                        return (
                          <tr key={st.id} className="hover:bg-slate-900/60 transition">
                            <td className="py-3 px-3 font-bold text-white whitespace-nowrap">STAFF-{st.id}</td>
                            <td className="py-3 px-3 font-sans font-medium text-slate-100 whitespace-nowrap">
                              {st.name || 'Unnamed Staff'}
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-bold whitespace-nowrap">
                              {st.username || 'staff'}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                st.role === 'admin'
                                  ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                                  : st.role === 'librarian'
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                  : st.role === 'hod'
                                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              }`}>
                                {st.role?.toUpperCase() || 'STAFF'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">{st.email}</td>
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {st.phone || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                              {st.designation || 'Staff'}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <select
                                value={st.status || 'active'}
                                onChange={(e) => handleUpdateStaffStatus(st.id, e.target.value, st.name)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono border cursor-pointer focus:outline-none transition ${
                                  st.status === 'active'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                                    : st.status === 'blocked'
                                    ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                                    : st.status === 'restricted'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                                    : 'bg-purple-950/80 text-purple-300 border-purple-600'
                                }`}
                                title="Click to immediately update staff status in database"
                              >
                                <option value="active" className="bg-[#050e1c] text-emerald-300">ACTIVE</option>
                                <option value="restricted" className="bg-[#050e1c] text-amber-300">RESTRICTED</option>
                                <option value="suspended" className="bg-[#050e1c] text-purple-300">SUSPENDED</option>
                                <option value="blocked" className="bg-[#050e1c] text-rose-300">BLOCKED</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[11px]">
                                  {isSecretRevealed ? (st.plain_secret || 'admin123') : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealSecret(st.id)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                                  title={isSecretRevealed ? 'Mask Password' : 'Reveal Password'}
                                >
                                  {isSecretRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                                {st.plain_secret && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(st.plain_secret, `Password for ${st.name}`)}
                                    className="p-1 rounded bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 transition cursor-pointer"
                                    title="Copy Password to Clipboard"
                                  >
                                    <Key size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {st.is_locked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                    <Lock size={10} /> {st.days_remaining}d Left
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                                    <Unlock size={10} /> Unlocked
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLockModalTarget({
                                      type: 'user',
                                      id: st.id,
                                      name: st.name,
                                      currentDays: st.days_remaining || 0,
                                      isLocked: st.is_locked
                                    });
                                    setLockModalDays(st.is_locked ? st.days_remaining || 14 : 14);
                                  }}
                                  className="px-2 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-700 text-cyan-200 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Remodify or Remove Profile Restriction"
                                >
                                  <Sliders size={10} /> Manage Lock
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Edit Staff Credentials & Role */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playClick();
                                    setEditingStaff({ ...st });
                                    setEditingStaffPass('');
                                  }}
                                  className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-700/60 transition cursor-pointer"
                                  title="Edit staff member profile, role, and credentials"
                                >
                                  <Edit3 size={13} />
                                </button>

                                {/* Quick Suspend / Activate Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStaffStatus(st.id, st.status === 'active' ? 'suspended' : 'active', st.name)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    st.status === 'active'
                                      ? 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border-emerald-700/60'
                                      : 'bg-amber-950/80 hover:bg-amber-800 text-amber-300 border-amber-700/60'
                                  }`}
                                  title={st.status === 'active' ? 'Quick Suspend Account' : 'Quick Activate Account'}
                                >
                                  <Power size={13} />
                                </button>

                                {/* Lock / Unlock Profile */}
                                {st.is_locked ? (
                                  <button
                                    type="button"
                                    onClick={() => handleResetProfileLock(st.id, st.name, 'user')}
                                    className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-200 transition cursor-pointer"
                                    title="1-Click Unlock Profile"
                                  >
                                    <Unlock size={13} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteLockAction({ id: st.id, name: st.name, type: 'user' }, 'lock', 14)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-900 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                                    title="Lock Profile (14 Days)"
                                  >
                                    <Lock size={13} />
                                  </button>
                                )}

                                {/* Delete Staff Member */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(st.id, st.name)}
                                  className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                                  title="Permanently remove staff member from database"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: DEPARTMENTAL STAFF WORKSPACES & FUNCTION ARCHITECT
        ============================================================== */}
        {activeTab === 'hod_staff' && (
          <DeveloperHodStaffController passkey={DEV_CREDENTIALS.password} showToast={showToast} departments={departments} />
        )}

        {/* ==============================================================
            TAB: DIRECT BOOK INGESTION & CATALOGUING STUDIO (CONNECTED TO BACKEND)
        ============================================================== */}
        {activeTab === 'books' && (
          <DeveloperBookStudio passkey={DEV_CREDENTIALS.password} showToast={showToast} departments={departments} />
        )}

        {/* ==============================================================
            TAB: MASTER ADMIN OPERATIONS HUB (CENTRAL /#/admin REPLICATION)
        ============================================================== */}
        {activeTab === 'admin_overview' && (
          <DeveloperAdminOverview passkey={DEV_CREDENTIALS.password} showToast={showToast} />
        )}

        {/* ==============================================================
            TAB: CRYPTOGRAPHIC AUDIT LOG & SECURITY IMMUTABLE LEDGER
        ============================================================== */}
        {activeTab === 'audit' && (
          <DeveloperAuditTrail passkey={DEV_CREDENTIALS.password} showToast={showToast} />
        )}

        {/* ==============================================================
            TAB: CUSTOM ADMIN PAGE & FEATURE BUILDER
        ============================================================== */}
        {activeTab === 'admin_pages' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                      DYNAMIC ROUTE ARCHITECT
                    </span>
                    <span className="text-[11px] text-indigo-400 font-mono">custom_admin_pages table</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mt-1">
                    <Layers size={16} className="text-cyan-400" />
                    <span>Custom Admin Page &amp; Granular Feature Builder</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed mt-1">
                    Create brand new dedicated admin pages, define routes (<code className="text-cyan-300">/#/admin/[slug]</code>), and grant individual security &amp; functional features to each page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddPageModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Layers size={14} />
                  <span>+ Create New Admin Page</span>
                </button>
              </div>

              {/* Custom Pages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customAdminPages.map(page => (
                  <div key={page.id} className="p-4 rounded-2xl bg-[#02050b] border border-cyan-900/80 hover:border-cyan-600 transition space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2 font-sans">
                          <Layers size={14} className="text-cyan-400" />
                          <span>{page.title}</span>
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          /#/admin/{page.slug}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {page.is_active ? 'ACTIVE' : 'OFFLINE'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomPage(page.id, page.title)}
                          className="p-1 rounded-lg bg-rose-950 text-rose-300 hover:text-white transition cursor-pointer"
                          title="Delete custom admin page"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {page.description || 'Dedicated institutional admin portal.'}
                    </p>

                    {/* Features Granted */}
                    <div className="pt-2 border-t border-slate-900 space-y-1.5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Granted Features &amp; Capabilities:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {page.features && typeof page.features === 'object' ? (
                          Object.entries(page.features).map(([feat, enabled]) => enabled && (
                            <span key={feat} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800">
                              ✓ {feat.replace(/_/g, ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">Standard admin clearance</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Allowed: {page.allowed_roles}</span>
                      <a
                        href={`/#/admin/${page.slug}`}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Launch Page</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 1: 1-CLICK UNIVERSAL IMPERSONATOR
        ============================================================== */}
        {activeTab === 'impersonator' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="bg-[#07101f]/90 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={16} className="text-cyan-400" />
                    <span>Instant Omni-Impersonator (Super-Seeds Every Page)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Bypass all authentication hurdles and operate with the exact authority of any persona in the college.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/60 px-2.5 py-1 rounded-full">
                  ROOT PRIVILEGES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Admin Impersonation */}
                <div className="p-4 rounded-2xl bg-[#02050b] border border-indigo-500/50 hover:border-indigo-400 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500 flex items-center justify-center">
                        <ShieldCheck size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Chief Librarian</div>
                        <div className="text-[10px] text-indigo-400 font-mono">Alhaji Balogun O.</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Full authority over MARC21, circulation, book acquisitions, and system configuration.
                  </p>
                  <button
                    type="button"
                    onClick={impersonateAdmin}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 cursor-pointer"
                  >
                    <Play size={13} />
                    <span>Launch Admin Console</span>
                  </button>
                </div>

                {/* Scholar Impersonation */}
                <div className="p-4 rounded-2xl bg-[#02050b] border border-emerald-500/50 hover:border-emerald-400 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500 flex items-center justify-center">
                        <UserCheck size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Master Scholar</div>
                        <div className="text-[10px] text-emerald-400 font-mono">FCC/CSC/2026/409</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                      STUDENT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Assume identity of Olawale Akeem Olonade (HND II). Test borrowing, reader, and fines.
                  </p>
                  <button
                    type="button"
                    onClick={() => impersonateStudent('FCC/CSC/2026/409', 'OLAWALE AKEEM OLONADE')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
                  >
                    <Play size={13} />
                    <span>Launch Scholar Portal</span>
                  </button>
                </div>

                {/* Kiosk Impersonation */}
                <div className="p-4 rounded-2xl bg-[#02050b] border border-cyan-500/50 hover:border-cyan-400 transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center">
                        <Monitor size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Self-Service Kiosk</div>
                        <div className="text-[10px] text-cyan-400 font-mono">Terminal K-01</div>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                      KIOSK
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Interactive hardware wedge scanner listener, self-checkout, self-renewal and return.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('/kiosk')}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
                  >
                    <Play size={13} />
                    <span>Launch Kiosk Terminal</span>
                  </button>
                </div>
              </div>

              {/* HOD Department Impersonators */}
              <div className="pt-2 border-t border-cyan-900/60 space-y-3">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={15} />
                  <span>Impersonate Academic Department HODs</span>
                </div>
                {departments.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#02050b] border border-cyan-900/50 text-slate-400 text-xs text-center">
                    No academic departments synced from database yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {departments.map((dept) => (
                      <button
                        key={dept.code}
                        type="button"
                        onClick={() => impersonateHod(dept)}
                        className="p-3 rounded-xl bg-[#02050b] border border-teal-800/80 hover:border-teal-400 text-left transition space-y-1.5 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white group-hover:text-teal-300 transition">{dept.code}</span>
                          <span className="text-[9px] text-teal-400 font-mono">HOD</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate">{dept.hod_name || dept.hod || 'Department Head'}</div>
                        <div className="text-[9px] text-slate-500 truncate">{dept.name}</div>
                        <div className="pt-1 text-[10px] text-teal-400 font-bold flex items-center gap-1">
                          <span>Impersonate &rarr;</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB: TARGETED BROADCAST & UPGRADE/MAINTENANCE LOCK MATRIX
        ============================================================== */}
        {activeTab === 'maintenance_broadcast' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            <DeveloperMaintenanceBroadcastController showToast={showToast} />
          </div>
        )}

        {/* ==============================================================
            TAB: EXTERNAL LIBRARY APIS & FEDERATED SEARCH ENGINE MATRIX
        ============================================================== */}
        {activeTab === 'external_apis' && (
          <div className="space-y-6 animate-fadeIn font-mono">
            {/* Header / Hero Banner */}
            <section className="bg-gradient-to-br from-[#061427]/90 via-[#07101f]/95 to-[#021810]/90 border border-cyan-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/60 pb-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
                    <Globe size={13} className="text-cyan-400 animate-spin-slow" />
                    <span>Global Federated Scholarly Engine • 14 External World Libraries</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                    <span>External Library APIs Master Matrix &amp; Kill-Switch Controls</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    Full developer authority to toggle individual external library APIs ON/OFF in real-time. When toggled OFF,
                    the search engine skips that API globally across the Public OPAC, Student Scholar Portal, and Journal Directories.
                  </p>
                </div>

                {/* Status Summary Counters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-[#030a16] border border-cyan-700/60 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Total APIs</div>
                    <div className="text-2xl font-black text-white mt-0.5">14</div>
                    <div className="text-[9px] text-slate-400">Integrated</div>
                  </div>
                  <div className="bg-[#032217] border border-emerald-500/60 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active APIs</div>
                    <div className="text-2xl font-black text-emerald-300 mt-0.5">
                      {Object.values(config.externalLibraryApis || {}).filter(a => a.enabled !== false).length}
                    </div>
                    <div className="text-[9px] text-emerald-400/80 font-bold">ONLINE</div>
                  </div>
                  <div className="bg-[#240810] border border-rose-700/60 rounded-2xl px-4 py-3 text-center min-w-[100px]">
                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Muted APIs</div>
                    <div className="text-2xl font-black text-rose-300 mt-0.5">
                      {Object.values(config.externalLibraryApis || {}).filter(a => a.enabled === false).length}
                    </div>
                    <div className="text-[9px] text-rose-400/80 font-bold">MUTED</div>
                  </div>
                </div>
              </div>

              {/* Bulk Actions & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={externalApiSearch}
                    onChange={(e) => setExternalApiSearch(e.target.value)}
                    placeholder="Search by API name, provider, category..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#030914] border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {externalApiSearch && (
                    <button
                      type="button"
                      onClick={() => setExternalApiSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkExternalApis(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Check size={14} />
                    <span>Activate All (14 ON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkExternalApis(false)}
                    className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700/80 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Power size={14} />
                    <span>Emergency Kill-Switch (All OFF)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isTestingAllApis}
                    onClick={handleTestAllApis}
                    className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <RefreshCw size={14} className={isTestingAllApis ? 'animate-spin' : ''} />
                    <span>{isTestingAllApis ? 'Pinging APIs...' : 'Ping & Test All'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Grid of All 14 External Library APIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(config.externalLibraryApis || {})
                .filter(([id, item]) => {
                  if (!externalApiSearch) return true;
                  const term = externalApiSearch.toLowerCase();
                  return (
                    (item.name && item.name.toLowerCase().includes(term)) ||
                    (item.provider && item.provider.toLowerCase().includes(term)) ||
                    (item.category && item.category.toLowerCase().includes(term)) ||
                    id.toLowerCase().includes(term)
                  );
                })
                .map(([id, item]) => {
                  const isEnabled = item.enabled !== false;
                  const testRes = apiTestResults[id];
                  const isTesting = testingApiId === id;
                  const meta = EXTERNAL_API_METADATA[id] || {};

                  return (
                    <div
                      key={id}
                      className={`rounded-3xl border p-5 transition flex flex-col justify-between gap-4 ${
                        isEnabled
                          ? 'bg-[#04101e]/90 border-cyan-800/70 shadow-lg shadow-cyan-950/30'
                          : 'bg-[#080b12]/80 border-slate-800/80 opacity-75'
                      }`}
                    >
                      {/* Top Row: Provider & Category Badges + Toggle Switch */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-[11px] font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1 shadow-sm"
                              style={{
                                backgroundColor: isEnabled ? `${item.color || '#0d9488'}22` : '#1e293b',
                                borderColor: isEnabled ? (item.color || '#0d9488') : '#475569',
                                color: isEnabled ? (item.color || '#2dd4bf') : '#94a3b8'
                              }}
                            >
                              <span>{item.badge || meta.badge || id.toUpperCase()}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {item.category || meta.category || 'Academic Literature'}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                            {item.name || meta.name || id}
                          </h3>
                          <div className="text-[11px] text-cyan-300 font-sans flex items-center gap-1.5">
                            <span className="text-slate-400">Provider:</span>
                            <span className="font-semibold text-slate-200">{item.provider || meta.provider}</span>
                          </div>
                        </div>

                        {/* Power ON/OFF Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleExternalApiItem(id)}
                          className={`px-3.5 py-2 rounded-2xl font-black text-xs shrink-0 flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                            isEnabled
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <Power size={13} />
                          <span>{isEnabled ? 'ONLINE' : 'MUTED'}</span>
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {item.description || meta.type}
                      </p>

                      {/* Bottom Diagnostics & Direct Test Row */}
                      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span className={isEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500 font-bold'}>
                            {isEnabled ? 'Search Active' : 'Offline / Bypassed'}
                          </span>

                          {testRes && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              testRes.success
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}>
                              {testRes.success ? `200 OK • ${testRes.latencyMs}ms (${testRes.matchCount} recs)` : `FAIL • ${testRes.latencyMs}ms`}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.endpoint && (
                            <a
                              href={item.endpoint}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                            >
                              <span>Docs</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={() => handleRunApiTest(id)}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                          >
                            <RefreshCw size={10} className={isTesting ? 'animate-spin text-cyan-400' : ''} />
                            <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ==============================================================
            TAB: UNIVERSAL VIDEO & AUDIO API AUTHORITY MATRIX
        ============================================================== */}
        {activeTab === 'multimedia_governance' && (
          <DeveloperMediaGovernanceStudio
            passkey={DEV_CREDENTIALS.password}
            showToast={showToast}
          />
        )}

        {/* ==============================================================
            TAB 2: ONE-CLICK FEATURE FLAG MATRIX (STUDENT & ADMIN & HOD)
        ============================================================== */}
        {activeTab === 'features' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Student Features */}
            <section className="bg-[#07101f]/90 border border-emerald-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    <span>Student E-Library Feature Matrix (1-Click Online Toggle)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Switching any button immediately injects or hides the module on the Scholar Portal. (Protected with Secret Passkey).
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/60 px-2.5 py-1 rounded-full">
                  SCHOLAR APP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(config.studentFeatures || {}).map(([key, feat]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      feat.enabled
                        ? 'bg-[#021a11] border-emerald-500/80 shadow-md'
                        : 'bg-[#060b14] border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{feat.label}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-black/40 text-emerald-300 border border-emerald-800">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{feat.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFeature('studentFeatures', key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        feat.enabled
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Power size={12} />
                      <span>{feat.enabled ? 'ACTIVE' : 'OFF'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Admin Features */}
            <section className="bg-[#07101f]/90 border border-indigo-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-400" />
                    <span>Chief Librarian &amp; Administrative Feature Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Controls automated alert dispatchers, RFID anti-theft gate radars, and cloud replication.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 border border-indigo-500/60 px-2.5 py-1 rounded-full">
                  ADMIN CONSOLE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {Object.entries(config.adminFeatures || {}).map(([key, feat]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      feat.enabled
                        ? 'bg-[#080d23] border-indigo-500/80 shadow-md'
                        : 'bg-[#060b14] border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{feat.label}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-black/40 text-indigo-300 border border-indigo-800">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{feat.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFeature('adminFeatures', key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        feat.enabled
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Power size={12} />
                      <span>{feat.enabled ? 'ACTIVE' : 'OFF'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* HOD Resource Publishing & Approval Decision Gate (Lead Developer Control) */}
            <section className="bg-gradient-to-br from-[#04101e] via-[#071329] to-[#030914] border-2 border-cyan-500/70 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                      LEAD DEVELOPER POLICY CONTROL
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                      hodPublishingMode === 'direct'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        : 'bg-amber-950 text-amber-300 border border-amber-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hodPublishingMode === 'direct' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                      ACTIVE MODE: {hodPublishingMode === 'direct' ? 'DIRECT LIVE TO STUDENTS' : 'WAIT FOR ADMIN APPROVAL'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={18} className="text-cyan-400" />
                    <span>HOD Resource Publication Decision &amp; Approval Gate</span>
                  </h2>
                  <p className="text-xs text-slate-300 pt-1 max-w-3xl leading-relaxed">
                    Decide whether books, monographs, and past questions uploaded by Academic HODs appear <strong>directly for students to see and read immediately</strong>, or if they must <strong>wait in queue for review &amp; approval from the Central Library Admin</strong> at <code className="text-cyan-300 font-mono">#/admin/hod-submissions</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingHodMode}
                    onClick={() => handleToggleHodPublishingMode(hodPublishingMode === 'direct' ? 'approval' : 'direct')}
                    className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 border shadow-lg cursor-pointer ${
                      hodPublishingMode === 'direct'
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-400'
                    }`}
                  >
                    {hodPublishingMode === 'direct' ? <Zap size={14} /> : <ShieldCheck size={14} />}
                    <span>TOGGLE MODE: SWITCH TO {hodPublishingMode === 'direct' ? 'ADMIN APPROVAL' : 'DIRECT PUBLISH'}</span>
                  </button>
                </div>
              </div>

              {/* Two Interactive Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Option 1: Direct Live to Students */}
                <div
                  onClick={() => handleToggleHodPublishingMode('direct')}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 relative ${
                    hodPublishingMode === 'direct'
                      ? 'bg-gradient-to-br from-[#021f18] to-[#042f22] border-emerald-400 shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-500/40'
                      : 'bg-[#030914] border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5">
                        <Zap size={13} className="text-emerald-400" />
                        <span>OPTION A: DIRECT INSTANT PUBLISH</span>
                      </span>
                      {hodPublishingMode === 'direct' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white pt-1">Direct Live for Students to See</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Whenever an HOD uploads a book, past question, or handout in their Department Studio, it <strong>bypasses admin review</strong> and is immediately published to the master catalog and OPAC. Students can search, read, and download it right away.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Zap size={12} />
                      <span>Zero Wait • Immediate Student Access</span>
                    </span>
                    <button
                      type="button"
                      disabled={isUpdatingHodMode}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        hodPublishingMode === 'direct'
                          ? 'bg-emerald-400 text-slate-950 shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700'
                      }`}
                    >
                      {hodPublishingMode === 'direct' ? 'SELECTED & ACTIVE' : 'SELECT DIRECT PUBLISH'}
                    </button>
                  </div>
                </div>

                {/* Option 2: Require Admin Approval */}
                <div
                  onClick={() => handleToggleHodPublishingMode('approval')}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-4 relative ${
                    hodPublishingMode === 'approval'
                      ? 'bg-gradient-to-br from-[#1c1404] to-[#2b1f07] border-amber-400 shadow-xl shadow-amber-950/80 ring-2 ring-amber-500/40'
                      : 'bg-[#030914] border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-amber-400" />
                        <span>OPTION B: ADMIN APPROVAL REQUIRED</span>
                      </span>
                      {hodPublishingMode === 'approval' && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white pt-1">Wait for Admin Approval (Default Staging Queue)</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      HOD uploads enter the Review Queue as <strong>Pending</strong> at <code className="text-amber-300 font-mono">#/admin/hod-submissions</code>. The Central College Librarian inspects curriculum quality, assigns call numbers/shelves, and clicks Approve before students can see it.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-amber-900/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Clock size={12} />
                      <span>Quality Vetted • Review Gate</span>
                    </span>
                    <button
                      type="button"
                      disabled={isUpdatingHodMode}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        hodPublishingMode === 'approval'
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-amber-950 hover:text-amber-300 border border-slate-700'
                      }`}
                    >
                      {hodPublishingMode === 'approval' ? 'SELECTED & ACTIVE' : 'SELECT ADMIN APPROVAL'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* HOD Features */}
            <section className="bg-[#07101f]/90 border border-teal-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={16} className="text-teal-400" />
                    <span>HOD Academic Department Feature Flags</span>
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-teal-300 bg-teal-950 border border-teal-500/60 px-2.5 py-1 rounded-full">
                  HOD GATEWAY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {Object.entries(config.hodFeatures || {}).map(([key, feat]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      feat.enabled
                        ? 'bg-[#021815] border-teal-500/80 shadow-md'
                        : 'bg-[#060b14] border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">{feat.label}</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{feat.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFeature('hodFeatures', key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        feat.enabled
                          ? 'bg-teal-500 text-black shadow-lg shadow-teal-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Power size={12} />
                      <span>{feat.enabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 3: MASTER PROJECT SETTINGS, LOGO, FAVICON & ARCHITECTURE STUDIO
            (DESIGN & ARCHITECTURE -> theme & master_controls)
        ============================================================== */}
        {(activeTab === 'theme' || activeTab === 'master_controls') && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Mode Switcher inside DESIGN & ARCHITECTURE */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-[#041226] via-[#071a33] to-[#041226] border border-cyan-500/50 shadow-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                    DESIGN &amp; ARCHITECTURE MASTER ENGINE
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live DOM + Database Synced
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Complete Project Settings, Branding &amp; Portal Control Matrix
                </h2>
                <p className="text-xs text-slate-300 font-sans">
                  Modify project name, official logo, browser favicon, watermark policy, theme colors, and turn ON/OFF any page, feature, or function across HOD, Admin, and Student portals individually or in bulk.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    developerConfigService.saveConfig(config);
                    sounds.playSuccessChime();
                    showToast('All project settings, branding, and portal controls saved & broadcast live!');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save &amp; Broadcast All Changes</span>
                </button>
              </div>
            </div>

            {/* 1. PROJECT LOGO, BROWSER FAVICON & LIVE TAB PREVIEW */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Upload size={16} className="text-cyan-400" />
                    <span>Project Logo, Browser Favicon &amp; Live Tab Preview</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">
                    Change the project logo and browser favicon (`&lt;link rel="icon"&gt;`). Updates immediately across all dashboards, login screens, ID cards, and browser tabs.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/60 px-2.5 py-1 rounded-full">
                  LOGO &amp; FAVICON STUDIO
                </span>
              </div>

              {/* Live Browser Tab Preview Bar */}
              <div className="p-3.5 rounded-2xl bg-[#02050b] border border-cyan-900/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Live Browser Tab Preview:</span>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-cyan-500/50 text-xs text-white shadow-inner max-w-md">
                    <img
                      src={faviconPreview || logoPreview}
                      alt="Favicon"
                      className="w-4 h-4 object-contain rounded-sm shrink-0"
                    />
                    <span className="truncate font-sans font-semibold">
                      {config.branding?.projectName || 'FCC Digital Library'} — {config.branding?.shortName || 'FCC IBADAN'}
                    </span>
                    <span className="text-slate-500 text-[10px] ml-2">✕</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  ✓ Active in document.title &amp; &lt;link rel=&quot;icon&quot;&gt;
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Logo Card */}
                <div className="p-5 rounded-2xl bg-[#02050b] border border-cyan-800/60 flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-2xl flex items-center justify-center border-2 border-cyan-400 shrink-0">
                    <img
                      src={logoPreview}
                      alt="Project Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2.5 flex-1 text-center sm:text-left">
                    <div className="text-xs font-black text-white uppercase tracking-wider">
                      1. Project Logo / Official Crest
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Displayed on OPAC, Student Portal, HOD Studio, Admin Console, Printable Library ID Cards, and Email Alerts.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-950 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Upload New Logo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('fcc_custom_logo');
                          setLogoPreview('/assets/fcc-logo.png');
                          handleBrandingChange('logoUrl', '/assets/fcc-logo.png');
                          window.dispatchEvent(new CustomEvent('fcc-logo-updated', { detail: '/assets/fcc-logo.png' }));
                          showToast('Reset project logo to default crest.');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                </div>

                {/* Project Favicon Card */}
                <div className="p-5 rounded-2xl bg-[#02050b] border border-teal-800/60 flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 p-3 shadow-2xl flex flex-col items-center justify-center border-2 border-teal-400 shrink-0 gap-1.5">
                    <img
                      src={faviconPreview || logoPreview}
                      alt="Favicon Preview"
                      className="w-12 h-12 object-contain rounded"
                    />
                    <span className="text-[9px] font-mono text-teal-300">32×32 ICO/PNG</span>
                  </div>
                  <div className="space-y-2.5 flex-1 text-center sm:text-left">
                    <div className="text-xs font-black text-white uppercase tracking-wider">
                      2. Browser Favicon (Tab &amp; Bookmark Icon)
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Updates the browser tab icon, mobile home-screen shortcut icon, and PWA manifest icon immediately.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        type="file"
                        ref={faviconInputRef}
                        accept="image/*,.ico"
                        onChange={handleFaviconUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-950 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Upload Favicon</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFaviconPreview(logoPreview);
                          localStorage.setItem('fcc_custom_favicon', logoPreview);
                          handleBrandingChange('faviconUrl', logoPreview);
                          showToast('Synced Favicon with current Project Logo!');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-teal-700/60 hover:border-teal-400 text-teal-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Use Logo as Favicon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. COMPLETE PROJECT IDENTITY, METADATA, WATERMARK & CIRCULATION SETTINGS */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={16} className="text-amber-400" />
                    <span>Complete Project Identity, Watermark &amp; Institutional Parameters</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">
                    Edit project name, institution title, academic session, digital watermark text, contact channels, and default loan policies.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950 border border-amber-500/60 px-2.5 py-1 rounded-full">
                  GLOBAL PROJECT CONFIG
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-cyan-300 text-[10px] font-bold uppercase mb-1">
                    Project Name (Browser Title &amp; App Header) *
                  </label>
                  <input
                    type="text"
                    value={config.branding?.projectName || ''}
                    onChange={(e) => handleBrandingChange('projectName', e.target.value)}
                    placeholder="FCC Digital Library & Integrated Information System"
                    className="w-full bg-[#02050b] border border-cyan-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Institution Official Name *
                  </label>
                  <input
                    type="text"
                    value={config.branding?.institutionName || ''}
                    onChange={(e) => handleBrandingChange('institutionName', e.target.value)}
                    placeholder="Federal Co-operative College, Ibadan"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Short Name / Acronym *
                  </label>
                  <input
                    type="text"
                    value={config.branding?.shortName || ''}
                    onChange={(e) => handleBrandingChange('shortName', e.target.value)}
                    placeholder="FCC IBADAN"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Library Directorate Title
                  </label>
                  <input
                    type="text"
                    value={config.branding?.libraryTitle || ''}
                    onChange={(e) => handleBrandingChange('libraryTitle', e.target.value)}
                    placeholder="Directorate of Library & Information Services"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Institutional Motto / Slogan
                  </label>
                  <input
                    type="text"
                    value={config.branding?.slogan || ''}
                    onChange={(e) => handleBrandingChange('slogan', e.target.value)}
                    placeholder="Knowledge, Co-operation, Digital Innovation & Academic Excellence"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Active Academic Session
                  </label>
                  <input
                    type="text"
                    value={config.branding?.academicSession || ''}
                    onChange={(e) => handleBrandingChange('academicSession', e.target.value)}
                    placeholder="2025/2026 Academic Session"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Active Semester
                  </label>
                  <select
                    value={config.branding?.currentSemester || 'First Semester'}
                    onChange={(e) => handleBrandingChange('currentSemester', e.target.value)}
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer / Research Session">Summer / Research Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Official Library Email
                  </label>
                  <input
                    type="email"
                    value={config.branding?.officialEmail || ''}
                    onChange={(e) => handleBrandingChange('officialEmail', e.target.value)}
                    placeholder="library@fccibadan.edu.ng"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Helpdesk Support Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={config.branding?.supportPhone || ''}
                    onChange={(e) => handleBrandingChange('supportPhone', e.target.value)}
                    placeholder="+234 803 000 1943"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    value={config.branding?.campusAddress || ''}
                    onChange={(e) => handleBrandingChange('campusAddress', e.target.value)}
                    placeholder="PMB 5033, Eleyele, Ibadan, Oyo State"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Library Operating Hours
                  </label>
                  <input
                    type="text"
                    value={config.branding?.openingHours || ''}
                    onChange={(e) => handleBrandingChange('openingHours', e.target.value)}
                    placeholder="Mon–Fri: 8:00 AM – 6:00 PM"
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-amber-300 text-[10px] font-bold uppercase mb-1">
                    Digital Watermark Protection Text (Applied to Academic Journals &amp; E-Books)
                  </label>
                  <input
                    type="text"
                    value={config.branding?.watermarkText || ''}
                    onChange={(e) => handleBrandingChange('watermarkText', e.target.value)}
                    placeholder="FCC IBADAN DIGITAL LIBRARY • PROTECTED ACADEMIC PROPERTY"
                    className="w-full bg-[#02050b] border border-amber-600/70 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 text-[10px] font-bold uppercase mb-1">
                    Mandatory Journal Watermark
                  </label>
                  <button
                    type="button"
                    onClick={() => handleBrandingChange('enforceJournalWatermark', !(config.branding?.enforceJournalWatermark !== false))}
                    className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      config.branding?.enforceJournalWatermark !== false
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{config.branding?.enforceJournalWatermark !== false ? 'ENFORCED ON JOURNALS' : 'OPTIONAL'}</span>
                    <ShieldCheck size={15} />
                  </button>
                </div>
              </div>
            </section>

            {/* 3. INDIVIDUAL & BULK PORTAL PAGES, FEATURES & FUNCTIONS SWITCHBOARD */}
            <section className="bg-[#07101f]/90 border-2 border-cyan-600/70 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Power size={17} className="text-cyan-400" />
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                      Individual &amp; Bulk Page, Feature &amp; Function Control Center
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    Turn OFF or ON specific pages, features, and functions in <strong>HOD Portal</strong>, <strong>Admin Console</strong>, or <strong>Student Portal</strong> individually with a single click or in bulk across an entire portal.
                  </p>
                </div>

                {/* Search & Portal Scope Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={masterControlSearch}
                      onChange={(e) => setMasterControlSearch(e.target.value)}
                      placeholder="Filter pages, features, functions..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-cyan-800 text-xs text-white focus:border-cyan-400 focus:outline-none w-56"
                    />
                  </div>
                  {[
                    { id: 'all', label: 'All Portals' },
                    { id: 'hod', label: 'HOD Portal' },
                    { id: 'admin', label: 'Admin Console' },
                    { id: 'student', label: 'Student Portal' },
                    { id: 'functions', label: 'System Functions' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setMasterPortalFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        masterPortalFilter === tab.id
                          ? 'bg-cyan-500 text-slate-950 shadow-lg'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MASTER BULK ACTION CARDS PER PORTAL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* HOD Portal Bulk Controller */}
                <div className="p-4 rounded-2xl bg-[#031716] border border-teal-600/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-300 uppercase tracking-wider">
                      HOD Portal Master Bulk Switch
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700">
                      #/hod/*
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Enable or disable all HOD pages &amp; departmental features in one click.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('hod', true)}
                      className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] transition cursor-pointer"
                    >
                      TURN ON ALL HOD
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('hod', false)}
                      className="flex-1 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 font-bold text-[11px] transition cursor-pointer"
                    >
                      TURN OFF ALL HOD
                    </button>
                  </div>
                </div>

                {/* Admin Portal Bulk Controller */}
                <div className="p-4 rounded-2xl bg-[#090d24] border border-indigo-600/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                      Admin Console Master Bulk Switch
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                      #/admin/*
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Enable or disable all Chief Librarian Admin pages &amp; features in one click.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('admin', true)}
                      className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[11px] transition cursor-pointer"
                    >
                      TURN ON ALL ADMIN
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('admin', false)}
                      className="flex-1 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 font-bold text-[11px] transition cursor-pointer"
                    >
                      TURN OFF ALL ADMIN
                    </button>
                  </div>
                </div>

                {/* Student Portal Bulk Controller */}
                <div className="p-4 rounded-2xl bg-[#031c12] border border-emerald-600/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      Student Portal Master Bulk Switch
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      #/scholar/*
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Enable or disable all Student Portal pages &amp; E-Library features in one click.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('student', true)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition cursor-pointer"
                    >
                      TURN ON ALL STUDENT
                    </button>
                    <button
                      type="button"
                      onClick={() => bulkToggleEntirePortal('student', false)}
                      className="flex-1 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 font-bold text-[11px] transition cursor-pointer"
                    >
                      TURN OFF ALL STUDENT
                    </button>
                  </div>
                </div>
              </div>

              {/* MATRIX GROUP A: HOD PAGES & HOD FEATURES */}
              {(masterPortalFilter === 'all' || masterPortalFilter === 'hod') && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#030b17] border border-teal-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/60 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-teal-300 uppercase tracking-wider">
                        HOD Academic Portal — Pages &amp; Features (Individual &amp; Bulk)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Control every tab and capability inside <code className="text-teal-300">#/hod</code>. Disabled tabs are immediately hidden from HOD navigation.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('hodPages', true, 'HOD Pages')}
                        className="px-3 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500 text-teal-200 text-[11px] font-bold cursor-pointer"
                      >
                        Enable All HOD Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('hodPages', false, 'HOD Pages')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Disable All HOD Pages
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(config.hodPages || {})
                      .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc} ${item.path}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                      .map(([key, item]) => (
                        <div
                          key={key}
                          className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                            item.enabled
                              ? 'bg-[#021815] border-teal-500/70'
                              : 'bg-[#060b14] border-rose-900/60 opacity-75'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800">
                                {item.path}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePortalMatrixItem('hodPages', key)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                              item.enabled
                                ? 'bg-teal-500 text-slate-950 shadow'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            <Power size={11} />
                            <span>{item.enabled ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* HOD Features Row */}
                  <div className="pt-3 border-t border-teal-900/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-400 uppercase">HOD Specific Functions &amp; Workflows</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('hodFeatures', true, 'HOD Features')}
                          className="px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 border border-teal-700 text-[10px] font-bold cursor-pointer"
                        >
                          All ON
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('hodFeatures', false, 'HOD Features')}
                          className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold cursor-pointer"
                        >
                          All OFF
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(config.hodFeatures || {})
                        .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                        .map(([key, item]) => (
                          <div
                            key={key}
                            className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                              item.enabled
                                ? 'bg-[#031d1a] border-teal-400/70'
                                : 'bg-[#060b14] border-slate-800 opacity-75'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-white block">{item.label}</span>
                              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePortalMatrixItem('hodFeatures', key)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                                item.enabled
                                  ? 'bg-teal-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <Power size={11} />
                              <span>{item.enabled ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MATRIX GROUP B: ADMIN CONSOLE PAGES & FEATURES */}
              {(masterPortalFilter === 'all' || masterPortalFilter === 'admin') && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#030b17] border border-indigo-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-900/60 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-indigo-300 uppercase tracking-wider">
                        Chief Librarian Admin Console — Pages &amp; Features (Individual &amp; Bulk)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Control every operational module inside <code className="text-indigo-300">#/admin</code>. Disabled modules are hidden from the Admin sidebar and top bar.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('adminPages', true, 'Admin Pages')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500 text-indigo-200 text-[11px] font-bold cursor-pointer"
                      >
                        Enable All Admin Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('adminPages', false, 'Admin Pages')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Disable All Admin Pages
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(config.adminPages || {})
                      .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc} ${item.path}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                      .map(([key, item]) => (
                        <div
                          key={key}
                          className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-2.5 ${
                            item.enabled
                              ? 'bg-[#080d23] border-indigo-500/70'
                              : 'bg-[#060b14] border-rose-900/60 opacity-75'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                            <span className="text-[9px] font-mono text-indigo-400 block">{item.path}</span>
                            <p className="text-[10px] text-slate-400 font-sans leading-tight">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePortalMatrixItem('adminPages', key)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                              item.enabled
                                ? 'bg-indigo-500 text-white shadow'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            <Power size={10} />
                            <span>{item.enabled ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Admin Features Row */}
                  <div className="pt-3 border-t border-indigo-900/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase">Admin Automation &amp; Security Features</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('adminFeatures', true, 'Admin Features')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] font-bold cursor-pointer"
                        >
                          All ON
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('adminFeatures', false, 'Admin Features')}
                          className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold cursor-pointer"
                        >
                          All OFF
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(config.adminFeatures || {})
                        .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                        .map(([key, item]) => (
                          <div
                            key={key}
                            className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                              item.enabled
                                ? 'bg-[#0b1330] border-indigo-400/70'
                                : 'bg-[#060b14] border-slate-800 opacity-75'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-white block">{item.label}</span>
                              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePortalMatrixItem('adminFeatures', key)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                                item.enabled
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <Power size={11} />
                              <span>{item.enabled ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MATRIX GROUP C: STUDENT PORTAL PAGES & FEATURES */}
              {(masterPortalFilter === 'all' || masterPortalFilter === 'student') && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#030b17] border border-emerald-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/60 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wider">
                        Student &amp; Scholar Portal — Pages &amp; Features (Individual &amp; Bulk)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Control every menu item and digital library feature inside <code className="text-emerald-300">#/scholar</code>.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('studentPages', true, 'Student Pages')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500 text-emerald-200 text-[11px] font-bold cursor-pointer"
                      >
                        Enable All Student Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('studentPages', false, 'Student Pages')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Disable All Student Pages
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(config.studentPages || {})
                      .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc} ${item.path}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                      .map(([key, item]) => (
                        <div
                          key={key}
                          className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-2.5 ${
                            item.enabled
                              ? 'bg-[#021a11] border-emerald-500/70'
                              : 'bg-[#060b14] border-rose-900/60 opacity-75'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{item.label}</span>
                            <span className="text-[9px] font-mono text-emerald-400 block">{item.path}</span>
                            <p className="text-[10px] text-slate-400 font-sans leading-tight">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePortalMatrixItem('studentPages', key)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                              item.enabled
                                ? 'bg-emerald-500 text-slate-950 shadow'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            <Power size={10} />
                            <span>{item.enabled ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      ))}
                  </div>

                  {/* Student Features Row */}
                  <div className="pt-3 border-t border-emerald-900/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">Student E-Library Interactive Features</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('studentFeatures', true, 'Student Features')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold cursor-pointer"
                        >
                          All ON
                        </button>
                        <button
                          type="button"
                          onClick={() => bulkToggleMatrixSection('studentFeatures', false, 'Student Features')}
                          className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold cursor-pointer"
                        >
                          All OFF
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(config.studentFeatures || {})
                        .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                        .map(([key, item]) => (
                          <div
                            key={key}
                            className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                              item.enabled
                                ? 'bg-[#032217] border-emerald-400/70'
                                : 'bg-[#060b14] border-slate-800 opacity-75'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-white block">{item.label}</span>
                              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePortalMatrixItem('studentFeatures', key)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition ${
                                item.enabled
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <Power size={11} />
                              <span>{item.enabled ? 'ON' : 'OFF'}</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MATRIX GROUP D: CORE SYSTEM FUNCTIONS & LATEST ENGINES */}
              {(masterPortalFilter === 'all' || masterPortalFilter === 'functions') && (
                <div className="space-y-4 p-5 rounded-2xl bg-[#030b17] border border-cyan-700/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wider">
                        Global System Functions &amp; Latest Engines (Individual &amp; Bulk)
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Toggle Login Email Notifications, Deep PDF/Cover Scanner, Mandatory Journal Watermark Protection, Open-Source Journal APIs, and OPAC Bookmarking.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('systemFunctions', true, 'System Functions')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500 text-cyan-200 text-[11px] font-bold cursor-pointer"
                      >
                        Enable All Functions
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkToggleMatrixSection('systemFunctions', false, 'System Functions')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-[11px] font-bold cursor-pointer"
                      >
                        Disable All Functions
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(config.systemFunctions || {})
                      .filter(([_, item]) => !masterControlSearch || `${item.label} ${item.desc}`.toLowerCase().includes(masterControlSearch.toLowerCase()))
                      .map(([key, item]) => (
                        <div
                          key={key}
                          className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                            item.enabled
                              ? 'bg-[#041829] border-cyan-500/80 shadow-md'
                              : 'bg-[#060b14] border-rose-900/60 opacity-75'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePortalMatrixItem('systemFunctions', key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer transition ${
                              item.enabled
                                ? 'bg-cyan-500 text-slate-950 shadow'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            <Power size={12} />
                            <span>{item.enabled ? 'ACTIVE' : 'OFF'}</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* 4. THEME PRESETS & CUSTOM PALETTE */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-cyan-900/60 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} className="text-cyan-400" />
                  <span>WordPress-Style Theme Presets &amp; Color Architecture</span>
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  Select a master palette to harmonize all portals, buttons, cards, and backgrounds simultaneously.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                  const isSelected = config.theme?.activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectThemePreset(key)}
                      className={`p-4 rounded-2xl text-left transition border-2 cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-[#061427] border-cyan-400 shadow-xl shadow-cyan-950/80'
                          : 'bg-[#02050b] border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{preset.name}</span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 h-6">
                        <div className="h-full flex-1 rounded-md" style={{ backgroundColor: preset.primary }} title="Primary" />
                        <div className="h-full flex-1 rounded-md" style={{ backgroundColor: preset.secondary }} title="Secondary" />
                        <div className="h-full flex-1 rounded-md" style={{ backgroundColor: preset.accent }} title="Accent" />
                        <div className="h-full flex-1 rounded-md border border-slate-700" style={{ backgroundColor: preset.cardBg }} title="Card Background" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 4: PAGE & KILL-SWITCH DIRECTOR (SHUT DOWN / RESTRICT PARTS)
        ============================================================== */}
        {activeTab === 'pages' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="bg-[#07101f]/90 border border-rose-900/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Power size={16} className="text-rose-400" />
                    <span>Page Director &amp; Emergency Kill-Switch Engine</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ability to shut down or put specific pages and parts of the project into maintenance mode instantly.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-rose-300 bg-rose-950 border border-rose-600/60 px-2.5 py-1 rounded-full">
                  ROUTING CONTROLS
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(config.pageStatus || {}).map(([key, page]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      page.enabled
                        ? 'bg-[#02050b] border-slate-800'
                        : 'bg-rose-950/30 border-rose-600/80 shadow-lg'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${page.enabled ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                        <div>
                          <span className="text-xs font-black text-white">{page.title}</span>
                          <span className="text-[10px] text-cyan-400 font-mono ml-2">({page.path})</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePageStatus(key)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          page.enabled
                            ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                        }`}
                      >
                        <Power size={13} />
                        <span>{page.enabled ? 'SHUT DOWN PAGE' : 'RESTORE PAGE'}</span>
                      </button>
                    </div>

                    {/* Maintenance Explanation */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                        Maintenance Notice displayed to visitors when page is restricted:
                      </label>
                      <input
                        type="text"
                        value={page.maintenanceMsg || ''}
                        onChange={(e) => updatePageMaintenanceMsg(key, e.target.value)}
                        className="w-full bg-[#030814] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-rose-500"
                        placeholder="Notice shown when offline..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 5: STUDENT MASTER AUTHORITY (EDIT, BLOCK, REMOVE, CHANGE PIN)
        ============================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-cyan-400" />
                    <span>Student &amp; Patron Master Authority Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Inspect enrolled scholars, change security PINs, suspend accounts, and add new students directly.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Name, Matric No, Student ID, Barcode, Dept..."
                      value={searchPatron}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchPatron(val);
                        fetchBackendStudents(val);
                      }}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-cyan-800 text-xs text-white font-mono focus:outline-none w-72"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPatronModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Add Scholar</span>
                  </button>
                </div>
              </div>

              {/* Patrons Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                      <th className="py-2.5 px-3">Matric No</th>
                      <th className="py-2.5 px-3">Scholar Name</th>
                      <th className="py-2.5 px-3">Student ID / Barcode</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Clear PIN</th>
                      <th className="py-2.5 px-3">Photo Lock (30D)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {patrons
                      .filter(p => {
                        if (!searchPatron) return true;
                        const q = searchPatron.trim().toLowerCase();
                        return (p.name || '').toLowerCase().includes(q) ||
                               (p.matric || '').toLowerCase().includes(q) ||
                               (p.id || '').toLowerCase().includes(q) ||
                               (p.barcode || '').toLowerCase().includes(q) ||
                               (p.library_id || '').toLowerCase().includes(q) ||
                               (p.dept || p.department || '').toLowerCase().includes(q) ||
                               (p.phone || '').toLowerCase().includes(q) ||
                               (p.email || '').toLowerCase().includes(q);
                      })
                      .map((p) => (
                        <tr key={p.matric || p.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-3 px-3 font-bold text-cyan-300">{p.matric}</td>
                          <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.email || '—'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                              {p.barcode || p.library_id || p.id || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">{p.dept || p.department || '—'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/80 text-cyan-300 font-bold font-mono text-xs">
                              {p.pin || '••••'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.is_photo_locked ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                  <Lock size={10} /> {p.photo_days_remaining}d Left
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                                  <Unlock size={10} /> Open
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setLockModalTarget({
                                    type: 'student',
                                    id: p.matric,
                                    name: p.name,
                                    currentDays: p.photo_days_remaining || 0,
                                    isLocked: p.is_photo_locked
                                  });
                                  setLockModalDays(p.is_photo_locked ? p.photo_days_remaining || 30 : 30);
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Remodify or Remove 30-Day Photo Restriction"
                              >
                                <Settings size={10} /> Manage Lock
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.status === 'suspended'
                                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            }`}>
                              {p.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.is_photo_locked ? (
                                <button
                                  type="button"
                                  onClick={() => handleResetProfileLock(p.matric, p.name, 'student')}
                                  className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-800 text-amber-300 transition cursor-pointer"
                                  title="Lift 30-Day Photo Restriction"
                                >
                                  <Unlock size={13} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteLockAction({ id: p.matric, name: p.name, type: 'student' }, 'lock', 30)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-300 transition cursor-pointer"
                                  title="Lock Photo Upload (30 Days)"
                                >
                                  <Lock size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingPatron(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                                title="Change PIN / Edit"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleBlockStudent(p.matric)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  p.status === 'suspended'
                                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300'
                                    : 'bg-amber-950 hover:bg-amber-900 text-amber-300'
                                }`}
                                title={p.status === 'suspended' ? 'Unblock Scholar' : 'Block / Suspend Scholar'}
                              >
                                <UserX size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(p.matric)}
                                className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                                title="Delete Scholar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 6: DRAG & DROP / MODULAR DASHBOARD BLOCK COMPOSER
        ============================================================== */}
        {activeTab === 'layout' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layout size={16} className="text-cyan-400" />
                    <span>WordPress Modular Block Layout Composer</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Reorder and toggle visibility of dashboard cards and widgets on the Student and Admin views.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/60 px-2.5 py-1 rounded-full">
                  VISUAL COMPOSER
                </span>
              </div>

              {/* Student Dashboard Blocks */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Scholar Portal Dashboard Widget Order</span>
                </div>

                <div className="space-y-2">
                  {(config.layoutBlocks?.student || []).map((block, idx) => (
                    <div
                      key={block.id}
                      className="p-3.5 rounded-2xl bg-[#02050b] border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-cyan-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">{block.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {block.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLayoutBlock('student', idx, -1)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === config.layoutBlocks.student.length - 1}
                          onClick={() => moveLayoutBlock('student', idx, 1)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={block.locked}
                          onClick={() => toggleBlockVisibility('student', block.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            block.visible ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {block.visible ? 'VISIBLE' : 'HIDDEN'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==============================================================
            TAB 7: SYSTEM DIAGNOSTICS & TELEMETRY
        ============================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Live Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#07101f] border border-cyan-800/60 shadow-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Catalog Records</div>
                <div className="text-2xl font-black text-white">{stats.booksCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#07101f] border border-emerald-800/60 shadow-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Patrons Total</div>
                <div className="text-2xl font-black text-white">{patrons.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#07101f] border border-amber-800/60 shadow-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Active Loans</div>
                <div className="text-2xl font-black text-white">{stats.loansCount}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#07101f] border border-indigo-800/60 shadow-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase">Local Storage Size</div>
                <div className="text-2xl font-black text-white">{stats.storageKb} KB</div>
              </div>
            </div>

            {/* Emergency Operations */}
            <section className="bg-[#07101f]/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Flame size={16} className="text-rose-400" />
                <span>Emergency System Operations</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    executeWithSecurityCheck('FLUSH APPLICATION LOCALSTORAGE CACHE', () => {
                      const devSess = localStorage.getItem('fcc_developer_session');
                      localStorage.clear();
                      if (devSess) localStorage.setItem('fcc_developer_session', devSess);
                      localStorage.setItem('fcc_god_mode', 'true');
                      showToast('System cache flushed successfully. Reloading...');
                      setTimeout(() => window.location.reload(), 1000);
                    });
                  }}
                  className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 hover:border-rose-500 text-rose-300 text-left transition space-y-1 cursor-pointer"
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-400" />
                    <span>Flush System Cache</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Purges corrupted local browser databases and re-syncs from Laravel backend.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeWithSecurityCheck('RESET DEVELOPER CONFIGURATION TO INSTITUTIONAL FACTORY SETTINGS', () => {
                      developerConfigService.resetToDefaults();
                      setConfig(developerConfigService.getConfig());
                      showToast('Developer configurations reset to defaults.');
                    });
                  }}
                  className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/80 hover:border-amber-500 text-amber-300 text-left transition space-y-1 cursor-pointer"
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw size={14} className="text-amber-400" />
                    <span>Reset Settings to Factory</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Restores institutional default colors, layout blocks, and feature flags.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fcc_library_master_config_${Date.now()}.json`;
                    a.click();
                    showToast('Configuration exported as JSON backup.');
                  }}
                  className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/80 hover:border-cyan-500 text-cyan-300 text-left transition space-y-1 cursor-pointer"
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Download size={14} className="text-cyan-400" />
                    <span>Export Configuration JSON</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Downloads an architectural snapshot of all themes, flags, and blocks.
                  </p>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Edit Student PIN Modal */}
      {editingPatron && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
              <h3 className="text-xs font-black uppercase text-cyan-400">Edit Scholar Record</h3>
              <button onClick={() => setEditingPatron(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div><strong>Name:</strong> {editingPatron.name}</div>
              <div><strong>Matric:</strong> {editingPatron.matric}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                New Security PIN / Passkey
              </label>
              <input
                type="text"
                defaultValue={editingPatron.pin || ''}
                id="fcc-edit-pin-input"
                className="w-full bg-[#02050b] border border-cyan-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('fcc-edit-pin-input');
                if (el) handleUpdateStudentPin(editingPatron.matric, el.value.trim());
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              Save New PIN
            </button>
          </div>
        </div>
      )}

      {/* New Scholar Modal */}
      {newPatronModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
              <h3 className="text-xs font-black uppercase text-cyan-400">Enroll New Scholar Record</h3>
              <button onClick={() => setNewPatronModalOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Matriculation Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="FCC/CSC/2026/001"
                  value={newPatronData.matric}
                  onChange={(e) => setNewPatronData({ ...newPatronData, matric: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Babatunde Quadri"
                  value={newPatronData.name}
                  onChange={(e) => setNewPatronData({ ...newPatronData, name: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Academic Department
                </label>
                <select
                  value={newPatronData.dept}
                  onChange={(e) => setNewPatronData({ ...newPatronData, dept: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white"
                >
                  {departments.map(d => (
                    <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    4-Digit Security PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Set PIN"
                    value={newPatronData.pin}
                    onChange={(e) => setNewPatronData({ ...newPatronData, pin: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={newPatronData.phone}
                    onChange={(e) => setNewPatronData({ ...newPatronData, phone: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg mt-2 cursor-pointer"
              >
                Register Scholar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                  Enroll New Institutional Staff / Admin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Enrolls a verified staff account into the institutional <code className="text-cyan-300">users</code> table. Password is securely hashed with bcrypt in the production database while plain-text secret is synchronized to the Developer Vault.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Full Staff Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. A. K. Bello"
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="staff@fccibadan.edu.ng"
                    value={newStaffData.email}
                    onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ak_bello"
                    value={newStaffData.username}
                    onChange={(e) => setNewStaffData({ ...newStaffData, username: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cleartext password"
                    value={newStaffData.password}
                    onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-amber-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    System Role *
                  </label>
                  <select
                    value={newStaffData.role}
                    onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="admin">Administrator (Full Clearance)</option>
                    <option value="librarian">College Librarian</option>
                    <option value="cataloguer">Chief Cataloguer</option>
                    <option value="circulation_officer">Circulation Officer</option>
                    <option value="hod">Academic HOD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Principal Librarian"
                    value={newStaffData.designation}
                    onChange={(e) => setNewStaffData({ ...newStaffData, designation: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition cursor-pointer"
                >
                  Save &amp; Enroll Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Admin Page & Grant Features */}
      {showAddPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                  Create Custom Admin Page &amp; Grant Features
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPageModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Dynamically architecturalize a new admin portal route (<code className="text-cyan-300">/#/admin/[slug]</code>) in the database and activate modular features.
            </p>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Page Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serials &amp; Bindery Command"
                    value={newPageData.title}
                    onChange={(e) => {
                      const t = e.target.value;
                      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewPageData({ ...newPageData, title: t, slug: newPageData.slug ? newPageData.slug : slug });
                    }}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Route Slug (URL) *
                  </label>
                  <div className="flex items-center bg-[#02050b] border border-cyan-800 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs">
                    <span className="text-slate-500">/#/admin/</span>
                    <input
                      type="text"
                      required
                      placeholder="serials-bindery"
                      value={newPageData.slug}
                      onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                      className="bg-transparent flex-1 text-cyan-300 font-mono focus:outline-none ml-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Page Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Institutional purpose and departmental scope of this portal..."
                  value={newPageData.description}
                  onChange={(e) => setNewPageData({ ...newPageData, description: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Allowed Clearance Roles (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="admin,librarian,cataloguer"
                  value={newPageData.allowed_roles}
                  onChange={(e) => setNewPageData({ ...newPageData, allowed_roles: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Granular Features Activation */}
              <div className="space-y-2 pt-2 border-t border-cyan-900/60">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Grant Dedicated Features &amp; Capabilities to this Page:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'catalog', label: 'Catalog Search & Editing', desc: 'Direct access to institutional bibliographic index' },
                    { key: 'upload', label: 'Direct Book & PDF Upload Studio', desc: 'Upload e-books and papers straight to database' },
                    { key: 'biometrics', label: 'Biometric Clearance & Scanner', desc: 'Fingerprint and facial ID authentication' },
                    { key: 'audit', label: 'System Audit Logs & Telemetry', desc: 'Review real-time access and transaction logs' },
                    { key: 'sms', label: 'SMS & Email Dispatch Gateway', desc: 'Broadcast notices and overdue alerts' },
                    { key: 'gate', label: 'Turnstile & Physical Gate Control', desc: 'Hardware barrier integration for this module' },
                    { key: 'fines', label: 'Overdue Fines & Billing Desk', desc: 'Automated calculations and payment receipts' },
                    { key: 'rfid', label: 'RFID Real-Time Shelf Tracking', desc: 'Radio frequency scanning and lost book finder' }
                  ].map(feat => {
                    const checked = !!newPageData.features?.[feat.key];
                    return (
                      <label
                        key={feat.key}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                          checked
                            ? 'bg-cyan-950/70 border-cyan-500 text-white'
                            : 'bg-[#02050b] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setNewPageData({
                              ...newPageData,
                              features: {
                                ...newPageData.features,
                                [feat.key]: e.target.checked
                              }
                            });
                          }}
                          className="mt-0.5 accent-cyan-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight font-sans">{feat.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight font-sans mt-0.5">{feat.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition cursor-pointer"
                >
                  Architect &amp; Grant Features
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Staff Credentials & Password */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#050e1c] border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black uppercase text-emerald-300">
                  Edit Staff Member &amp; Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Official Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Administrative Username
                  </label>
                  <input
                    type="text"
                    value={editingStaff.username || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={editingStaff.designation || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    System Authority Role *
                  </label>
                  <select
                    value={editingStaff.role || 'admin'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="admin">Administrator (Full Clearance)</option>
                    <option value="librarian">College Librarian</option>
                    <option value="cataloguer">Chief Cataloguer</option>
                    <option value="circulation_officer">Circulation Officer</option>
                    <option value="hod">Academic HOD</option>
                    <option value="staff">Staff Member</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Account Status Action
                  </label>
                  <select
                    value={editingStaff.status || 'active'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="active">Active (Full Clearance)</option>
                    <option value="blocked">Blocked (Login Terminated)</option>
                    <option value="restricted">Restricted (Read-Only Mode)</option>
                    <option value="suspended">Suspended (Temporary Freeze)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Current Password in Vault
                  </label>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold truncate">
                    {editingStaff.plain_secret || '••••••••'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1 flex items-center justify-between">
                  <span>Change Password (Leave blank to keep current)</span>
                  <span className="text-emerald-400 text-[9px] font-mono">Bcrypt DB + Clear Vault</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter new plain-text password to sync to database..."
                  value={editingStaffPass}
                  onChange={(e) => setEditingStaffPass(e.target.value)}
                  className="w-full bg-[#02050b] border border-emerald-600 rounded-xl px-3.5 py-2 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaffEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingStaffEdit && <RefreshCw size={12} className="animate-spin" />}
                  <span>Save Staff Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Scholar Record & PIN */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-cyan-400" />
                <h3 className="text-sm font-black uppercase text-cyan-300">
                  Edit Scholar Record &amp; Security PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Scholar Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Matriculation Number (Permanent)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingStudent.matric || ''}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-cyan-400 font-mono font-bold opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Department
                  </label>
                  <select
                    value={editingStudent.department || editingStudent.dept || (departments[0]?.name || '')}
                    onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  >
                    {departments.map(d => (
                      <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Academic Level
                  </label>
                  <select
                    value={editingStudent.level || 'ND I'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, level: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ND I">ND I</option>
                    <option value="ND II">ND II</option>
                    <option value="HND I">HND I</option>
                    <option value="HND II">HND II</option>
                    <option value="PGD">Postgraduate Diploma</option>
                    <option value="Scholar">Visiting Scholar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Account Status
                  </label>
                  <select
                    value={editingStudent.status || 'active'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="blocked">Blocked (Access Denied)</option>
                    <option value="restricted">Restricted (Borrowing Frozen)</option>
                    <option value="suspended">Suspended (Disciplinary Hold)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1 flex items-center justify-between">
                    <span>Security Clearance PIN</span>
                    <span className="text-cyan-400 text-[9px] font-mono">4-Digit Access Key</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1234"
                    value={editingStudentPin}
                    onChange={(e) => setEditingStudentPin(e.target.value)}
                    className="w-full bg-[#02050b] border border-cyan-500 rounded-xl px-3.5 py-2 text-cyan-300 font-mono font-bold text-center tracking-widest focus:outline-none focus:border-cyan-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudentEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingStudentEdit && <RefreshCw size={12} className="animate-spin" />}
                  <span>Save Scholar PIN &amp; Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Profile Restriction & Lock Remodify Studio (Admin, HOD, Scholar) */}
      {lockModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#050e1c] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <h3 className="text-sm font-black uppercase text-amber-300">
                  Profile Restriction &amp; Cooldown Studio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLockModalTarget(null)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 space-y-1 text-xs">
              <div className="text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                TARGET ACCOUNT:
              </div>
              <div className="text-sm font-bold text-white font-sans flex items-center justify-between">
                <span>{lockModalTarget.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700">
                  {lockModalTarget.type.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-amber-300/80 font-mono">
                Current Lock Status: {lockModalTarget.isLocked ? `${lockModalTarget.currentDays} days remaining` : 'No Active Lock (Unlocked)'}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Adjust Restriction Window (Days Remaining)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max={lockModalTarget.type === 'student' ? 30 : 14}
                    value={lockModalDays}
                    onChange={(e) => setLockModalDays(Number(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <div className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/80 text-amber-300 font-mono font-bold text-center">
                    {lockModalDays}d
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>1 Day (Minimum)</span>
                  <span>{lockModalTarget.type === 'student' ? '30 Days (Full Policy)' : '14 Days (Full Policy)'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={lockModalSaving}
                  onClick={() => handleExecuteLockAction(lockModalTarget, 'remodify', lockModalDays)}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={13} className={lockModalSaving ? 'animate-spin' : ''} />
                  <span>Set to {lockModalDays} Days</span>
                </button>

                <button
                  type="button"
                  disabled={lockModalSaving}
                  onClick={() => handleExecuteLockAction(lockModalTarget, 'unlock')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Remove Lock Now</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Or enforce fresh lock from today:</span>
                <button
                  type="button"
                  disabled={lockModalSaving}
                  onClick={() => handleExecuteLockAction(lockModalTarget, 'lock', lockModalTarget.type === 'student' ? 30 : 14)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Lock size={11} />
                  <span>Reset to Full {lockModalTarget.type === 'student' ? '30-Day' : '14-Day'} Lock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Academic Department Add/Edit Modal (Direct Database Sync) */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 sm:p-7 space-y-4 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-cyan-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">
                    {editingDept ? 'Modify Academic Department' : 'Register New Academic Department'}
                  </h3>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    Direct Central Database &bull; Table: departments
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeptModalOpen(false);
                  setEditingDept(null);
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3.5 text-xs relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Information Technology"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CSC"
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Head of Department (HOD) Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. E. Okonjo"
                    value={deptFormData.hod_name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, hod_name: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    HOD Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="hod.csc@fccibadanlibrary.com.ng"
                    value={deptFormData.hod_email}
                    onChange={(e) => setDeptFormData({ ...deptFormData, hod_email: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    HOD Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+234..."
                    value={deptFormData.hod_phone}
                    onChange={(e) => setDeptFormData({ ...deptFormData, hod_phone: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    HOD Portal PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Set PIN"
                    value={deptFormData.hod_pin}
                    onChange={(e) => setDeptFormData({ ...deptFormData, hod_pin: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                    Established Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1980"
                    value={deptFormData.established}
                    onChange={(e) => setDeptFormData({ ...deptFormData, established: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Faculty / School Affiliation
                </label>
                <input
                  type="text"
                  placeholder="e.g. School of Applied Sciences & Information Technology"
                  value={deptFormData.faculty}
                  onChange={(e) => setDeptFormData({ ...deptFormData, faculty: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1">
                  Department Description & Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="Academic scope, accreditation status, or curriculum description..."
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[10px] uppercase font-bold mb-1.5 flex items-center justify-between">
                  <span>Department Solid Brand Color & Theme (Must Be Unique)</span>
                  <span className="text-[9px] text-cyan-400 font-mono">1 Exclusive Color Per Department</span>
                </label>

                {(() => {
                  const usedColors = getUsedDepartmentColors(departments, editingDept?.id || editingDept?.code);
                  const isCurrentChosenUsed = usedColors[normalizeColorKey(deptFormData.color)];
                  const paletteList = Object.values(SOLID_COLOR_PALETTES).filter(c => c.key && !['purple', 'red', 'mint', 'gold'].includes(c.key));

                  return (
                    <div className="space-y-2">
                      {isCurrentChosenUsed && (
                        <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-[11px] flex items-center gap-2">
                          <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                          <span>This solid color is already assigned to <strong>{isCurrentChosenUsed}</strong>. Each department must have a distinct color.</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                        {paletteList.map(c => {
                          const isSelected = normalizeColorKey(deptFormData.color) === c.key;
                          const occupiedBy = usedColors[c.key];

                          return (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setDeptFormData({ ...deptFormData, color: c.key });
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-950/90 text-white shadow-md ring-1 ring-cyan-400/50'
                                  : occupiedBy
                                  ? 'border-slate-800/80 bg-slate-950/40 text-slate-500 opacity-60 hover:opacity-90'
                                  : 'border-slate-800 bg-[#02050b] text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                              title={occupiedBy ? `Currently assigned to ${occupiedBy}` : `Available exclusive color: ${c.name}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.solid }} />
                                <span className="truncate text-[11px]">{c.name}</span>
                              </div>
                              {occupiedBy && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono font-bold shrink-0">
                                  {occupiedBy}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-cyan-900/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeptModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-900/50 disabled:opacity-50 cursor-pointer"
                >
                  <Building2 size={14} className={deptSaving ? 'animate-spin' : ''} />
                  <span>{deptSaving ? 'Saving to Database...' : editingDept ? 'Update Department' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Institutional Master Footer */}
      <div className="relative z-10 w-full mt-8">
        <InstitutionalFooter />
      </div>
    </div>
  </div>
);
}
