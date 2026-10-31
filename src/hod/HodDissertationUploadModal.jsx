import React, { useState, useRef } from 'react';
import {
  X,
  Award,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  Zap,
  Building2,
  Calendar,
  User,
  Hash,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import { analyzeUploadedPdf } from '../utils/pdfDeepAnalyzer';
import { compressPdf, compressCoverImage } from '../utils/pdfCompressor';
import PdfOptimizerWidget from '../common/PdfOptimizerWidget';

export default function HodDissertationUploadModal({
  isOpen,
  onClose,
  department,
  onSuccess
}) {
  const [fileObj, setFileObj] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    matric: `FCC/${department?.code || 'CEM'}/2024/001`,
    supervisor: department?.hod_name || department?.hod || 'Departmental Academic Board',
    degree: 'Higher National Diploma (HND II) Dissertation',
    year: new Date().getFullYear(),
    department: department?.name || 'Co-operative Economics & Management',
    department_code: department?.code || 'CEM',
    abstract: '',
    file_name: '',
    file_data_url: '',
    file_size: '',
    original_file_size: '',
    compression_ratio: ''
  });

  const [activePreset, setActivePreset] = useState('recommended');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({ percent: 0, message: '' });
  const [compressionResult, setCompressionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file, chosenPreset = activePreset) => {
    if (!file) return;
    setFileObj(file);
    setErrorMsg('');
    sounds.playClick();

    // 1. Initial State
    setFormData(prev => ({
      ...prev,
      file_name: file.name,
      original_file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    }));

    // 2. Start Compression & Stream Analysis
    setIsCompressing(true);
    try {
      // Run parallel PDF Deep Analysis for metadata extraction
      analyzeUploadedPdf(file, { defaultDeptCode: department?.code || 'CEM' })
        .then(analysis => {
          if (analysis && analysis.success && analysis.extracted) {
            const ext = analysis.extracted;
            setFormData(prev => ({
              ...prev,
              title: prev.title || ext.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              author: prev.author || ext.author || '',
              abstract: prev.abstract || ext.abstract || ''
            }));
          }
        })
        .catch(() => {});

      // Run compression
      const comp = await compressPdf(file, {
        preset: chosenPreset,
        onProgress: (p) => setCompressionProgress(p)
      });

      setCompressionResult(comp);
      setFormData(prev => ({
        ...prev,
        file_data_url: comp.dataUrl,
        file_size: comp.compressedFormatted,
        compression_ratio: `${comp.savingsPercent}%`
      }));
      sounds.playSuccessChime();
    } catch (err) {
      console.error('Dissertation compression error:', err);
      setErrorMsg(`Optimization notice: ${err.message}. Proceeding with standard file.`);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, file_data_url: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      setErrorMsg('Please specify the approved Dissertation Title and Student Author.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        matric: formData.matric.trim().toUpperCase(),
        advisor: formData.supervisor.trim(),
        degree: formData.degree,
        year: Number(formData.year) || new Date().getFullYear(),
        department: department?.name || formData.department,
        department_code: department?.code || formData.department_code,
        abstract: formData.abstract.trim() || `Approved Higher National Diploma dissertation in ${department?.name || 'Departmental Studies'}.`,
        file_name: formData.file_name || 'dissertation.pdf',
        file_data_url: formData.file_data_url || '',
        file_size: formData.file_size || '4.2 MB',
        status: 'Published',
        access: 'Public Institution-Wide'
      };

      const endpoint = `${getApiBase()}/theses`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        sounds.playSuccessChime();
        if (onSuccess) onSuccess(data.thesis || payload);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to publish dissertation to database');
      }
    } catch (err) {
      console.error('Dissertation submit error:', err);
      setErrorMsg(err.message || 'Failed to submit dissertation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl my-6 bg-slate-900 border border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-xs text-white">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Ingest & Endorse Capstone Dissertation
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold border border-teal-500/40">
                  {department?.code || 'CEM'} HOD GATE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Optimizes manuscript PDF binary streams, strips bloated scans, and registers dissertation directly into repository.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 animate-fadeIn">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload & Compression Dropzone */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Defense Manuscript File (PDF) with Automatic Space-Saving Compression *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition text-center flex flex-col items-center justify-center space-y-2 ${
                fileObj
                  ? 'border-teal-500/60 bg-teal-950/20'
                  : 'border-slate-700 hover:border-teal-500/40 bg-slate-950/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleProcessFile(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-teal-950 text-teal-400 border border-teal-800/80 flex items-center justify-center shadow-lg">
                <Upload size={24} />
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  {fileObj ? fileObj.name : 'Select or Drop Dissertation PDF'}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Raw scanner dumps and high-res defense copies will be compressed automatically before saving.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Compression Feedback Widget */}
          {(fileObj || isCompressing || compressionResult) && (
            <PdfOptimizerWidget
              compressionResult={compressionResult}
              isCompressing={isCompressing}
              progress={compressionProgress}
              activePreset={activePreset}
              onSelectPreset={(p) => setActivePreset(p)}
              onRecompress={(p) => fileObj && handleProcessFile(fileObj, p)}
              onPreviewPdf={(url) => setPreviewPdfUrl(url)}
              themeColor="#0d9488"
              accentColor="#2dd4bf"
            />
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Approved Dissertation Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Empirical Assessment of Agricultural Micro-Credit on Rural Co-operative Viability"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Student Author Name *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="e.g. Babatunde Ayomide Olawale"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Student Matriculation Number *</label>
              <input
                type="text"
                required
                value={formData.matric}
                onChange={(e) => setFormData(prev => ({ ...prev, matric: e.target.value }))}
                placeholder="e.g. FCC/CEM/2024/042"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Lead Academic Supervisor</label>
              <input
                type="text"
                value={formData.supervisor}
                onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                placeholder="e.g. Dr. O. A. Adeleke"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Academic Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Executive Abstract (200-500 words)</label>
              <textarea
                rows={3}
                value={formData.abstract}
                onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="Methodology, findings, empirical conclusions and recommendations..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing || !fileObj}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-teal-950"
            >
              {isSubmitting ? (
                <span>Endorsing & Registering…</span>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Endorse & Publish to Repository</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal for PDF Preview if requested */}
        {previewPdfUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4">
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-t-2xl border border-slate-700">
              <span className="font-bold text-white">Previewing Compressed PDF</span>
              <button onClick={() => setPreviewPdfUrl('')} className="px-3 py-1 rounded bg-slate-800 text-white font-bold">
                ✕ Close Preview
              </button>
            </div>
            <iframe src={previewPdfUrl} className="w-full h-full rounded-b-2xl border border-slate-700 bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
