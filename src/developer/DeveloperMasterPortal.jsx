import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, ShieldAlert, Cpu, Database, Key, Lock, Unlock, ArrowRight, Eye, EyeOff,
  Sparkles, CheckCircle2, RefreshCw, AlertTriangle, Users, BookOpen, Layers,
  Building2, Monitor, Smartphone, Globe, Zap, ArrowLeft, Radio, Flame, Server,
  Sliders, HardDrive, Check, Play, UserCheck, ShieldCheck, Palette, Layout,
  ToggleLeft, ToggleRight, Power, Upload, Trash2, Edit3, UserX, UserPlus,
  Search, Shield, Phone, MessageSquare, Download, FileText, ChevronUp, ChevronDown,
  X, HelpCircle, Save, ExternalLink,
  LogOut, Menu, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Activity, Wifi, Wrench
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { institutionalConfigService } from '../services/institutionalConfigService';
import { navigateTo } from '../utils/router';
import { PATTERNS } from '../utils/backgroundPatterns';
import { getInstitutionalLogo } from '../assets/logo';
import { sounds } from '../utils/soundEffects';
import {
  developerConfigService,
  THEME_PRESETS
} from '../services/developerConfigService';
import DeveloperAuditTrail from './DeveloperAuditTrail';
import DeveloperAdminOverview from './DeveloperAdminOverview';
import DeveloperBookStudio from './DeveloperBookStudio';
import InstitutionalFooter from '../common/InstitutionalFooter';
import { Ban } from 'lucide-react';

const DEV_CREDENTIALS = {
  username: 'fcc_developer',
  password: 'FCC@DevMaster2026!#'
};

const DEPARTMENTS = [
  { code: 'CSC', name: 'Computer Science & Information Technology', hod: 'Dr. (Mrs) Olonade A. O.', matric: 'HOD/CSC/001' },
  { code: 'CEM', name: 'Co-operative Economics & Management', hod: 'Dr. Adeleke O. S.', matric: 'HOD/CEM/001' },
  { code: 'BNF', name: 'Banking & Finance', hod: 'Mrs. Balogun K. A.', matric: 'HOD/BNF/001' },
  { code: 'AGR', name: 'Agricultural Extension & Rural Dev', hod: 'Dr. Ogunleye T. B.', matric: 'HOD/AGR/001' },
  { code: 'PAD', name: 'Public Administration', hod: 'Dr. Johnson E. F.', matric: 'HOD/PAD/001' }
];

export default function DeveloperMasterPortal({ onImpersonate, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('fcc_developer_session') === 'active';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Master Tab
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' | 'staff' | 'students' | 'institution_delegation' | 'books' | 'admin_pages' | 'impersonator' | 'features' | 'theme' | 'pages' | 'layout' | 'system'

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

  // Master Configuration State
  const [config, setConfig] = useState(() => developerConfigService.getConfig());
  const [toastMessage, setToastMessage] = useState('');

  // Security Prompt Modal for High-Impact Actions
  const [pendingAction, setPendingAction] = useState(null); // { type, payload, callback, description }
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Logo upload preview
  const [logoPreview, setLogoPreview] = useState(() => getInstitutionalLogo());
  const fileInputRef = useRef(null);

  // Patrons State
  const [patrons, setPatrons] = useState(() => {
    try {
      const stored = localStorage.getItem('fcc_registered_patrons') || localStorage.getItem('fcc_db_patrons');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        matric: 'FCC/CSC/2026/409',
        name: 'OLAWALE AKEEM OLONADE',
        dept: 'Computer Science & Information Technology',
        level: 'HND II (Final Year)',
        pin: '1236',
        phone: '+2348061657738',
        status: 'active'
      },
      {
        matric: 'FCC/CEM/2024/011',
        name: 'Ibrahim Adekunle',
        dept: 'Co-operative Economics & Management',
        level: 'HND I',
        pin: '5678',
        phone: '+2348123456789',
        status: 'active'
      },
      {
        matric: 'FCC/BNF/2024/077',
        name: 'Amina Bello',
        dept: 'Banking & Finance',
        level: 'ND II',
        pin: '2468',
        phone: '+2348067779900',
        status: 'active'
      }
    ];
  });
  const [searchPatron, setSearchPatron] = useState('');

  // Edit Patron Modal
  const [editingPatron, setEditingPatron] = useState(null);
  const [newPatronModalOpen, setNewPatronModalOpen] = useState(false);
  const [newPatronData, setNewPatronData] = useState({
    matric: '',
    name: '',
    dept: 'Computer Science & Information Technology',
    level: 'ND I',
    pin: '1234',
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

  // --- STAFF & SCHOLAR VAULT EDIT / STATUS STATES ---
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingStaffPass, setEditingStaffPass] = useState('');
  const [savingStaffEdit, setSavingStaffEdit] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStudentPin, setEditingStudentPin] = useState('');
  const [savingStudentEdit, setSavingStudentEdit] = useState(false);

  // --- STAFF DIRECTORY STATE ---
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    username: '',
    password: 'admin123',
    role: 'admin',
    designation: 'Assistant College Librarian',
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
    department: 'Computer Science & Information Technology',
    subject: 'General Science & Computing',
    courseCode: 'CSC101',
    targetLevel: 'ND I',
    shelfLocation: 'Main Stacks, Aisle 2, Bay B',
    copiesTotal: 5,
    abstract: '',
    coverImage: '',
    fileDataUrl: ''
  });
  const [bookUploading, setBookUploading] = useState(false);
  const [recentBooks, setRecentBooks] = useState([]);

  // --- INSTITUTIONAL CONFIGURATION DELEGATION STATE ---
  const [institutionPermissions, setInstitutionPermissions] = useState({
    admin_allowed: true,
    allowed_hod_depts: ['CSC', 'CEM']
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
      allowed_hod_depts: DEPARTMENTS.map(d => d.code)
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

  // Data fetching functions
  const fetchVault = async () => {
    setVaultLoading(true);
    try {
      const res = await fetch('/api/developer/vault', {
        headers: { 'X-Developer-Passkey': DEV_CREDENTIALS.password }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.vault) {
          setVaultData(data.vault);
        }
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
      const res = await fetch(`/api/developer/staff?q=${q}`, {
        headers: { 'X-Developer-Passkey': DEV_CREDENTIALS.password }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
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
      const res = await fetch('/api/developer/pages');
      if (res.ok) {
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
      const res = await fetch(`/api/developer/students?q=${q}`);
      if (res.ok) {
        const data = await res.json();
        if (data.students && data.students.length > 0) {
          setPatrons(data.students);
        }
      }
    } catch (e) {}
  };

  const fetchRecentBooks = async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data.books) {
          setRecentBooks(data.books.slice(0, 10));
        }
      }
    } catch (e) {}
  };

  const fetchDbTelemetry = async () => {
    setDbTelemetryLoading(true);
    try {
      const res = await fetch('/api/developer/database/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDbTelemetry(data);
        }
      }
    } catch (e) {
      console.warn('DB Telemetry fetch error:', e);
    } finally {
      setDbTelemetryLoading(false);
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
    }
  }, [isAuthenticated]);

  const toggleRevealSecret = (id) => {
    setRevealedSecrets(prev => ({
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
      const res = await fetch(`/api/developer/staff/${staffId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff ${staffName || staffId} status set to ${newStatus.toUpperCase()}`);
        fetchVault();
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to update staff status');
      }
    } catch (err) {
      showToast('Network error updating staff status');
    }
  };

  // Save Staff Edit (Name, Username, Email, Designation, Status, Password)
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
        designation: editingStaff.designation,
        status: editingStaff.status || 'active'
      };
      if (editingStaffPass && editingStaffPass.trim()) {
        payload.password = editingStaffPass.trim();
      }
      const res = await fetch(`/api/developer/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff ${editingStaff.name} updated successfully!`);
        setEditingStaff(null);
        setEditingStaffPass('');
        fetchVault();
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to update staff credentials');
      }
    } catch (err) {
      showToast('Network error updating staff');
    } finally {
      setSavingStaffEdit(false);
    }
  };

  // Update Scholar Status (Block, Restrict, Suspend, Activate)
  const handleUpdateStudentStatus = async (matric, newStatus, scholarName) => {
    sounds.playClick();
    try {
      const res = await fetch(`/api/developer/students/${encodeURIComponent(matric)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
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
      const res = await fetch(`/api/developer/students/${encodeURIComponent(editingStudent.matric)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
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
      const res = await fetch('/api/developer/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
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
          department: 'Computer Science & Information Technology',
          subject: 'General Science & Computing',
          courseCode: 'CSC101',
          targetLevel: 'ND I',
          shelfLocation: 'Main Stacks, Aisle 2, Bay B',
          copiesTotal: 5,
          abstract: '',
          coverImage: '',
          fileDataUrl: ''
        });
        fetchRecentBooks();
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
      const res = await fetch('/api/developer/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
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
        const res = await fetch(`/api/developer/pages/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'X-Developer-Passkey': DEV_CREDENTIALS.password }
        });
        if (res.ok) {
          sounds.playSuccessChime();
          showToast(`Admin page "${title}" deleted.`);
          fetchCustomPages();
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
      const res = await fetch('/api/developer/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
        body: JSON.stringify(newStaffData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`Staff member "${newStaffData.name}" enrolled. Password hashed in DB; unhashed secret mirrored to Vault.`);
        setShowAddStaffModal(false);
        setNewStaffData({
          name: '',
          email: '',
          username: '',
          password: 'admin123',
          role: 'admin',
          designation: 'Assistant College Librarian',
          phone: ''
        });
        fetchStaff();
        fetchVault();
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
        const res = await fetch(`/api/developer/staff/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'X-Developer-Passkey': DEV_CREDENTIALS.password }
        });
        if (res.ok) {
          sounds.playSuccessChime();
          showToast(`Staff record for ${name} removed.`);
          fetchStaff();
          fetchVault();
        }
      } catch (err) {
        showToast('Error deleting staff.');
      }
    });
  };

  // Handle Reset 30-Day Profile Lock (Developer Override)
  const handleResetProfileLock = async (userId, name) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/developer/reset-profile-lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        showToast(`30-day security lock lifted for ${name || 'Administrator/HOD'}. Ready for credential update.`);
        fetchStaff();
        fetchVault();
      } else {
        sounds.playErrorBuzz();
        showToast(data.error || 'Failed to reset profile lock.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast('Network error resetting profile lock.');
    }
  };


  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const b = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
      const l = JSON.parse(localStorage.getItem('fcc_loans_v48_gov') || '[]');
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        totalBytes += (localStorage.getItem(k) || '').length * 2;
      }
      setStats({
        booksCount: b.length || 24,
        patronsCount: patrons.length,
        loansCount: l.length || 6,
        storageKb: Math.round(totalBytes / 1024),
        backendOnline: false
      });

      fetch('/api/catalog')
        .then(r => setStats(s => ({ ...s, backendOnline: r.ok })))
        .catch(() => setStats(s => ({ ...s, backendOnline: false })));
    } catch (e) {}
  }, [isAuthenticated, patrons]);

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

  // Auth Handler
  const handleDevLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const u = username.trim();
    const p = password.trim();

    const isValidDev =
      (u.toLowerCase() === DEV_CREDENTIALS.username.toLowerCase() || u.toLowerCase() === 'developer' || u.toLowerCase() === 'root') &&
      developerConfigService.verifyDevPassword(p);

    if (isValidDev) {
      setTimeout(() => {
        sounds.playSuccessChime();
        localStorage.setItem('fcc_developer_session', 'active');
        localStorage.setItem('fcc_god_mode', 'true');
        setIsAuthenticated(true);
        setLoginLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: u, password: p, login_mode: 'developer' })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user?.role === 'developer') {
        sounds.playSuccessChime();
        localStorage.setItem('fcc_developer_session', 'active');
        localStorage.setItem('fcc_god_mode', 'true');
        setIsAuthenticated(true);
        setLoginLoading(false);
        return;
      }
    } catch (err) {}

    setLoginLoading(false);
    sounds.playErrorBuzz();
    setLoginError('ACCESS DENIED: Unauthorized Developer Signature. This terminal is strictly monitored.');
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
      await fetch('/api/developer/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': DEV_CREDENTIALS.password
        }
      }).catch(() => {});
    } catch (e) {}

    localStorage.removeItem('fcc_developer_session');
    localStorage.removeItem('fcc_god_mode');
    setIsAuthenticated(false);
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    sounds.playSuccessChime();
    showToast('Developer God Mode session terminated safely. Root locked.');
    if (onLogout) onLogout();
  };

  // 1-Click Impersonation Switchers
  const impersonateAdmin = () => {
    sounds.playSuccessChime();
    const adminUser = {
      id: 999,
      role: 'admin',
      name: 'Alhaji Balogun O. (College Chief Librarian)',
      email: 'admin@fccibadan.com.ng',
      designation: 'Director of Library Services',
      isDeveloperImpersonation: true
    };
    localStorage.setItem('fcc_admin_session', JSON.stringify(adminUser));
    if (onImpersonate) onImpersonate('admin', adminUser);
    navigateTo('/admin/overview');
  };

  const impersonateHod = (dept) => {
    sounds.playSuccessChime();
    const hodUser = {
      role: 'hod',
      name: dept.hod,
      department_code: dept.code,
      department_name: dept.name,
      department_id: `DEP-${dept.code}`,
      matric: dept.matric,
      isDeveloperImpersonation: true
    };
    localStorage.setItem('fcc_hod_session', JSON.stringify(hodUser));
    if (onImpersonate) onImpersonate('hod', hodUser);
    navigateTo('/hod/overview');
  };

  const impersonateStudent = (customMatric = 'FCC/CSC/2026/409', customName = 'OLAWALE AKEEM OLONADE') => {
    sounds.playSuccessChime();
    const studentUser = {
      role: 'student',
      matric: customMatric,
      name: customName,
      dept: 'Computer Science & Information Technology',
      level: 'HND II (Final Year)',
      phone: '+2348061657738',
      isDeveloperImpersonation: true
    };
    localStorage.setItem('fcc_student_session', JSON.stringify(studentUser));
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

  // Theme Preset Switcher
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

  // Student Patron Master Actions
  const toggleBlockStudent = (matric) => {
    const p = patrons.find(x => x.matric === matric);
    if (!p) return;
    const isBlocking = p.status !== 'suspended';
    executeWithSecurityCheck(`${isBlocking ? 'SUSPEND / BLOCK' : 'RE-ACTIVATE'} scholar ${p.name} (${p.matric})`, () => {
      setPatrons(prev => prev.map(x => x.matric === matric ? { ...x, status: isBlocking ? 'suspended' : 'active' } : x));
      showToast(`Scholar ${p.matric} is now ${isBlocking ? 'SUSPENDED' : 'ACTIVE'}.`);
    });
  };

  const handleUpdateStudentPin = (matric, newPin) => {
    executeWithSecurityCheck(`RESET PIN FOR SCHOLAR ${matric}`, () => {
      setPatrons(prev => prev.map(x => x.matric === matric ? { ...x, pin: newPin } : x));
      setEditingPatron(null);
      showToast(`Security PIN for ${matric} updated to "${newPin}".`);
    });
  };

  const handleDeleteStudent = (matric) => {
    executeWithSecurityCheck(`PERMANENTLY DELETE SCHOLAR RECORD ${matric}`, () => {
      setPatrons(prev => prev.filter(x => x.matric !== matric));
      showToast(`Scholar ${matric} permanently removed from institutional records.`);
    });
  };

  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!newPatronData.matric.trim() || !newPatronData.name.trim()) return;

    executeWithSecurityCheck(`REGISTER NEW SCHOLAR ${newPatronData.matric}`, () => {
      const newRecord = {
        ...newPatronData,
        matric: newPatronData.matric.trim().toUpperCase(),
        status: 'active'
      };
      setPatrons(prev => [newRecord, ...prev.filter(x => x.matric !== newRecord.matric)]);
      setNewPatronModalOpen(false);
      setNewPatronData({
        matric: '',
        name: '',
        dept: 'Computer Science & Information Technology',
        level: 'ND I',
        pin: '1234',
        phone: ''
      });
      showToast(`New scholar record created for ${newRecord.matric}!`);
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
        { id: 'staff', label: 'Staff Directory', icon: UserCheck, badge: '30D LOCK', desc: 'Staff credentials & lock status' },
        { id: 'students', label: 'Scholar PIN Vault', icon: Users, badge: 'PINS', desc: 'Search & edit student PINs' },
        { id: 'audit', label: 'Security Audit Trail', icon: ShieldAlert, badge: 'LEDGER', desc: 'Live cryptographic audit logs' },
      ]
    },
    {
      group: 'ADMIN OPERATIONS & CATALOG',
      items: [
        { id: 'admin_overview', label: 'Master Admin Console', icon: Activity, badge: 'LIVE OPS', desc: 'Circulation velocity & admin desk' },
        { id: 'books', label: 'Direct Book Ingestion', icon: BookOpen, badge: 'STUDIO', desc: 'Live catalog & HOD upload studio' },
        { id: 'institution_delegation', label: 'Institutional Delegation', icon: Building2, badge: 'ASSIGN', desc: 'Assign INSTITUTION access' },
        { id: 'admin_pages', label: 'Admin Page Builder', icon: Layers, badge: 'DYNAMIC', desc: 'Create pages & grant features' },
      ]
    },
    {
      group: 'RUNTIME & CONTROLS',
      items: [
        { id: 'impersonator', label: '1-Click Impersonator', icon: Play, badge: 'OMNI', desc: 'Jump into any page/role' },
        { id: 'features', label: 'Feature Flag Matrix', icon: ToggleRight, badge: 'ONLINE', desc: 'Activate E-Library features' },
        { id: 'pages', label: 'Kill-Switch Director', icon: Power, badge: 'EMERGENCY', desc: 'Disable/shut down pages' },
      ]
    },
    {
      group: 'DESIGN & ARCHITECTURE',
      items: [
        { id: 'theme', label: 'Theme & Brand Studio', icon: Palette, badge: 'THEMES', desc: 'Logo upload & page colors' },
        { id: 'layout', label: 'Visual Composer', icon: Layout, badge: 'WIDGETS', desc: 'Drag & drop dashboard blocks' },
        { id: 'system', label: 'System Diagnostics', icon: HardDrive, badge: 'TELEMETRY', desc: 'Cache flush & telemetry' },
      ]
    }
  ];

  // AUTHENTICATED: Master Developer Console (Super-Seeds Everything)
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex font-mono relative overflow-x-hidden">
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

      {/* Modern High-Tech Developer Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-[#050b17]/95 backdrop-blur-2xl border-r border-cyan-900/60 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl shrink-0 ${
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
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
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Database size={13} className="text-cyan-400" />
              <span>DB: <strong className="text-emerald-400">{dbTelemetry.driver || 'SQLITE'}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Books: <strong className="text-white">{dbTelemetry.counts?.books ?? stats.booksCount}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Scholars: <strong className="text-white">{dbTelemetry.counts?.patrons ?? patrons.length}</strong></span>
            </div>

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

            {/* SECTION 1: Staff & Administrator Vault */}
            <section className="bg-[#07101f]/90 border border-emerald-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Staff &amp; Administrator Passwords (Unhashed Plain-Text)
                  </h3>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter staff by name, email, username..."
                    value={vaultStaffSearch}
                    onChange={e => setVaultStaffSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-emerald-800 text-xs text-white focus:outline-none w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-emerald-400 uppercase tracking-wider font-mono">
                      <th className="py-2.5 px-3">Staff Member &amp; Title</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Unhashed Password</th>
                      <th className="py-2.5 px-3">30-Day Lock</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {(vaultData.staff || [])
                      .filter(s => {
                        if (!vaultStaffSearch) return true;
                        const q = vaultStaffSearch.toLowerCase();
                        return (s.name || '').toLowerCase().includes(q) ||
                               (s.email || '').toLowerCase().includes(q) ||
                               (s.username || '').toLowerCase().includes(q) ||
                               (s.designation || '').toLowerCase().includes(q);
                      })
                      .map(s => {
                        const isRevealed = revealedSecrets[s.id] !== false;
                        const plain = s.plain_secret || 'admin123';
                        return (
                          <tr key={s.id} className="hover:bg-slate-900/60 transition">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white font-sans">{s.name}</div>
                              <div className="text-[10px] text-slate-400">{s.designation || 'Staff'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                                {s.role?.toUpperCase() || 'ADMIN'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-cyan-300 font-bold">
                              {s.username || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-[11px]">
                              {s.email}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-black tracking-wider text-xs font-mono">
                                  {isRevealed ? plain : '••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealSecret(s.id)}
                                  className="text-slate-400 hover:text-white p-1"
                                  title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                                >
                                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {s.is_locked ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                    <Lock size={10} /> {s.days_remaining}d Left
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResetProfileLock(s.id, s.name)}
                                    className="px-2 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-700 text-cyan-200 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Lift 30-Day Restriction"
                                  >
                                    <Unlock size={10} /> Unlock
                                  </button>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 w-fit">
                                  <Unlock size={10} /> Unlocked
                                </span>
                              )}
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
                                    title="Remove Restriction"
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

                                {s.is_locked && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetProfileLock(s.id, s.name)}
                                    className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-200 border border-amber-800 transition cursor-pointer"
                                    title="Reset 30-Day Lock"
                                  >
                                    <Unlock size={12} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(plain, `Password for ${s.name}`)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900 text-slate-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Copy</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 2: Scholar & Student Security PIN Vault */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <Users size={18} className="text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Scholar Security PIN Vault (Unhashed Clearance PINs)
                  </h3>
                </div>

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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                      <th className="py-2.5 px-3">Scholar Name</th>
                      <th className="py-2.5 px-3">Matriculation No</th>
                      <th className="py-2.5 px-3">Student ID / Barcode</th>
                      <th className="py-2.5 px-3">Department &amp; Level</th>
                      <th className="py-2.5 px-3">Clearance PIN</th>
                      <th className="py-2.5 px-3">Account Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {(vaultData.students?.length ? vaultData.students : patrons)
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
                      .map(stu => (
                        <tr key={stu.matric || stu.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white font-sans">{stu.name}</div>
                            <div className="text-[10px] text-slate-400">{stu.level || 'Scholar'}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-cyan-300">
                            {stu.matric}
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            {stu.barcode || stu.library_id || stu.id || 'FCC-STU-001'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                            <div>{stu.department || stu.dept || 'CSC'}</div>
                            <div className="text-[10px] text-slate-500">{stu.level || 'ND I'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/70 text-cyan-300 font-bold font-mono text-xs">
                              {stu.pin || '1234'}
                            </span>
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

                              <button
                                type="button"
                                onClick={() => copyToClipboard(stu.pin || '1234', `PIN for ${stu.name}`)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <span>Copy PIN</span>
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
                    {institutionPermissions.allowed_hod_depts?.length || 0} of {DEPARTMENTS.length} Departments
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
                {DEPARTMENTS.map(dept => {
                  const isAssigned = (institutionPermissions.allowed_hod_depts || []).includes(dept.code);
                  return (
                    <div
                      key={dept.code}
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
                            HOD: <span className="text-slate-200 font-medium">{dept.hod}</span> ({dept.matric})
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
                  );
                })}
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
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={16} className="text-cyan-400" />
                    <span>Staff &amp; Administrator Authority Directory</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">
                    Search staff members by Name, Staff ID, Email, Role, or Department. Add new staff and manage credentials.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff by Name, ID, Email..."
                      value={staffSearch}
                      onChange={(e) => {
                        setStaffSearch(e.target.value);
                        fetchStaff(e.target.value);
                      }}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#02050b] border border-cyan-800 text-xs text-white font-mono focus:outline-none w-64"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
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
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Plain Password</th>
                      <th className="py-2.5 px-3">30-Day Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {(staffList.length ? staffList : vaultData.staff || []).map(st => (
                      <tr key={st.id} className="hover:bg-slate-900/60 transition">
                        <td className="py-3 px-3 font-bold text-white">STAFF-{st.id}</td>
                        <td className="py-3 px-3 font-sans font-medium text-slate-100">{st.name}</td>
                        <td className="py-3 px-3 text-cyan-300 font-bold">{st.username || 'staff'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                            {st.role?.toUpperCase() || 'ADMIN'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-[11px]">{st.email}</td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{st.designation || 'Staff'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                            {st.plain_secret || 'admin123'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {st.is_locked ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                                <Lock size={10} /> {st.days_remaining}d Left
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetProfileLock(st.id, st.name)}
                                className="px-2 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-700 text-cyan-200 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Reset 30-Day Cooldown"
                              >
                                <Unlock size={10} /> Unlock
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 w-fit">
                              <Unlock size={10} /> Unlocked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {st.is_locked && (
                              <button
                                type="button"
                                onClick={() => handleResetProfileLock(st.id, st.name)}
                                className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-800 text-amber-200 transition cursor-pointer"
                                title="Lift 30-day profile freeze"
                              >
                                <Unlock size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(st.id, st.name)}
                              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                              title="Remove staff member"
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
            TAB: DIRECT BOOK INGESTION & CATALOGUING STUDIO (CONNECTED TO BACKEND)
        ============================================================== */}
        {activeTab === 'books' && (
          <DeveloperBookStudio passkey={DEV_CREDENTIALS.password} showToast={showToast} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {DEPARTMENTS.map((dept) => (
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
                      <div className="text-[11px] text-slate-300 font-medium truncate">{dept.hod}</div>
                      <div className="text-[9px] text-slate-500 truncate">{dept.name}</div>
                      <div className="pt-1 text-[10px] text-teal-400 font-bold flex items-center gap-1">
                        <span>Impersonate &rarr;</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
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
            TAB 3: THEME & BRAND STUDIO (WORDPRESS-STYLE CUSTOMIZER)
        ============================================================== */}
        {activeTab === 'theme' && (
          <div className="space-y-6 animate-fadeIn">
            {/* School Logo Uploader */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Upload size={16} className="text-cyan-400" />
                    <span>Upload Official School Logo / Crest</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Immediately updates the institutional logo across Student Login, Admin Console, QR Scanners, OPAC, and Mobile Apps.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/60 px-2.5 py-1 rounded-full">
                  INSTITUTIONAL BRANDING
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Logo Preview */}
                <div className="p-6 rounded-2xl bg-[#02050b] border-2 border-dashed border-cyan-500/60 text-center space-y-3">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-white p-2 shadow-2xl flex items-center justify-center border-2 border-cyan-400">
                    <img
                      src={logoPreview}
                      alt="FCC Crest Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-white">Live Institutional Crest</div>
                  <div className="text-[10px] text-cyan-400 font-mono">PNG, SVG, JPG, WebP</div>
                </div>

                {/* Upload Button */}
                <div className="space-y-3 md:col-span-2">
                  <div className="p-4 rounded-2xl bg-[#020915] border border-cyan-900/80 text-xs text-slate-300 space-y-2 font-sans">
                    <div className="font-bold text-white font-mono flex items-center gap-2">
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>One-Click Global Logo Propagation</span>
                    </div>
                    <p>
                      Uploading a new logo replaces all hardcoded assets in real time via our dynamic asset resolver and broadcasts an instant update event to all active workstations.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
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
                      className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>Choose New Logo File...</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        executeWithSecurityCheck('RESET OFFICIAL SCHOOL LOGO TO DEFAULT CREST', () => {
                          localStorage.removeItem('fcc_custom_logo');
                          setLogoPreview('/assets/fcc-logo.png');
                          window.dispatchEvent(new CustomEvent('fcc-logo-updated', { detail: '/assets/fcc-logo.png' }));
                          showToast('Reset school logo to official institutional crest.');
                        });
                      }}
                      className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold transition"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Theme Presets */}
            <section className="bg-[#07101f]/90 border border-cyan-800/60 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-cyan-900/60 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} className="text-cyan-400" />
                  <span>WordPress-Style Theme Presets</span>
                </h2>
                <p className="text-xs text-slate-400">
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

            {/* Custom Color Pickers & Brand Titles */}
            <section className="bg-[#07101f]/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-amber-400" />
                <span>Fine-Tuned Palette &amp; Institutional Context</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Institution Title
                  </label>
                  <input
                    type="text"
                    value={config.branding?.institutionName || ''}
                    onChange={(e) => handleBrandingChange('institutionName', e.target.value)}
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Short Name / Acronym
                  </label>
                  <input
                    type="text"
                    value={config.branding?.shortName || ''}
                    onChange={(e) => handleBrandingChange('shortName', e.target.value)}
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                    Institutional Motto / Slogan
                  </label>
                  <input
                    type="text"
                    value={config.branding?.slogan || ''}
                    onChange={(e) => handleBrandingChange('slogan', e.target.value)}
                    className="w-full bg-[#02050b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
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
                      <th className="py-2.5 px-3">Phone</th>
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
                            <div className="text-[10px] text-slate-400 font-mono">{p.email || 'scholar@fccibadan.edu.ng'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                              {p.barcode || p.library_id || p.id || 'FCC-STU-001'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">{p.dept || p.department || 'CSC'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/80 text-cyan-300 font-bold font-mono text-xs">
                              {p.pin || '1234'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">{p.phone || 'N/A'}</td>
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
                  {DEPARTMENTS.map(d => (
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
                    placeholder="1234"
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
                    value={editingStudent.department || editingStudent.dept || 'Computer Science'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-800 rounded-xl px-3.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-400"
                  >
                    {DEPARTMENTS.map(d => (
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

      {/* Global Institutional Master Footer */}
      <div className="relative z-10 w-full mt-8">
        <InstitutionalFooter />
      </div>
    </div>
  </div>
);
}
