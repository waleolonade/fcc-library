import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Upload, FileText, CheckCircle, Clock, AlertCircle,
  Sparkles, Layers, Tag, Copy, Check, ArrowRight, Eye, RefreshCw,
  FileUp, Hash, Library, Search, AlertTriangle, ShieldCheck,
  Building2, Trash2, Edit3, ExternalLink, Image as ImageIcon,
  BookCheck, Bookmark, Download, Plus
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { developerApiCall } from '../services/developerApi';

export default function DeveloperBookStudio({ passkey, showToast, departments: propDepts = [] }) {
  // Mode: 'ingest' (Catalog New Book) vs 'catalog' (Manage Existing Books) vs 'hod_pipeline' (HOD Review Queue)
  const [activeSubTab, setActiveSubTab] = useState('ingest');
  
  // Category Mode (inspired by HOD Upload Studio): 'book' | 'journal' | 'project' | 'acquisition'
  const [uploadCategory, setUploadCategory] = useState('book');

  // Academic Departments Live State
  const [departments, setDepartments] = useState(propDepts || []);

  useEffect(() => {
    if (propDepts && propDepts.length > 0) {
      setDepartments(propDepts);
    } else {
      developerApiCall('/api/departments')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDepartments(data);
          }
        })
        .catch(() => {});
    }
  }, [propDepts]);


  // Books List State
  const [booksList, setBooksList] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // HOD Submissions State
  const [hodUploads, setHodUploads] = useState([]);
  const [hodLoading, setHodLoading] = useState(false);
  const [hodFilterStatus, setHodFilterStatus] = useState('ALL');

  // Edit Book Modal State
  const [editingBook, setEditingBook] = useState(null);
  const [isUpdatingBook, setIsUpdatingBook] = useState(false);

  // Ingestion Form State (Cleaned of all dummy, demo, and mock values)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    author_credentials: '',
    department: '',
    course_code: '',
    target_level: 'ND I',
    semester: 'First Semester',
    isbn: '',
    call_number: '',
    publisher: 'Federal Co-operative College Press',
    year: new Date().getFullYear().toString(),
    edition: '1st Edition',
    shelf_location: '',
    copies_total: 1,
    abstract: '',
    cover_image: '',
    file_name: '',
    file_data_url: '',
    // Capstone Project specifics
    student_matric: '',
    supervisor_name: '',
    academic_session: '',
    // Journal specifics
    journal_name: '',
    volume_issue: '',
    doi: ''
  });

  // Keep department synced with available departments
  useEffect(() => {
    if (!formData.department && departments.length > 0) {
      setFormData(prev => ({ ...prev, department: departments[0].name }));
    }
  }, [departments]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Fetch Books from Database
  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const params = new URLSearchParams();
      if (bookSearch) params.append('search', bookSearch);
      if (selectedDeptFilter !== 'ALL') params.append('department', selectedDeptFilter);
      params.append('limit', '100');

      const res = await developerApiCall(`/api/developer/books?${params.toString()}`, {
        passkey
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.books) {
          setBooksList(data.books);
          setTotalBooks(data.total || data.books.length);
          // Sync to localStorage
          try {
            if (!bookSearch && selectedDeptFilter === 'ALL') {
              localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(data.books));
              localStorage.setItem('fcc_db_catalog', JSON.stringify(data.books));
              window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: data.books }));
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Failed to fetch developer books:', e);
    } finally {
      setBooksLoading(false);
    }
  };

  // Fetch Pending HOD Uploads (including records preserved in Developer Master Vault)
  const fetchHodUploads = async () => {
    setHodLoading(true);
    try {
      const res = await developerApiCall('/api/department-uploads?include_deleted=1', { passkey });
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.uploads || []);
        setHodUploads(list);
      }
    } catch (e) {
      console.warn('Failed to fetch HOD uploads:', e);
    } finally {
      setHodLoading(false);
    }
  };


  // Developer action: Restore deleted HOD upload back to review queue
  const handleRestoreHodUpload = async (up) => {
    if (!window.confirm(`Restore "${up.title}" back to active pending review queue?`)) return;
    try {
      const res = await developerApiCall(`/api/department-uploads/${up.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        passkey
      });
      if (res && res.ok) {
        alert(`✓ "${up.title}" restored to active review queue!`);
        fetchHodUploads();
      }
    } catch (e) {
      alert('Restore failed: ' + e.message);
    }
  };

  // Developer action: Permanently purge HOD upload from database
  const handlePurgeHodUpload = async (up) => {
    if (!window.confirm(`PERMANENT PURGE: This will irrevocably delete "${up.title}" from the Developer Master Vault. Are you sure?`)) return;
    try {
      const res = await developerApiCall(`/api/department-uploads/${up.id}?purge=1`, {
        method: 'DELETE',
        passkey
      });
      if (res && res.ok) {
        alert(`✓ "${up.title}" permanently purged from database.`);
        fetchHodUploads();
      }
    } catch (e) {
      alert('Purge failed: ' + e.message);
    }
  };


  useEffect(() => {
    fetchBooks();
    fetchHodUploads();
  }, [selectedDeptFilter]);

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  };

  const handlePdfFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        file_name: file.name,
        file_data_url: reader.result,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
      sounds.playSuccessChime();
      showToast?.(`PDF Document "${file.name}" attached successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        cover_image: reader.result
      }));
      sounds.playSuccessChime();
      showToast?.('Cover artwork updated.');
    };
    reader.readAsDataURL(file);
  };

  // Submit Ingestion to Database
  const handleSubmitIngestion = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast?.('Book title is required.');
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();

    try {
      const res = await developerApiCall('/api/developer/books', {
        method: 'POST',
        passkey,
        body: formData
      });
      const data = await res.json().catch(() => ({}));

      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        showToast?.(`Book "${formData.title}" catalogued directly into SQLite database!`);
        
        // Broadcast across all portals & sync localStorage
        if (data.book) {
          try {
            const currentCached = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
            const updatedList = [data.book, ...currentCached.filter(b => b.id !== data.book.id)];
            localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updatedList));
            localStorage.setItem('fcc_db_catalog', JSON.stringify(updatedList));
            window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: data.book }));
          } catch (e) {}
        }

        setFormData({
          title: '',
          subtitle: '',
          author: '',
          author_credentials: '',
          department: departments[0]?.name || '',
          course_code: '',
          target_level: 'ND I',
          semester: 'First Semester',
          isbn: '',
          call_number: '',
          publisher: 'Federal Co-operative College Press',
          year: new Date().getFullYear().toString(),
          edition: '1st Edition',
          shelf_location: '',
          copies_total: 1,
          abstract: '',
          cover_image: '',
          file_name: '',
          file_data_url: '',
          student_matric: '',
          supervisor_name: '',
          academic_session: '',
          journal_name: '',
          volume_issue: '',
          doi: ''
        });
        await fetchBooks();
        setActiveSubTab('catalog');
      } else {
        sounds.playErrorBuzz();
        showToast?.(data.error || 'Failed to catalogue book.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Network error occurred while ingesting book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selection & Bulk Delete State
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const toggleSelectBook = (id) => {
    setSelectedBookIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (booksList.length > 0 && selectedBookIds.length === booksList.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(booksList.map(b => b.id));
    }
  };

  // Bulk Delete Books from SQLite and Live MySQL
  const handleBulkDeleteBooks = async () => {
    if (selectedBookIds.length === 0) return;
    if (!window.confirm(`DANGER: Are you sure you want to permanently delete ${selectedBookIds.length} books from the database and live catalog? This action cannot be undone.`)) {
      return;
    }
    sounds.playClick();
    setIsBulkDeleting(true);
    try {
      const res = await developerApiCall('/api/developer/books/bulk-delete', {
        method: 'POST',
        passkey,
        body: { ids: selectedBookIds }
      });
      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        showToast?.(`Successfully deleted ${data.deleted_count || selectedBookIds.length} books from database.`);
        try {
          const currentCached = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
          const idSet = new Set(selectedBookIds);
          const filtered = currentCached.filter(b => !idSet.has(b.id));
          localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(filtered));
          localStorage.setItem('fcc_db_catalog', JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: filtered }));
        } catch (e) {}
        setSelectedBookIds([]);
        await fetchBooks();
      } else {
        sounds.playErrorBuzz();
        showToast?.(data.error || 'Failed to bulk delete books.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Network error occurred during bulk deletion.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" (${id}) from the database?`)) {
      return;
    }
    sounds.playClick();
    try {
      const res = await developerApiCall(`/api/developer/books/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        passkey
      });
      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        showToast?.(`Book "${title}" deleted from catalog.`);
        try {
          const currentCached = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
          const filtered = currentCached.filter(b => b.id !== id);
          localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(filtered));
          localStorage.setItem('fcc_db_catalog', JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: filtered }));
        } catch (e) {}
        setSelectedBookIds(prev => prev.filter(x => x !== id));
        await fetchBooks();
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Failed to delete book.');
    }
  };

  // Update Book
  const handleSaveBookEdit = async (e) => {
    e.preventDefault();
    if (!editingBook) return;
    setIsUpdatingBook(true);
    try {
      const res = await developerApiCall(`/api/developer/books/${encodeURIComponent(editingBook.id)}`, {
        method: 'PUT',
        passkey,
        body: editingBook
      });
      const data = await res.json().catch(() => ({}));
      if (res && res.ok && data.success) {
        sounds.playSuccessChime();
        showToast?.(`Book "${editingBook.title}" updated in database.`);
        try {
          const currentCached = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
          const updatedList = currentCached.map(b => b.id === editingBook.id ? { ...b, ...editingBook } : b);
          localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updatedList));
          localStorage.setItem('fcc_db_catalog', JSON.stringify(updatedList));
          window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: editingBook }));
        } catch (e) {}
        setEditingBook(null);
        await fetchBooks();
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Failed to update book.');
    } finally {
      setIsUpdatingBook(false);
    }
  };

  // 1-Click Approve HOD Submission
  const handleApproveHodUpload = async (upload) => {
    sounds.playClick();
    try {
      // Create book in books table
      const res = await developerApiCall('/api/developer/books', {
        method: 'POST',
        passkey,
        body: {
          title: upload.title,
          author: upload.author || upload.hod_name || 'HOD Faculty',
          department: upload.department_name || 'Co-operative Economics & Management',
          course_code: upload.course_code || 'GEN 101',
          target_level: upload.target_level || 'HND II',
          call_number: upload.assigned_call_number || `HOD.${upload.course_code || 'CEM'}.2026`,
          shelf_location: upload.assigned_shelf || 'Curriculum Reserves, Bay A',
          cover_image: upload.cover_image || upload.cover_path || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
          file_data_url: upload.file_data_url || upload.file_path || '',
          abstract: upload.abstract || `Official course material submitted by HOD ${upload.hod_name || ''}.`
        }
      });
      if (res && res.ok) {
        sounds.playSuccessChime();
        showToast?.(`Submission "${upload.title}" approved and indexed into Central OPAC catalog!`);
        await fetchBooks();
        await fetchHodUploads();
      }
    } catch (e) {
      sounds.playErrorBuzz();
      showToast?.('Failed to approve submission.');
    }
  };


  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Studio Header */}
      <div className="bg-[#050e1c] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 text-xs font-bold mb-2">
              <BookOpen size={14} className="text-cyan-400" />
              <span>DIRECT INGESTION &amp; CATALOGUING ENGINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Universal Monograph &amp; Repository Studio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 font-normal">
                Database Table: books
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed mt-1">
              Directly catalogue physical library holdings, scholarly research journals, capstone dissertations, and digital textbooks into the central SQLite database with real-time OPAC indexing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchBooks();
                fetchHodUploads();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-600/60 hover:bg-slate-800 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCw size={14} className={booksLoading ? 'animate-spin text-cyan-400' : ''} />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('ingest')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ingest'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Plus size={14} />
            <span>Catalogue New Resource</span>
          </button>

          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Library size={14} />
            <span>Live Catalog Feed ({totalBooks})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hod_pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'hod_pipeline'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>HOD Ingestion Pipeline ({hodUploads.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: INGESTION FORM (CATALOG NEW RESOURCE)
      ========================================================================= */}
      {activeSubTab === 'ingest' && (
        <div className="bg-[#07101f] border border-cyan-800/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Category Selector Pills (Inspired by HOD Upload Studio) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Select Resource Classification</div>
              <p className="text-[11px] text-slate-400 font-sans">Choose classification to tailor institutional metadata</p>
            </div>

            <div className="flex items-center gap-2 bg-[#02050b] p-1.5 rounded-2xl border border-slate-800">
              {[
                { id: 'book', label: 'Academic Monograph', icon: BookOpen },
                { id: 'journal', label: 'Research Journal', icon: FileText },
                { id: 'project', label: 'Student Dissertation', icon: BookCheck },
                { id: 'acquisition', label: 'Physical Stack Holding', icon: Library }
              ].map(cat => {
                const Icon = cat.icon;
                const isSel = uploadCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setUploadCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isSel ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmitIngestion} className="space-y-6 text-xs font-sans">
            {/* Row 1: Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principles of Modern Agricultural Extension & Cooperative Banking"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. An Empirical West African Analysis"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Row 2: Author, Affiliation, ISBN, Call Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Primary Author *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ogunleye T. B."
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  ISBN / Barcode
                </label>
                <input
                  type="text"
                  placeholder="978-978-49021-9-4"
                  value={formData.isbn}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  LoC Call Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="QA76.73 .F33 2026"
                  value={formData.call_number}
                  onChange={e => setFormData({ ...formData, call_number: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Academic Department
                </label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  {departments.map(d => (
                    <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Shelf, Copies, Level, Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Shelf Location
                </label>
                <input
                  type="text"
                  placeholder="Main Stacks, Aisle 2, Bay B"
                  value={formData.shelf_location}
                  onChange={e => setFormData({ ...formData, shelf_location: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Total Copies in Stacks
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.copies_total}
                  onChange={e => setFormData({ ...formData, copies_total: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Course Code
                </label>
                <input
                  type="text"
                  placeholder="CSC 101"
                  value={formData.course_code}
                  onChange={e => setFormData({ ...formData, course_code: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                  Target Level
                </label>
                <select
                  value={formData.target_level}
                  onChange={e => setFormData({ ...formData, target_level: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ND I">ND I</option>
                  <option value="ND II">ND II</option>
                  <option value="HND I">HND I</option>
                  <option value="HND II">HND II</option>
                  <option value="All Levels">All Levels / General</option>
                </select>
              </div>
            </div>

            {/* Row 4: File Attachment Drag & Drop & Cover Art */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* PDF Document Upload Zone */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-[11px]">
                  Digital Document Attachment (PDF)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/40'
                      : 'border-cyan-800/80 bg-[#02050b] hover:border-cyan-500'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={e => handlePdfFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <FileUp size={28} className="mx-auto text-cyan-400 mb-2" />
                  {formData.file_name ? (
                    <div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">{formData.file_name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">PDF Document Attached &amp; Ready for Direct Storage</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-white">Drag &amp; drop PDF file here, or click to browse</div>
                      <div className="text-[10px] text-slate-500 mt-1">Supports textbooks, dissertations, syllabus handouts</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Artwork Preview & Input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 text-[11px]">
                  Front Cover Artwork Preview
                </label>
                <div className="flex gap-4 items-start bg-[#02050b] border border-cyan-800/80 rounded-2xl p-4">
                  <div className="w-20 h-28 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-lg">
                    {formData.cover_image ? (
                      <img
                        src={formData.cover_image}
                        alt="Book Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80';
                        }}
                      />
                    ) : (
                      <ImageIcon size={24} className="text-slate-600" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Image URL or Paste Unsplash Link"
                      value={formData.cover_image}
                      onChange={e => setFormData({ ...formData, cover_image: e.target.value })}
                      className="w-full bg-[#050e1c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleCoverFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon size={13} />
                      <span>Upload Local Artwork</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                Monograph Abstract / Summary
              </label>
              <textarea
                rows={3}
                placeholder="Brief pedagogical summary, syllabus coverage, and learning objectives..."
                value={formData.abstract}
                onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full bg-[#02050b] border border-cyan-800/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-950 flex items-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-white" />
                    <span>Cataloguing to Central SQLite Database...</span>
                  </>
                ) : (
                  <>
                    <BookCheck size={16} />
                    <span>Ingest &amp; Catalogue into Database Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: LIVE CATALOG FEED (SEARCH, EDIT, DELETE)
      ========================================================================= */}
      {activeSubTab === 'catalog' && (
        <div className="bg-[#07101f] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, author, call number, ISBN..."
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchBooks(); }}
                className="w-full bg-[#02050b] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="bg-[#02050b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                ))}
              </select>

              <button
                onClick={fetchBooks}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                title="Refresh Table"
              >
                <RefreshCw size={14} className={booksLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedBookIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-200">
                  {selectedBookIds.length} of {booksList.length} monographs selected for deletion
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedBookIds([])}
                  className="ml-2 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>

              <button
                type="button"
                onClick={handleBulkDeleteBooks}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={14} className={isBulkDeleting ? 'animate-spin' : ''} />
                <span>{isBulkDeleting ? 'Deleting from Database...' : `Delete Selected (${selectedBookIds.length})`}</span>
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={booksList.length > 0 && selectedBookIds.length === booksList.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      title={selectedBookIds.length === booksList.length ? 'Deselect All' : 'Select All'}
                    />
                  </th>
                  <th className="py-2.5 px-3">Cover &amp; Title</th>
                  <th className="py-2.5 px-3">Author &amp; Dept</th>
                  <th className="py-2.5 px-3">LoC Call No</th>
                  <th className="py-2.5 px-3">Holdings Copies</th>
                  <th className="py-2.5 px-3">Digital E-Book</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {booksList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                      {booksLoading ? 'Querying database catalog...' : 'No books found matching the search criteria.'}
                    </td>
                  </tr>
                ) : (
                  booksList.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-900/60 transition ${
                        selectedBookIds.includes(b.id) ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedBookIds.includes(b.id)}
                          onChange={() => toggleSelectBook(b.id)}
                          className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          title="Select monograph"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded-lg border border-slate-700 shrink-0"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100';
                            }}
                          />
                          <div>
                            <div className="font-bold text-white font-sans text-xs line-clamp-1">{b.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{b.id} &bull; {b.isbn || 'ISBN-N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200 font-sans">{b.author}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{b.department || 'General'}</div>
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">
                        {b.call_number || 'QA76.73 .F33'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                          {b.copies_available ?? b.copies_total ?? 5} / {b.copies_total ?? 5} Avail
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {b.is_digital || b.file_data_url ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            ✓ Digital PDF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-700">
                            Physical Only
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingBook(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                            title="Edit Book Metadata"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Monograph"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: HOD SUBMISSIONS PIPELINE
      ========================================================================= */}
      {activeSubTab === 'hod_pipeline' && (
        <div className="bg-[#07101f] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Building2 size={15} className="text-teal-400" />
                <span>Departmental Curriculum Uploads & Developer Master Vault</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Full historical ingestion archive: Preserves all submissions including items deleted or withdrawn by HODs & Admins.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchHodUploads}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                title="Refresh from database"
              >
                <RefreshCw size={14} className={hodLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Developer Vault Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 font-sans text-xs">
            <span className="text-[11px] text-slate-400 font-semibold">Filter Vault:</span>
            {[
              { id: 'ALL', label: 'All Records', count: hodUploads.length, color: 'text-slate-300' },
              { id: 'PENDING', label: 'Pending Review', count: hodUploads.filter(u => u.status === 'pending' || !u.status).length, color: 'text-amber-400' },
              { id: 'APPROVED', label: 'Approved & Published', count: hodUploads.filter(u => u.status === 'approved').length, color: 'text-emerald-400' },
              { id: 'DELETED', label: 'Preserved in Vault (Deleted by HOD/Admin)', count: hodUploads.filter(u => u.status === 'deleted' || u.status === 'withdrawn').length, color: 'text-rose-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHodFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  hodFilterStatus === tab.id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950 ring-1 ring-teal-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full bg-slate-950 font-mono text-[10px] ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3 font-sans">
            {hodUploads.filter(u => {
              const s = String(u.status || '').toLowerCase();
              if (hodFilterStatus === 'PENDING') return s === 'pending' || (s !== 'approved' && s !== 'rejected' && s !== 'deleted' && s !== 'withdrawn');
              if (hodFilterStatus === 'APPROVED') return s === 'approved';
              if (hodFilterStatus === 'DELETED') return s === 'deleted' || s === 'withdrawn';
              return true;
            }).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No submissions matching "{hodFilterStatus}" in the Developer Master Vault.
              </div>
            ) : (
              hodUploads.filter(u => {
                const s = String(u.status || '').toLowerCase();
                if (hodFilterStatus === 'PENDING') return s === 'pending' || (s !== 'approved' && s !== 'rejected' && s !== 'deleted' && s !== 'withdrawn');
                if (hodFilterStatus === 'APPROVED') return s === 'approved';
                if (hodFilterStatus === 'DELETED') return s === 'deleted' || s === 'withdrawn';
                return true;
              }).map((up) => {
                const isDeleted = up.status === 'deleted' || up.status === 'withdrawn';
                const isApproved = up.status === 'approved';
                const isPending = !isDeleted && !isApproved;

                return (
                  <div
                    key={up.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
                      isDeleted
                        ? 'bg-[#060309] border-rose-900/60 hover:border-rose-700/80'
                        : isApproved
                        ? 'bg-[#02050b] border-emerald-950 hover:border-emerald-700/50'
                        : 'bg-[#02050b] border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                        <img
                          src={up.cover_image || up.cover_path || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                          alt={up.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {isDeleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                              <span>🗑️ Withdrawn / Deleted by HOD/Admin</span>
                              <span className="text-rose-400 font-mono">(Preserved in Developer Vault)</span>
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ✓ Approved & Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              ● Pending Review
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500">ID: {up.id}</span>
                        </div>
                        <div className="font-bold text-white text-sm">{up.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          By {up.author || up.hod_name || 'HOD Faculty'} &bull; Department: <strong className="text-teal-300">{up.department_name}</strong>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">{up.course_code || 'GEN 101'}</span>
                          <span className="text-slate-500">{up.target_level || 'HND II'}</span>
                          <span className="text-slate-500">{up.created_at || 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDeleted ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestoreHodUpload(up)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                            title="Restore back to active review queue"
                          >
                            <RefreshCw size={13} />
                            <span>Restore to Queue</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePurgeHodUpload(up)}
                            className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            title="Permanently remove from Developer Vault"
                          >
                            <Trash2 size={13} />
                            <span>Purge</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveHodUpload(up)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          <span>Approve to Central Catalog</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Edit Book Metadata */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#050e1c] border-2 border-cyan-500 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-900/80 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Edit3 size={18} />
                <span>Edit Monograph Metadata in Database</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBookEdit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={editingBook.title}
                  onChange={e => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full bg-[#02050b] border border-cyan-900 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={editingBook.author}
                    onChange={e => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-900 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Call Number</label>
                  <input
                    type="text"
                    required
                    value={editingBook.call_number || ''}
                    onChange={e => setEditingBook({ ...editingBook, call_number: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-900 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shelf Location</label>
                  <input
                    type="text"
                    value={editingBook.shelf_location || ''}
                    onChange={e => setEditingBook({ ...editingBook, shelf_location: e.target.value })}
                    className="w-full bg-[#02050b] border border-cyan-900 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Copies Total</label>
                  <input
                    type="number"
                    min={1}
                    value={editingBook.copies_total || 5}
                    onChange={e => setEditingBook({ ...editingBook, copies_total: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#02050b] border border-cyan-900 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBook}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg"
                >
                  {isUpdatingBook ? 'Updating Database...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
