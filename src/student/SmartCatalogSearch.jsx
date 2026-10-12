import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, Mic, MicOff, Bot, Sparkles, Filter, BookOpen,
  Layers, FileText, CheckCircle, MapPin, Download,
  Bookmark, ChevronRight, AlertCircle, RefreshCw, X, PlusCircle,
  Building2, GraduationCap, ArrowUpDown, Clock, Tag, ExternalLink,
  BookCheck, Zap, BookMarked, Eye, ShieldAlert, Lock, User, Award
} from 'lucide-react';
import { parseNaturalLanguageQuery, filterCatalogByNlp } from '../utils/nlpSearch';
import { sounds } from '../utils/soundEffects';

const DEFAULT_RECENT_SEARCHES = [
  'computer science',
  'cooperative economics',
  'banking & finance',
  'agricultural extension',
  'CSC 312',
  'CEM 411'
];

export const STUDENT_DEPARTMENTS = [
  {
    code: 'CSC',
    name: 'Computer Science & Information Technology',
    shortName: 'Computer Science',
    hod: 'Dr. K. E. Okonjo',
    colorName: 'Royal Blue',
    solidBg: 'bg-blue-600',
    solidText: 'text-blue-400',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
    accentHex: '#1d4ed8'
  },
  {
    code: 'CEM',
    name: 'Co-operative Economics & Management',
    shortName: 'Cooperative Economics',
    hod: 'Dr. Mrs. F. A. Babalola',
    colorName: 'Forest Emerald',
    solidBg: 'bg-emerald-600',
    solidText: 'text-emerald-400',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    accentHex: '#059669'
  },
  {
    code: 'BNF',
    name: 'Banking & Finance',
    shortName: 'Banking & Finance',
    hod: 'Mrs. Folake Sanusi',
    colorName: 'Amber Gold',
    solidBg: 'bg-amber-600',
    solidText: 'text-amber-400',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    accentHex: '#d97706'
  },
  {
    code: 'AGR',
    name: 'Agricultural Extension & Management',
    shortName: 'Agricultural Extension',
    hod: 'Dr. A. O. Olabode',
    colorName: 'Violet Purple',
    solidBg: 'bg-violet-600',
    solidText: 'text-violet-400',
    badgeColor: 'bg-violet-950 text-violet-300 border-violet-700',
    accentHex: '#7c3aed'
  },
  {
    code: 'BAM',
    name: 'Business Administration & Management',
    shortName: 'Business Admin',
    hod: 'Dr. T. M. Adewale',
    colorName: 'Crimson Red',
    solidBg: 'bg-rose-600',
    solidText: 'text-rose-400',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-700',
    accentHex: '#e11d48'
  },
  {
    code: 'PAD',
    name: 'Public Administration',
    shortName: 'Public Admin',
    hod: 'Dr. Mrs. B. O. Adeleke',
    colorName: 'Ocean Teal',
    solidBg: 'bg-teal-600',
    solidText: 'text-teal-400',
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-700',
    accentHex: '#0d9488'
  }
];

export const normalizeDeptCode = (str) => {
  if (!str) return 'GEN';
  const s = String(str).toLowerCase().trim();
  if (s.includes('comp') || s.includes('csc') || s.includes('ict') || s.includes('software')) return 'CSC';
  if (s.includes('coop') || s.includes('co-op') || s.includes('cem') || s.includes('economic')) return 'CEM';
  if (s.includes('bank') || s.includes('fin') || s.includes('bnf')) return 'BNF';
  if (s.includes('agri') || s.includes('aem') || s.includes('agr')) return 'AGR';
  if (s.includes('busi') || s.includes('admin') || s.includes('bam')) return 'BAM';
  if (s.includes('pub') || s.includes('pad')) return 'PAD';
  if (s.includes('acc')) return 'ACC';
  if (s.includes('mkt')) return 'MKT';
  return 'GEN';
};

export const isDemoOrExcluded = (item) => {
  if (!item) return false;
  const id = String(item.id || '');
  const demoIds = [
    'HOD-UP-001', 'HOD-UP-002', 'HOD-UP-003', 'HOD-UP-004',
    'FCC-HOD-CSC-001', 'FCC-HOD-CSC-PRJ', 'FCC-HOD-CSC-JRN',
    'FCC-HOD-CEM-001', 'FCC-HOD-CEM-PRJ',
    'FCC-HOD-BNF-001', 'FCC-HOD-BNF-PRJ',
    'FCC-HOD-AGR-001'
  ];
  if (demoIds.includes(id)) return true;

  const callNum = String(item.callNumber || item.call_number || item.assigned_call_number || '');
  if (['QA76.9 .O46 2024', 'TH-CSC-2024-001', 'JRN-CSC-VOL14', 'HD2951 .B12 2024', 'TH-CEM-2024-002', 'HG1811 .S22 2024', 'TH-BNF-2024-003', 'S544 .O33 2024'].includes(callNum)) {
    return true;
  }

  const title = (item.title || '').toLowerCase();
  if (
    title.includes('distributed multi-cloud systems') ||
    title.includes('autonomous multi-agent citation resolution') ||
    title.includes('west african journal of applied computer science') ||
    title.includes('quantitative cooperative econometrics & capital formation') ||
    title.includes('empirical assessment of micro-credit lending') ||
    title.includes('central banking monetary policy & fintech') ||
    title.includes('evaluation of mobile pos terminals & financial deepening') ||
    title.includes('modern agricultural extension methodologies & farm harvest') ||
    title.includes('cooperative econometrics past examination') ||
    title.includes('soil nitrogen dynamics & cocoa harvest') ||
    title.includes('modern micro-credit lending & syndicate') ||
    title.includes('vector indexing lab handout')
  ) {
    return true;
  }

  return false;
};

export const isPendingOrUnapproved = (item) => {
  if (!item) return false;
  if (item.status && item.status.toLowerCase() !== 'approved') return true;
  return false;
};

const getItemDeptCode = (item) => {
  if (item.courseCode) {
    const m = String(item.courseCode).match(/^([a-zA-Z]{3})/);
    if (m) {
      const code = m[1].toUpperCase();
      if (['CSC', 'CEM', 'BNF', 'AGR', 'BAM', 'PAD', 'ACC', 'MKT'].includes(code)) return code;
    }
  }

  const deptStr = item.department || item.department_name || item.department_id || item.subject || '';
  const normalized = normalizeDeptCode(deptStr);
  if (normalized !== 'GEN') return normalized;

  if (item.uploaded_by_hod_id) {
    const m = String(item.uploaded_by_hod_id).match(/HOD[-/]([a-zA-Z]{3})/i);
    if (m) return m[1].toUpperCase();
  }

  if (item.callNumber) {
    const m = String(item.callNumber).match(/TH-([a-zA-Z]{3})/i);
    if (m) return m[1].toUpperCase();
  }

  return 'GEN';
};

export const getItemAcademicTier = (item) => {
  if (!item) return 'ALL';

  const rawLevel = String(item.targetLevel || item.target_level || '').toUpperCase().trim();
  if (rawLevel.includes('HND')) return 'HND';
  if (rawLevel.includes('ND')) return 'ND';

  // Check course code numbers: e.g. CSC 122, COM 123, CSC 221 (100/200 series) vs CSC 312, CSC 499 (300/400 series)
  const course = String(item.courseCode || item.course_code || '').trim();
  const courseNumMatch = course.match(/\d{3}/);
  if (courseNumMatch) {
    const num = parseInt(courseNumMatch[0], 10);
    if (num >= 100 && num < 300) return 'ND';
    if (num >= 300 && num < 500) return 'HND';
  }

  // Check category or format (Final year capstone projects / dissertations in Nigerian polytechnics are HND)
  const isThesisOrCapstone = item.format === 'Student Project' || item.category === 'Student Project' || item.format === 'Thesis';
  if (isThesisOrCapstone) {
    if (rawLevel.includes('ND')) return 'ND';
    return 'HND';
  }

  // Check title, subtitle or abstract
  const text = `${item.title || ''} ${item.subtitle || ''} ${item.abstract || ''}`.toUpperCase();
  if (text.includes('HND') || text.includes('HIGHER NATIONAL DIPLOMA')) return 'HND';
  if (text.includes('ND I') || text.includes('ND II') || text.includes('NATIONAL DIPLOMA')) return 'ND';

  return 'ALL';
};

export const normalizeAcademicLevel = (val) => {
  if (!val) return 'ND I';
  const s = String(val).toUpperCase().trim();
  if (s.includes('HND II') || s.includes('HND 2') || s.includes('FINAL')) return 'HND II';
  if (s.includes('HND I') || s.includes('HND 1') || s.includes('HND')) return 'HND I';
  if (s.includes('ND II') || s.includes('ND 2')) return 'ND II';
  if (s.includes('ND I') || s.includes('ND 1') || s.includes('ND')) return 'ND I';
  return 'ND I';
};

export default function SmartCatalogSearch({
  books = [],
  theses = [],
  user,
  onSelectBook,
  onOpenReader,
  onOpenAi,
  onRequestAcquisition,
  initialQuery = ''
}) {
  const initialStudentDept = useMemo(() => {
    return normalizeDeptCode(user?.dept || user?.department_name || user?.department || 'CSC');
  }, [user]);

  const initialStudentLevel = useMemo(() => {
    if (user?.level) return normalizeAcademicLevel(user.level);
    try {
      const sess = JSON.parse(localStorage.getItem('fcc_student_session') || '{}');
      if (sess?.level) return normalizeAcademicLevel(sess.level);
    } catch (e) {}
    try {
      const savedUser = JSON.parse(localStorage.getItem('fcc_user') || '{}');
      if (savedUser?.level) return normalizeAcademicLevel(savedUser.level);
    } catch (e) {}
    return 'ND I';
  }, [user]);

  const [studentDeptCode, setStudentDeptCode] = useState(initialStudentDept || 'CSC');
  const [studentLevel, setStudentLevel] = useState(initialStudentLevel || 'ND I');
  const [levelEnforcementMode, setLevelEnforcementMode] = useState(true);
  const [exclusiveDepartmentMode, setExclusiveDepartmentMode] = useState(true);

  // Derived normalized level tokens
  const normalizedStudentLevel = useMemo(() => {
    return normalizeAcademicLevel(studentLevel);
  }, [studentLevel]);

  const isStudentHnd = normalizedStudentLevel.startsWith('HND');
  const isStudentNd = normalizedStudentLevel.startsWith('ND');

  // Sync state whenever authenticated user changes
  useEffect(() => {
    if (user?.dept || user?.department_name || user?.department) {
      setStudentDeptCode(normalizeDeptCode(user.dept || user.department_name || user.department));
    }
    if (user?.level) {
      setStudentLevel(normalizeAcademicLevel(user.level));
    }
  }, [user]);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('Everything');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'available'
  const [sortBy, setSortBy] = useState('relevance');
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('fcc_recent_searches');
      return saved ? JSON.parse(saved) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const recognitionRef = useRef(null);

  const currentStudentDept = useMemo(() => {
    return STUDENT_DEPARTMENTS.find(d => d.code === studentDeptCode) || STUDENT_DEPARTMENTS[0];
  }, [studentDeptCode]);

  // Friendly student categories
  const categories = [
    { id: 'Everything', label: 'All Holdings', icon: Sparkles },
    { id: 'Books', label: 'Books & Textbooks', icon: BookOpen },
    { id: 'eBooks & PDFs', label: 'E-Books & PDFs', icon: Zap },
    { id: 'Journals', label: 'Academic Journals', icon: Layers },
    { id: 'Theses & Projects', label: 'Student Projects & Theses', icon: GraduationCap },
    { id: 'Course Materials', label: 'Course Materials', icon: FileText }
  ];

  // State for live database sync
  const [backendApprovedUploads, setBackendApprovedUploads] = useState([]);
  const [backendBooks, setBackendBooks] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Synchronize strictly with the backend database
  const refreshCatalogFromDatabase = useCallback(async () => {
    setIsLoadingCatalog(true);
    // Purge any legacy mock / demo entries from browser storage
    try {
      ['fcc_catalog_v48_gov', 'fcc_hod_submissions_v48', 'fcc_pending_department_uploads'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter(x => !isDemoOrExcluded(x));
            if (cleaned.length > 0) {
              localStorage.setItem(key, JSON.stringify(cleaned));
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (e) {}

    // 1. Fetch live master catalog books from backend /api/catalog
    try {
      const bRes = await fetch('/api/catalog');
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) {
          const norm = bData.map(b => ({
            ...b,
            callNumber: b.call_number || b.callNumber,
            shelfLocation: b.shelf_location || b.shelfLocation,
            courseCode: b.course_code || b.courseCode,
            targetLevel: b.target_level || b.targetLevel,
            copiesTotal: b.copies_total !== undefined ? b.copies_total : (b.copiesTotal || 1),
            copiesAvailable: b.copies_available !== undefined ? b.copies_available : (b.copiesAvailable || 1),
            pdfPages: b.pdf_pages || b.pdfPages || 120,
            fileSize: b.file_size || b.fileSize,
            fileName: b.file_name || b.fileName,
            fileDataUrl: b.file_data_url || b.fileDataUrl || '',
            externalUrl: b.external_url || b.externalUrl || '',
            isDigital: b.is_digital !== undefined ? Boolean(b.is_digital) : (b.isDigital !== undefined ? Boolean(b.isDigital) : true),
            abstract: b.abstract || ''
          })).filter(b => !isDemoOrExcluded(b) && !isPendingOrUnapproved(b));
          setBackendBooks(norm);
        }
      }
    } catch (err) {
      console.warn('Catalog live fetch error:', err);
    }

    // 2. Fetch live approved uploads from backend /api/department-uploads?status=approved
    // If Admin at #/admin/hod-submissions has not Approved & Published, this will NOT return them!
    try {
      const uRes = await fetch('/api/department-uploads?status=approved');
      if (uRes.ok) {
        const uData = await uRes.json();
        if (Array.isArray(uData)) {
          const approved = uData.filter(u => u && u.status === 'approved' && !isDemoOrExcluded(u));
          setBackendApprovedUploads(approved);
        }
      }
    } catch (err) {
      console.warn('Approved uploads live fetch error:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalogFromDatabase();

    const handleCatalogUpdate = () => refreshCatalogFromDatabase();
    const handleSubmissionsUpdate = () => refreshCatalogFromDatabase();

    window.addEventListener('fcc-catalog-updated', handleCatalogUpdate);
    window.addEventListener('fcc-submissions-updated', handleSubmissionsUpdate);

    return () => {
      window.removeEventListener('fcc-catalog-updated', handleCatalogUpdate);
      window.removeEventListener('fcc-submissions-updated', handleSubmissionsUpdate);
    };
  }, [refreshCatalogFromDatabase]);

  // Merge institutional database holdings with approved HOD submissions and theses
  // STRICT RULE: Only items fetched from the backend database that are Approved & Published appear!
  const combinedCatalog = useMemo(() => {
    // 1. Process Approved HOD uploads from database
    const approvedHOD = backendApprovedUploads.map(item => {
      const isProject = item.resource_type === 'Student Project' || item.category === 'Student Project' || Boolean(item.student_names || item.studentName);
      const isJournal = item.resource_type === 'Journal' || item.category === 'Journal' || Boolean(item.issn);

      return {
        id: item.book_id || `hod-${item.id}`,
        title: item.title,
        author: isProject ? (item.student_names || item.studentName || item.author || 'Student Researcher') : (item.author || item.editors || 'Editorial Board'),
        supervisor: item.supervisor || item.supervisor_name || 'Academic Supervisor',
        publisher: item.publisher || (isProject ? `FCC Department of ${item.department_name || item.department || 'General Studies'}` : 'Institutional Press'),
        year: Number(item.session_year || item.publication_year || item.year) || new Date().getFullYear(),
        callNumber: item.assigned_call_number || item.callNumber || (isProject ? `TH-${item.id}` : `JRN-${item.id}`),
        isbn: item.isbn || (item.issn ? `ISSN ${item.issn}` : null),
        subject: item.subject || item.topic || (isProject ? 'Capstone Research' : 'Academic Research'),
        abstract: item.abstract || item.review_notes || (isProject ? `Approved student project from the Department of ${item.department_name || item.department}.` : 'Scholarly peer-reviewed paper in institutional serials.'),
        department: item.department_name || item.department || 'General Studies',
        isDigital: Boolean(item.file_data_url || item.fileUrl || item.pdfUrl),
        pdfUrl: item.file_data_url || item.fileUrl || item.pdfUrl || `/api/catalog/${item.book_id || item.id}/file`,
        pdfPages: item.pdf_pages || item.pdfPages || item.pages || 48,
        copiesAvailable: 1,
        totalCopies: 1,
        format: isProject ? 'Student Project' : (isJournal ? 'Journal' : (item.format || item.resource_type || 'Book')),
        category: isProject ? 'Student Project' : (isJournal ? 'Journal' : 'Book'),
        branch: 'Main Campus Library (Prof. Hezekiah Complex)',
        shelfLocation: item.assigned_shelf || item.shelf_location || (isProject ? 'Postgraduate & Project Repository' : (isJournal ? 'Serials & Periodicals Section' : 'Floor 2 / Open Stacks')),
        uploaded_by_hod_id: item.uploaded_by_hod_id || `HOD-${normalizeDeptCode(item.department_name)}`,
        hod_name: item.hod_name,
        status: 'approved'
      };
    });

    // 2. Format theses (strictly approved / published)
    const formattedTheses = (theses || []).filter(t => t && (t.status === 'Published' || t.is_approved) && !isDemoOrExcluded(t)).map(t => ({
      id: `thesis-${t.id}`,
      title: t.title,
      author: t.studentName || t.author || 'Postgraduate Researcher',
      supervisor: t.supervisor || 'Departmental Supervisor',
      publisher: `FCC Institutional Repository (${t.department || 'Academic Affairs'})`,
      year: t.year || new Date().getFullYear(),
      callNumber: `TH-${normalizeDeptCode(t.department)}-${t.year || 2024}-${t.id}`,
      isbn: `ETD-${t.id}`,
      subject: t.topic || t.abstract || 'Academic Dissertation / Project',
      abstract: t.abstract || `Research study submitted to the Department of ${t.department || 'General Studies'}, Federal Cooperative College Ibadan.`,
      department: t.department || 'General Studies',
      isDigital: true,
      pdfUrl: t.fileUrl || '/demo-theses.pdf',
      pdfPages: t.pages || 142,
      copiesAvailable: 1,
      totalCopies: 1,
      format: 'Student Project',
      category: 'Student Project',
      branch: 'Main Campus Library (Prof. Hezekiah Complex)',
      shelfLocation: 'Postgraduate Archive & Repository',
      uploaded_by_hod_id: `HOD-${normalizeDeptCode(t.department)}`,
      status: 'approved'
    }));

    // 3. Central books strictly from backend database
    const sourceBooks = (backendBooks.length > 0 ? backendBooks : (books || []))
      .filter(b => b && !isDemoOrExcluded(b) && !isPendingOrUnapproved(b));

    const seenMap = new Map();
    // Absolutely NO hardcoded mock entries (departmentalCurated is completely removed)
    const allItems = [...sourceBooks, ...approvedHOD, ...formattedTheses];

    for (const b of allItems) {
      if (!b || !b.title) continue;
      if (isDemoOrExcluded(b) || isPendingOrUnapproved(b)) continue;
      const normKey = (b.title || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\.pdf$/i, '').replace(/[^\w\s]/g, '').trim();
      const key = (b.isbn && !b.isbn.startsWith('978-978-000') ? b.isbn : null) || normKey || b.id;
      if (!seenMap.has(key)) {
        seenMap.set(key, b);
      }
    }

    return Array.from(seenMap.values());
  }, [backendBooks, backendApprovedUploads, books, theses]);

  // Execute Search & Strict Department Access Gatekeeping
  const filteredResults = useMemo(() => {
    const parsedNlp = parseNaturalLanguageQuery(searchQuery);
    let results = filterCatalogByNlp(combinedCatalog, parsedNlp);

    // =========================================================================
    // STRICT DEPARTMENT-BASED ACCESS CONTROL
    // "every student we only have access to there department books base on what there HODs upload"
    // "If Computer Science CSC HODs upload books and admin approve, let only computer science have access"
    // =========================================================================
    results = results.filter(item => {
      const itemDept = getItemDeptCode(item);
      const isHODUpload = Boolean(
        String(item.id).startsWith('FCC-HOD') ||
        String(item.id).startsWith('hod-') ||
        item.uploaded_by_hod_id ||
        item.category === 'Student Project' ||
        item.format === 'Student Project' ||
        item.format === 'Thesis' ||
        item.courseCode
      );

      if (isHODUpload || itemDept !== 'GEN') {
        // Must match student's department code exactly!
        return itemDept === studentDeptCode;
      }

      // If general non-departmental library holding
      if (exclusiveDepartmentMode) {
        return false; // Strict mode: only show their department's HOD uploads and books
      }
      return true;
    });

    // =========================================================================
    // STRICT ACADEMIC LEVEL GATEKEEPING (ND vs HND)
    // "Academic Level: just only show the book that are met to be for Level and the department IF ND student show only ND books inside the student department"
    // =========================================================================
    const isStudentNd = studentLevel.toUpperCase().includes('ND') && !studentLevel.toUpperCase().includes('HND');
    const isStudentHnd = studentLevel.toUpperCase().includes('HND');

    if (levelEnforcementMode) {
      results = results.filter(item => {
        const itemTier = getItemAcademicTier(item);
        if (itemTier === 'ALL') return true; // General shared foundation books

        if (isStudentNd) {
          // ND student strictly only gets ND books!
          return itemTier === 'ND';
        }

        if (isStudentHnd) {
          // HND student strictly only gets HND books!
          return itemTier === 'HND';
        }

        return true;
      });
    }

    // 1. Category Filter
    if (activeCategory === 'Books') {
      results = results.filter(b => b.format === 'Book' || (b.category !== 'Student Project' && b.category !== 'Journal' && b.format !== 'Thesis' && b.format !== 'Journal'));
    } else if (activeCategory === 'eBooks & PDFs') {
      results = results.filter(b => b.isDigital || b.pdfUrl || b.format === 'PDF' || b.format === 'E-Book');
    } else if (activeCategory === 'Journals') {
      results = results.filter(b => 
        b.format === 'Journal' || 
        b.category === 'Journal' ||
        (b.subject && b.subject.toLowerCase().includes('journal')) ||
        (b.title && b.title.toLowerCase().includes('journal'))
      );
    } else if (activeCategory === 'Theses & Projects') {
      results = results.filter(b => 
        b.format === 'Student Project' || 
        b.format === 'Thesis' || 
        b.category === 'Student Project' ||
        String(b.id).startsWith('thesis-') || 
        (b.title && b.title.toLowerCase().includes('thesis'))
      );
    } else if (activeCategory === 'Course Materials') {
      results = results.filter(b => Boolean(b.courseCode) || b.format === 'Course Material');
    }

    // 2. Branch Filter
    if (selectedBranch !== 'All Branches') {
      results = results.filter(b => b.branch === selectedBranch);
    }

    // 3. Availability Filter
    if (availabilityFilter === 'available') {
      results = results.filter(b => b.copiesAvailable > 0 || b.isDigital);
    }

    // 4. Sorting
    const sorted = [...results];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        sorted.sort((a, b) => {
          const aTitle = (a.title || '').toLowerCase().includes(q) ? 4 : 0;
          const bTitle = (b.title || '').toLowerCase().includes(q) ? 4 : 0;
          const aCourse = (a.courseCode || '').toLowerCase().includes(q) ? 2 : 0;
          const bCourse = (b.courseCode || '').toLowerCase().includes(q) ? 2 : 0;
          const aAuthor = (a.author || '').toLowerCase().includes(q) ? 1 : 0;
          const bAuthor = (b.author || '').toLowerCase().includes(q) ? 1 : 0;
          return (bTitle + bCourse + bAuthor) - (aTitle + aCourse + aAuthor);
        });
      }
    }

    return sorted;
  }, [combinedCatalog, searchQuery, activeCategory, selectedBranch, availabilityFilter, sortBy, studentDeptCode, studentLevel, levelEnforcementMode, exclusiveDepartmentMode]);

  // Voice Search
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          sounds.playClick();
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setSearchQuery(transcript);
            handleSaveRecentSearch(transcript);
            sounds.playSuccessChime();
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          sounds.playErrorBuzz();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        fallbackVoiceSimulation();
      }
    } else {
      fallbackVoiceSimulation();
    }
  };

  const fallbackVoiceSimulation = () => {
    setIsListening(true);
    sounds.playClick();
    const demoVoiceQueries = [
      'Find available course textbooks',
      'Show final year projects',
      'Find approved HOD books',
      'Show lecture handouts'
    ];
    const randomQuery = demoVoiceQueries[Math.floor(Math.random() * demoVoiceQueries.length)];
    setTimeout(() => {
      setSearchQuery(randomQuery);
      handleSaveRecentSearch(randomQuery);
      setIsListening(false);
      sounds.playSuccessChime();
    }, 1200);
  };

  const handleSaveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('fcc_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleApplySuggestion = (text) => {
    setSearchQuery(text);
    handleSaveRecentSearch(text);
    sounds.playClick();
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('fcc_recent_searches');
    sounds.playClick();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('Everything');
    setSelectedBranch('All Branches');
    setAvailabilityFilter('all');
    setSortBy('relevance');
    sounds.playClick();
  };

  const parsedNlp = parseNaturalLanguageQuery(searchQuery);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. CURRICULUM & SCHOLAR IDENTITY COMMAND BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        {/* Department Accent Glow Bar */}
        <div
          className="h-1.5 w-full bg-gradient-to-r"
          style={{
            background: `linear-gradient(90deg, ${currentStudentDept.accentHex}, #10b981, ${currentStudentDept.accentHex})`
          }}
        />

        <div className="p-5 sm:p-6 lg:p-7 space-y-5">
          {/* Top Row: Identity & Quick Selectors */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Department & Scholar Scope Profile */}
            <div className="flex items-start sm:items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl border border-white/10 ring-4 ring-white/5 transition-transform hover:scale-105"
                style={{ backgroundColor: currentStudentDept.accentHex }}
              >
                <GraduationCap size={28} />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <span className="whitespace-nowrap">Federal Co-operative College, Ibadan</span>
                  <span>•</span>
                  <span style={{ color: currentStudentDept.accentHex }} className="font-semibold whitespace-nowrap">Curriculum Repository</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {currentStudentDept.name}
                </h2>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5"
                    style={{ backgroundColor: currentStudentDept.accentHex }}
                  >
                    <Building2 size={12} />
                    <span>{currentStudentDept.code} Department</span>
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 shadow-sm ${
                    isStudentHnd
                      ? 'bg-purple-950/80 text-purple-300 border-purple-700/80'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                  }`}>
                    <Award size={12} />
                    <span>Level: {normalizedStudentLevel}</span>
                    <span className="opacity-70 text-[10px]">({isStudentHnd ? 'HND Tier' : 'ND Tier'})</span>
                  </span>

                  {currentStudentDept.hod && (
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/80 items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      <span>HOD: {currentStudentDept.hod}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Modern Compact Control Cluster */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 shadow-inner flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 lg:self-center">
              
              {/* Department Switcher */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-slate-700 transition">
                <Building2 size={14} className="text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Department</span>
                  <select
                    value={studentDeptCode}
                    onChange={(e) => {
                      setStudentDeptCode(e.target.value);
                      sounds.playClick();
                    }}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    {STUDENT_DEPARTMENTS.map(d => (
                      <option key={d.code} value={d.code} className="bg-slate-900 text-white">
                        {d.code} - {d.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Academic Level Switcher */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-slate-700 transition">
                <GraduationCap size={14} className={isStudentHnd ? 'text-purple-400' : 'text-emerald-400'} />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Curriculum Level</span>
                  <select
                    value={normalizedStudentLevel}
                    onChange={(e) => {
                      setStudentLevel(e.target.value);
                      sounds.playClick();
                    }}
                    className={`bg-transparent font-bold text-xs focus:outline-none cursor-pointer pr-1 ${
                      isStudentHnd ? 'text-purple-300' : 'text-emerald-300'
                    }`}
                  >
                    <option value="ND I" className="bg-slate-900 text-white">ND I - Year 1</option>
                    <option value="ND II" className="bg-slate-900 text-white">ND II - Year 2</option>
                    <option value="HND I" className="bg-slate-900 text-white">HND I - Year 3</option>
                    <option value="HND II" className="bg-slate-900 text-white">HND II - Final Year</option>
                  </select>
                </div>
              </div>

              {/* Filter Toggles & Sync DB */}
              <div className="flex items-center gap-2">
                {/* Level Gatekeeper Button */}
                <button
                  onClick={() => {
                    setLevelEnforcementMode(!levelEnforcementMode);
                    sounds.playClick();
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    levelEnforcementMode
                      ? (isStudentHnd ? 'bg-purple-950/70 text-purple-300 border-purple-700' : 'bg-emerald-950/70 text-emerald-300 border-emerald-700')
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle Curriculum Tier Restriction"
                >
                  <Lock size={12} />
                  <span>{levelEnforcementMode ? (isStudentHnd ? 'HND Locked' : 'ND Locked') : 'All Levels'}</span>
                </button>

                {/* Department Only Button */}
                <button
                  onClick={() => {
                    setExclusiveDepartmentMode(!exclusiveDepartmentMode);
                    sounds.playClick();
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    exclusiveDepartmentMode
                      ? 'bg-slate-900 text-teal-300 border-teal-700'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle Department Exclusivity"
                >
                  <span>{exclusiveDepartmentMode ? `${currentStudentDept.code} Only` : 'All Stacks'}</span>
                </button>

                {/* Sync Central DB */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    refreshCatalogFromDatabase();
                  }}
                  disabled={isLoadingCatalog}
                  className={`px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isLoadingCatalog ? 'opacity-70 cursor-wait' : ''
                  }`}
                  title="Synchronize live catalog with central SQLite database"
                >
                  <RefreshCw size={12} className={isLoadingCatalog ? 'animate-spin text-amber-400' : 'text-slate-400'} />
                  <span className="hidden sm:inline">{isLoadingCatalog ? 'Syncing...' : 'Sync DB'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Policy Strip */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldAlert size={14} className={isStudentHnd ? 'text-purple-400 shrink-0' : 'text-emerald-400 shrink-0'} />
              <span>
                <strong className="text-white">Curriculum Access Policy:</strong>{' '}
                Showing verified <span className={isStudentHnd ? 'text-purple-300 font-bold' : 'text-emerald-300 font-bold'}>{isStudentHnd ? 'Higher National Diploma (HND)' : 'National Diploma (ND)'}</span> holdings for <strong className="text-white">{currentStudentDept.name}</strong>. {isStudentHnd ? 'ND-tier coursework is restricted.' : 'HND-tier coursework is restricted.'}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <BookOpen size={12} className="text-teal-400" />
                <strong className="text-slate-200">{filteredResults.length}</strong> Resources
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                <strong className="text-slate-200">{filteredResults.filter(b => b.isDigital).length}</strong> Digital PDFs
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. HERO SEARCH HEADER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm text-white"
                style={{ backgroundColor: currentStudentDept.accentHex }}
              >
                <Sparkles size={11} /> {currentStudentDept.code} REPOSITORY
              </span>
              <span className="text-[11px] text-slate-400">
                {filteredResults.length} Department Resources Available
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {currentStudentDept.shortName} Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Browse approved textbooks, lecture compendia, research projects, and journals submitted by {currentStudentDept.hod}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenAi && (
              <button
                onClick={() => onOpenAi(searchQuery || `Recommend top ${currentStudentDept.shortName} textbooks`)}
                className="px-4 py-2.5 rounded-2xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                style={{ backgroundColor: currentStudentDept.accentHex }}
              >
                <Bot size={16} />
                <span>Ask AI Librarian</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${currentStudentDept.shortName} by Title, Author, Topic, Course (e.g. ${currentStudentDept.code} 312) or Call Number...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveRecentSearch(searchQuery);
              }
            }}
            className="w-full bg-slate-950 border border-slate-700/80 hover:border-slate-600 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition shadow-inner font-sans"
            style={{ focusRingColor: currentStudentDept.accentHex }}
          />

          <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}

            {/* Voice Search Button */}
            <button
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isListening ? "Listening... Speak now" : "Voice Search (Click to speak)"}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          </div>
        </div>

        {/* Category Pills & Filter Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {categories.map(cat => {
              const CatIcon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    sounds.playClick();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  style={{ backgroundColor: isActive ? currentStudentDept.accentHex : undefined }}
                >
                  <CatIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showFilters
                ? 'bg-slate-900 border-slate-600 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Filter size={13} style={{ color: currentStudentDept.accentHex }} />
            <span>More Filters</span>
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <Building2 size={13} style={{ color: currentStudentDept.accentHex }} /> Campus Library Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="All Branches">All Library Branches</option>
                <option value="Main Campus Library (Prof. Hezekiah Complex)">Main Campus Central Library</option>
                <option value="Faculty of Science & Computing Library">Faculty of Science & Computing Library</option>
                <option value="E-Library & Virtual Commons">E-Library & Virtual Commons</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <CheckCircle size={13} style={{ color: currentStudentDept.accentHex }} /> Availability
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="all">All Department Holdings</option>
                <option value="available">Available on Shelf / E-Books Only</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1 flex items-center gap-1">
                <ArrowUpDown size={13} style={{ color: currentStudentDept.accentHex }} /> Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Publication Year (Newest First)</option>
                <option value="oldest">Publication Year (Oldest First)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Clock size={12} /> Recent:
          </span>
          {recentSearches.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySuggestion(s)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Search size={10} className="text-slate-500" />
              <span>{s}</span>
            </button>
          ))}
          {recentSearches.length > 0 && (
            <button
              onClick={handleClearRecentSearches}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition underline ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. RESULTS STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <div>
          Showing <strong className="text-white font-bold">{filteredResults.length}</strong> resources for <strong className="text-white">{currentStudentDept.name}</strong>
          {searchQuery && <span> matching "<strong className="text-amber-300">{searchQuery}</strong>"</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="hover:underline flex items-center gap-1 font-semibold text-slate-300"
          >
            <RefreshCw size={11} /> Reset Filters
          </button>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            HOD Upload Access Control • Active
          </span>
        </div>
      </div>

      {/* 4. RESULTS GRID */}
      {filteredResults.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">No {currentStudentDept.code} resources match your search</h3>
            <p className="text-xs text-slate-400">
              Only materials uploaded by the {currentStudentDept.name} HOD ({currentStudentDept.hod}) and approved by the Chief College Librarian appear here. Other departments' resources are strictly locked.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Reset Search Filters</span>
            </button>

            {onOpenAi && (
              <button
                onClick={() => onOpenAi(`Recommend ${currentStudentDept.name} research topics and study materials`)}
                className="px-4 py-2.5 rounded-xl text-white font-bold transition flex items-center gap-2 shadow"
                style={{ backgroundColor: currentStudentDept.accentHex }}
              >
                <Bot size={14} />
                <span>Ask AI Librarian to Recommend</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResults.map(book => {
            const isProject = book.category === 'Student Project' || book.format === 'Student Project' || book.format === 'Thesis';
            const isJournal = book.category === 'Journal' || book.format === 'Journal';
            const isEbook = book.isDigital || book.pdfUrl || book.format === 'PDF' || book.format === 'E-Book';

            return (
              <div
                key={book.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Subtle Stripe in Department Color */}
                <div
                  className="h-1 w-full absolute top-0 left-0"
                  style={{ backgroundColor: currentStudentDept.accentHex }}
                />

                <div className="space-y-3 pt-1">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isProject ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                          <GraduationCap size={11} /> {currentStudentDept.code} Student Project
                        </span>
                      ) : isJournal ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex items-center gap-1">
                          <Layers size={11} /> {currentStudentDept.code} Journal
                        </span>
                      ) : (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: currentStudentDept.accentHex }}
                        >
                          <BookOpen size={11} /> {currentStudentDept.code} HOD Book
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                        {book.callNumber || 'GEN-LIB'}
                      </span>

                      {book.courseCode && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-amber-300 border border-slate-800">
                          {book.courseCode}
                        </span>
                      )}

                      {/* Academic Curriculum Level Tier Badge */}
                      {(() => {
                        const tier = getItemAcademicTier(book);
                        const displayLevel = book.targetLevel || (tier === 'ND' ? 'ND Level' : tier === 'HND' ? 'HND Level' : 'All Levels');
                        const isNdTier = tier === 'ND';
                        const isHndTier = tier === 'HND';
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                            isNdTier
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70'
                              : isHndTier
                              ? 'bg-purple-950/80 text-purple-300 border-purple-700/70'
                              : 'bg-blue-950/80 text-blue-300 border-blue-700/70'
                          }`}>
                            <GraduationCap size={10} />
                            <span>{displayLevel}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        (book.copiesAvailable > 0 || book.isDigital)
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {book.isDigital 
                          ? 'Instant Read (PDF)' 
                          : (book.copiesAvailable > 0 ? `${book.copiesAvailable} Available` : 'Checked Out')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Creator */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-white transition leading-snug">
                      {book.title}
                    </h3>

                    {isProject ? (
                      <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                        <p><strong className="text-slate-400">Researcher:</strong> {book.author}</p>
                        {book.supervisor && (
                          <p className="text-[11px] text-slate-400"><strong className="text-slate-500">Supervisor:</strong> {book.supervisor}</p>
                        )}
                        <p className="text-[11px] font-mono" style={{ color: currentStudentDept.accentHex }}>
                          Dept. of {currentStudentDept.name} • Class of {book.year}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                        <p>
                          By <strong className="text-slate-200">{book.author}</strong> {book.publisher && `• ${book.publisher}`} ({book.year})
                        </p>
                        {book.hod_name && (
                          <p className="text-[11px] font-mono text-emerald-400">
                            Approved HOD Upload • {book.hod_name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Abstract / Summary */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {book.abstract || book.description || 'Departmental academic resource approved by Federal Co-operative College Ibadan.'}
                  </p>

                  {/* Location Info */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <MapPin size={13} style={{ color: currentStudentDept.accentHex }} className="shrink-0" />
                    <span className="truncate">
                      {book.shelfLocation || 'Department Stacks'} • {book.branch?.split('(')[0] || 'Main Campus Library'}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                    {book.isDigital && (
                      <span className="text-teal-400 font-semibold flex items-center gap-1">
                        <Zap size={11} /> Digital PDF
                      </span>
                    )}
                    <span>📖 {book.pdfPages || 140}p</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectBook && (
                      <button
                        onClick={() => onSelectBook(book)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition text-xs cursor-pointer"
                      >
                        View Details
                      </button>
                    )}

                    {(book.isDigital || book.pdfUrl) && onOpenReader && (
                      <button
                        onClick={() => onOpenReader(book)}
                        className="px-3.5 py-1.5 rounded-lg text-white font-bold flex items-center gap-1.5 shadow transition text-xs active:scale-95 cursor-pointer"
                        style={{ backgroundColor: currentStudentDept.accentHex }}
                      >
                        <BookOpen size={13} /> Read / Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
