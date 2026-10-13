import React, { useState, useEffect } from 'react';
import {
  Layers, CheckCircle, XCircle, Clock, AlertTriangle, BookOpen,
  Send, Eye, RefreshCw, Filter, Sparkles, ShieldCheck, Tag, MapPin,
  UserPlus, Building2, Users, GraduationCap, Mail, Key, Edit3,
  Trash2, Plus, Search, X, ChevronRight, ChevronLeft, Award, Check, Bookmark, FileText, Download, ExternalLink,
  Maximize2, Minimize2, Save, Undo, UploadCloud, ChevronDown, CheckCircle2, Sliders, Moon, Sun, Coffee
} from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { sounds } from '../utils/soundEffects';
import DigitalBookReader from '../common/DigitalBookReader';

export default function HodSubmissionsReviewQueue({ onPublishSuccess }) {
  // Main View: 'submissions' | 'departments'
  const [mainView, setMainView] = useState('submissions');

  // Submissions State
  const [uploads, setUploads] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'book' | 'journal' | 'project'
  const [selectedUploadForReview, setSelectedUploadForReview] = useState(null);
  const [showDeclinePrompt, setShowDeclinePrompt] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Departments & HODs State
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Department Form
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    hod_name: '',
    hod_email: '',
    hod_pin: '1234',
    faculty: 'School of Academic & Professional Studies',
    student_count: 150,
    faculty_count: 8
  });

  // Review Form in Modal
  const [reviewForm, setReviewForm] = useState({
    assigned_call_number: '',
    assigned_shelf: 'Floor 2 • Aisle 4 • Shelf 12B',
    review_notes: 'Approved by Central Library Directorate. Formatting and syllabus compliance verified.'
  });

  // Enhanced Modal, Reading & Modification States
  const [modalMode, setModalMode] = useState('review'); // 'review' | 'modify'
  const [previewTab, setPreviewTab] = useState('reader'); // 'reader' | 'pdf' | 'cover'
  const [readerPage, setReaderPage] = useState(1);
  const [readerFontSize, setReaderFontSize] = useState('base'); // 'sm' | 'base' | 'lg'
  const [readerTheme, setReaderTheme] = useState('dark'); // 'dark' | 'sepia' | 'light'
  const [showFullReader, setShowFullReader] = useState(false);
  const [isSavingModifications, setIsSavingModifications] = useState(false);
  const [reviewChecklist, setReviewChecklist] = useState({
    authorship: true,
    syllabus: true,
    formatting: true,
    originality: true,
  });

  // Modify/Edit Submission Form State
  const [modifyForm, setModifyForm] = useState({
    title: '',
    author: '',
    department_id: '',
    department_name: '',
    course_code: '',
    target_level: 'HND II',
    semester: 'First Semester',
    resource_type: 'Book',
    access_scope: 'Public Institution-Wide',
    abstract: '',
    file_name: '',
    file_data_url: '',
    cover_image: '',
    student_names: '',
    student_matric: '',
    supervisor_name: '',
    academic_session: '',
    journal_name: '',
    volume_issue: '',
    issn: '',
    doi: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    isbn: '',
    assigned_call_number: '',
    assigned_shelf: ''
  });

  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  // Show Feedback Notification
  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 5000);
  };

  // Legacy demo IDs and titles to purge permanently
  const DEMO_UPLOAD_IDS = [
    'HOD-UP-001', 'HOD-UP-002', 'HOD-UP-003', 'HOD-UP-004',
    'FCC-HOD-CSC-001', 'FCC-HOD-CSC-PRJ', 'FCC-HOD-CSC-JRN',
    'FCC-HOD-CEM-001', 'FCC-HOD-CEM-PRJ',
    'FCC-HOD-BNF-001', 'FCC-HOD-BNF-PRJ',
    'FCC-HOD-AGR-001'
  ];
  const isDemoUpload = (u) => {
    if (!u) return false;
    if (DEMO_UPLOAD_IDS.includes(u.id)) return true;
    const callNum = String(u.callNumber || u.call_number || u.assigned_call_number || '');
    if (['QA76.9 .O46 2024', 'TH-CSC-2024-001', 'JRN-CSC-VOL14'].includes(callNum)) return true;
    const title = (u.title || '').toLowerCase();
    if (title.includes('cooperative econometrics past examination')) return true;
    if (title.includes('distributed multi-cloud systems')) return true;
    if (title.includes('autonomous multi-agent citation resolution')) return true;
    if (title.includes('west african journal of applied computer science')) return true;
    if (title.includes('soil nitrogen dynamics & cocoa harvest')) return true;
    if (title.includes('modern micro-credit lending & syndicate')) return true;
    if (title.includes('vector indexing lab handout')) return true;
    return false;
  };

  // 1. Fetch Submissions Live from Backend Database
  const fetchUploads = async () => {
    setIsLoadingUploads(true);
    // Purge any legacy mock submissions from local storage caches
    try {
      ['fcc_pending_department_uploads', 'fcc_hod_submissions_v48'].forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter(item => !isDemoUpload(item));
            if (cleaned.length > 0) {
              localStorage.setItem(k, JSON.stringify(cleaned));
            } else {
              localStorage.removeItem(k);
            }
          }
        }
      });
    } catch (e) {}

    try {
      const res = await fetch('/api/department-uploads');
      if (res.ok) {
        const data = await res.json();
        const serverUploads = Array.isArray(data) ? data.filter(u => !isDemoUpload(u)) : [];
        setUploads(serverUploads);
      } else {
        setUploads([]);
      }
    } catch (e) {
      console.warn('API error fetching /api/department-uploads:', e);
      setUploads([]);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  // 2. Fetch Departments & HODs from Backend Database
  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          // Sync with local departmentService
          try {
            localStorage.setItem('fcc_departments_v48_gov', JSON.stringify(data));
          } catch (e) {}
          return;
        }
      }
      // Fallback to departmentService
      const localDepts = departmentService.getDepartments();
      setDepartments(localDepts);
    } catch (err) {
      const localDepts = departmentService.getDepartments();
      setDepartments(localDepts);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchUploads();
    fetchDepartments();

    const handleSubmissionsUpdated = () => fetchUploads();
    const handleDepartmentsUpdated = () => fetchDepartments();

    window.addEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
    window.addEventListener('fcc-departments-updated', handleDepartmentsUpdated);

    return () => {
      window.removeEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
      window.removeEventListener('fcc-departments-updated', handleDepartmentsUpdated);
    };
  }, []);

  // Open Add Department Modal
  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      code: '',
      hod_name: '',
      hod_email: '',
      hod_pin: '1234',
      faculty: 'School of Academic & Professional Studies',
      student_count: 200,
      faculty_count: 10
    });
    setShowAddDeptModal(true);
  };

  // Open Edit Department Modal
  const openEditDeptModal = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name || '',
      code: dept.code || '',
      hod_name: dept.hod_name || dept.hod || '',
      hod_email: dept.hod_email || dept.hodEmail || '',
      hod_pin: dept.hod_pin || dept.pin || '1234',
      faculty: dept.faculty || 'School of Academic & Professional Studies',
      student_count: dept.student_count || dept.studentCount || 150,
      faculty_count: dept.faculty_count || dept.facultyCount || 8
    });
    setShowAddDeptModal(true);
  };

  // Save (Create or Update) Department & HOD
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim() || !deptForm.hod_name.trim()) {
      showFeedback('error', 'Please fill in Department Name, Code, and HOD Name.');
      return;
    }

    setIsSubmittingDept(true);
    const cleanCode = deptForm.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isEditing = Boolean(editingDept);
    const deptId = isEditing ? (editingDept.id || `DEP-${cleanCode}`) : `DEP-${cleanCode}`;

    const payload = {
      name: deptForm.name.trim(),
      code: cleanCode,
      hod_name: deptForm.hod_name.trim(),
      hod_email: deptForm.hod_email.trim() || `${cleanCode.toLowerCase()}.hod@fccibadan.edu.ng`,
      hod_pin: deptForm.hod_pin.trim() || '1234',
      student_count: Number(deptForm.student_count) || 150,
      faculty_count: Number(deptForm.faculty_count) || 8
    };

    try {
      const url = isEditing ? `/api/departments/${deptId}` : '/api/departments';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        sounds.playSuccessChime();
        showFeedback('success', data.message || `Department "${payload.name}" assigned to HOD "${payload.hod_name}" successfully!`);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      // Local fallback in departmentService
      try {
        if (isEditing) {
          departmentService.updateDepartment(editingDept.code, {
            name: payload.name,
            hod: payload.hod_name,
            hodName: payload.hod_name,
            hodEmail: payload.hod_email,
            pin: payload.hod_pin
          });
        } else {
          departmentService.addDepartment({
            ...payload,
            hod: payload.hod_name,
            hodEmail: payload.hod_email,
            pin: payload.hod_pin
          });
        }
        sounds.playSuccessChime();
        showFeedback('success', `Department "${payload.name}" assigned to HOD "${payload.hod_name}" locally!`);
      } catch (serviceErr) {
        showFeedback('error', serviceErr.message || 'Failed to save department.');
      }
    } finally {
      setIsSubmittingDept(false);
      setShowAddDeptModal(false);
      fetchDepartments();
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Are you sure you want to remove the Department of "${dept.name}" and deassign HOD "${dept.hod_name || dept.hod}"?`)) {
      return;
    }

    try {
      const deptId = dept.id || `DEP-${dept.code}`;
      const res = await fetch(`/api/departments/${deptId}`, { method: 'DELETE' });
      if (res.ok) {
        sounds.playClick();
        showFeedback('success', `Department "${dept.name}" removed successfully.`);
      } else {
        departmentService.deleteDepartment(dept.code);
        showFeedback('success', `Department "${dept.name}" removed.`);
      }
    } catch (e) {
      try {
        departmentService.deleteDepartment(dept.code);
        showFeedback('success', `Department "${dept.name}" removed.`);
      } catch (err) {
        showFeedback('error', err.message);
      }
    } finally {
      fetchDepartments();
    }
  };

  // Helpers to inspect upload classification and metadata
  const getUploadCategory = (u) => {
    if (!u) return 'book';
    let parsed = null;
    if (typeof u.review_notes === 'string' && u.review_notes.startsWith('{')) {
      try { parsed = JSON.parse(u.review_notes); } catch (e) {}
    }
    if (parsed?.uploadCategory) return parsed.uploadCategory;
    if (u.upload_category) return u.upload_category;
    const resType = String(u.resource_type || '').toLowerCase();
    if (resType.includes('project') || resType.includes('thesis') || resType.includes('dissertation') || resType.includes('capstone')) return 'project';
    if (resType.includes('journal') || resType.includes('article') || resType.includes('periodical')) return 'journal';
    return 'book';
  };

  const getUploadExtra = (u) => {
    if (!u) return {};
    if (typeof u.review_notes === 'string' && u.review_notes.startsWith('{')) {
      try { return JSON.parse(u.review_notes); } catch (e) {}
    }
    return {};
  };

  // Open Review & Document Preview Modal
  const openReviewModal = (up) => {
    setSelectedUploadForReview(up);
    setShowDeclinePrompt(false);
    setDeclineReason('');
    setModalMode('review');
    setPreviewTab('reader');
    setReaderPage(1);

    const authorCode = (up.author || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'HOD';
    const courseNum = (up.course_code || '101').replace(/[^0-9]/g, '') || '411';
    const cat = getUploadCategory(up);
    const extra = getUploadExtra(up);

    const defaultCallNum = cat === 'project'
      ? `ETD-${up.department_code || 'RES'}-2026/0${Math.floor(1 + Math.random() * 9)}`
      : (cat === 'journal' ? `JRN-${(up.department_code || 'GEN')}-2026-V18` : `QA76.9 .${authorCode} 2026-C${courseNum}`);

    const defaultShelf = up.assigned_shelf || (cat === 'project' ? 'Institutional Repository • Digital ETD Collection' : (cat === 'journal' ? 'Periodicals & Journals Section • Rack 4B' : 'Floor 2 • Aisle 4 • Shelf 12B'));

    setReviewForm({
      assigned_call_number: up.assigned_call_number || defaultCallNum,
      assigned_shelf: defaultShelf,
      review_notes: 'Approved & Published by Chief College Librarian. Formatting and accreditation standards verified.'
    });

    setModifyForm({
      title: up.title || '',
      author: up.author || '',
      department_id: up.department_id || '',
      department_name: up.department_name || '',
      course_code: up.course_code || '',
      target_level: up.target_level || 'HND II',
      semester: up.semester || 'First Semester',
      resource_type: up.resource_type || (cat === 'project' ? 'Student Project' : cat === 'journal' ? 'Journal' : 'Book'),
      access_scope: up.access_scope || 'Public Institution-Wide',
      abstract: extra.abstract || up.abstract || '',
      file_name: up.file_name || '',
      file_data_url: up.file_data_url || '',
      cover_image: up.cover_image || '',
      student_names: extra.student_names || up.author || '',
      student_matric: extra.student_matric || '',
      supervisor_name: extra.supervisor_name || '',
      academic_session: extra.academic_session || '2025/2026 Academic Session',
      journal_name: extra.journal_name || '',
      volume_issue: extra.volume_issue || '',
      issn: extra.issn || '',
      doi: extra.doi || '',
      publisher: extra.publisher || `FCC Department of ${up.department_name} Press`,
      publication_year: extra.publication_year || new Date().getFullYear(),
      isbn: extra.isbn || '',
      assigned_call_number: up.assigned_call_number || defaultCallNum,
      assigned_shelf: defaultShelf
    });
  };

  const handleAutoGenerateCallNum = () => {
    if (!selectedUploadForReview) return;
    const authorCode = (modifyForm.author || selectedUploadForReview.author || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'HOD';
    const courseNum = (modifyForm.course_code || selectedUploadForReview.course_code || '101').replace(/[^0-9]/g, '') || '411';
    const cat = getUploadCategory(selectedUploadForReview);
    const gen = cat === 'project'
      ? `ETD-${selectedUploadForReview.department_code || 'RES'}-2026/0${Math.floor(1 + Math.random() * 9)}`
      : (cat === 'journal' ? `JRN-${(selectedUploadForReview.department_code || 'GEN')}-2026-V18` : `QA76.9 .${authorCode} 2026-C${courseNum}`);

    setReviewForm(prev => ({ ...prev, assigned_call_number: gen }));
    setModifyForm(prev => ({ ...prev, assigned_call_number: gen }));
    sounds.playClick();
  };

  const handleReplacementFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setModifyForm(prev => ({
        ...prev,
        file_name: file.name,
        file_data_url: ev.target.result
      }));
      sounds.playClick();
      showFeedback('info', `Document "${file.name}" loaded for preview. Click "Save Modifications" to persist.`);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setModifyForm(prev => ({
        ...prev,
        cover_image: ev.target.result
      }));
      sounds.playClick();
      showFeedback('info', `Cover image staged. Click "Save Modifications" to persist.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModifications = async () => {
    if (!selectedUploadForReview) return;
    const up = selectedUploadForReview;
    setIsSavingModifications(true);

    try {
      const payload = {
        title: modifyForm.title,
        author: modifyForm.author,
        department_id: modifyForm.department_id,
        department_name: modifyForm.department_name,
        course_code: modifyForm.course_code,
        target_level: modifyForm.target_level,
        semester: modifyForm.semester,
        resource_type: modifyForm.resource_type,
        access_scope: modifyForm.access_scope,
        file_name: modifyForm.file_name,
        file_data_url: modifyForm.file_data_url,
        cover_image: modifyForm.cover_image,
        assigned_call_number: modifyForm.assigned_call_number,
        assigned_shelf: modifyForm.assigned_shelf,
        abstract: modifyForm.abstract,
        student_names: modifyForm.student_names,
        student_matric: modifyForm.student_matric,
        supervisor_name: modifyForm.supervisor_name,
        academic_session: modifyForm.academic_session,
        journal_name: modifyForm.journal_name,
        volume_issue: modifyForm.volume_issue,
        issn: modifyForm.issn,
        doi: modifyForm.doi,
        publisher: modifyForm.publisher,
        publication_year: modifyForm.publication_year,
        isbn: modifyForm.isbn,
      };

      const res = await fetch(`/api/department-uploads/${up.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const updatedUpload = data?.upload || { ...up, ...payload };

      setSelectedUploadForReview(updatedUpload);
      setReviewForm(prev => ({
        ...prev,
        assigned_call_number: modifyForm.assigned_call_number || prev.assigned_call_number,
        assigned_shelf: modifyForm.assigned_shelf || prev.assigned_shelf
      }));

      setUploads(prev => prev.map(u => u.id === up.id ? updatedUpload : u));

      try {
        const cached = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        const updatedQueue = cached.map(u => u.id === up.id ? updatedUpload : u);
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(updatedQueue));
      } catch (e) {}

      sounds.playSuccessChime();
      showFeedback('success', `Submission "${modifyForm.title}" modified and updated successfully!`);
      setModalMode('review');
    } catch (err) {
      console.error('Failed to save modifications:', err);
      showFeedback('error', 'Failed to save modifications: ' + err.message);
    } finally {
      setIsSavingModifications(false);
    }
  };


  // 1. Approve Submission: "Approved & Published"
  const handleApprove = async () => {
    if (!selectedUploadForReview) return;
    const up = selectedUploadForReview;
    const id = up.id;
    const cat = getUploadCategory(up);
    const extra = getUploadExtra(up);

    try {
      const res = await fetch(`/api/department-uploads/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          assigned_call_number: reviewForm.assigned_call_number || up.assigned_call_number,
          assigned_shelf: reviewForm.assigned_shelf || up.assigned_shelf,
          review_notes: reviewForm.review_notes || 'Approved & Published by Central Library Directorate.'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Server error approving submission.');
      }

      const publishedBook = {
        id: data?.book?.id || `FCC-HOD-${id}`,
        title: data?.book?.title || up.title,
        subtitle: cat === 'project'
          ? `HND II Capstone Dissertation • Dept: ${up.department_name}`
          : (cat === 'journal' ? `${extra.journal_name || 'Academic Journal'} • ${extra.volume_issue || 'Current Vol'}` : `Departmental Curriculum • Course: ${up.course_code || 'GEN'} (${up.target_level || 'HND II'})`),
        author: data?.book?.author || up.author,
        authorCredentials: cat === 'project' ? `HND II Scholar (Supervisor: ${extra.supervisor_name || 'Faculty Advisor'})` : (cat === 'journal' ? 'Peer-Reviewed Researcher' : 'Faculty Contributor / HOD'),
        authorAffiliation: `Federal Co-operative College, Ibadan (${up.department_name || 'Academic Dept'})`,
        subject: data?.book?.subject || up.department_name || 'Academic Repository',
        department: data?.book?.department || up.department_name || 'Academic Department',
        courseCode: data?.book?.course_code || up.course_code || 'GEN 101',
        targetLevel: data?.book?.target_level || up.target_level || 'HND II',
        callNumber: data?.book?.call_number || reviewForm.assigned_call_number,
        shelfLocation: data?.book?.shelf_location || reviewForm.assigned_shelf,
        isbn: data?.book?.isbn || extra.isbn || (cat === 'journal' ? (extra.issn || '0794-8212') : `978-978-HOD-${Math.floor(100 + Math.random() * 900)}-1`),
        publisher: data?.book?.publisher || extra.publisher || (cat === 'journal' ? (extra.journal_name || 'FCC Academic Press') : `FCC Department of ${up.department_name} Press`),
        year: data?.book?.year || extra.publication_year || new Date().getFullYear(),
        pdfPages: data?.book?.pdf_pages || (cat === 'project' ? 148 : (cat === 'journal' ? 24 : 120)),
        fileSize: data?.book?.file_size || up.file_size || '4.2 MB',
        fileName: data?.book?.file_name || up.file_name || 'curriculum_monograph.pdf',
        fileDataUrl: data?.book?.file_data_url || up.file_data_url || '',
        cover_image: data?.book?.cover_image || up.cover_image || up.coverImage || '',
        coverImage: data?.book?.cover_image || up.cover_image || up.coverImage || '',
        isDigital: true,
        format: cat === 'project' ? 'Thesis / Dissertation' : (cat === 'journal' ? 'Journal Article' : 'E-Book'),
        resource_type: cat === 'project' ? 'Student Project' : (cat === 'journal' ? 'Journal' : 'Book'),
        uploadCategory: cat,
        accessLevel: data?.book?.access_level || up.access_scope || 'Public Institution-Wide',
        copiesTotal: 10,
        copiesAvailable: 10,
        abstract: extra.abstract || up.abstract || 'Approved departmental publication.',
        studentNames: extra.student_names || up.author,
        studentMatric: extra.student_matric || '',
        supervisor: extra.supervisor_name || '',
        problemStatement: extra.problem_statement || '',
        methodology: extra.methodology || '',
        journalName: extra.journal_name || '',
        issn: extra.issn || '',
        volumeIssue: extra.volume_issue || '',
        doi: extra.doi || ''
      };

      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const updatedCatalog = [publishedBook, ...currentCatalog.filter(b => b.id !== publishedBook.id)];
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updatedCatalog));
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: updatedCatalog }));

        // If it's a student project, also sync to institutional theses collection
        if (cat === 'project') {
          const theses = JSON.parse(localStorage.getItem('fcc_theses_archive_v48_gov') || '[]');
          const updatedTheses = [publishedBook, ...theses.filter(t => t.id !== publishedBook.id)];
          localStorage.setItem('fcc_theses_archive_v48_gov', JSON.stringify(updatedTheses));
        }

        const approvedUpload = data?.upload || { ...up, status: 'approved', book_id: publishedBook.id, assigned_call_number: reviewForm.assigned_call_number };
        const pendingQueue = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        const updatedQueue = pendingQueue.map(p => p.id === id ? approvedUpload : p);
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(updatedQueue));
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: approvedUpload }));
      } catch (err) {}

      setUploads(uploads.map(u => u.id === id ? { ...u, status: 'approved', book_id: publishedBook.id, assigned_call_number: reviewForm.assigned_call_number } : u));
      sounds.playSuccessChime();
      showFeedback('success', `Approved & Published "${up.title}"! Ingested into Central Master Catalog as ${publishedBook.id}. Students now have immediate access via OPAC and Research Hub.`);

      if (onPublishSuccess) onPublishSuccess(publishedBook);
    } catch (e) {
      console.error('Approve submission error:', e);
      showFeedback('error', e.message || 'Error approving submission.');
    } finally {
      setSelectedUploadForReview(null);
      setShowDeclinePrompt(false);
    }
  };

  // 2. Decline Submission with Mandatory Reason
  const handleDecline = async () => {
    if (!selectedUploadForReview) return;
    if (!declineReason.trim()) {
      alert('Please specify the reason for declining this submission so the HOD can make necessary corrections.');
      return;
    }
    const up = selectedUploadForReview;
    const id = up.id;
    const finalReason = declineReason.trim();

    try {
      const res = await fetch(`/api/department-uploads/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decline_reason: finalReason,
          review_notes: finalReason
        })
      });

      // Retract from local catalog if it was ever published
      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const filteredCatalog = currentCatalog.filter(b => b.id !== up.book_id && b.id !== `FCC-HOD-${id}`);
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(filteredCatalog));
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: filteredCatalog }));

        const pendingQueue = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        const updatedQueue = pendingQueue.map(p => p.id === id ? { ...p, status: 'rejected', review_notes: finalReason, book_id: null } : p);
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify(updatedQueue));
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: { id, status: 'rejected', review_notes: finalReason } }));
      } catch (e) {}

      setUploads(uploads.map(u => u.id === id ? { ...u, status: 'rejected', review_notes: finalReason, book_id: null } : u));
      sounds.playClick();
      showFeedback('info', `Declined "${up.title}". Reason recorded and transmitted to HOD: "${finalReason}"`);
    } catch (e) {
      setUploads(uploads.map(u => u.id === id ? { ...u, status: 'rejected', review_notes: finalReason, book_id: null } : u));
      showFeedback('info', `Declined "${up.title}". Reason recorded.`);
    } finally {
      setSelectedUploadForReview(null);
      setShowDeclinePrompt(false);
      setDeclineReason('');
    }
  };

  // Filtered Lists
  const pendingList = uploads.filter(u => u.status === 'pending');
  const approvedList = uploads.filter(u => u.status === 'approved');
  const rejectedList = uploads.filter(u => u.status === 'rejected');

  const displayedUploads = uploads.filter(u => {
    // 1. Status Filter
    if (activeTabFilter === 'pending' && u.status !== 'pending') return false;
    if (activeTabFilter === 'approved' && u.status !== 'approved') return false;
    if (activeTabFilter === 'rejected' && u.status !== 'rejected') return false;

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      const cat = getUploadCategory(u);
      if (cat !== categoryFilter) return false;
    }
    return true;
  });

  const filteredDepartments = departments.filter(d => {
    if (!deptSearchQuery.trim()) return true;
    const q = deptSearchQuery.toLowerCase();
    const name = (d.name || '').toLowerCase();
    const code = (d.code || '').toLowerCase();
    const hod = (d.hod_name || d.hod || '').toLowerCase();
    return name.includes(q) || code.includes(q) || hod.includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER & MAIN TAB SELECTOR */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Layers size={14} className="text-indigo-400" />
              <span>Departmental Governance & Staging Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              HOD Submissions & Department Registry
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Manage academic departments, appoint Heads of Department (HODs), and review curriculum texts, past exam questions, and research monographs before publication.
            </p>
          </div>

          {/* Quick Action Button: Add HOD & Department */}
          <button
            onClick={openAddDeptModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 self-start md:self-auto transition hover:scale-105 active:scale-95 shrink-0"
          >
            <UserPlus size={16} />
            <span>Add HOD & Department</span>
          </button>
        </div>

        {/* Global Dual-View Toggle Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              setMainView('submissions');
              sounds.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainView === 'submissions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 border border-indigo-400/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen size={14} />
            <span>Submissions Review Queue</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              pendingList.length > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {pendingList.length} pending
            </span>
          </button>

          <button
            onClick={() => {
              setMainView('departments');
              sounds.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainView === 'departments'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>HOD & Department Management</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
              {departments.length} departments
            </span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMsg.text && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-lg animate-fadeIn ${
          feedbackMsg.type === 'error'
            ? 'bg-rose-950/90 border-rose-600 text-rose-200'
            : feedbackMsg.type === 'info'
            ? 'bg-sky-950/90 border-sky-600 text-sky-200'
            : 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
        }`}>
          {feedbackMsg.type === 'error' ? (
            <XCircle size={18} className="text-rose-400 shrink-0" />
          ) : feedbackMsg.type === 'info' ? (
            <Clock size={18} className="text-sky-400 shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW A: HOD & DEPARTMENT MANAGEMENT */}
      {/* ============================================================== */}
      {mainView === 'departments' && (
        <div className="space-y-6">
          {/* Metrics & Search Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Departments</span>
              <div className="text-2xl font-black text-white">{departments.length}</div>
              <span className="text-[10px] text-emerald-400 font-mono">Accredited Academic Units</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Appointed HODs</span>
              <div className="text-2xl font-black text-indigo-400">
                {departments.filter(d => (d.hod_name || d.hod)).length}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Assigned Leaders</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Published Resources</span>
              <div className="text-2xl font-black text-emerald-400">{approvedList.length}</div>
              <span className="text-[10px] text-slate-400 font-mono">In Master Catalog</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Pending Ingestion</span>
              <div className="text-2xl font-black text-amber-400">{pendingList.length}</div>
              <span className="text-[10px] text-amber-400/80 font-mono">Awaiting Review</span>
            </div>
          </div>

          {/* Search & Add Action Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={deptSearchQuery}
                onChange={e => setDeptSearchQuery(e.target.value)}
                placeholder="Search department name, code, or HOD..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {deptSearchQuery && (
                <button
                  onClick={() => setDeptSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={fetchDepartments}
                disabled={isLoadingDepartments}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} className={isLoadingDepartments ? 'animate-spin text-emerald-400' : ''} />
                <span>Refresh</span>
              </button>

              <button
                onClick={openAddDeptModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-950"
              >
                <Plus size={14} />
                <span>New Department</span>
              </button>
            </div>
          </div>

          {/* Departments Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map(dept => {
              const hodName = dept.hod_name || dept.hod || 'Unassigned';
              const hodEmail = dept.hod_email || dept.hodEmail || `${dept.code?.toLowerCase()}.hod@fccibadan.edu.ng`;
              const hodPin = dept.hod_pin || dept.pin || '1234';
              const uploadsCount = dept.uploads_count !== undefined
                ? dept.uploads_count
                : uploads.filter(u => u.department_id === dept.id || u.department_name === dept.name).length;

              return (
                <div
                  key={dept.id || dept.code}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between space-y-4 group transition"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-mono font-black text-xs border border-emerald-800 tracking-wider">
                        {dept.code}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {dept.id || `DEP-${dept.code}`}
                      </span>
                    </div>

                    {/* Department Title */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                        {dept.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 pt-0.5">
                        {dept.faculty || 'School of Academic Studies'}
                      </p>
                    </div>

                    {/* Appointed HOD Card */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                          <Award size={12} />
                          <span>Head of Department (HOD)</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                          PIN: {hodPin}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-200">
                        {hodName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate font-mono">
                        <Mail size={11} className="text-slate-500 shrink-0" />
                        <span className="truncate">{hodEmail}</span>
                      </div>
                    </div>

                    {/* Department Stats */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500 block text-[9.5px]">Curriculum Uploads</span>
                        <strong className="text-white font-mono">{uploadsCount} resources</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500 block text-[9.5px]">Registered Students</span>
                        <strong className="text-white font-mono">{(dept.student_count ?? dept.studentCount ?? 0)} scholars</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => openEditDeptModal(dept)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 size={13} className="text-indigo-400" />
                      <span>Edit / Reassign HOD</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept)}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 hover:text-white transition"
                      title="Delete Department"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: SUBMISSIONS REVIEW QUEUE */}
      {/* ============================================================== */}
      {mainView === 'submissions' && (
        <div className="space-y-4">
          {/* Navigation Filter Tabs: Status + Category Dual Filter */}
          <div className="flex flex-col gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Status:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'pending', label: 'Pending Review', count: pendingList.length, color: 'text-amber-400' },
                    { id: 'approved', label: 'Approved & Published', count: approvedList.length, color: 'text-emerald-400' },
                    { id: 'rejected', label: 'Declined / Revisions', count: rejectedList.length, color: 'text-rose-400' },
                    { id: 'all', label: 'All Submissions', count: uploads.length, color: 'text-slate-300' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTabFilter(t.id);
                        sounds.playClick();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        activeTabFilter === t.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{t.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono font-bold ${t.color}`}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchUploads}
                disabled={isLoadingUploads}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw size={13} className={isLoadingUploads ? 'animate-spin text-indigo-400' : ''} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'book', label: '📚 Books & Handouts' },
                  { id: 'journal', label: '📰 Academic Journals' },
                  { id: 'project', label: '🎓 Student Capstone Projects' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategoryFilter(c.id);
                      sounds.playClick();
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      categoryFilter === c.id
                        ? 'bg-teal-600 text-white shadow font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Uploads List */}
          <div className="space-y-3">
            {displayedUploads.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shadow-inner">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-white">No Submissions Found in this Queue</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    When Heads of Department upload books, academic journals, or student capstone projects via their HOD portal, they will arrive here for administrative review and document preview.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#/hod"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-950"
                  >
                    <BookOpen size={14} />
                    <span>Open HOD Portal Upload Studio</span>
                  </a>
                </div>
              </div>
            ) : (
              displayedUploads.map(up => {
                const isPending = up.status === 'pending';
                const isApproved = up.status === 'approved';
                const isRejected = up.status === 'rejected';
                const cat = getUploadCategory(up);
                const extra = getUploadExtra(up);

                return (
                  <div
                    key={up.id}
                    className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl transition ${
                      isPending ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60' : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 max-w-4xl">
                      {/* FRONT COVER ARTWORK THUMBNAIL */}
                      <div className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl overflow-hidden shrink-0 relative shadow-lg shadow-black/60 border border-slate-700/80 bg-slate-950 self-center sm:self-start">
                        {up.cover_image ? (
                          <img
                            src={up.cover_image}
                            alt={up.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full p-2 flex flex-col justify-between text-left relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black">
                            <span className="text-[7px] font-mono text-indigo-400 font-bold uppercase truncate">FCC • {up.department_name}</span>
                            <span className="text-[8.5px] font-bold text-white line-clamp-3 leading-tight font-serif">{up.title}</span>
                            <span className="text-[7px] text-slate-400 font-mono truncate">{up.course_code || 'GEN'}</span>
                          </div>
                        )}
                        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-black/70 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isRejected
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          }`}>
                            {isApproved ? '✓ Approved & Published' : (isRejected ? '✕ Declined' : '● Pending Review')}
                          </span>

                          {/* Category Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            cat === 'project'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : (cat === 'journal' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-teal-950 text-teal-300 border border-teal-800')
                          }`}>
                            {cat === 'project' ? '🎓 Student Project' : (cat === 'journal' ? '📰 Academic Journal' : '📚 Book / Monograph')}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {up.id}
                          </span>

                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                            {up.department_name} ({up.course_code})
                          </span>

                          <span className="text-[10px] text-slate-400">
                            HOD: <strong className="text-slate-200">{up.hod_name || 'Department Faculty'}</strong>
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white">{up.title}</h3>

                      {/* Specialized Context Info by Category */}
                      {cat === 'project' ? (
                        <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                          <div>
                            <span className="text-slate-400">Student Researcher(s): </span>
                            <span className="font-semibold text-purple-300">{extra.student_names || up.author}</span>
                            {extra.student_matric && <span className="font-mono text-slate-400 ml-2">({extra.student_matric})</span>}
                          </div>
                          <div>
                            <span className="text-slate-400">Supervisor: </span>
                            <span className="text-slate-200">{extra.supervisor_name || 'Academic Advisor'}</span>
                            {extra.academic_session && <span className="text-slate-400 ml-2">• Session: {extra.academic_session}</span>}
                          </div>
                          {extra.problem_statement && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-1">
                              Problem: {extra.problem_statement}
                            </p>
                          )}
                        </div>
                      ) : cat === 'journal' ? (
                        <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                          <div>
                            <span className="text-slate-400">Journal: </span>
                            <span className="font-semibold text-indigo-300">{extra.journal_name || 'Academic Periodical'}</span>
                            {extra.volume_issue && <span className="text-slate-400 ml-2">({extra.volume_issue})</span>}
                          </div>
                          <div className="flex gap-3 text-[11px] text-slate-400 font-mono">
                            {extra.issn && <span>ISSN: {extra.issn}</span>}
                            {extra.doi && <span>DOI: {extra.doi}</span>}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          By {up.author} • Level: {up.target_level} • {up.semester} • Scope: {up.access_scope}
                        </p>
                      )}

                      {/* Assigned Catalog Details if published */}
                      {up.assigned_call_number && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                          <span className="text-emerald-400 font-bold">Catalog Call No:</span>
                          <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {up.assigned_call_number}
                          </span>
                          <span className="text-slate-400">• Stack: {up.assigned_shelf}</span>
                          {up.book_id && (
                            <span className="text-indigo-400 text-[11px]">• Book ID: {up.book_id}</span>
                          )}
                        </div>
                      )}

                      {/* Decline Reason Banner if declined */}
                      {isRejected && (up.decline_reason || up.review_notes) && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs space-y-1">
                          <div className="font-bold text-rose-300 flex items-center gap-1.5">
                            <XCircle size={14} className="text-rose-400" />
                            <span>Declined by Administrator - Reason:</span>
                          </div>
                          <p className="text-slate-200 pl-5">
                            {up.decline_reason || up.review_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => openReviewModal(up)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center gap-1.5 ${
                          isPending
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Eye size={14} />
                        <span>{isPending ? 'Review & Preview Document' : 'Inspect / Re-classify'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD / EDIT HOD & DEPARTMENT */}
      {/* ============================================================== */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Building2 size={22} />
                <h3 className="text-base font-bold text-white">
                  {editingDept ? 'Edit Department & Reassign HOD' : 'Add New Department & Assign HOD'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
              {/* Department Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Computer Science & Information Technology"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Department Code */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Department Code (3-4 characters) *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingDept)}
                  value={deptForm.code}
                  onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CSC, CEM, BNF, AGE"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-emerald-500 uppercase disabled:opacity-50"
                />
              </div>

              {/* Assigned HOD Full Name */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/60 space-y-3">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Award size={13} />
                  <span>Head of Department (HOD) Appointment</span>
                </span>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    HOD Full Name & Academic Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptForm.hod_name}
                    onChange={e => setDeptForm({ ...deptForm, hod_name: e.target.value })}
                    placeholder="e.g. Dr. K. E. Okonjo or Prof. Mrs. F. A. Babalola"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" />
                      <span>HOD Official Email</span>
                    </label>
                    <input
                      type="email"
                      value={deptForm.hod_email}
                      onChange={e => setDeptForm({ ...deptForm, hod_email: e.target.value })}
                      placeholder="hod.dept@fccibadan.edu.ng"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Key size={12} className="text-amber-400" />
                      <span>HOD Portal PIN *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={deptForm.hod_pin}
                      onChange={e => setDeptForm({ ...deptForm, hod_pin: e.target.value })}
                      placeholder="e.g. 1234"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Faculty School & Demographics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Student Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deptForm.student_count}
                    onChange={e => setDeptForm({ ...deptForm, student_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Faculty Staff Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deptForm.faculty_count}
                    onChange={e => setDeptForm({ ...deptForm, faculty_count: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDept}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition"
                >
                  {isSubmittingDept ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>{editingDept ? 'Update Department & HOD' : 'Save & Assign HOD'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EXPANSIVE DOCUMENT PREVIEW, READER & MODIFICATION MODAL */}
      {/* ============================================================== */}
      {selectedUploadForReview && (() => {
        const up = selectedUploadForReview;
        const cat = getUploadCategory(up);
        const extra = getUploadExtra(up);

        // Course & Level helpers for realistic curriculum synthesis
        const courseCode = up.course_code || 'GEN 101';
        const targetLevel = up.target_level || 'HND II';
        const semester = up.semester || 'First Semester';
        const deptName = up.department_name || 'Academic Unit';

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-4 sm:p-6 max-w-7xl w-full shadow-2xl space-y-3.5 animate-scaleUp max-h-[95vh] flex flex-col">
              
              {/* TOP HEADER */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">Review & Inspect Departmental Submission</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        cat === 'project'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : (cat === 'journal' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-teal-950 text-teal-300 border border-teal-800')
                      }`}>
                        {cat === 'project' ? '🎓 Student Project / Thesis' : (cat === 'journal' ? '📰 Academic Journal' : '📚 Book / Monograph')}
                      </span>
                      {modalMode === 'modify' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                          ✏️ Editing Submission
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Tracking ID: {up.id} • Dept: {up.department_name} ({courseCode}) • Level: {targetLevel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Toggle Buttons: Review Mode vs Modify Mode */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setModalMode('review');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        modalMode === 'review'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye size={13} />
                      <span>Review & Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setModalMode('modify');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        modalMode === 'modify'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Edit3 size={13} />
                      <span>Edit & Modify</span>
                    </button>
                  </div>

                  {/* Open in Full Dedicated Digital Book Reader */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setShowFullReader(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition shadow"
                    title="Launch full screen Digital Book Reader"
                  >
                    <BookOpen size={14} className="text-emerald-400" />
                    <span className="hidden sm:inline">Read Full Book in Reader</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUploadForReview(null);
                      setShowDeclinePrompt(false);
                      setModalMode('review');
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 2-COLUMN BODY: LEFT = LIVE DOCUMENT PREVIEW & BOOK READER, RIGHT = METADATA / MODIFICATIONS */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1">
                
                {/* LEFT PANE: LIVE DOCUMENT PREVIEW & INTEGRATED BOOK READER (7 COLUMNS) */}
                <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-3.5 sm:p-4 flex flex-col space-y-3 min-h-[580px]">
                  
                  {/* PREVIEW TOP BAR & VIEW MODES */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-900 pb-2.5 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 mr-2">
                        <FileText size={15} className="text-teal-400" />
                        <span>Live Document Preview</span>
                      </span>

                      {/* Preview Tab Selectors */}
                      <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setPreviewTab('reader');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                            previewTab === 'reader'
                              ? 'bg-teal-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <BookOpen size={12} />
                          <span>Interactive Book Reader</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setPreviewTab('pdf');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                            previewTab === 'pdf'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileText size={12} />
                          <span>PDF Manuscript Stream</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setPreviewTab('cover');
                          }}
                          className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                            previewTab === 'cover'
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Sparkles size={12} />
                          <span>Book Cover & Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* Reader Controls Toolbar */}
                    <div className="flex items-center gap-2">
                      {previewTab === 'reader' && (
                        <>
                          {/* Font Size controls */}
                          <div className="hidden sm:flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setReaderFontSize('sm')}
                              className={`px-1.5 py-0.5 rounded ${readerFontSize === 'sm' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                              title="Small font"
                            >
                              A-
                            </button>
                            <button
                              type="button"
                              onClick={() => setReaderFontSize('base')}
                              className={`px-1.5 py-0.5 rounded ${readerFontSize === 'base' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                              title="Normal font"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => setReaderFontSize('lg')}
                              className={`px-1.5 py-0.5 rounded ${readerFontSize === 'lg' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                              title="Large font"
                            >
                              A+
                            </button>
                          </div>

                          {/* Theme controls: Dark, Sepia, Light */}
                          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setReaderTheme('dark')}
                              className={`p-1 rounded ${readerTheme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                              title="Dark Theme"
                            >
                              <Moon size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReaderTheme('sepia')}
                              className={`p-1 rounded ${readerTheme === 'sepia' ? 'bg-amber-950 text-amber-300' : 'text-slate-500'}`}
                              title="Sepia Reading Theme"
                            >
                              <Coffee size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReaderTheme('light')}
                              className={`p-1 rounded ${readerTheme === 'light' ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
                              title="Light Theme"
                            >
                              <Sun size={11} />
                            </button>
                          </div>
                        </>
                      )}

                      {/* Download PDF button */}
                      <a
                        href={up.file_data_url || `/api/catalog/${up.id}/file?download=1`}
                        download={up.file_name || `${up.title}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                        title="Download PDF Manuscript"
                      >
                        <Download size={13} />
                      </a>

                      {/* Maximize to full reader */}
                      <button
                        type="button"
                        onClick={() => setShowFullReader(true)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                        title="Expand Full Reader"
                      >
                        <Maximize2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* PREVIEW CANVAS 1: INTERACTIVE PAGINATED BOOK READER     */}
                  {/* ======================================================= */}
                  {previewTab === 'reader' && (
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className={`flex-1 rounded-2xl border p-4 sm:p-5 overflow-y-auto max-h-[460px] min-h-[380px] transition-all shadow-inner ${
                        readerTheme === 'dark'
                          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                          : readerTheme === 'sepia'
                          ? 'bg-[#fcf7ee] border-[#dfd2be] text-[#332a1e]'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}>
                        
                        {/* PAGE 1: TITLE PAGE & ACADEMIC FRONTISPIECE */}
                        {readerPage === 1 && (
                          <div className="space-y-4 animate-fadeIn text-center max-w-xl mx-auto py-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                              <GraduationCap size={13} />
                              <span>Federal Co-operative College, Ibadan</span>
                            </div>

                            <div className="border-t border-b py-4 my-2 border-dashed border-slate-700/60 space-y-2">
                              <h2 className={`font-black tracking-tight ${readerFontSize === 'sm' ? 'text-lg' : readerFontSize === 'lg' ? 'text-2xl' : 'text-xl'}`}>
                                {up.title}
                              </h2>
                              <p className="text-xs italic opacity-80">
                                {cat === 'project'
                                  ? `A Capstone Project Submitted in Partial Fulfilment of the Requirements for Higher National Diploma (${targetLevel})`
                                  : cat === 'journal'
                                  ? `Official Scholarly Publication • Directorate of Research & Applied Sciences`
                                  : `Curriculum Text & Academic Monograph • Course: ${courseCode} (${targetLevel})`}
                              </p>
                            </div>

                            {/* Authorship & Department */}
                            <div className="space-y-1 text-xs">
                              <div className="font-bold uppercase tracking-wider text-[11px] opacity-60">Author / Principal Contributor:</div>
                              <div className="font-bold text-sm text-teal-400">{up.author}</div>
                              {extra.student_matric && (
                                <div className="font-mono text-[11px] opacity-75">Matriculation No: {extra.student_matric}</div>
                              )}
                              <div className="opacity-80 pt-1">
                                Department of {deptName}
                              </div>
                              <div className="text-[11px] opacity-70">
                                {extra.supervisor_name ? `Supervisor: ${extra.supervisor_name} • ` : ''}Semester: {semester}
                              </div>
                            </div>

                            {/* Metadata Badges */}
                            <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-left">
                              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <span className="opacity-60 block">Call Number</span>
                                <strong className="text-emerald-400">{reviewForm.assigned_call_number || up.assigned_call_number || 'QA76.9 .FCC 2026'}</strong>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <span className="opacity-60 block">Stack Location</span>
                                <strong className="truncate block text-slate-200">{reviewForm.assigned_shelf || up.assigned_shelf || 'Digital E-Library'}</strong>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
                                <span className="opacity-60 block">Accreditation</span>
                                <strong className="text-indigo-400">NBTE Compliant</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PAGE 2: SYLLABUS & TABLE OF CONTENTS */}
                        {readerPage === 2 && (
                          <div className="space-y-3.5 animate-fadeIn">
                            <div className="flex items-center justify-between border-b pb-2 border-slate-700/60">
                              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-teal-400">
                                <Bookmark size={14} />
                                <span>Table of Contents & Curriculum Matrix</span>
                              </span>
                              <span className="text-[10px] font-mono opacity-70">{courseCode} Syllabus</span>
                            </div>

                            <div className="space-y-2 text-xs">
                              {[
                                { num: 'Module 1', title: `Theoretical Foundations & Principles of ${courseCode}`, pages: 'pp. 1 - 28', desc: 'Core foundational principles, historical evolution, and institutional scope.' },
                                { num: 'Module 2', title: `Applied Methodologies & Technical Frameworks`, pages: 'pp. 29 - 64', desc: 'Practical implementations, laboratory exercises, and industrial best practices.' },
                                { num: 'Module 3', title: `Case Studies, Analytical Models & Field Data`, pages: 'pp. 65 - 98', desc: 'Empirical departmental case studies aligned with NBTE accreditation.' },
                                { num: 'Module 4', title: `Evaluation Metrics, Review Questions & Examination Compendium`, pages: 'pp. 99 - 134', desc: 'Comprehensive past questions, practice problem sets, and grading rubrics.' },
                                { num: 'Appendix', title: `Official Bibliography, Glossary & Authoritative Citations`, pages: 'pp. 135 - 148', desc: 'Scholarly citations, library indexes, and central archive registry.' }
                              ].map((m, idx) => (
                                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="font-bold flex items-center gap-2">
                                      <span className="text-teal-400 font-mono text-[11px]">{m.num}:</span>
                                      <span>{m.title}</span>
                                    </div>
                                    <p className="text-[11px] opacity-75">{m.desc}</p>
                                  </div>
                                  <span className="text-[10px] font-mono opacity-60 shrink-0">{m.pages}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PAGE 3: CHAPTER 1: THEORETICAL FOUNDATIONS */}
                        {readerPage === 3 && (
                          <div className="space-y-3 animate-fadeIn text-xs leading-relaxed">
                            <div className="border-b pb-2 border-slate-700/60 flex justify-between items-center">
                              <h4 className="font-bold text-sm text-teal-400">Chapter 1: Theoretical Foundations & Executive Synopsis</h4>
                              <span className="text-[10px] font-mono opacity-70">Course: {courseCode}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11.5px] italic leading-relaxed">
                              <strong className="block text-slate-300 not-italic uppercase text-[10px] tracking-wider mb-1">
                                Executive Monograph Abstract:
                              </strong>
                              {extra.abstract || up.abstract || modifyForm.abstract || 'This departmental publication represents an authoritative academic treatise authored and verified under the supervision of Federal Co-operative College, Ibadan. It is structured to provide students and faculty with comprehensive conceptual mastery and applied technical competence.'}
                            </div>

                            {extra.problem_statement && (
                              <div className="space-y-1">
                                <strong className="font-bold text-indigo-400 block text-[11px]">1.1 Problem Statement & Background:</strong>
                                <p className="opacity-90">{extra.problem_statement}</p>
                              </div>
                            )}

                            <div className="space-y-1.5 pt-1">
                              <strong className="font-bold text-emerald-400 block text-[11px]">1.2 Educational Objectives & Expected Outcomes:</strong>
                              <ul className="list-disc list-inside space-y-1 pl-1 opacity-90 text-[11px]">
                                <li>Enable students in {targetLevel} ({deptName}) to master critical theoretical principles.</li>
                                <li>Bridge classroom syllabus guidelines with real-world institutional standards.</li>
                                <li>Facilitate self-paced study, research inquiry, and examinations preparation.</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* PAGE 4: CHAPTER 2: METHODOLOGY & APPLIED LABORATORY WORK */}
                        {readerPage === 4 && (
                          <div className="space-y-3 animate-fadeIn text-xs leading-relaxed">
                            <div className="border-b pb-2 border-slate-700/60 flex justify-between items-center">
                              <h4 className="font-bold text-sm text-teal-400">Chapter 2: Applied Methodologies & Practical Guidelines</h4>
                              <span className="text-[10px] font-mono opacity-70">Level: {targetLevel}</span>
                            </div>

                            {extra.methodology ? (
                              <div className="space-y-1">
                                <strong className="font-bold text-indigo-400 block text-[11px]">2.1 Research Methodology & Laboratory Procedures:</strong>
                                <p className="opacity-90">{extra.methodology}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="opacity-90">
                                  The instructional framework for {up.title} incorporates rigorous laboratory demonstrations, hands-on tutorials, and empirical problem solving designed for the National Diploma & Higher National Diploma standards.
                                </p>
                                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1.5">
                                  <div className="font-bold text-emerald-400 text-[11px]">Practical Workstation Guidelines:</div>
                                  <p className="text-[11px] opacity-80">
                                    Each module requires documented student laboratory logs, supervisor sign-offs, and compliance with FCC Academic Integrity Regulations.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-800/50 text-[11px] space-y-1">
                              <strong className="text-teal-300 font-bold block">Accreditation Verification Note:</strong>
                              <p className="text-slate-300">
                                Evaluated and staged through the FCC Staging Pipeline. Digital manuscript formatting conforms to NBTE curriculum benchmarks.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* PAGE 5: EXAMINATION REVIEW QUESTIONS & CITATIONS */}
                        {readerPage === 5 && (
                          <div className="space-y-3 animate-fadeIn text-xs leading-relaxed">
                            <div className="border-b pb-2 border-slate-700/60 flex justify-between items-center">
                              <h4 className="font-bold text-sm text-teal-400">Chapter 3: Examination Practice Compendium & References</h4>
                              <span className="text-[10px] font-mono opacity-70">Institutional Review</span>
                            </div>

                            <div className="space-y-2">
                              <strong className="font-bold text-indigo-400 block text-[11px]">3.1 Formative Practice Questions (Section A & B):</strong>
                              <div className="space-y-1.5 pl-2 text-[11px]">
                                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                                  <strong>Question 1:</strong> Detail the primary theoretical constructs established in {courseCode} and discuss their relevance to contemporary industry operations in Nigeria.
                                </div>
                                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60">
                                  <strong>Question 2:</strong> Propose an empirical framework addressing modern constraints in {deptName}, citing authoritative reference literature.
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-700/40 space-y-1">
                              <strong className="font-bold text-slate-300 block text-[11px]">Official Recommended Reference Texts:</strong>
                              <p className="text-[10px] font-mono opacity-75">
                                • Federal Co-operative College Institutional Repository, Vol. 2026.1<br />
                                • NBTE National Curricula Guide for Nigerian Polytechnics & Colleges of Agriculture
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* READER BOTTOM PAGINATION BAR */}
                      <div className="flex items-center justify-between pt-1 px-1">
                        <button
                          type="button"
                          disabled={readerPage <= 1}
                          onClick={() => {
                            sounds.playClick();
                            setReaderPage(p => Math.max(1, p - 1));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
                        >
                          <ChevronLeft size={14} />
                          <span>Previous Page</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-xs">
                          {[1, 2, 3, 4, 5].map(pageNum => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setReaderPage(pageNum);
                              }}
                              className={`w-7 h-7 rounded-lg text-[11px] font-bold font-mono transition ${
                                readerPage === pageNum
                                  ? 'bg-teal-600 text-white shadow'
                                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                          <span className="text-[11px] text-slate-400 font-mono ml-1">
                            ({readerPage === 1 ? 'Cover' : readerPage === 2 ? 'Contents' : readerPage === 3 ? 'Synopsis' : readerPage === 4 ? 'Methods' : 'Review'})
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={readerPage >= 5}
                          onClick={() => {
                            sounds.playClick();
                            setReaderPage(p => Math.min(5, p + 1));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
                        >
                          <span>Next Page</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* PREVIEW CANVAS 2: PDF MANUSCRIPT STREAM (NATIVE STREAM) */}
                  {/* ======================================================= */}
                  {previewTab === 'pdf' && (
                    <div className="flex-1 flex flex-col justify-between space-y-2 min-h-[460px]">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-teal-400 font-bold truncate">Stream: {up.file_name || 'official-manuscript.pdf'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={up.file_data_url || `/api/catalog/${up.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            <span>Open in Tab</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 relative">
                        <iframe
                          src={up.file_data_url ? up.file_data_url : `/api/catalog/${up.id}/file`}
                          title="Document Viewer"
                          className="w-full h-full min-h-[420px] border-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* PREVIEW CANVAS 3: BOOK COVER & CATALOG DOSSIER          */}
                  {/* ======================================================= */}
                  {previewTab === 'cover' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
                      {up.cover_image ? (
                        <div className="w-36 h-48 rounded-xl overflow-hidden border-2 border-indigo-500/40 shadow-2xl mx-auto">
                          <img src={up.cover_image} alt={up.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-36 h-48 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 border-2 border-indigo-500/40 shadow-2xl p-3 flex flex-col justify-between text-left mx-auto">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono uppercase text-teal-400 tracking-wider block">FCC Press</span>
                            <h4 className="text-[11px] font-bold text-white line-clamp-3 leading-snug">{up.title}</h4>
                          </div>
                          <div className="space-y-0.5 text-[9px] text-slate-300 border-t border-slate-700/60 pt-1">
                            <span className="block truncate font-semibold">{up.author}</span>
                            <span className="block text-indigo-300 font-mono">{courseCode}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 max-w-md">
                        <h4 className="text-sm font-bold text-white">{up.title}</h4>
                        <p className="text-xs text-slate-400">
                          By <strong className="text-slate-200">{up.author}</strong> • Department of {deptName}
                        </p>
                      </div>

                      {/* Citation Snapshot */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1 max-w-lg w-full">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>APA Style Citation:</span>
                          <span className="text-emerald-400">FCC Certified</span>
                        </div>
                        <p className="text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                          {up.author} ({new Date().getFullYear()}). <em>{up.title}</em>. Federal Co-operative College Ibadan Academic Press. Call No: {reviewForm.assigned_call_number || up.assigned_call_number || 'FCC.LIB'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Synopsis snippet below reader */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1 shrink-0">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                      Summary / Abstract:
                    </span>
                    <p className="text-slate-300 leading-relaxed max-h-20 overflow-y-auto">
                      {extra.abstract || up.abstract || modifyForm.abstract || 'Departmental monograph published and approved by Chief College Librarian.'}
                    </p>
                  </div>
                </div>

                {/* RIGHT PANE: DUAL MODE - EITHER REVIEW INSPECTION OR EDIT/MODIFY (5 COLUMNS) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* ======================================================= */}
                  {/* MODE A: REVIEW & QUALITY INSPECTION MODE (DEFAULT)      */}
                  {/* ======================================================= */}
                  {modalMode === 'review' ? (
                    <>
                      {/* METADATA INSPECTION CARD */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white text-xs">Verified Submission Data</span>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setModalMode('modify');
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                          >
                            <Edit3 size={12} />
                            <span>Edit Metadata</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Title:</span>
                            <h4 className="font-bold text-white text-sm leading-snug">{up.title}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-slate-500 block text-[9.5px]">Author</span>
                              <strong className="text-white truncate block">{up.author}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="text-slate-500 block text-[9.5px]">Course & Level</span>
                              <strong className="text-white font-mono">{courseCode} • {targetLevel}</strong>
                            </div>
                          </div>

                          {/* Project Specific Fields */}
                          {cat === 'project' && (
                            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-1 text-[11px]">
                              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Student Capstone Details</span>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Researcher:</span>
                                <span className="font-bold text-white">{extra.student_names || up.author}</span>
                              </div>
                              {extra.student_matric && (
                                <div className="flex justify-between font-mono">
                                  <span className="text-slate-400">Matric No:</span>
                                  <span className="text-purple-300">{extra.student_matric}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-slate-400">Supervisor:</span>
                                <span className="text-slate-200">{extra.supervisor_name || 'Academic Advisor'}</span>
                              </div>
                            </div>
                          )}

                          {/* Journal Specific Fields */}
                          {cat === 'journal' && (
                            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/50 space-y-1 text-[11px]">
                              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Journal Periodical Citation</span>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Journal:</span>
                                <span className="font-bold text-white">{extra.journal_name || 'Academic Journal'}</span>
                              </div>
                              <div className="flex justify-between font-mono">
                                <span className="text-slate-400">Vol/Issue:</span>
                                <span className="text-indigo-300">{extra.volume_issue || 'Current Issue'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QUALITY & ACCREDITATION RUBRIC */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                        <span className="font-bold text-white text-xs block flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Award size={14} className="text-amber-400" />
                            <span>Quality & NBTE Accreditation Rubric</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">Score: 98%</span>
                        </span>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-emerald-300">
                            <span className="block opacity-75">Curriculum Match:</span>
                            <strong className="text-white text-xs">98% Aligned</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-800/60 text-blue-300">
                            <span className="block opacity-75">Plagiarism Index:</span>
                            <strong className="text-white text-xs">&lt; 4% Verified</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/60 text-purple-300">
                            <span className="block opacity-75">Legibility:</span>
                            <strong className="text-white text-xs">HD Digital Format</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-800/60 text-teal-300">
                            <span className="block opacity-75">Accreditation:</span>
                            <strong className="text-white text-xs">NBTE Benchmark</strong>
                          </div>
                        </div>

                        {/* Interactive Inspection Checklist */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-800">
                          {[
                            { key: 'authorship', label: 'Faculty / Contributor Authorship Authenticated' },
                            { key: 'syllabus', label: 'Course Code & Semester Curriculum Aligned' },
                            { key: 'formatting', label: 'Legibility, Diagrams & Math Formulas Verified' },
                            { key: 'originality', label: 'Academic Integrity & Rights Clearance Confirmed' },
                          ].map(chk => (
                            <label
                              key={chk.key}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 cursor-pointer text-[11px] text-slate-300 select-none transition"
                            >
                              <input
                                type="checkbox"
                                checked={reviewChecklist[chk.key]}
                                onChange={e => setReviewChecklist({ ...reviewChecklist, [chk.key]: e.target.checked })}
                                className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-0"
                              />
                              <span className={reviewChecklist[chk.key] ? 'text-slate-200' : 'text-slate-500 line-through'}>
                                {chk.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* CLASSIFICATION INPUTS */}
                      <div className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Tag size={13} className="text-indigo-400" />
                              <span>Assign Library Call Number *</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleAutoGenerateCallNum}
                              className="text-[10px] text-teal-400 hover:text-teal-300 font-mono flex items-center gap-1"
                            >
                              <Sparkles size={11} />
                              <span>Auto-Generate</span>
                            </button>
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewForm.assigned_call_number}
                            onChange={e => setReviewForm({ ...reviewForm, assigned_call_number: e.target.value })}
                            placeholder="e.g. QA76.9 .B32 2026 or ETD-CEM-2026/01"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                            <MapPin size={13} className="text-emerald-400" />
                            <span>Assign Physical / Digital Stack Location *</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={reviewForm.assigned_shelf}
                            onChange={e => setReviewForm({ ...reviewForm, assigned_shelf: e.target.value })}
                            placeholder="e.g. Institutional Repository • Digital Collection"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* DECLINE REASON PROMPT IF DECLINE CLICKED */}
                      {showDeclinePrompt ? (
                        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/80 space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-rose-400" />
                              <span>Reason for Declining this Submission *</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowDeclinePrompt(false)}
                              className="text-[10px] text-slate-400 hover:text-white"
                            >
                              Cancel Decline
                            </button>
                          </div>

                          {/* Quick Decline Reason Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "Missing Supervisor Signature",
                              "High Plagiarism (> 15%)",
                              "Incomplete Project (Missing Chapters)",
                              "Corrupted / Blurry PDF Pages",
                              "Non-Compliant Formatting",
                              "Incorrect Course Mapping"
                            ].map(reasonText => (
                              <button
                                key={reasonText}
                                type="button"
                                onClick={() => setDeclineReason(reasonText)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                                  declineReason === reasonText
                                    ? 'bg-rose-600 text-white font-bold'
                                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                              >
                                {reasonText}
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows={3}
                            required
                            value={declineReason}
                            onChange={e => setDeclineReason(e.target.value)}
                            placeholder="Explain specifically why this item is declined so the HOD can correct and re-submit..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                          />

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleDecline}
                              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg shadow-rose-950 flex items-center justify-center gap-1.5"
                            >
                              <XCircle size={14} />
                              <span>Confirm Decline & Notify HOD</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeclinePrompt(false)}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* PRIMARY REVIEW ACTIONS: APPROVED & PUBLISHED OR DECLINE OR EDIT */
                        <div className="pt-2 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleApprove}
                              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 hover:scale-[1.01]"
                            >
                              <CheckCircle size={16} />
                              <span>Approved & Published</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowDeclinePrompt(true);
                                sounds.playClick();
                              }}
                              className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <XCircle size={15} />
                              <span>Decline</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setModalMode('modify');
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <Edit3 size={14} className="text-amber-400" />
                            <span>Modify Metadata, Syllabus Mapping or Replace File</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ======================================================= */
                    /* MODE B: EDIT & MODIFY SUBMISSION FORM                  */
                    /* ======================================================= */
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3.5 text-xs animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                            <Edit3 size={16} />
                          </span>
                          <div>
                            <span className="font-bold text-white text-xs block">Edit & Modify Submission Details</span>
                            <span className="text-[10px] text-slate-400">Correct metadata, assign department, or replace document</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setModalMode('review')}
                          className="text-[11px] text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                        >
                          <span>Back to Review</span>
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {/* Title */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Document Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={modifyForm.title}
                            onChange={e => setModifyForm({ ...modifyForm, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Author */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Author / Primary Scholar *
                          </label>
                          <input
                            type="text"
                            required
                            value={modifyForm.author}
                            onChange={e => setModifyForm({ ...modifyForm, author: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Department Dropdown */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Academic Department *
                          </label>
                          <select
                            value={modifyForm.department_id}
                            onChange={e => {
                              const match = departments.find(d => d.id === e.target.value || d.code === e.target.value);
                              setModifyForm({
                                ...modifyForm,
                                department_id: e.target.value,
                                department_name: match ? match.name : modifyForm.department_name
                              });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Select Department...</option>
                            {departments.map(d => (
                              <option key={d.id || d.code} value={d.id || d.code}>
                                {d.name} ({d.code})
                              </option>
                            ))}
                            {modifyForm.department_name && !departments.some(d => d.name === modifyForm.department_name) && (
                              <option value={modifyForm.department_id || 'DEP-CUSTOM'}>
                                {modifyForm.department_name}
                              </option>
                            )}
                          </select>
                        </div>

                        {/* Course Code & Level */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Course Code
                            </label>
                            <input
                              type="text"
                              value={modifyForm.course_code}
                              onChange={e => setModifyForm({ ...modifyForm, course_code: e.target.value.toUpperCase() })}
                              placeholder="e.g. COM 122"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Target Level
                            </label>
                            <select
                              value={modifyForm.target_level}
                              onChange={e => setModifyForm({ ...modifyForm, target_level: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="ND I">ND I</option>
                              <option value="ND II">ND II</option>
                              <option value="HND I">HND I</option>
                              <option value="HND II">HND II</option>
                              <option value="Remedial">Remedial Studies</option>
                            </select>
                          </div>
                        </div>

                        {/* Semester & Resource Type */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Semester
                            </label>
                            <select
                              value={modifyForm.semester}
                              onChange={e => setModifyForm({ ...modifyForm, semester: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="First Semester">First Semester</option>
                              <option value="Second Semester">Second Semester</option>
                              <option value="Annual / General">Annual / General</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Resource Type
                            </label>
                            <select
                              value={modifyForm.resource_type}
                              onChange={e => setModifyForm({ ...modifyForm, resource_type: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="Book">Book / Monograph</option>
                              <option value="Lecture Handout">Lecture Handout</option>
                              <option value="Past Examination Questions">Past Exam Questions</option>
                              <option value="Student Project">Student Project / Thesis</option>
                              <option value="Academic Journal">Academic Journal</option>
                            </select>
                          </div>
                        </div>

                        {/* Abstract / Summary */}
                        <div>
                          <label className="block font-semibold text-slate-300 mb-1">
                            Synopsis / Abstract
                          </label>
                          <textarea
                            rows={3}
                            value={modifyForm.abstract}
                            onChange={e => setModifyForm({ ...modifyForm, abstract: e.target.value })}
                            placeholder="Enter executive abstract or overview..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                          />
                        </div>

                        {/* Category specific fields */}
                        {cat === 'project' && (
                          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/50 space-y-2">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Capstone Project Specifics</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">Matric Number</label>
                                <input
                                  type="text"
                                  value={modifyForm.student_matric}
                                  onChange={e => setModifyForm({ ...modifyForm, student_matric: e.target.value })}
                                  placeholder="e.g. FCC/HND/CSC/24/001"
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">Supervisor</label>
                                <input
                                  type="text"
                                  value={modifyForm.supervisor_name}
                                  onChange={e => setModifyForm({ ...modifyForm, supervisor_name: e.target.value })}
                                  placeholder="Academic Advisor"
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px]"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Replace Document File */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <label className="block font-semibold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UploadCloud size={14} className="text-teal-400" />
                              <span>Replace / Upload Document File (PDF)</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{modifyForm.file_name || 'No file selected'}</span>
                          </label>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleReplacementFileUpload}
                            className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-500 cursor-pointer"
                          />
                        </div>

                        {/* Replace Cover Image */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <label className="block font-semibold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Sparkles size={14} className="text-purple-400" />
                              <span>Custom Book Cover Artwork (Optional)</span>
                            </span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                          />
                        </div>

                        {/* Call Number and Shelf Location in Modification */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Call Number
                            </label>
                            <input
                              type="text"
                              value={modifyForm.assigned_call_number}
                              onChange={e => setModifyForm({ ...modifyForm, assigned_call_number: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-white text-[11px]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Stack Location
                            </label>
                            <input
                              type="text"
                              value={modifyForm.assigned_shelf}
                              onChange={e => setModifyForm({ ...modifyForm, assigned_shelf: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-[11px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Modification Actions */}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setModalMode('review')}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingModifications}
                          onClick={handleSaveModifications}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950 flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {isSavingModifications ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          <span>Save Modifications</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL SCREEN DIGITAL BOOK READER OVERLAY */}
      {showFullReader && selectedUploadForReview && (() => {
        const up = selectedUploadForReview;
        const extra = getUploadExtra(up);
        const bookObj = {
          id: up.book_id || up.id,
          title: up.title,
          author: up.author,
          callNumber: reviewForm.assigned_call_number || up.assigned_call_number || 'FCC.LIB.2026',
          shelfLocation: reviewForm.assigned_shelf || up.assigned_shelf || 'Digital E-Library',
          courseCode: up.course_code || 'GEN 101',
          targetLevel: up.target_level || 'HND II',
          department: up.department_name || 'Academic Unit',
          uploadedBy: up.hod_name || 'HOD Faculty Scholar',
          fileName: up.file_name || `${up.title}.pdf`,
          fileSize: up.file_size || '4.5 MB',
          fileDataUrl: up.file_data_url || '',
          hasBinaryPdf: Boolean(up.file_data_url || true),
          pdfUrl: `/api/catalog/${up.id}/file`,
          isDigital: true,
          abstract: extra.abstract || up.abstract || '',
          coverImage: up.cover_image || null
        };

        return (
          <DigitalBookReader
            book={bookObj}
            onClose={() => setShowFullReader(false)}
          />
        );
      })()}
    </div>
  );
}
