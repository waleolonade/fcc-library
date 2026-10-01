import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, RefreshCw, Database, Globe, ShoppingBag, MapPin,
  BarChart3, FileText, LogOut, Sparkles, Layers, BookOpen,
  Award, Newspaper, Printer, Link2, Building2, FileUp, Key,
  Lock, ArrowRight, UserCheck, Search, Command, Activity, Bot,
  Users, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Zap, Bell, HelpCircle, Laptop, Cpu, ArrowUpRight,
  Scan, CheckSquare, Plus, Trash2, Download, AlertTriangle,
  Fingerprint, BookDown, BookUp, ShieldAlert, ShieldCheck, Eye, Copy, Check,
  ExternalLink, Share2, Filter, Upload, Sliders, CheckCheck, Tag, Barcode, QrCode, Settings, MessageSquare
} from 'lucide-react';
import { INSTITUTION, BRANCHES, INITIAL_BOOKS, INITIAL_LOANS, INITIAL_PARTNER_LIBRARIES } from '../data/institutionalSeedData';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import { navigateTo, parseCurrentRoute } from '../utils/router';
import { PATTERNS } from '../utils/backgroundPatterns';
import BiometricScannerModal from '../common/BiometricScannerModal';
import TraceBadge from '../common/TraceBadge';
import BarcodeCatalogScanner from './BarcodeCatalogScanner';
import HodSubmissionsReviewQueue from './HodSubmissionsReviewQueue';
import InstitutionalRbacPolicies from './InstitutionalRbacPolicies';
import FccCataloguingModule from './FccCataloguingModule';
import BarcodeQrStudio from '../common/BarcodeQrStudio';
import InstitutionalIntegrationsHub from './InstitutionalIntegrationsHub';
import ConfigurableLibrarySettings from './ConfigurableLibrarySettings';
import InstitutionalCommunicationHub from '../common/InstitutionalCommunicationHub';
import DepartmentManagement from './DepartmentManagement';
import { analyzeUploadedPdf } from '../utils/pdfDeepAnalyzer';
import PdfAnalysisInspector from '../common/PdfAnalysisInspector';
import { departmentService } from '../services/departmentService';

// =========================================================================
// FCC ADMIN LIBRARY — MASTER CONSOLIDATED ADMIN & STAFF OPERATIONS PLATFORM
// Powered by Laravel 11 Backend (PHP 8.2 & Eloquent ORM)
// Unified Architecture connecting directly with Scholar User Portal
// =========================================================================

const ADMIN_TAB_SLUG_MAP = {
  'overview': 'overview',
  'dashboard': 'overview',
  'circulation': 'circulation',
  'pdf-upload': 'pdf_upload',
  'pdf_upload': 'pdf_upload',
  'marc': 'marc',
  'research': 'research',
  'patrons': 'patrons',
  'shelves': 'shelves',
  'acquisitions': 'acquisitions',
  'partner-libraries': 'partner_libs',
  'partner_libs': 'partner_libs',
  'analytics': 'analytics',
  'audit': 'audit',
  'apis': 'apis',
  'library-apis': 'apis',
  'barcode-scanner': 'barcode_scanner',
  'barcode_scanner': 'barcode_scanner',
  'hod-submissions': 'hod_submissions',
  'hod_submissions': 'hod_submissions',
  'policies': 'policies',
  'integrations': 'integrations',
  'institutional-integrations': 'integrations',
  'barcode-qr': 'barcode_qr',
  'barcode_qr': 'barcode_qr',
  'barcode-studio': 'barcode_qr',
  'settings': 'settings',
  'library-settings': 'settings',
  'departments': 'departments',
  'department-management': 'departments',
  'academic-units': 'departments',
  'comms': 'comms',
  'communication': 'comms'
};

const resolveAdminTabSlug = (hashOrPath) => {
  if (!hashOrPath) return 'overview';
  const clean = hashOrPath.replace(/^#/, '');
  if (clean.includes('/admin/')) {
    const rawSub = clean.split('/admin/')[1]?.split('?')[0]?.split('/')[0] || '';
    return ADMIN_TAB_SLUG_MAP[rawSub] || rawSub || 'overview';
  }
  return 'overview';
};

export default function FccAdminLibrary({
  user: propUser,
  onLogout,
  books: propBooks,
  setBooks: propSetBooks,
  loans: propLoans,
  setLoans: propSetLoans,
  partnerLibraries: propPartnerLibs,
  setPartnerLibraries: propSetPartnerLibs,
  onOpenReader,
  onSwitchToUserPortal,
  onSwitchToHodPortal
}) {
  const user = propUser || {
    role: 'admin',
    matric: 'FCC/STAFF/001',
    name: 'Dr. Mrs. A. Balogun',
    dept: 'Chief College Librarian'
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Navigation tabs
  // 'overview' | 'circulation' | 'pdf_upload' | 'marc' | 'research' | 'patrons' | 'shelves' | 'acquisitions' | 'partner_libs' | 'analytics' | 'audit' | 'apis' | 'departments'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return resolveAdminTabSlug(window.location.hash);
    }
    return 'overview';
  });

  useEffect(() => {
    const handleHashSync = () => {
      const nextTab = resolveAdminTabSlug(window.location.hash);
      setActiveTab(prev => (prev !== nextTab ? nextTab : prev));
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const [selectedBranch, setSelectedBranch] = useState('All Libraries');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Laravel 11 Health Telemetry State
  const [laravelHealth, setLaravelHealth] = useState({
    status: 'Connecting...',
    framework: 'Laravel 11.57',
    latencyMs: 12,
    counts: { totalBooks: 0, activePatrons: 0, activeLoans: 0, theses: 0 }
  });

  // Local state fallbacks if standalone
  const [localBooks, setLocalBooks] = useState(() => {
    const s = localStorage.getItem('fcc_catalog_v48_gov');
    return s ? JSON.parse(s) : INITIAL_BOOKS;
  });
  const [localLoans, setLocalLoans] = useState(() => {
    const s = localStorage.getItem('fcc_loans_v48_gov');
    return s ? JSON.parse(s) : INITIAL_LOANS;
  });
  const [localPartnerLibs, setLocalPartnerLibs] = useState(() => {
    const s = localStorage.getItem('fcc_partner_libs_v48');
    return s ? JSON.parse(s) : INITIAL_PARTNER_LIBRARIES;
  });

  const books = propBooks || localBooks;
  const setBooks = propSetBooks || setLocalBooks;
  const loans = propLoans || localLoans;
  const setLoans = propSetLoans || setLocalLoans;
  const partnerLibraries = propPartnerLibs || localPartnerLibs;
  const setPartnerLibraries = propSetPartnerLibs || setLocalPartnerLibs;

  const [patrons, setPatrons] = useState([]);
  const [theses, setTheses] = useState([]);
  const [acquisitions, setAcquisitions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState(() => departmentService.getDepartments());
  const [departmentUploads, setDepartmentUploads] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleDeptSync = () => setDepartments(departmentService.getDepartments());
    window.addEventListener('fcc-departments-updated', handleDeptSync);
    return () => window.removeEventListener('fcc-departments-updated', handleDeptSync);
  }, []);


  // Patrons Management State
  const [patronFilterLevel, setPatronFilterLevel] = useState('all');
  const [showAddPatronModal, setShowAddPatronModal] = useState(false);
  const [newPatronForm, setNewPatronForm] = useState({
    name: '',
    matric: '',
    department: 'Co-operative Economics & Management',
    level: 'HND2',
    email: '',
    phone: ''
  });
  const [selectedPatronForCard, setSelectedPatronForCard] = useState(null);

  // Acquisitions Management State
  const [showAddAcquisitionModal, setShowAddAcquisitionModal] = useState(false);
  const [newAcqForm, setNewAcqForm] = useState({
    title: '',
    author: '',
    department: 'Co-operative Economics & Management',
    requester: 'HOD',
    cost: '₦50,000',
    justification: 'Required for HND II Research accreditation'
  });

  // Global Library APIs State
  const [libraryApis, setLibraryApis] = useState([]);
  const [activeApiSearchTerm, setActiveApiSearchTerm] = useState('cooperative economics');
  const [selectedApiForSearch, setSelectedApiForSearch] = useState('all');
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [isSearchingApis, setIsSearchingApis] = useState(false);
  const [apiTestResults, setApiTestResults] = useState({});
  const [isTestingApi, setIsTestingApi] = useState({});
  const [showAddApiModal, setShowAddApiModal] = useState(false);
  const [newApiForm, setNewApiForm] = useState({
    name: '',
    provider: '',
    category: 'Books & Monograph Discovery',
    endpoint_template: '',
    auth_type: 'Free Open Access',
    api_key: '',
    description: '',
    docs_url: ''
  });
  const [isAddingApi, setIsAddingApi] = useState(false);

  // Test live connection to a library API
  const testApiConnection = async (apiId) => {
    setIsTestingApi(prev => ({ ...prev, [apiId]: true }));
    try {
      const res = await fetch(`/api/library-apis/${apiId}/test`);
      const data = await res.json();
      setApiTestResults(prev => ({ ...prev, [apiId]: data }));
      if (soundEnabled) sounds.playSuccessChime();
    } catch (e) {
      setApiTestResults(prev => ({ ...prev, [apiId]: { status: 'Error', message: e.message } }));
      if (soundEnabled) sounds.playErrorBuzz();
    } finally {
      setIsTestingApi(prev => ({ ...prev, [apiId]: false }));
    }
  };

  // Federated search across global APIs
  const performFederatedSearch = async (e) => {
    if (e) e.preventDefault();
    if (!activeApiSearchTerm.trim()) return;
    setIsSearchingApis(true);
    if (soundEnabled) sounds.playScannerBeep();
    try {
      const queryParam = encodeURIComponent(activeApiSearchTerm.trim());
      const apiParam = selectedApiForSearch;
      const res = await fetch(`/api/library-apis/search?query=${queryParam}&api_id=${apiParam}`);
      if (res.ok) {
        const data = await res.json();
        setApiSearchResults(data || []);
        if (soundEnabled) sounds.playSuccessChime();
      }
    } catch (e) {
      console.error('Federated search error:', e);
    } finally {
      setIsSearchingApis(false);
    }
  };

  // Add new external library API
  const handleAddApiSubmit = async (e) => {
    e.preventDefault();
    if (!newApiForm.name || !newApiForm.endpoint_template) {
      alert('API Name and Endpoint URL Template are mandatory.');
      return;
    }
    setIsAddingApi(true);
    try {
      const res = await fetch('/api/library-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiForm)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.api) {
          setLibraryApis(prev => [data.api, ...prev]);
        }
        setShowAddApiModal(false);
        setNewApiForm({
          name: '',
          provider: '',
          category: 'Books & Monograph Discovery',
          endpoint_template: '',
          auth_type: 'Free Open Access',
          api_key: '',
          description: '',
          docs_url: ''
        });
        if (soundEnabled) sounds.playSuccessChime();
        alert(`Successfully registered "${newApiForm.name}" into the FCC Global Library Ecosystem!`);
      } else {
        const err = await res.json();
        alert(`Failed to add API: ${err.message || 'Validation error'}`);
      }
    } catch (e) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsAddingApi(false);
    }
  };

  // Delete custom library API
  const handleDeleteApi = async (apiId) => {
    if (!window.confirm('Are you sure you want to remove this library API integration?')) return;
    try {
      const res = await fetch(`/api/library-apis/${apiId}`, { method: 'DELETE' });
      if (res.ok) {
        setLibraryApis(prev => prev.filter(a => a.id !== apiId));
        if (soundEnabled) sounds.playSuccessChime();
      }
    } catch (e) {
      console.error('Delete API error:', e);
    }
  };

  // Ingest book from Global API directly into FCC catalog
  const handleIngestApiBook = async (item) => {
    const fullBook = {
      id: `FCC-B00${books.length + 1}`,
      title: item.title,
      author: item.author,
      isbn: item.isbn || `978-978-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      subject: item.subject || 'World Library Ingestion',
      department: 'General Studies & Reference',
      callNumber: `WL.${Math.floor(100 + Math.random() * 899)} .${(item.title || 'GEN').substring(0, 3).toUpperCase()} 2026`,
      shelfLocation: 'Digital World Library Node • Cloud Stacks',
      year: item.year || new Date().getFullYear(),
      isDigital: true,
      format: item.format || 'Digital E-Book',
      externalUrl: item.externalUrl || '',
      abstract: item.abstract || `Harvested from global academic provider (${item.sourceApi}). Ingested for FCC scholars.`,
      copiesTotal: 10,
      copiesAvailable: 10,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Chief Librarian'
    };

    try {
      await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullBook)
      });
      setBooks([fullBook, ...books]);
      localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify([fullBook, ...books]));
      if (soundEnabled) sounds.playSuccessChime();
      alert(`Ingested "${fullBook.title}" from ${item.sourceApi} into FCC Central Catalog!`);
    } catch (e) {
      setBooks([fullBook, ...books]);
      alert(`Locally ingested "${fullBook.title}" into catalog!`);
    }
  };


  // Tab switching handler that mirrors navigation to hash route

  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    const pathSlug = tabId === 'partner_libs' ? 'partner-libraries' 
      : tabId === 'pdf_upload' ? 'pdf-upload' 
      : tabId === 'barcode_qr' ? 'barcode-qr'
      : tabId === 'barcode_scanner' ? 'barcode-scanner'
      : tabId === 'hod_submissions' ? 'hod-submissions'
      : tabId === 'settings' ? 'settings'
      : tabId === 'departments' ? 'departments'
      : tabId;
    navigateTo(`/admin/${pathSlug}`);
  };

  // Fetch telemetry & data from Laravel 11 Backend
  const refreshFromLaravel = async () => {
    setIsRefreshing(true);
    const startTime = performance.now();
    try {
      const [healthRes, catRes, patRes, loanRes, thRes, acqRes, logRes, apiRes, shelfRes, analyticRes, partnerRes] = await Promise.allSettled([
        fetch('/api/health').then(r => r.ok ? r.json() : null),
        fetch('/api/catalog').then(r => r.ok ? r.json() : null),
        fetch('/api/patrons').then(r => r.ok ? r.json() : null),
        fetch('/api/loans').then(r => r.ok ? r.json() : null),
        fetch('/api/theses').then(r => r.ok ? r.json() : null),
        fetch('/api/acquisitions').then(r => r.ok ? r.json() : null),
        fetch('/api/audit-logs').then(r => r.ok ? r.json() : null),
        fetch('/api/library-apis').then(r => r.ok ? r.json() : null),
        fetch('/api/shelves').then(r => r.ok ? r.json() : null),
        fetch('/api/analytics').then(r => r.ok ? r.json() : null),
        fetch('/api/partner-libraries').then(r => r.ok ? r.json() : null)
      ]);

      const roundTripMs = Math.round(performance.now() - startTime);

      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setLaravelHealth({ ...healthRes.value, latencyMs: roundTripMs });
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
        setBooks(catRes.value);
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(catRes.value));
      }

      if (patRes.status === 'fulfilled' && Array.isArray(patRes.value)) {
        setPatrons(patRes.value);
      }

      if (loanRes.status === 'fulfilled' && Array.isArray(loanRes.value)) {
        setLoans(loanRes.value);
        localStorage.setItem('fcc_loans_v48_gov', JSON.stringify(loanRes.value));
      }

      if (thRes.status === 'fulfilled' && Array.isArray(thRes.value)) {
        setTheses(thRes.value);
      }

      if (acqRes.status === 'fulfilled' && Array.isArray(acqRes.value)) {
        setAcquisitions(acqRes.value);
      }

      if (logRes.status === 'fulfilled' && Array.isArray(logRes.value)) {
        setAuditLogs(logRes.value);
      }

      if (apiRes.status === 'fulfilled' && Array.isArray(apiRes.value)) {
        setLibraryApis(apiRes.value);
      }

      if (shelfRes.status === 'fulfilled' && Array.isArray(shelfRes.value)) {
        setShelves(shelfRes.value);
      }

      if (analyticRes.status === 'fulfilled' && analyticRes.value && !analyticRes.value.error) {
        setAnalyticsData(analyticRes.value);
      }

      if (partnerRes.status === 'fulfilled' && Array.isArray(partnerRes.value)) {
        setLocalPartnerLibs(partnerRes.value);
        localStorage.setItem('fcc_partner_libs_v48', JSON.stringify(partnerRes.value));
      }

      if (soundEnabled) sounds.playSuccessChime();
    } catch (e) {
      console.warn('Laravel fetch warning (falling back to cached state):', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshFromLaravel();
    const interval = setInterval(() => {
      fetch('/api/health')
        .then(r => r.json())
        .then(data => {
          if (data && data.status) {
            setLaravelHealth(prev => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchBranch = selectedBranch === 'All Libraries' || (b.branch && b.branch.toLowerCase().includes(selectedBranch.toLowerCase()));
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.includes(q)) ||
        (b.callNumber && b.callNumber.toLowerCase().includes(q));
      return matchBranch && matchQuery;
    });
  }, [books, selectedBranch, searchQuery]);

  // Connect to Scholar User Portal
  const goToUserPortal = () => {
    if (onSwitchToUserPortal) {
      onSwitchToUserPortal();
    } else {
      navigateTo('/scholar/catalog');
    }
  };

  // -------------------------------------------------------------
  // CIRCULATION STATE & ACTIONS
  // -------------------------------------------------------------
  const [circMode, setCircMode] = useState('checkout'); // 'checkout' | 'checkin'
  const [circMatric, setCircMatric] = useState('FCC/CEM/2024/042');
  const [circItem, setCircItem] = useState('FCC-B001');
  const [circStatus, setCircStatus] = useState(null);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (soundEnabled) sounds.playScannerBeep();

    const barcodeTrimmed = circItem.trim().toUpperCase();
    const matricTrimmed = circMatric.trim().toUpperCase();

    const book = books.find(b =>
      b.id.toUpperCase() === barcodeTrimmed ||
      (b.isbn && b.isbn.toUpperCase() === barcodeTrimmed) ||
      (b.callNumber && b.callNumber.toUpperCase().includes(barcodeTrimmed))
    );

    if (!book) {
      if (soundEnabled) sounds.playErrorBuzz();
      setCircStatus({ type: 'error', text: `Accession or ISBN "${circItem}" not found in institutional catalog.` });
      return;
    }

    if (book.copiesAvailable <= 0) {
      if (soundEnabled) sounds.playErrorBuzz();
      setCircStatus({ type: 'error', text: `Holdings exhausted: All physical copies of "${book.title}" are currently checked out.` });
      return;
    }

    setPendingCheckout({ book, matricTrimmed });
    setShowBiometrics(true);
  };

  const confirmCheckoutBiometrics = async () => {
    if (!pendingCheckout) return;
    const { book, matricTrimmed } = pendingCheckout;

    // Send to Laravel API
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matric: matricTrimmed,
          bookId: book.id,
          patronName: matricTrimmed.includes('042') ? 'Wale Olonade' : matricTrimmed.includes('CEM') ? 'Ibrahim Adekunle' : 'Patron Scholar'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.loan) {
          setLoans([data.loan, ...loans]);
        }
      }
    } catch (e) {
      // Local fallback
      const newLoan = {
        id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
        matric: matricTrimmed,
        patronName: matricTrimmed.includes('042') ? 'Wale Olonade' : 'Patron Scholar',
        bookId: book.id,
        bookTitle: book.title,
        callNumber: book.callNumber,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'Active',
        fine: 0,
        renewalsCount: 0
      };
      setLoans([newLoan, ...loans]);
    }

    setBooks(books.map(b => b.id === book.id ? { ...b, copiesAvailable: Math.max(0, b.copiesAvailable - 1) } : b));
    if (soundEnabled) sounds.playSuccessChime();
    setCircStatus({ type: 'success', text: `Biometric Identity Verified: Checked out "${book.title}" to ${matricTrimmed}. 14-day circulation active.` });
    setShowBiometrics(false);
    setPendingCheckout(null);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (soundEnabled) sounds.playScannerBeep();

    const barcodeTrimmed = circItem.trim().toUpperCase();
    const loanIndex = loans.findIndex(l =>
      (l.bookId === barcodeTrimmed || l.id === barcodeTrimmed || (l.barcode && l.barcode === barcodeTrimmed)) &&
      l.status !== 'Returned'
    );

    if (loanIndex === -1) {
      if (soundEnabled) sounds.playErrorBuzz();
      setCircStatus({ type: 'error', text: `No active circulation record found for item ref "${circItem}".` });
      return;
    }

    const loan = loans[loanIndex];

    try {
      await fetch(`/api/loans/${encodeURIComponent(loan.id)}/return`, { method: 'POST' });
    } catch (e) {}

    const updatedLoans = [...loans];
    updatedLoans[loanIndex] = {
      ...loan,
      status: 'Returned',
      returnDate: new Date().toISOString().split('T')[0]
    };
    setLoans(updatedLoans);

    setBooks(books.map(b => b.id === loan.bookId ? { ...b, copiesAvailable: b.copiesAvailable + 1 } : b));
    if (soundEnabled) sounds.playSuccessChime();
    setCircStatus({ type: 'success', text: `Return Verified: Book "${loan.bookTitle}" checked back into stacks.` });
  };

  const handleRenewLoan = async (loanId) => {
    try {
      await fetch(`/api/loans/${encodeURIComponent(loanId)}/renew`, { method: 'POST' });
    } catch (e) {}

    const updated = loans.map(l => {
      if (l.id === loanId) {
        const curDue = new Date(l.dueDate);
        curDue.setDate(curDue.getDate() + 14);
        return {
          ...l,
          dueDate: curDue.toISOString().split('T')[0],
          renewalsCount: (l.renewalsCount || 0) + 1
        };
      }
      return l;
    });
    setLoans(updated);
    if (soundEnabled) sounds.playSuccessChime();
    setCircStatus({ type: 'success', text: `14-Day Extension granted for loan record #${loanId}.` });
  };

  // -------------------------------------------------------------
  // PDF UPLOAD & SMART INGESTION STATE
  // -------------------------------------------------------------
  const [pdfUploadFile, setPdfUploadFile] = useState(null);
  const [isAnalyzingAdminPdf, setIsAnalyzingAdminPdf] = useState(false);
  const [adminPdfProgress, setAdminPdfProgress] = useState(0);
  const [adminPdfResult, setAdminPdfResult] = useState(null);
  const [pdfForm, setPdfForm] = useState({
    title: '',
    author: '',
    isbn: '',
    doi: '',
    subject: 'Co-operative Economics & Management',
    department: 'Co-operative Economics & Management',
    callNumber: 'HD2963 .F33 2026',
    shelfLocation: 'Floor 2 • Aisle 4 • Shelf 12B',
    copiesTotal: 5,
    pdfPages: 142,
    abstract: '',
    keywords: 'Cooperatives, Finance, Agronomy',
    referenceStyle: 'APA 7th'
  });
  const [pdfDuplicateCheck, setPdfDuplicateCheck] = useState(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);

  const checkDuplicateWithLaravel = async (title, isbn, doi, fileName) => {
    setIsCheckingDuplicate(true);
    try {
      const res = await fetch('/api/catalog/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, isbn, doi, fileName })
      });
      if (res.ok) {
        const result = await res.json();
        setPdfDuplicateCheck(result);
      }
    } catch (e) {
      console.warn('Duplicate check offline:', e);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handlePdfFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploadFile(file);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
      setIsAnalyzingAdminPdf(true);
      setAdminPdfProgress(25);
      if (soundEnabled) sounds.playScannerBeep();

      try {
        const progressTimer = setInterval(() => {
          setAdminPdfProgress(p => (p < 85 ? p + 20 : p));
        }, 120);

        const analysis = await analyzeUploadedPdf(file, {
          defaultDeptCode: 'CEM'
        });

        clearInterval(progressTimer);
        setAdminPdfProgress(100);
        setAdminPdfResult(analysis);

        if (analysis.success && analysis.extracted) {
          const ext = analysis.extracted;
          setPdfForm(prev => ({
            ...prev,
            title: ext.title || prev.title,
            author: ext.author || prev.author,
            isbn: ext.isbn || prev.isbn,
            subject: ext.department || prev.subject,
            department: ext.department || prev.department,
            callNumber: ext.callNumber || prev.callNumber,
            shelfLocation: ext.shelfLocation || prev.shelfLocation,
            copiesTotal: ext.copiesTotal || prev.copiesTotal,
            pdfPages: analysis.fileMeta.pageCount || prev.pdfPages,
            abstract: ext.abstract || prev.abstract,
            keywords: ext.keywords || prev.keywords,
            referenceStyle: ext.referenceStyle || prev.referenceStyle,
            fileName: file.name,
            fileSize: analysis.fileMeta.fileSize
          }));

          checkDuplicateWithLaravel(ext.title, ext.isbn, '', file.name);
          if (soundEnabled) sounds.playSuccessChime();
        }
      } catch (err) {
        console.error('Admin PDF analysis error:', err);
      } finally {
        setTimeout(() => setIsAnalyzingAdminPdf(false), 400);
      }
    } else {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const autoTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setPdfForm(prev => ({
        ...prev,
        title: prev.title || autoTitle,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      checkDuplicateWithLaravel(autoTitle, '', '', file.name);
    }
  };

  const handleReAnalyzeAdminPdf = () => {
    if (pdfUploadFile) {
      handlePdfFileSelect({ target: { files: [pdfUploadFile] } });
    }
  };

  const handleResetAdminPdf = () => {
    setAdminPdfResult(null);
  };

  const handleCatalogCommit = async (e) => {
    e.preventDefault();
    if (!pdfForm.title || !pdfForm.author) {
      alert('Title and Author are mandatory for institutional cataloguing.');
      return;
    }

    setIsSubmittingBook(true);
    const newBookPayload = {
      id: `FCC-B00${books.length + 1}`,
      title: pdfForm.title,
      author: pdfForm.author,
      isbn: pdfForm.isbn || `978-978-8120-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1 + Math.random() * 9)}`,
      doi: pdfForm.doi || `10.1016/j.fcc.${Math.floor(1000 + Math.random() * 9000)}`,
      subject: pdfForm.subject,
      department: pdfForm.department,
      callNumber: pdfForm.callNumber,
      shelfLocation: pdfForm.shelfLocation,
      copiesTotal: parseInt(pdfForm.copiesTotal, 10) || 3,
      copiesAvailable: parseInt(pdfForm.copiesTotal, 10) || 3,
      pdfPages: parseInt(pdfForm.pdfPages, 10) || 120,
      fileSize: pdfForm.fileSize || '3.5 MB',
      fileName: pdfForm.fileName || 'monograph.pdf',
      isDigital: true,
      format: 'E-Book',
      abstract: pdfForm.abstract || 'Curriculum research monograph archived in Federal Co-operative College Institutional Repository.',
      keywords: pdfForm.keywords.split(',').map(k => k.trim()),
      referenceStyle: pdfForm.referenceStyle,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Chief Librarian'
    };

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setBooks([newBookPayload, ...books]);
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify([newBookPayload, ...books]));
        if (soundEnabled) sounds.playSuccessChime();
        alert(`Ingested "${newBookPayload.title}" into Central MARC 21 Catalog & Laravel 11 Database!`);
        // Reset form
        setPdfUploadFile(null);
        setPdfDuplicateCheck(null);
      }
    } catch (e) {
      // Local fallback
      setBooks([newBookPayload, ...books]);
      alert(`Locally ingested "${newBookPayload.title}" into Catalog!`);
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // -------------------------------------------------------------
  // MARC 21 CATALOGUER STATE
  // -------------------------------------------------------------
  const [marcForm, setMarcForm] = useState({
    leader: '00000cam a2200000Ia 4500',
    tag008: '240930s2026    ng a     b    000 0 eng d',
    tag020: '978-978-49021-1-4',
    tag050: 'HD2963 .A34 2026',
    tag100: 'Adebayo, A. O., author.',
    tag245: 'Principles and Practice of Co-operative Economics / Prof. A. O. Adebayo.',
    tag260: 'Ibadan : FCC Ibadan Academic Press, 2026.',
    tag300: 'xxx, 384 pages : illustrations ; 24 cm',
    tag520: 'Covers empirical credit unions, apex cooperatives, and fiscal compliance in West Africa.',
    tag650: 'Cooperative societies -- Management -- Nigeria.'
  });

  const generateMrcBlob = () => {
    const rawMarc = `=LDR  ${marcForm.leader}\n=008  ${marcForm.tag008}\n=020  \\\\$a${marcForm.tag020}\n=050  00$a${marcForm.tag050}\n=100  1\\$a${marcForm.tag100}\n=245  10$a${marcForm.tag245}\n=260  \\\\$a${marcForm.tag260}\n=300  \\\\$a${marcForm.tag300}\n=520  \\\\$a${marcForm.tag520}\n=650  \\0$a${marcForm.tag650}\n`;
    const blob = new Blob([rawMarc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FCC_MARC21_${Date.now()}.mrc`;
    a.click();
    URL.revokeObjectURL(url);
    if (soundEnabled) sounds.playSuccessChime();
  };

  // -------------------------------------------------------------
  // RESEARCH INGESTION STATE (Crossref / OpenAlex)
  // -------------------------------------------------------------
  const [researchQuery, setResearchQuery] = useState('cooperative agriculture nigeria');
  const [researchResults, setResearchResults] = useState([]);
  const [isResearching, setIsResearching] = useState(false);

  const handleResearchQuery = async (e) => {
    if (e) e.preventDefault();
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    try {
      // Query OpenAlex API directly (free, no key needed)
      const q = encodeURIComponent(researchQuery.trim());
      const res = await fetch(`https://api.openalex.org/works?search=${q}&per-page=8&filter=is_oa:true`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.results || []).map(w => ({
          doi: w.doi?.replace('https://doi.org/', '') || w.id,
          title: w.title || 'Untitled Work',
          author: w.authorships?.[0]?.author?.display_name || 'Unknown Author',
          journal: w.primary_location?.source?.display_name || 'Open Access Repository',
          year: w.publication_year || new Date().getFullYear(),
          citations: w.cited_by_count || 0,
          openAlexUrl: w.id,
          pdfUrl: w.open_access?.oa_url || ''
        }));
        setResearchResults(mapped);
        if (soundEnabled) sounds.playSuccessChime();
      }
    } catch (err) {
      console.error('OpenAlex fetch error:', err);
    } finally {
      setIsResearching(false);
    }
  };

  const handleIngestResearchItem = (item) => {
    const fullBook = {
      id: `FCC-B00${books.length + 1}`,
      title: item.title,
      author: item.author,
      doi: item.doi,
      subject: 'Agricultural Extension & Economics',
      department: 'Co-operative Economics & Management',
      callNumber: `S560 .${item.title.substring(0, 3).toUpperCase()} 2025`,
      shelfLocation: 'Floor 3 • Aisle 2 • Shelf 04',
      year: item.year,
      isDigital: true,
      format: 'Scholarly Article',
      copiesTotal: 10,
      copiesAvailable: 10,
      abstract: `Ingested peer-reviewed literature published in ${item.journal}.`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Chief Librarian'
    };
    setBooks([fullBook, ...books]);
    if (soundEnabled) sounds.playSuccessChime();
    alert(`Successfully ingested scholarly paper "${item.title}" into Central MARC 21 Catalog!`);
  };

  // -------------------------------------------------------------
  // SHELF AUDIT STATE
  // -------------------------------------------------------------
  const [activeFloor, setActiveFloor] = useState(1);
  const [isRfidScanning, setIsRfidScanning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);

  const startShelfAudit = () => {
    setIsRfidScanning(true);
    setAuditProgress(0);
    if (soundEnabled) sounds.playScannerBeep();
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setAuditProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsRfidScanning(false);
        if (soundEnabled) sounds.playSuccessChime();
      }
    }, 400);
  };

  // Active Loans stats
  const activeLoansCount = loans.filter(l => l.status === 'Active').length;
  const overdueLoansCount = loans.filter(l => l.status === 'Overdue').length;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#021810] text-emerald-100 font-sans selection:bg-emerald-500 selection:text-white"
      style={{ backgroundImage: PATTERNS.adminPanel }}
    >
      {/* =========================================================================
          TOP COMMAND & LARAVEL 11 STATUS BAR (GREEN THEME)
      ========================================================================= */}
      <header className="bg-[#032317]/95 backdrop-blur-md border-b border-emerald-800/80 sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Menu Toggle + Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 transition flex items-center gap-1.5"
              title={sidebarOpen ? "Hide Admin Sidebar" : "Show Admin Sidebar"}
            >
              <Menu size={18} />
              <span className="text-xs font-semibold hidden sm:inline">Menu</span>
            </button>

            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/fcc-logo.png"
                alt="Federal Co-operative College Crest"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight">FCC Admin Library</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Staff ILS & Ingestion
                </span>
              </div>
              <div className="text-[11px] text-emerald-300/70 flex items-center gap-2">
                <span>{INSTITUTION.name}</span>
                <span className="text-emerald-700">•</span>
                <span className="text-emerald-400 font-medium">Librarian Operations Console</span>
              </div>
            </div>
          </div>

          {/* Center: Laravel 11 Live Engine Telemetry Pill */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#021810]/80 border border-emerald-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-emerald-400 font-mono">Laravel 11.57 API</span>
            </div>
            <span className="text-emerald-800">|</span>
            <span className="text-emerald-200 font-mono text-[11px]">{laravelHealth.latencyMs}ms ping</span>
            <span className="text-emerald-800">|</span>
            <span className="text-emerald-300/80 text-[11px]">
              <span className="text-white font-bold">{books.length}</span> holdings • <span className="text-emerald-400 font-bold">{activeLoansCount}</span> loans
            </span>
          </div>

          {/* Right: User Portal Bridge & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Direct Bridge to Scholar User Portal */}
            <button
              onClick={goToUserPortal}
              id="switch-to-scholar-portal-btn"
              title="Connect to Scholar User Portal (Student View)"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-950 hover:scale-105 active:scale-95"
            >
              <BookOpen size={14} className="text-emerald-400" />
              <span>Scholar User Portal</span>
              <ArrowUpRight size={13} className="text-emerald-400" />
            </button>

            {/* Reload from Laravel */}
            <button
              onClick={refreshFromLaravel}
              disabled={isRefreshing}
              title="Synchronize with Laravel 11 Backend"
              className={`p-2 rounded-lg bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 transition ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`}
            >
              <RefreshCw size={15} />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute operational audio' : 'Enable operational audio'}
              className="p-2 rounded-lg bg-[#021810] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 transition"
            >
              <Zap size={15} className={soundEnabled ? 'text-amber-400' : 'text-emerald-700'} />
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition text-xs font-medium flex items-center gap-1"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Operational Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-3 pb-0.5 no-scrollbar border-t border-emerald-800/60 mt-2.5">
          {[
            { id: 'overview', label: 'Operational Overview', icon: Activity },
            { id: 'circulation', label: 'Circulation Desk', icon: Scan, badge: activeLoansCount },
            { id: 'departments', label: 'Departments & HODs', icon: Building2, badge: 'Units' },
            { id: 'hod_submissions', label: 'HOD Staging Queue', icon: Layers, badge: 'Staging' },
            { id: 'barcode_scanner', label: 'ISBN & Barcode Ingest', icon: Barcode, badge: 'Auto' },
            { id: 'pdf_upload', label: 'PDF Ingestion & AI', icon: FileUp, badge: 'Smart' },
            { id: 'marc', label: 'Cataloguing & MARC 21', icon: Tag, badge: 'LoC 42' },
            { id: 'policies', label: 'RBAC & Policies', icon: ShieldCheck, badge: 'Tiers' },
            { id: 'integrations', label: 'SIS & Integrations', icon: Link2, badge: 'Module 6' },
            { id: 'barcode_qr', label: 'Barcode & QR Studio', icon: QrCode, badge: 'Module 7' },
            { id: 'research', label: 'Research Ingestion', icon: Globe },
            { id: 'patrons', label: 'Patron Scholars', icon: Users, badge: patrons.length || '4' },
            { id: 'shelves', label: 'Shelf Audit & Map', icon: MapPin },
            { id: 'acquisitions', label: 'Acquisitions & Serials', icon: ShoppingBag },
            { id: 'partner_libs', label: 'Consortia Network', icon: Building2 },
            { id: 'apis', label: 'World Library APIs', icon: Globe, badge: libraryApis.length || '10' },
            { id: 'analytics', label: 'BI & Accreditation', icon: BarChart3 },
            { id: 'audit', label: 'Laravel Telemetry & Logs', icon: Database },
            { id: 'settings', label: 'Library Settings & Policies', icon: Settings, badge: 'Module 49' },
            { id: 'comms', label: 'Tri-Party Dispatch Hub', icon: MessageSquare, badge: 'Live' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 font-semibold'
                    : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-400'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-[#021810] text-emerald-300 border border-emerald-800/60'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* =========================================================================
          BODY LAYOUT: SIDEBAR + MAIN WORKSPACE
      ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Admin Navigation Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-emerald-800/80 bg-[#032317]/95 backdrop-blur-md flex flex-col justify-between shrink-0 h-[calc(100vh-62px)] sticky top-[62px] overflow-y-auto p-3 space-y-4 animate-fadeIn">
            <div className="space-y-4">
              {/* Institution Identity Card */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#021810] border border-emerald-800/80 shadow-md">
                <img
                  src="/assets/fcc-logo.png"
                  alt="FCC Crest"
                  className="w-10 h-10 object-cover rounded-xl shadow ring-1 ring-emerald-500/40 shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white leading-tight truncate">Central Administration</div>
                  <div className="text-[10px] text-emerald-400 font-mono">STAFF ILS & INGESTION</div>
                </div>
              </div>

              {/* Sidebar Sections */}
              {[
                {
                  title: 'OPERATIONS & CIRCULATION',
                  items: [
                    { id: 'overview', label: 'Operational Overview', icon: Activity },
                    { id: 'circulation', label: 'Circulation & RFID Desk', icon: Scan, badge: activeLoansCount },
                    { id: 'barcode_scanner', label: 'ISBN & Barcode Ingest', icon: Barcode }
                  ]
                },
                {
                  title: 'CATALOGUING & INGESTION',
                  items: [
                    { id: 'marc', label: 'Cataloguing & MARC 21', icon: Tag },
                    { id: 'pdf_upload', label: 'PDF Smart Ingest & AI', icon: FileUp, badge: 'Smart' },
                    { id: 'hod_submissions', label: 'HOD Staging Queue', icon: Layers, badge: 'Review' },
                    { id: 'shelves', label: 'Shelf Stacks & Map', icon: MapPin }
                  ]
                },
                {
                  title: 'ACADEMIC & DEPARTMENTS',
                  items: [
                    { id: 'departments', label: 'Departments & HODs', icon: Building2, badge: 'Units' },
                    { id: 'research', label: 'Theses & Dissertations', icon: Globe },
                    { id: 'acquisitions', label: 'Acquisitions & Serials', icon: ShoppingBag }
                  ]
                },
                {
                  title: 'PATRONS & POLICIES',
                  items: [
                    { id: 'patrons', label: 'Patron Scholars & Staff', icon: Users, badge: patrons.length || '4' },
                    { id: 'policies', label: 'RBAC & Loan Rules', icon: ShieldCheck },
                    { id: 'barcode_qr', label: 'Barcode & QR Studio', icon: QrCode }
                  ]
                },
                {
                  title: 'INTELLIGENCE & SETTINGS',
                  items: [
                    { id: 'partner_libs', label: 'Consortia Network', icon: Building2 },
                    { id: 'analytics', label: 'Analytics & KPI Reports', icon: BarChart3 },
                    { id: 'audit', label: 'System Audit Logs', icon: Database },
                    { id: 'apis', label: 'World Library APIs', icon: Globe },
                    { id: 'settings', label: 'Configurable Settings', icon: Settings },
                    { id: 'comms', label: 'Tri-Party Dispatch Hub', icon: MessageSquare }
                  ]
                }
              ].map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                    {sec.title}
                  </div>
                  {sec.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabSwitch(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60 font-bold'
                            : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={15} className={isActive ? 'text-white' : 'text-emerald-400'} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                            isActive ? 'bg-emerald-800 text-white' : 'bg-[#021810] text-emerald-400 border border-emerald-800/60'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bottom Admin Status Card */}
            <div className="p-3 rounded-2xl bg-[#021810] border border-emerald-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400">CHIEF LIBRARIAN</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-emerald-400/70 font-mono">{user.dept || 'College Library'}</div>
            </div>
          </aside>
        )}

        {/* Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* -------------------------------------------------------------
            TAB 1: OPERATIONAL OVERVIEW DASHBOARD
        ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Holdings</div>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><BookOpen size={18} /></div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{books.length}</div>
                <div className="mt-1 text-xs text-indigo-400 font-mono flex items-center gap-1">
                  <span>Physical & E-Books</span> • <span>94% catalogued</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Loans</div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Scan size={18} /></div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white">{activeLoansCount}</div>
                <div className="mt-1 text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span>14-day standard circulation</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Alerts</div>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><AlertTriangle size={18} /></div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-rose-400">{overdueLoansCount}</div>
                <div className="mt-1 text-xs text-rose-400/80 font-mono">₦50.00/day fine accrual</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laravel Telemetry</div>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><Activity size={18} /></div>
                </div>
                <div className="mt-3 text-3xl font-extrabold text-amber-400">{laravelHealth.latencyMs}ms</div>
                <div className="mt-1 text-xs text-slate-400 font-mono">SQLite & Eloquent connected</div>
              </div>
            </div>

            {/* Quick Action Station & Live Circulation Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Activity & Recent Loans */}
              <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Live Circulation & Holding Velocity</h3>
                    <p className="text-xs text-slate-400">Current patron borrowings synchronized with central database</p>
                  </div>
                  <button
                    onClick={() => handleTabSwitch('circulation')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5"
                  >
                    <span>Launch Rapid Desk</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="py-2.5 px-3">Loan ID</th>
                        <th className="py-2.5 px-3">Patron Scholar</th>
                        <th className="py-2.5 px-3">Item Title</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {loans.slice(0, 5).map(loan => (
                        <tr key={loan.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-indigo-400">{loan.id}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{loan.patronName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loan.matric}</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-200 max-w-[220px] truncate">
                            {loan.bookTitle}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">{loan.dueDate}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              loan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              loan.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {loan.status !== 'Returned' && (
                              <button
                                onClick={() => handleRenewLoan(loan.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition"
                              >
                                +14 Days
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Col: Quick Ingestion & Cross-Portal Hub */}
              <div className="space-y-4">
                {/* Scholar Portal Live Link Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-emerald-950/40 border border-indigo-500/30 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Sparkles size={18} />
                    <h4 className="text-sm font-bold text-white">Unified Scholar & Admin Connection</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This admin hub is connected live with the <span className="text-emerald-400 font-semibold">Scholar User Portal</span>. Any monograph uploaded, loan issued, or fine updated here syncs instantly to student scholar accounts.
                  </p>
                  <button
                    onClick={goToUserPortal}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen size={15} />
                    <span>View Library as Scholar (User Portal)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Quick Cataloging Shortcuts */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fast Ingestion Shortcuts</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleTabSwitch('pdf_upload')}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-slate-700 text-left transition flex flex-col gap-1"
                    >
                      <FileUp size={16} className="text-indigo-400" />
                      <span className="font-semibold text-white">Upload PDF</span>
                      <span className="text-[10px] text-slate-400">Auto duplicate check</span>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('marc')}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 text-left transition flex flex-col gap-1"
                    >
                      <Tag size={16} className="text-emerald-400" />
                      <span className="font-semibold text-white">MARC 21</span>
                      <span className="text-[10px] text-slate-400">Tag 020/050/245</span>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('research')}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-amber-600/20 hover:border-amber-500/40 border border-slate-700 text-left transition flex flex-col gap-1"
                    >
                      <Globe size={16} className="text-amber-400" />
                      <span className="font-semibold text-white">OpenAlex</span>
                      <span className="text-[10px] text-slate-400">Federated papers</span>
                    </button>

                    <button
                      onClick={() => handleTabSwitch('shelves')}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-sky-600/20 hover:border-sky-500/40 border border-slate-700 text-left transition flex flex-col gap-1"
                    >
                      <MapPin size={16} className="text-sky-400" />
                      <span className="font-semibold text-white">Shelf Audit</span>
                      <span className="text-[10px] text-slate-400">RFID wand scan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: RAPID CIRCULATION DESK
        ------------------------------------------------------------- */}
        {activeTab === 'circulation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status Alert Banner */}
            {circStatus && (
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                circStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {circStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{circStatus.text}</span>
                </div>
                <button onClick={() => setCircStatus(null)} className="p-1 hover:bg-slate-800 rounded">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Circulation Scanner Desk */}
              <div className="lg:col-span-1 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Scan className="text-indigo-400" size={20} />
                    <h3 className="text-base font-bold text-white">Rapid Circulation Scanner</h3>
                  </div>
                  <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                    <button
                      onClick={() => setCircMode('checkout')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${circMode === 'checkout' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Issue Loan
                    </button>
                    <button
                      onClick={() => setCircMode('checkin')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${circMode === 'checkin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Return
                    </button>
                  </div>
                </div>

                <form onSubmit={circMode === 'checkout' ? handleCheckoutSubmit : handleReturnSubmit} className="space-y-4">
                  {circMode === 'checkout' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Patron Scholar Matriculation ID</label>
                      <input
                        type="text"
                        value={circMatric}
                        onChange={e => setCircMatric(e.target.value)}
                        placeholder="e.g. FCC/CEM/2024/042"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {(patrons.length > 0 ? patrons.slice(0, 4) : []).map(p => (
                          <button
                            key={p.matric}
                            type="button"
                            onClick={() => setCircMatric(p.matric)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-700"
                            title={p.name}
                          >
                            {p.matric?.split('/')[1] || p.matric}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {circMode === 'checkout' ? 'Item Barcode / Accession / ISBN' : 'Return Item Barcode / Accession ID'}
                    </label>
                    <input
                      type="text"
                      value={circItem}
                      onChange={e => setCircItem(e.target.value)}
                      placeholder="e.g. FCC-B001 or 978-978-49021-1-4"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {books.slice(0, 5).map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setCircItem(b.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-700"
                          title={b.title}
                        >
                          {b.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Fingerprint size={16} />
                    <span>{circMode === 'checkout' ? 'Verify Biometrics & Issue' : 'Process Rapid Return'}</span>
                  </button>
                </form>
              </div>

              {/* Active Holdings & Real-time Loan Table */}
              <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Active Loan Registrations</h3>
                    <p className="text-xs text-slate-400">Patron holdings currently on circulation</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400">{loans.length} active records</span>
                </div>

                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Item Ref</th>
                        <th className="py-2.5 px-3">Patron Scholar</th>
                        <th className="py-2.5 px-3">Call Number</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Circulation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {loans.map(loan => (
                        <tr key={loan.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3">
                            <div className="font-mono text-indigo-400 font-bold">{loan.bookId || loan.id}</div>
                            <div className="text-[11px] text-slate-300 max-w-[180px] truncate">{loan.bookTitle}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{loan.patronName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{loan.matric}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">{loan.callNumber || 'HD2963'}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{loan.dueDate}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              loan.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              loan.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            {loan.status !== 'Returned' && (
                              <>
                                <button
                                  onClick={() => handleRenewLoan(loan.id)}
                                  className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-mono border border-indigo-500/30 transition"
                                >
                                  Renew
                                </button>
                                <button
                                  onClick={() => {
                                    setCircItem(loan.bookId || loan.id);
                                    setCircMode('checkin');
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-mono border border-emerald-500/30 transition"
                                >
                                  Return
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: PDF INGESTION & DUPLICATE DETECTION WORKSPACE
        ------------------------------------------------------------- */}
        {(activeTab === 'pdf_upload' || activeTab === 'pdf-upload') && (
          <div className="space-y-6 animate-fadeIn">
            {/* Duplicate Detected Warning Alert */}
            {pdfDuplicateCheck && pdfDuplicateCheck.isDuplicate && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <AlertTriangle size={16} />
                  <span>Existing Record Detected in Central Catalog</span>
                </div>
                <p>{pdfDuplicateCheck.message}</p>
                <div className="text-[11px] text-amber-400/80 font-mono">
                  Existing Item Ref: {pdfDuplicateCheck.book?.id} • Call Number: {pdfDuplicateCheck.book?.callNumber}
                </div>
              </div>
            )}

            {/* Deep PDF Analysis Inspector & Scanning Radar */}
            <PdfAnalysisInspector
              isAnalyzing={isAnalyzingAdminPdf}
              analysisProgress={adminPdfProgress}
              analysisResult={adminPdfResult}
              onReAnalyze={handleReAnalyzeAdminPdf}
              onReset={handleResetAdminPdf}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Drag & Drop Zone */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileUp size={18} className="text-indigo-400" />
                  <span>PDF Monograph Ingestion</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Upload electronic curriculum textbooks, theses, or faculty lecture monographs for automated ingestion.
                </p>

                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-950/60 relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload size={32} className="mx-auto text-indigo-400 mb-2" />
                  <div className="text-xs font-semibold text-white">Click or drag & drop PDF monograph</div>
                  <div className="text-[10px] text-slate-400 mt-1">Supports PDF up to 50MB with text layer</div>
                </div>

                {pdfUploadFile && (
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
                    <div className="font-semibold text-white truncate">{pdfUploadFile.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(pdfUploadFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                    </div>
                  </div>
                )}
              </div>

              {/* Right 2 Cols: Bibliographic Metadata Form */}
              <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Cataloguer Metadata Sheet</h3>
                    <p className="text-xs text-slate-400">MARC 21 compatible publication indexing</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Laravel 11 Sync
                  </span>
                </div>

                <form onSubmit={handleCatalogCommit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Title of Monograph / Work *</label>
                      <input
                        type="text"
                        value={pdfForm.title}
                        onChange={e => {
                          setPdfForm({ ...pdfForm, title: e.target.value });
                          if (e.target.value.length > 5) {
                            checkDuplicateWithLaravel(e.target.value, pdfForm.isbn, pdfForm.doi, '');
                          }
                        }}
                        placeholder="e.g. Modern Agricultural Cooperatives"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Primary Author / Corporate Body *</label>
                      <input
                        type="text"
                        value={pdfForm.author}
                        onChange={e => setPdfForm({ ...pdfForm, author: e.target.value })}
                        placeholder="e.g. Prof. A. O. Adebayo"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">ISBN (Tag 020)</label>
                      <input
                        type="text"
                        value={pdfForm.isbn}
                        onChange={e => setPdfForm({ ...pdfForm, isbn: e.target.value })}
                        placeholder="978-978-..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">LC Call Number (Tag 050)</label>
                      <input
                        type="text"
                        value={pdfForm.callNumber}
                        onChange={e => setPdfForm({ ...pdfForm, callNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Shelf Coordinate</label>
                      <input
                        type="text"
                        value={pdfForm.shelfLocation}
                        onChange={e => setPdfForm({ ...pdfForm, shelfLocation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Department</label>
                      <select
                        value={pdfForm.department}
                        onChange={e => setPdfForm({ ...pdfForm, department: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {departments.map(d => (
                          <option key={d.code} value={d.name}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Catalog Copies</label>
                      <input
                        type="number"
                        min="1"
                        value={pdfForm.copiesTotal}
                        onChange={e => setPdfForm({ ...pdfForm, copiesTotal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Citation Format</label>
                      <select
                        value={pdfForm.referenceStyle}
                        onChange={e => setPdfForm({ ...pdfForm, referenceStyle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option>APA 7th</option>
                        <option>MLA 9th</option>
                        <option>Chicago 17th</option>
                        <option>Harvard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Abstract & Summary (Tag 520)</label>
                    <textarea
                      rows={3}
                      value={pdfForm.abstract}
                      onChange={e => setPdfForm({ ...pdfForm, abstract: e.target.value })}
                      placeholder="Comprehensive overview of monograph research topics, chapters, and empirical datasets..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingBook}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-indigo-950 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <FileUp size={16} />
                      <span>{isSubmittingBook ? 'Ingesting...' : 'Ingest into Central Catalog'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: MODULE 3 — CATALOGUING & BIBLIOGRAPHIC CONTROL
        ------------------------------------------------------------- */}
        {activeTab === 'marc' && (
          <div className="animate-fadeIn">
            <FccCataloguingModule
              onIngestSuccess={(newRecord) => {
                setBooks(prev => [newRecord, ...prev]);
              }}
            />
          </div>
        )}


        {/* -------------------------------------------------------------
            TAB 5: SCHOLARLY RESEARCH INGESTION
        ------------------------------------------------------------- */}
        {activeTab === 'research' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe size={18} className="text-indigo-400" />
                    <span>OpenAlex & Crossref Research Harvester</span>
                  </h3>
                  <p className="text-xs text-slate-400">Query global scientific literature and harvest straight into FCC repository</p>
                </div>
                <form onSubmit={handleResearchQuery} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={e => setResearchQuery(e.target.value)}
                    placeholder="Search DOI, Author, or Keyword..."
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-64 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isResearching}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Globe size={13} className={isResearching ? 'animate-spin' : ''} />
                    <span>{isResearching ? 'Harvesting...' : 'Query OpenAlex'}</span>
                  </button>
                </form>
              </div>

              {researchResults.length === 0 && !isResearching && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  <Globe size={32} className="mx-auto mb-3 text-slate-700" />
                  <p className="font-semibold text-slate-400">Enter a topic above and click <span className="text-indigo-400">Query OpenAlex</span> to harvest real academic papers.</p>
                  <p className="mt-1">Results come live from OpenAlex — the world's largest open scholarly index.</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researchResults.map(item => (
                  <div key={item.doi} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-indigo-500/40 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                        DOI: {item.doi}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">By <span className="text-slate-200">{item.author}</span> • {item.journal} ({item.year})</div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-emerald-400 font-mono">{item.citations} indexed citations</span>
                      <button
                        onClick={() => handleIngestResearchItem(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 flex items-center gap-1.5 transition"
                      >
                        <Plus size={13} />
                        <span>1-Click Catalog</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 6: PATRON SCHOLARS DIRECTORY
        ------------------------------------------------------------- */}
        {activeTab === 'patrons' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users size={18} className="text-indigo-400" />
                    <span>Patron Scholars Directory</span>
                  </h3>
                  <p className="text-xs text-slate-400">Registered students, researchers, and library card accounts</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {patrons.length || 4} Registered Patrons
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Scholar Name</th>
                      <th className="py-2.5 px-3">Matriculation ID</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Level / Program</th>
                      <th className="py-2.5 px-3">Active Loans</th>
                      <th className="py-2.5 px-3">Clearance Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {patrons.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-slate-500 text-xs">No patrons registered yet. Add via the + Add Patron button or sync from the Integrations module.</td></tr>
                    )}
                    {patrons.map(p => (
                      <tr key={p.matric} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.email || 'scholar@student.fccibadan.edu.ng'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-400 font-semibold">{p.matric}</td>
                        <td className="py-3 px-3 text-slate-300">{p.department}</td>
                        <td className="py-3 px-3 text-slate-400">{p.level}</td>
                        <td className="py-3 px-3 font-mono text-emerald-400">{p.activeLoansCount || 0} active</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.clearanceStatus?.includes('Fines') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {p.clearanceStatus || 'Active Student'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setCircMatric(p.matric);
                              handleTabSwitch('circulation');
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-mono border border-indigo-500/30 transition"
                          >
                            Circulation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 7: SHELF AUDIT & 3D RFID MAP
        ------------------------------------------------------------- */}
        {activeTab === 'shelves' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-400" />
                    <span>Floor Stacks Mapping & RFID Audit Wand</span>
                  </h3>
                  <p className="text-xs text-slate-400">Interactive 3-floor physical library layout and misplaced item detection</p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(floor => (
                    <button
                      key={floor}
                      onClick={() => setActiveFloor(floor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeFloor === floor
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Floor {floor} Stacks
                    </button>
                  ))}
                  <button
                    onClick={startShelfAudit}
                    disabled={isRfidScanning}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                  >
                    <Scan size={14} />
                    <span>{isRfidScanning ? `Scanning ${auditProgress}%` : 'Activate RFID Wand'}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {isRfidScanning && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${auditProgress}%` }}></div>
                </div>
              )}

              {/* Floor Layout Visual Grid — real data from /api/shelves */}
              {shelves.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <MapPin size={28} className="mx-auto mb-2 text-slate-700" />
                  <p>No shelves configured in the database yet.</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {shelves
                  .filter(s => !activeFloor || Number(s.floor) === Number(activeFloor))
                  .map((item, idx) => {
                    const isFull = item.current_count >= item.capacity;
                    return (
                      <div key={item.id || idx} className={`p-4 rounded-xl border space-y-2 transition ${
                        isFull ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-950/80 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-400">{item.aisle || item.shelf_code || `Shelf ${idx + 1}`}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isFull ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isFull ? 'At Capacity' : item.status || 'Active'}
                          </span>
                        </div>
                        <div className="font-semibold text-xs text-white">
                          {item.call_number_start && item.call_number_end
                            ? `${item.call_number_start} – ${item.call_number_end}`
                            : item.name || item.shelf_code}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{item.current_count ?? 0} / {item.capacity ?? '—'} items</span>
                          <span className="font-mono text-slate-600">Floor {item.floor}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 8: ACQUISITIONS & SERIALS
        ------------------------------------------------------------- */}
        {activeTab === 'acquisitions' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-indigo-400" />
                    <span>Acquisitions & Journal Serials Desk</span>
                  </h3>
                  <p className="text-xs text-slate-400">Departmental textbook requests, purchase orders, and periodical subscriptions</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Fiscal Budget Active
                </span>
              </div>

              {acquisitions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <ShoppingBag size={28} className="mx-auto mb-2 text-slate-700" />
                  <p>No acquisition requests found in the database.</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {acquisitions.map((item, i) => (
                  <div key={item.id || i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-xs text-white">{item.title}</div>
                    <div className="text-[11px] text-slate-400">Requested by: {item.requested_by || item.requester}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.isbn || ''} • {item.department || ''}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="font-mono text-emerald-400 font-bold">
                        {item.cost_estimate_ngn
                          ? `₦${Number(item.cost_estimate_ngn).toLocaleString()}`
                          : item.cost ? `₦${Number(item.cost).toLocaleString()}` : '—'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.status?.includes('Delivered') || item.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' :
                        item.status?.includes('Review') ? 'bg-amber-500/20 text-amber-300' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {item.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 9: CONSORTIA & PARTNER LIBRARIES
        ------------------------------------------------------------- */}
        {(activeTab === 'partner_libs' || activeTab === 'partner-libraries') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-400" />
                    <span>Academic Consortia & Inter-Library Lending</span>
                  </h3>
                  <p className="text-xs text-slate-400">Federated partners granting mutual repository access to FCC scholars</p>
                </div>
              </div>

              {partnerLibraries.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <Building2 size={28} className="mx-auto mb-2 text-slate-700" />
                  <p>No partner libraries configured yet.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerLibraries.map((lib, i) => (
                  <div key={lib.id || i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-tight">{lib.institution || lib.name}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        lib.status === 'Active' || lib.status?.includes('Connected') || lib.status?.includes('Active')
                          ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                      }`}>{lib.status || 'Linked'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{lib.opac_url || lib.z3950_host || ''}</div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="font-mono text-indigo-400 truncate">
                        {lib.active_holdings
                          ? `${Number(lib.active_holdings).toLocaleString()}+ volumes`
                          : lib.holdings || '—'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0">{lib.sync_mode || lib.country || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 10: BI ANALYTICS & ACCREDITATION AUDITOR
        ------------------------------------------------------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-400" />
                    <span>NBTE / NUC Accreditation Readiness Scorecard</span>
                  </h3>
                  <p className="text-xs text-slate-400">Institutional regulatory compliance audit for college accreditation</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {analyticsData?.accreditationScore ?? '—'} Accreditation Score
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Book-to-Student Ratio</div>
                  <div className="text-2xl font-bold text-white">{analyticsData?.bookToPatronRatio || `1 : ${books.length > 0 && patrons.length > 0 ? (books.length / patrons.length).toFixed(1) : '—'}`}</div>
                  <div className="text-[11px] text-emerald-400 font-medium">NBTE Benchmark: 1:12 minimum</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Recent Publications (Past 5 Years)</div>
                  <div className="text-2xl font-bold text-white">{analyticsData?.recentBooksPct ?? '—'}%</div>
                  <div className="text-[11px] text-emerald-400 font-medium">NUC Currency Criteria (≥60%)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Digital Holdings</div>
                  <div className="text-2xl font-bold text-white">{analyticsData?.digitalPct ?? '—'}%</div>
                  <div className="text-[11px] text-emerald-400 font-medium">{analyticsData?.digitalBooks ?? '—'} e-books in catalog</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-xs text-slate-400">Total Circulation</div>
                  <div className="text-2xl font-bold text-white">{analyticsData?.totalLoans ?? loans.length}</div>
                  <div className="text-[11px] text-rose-400 font-medium">{analyticsData?.overdueLoans ?? overdueLoansCount} overdue · {analyticsData?.returnedLoans ?? '—'} returned</div>
                </div>
              </div>
              {analyticsData?.deptDistribution?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Holdings by Department</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {analyticsData.deptDistribution.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-500 truncate">{d.department || 'General'}</div>
                        <div className="text-lg font-bold text-indigo-400 mt-1">{d.count}</div>
                        <div className="text-[10px] text-slate-500">titles</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 11: LARAVEL TELEMETRY & AUDIT LOGS
        ------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Database size={18} className="text-indigo-400" />
                    <span>Laravel 11 Telemetry & System Audit Logs</span>
                  </h3>
                  <p className="text-xs text-slate-400">Real-time database queries, circulation events, and API audit trail</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {laravelHealth.framework || 'Laravel 11.57'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Event Ref</th>
                      <th className="py-2.5 px-3">Action Type</th>
                      <th className="py-2.5 px-3">Transaction Details</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {auditLogs.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-xs">No audit log entries yet. Actions like checkouts, returns, and MARC exports appear here automatically.</td></tr>
                    )}
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 text-indigo-400">{log.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-400">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-200 max-w-[280px] truncate" title={log.details}>{log.details}</td>
                        <td className="py-2.5 px-3 text-slate-400">{log.actor || log.user}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB: WORLD LIBRARY APIS & CUSTOM CONNECTOR ENGINE
        ------------------------------------------------------------- */}
        {activeTab === 'apis' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Hub Bar */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">World Library APIs & Custom External Connectors</h3>
                      <p className="text-xs text-slate-400">
                        Integrated global repositories (Open Library, Google Books, Crossref, Gutenberg) with custom API ingestion
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowAddApiModal(true)}
                    id="admin-add-new-api-btn"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition hover:scale-105 active:scale-95"
                  >
                    <Plus size={15} />
                    <span>Add New Library API</span>
                  </button>
                </div>
              </div>

              {/* Interactive Global Federated Search Bar */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Search size={14} className="text-indigo-400" />
                  <span>Federated Global Library Search & Ingest Sandbox</span>
                </div>

                <form onSubmit={performFederatedSearch} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={activeApiSearchTerm}
                      onChange={e => setActiveApiSearchTerm(e.target.value)}
                      placeholder="Search across all connected world library APIs (e.g. cooperative economics, artificial intelligence)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={selectedApiForSearch}
                    onChange={e => setSelectedApiForSearch(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="all">🌍 All Connected World APIs</option>
                    {libraryApis.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={isSearchingApis}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap shadow-md shadow-indigo-900/40 transition flex items-center gap-1.5"
                  >
                    <Globe size={14} className={isSearchingApis ? 'animate-spin' : ''} />
                    <span>{isSearchingApis ? 'Harvesting...' : 'Query World APIs'}</span>
                  </button>
                </form>

                {/* Federated Search Results Grid */}
                {apiSearchResults.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Harvested <strong className="text-emerald-400 font-mono">{apiSearchResults.length}</strong> titles from global library providers:</span>
                      <button onClick={() => setApiSearchResults([])} className="text-slate-500 hover:text-slate-300">Clear</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {apiSearchResults.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              {item.coverUrl ? (
                                <img src={item.coverUrl} alt="Cover" className="w-12 h-16 object-cover rounded shadow-md border border-slate-700 flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-16 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0 font-mono text-[10px]">
                                  PDF
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white line-clamp-2 leading-snug">{item.title}</div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.author}</div>
                                <div className="text-[10px] text-indigo-400 font-mono mt-1">{item.year} • {item.format || 'Monograph'}</div>
                              </div>
                            </div>
                            {item.abstract && (
                              <p className="text-[10px] text-slate-400 line-clamp-2">{item.abstract}</p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 truncate max-w-[120px]">
                              {item.sourceApi}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.externalUrl && (
                                <a
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="View on External Provider"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button
                                onClick={() => handleIngestApiBook(item)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1 transition"
                                title="Ingest this book into FCC Central Catalog"
                              >
                                <Plus size={12} />
                                <span>1-Click Ingest</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configured Library APIs List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-indigo-400" />
                  <span>Configured Global Library APIs ({libraryApis.length})</span>
                </h4>
                <span className="text-xs text-slate-400">All APIs actively integrated with Laravel 11 backend</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryApis.map(api => {
                  const testRes = apiTestResults[api.id];
                  const testing = isTestingApi[api.id];

                  return (
                    <div key={api.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-xs text-white">{api.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{api.provider}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            api.is_preset ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {api.is_preset ? 'Preset' : 'Custom'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-400 break-all select-all border border-slate-800/80">
                          {api.endpoint_template}
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2">{api.description}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        {/* Live Test Status Feedback */}
                        {testRes && (
                          <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                            testRes.status === 'Online'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}>
                            <span>● {testRes.status} ({testRes.latencyMs}ms)</span>
                            {testRes.itemsDiscovered !== undefined && (
                              <span>{testRes.itemsDiscovered} items</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => testApiConnection(api.id)}
                            disabled={testing}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <Zap size={13} className={testing ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                            <span>{testing ? 'Testing...' : 'Ping Test'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {api.docs_url && (
                              <a
                                href={api.docs_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                title="View API Docs"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                            {!api.is_preset && (
                              <button
                                onClick={() => handleDeleteApi(api.id)}
                                className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                title="Delete Custom API"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: AUTOMATED ISBN & BARCODE CATALOGING SCANNER */}
        {(activeTab === 'barcode_scanner' || activeTab === 'barcode-scanner') && (
          <BarcodeCatalogScanner
            catalog={books}
            onAddBookToCatalog={async (newBook) => {
              const updated = [newBook, ...books];
              setBooks(updated);
              localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updated));

              // Persist to Laravel 11 Backend
              try {
                await fetch('/api/catalog', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newBook)
                });
              } catch (e) {
                console.warn('Backend sync queued');
              }
            }}
          />
        )}

        {/* TAB 14: CENTRAL LIBRARY ADMIN QUEUE - PENDING HOD SUBMISSIONS */}
        {(activeTab === 'hod_submissions' || activeTab === 'hod-submissions') && (
          <HodSubmissionsReviewQueue
            onPublishSuccess={(publishedBook) => {
              const updated = [publishedBook, ...books.filter(b => b.id !== publishedBook.id)];
              setBooks(updated);
              localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updated));
              window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: updated }));
            }}
          />
        )}

        {/* TAB 15: INSTITUTIONAL RBAC USER TIERS & GLOBAL SYSTEM POLICIES */}
        {activeTab === 'policies' && (
          <InstitutionalRbacPolicies />
        )}

        {/* TAB 16: MODULE 6 — INSTITUTIONAL INTEGRATIONS & SIS/HR/LMS CONNECTORS */}
        {activeTab === 'integrations' && (
          <InstitutionalIntegrationsHub onPatronsSynced={refreshFromLaravel} />
        )}

        {/* TAB 17: MODULE 7 — BARCODE & QR SYSTEM GENERATOR */}
        {(activeTab === 'barcode_qr' || activeTab === 'barcode-qr') && (
          <BarcodeQrStudio user={user} books={books} patrons={patrons} />
        )}

        {/* TAB 18: MODULE 49 — CONFIGURABLE LIBRARY SETTINGS & POLICIES */}
        {activeTab === 'settings' && (
          <ConfigurableLibrarySettings onSettingsUpdated={() => refreshFromLaravel()} />
        )}

        {/* TAB 19: TRI-PARTY INSTITUTIONAL COMMUNICATION & DISPATCH HUB */}
        {activeTab === 'comms' && (
          <InstitutionalCommunicationHub
            currentRole="admin"
            currentUser={{ name: 'Dr. Mrs. A. Balogun', id: 'ADMIN-CHIEF', dept: 'Central Library Services' }}
            allowRoleSwitching={true}
          />
        )}

        {/* TAB 20: ACADEMIC UNITS & DEPARTMENT MANAGEMENT (ADD & MANAGE DEPARTMENTS) */}
        {activeTab === 'departments' && (
          <DepartmentManagement
            onSwitchToHodPortal={(dept) => {
              if (onSwitchToHodPortal) {
                onSwitchToHodPortal(dept);
              } else {
                navigateTo('/hod/overview');
              }
            }}
          />
        )}

      </main>
      </div>

      {/* =========================================================================
          MODAL: ADMIN REGISTER NEW LIBRARY API
      ========================================================================= */}
      {showAddApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Globe size={20} />
                <h3 className="text-base font-bold text-white">Add New Library API to FCC Ecosystem</h3>
              </div>
              <button
                onClick={() => setShowAddApiModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddApiSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Library API Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. British Library National Search API"
                  value={newApiForm.name}
                  onChange={e => setNewApiForm({ ...newApiForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Provider / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. British Library, London"
                    value={newApiForm.provider}
                    onChange={e => setNewApiForm({ ...newApiForm, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newApiForm.category}
                    onChange={e => setNewApiForm({ ...newApiForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option>Books & Monograph Discovery</option>
                    <option>Scholarly Research & DOIs</option>
                    <option>Open Access Full-Text Books</option>
                    <option>Theses & Institutional Repositories</option>
                    <option>Agronomy & Cooperative Economics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  API Endpoint URL Template * <span className="text-[10px] text-indigo-400 font-mono">(Use &#123;query&#125; or &#123;isbn&#125;)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://api.library.org/search?q={query}&format=json"
                  value={newApiForm.endpoint_template}
                  onChange={e => setNewApiForm({ ...newApiForm, endpoint_template: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Authentication Mode</label>
                  <select
                    value={newApiForm.auth_type}
                    onChange={e => setNewApiForm({ ...newApiForm, auth_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option>Free Open Access</option>
                    <option>Bearer Token</option>
                    <option>API Key Header</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">API Key / Token (if required)</label>
                  <input
                    type="password"
                    placeholder="Optional token"
                    value={newApiForm.api_key}
                    onChange={e => setNewApiForm({ ...newApiForm, api_key: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Documentation URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newApiForm.docs_url}
                  onChange={e => setNewApiForm({ ...newApiForm, docs_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">API Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Describe collection scope, subjects, formats, and rate limits..."
                  value={newApiForm.description}
                  onChange={e => setNewApiForm({ ...newApiForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddApiModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingApi}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition"
                >
                  <Plus size={15} />
                  <span>{isAddingApi ? 'Registering...' : 'Register & Connect API'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Biometric Verification Modal */}
      {showBiometrics && pendingCheckout && (
        <BiometricScannerModal
          isOpen={showBiometrics}
          onClose={() => {
            setShowBiometrics(false);
            setPendingCheckout(null);
          }}
          onSuccess={confirmCheckoutBiometrics}
          studentData={{
            name: pendingCheckout.matricTrimmed.includes('042') ? 'Wale Olonade' : 'Patron Scholar',
            matric: pendingCheckout.matricTrimmed,
            dept: 'Co-operative Economics & Management',
            photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
          }}
          targetAction="Book Circulation Checkout"
        />
      )}
    </div>
  );
}
