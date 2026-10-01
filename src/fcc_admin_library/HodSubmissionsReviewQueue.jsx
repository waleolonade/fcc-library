import React, { useState, useEffect } from 'react';
import {
  Layers, CheckCircle, XCircle, Clock, AlertTriangle, BookOpen,
  Send, Eye, RefreshCw, Filter, Sparkles, ShieldCheck, Tag, MapPin
} from 'lucide-react';

export default function HodSubmissionsReviewQueue({ onPublishSuccess }) {
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [selectedUploadForReview, setSelectedUploadForReview] = useState(null);

  // Review Form in Modal
  const [reviewForm, setReviewForm] = useState({
    assigned_call_number: '',
    assigned_shelf: 'Floor 2 • Aisle 3 • Shelf 14A',
    review_notes: 'Approved by Chief College Librarian. Formatting and copyright compliance verified.'
  });

  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchUploads = async () => {
    setIsLoading(true);
    let all = [];
    try {
      const res = await fetch('/api/department-uploads');
      if (res.ok) {
        const data = await res.json();
        all = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.warn('API unavailable, checking local staging');
    }

    try {
      const pendingQueue = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
      const localSubs = JSON.parse(localStorage.getItem('fcc_hod_submissions_v48') || '[]');
      const combined = [...all];
      const seen = new Set(combined.map(u => String(u.id || u.title)));

      for (const item of [...pendingQueue, ...localSubs]) {
        const key = String(item.id || item.title);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }
      setUploads(combined);
    } catch (err) {
      setUploads(all);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
    const handleSubmissionsUpdated = () => fetchUploads();
    window.addEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
    return () => {
      window.removeEventListener('fcc-submissions-updated', handleSubmissionsUpdated);
    };
  }, []);

  const openReviewModal = (up) => {
    setSelectedUploadForReview(up);
    const authorCode = (up.author || 'GEN').slice(0, 3).toUpperCase();
    const courseNum = (up.course_code || '101').replace(/[^0-9]/g, '') || '411';
    setReviewForm({
      assigned_call_number: up.assigned_call_number || `HD2963 .${authorCode} 2026-C${courseNum}`,
      assigned_shelf: up.assigned_shelf || 'Floor 2 • Aisle 4 • Shelf 12B',
      review_notes: 'Approved by Chief College Librarian. Formatting and copyright compliance verified.'
    });
  };

  const handleApprove = async () => {
    if (!selectedUploadForReview) return;
    const up = selectedUploadForReview;
    const id = up.id;

    try {
      const res = await fetch(`/api/department-uploads/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      const data = await res.json();
      
      const publishedBook = {
        id: data?.book?.id || `FCC-HOD-${id}`,
        title: data?.book?.title || up.title,
        subtitle: `Departmental Resource • Course: ${up.course_code || 'GEN'} (${up.target_level || 'HND II'})`,
        author: data?.book?.author || up.author,
        authorCredentials: 'Faculty Contributor / HOD',
        authorAffiliation: `Federal Co-operative College, Ibadan (${up.department_name || 'Academic Dept'})`,
        subject: data?.book?.subject || up.department_name || 'Departmental Curriculum',
        department: data?.book?.department || up.department_name || 'Co-operative Economics & Management',
        courseCode: data?.book?.course_code || up.course_code || 'CEM 411',
        targetLevel: data?.book?.target_level || up.target_level || 'HND II',
        callNumber: data?.book?.call_number || reviewForm.assigned_call_number || 'HD2963 .FCC 2026',
        shelfLocation: data?.book?.shelf_location || reviewForm.assigned_shelf || 'Floor 2 • Aisle 4 • Shelf 12B',
        isbn: data?.book?.isbn || `978-978-HOD-${Math.floor(100 + Math.random() * 900)}-1`,
        publisher: data?.book?.publisher || `FCC Department of ${up.department_name} Press`,
        year: data?.book?.year || new Date().getFullYear(),
        pdfPages: data?.book?.pdf_pages || 120,
        fileSize: data?.book?.file_size || '4.2 MB',
        fileName: data?.book?.file_name || up.file_name || 'curriculum_monograph.pdf',
        fileDataUrl: data?.book?.file_data_url || up.file_data_url || '',
        isDigital: true,
        format: 'E-Book',
        accessLevel: data?.book?.access_level || up.access_scope || 'Public Institution-Wide',
        copiesTotal: 10,
        copiesAvailable: 10,
        abstract: up.abstract || 'Departmental monograph published and approved by Chief College Librarian. Available for student research and digital reading.'
      };

      // 1. Immediately update localStorage central catalog
      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const updatedCatalog = [publishedBook, ...currentCatalog.filter(b => b.id !== publishedBook.id)];
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updatedCatalog));

        // 2. Dispatch cross-component event so App.jsx, StudentPortal, OPAC, and Reader immediately update!
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: updatedCatalog }));
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: data?.upload || { ...up, status: 'approved' } }));

        // 3. Sync local submission registries
        const updateLocalStatus = (key) => {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = list.map(item => item.id === id ? {
            ...item,
            status: 'approved',
            assigned_call_number: reviewForm.assigned_call_number,
            assigned_shelf: reviewForm.assigned_shelf,
            review_notes: reviewForm.review_notes
          } : item);
          localStorage.setItem(key, JSON.stringify(updated));
        };
        updateLocalStatus('fcc_hod_submissions_v48');
        updateLocalStatus('fcc_pending_department_uploads');
      } catch (err) {
        console.error('Error syncing local catalog:', err);
      }

      setUploads(uploads.map(u => u.id === id ? (data?.upload || { ...u, status: 'approved' }) : u));
      setFeedbackMsg(`Successfully approved "${up.title}"! Ingested into Central Master Catalog as ${publishedBook.id}. Students now have full instant access.`);
      
      if (onPublishSuccess) {
        onPublishSuccess(publishedBook);
      }
    } catch (e) {
      // Offline fallback: synthesize book and publish locally
      const publishedBook = {
        id: `FCC-HOD-${id}`,
        title: up.title,
        subtitle: `Departmental Resource • Course: ${up.course_code || 'GEN'} (${up.target_level || 'HND II'})`,
        author: up.author,
        authorCredentials: 'Faculty Contributor / HOD',
        authorAffiliation: `Federal Co-operative College, Ibadan (${up.department_name || 'Academic Dept'})`,
        subject: up.department_name || 'Departmental Curriculum',
        department: up.department_name || 'Co-operative Economics & Management',
        courseCode: up.course_code || 'CEM 411',
        targetLevel: up.target_level || 'HND II',
        callNumber: reviewForm.assigned_call_number || 'HD2963 .FCC 2026',
        shelfLocation: reviewForm.assigned_shelf || 'Floor 2 • Aisle 4 • Shelf 12B',
        isbn: `978-978-HOD-${Math.floor(100 + Math.random() * 900)}-1`,
        publisher: `FCC Department of ${up.department_name} Press`,
        year: new Date().getFullYear(),
        pdfPages: 120,
        fileSize: '4.2 MB',
        fileName: up.file_name || 'curriculum_monograph.pdf',
        fileDataUrl: up.file_data_url || '',
        isDigital: true,
        format: 'E-Book',
        accessLevel: up.access_scope || 'Public Institution-Wide',
        copiesTotal: 10,
        copiesAvailable: 10,
        abstract: up.abstract || 'Departmental monograph approved by Chief College Librarian.'
      };

      try {
        const currentCatalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
        const updatedCatalog = [publishedBook, ...currentCatalog.filter(b => b.id !== publishedBook.id)];
        localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(updatedCatalog));
        window.dispatchEvent(new CustomEvent('fcc-catalog-updated', { detail: updatedCatalog }));
        window.dispatchEvent(new CustomEvent('fcc-submissions-updated', { detail: { ...up, status: 'approved' } }));

        const updateLocalStatus = (key) => {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = list.map(item => item.id === id ? {
            ...item,
            status: 'approved',
            assigned_call_number: reviewForm.assigned_call_number,
            assigned_shelf: reviewForm.assigned_shelf,
            review_notes: reviewForm.review_notes
          } : item);
          localStorage.setItem(key, JSON.stringify(updated));
        };
        updateLocalStatus('fcc_hod_submissions_v48');
        updateLocalStatus('fcc_pending_department_uploads');
      } catch (err) {}

      setUploads(uploads.map(u => u.id === id ? {
        ...u,
        status: 'approved',
        assigned_call_number: reviewForm.assigned_call_number,
        assigned_shelf: reviewForm.assigned_shelf,
        review_notes: reviewForm.review_notes
      } : u));
      
      setFeedbackMsg(`Locally approved "${up.title}". Published to Master Catalog as ${publishedBook.id}. Students now have full instant access.`);
      if (onPublishSuccess) {
        onPublishSuccess(publishedBook);
      }
    }

    setSelectedUploadForReview(null);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleReject = async () => {
    if (!selectedUploadForReview) return;
    const id = selectedUploadForReview.id;

    try {
      const res = await fetch(`/api/department-uploads/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: reviewForm.review_notes })
      });
      const data = await res.json();
      if (res.ok) {
        setUploads(uploads.map(u => u.id === id ? data.upload : u));
        setFeedbackMsg(`Returned "${selectedUploadForReview.title}" to HOD for revision.`);
      }
    } catch (e) {
      setUploads(uploads.map(u => u.id === id ? { ...u, status: 'rejected', review_notes: reviewForm.review_notes } : u));
      setFeedbackMsg(`Returned "${selectedUploadForReview.title}" to HOD for revision.`);
    }

    setSelectedUploadForReview(null);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const pendingList = uploads.filter(u => u.status === 'pending');
  const approvedList = uploads.filter(u => u.status === 'approved');
  const rejectedList = uploads.filter(u => u.status === 'rejected');

  const displayedList = activeTabFilter === 'all'
    ? uploads
    : (activeTabFilter === 'pending' ? pendingList : (activeTabFilter === 'approved' ? approvedList : rejectedList));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Layers size={14} className="text-indigo-400" />
          <span>Central Library Staging & Approval Pipeline</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          HOD Submissions Review Queue
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          Review, validate, and catalog departmental lecture handouts, past examination papers, capstones, and physical book acquisition requests submitted by Academic Heads of Department.
        </p>

        {/* Live Staging Architecture Diagram */}
        <div className="pt-3 overflow-x-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
            <span className="text-teal-400 font-bold">[HOD Dashboard Upload]</span>
            <span className="text-slate-600">➔</span>
            <span className="text-amber-400 font-bold">[Central Review Queue: Pending]</span>
            <span className="text-slate-600">➔</span>
            <span className="text-indigo-400 font-bold">[Assign Call No & Shelf]</span>
            <span className="text-slate-600">➔</span>
            <span className="text-emerald-400 font-bold">[Publish to Master Catalog & Student Shelf]</span>
          </div>
        </div>
      </div>

      {/* Global Feedback */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-indigo-950/90 border border-indigo-500 text-indigo-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Queue Filter:</span>
          <div className="flex items-center gap-1">
            {[
              { id: 'pending', label: 'Pending Review', count: pendingList.length, color: 'text-amber-400' },
              { id: 'approved', label: 'Approved & Published', count: approvedList.length, color: 'text-emerald-400' },
              { id: 'rejected', label: 'Revisions Requested', count: rejectedList.length, color: 'text-rose-400' },
              { id: 'all', label: 'All Submissions', count: uploads.length, color: 'text-slate-300' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTabFilter(t.id)}
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
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-indigo-400' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Uploads List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <CheckCircle size={36} className="mx-auto text-emerald-500/40" />
            <h4 className="text-base font-bold text-white">No Submissions in this Queue</h4>
            <p className="text-xs text-slate-400">All submissions in this category have been processed.</p>
          </div>
        ) : (
          displayedList.map(up => {
            const isPending = up.status === 'pending';
            const isApproved = up.status === 'approved';
            const isRejected = up.status === 'rejected';

            return (
              <div
                key={up.id}
                className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl transition ${
                  isPending ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isRejected
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}>
                      {isApproved ? '✓ Published' : (isRejected ? '✕ Revision Requested' : '● Pending Cataloger Review')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {up.id}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                      {up.department_name} ({up.course_code})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Uploaded by: <strong>{up.hod_name || 'HOD'}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{up.title}</h3>
                  <p className="text-xs text-slate-400">
                    By {up.author} • {up.resource_type} • Level: {up.target_level} • {up.semester} • Scope: {up.access_scope}
                  </p>

                  {/* Assigned Details if published */}
                  {up.assigned_call_number && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      <span className="text-emerald-400 font-bold">Catalog Call No:</span>
                      <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {up.assigned_call_number}
                      </span>
                      <span className="text-slate-400">• Stack Shelf: {up.assigned_shelf}</span>
                      {up.book_id && (
                        <span className="text-indigo-400 text-[11px]">• Book ID: {up.book_id}</span>
                      )}
                    </div>
                  )}

                  {up.review_notes && (
                    <div className={`p-2 rounded-xl text-xs border ${
                      isRejected ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                      <span className="font-bold text-slate-400">Cataloger Note:</span> {up.review_notes}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isPending ? (
                    <button
                      onClick={() => openReviewModal(up)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-950 flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Review & Publish</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openReviewModal(up)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Edit Classification
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REVIEW & APPROVAL MODAL */}
      {selectedUploadForReview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck size={20} />
                <h3 className="text-base font-bold text-white">Review Departmental Submission</h3>
              </div>
              <button
                onClick={() => setSelectedUploadForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Monograph Summary */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] text-teal-400 font-mono font-bold block uppercase">
                {selectedUploadForReview.department_name} • {selectedUploadForReview.course_code}
              </span>
              <h4 className="text-sm font-bold text-white">{selectedUploadForReview.title}</h4>
              <p className="text-slate-400">By {selectedUploadForReview.author} • {selectedUploadForReview.resource_type}</p>
            </div>

            {/* Classification Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag size={13} className="text-indigo-400" />
                  <span>Assign Library of Congress / Call Number *</span>
                </label>
                <input
                  type="text"
                  required
                  value={reviewForm.assigned_call_number}
                  onChange={e => setReviewForm({ ...reviewForm, assigned_call_number: e.target.value })}
                  placeholder="e.g. HD2963 .A34 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-indigo-500"
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
                  placeholder="e.g. Floor 2 • Aisle 4 • Shelf 12B"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Cataloger Review Notes & Feedback
                </label>
                <textarea
                  rows={2}
                  value={reviewForm.review_notes}
                  onChange={e => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
                  placeholder="Comments or instructions for the HOD..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} />
                <span>Approve & Publish to Master Catalog</span>
              </button>

              <button
                type="button"
                onClick={handleReject}
                className="py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-semibold transition"
              >
                Request Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
