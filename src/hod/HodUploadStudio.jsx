import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, CheckCircle, Clock, AlertCircle, BookOpen,
  Send, Sparkles, Building2, Layers, ShieldCheck, Tag, Copy,
  Check, ArrowRight, Eye, RefreshCw, FileUp, Hash, Library,
  DollarSign, Barcode, Search, AlertTriangle, HelpCircle, Lock,
  Globe, Shield, BookCheck, Bookmark, ChevronRight
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { navigateTo, copyToClipboardWithFeedback } from '../utils/router';
import { sounds } from '../utils/soundEffects';
import { analyzeUploadedPdf } from '../utils/pdfDeepAnalyzer';
import PdfAnalysisInspector from '../common/PdfAnalysisInspector';

export default function HodUploadStudio({ user, onUploadSuccess }) {
  // Mode: 'digital' (Handout, Past Exam, Thesis) vs 'physical' (Acquisition Request for Stacks)
  const [ingestionMode, setIngestionMode] = useState('digital');

  // PDF Deep Analysis States
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFileObj, setSelectedFileObj] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: user?.name || 'Department Faculty Academic Board',
    department_id: user?.department_id || 'DEP-CEM',
    department_name: user?.department_name || 'Co-operative Economics & Management',
    course_code: user?.department_code === 'CSC' ? 'CSC 312' : (user?.department_code === 'BNF' ? 'BNF 211' : 'CEM 411'),
    target_level: 'HND II',
    semester: 'First Semester',
    resource_type: 'Lecture Handout',
    access_scope: 'Restricted to Department Students Only',
    file_name: '',
    file_size: '',
    file_data_url: '',
    abstract: '',
    keywords: '',
    // Physical Acquisition specific
    isbn: '',
    publisher: '',
    estimated_cost: '15000',
    requested_copies: 5,
    vendor_suggestion: 'TETFUND Academic Books Depository'
  });

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpIsbn, setIsLookingUpIsbn] = useState(false);
  const [isbnLookupSuccess, setIsbnLookupSuccess] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [watermarkProtection, setWatermarkProtection] = useState(true);
  const fileInputRef = useRef(null);

  // Department Courses Presets
  const departmentCourseMap = {
    CEM: ['CEM 111', 'CEM 201', 'CEM 311', 'CEM 411', 'CEM 412', 'CEM 423'],
    CSC: ['CSC 101', 'CSC 201', 'CSC 301', 'CSC 312', 'CSC 401', 'CSC 415'],
    BNF: ['BNF 101', 'BNF 211', 'BNF 301', 'BNF 315', 'BNF 405', 'BNF 420'],
    AGR: ['AGR 101', 'AGR 202', 'AGR 304', 'AGR 315', 'AGR 401', 'AGR 410'],
    BAM: ['BAM 101', 'BAM 212', 'BAM 301', 'BAM 314', 'BAM 410', 'BAM 422']
  };

  const currentCourses = departmentCourseMap[user?.department_code || 'CEM'] || ['GEN 101', 'GEN 201'];

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setSelectedFileObj(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);

    // Initial basic state
    setFormData(prev => ({
      ...prev,
      file_name: file.name,
      file_size: `${sizeInMb} MB`
    }));

    // Trigger Deep PDF Analysis if file is a PDF
    if (file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf')) {
      setIsAnalyzingPdf(true);
      setAnalysisProgress(30);
      sounds.playClick();

      try {
        const progressTimer = setInterval(() => {
          setAnalysisProgress(p => (p < 85 ? p + 20 : p));
        }, 120);

        const analysis = await analyzeUploadedPdf(file, {
          defaultDeptCode: user?.department_code || 'CEM'
        });

        clearInterval(progressTimer);
        setAnalysisProgress(100);
        setAnalysisResult(analysis);

        // Auto-insert all necessary metadata extracted from PDF
        if (analysis.success && analysis.extracted) {
          const ext = analysis.extracted;
          setFormData(prev => ({
            ...prev,
            title: ext.title || prev.title,
            author: ext.author || prev.author,
            course_code: ext.courseCode || prev.course_code,
            target_level: ext.targetLevel || prev.target_level,
            semester: ext.semester || prev.semester,
            resource_type: ext.resourceType || prev.resource_type,
            abstract: ext.abstract || prev.abstract,
            keywords: ext.keywords || prev.keywords,
            isbn: ext.isbn || prev.isbn,
            file_name: file.name,
            file_size: `${sizeInMb} MB`
          }));
          sounds.playSuccessChime();
        }
      } catch (err) {
        console.error('PDF Deep Analysis error:', err);
      } finally {
        setTimeout(() => {
          setIsAnalyzingPdf(false);
        }, 400);
      }
    } else {
      // Fallback for non-PDF
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
    }

    // Generate preview
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData(prev => ({
        ...prev,
        file_data_url: uploadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
    sounds.playClick();
  };

  const handleReAnalyze = () => {
    if (selectedFileObj) {
      handleFileSelected(selectedFileObj);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
  };

  // Preset Auto-fill
  const applyPreset = (type) => {
    sounds.playClick();
    const dept = user?.department_code || 'CEM';
    if (type === 'past_questions') {
      setIngestionMode('digital');
      setFormData(prev => ({
        ...prev,
        title: `${dept} 411: Quantitative Econometric Methods Past Examination Compendium (2020-2025)`,
        author: `Departmental Examination Committee (${user?.department_name || 'Co-op Economics'})`,
        course_code: dept === 'CSC' ? 'CSC 312' : `${dept} 411`,
        target_level: 'HND II',
        semester: 'First Semester',
        resource_type: 'Past Exam Questions',
        access_scope: 'Restricted to Department Students Only',
        file_name: `${dept.toLowerCase()}411_past_questions_compendium.pdf`,
        file_size: '4.8 MB',
        abstract: 'Comprehensive past examination papers and detailed question breakdowns covering 5 consecutive academic sessions for student revision.',
        keywords: 'past questions, econometrics, examinations, HND II, revisions'
      }));
    } else if (type === 'handout') {
      setIngestionMode('digital');
      setFormData(prev => ({
        ...prev,
        title: `${dept} 311: Cooperative Enterprise Accounting & Financial Auditing Lecture Manual`,
        author: user?.name || 'Dr. Mrs. F. A. Babalola',
        course_code: dept === 'CSC' ? 'CSC 301' : `${dept} 311`,
        target_level: 'HND I',
        semester: 'First Semester',
        resource_type: 'Lecture Handout',
        access_scope: 'Restricted to Department Students Only',
        file_name: `${dept.toLowerCase()}311_lecture_handout_complete.pdf`,
        file_size: '6.2 MB',
        abstract: 'Official lecture notes, course syllabus alignment, weekly tutorial sheets, and case study assignments for the semester.',
        keywords: 'lecture notes, auditing, financial statements, syllabus'
      }));
    } else if (type === 'thesis') {
      setIngestionMode('digital');
      setFormData(prev => ({
        ...prev,
        title: 'Appraisal of Micro-Credit Disbursement Efficiency in Farmers Multi-Purpose Cooperatives',
        author: 'Adeyemi, Samuel T. & Ogundipe, Blessing (HND Candidates)',
        course_code: `${dept} 420`,
        target_level: 'HND II',
        semester: 'Second Semester',
        resource_type: 'Capstone Project / Dissertation',
        access_scope: 'Public Institution-Wide',
        file_name: 'adeyemi_ogundipe_capstone_2024.pdf',
        file_size: '8.4 MB',
        abstract: 'Empirical survey assessing credit repayment rates, liquidity ratios, and capital adequacy across 45 agrarian cooperatives in Oyo State.',
        keywords: 'microcredit, cooperative management, capstone, thesis'
      }));
    } else if (type === 'physical') {
      setIngestionMode('physical');
      setFormData(prev => ({
        ...prev,
        title: 'Modern Principles of Agricultural Cooperative Banking and Risk Hedging',
        author: 'Prof. Adebayo O. Adeleke & Dr. K. M. Bello',
        course_code: `${dept} 315`,
        target_level: 'HND I',
        semester: 'First Semester',
        resource_type: 'Physical Book Acquisition Request',
        access_scope: 'Public Institution-Wide',
        file_name: 'acquisition_order_req.pdf',
        file_size: 'Physical Hardcover Book',
        isbn: '978-0198826729',
        publisher: 'Oxford Academic Press / West Africa Reprints',
        requested_copies: 10,
        estimated_cost: '35000',
        vendor_suggestion: 'University Booksellers Nigeria / TETFUND Stack Procurement',
        abstract: 'Essential reference text recommended for the revised NBTE cooperative curriculum. 10 hardcopy volumes requested for Stack 2 reserve shelf.',
        keywords: 'physical book, acquisition, textbook, curriculum text'
      }));
    }
  };

  // Open Library / Google Books Free ISBN Metadata Harvester
  const handleIsbnAutoLookup = async () => {
    if (!formData.isbn.trim()) {
      alert('Please enter an ISBN (e.g. 9780198826729 or 9780262033848) to auto-fetch metadata');
      return;
    }
    setIsLookingUpIsbn(true);
    setIsbnLookupSuccess(false);

    try {
      const cleanIsbn = formData.isbn.replace(/[^0-9X]/gi, '');
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookData = data[`ISBN:${cleanIsbn}`];

      if (bookData) {
        setFormData(prev => ({
          ...prev,
          title: bookData.title || prev.title,
          author: bookData.authors?.map(a => a.name).join(', ') || prev.author,
          publisher: bookData.publishers?.map(p => p.name).join(', ') || prev.publisher,
          abstract: bookData.notes || `Published in ${bookData.publish_date || 'recent years'}. Pagination: ${bookData.number_of_pages || 'N/A'} pages.`
        }));
        setIsbnLookupSuccess(true);
        sounds.playSuccessChime();
      } else {
        // Fallback to Google Books Free API
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        const gData = await gRes.json();
        if (gData.items && gData.items[0]?.volumeInfo) {
          const info = gData.items[0].volumeInfo;
          setFormData(prev => ({
            ...prev,
            title: info.title || prev.title,
            author: info.authors?.join(', ') || prev.author,
            publisher: info.publisher || prev.publisher,
            abstract: info.description || prev.abstract
          }));
          setIsbnLookupSuccess(true);
          sounds.playSuccessChime();
        } else {
          alert('ISBN not found in global registries. Please enter title and author manually.');
        }
      }
    } catch (e) {
      console.warn('ISBN lookup service unavailable:', e);
      alert('ISBN lookup server timed out. You may continue entering details manually.');
    } finally {
      setIsLookingUpIsbn(false);
    }
  };

  // Form Submission to Laravel 11 Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      alert('Please provide a resource title and author');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title,
      author: formData.author,
      department_id: user?.department_id || formData.department_id,
      department_name: user?.department_name || formData.department_name,
      uploaded_by_hod_id: user?.matric || 'HOD-STAFF',
      hod_name: user?.name || 'Department Head',
      course_code: formData.course_code,
      target_level: formData.target_level,
      semester: formData.semester,
      resource_type: formData.resource_type,
      file_name: formData.file_name || `${formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`,
      file_data_url: formData.file_data_url,
      access_scope: formData.access_scope,
      review_notes: JSON.stringify({
        abstract: formData.abstract,
        keywords: formData.keywords,
        watermark: watermarkProtection,
        ingestion_mode: ingestionMode,
        isbn: formData.isbn,
        publisher: formData.publisher,
        estimated_cost: formData.estimated_cost,
        requested_copies: formData.requested_copies,
        vendor_suggestion: formData.vendor_suggestion
      })
    };

    try {
      const res = await fetch('/api/department-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        setSubmissionSuccess(data.upload);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: data.upload }));
        }
        if (onUploadSuccess) onUploadSuccess(data.upload);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      // Local fallback for offline mode
      console.warn('Using offline staging fallback:', err);
      const offlineUpload = {
        id: `HOD-UP-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      // Store in local staging queue
      try {
        const existing = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
        localStorage.setItem('fcc_pending_department_uploads', JSON.stringify([offlineUpload, ...existing]));
      } catch (e) {}

      sounds.playSuccessChime();
      setSubmissionSuccess(offlineUpload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: offlineUpload }));
      }
      if (onUploadSuccess) onUploadSuccess(offlineUpload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setFormData({
      title: '',
      author: user?.name || 'Department Faculty Academic Board',
      department_id: user?.department_id || 'DEP-CEM',
      department_name: user?.department_name || 'Co-operative Economics & Management',
      course_code: currentCourses[0] || 'CEM 411',
      target_level: 'HND II',
      semester: 'First Semester',
      resource_type: 'Lecture Handout',
      access_scope: 'Restricted to Department Students Only',
      file_name: '',
      file_size: '',
      file_data_url: '',
      abstract: '',
      keywords: '',
      isbn: '',
      publisher: '',
      estimated_cost: '15000',
      requested_copies: 5,
      vendor_suggestion: 'TETFUND Academic Books Depository'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn font-sans">
      {/* 1. STUDIO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-900/70 border border-teal-700/60 text-teal-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                <Building2 size={13} className="text-teal-400" />
                {user?.department_code || 'CEM'} ACADEMIC REPOSITORY STUDIO
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-semibold">
                NBTE CURRICULUM COMPLIANT
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-mono text-xs font-semibold">
                STAGING PIPELINE V5.0
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Departmental Resource & Book Acquisition Ingestion
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Upload departmental publications, syllabus handouts, past questions, and capstone theses, or submit physical book acquisition requests into the Central Library Staging Pipeline.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0 self-start md:self-center">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Review Pipeline Gate</div>
              <div className="text-xs font-bold text-white font-mono">Central Cataloger Verified</div>
            </div>
          </div>
        </div>

        {/* Pipeline Step Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-teal-300">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
            <span className="font-semibold">HOD Ingestion</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
            <span>Central Staging Queue</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
            <span>Call Number Assigned</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
            <span>Published to Student Shelf</span>
          </div>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL / SCREEN */}
      {submissionSuccess && (
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 backdrop-blur-xl shadow-2xl space-y-5 animate-scaleUp">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Submission Successfully Staged for Cataloger Review!
                </h3>
                <p className="text-xs text-emerald-300">
                  Tracking ID: <span className="font-mono font-bold">{submissionSuccess.id}</span> • Status: <span className="font-bold underline">Pending Review</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-xs font-mono font-bold animate-pulse">
              PENDING CHIEF LIBRARIAN APPROVAL
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Resource Title:</span>
              <span className="font-bold text-white">{submissionSuccess.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Department:</span>
              <span className="text-slate-200">{submissionSuccess.department_name} ({submissionSuccess.department_id})</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">Course Code & Level:</span>
              <span className="font-mono text-teal-300 font-bold">{submissionSuccess.course_code} • {submissionSuccess.target_level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Pipeline Step:</span>
              <span className="text-amber-300 font-medium">Chief Librarian assigns official Call Number & Shelf Location</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('/hod/submissions')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-teal-950"
            >
              <Eye size={14} />
              <span>Track in Submissions Queue</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => navigateTo('/admin/hod-submissions')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-950"
            >
              <ShieldCheck size={14} />
              <span>Switch to Central Review Queue (Librarian Gate)</span>
            </button>

            <button
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Submit Another Resource
            </button>
          </div>
        </div>
      )}

      {/* 2. ONE-CLICK PRESET TEMPLATES BAR */}
      {!submissionSuccess && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span className="font-bold text-white">Instant Academic Templates:</span>
            <span className="text-slate-400 hidden lg:inline">One-click populate realistic departmental data for fast testing:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-preset-past-exam"
              type="button"
              onClick={() => applyPreset('past_questions')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-teal-950/80 border border-slate-800 hover:border-teal-700 text-teal-300 text-xs font-medium transition"
            >
              Past Exam Compendium
            </button>
            <button
              id="btn-preset-handout"
              type="button"
              onClick={() => applyPreset('handout')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700 text-indigo-300 text-xs font-medium transition"
            >
              Lecture Handout Manual
            </button>
            <button
              id="btn-preset-thesis"
              type="button"
              onClick={() => applyPreset('thesis')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-700 text-purple-300 text-xs font-medium transition"
            >
              HND Capstone Thesis
            </button>
            <button
              id="btn-preset-physical-book"
              type="button"
              onClick={() => applyPreset('physical')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-700 text-emerald-300 text-xs font-medium transition"
            >
              Physical Book Acquisition
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN FORM & LIVE PREVIEW SPLIT CONTAINER */}
      {!submissionSuccess && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: INTERACTIVE FORM (7 COLUMNS) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* INGESTION MODE SELECTOR TABS */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  id="tab-mode-digital"
                  type="button"
                  onClick={() => {
                    setIngestionMode('digital');
                    setFormData(prev => ({ ...prev, resource_type: 'Lecture Handout' }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    ingestionMode === 'digital'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={14} />
                  <span>Digital Material (PDF / E-Book)</span>
                </button>
                <button
                  id="tab-mode-physical"
                  type="button"
                  onClick={() => {
                    setIngestionMode('physical');
                    setFormData(prev => ({ ...prev, resource_type: 'Physical Book Acquisition Request' }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    ingestionMode === 'physical'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Physical Book Acquisition</span>
                </button>
              </div>

              <span className="hidden sm:inline text-[11px] font-mono text-slate-500">
                Department: {user?.department_code || 'CEM'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              
              {/* TITLE & AUTHOR */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>{ingestionMode === 'digital' ? 'Document / Book Title *' : 'Book Title for Physical Acquisition *'}</span>
                    <span className="text-[10px] text-teal-400 font-mono">Standard Academic Format</span>
                  </label>
                  <input
                    id="input-resource-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder={ingestionMode === 'digital' ? "e.g. Quantitative Econometrics Past Examination Compendium" : "e.g. Modern Cooperative Banking Operations"}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-medium transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Author(s) / Originating Faculty *
                    </label>
                    <input
                      id="input-resource-author"
                      type="text"
                      required
                      value={formData.author}
                      onChange={e => setFormData({ ...formData, author: e.target.value })}
                      placeholder="e.g. Dr. Mrs. F. A. Babalola / HOD Board"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-medium transition"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Resource Classification Category
                    </label>
                    <select
                      value={formData.resource_type}
                      onChange={e => setFormData({ ...formData, resource_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-medium transition"
                    >
                      {ingestionMode === 'digital' ? (
                        <>
                          <option>Lecture Handout</option>
                          <option>Past Exam Questions</option>
                          <option>Capstone Project / Dissertation</option>
                          <option>Research Monograph</option>
                          <option>Departmental Journal Article</option>
                          <option>Laboratory / Practical Manual</option>
                        </>
                      ) : (
                        <>
                          <option>Physical Book Acquisition Request</option>
                          <option>Hardcover Reference Textbook</option>
                          <option>Syllabus Prescribed Reading Copy</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* COURSE CODE & QUICK CHIPS */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag size={13} className="text-teal-400" />
                    <span>Course Code Mapping</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Click course code chip to apply</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {currentCourses.map(code => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setFormData({ ...formData, course_code: code })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                        formData.course_code === code
                          ? 'bg-teal-600 text-white shadow'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={formData.course_code}
                    onChange={e => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                    placeholder="Custom Code..."
                    className="w-28 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Academic Level</label>
                    <select
                      value={formData.target_level}
                      onChange={e => setFormData({ ...formData, target_level: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-medium"
                    >
                      <option>HND II</option>
                      <option>HND I</option>
                      <option>ND II</option>
                      <option>ND I</option>
                      <option>Postgraduate Diploma</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Academic Semester</label>
                    <select
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-medium"
                    >
                      <option>First Semester</option>
                      <option>Second Semester</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Student Access Scope</label>
                    <select
                      value={formData.access_scope}
                      onChange={e => setFormData({ ...formData, access_scope: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-medium"
                    >
                      <option>Restricted to Department Students Only</option>
                      <option>Public Institution-Wide</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* MODE SPECIFIC FIELDS: DIGITAL FILE UPLOADER */}
              {ingestionMode === 'digital' ? (
                <div className="space-y-4">
                  {/* Automated Deep PDF Analysis Inspector & Scanner */}
                  <PdfAnalysisInspector
                    isAnalyzing={isAnalyzingPdf}
                    analysisProgress={analysisProgress}
                    analysisResult={analysisResult}
                    onReAnalyze={handleReAnalyze}
                    onReset={handleResetAnalysis}
                  />

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer p-6 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center gap-2 ${
                      isDragging
                        ? 'border-teal-400 bg-teal-950/30'
                        : formData.file_name
                        ? 'border-teal-700/60 bg-teal-950/20'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.epub,.docx,.zip"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                      <FileUp size={24} />
                    </div>

                    {formData.file_name ? (
                      <div>
                        <div className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                          <CheckCircle size={15} className="text-emerald-400" />
                          <span>{formData.file_name}</span>
                        </div>
                        <p className="text-[11px] text-teal-400 font-mono mt-0.5">
                          {formData.file_size || 'Ready for Staging Pipeline'}
                        </p>
                        <span className="text-[10px] text-slate-500 underline mt-1 inline-block">
                          Click to select a different file
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Click to browse or drag & drop lecture PDF / EPUB
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          PDF, EPUB, DOCX, ZIP (Max 50MB) • Automatically scanned for viruses & integrity
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Watermark Security Toggle */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-teal-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">Digital Watermark Protection</span>
                        <span className="text-[10px] text-slate-400">Embeds dynamic student matriculation stamp on reader to prevent mass leakages</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={watermarkProtection}
                        onChange={(e) => setWatermarkProtection(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              ) : (
                /* MODE SPECIFIC FIELDS: PHYSICAL BOOK ACQUISITION */
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Barcode size={15} />
                      <span>Physical Stack Acquisition Specifications</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">TETFUND / Capital Budget Allocation</span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      International Standard Book Number (ISBN)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-isbn-number"
                        type="text"
                        value={formData.isbn}
                        onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                        placeholder="e.g. 978-0198826729"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        id="btn-isbn-autofill"
                        type="button"
                        onClick={handleIsbnAutoLookup}
                        disabled={isLookingUpIsbn}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        {isLookingUpIsbn ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                        <span>Auto-Fill (Open Library)</span>
                      </button>
                    </div>
                    {isbnLookupSuccess && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                        <Check size={12} /> Metadata verified from global bibliographic registry
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Publisher</label>
                      <input
                        id="input-publisher"
                        type="text"
                        value={formData.publisher}
                        onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                        placeholder="e.g. Oxford Academic / Longman"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Requested Copies</label>
                      <input
                        id="input-requested-copies"
                        type="number"
                        min={1}
                        max={100}
                        value={formData.requested_copies}
                        onChange={e => setFormData({ ...formData, requested_copies: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Est. Unit Price (₦)</label>
                      <input
                        id="input-unit-price"
                        type="text"
                        value={formData.estimated_cost}
                        onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })}
                        placeholder="e.g. 25000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Recommended Vendor / Supplier</label>
                    <input
                      type="text"
                      value={formData.vendor_suggestion}
                      onChange={e => setFormData({ ...formData, vendor_suggestion: e.target.value })}
                      placeholder="e.g. University Booksellers Nigeria Ltd / TETFUND Direct"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* ABSTRACT / SYLLABUS ALIGNMENT */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Syllabus Summary & Curriculum Alignment Notes</span>
                  <span className="text-[10px] text-slate-500">Helps Chief Librarian verify NBTE accreditation fit</span>
                </label>
                <textarea
                  id="input-syllabus-abstract"
                  rows={3}
                  value={formData.abstract}
                  onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                  placeholder="Outline the course modules, topics covered, and justification for inclusion in the departmental library collection..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition text-xs"
                />
              </div>

              {/* DISPATCH ACTION */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="text-[11px] text-slate-500 font-mono">
                  Review Gate: Staged as Pending
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition shadow-xl shadow-teal-950 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Staging into Central Library Pipeline...' : 'Dispatch to Central Review Queue'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: LIVE REPOSITORY CARD PREVIEW (5 COLUMNS) */}
          <div className="lg:col-span-5 space-y-5 sticky top-20">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-teal-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live Repository Preview</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                  Student & Staging View
                </span>
              </div>

              {/* Card Simulation: How it appears on Student Department Shelf */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-mono font-bold">
                      {formData.course_code || 'COURSE CODE'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-medium">
                      {formData.target_level}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
                    PENDING STAGING
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition line-clamp-2">
                    {formData.title || 'Untitled Resource (Live Preview)'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    By <span className="text-slate-300 font-medium">{formData.author || 'Author / HOD'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="text-slate-200 font-mono">{user?.department_code || 'CEM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classification Type:</span>
                    <span className="text-teal-300">{formData.resource_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Rights:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{formData.access_scope}</span>
                  </div>
                  {ingestionMode === 'physical' && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Physical Stack Order:</span>
                      <span className="font-mono font-bold">{formData.requested_copies} copies requested</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900">
                  <div className="flex items-center gap-1 font-mono">
                    <FileText size={12} className="text-teal-400" />
                    <span>{formData.file_name || 'document-preview.pdf'}</span>
                  </div>
                  <span className="font-mono text-teal-400">
                    {watermarkProtection && ingestionMode === 'digital' ? '🛡️ Watermarked' : 'Open Print'}
                  </span>
                </div>
              </div>

              {/* Staging Pipeline Architecture Guide */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Layers size={13} className="text-indigo-400" />
                  <span>Why Items Pass Through Central Review:</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Institutional hierarchy prevents unvetted materials or duplicate records from cluttering the master catalog. Once submitted:
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 pl-4 list-disc">
                  <li>Chief Librarian receives alert in <code className="text-indigo-300 font-mono">#/admin/hod-submissions</code>.</li>
                  <li>Cataloger validates syllabus alignment and assigns official <strong className="text-slate-200">Call Number</strong> (e.g. <code className="text-teal-300">CEM.411/BAB/2026</code>) and physical shelf.</li>
                  <li>Published item automatically routes to your student departmental shelf (<code className="text-emerald-300 font-mono">#/scholar/dept-resources</code>).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}