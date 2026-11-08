import React, { useState, useRef, useEffect } from 'react';
import {
  Video, Headphones, Upload, FileText, CheckCircle, Clock, AlertCircle,
  Sparkles, Layers, Tag, Copy, Check, ArrowRight, Eye, RefreshCw,
  FileUp, Hash, Library, Search, AlertTriangle, ShieldCheck,
  Building2, Trash2, Edit3, ExternalLink, Image as ImageIcon,
  BookCheck, Bookmark, Download, Plus, Minus, Sliders, Play, X
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function MultimediaUploadStudio({
  role = 'developer', // 'hod' | 'staff' | 'admin' | 'developer'
  currentDept = null,
  activeStaff = null,
  currentUser = null,
  onUploadSuccess = null,
  onClose = null
}) {
  const [mediaType, setMediaType] = useState('video'); // 'video' | 'audio'
  const [resourceType, setResourceType] = useState('lecture_recording'); // 'lecture_recording' | 'practical_demo' | 'audiobook' | 'documentary' | 'podcast'

  // Metadata form
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    creator: activeStaff?.name || currentUser?.name || (role === 'hod' ? 'Head of Department' : 'Chief Lecturer'),
    creator_title: activeStaff?.title || (role === 'hod' ? 'Chief Lecturer & HOD' : 'Senior Lecturer'),
    department_id: currentDept?.code || currentDept?.id || 'CEM',
    department_name: currentDept?.name || 'Co-operative Economics & Management',
    course_code: '',
    target_level: 'ND I',
    semester: 'First Semester',
    description: '',
    subject_keywords: '',
    call_number: 'FCC.MED',
    shelf_location: 'Digital Audio-Visual Stacks / Stream Node A',
    access_level: 'open_access',
    video_resolution: '1080p Full HD',
    audio_bitrate: '192 kbps AAC',
    external_media_url: '',
    companion_pdf_title: '',
    duration_formatted: '00:00',
    duration_seconds: 0
  });

  // Files
  const [mediaFile, setMediaFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  // Previews
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

  // Interactive Chapter Cues
  const [chapters, setChapters] = useState([
    { title: '1. Introduction & Overview', start_seconds: 0, timestamp_formatted: '00:00', description: 'Overview of lecture goals' }
  ]);

  // Transcript / Subtitles
  const [transcriptText, setTranscriptText] = useState('');

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successAlert, setSuccessAlert] = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);

  const mediaFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);
  const hiddenVideoDetectorRef = useRef(null);

  // Prepopulate department if prop changes
  useEffect(() => {
    if (currentDept) {
      setFormData(prev => ({
        ...prev,
        department_id: currentDept.code || currentDept.id || prev.department_id,
        department_name: currentDept.name || prev.department_name
      }));
    }
  }, [currentDept]);

  // Handle media file selection & extract duration/resolution client-side
  const handleMediaFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);

    // Auto-fill title if empty
    if (!formData.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_.]+/g, ' ');
      const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setFormData(prev => ({ ...prev, title: titleCase }));
    }

    // Inspect video/audio element for technical metadata
    if (file.type.startsWith('video/')) {
      setMediaType('video');
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        window.URL.revokeObjectURL(v.src);
        const durationSec = Math.floor(v.duration);
        const hrs = Math.floor(durationSec / 3600);
        const mins = Math.floor((durationSec % 3600) / 60);
        const secs = durationSec % 60;
        const formatted = hrs > 0
          ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const width = v.videoWidth;
        const height = v.videoHeight;
        let resLabel = '1080p Full HD';
        if (height >= 2160 || width >= 3840) resLabel = '4K Ultra HD';
        else if (height >= 1440) resLabel = '1440p 2K QHD';
        else if (height >= 1080) resLabel = '1080p Full HD';
        else if (height >= 720) resLabel = '720p HD';
        else if (height >= 480) resLabel = '480p SD';

        setFormData(prev => ({
          ...prev,
          duration_seconds: durationSec,
          duration_formatted: formatted,
          video_resolution: resLabel
        }));
      };
      v.src = objectUrl;
    } else if (file.type.startsWith('audio/')) {
      setMediaType('audio');
      const a = document.createElement('audio');
      a.preload = 'metadata';
      a.onloadedmetadata = () => {
        window.URL.revokeObjectURL(a.src);
        const durationSec = Math.floor(a.duration);
        const hrs = Math.floor(durationSec / 3600);
        const mins = Math.floor((durationSec % 3600) / 60);
        const secs = durationSec % 60;
        const formatted = hrs > 0
          ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        setFormData(prev => ({
          ...prev,
          duration_seconds: durationSec,
          duration_formatted: formatted
        }));
      };
      a.src = objectUrl;
    }
  };

  // Handle Cover File
  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle PDF Handout File
  const handlePdfFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      if (!formData.companion_pdf_title) {
        setFormData(prev => ({
          ...prev,
          companion_pdf_title: file.name.replace(/\.[^/.]+$/, '') + ' (Lecture Handout)'
        }));
      }
    }
  };

  // Add Chapter Cue
  const addChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        title: `${prev.length + 1}. `,
        start_seconds: 0,
        timestamp_formatted: '00:00',
        description: ''
      }
    ]);
  };

  // Remove Chapter Cue
  const removeChapter = (idx) => {
    setChapters(prev => prev.filter((_, i) => i !== idx));
  };

  // Update Chapter Field
  const updateChapter = (idx, field, value) => {
    setChapters(prev => prev.map((ch, i) => {
      if (i !== idx) return ch;
      const updated = { ...ch, [field]: value };
      if (field === 'timestamp_formatted') {
        // parse mm:ss or hh:mm:ss to seconds
        const parts = value.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          updated.start_seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          updated.start_seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
      return updated;
    }));
  };

  // Submit Media Dossier to Server
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorAlert(null);
    setSuccessAlert(null);

    if (!formData.title.trim()) {
      setErrorAlert('Please provide a title for the audio/video lecture.');
      return;
    }
    if (!formData.creator.trim()) {
      setErrorAlert('Please specify the lecturer or presenter name.');
      return;
    }
    if (!mediaFile && !formData.external_media_url.trim()) {
      setErrorAlert('Please select a high-definition video/audio file or specify an external stream URL.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    sounds.playClick();

    try {
      const base = getApiBase();
      const body = new FormData();

      // Basic fields
      body.append('title', formData.title.trim());
      body.append('subtitle', formData.subtitle.trim());
      body.append('media_type', mediaType);
      body.append('resource_type', resourceType);
      body.append('creator', formData.creator.trim());
      body.append('creator_title', formData.creator_title.trim());
      body.append('department_id', formData.department_id);
      body.append('department_name', formData.department_name);
      body.append('course_code', formData.course_code.trim());
      body.append('target_level', formData.target_level);
      body.append('semester', formData.semester);
      body.append('duration_seconds', String(formData.duration_seconds || 0));
      body.append('duration_formatted', formData.duration_formatted);
      body.append('description', formData.description.trim());
      body.append('video_resolution', formData.video_resolution);
      body.append('audio_bitrate', formData.audio_bitrate);
      body.append('call_number', formData.call_number || 'FCC.MED');
      body.append('shelf_location', formData.shelf_location);
      body.append('access_level', formData.access_level);
      body.append('status', 'published');
      body.append('uploaded_by', `${formData.creator} (${role.toUpperCase()})`);

      if (formData.external_media_url.trim()) {
        body.append('media_url', formData.external_media_url.trim());
      }
      if (formData.companion_pdf_title.trim()) {
        body.append('companion_pdf_title', formData.companion_pdf_title.trim());
      }

      // Keywords array
      const kw = formData.subject_keywords.split(',').map(s => s.trim()).filter(Boolean);
      if (kw.length > 0) {
        body.append('subject_keywords', JSON.stringify(kw));
      }

      // Chapters array
      const cleanChapters = chapters.filter(c => c.title && c.title.trim().length > 0);
      if (cleanChapters.length > 0) {
        body.append('chapters', JSON.stringify(cleanChapters));
      }

      // Transcript text
      if (transcriptText.trim()) {
        body.append('transcript_text', transcriptText.trim());
      }

      // Files
      if (mediaFile) {
        body.append('media_file', mediaFile);
      }
      if (coverFile) {
        body.append('cover_file', coverFile);
      }
      if (pdfFile) {
        body.append('companion_pdf_file', pdfFile);
      }

      setUploadProgress(40);

      const res = await fetch(`${base}/media`, {
        method: 'POST',
        body
      });

      setUploadProgress(85);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setUploadProgress(100);
        sounds.playSuccessChime();
        setSuccessAlert(`High-Quality ${mediaType === 'video' ? 'Video Lecture' : 'Audio Resource'} successfully published to FCC Library Stacks!`);

        // Reset form
        setFormData({
          title: '',
          subtitle: '',
          creator: activeStaff?.name || currentUser?.name || 'Chief Lecturer',
          creator_title: activeStaff?.title || 'Senior Lecturer',
          department_id: currentDept?.code || currentDept?.id || 'CEM',
          department_name: currentDept?.name || 'Co-operative Economics & Management',
          course_code: '',
          target_level: 'ND I',
          semester: 'First Semester',
          description: '',
          subject_keywords: '',
          call_number: 'FCC.MED',
          shelf_location: 'Digital Audio-Visual Stacks / Stream Node A',
          access_level: 'open_access',
          video_resolution: '1080p Full HD',
          audio_bitrate: '192 kbps AAC',
          external_media_url: '',
          companion_pdf_title: '',
          duration_formatted: '00:00',
          duration_seconds: 0
        });
        setMediaFile(null);
        setCoverFile(null);
        setPdfFile(null);
        setMediaPreviewUrl('');
        setCoverPreviewUrl('');
        setTranscriptText('');

        window.dispatchEvent(new CustomEvent('fcc-media-catalog-updated', { detail: data.resource }));
        if (onUploadSuccess) onUploadSuccess(data.resource);
      } else {
        sounds.playErrorBuzz();
        setErrorAlert(data.message || data.error || 'Failed to catalogue media resource.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setErrorAlert(err.message || 'Network communication error during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentsList = [
    { id: 'CEM', name: 'Co-operative Economics & Management' },
    { id: 'CS', name: 'Computer Science' },
    { id: 'BFN', name: 'Banking & Finance' },
    { id: 'AGR', name: 'Agricultural Extension & Management' },
    { id: 'ACC', name: 'Accounting' },
    { id: 'PAD', name: 'Public Administration' }
  ];

  return (
    <div className="bg-[#041a12] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans text-slate-100 animate-fadeIn">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-800/80 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-mono font-bold mb-2">
            <Video size={13} className="text-emerald-400" />
            <span className="uppercase tracking-wider">FCC Institutional Multimedia Ingestion Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>High-Definition Lecture &amp; Multimedia Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono font-normal">
              Role: {role.toUpperCase()}
            </span>
          </h2>
          <p className="text-xs text-emerald-300/80 max-w-2xl mt-1">
            Publish high-quality recorded lectures, practical farm/lab demonstrations, audiobooks, and documentaries with chapters, companion handouts, and synchronized transcripts directly to the College OPAC and Student Portal.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successAlert && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-medium flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <div className="flex-1">{successAlert}</div>
          <button onClick={() => setSuccessAlert(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {errorAlert && (
        <div className="mt-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-medium flex items-center gap-3 animate-fadeIn shadow-lg">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <div className="flex-1">{errorAlert}</div>
          <button onClick={() => setErrorAlert(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* UPLOAD FORM */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6 relative z-10">
        {/* ROW 1: FORMAT & TYPE SELECTION */}
        <div className="p-4 rounded-2xl bg-[#02130c] border border-emerald-800/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase">Resource Classification</span>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  mediaType === 'video'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                }`}
              >
                <Video size={14} />
                <span>Video Lecture (1080p Full HD)</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaType('audio')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  mediaType === 'audio'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                }`}
              >
                <Headphones size={14} />
                <span>Audiobook / Podcast (High-Bitrate)</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase">Pedagogical Format</span>
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="mt-2 block w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-400"
            >
              <option value="lecture_recording">Classroom Recorded Lecture</option>
              <option value="practical_demo">Practical Field / Lab Demonstration</option>
              <option value="audiobook">Recorded Monograph &amp; Audiobook</option>
              <option value="documentary">Educational Documentary</option>
              <option value="podcast">Academic Seminar &amp; Podcast</option>
              <option value="language_lab">Language Lab &amp; Oral History</option>
            </select>
          </div>
        </div>

        {/* ROW 2: FILE UPLOAD DROPZONES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. MEDIA FILE DROPZONE */}
          <div
            onClick={() => mediaFileInputRef.current?.click()}
            className="p-5 rounded-2xl bg-[#02130c] border-2 border-dashed border-emerald-700/70 hover:border-emerald-400 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group"
          >
            <input
              type="file"
              ref={mediaFileInputRef}
              onChange={handleMediaFileChange}
              accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,video/x-matroska' : 'audio/mp3,audio/wav,audio/m4a,audio/aac'}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              {mediaType === 'video' ? <Video size={22} /> : <Headphones size={22} />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {mediaFile ? mediaFile.name : `Select High-Quality ${mediaType === 'video' ? 'Video' : 'Audio'} File`}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(1)} MB • ${formData.video_resolution || 'Ready'}` : 'Supports MP4, WebM, MOV, MP3, M4A'}
              </p>
            </div>
          </div>

          {/* 2. COVER / POSTER IMAGE DROPZONE */}
          <div
            onClick={() => coverFileInputRef.current?.click()}
            className="p-5 rounded-2xl bg-[#02130c] border-2 border-dashed border-emerald-700/70 hover:border-emerald-400 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group"
          >
            <input
              type="file"
              ref={coverFileInputRef}
              onChange={handleCoverFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            {coverPreviewUrl ? (
              <img src={coverPreviewUrl} alt="Cover preview" className="w-12 h-12 rounded-xl object-cover border border-emerald-500" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <ImageIcon size={22} />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white">
                {coverFile ? coverFile.name : 'Upload Lecture Poster / Thumbnail'}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                JPG, PNG, or WebP (16:9 recommended)
              </p>
            </div>
          </div>

          {/* 3. COMPANION PDF HANDOUT DROPZONE */}
          <div
            onClick={() => pdfFileInputRef.current?.click()}
            className="p-5 rounded-2xl bg-[#02130c] border-2 border-dashed border-emerald-700/70 hover:border-emerald-400 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group"
          >
            <input
              type="file"
              ref={pdfFileInputRef}
              onChange={handlePdfFileChange}
              accept="application/pdf"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {pdfFile ? pdfFile.name : 'Attach Companion Lecture Handout (PDF)'}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                Lecture slides, syllabus notes or exam guide
              </p>
            </div>
          </div>
        </div>

        {/* OR EXTERNAL STREAMING URL FALLBACK */}
        <div className="p-3.5 rounded-xl bg-[#02130c] border border-emerald-800 flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">External URL / CDN Stream (Optional):</span>
          <input
            type="url"
            value={formData.external_media_url}
            onChange={(e) => setFormData(prev => ({ ...prev, external_media_url: e.target.value }))}
            placeholder="https://... (Direct MP4, Google Drive, YouTube, or HLS .m3u8 URL)"
            className="flex-1 bg-[#010e08] text-white border border-emerald-700/60 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* ROW 3: ACADEMIC METADATA INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Lecture / Resource Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Principles of Co-operative Societies in West Africa"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Subtitle / Topic Breakdown</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g. Detailed Analysis of Rochdale Principles of 1844"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Lecturer / Presenter Name *</label>
            <input
              type="text"
              required
              value={formData.creator}
              onChange={(e) => setFormData(prev => ({ ...prev, creator: e.target.value }))}
              placeholder="e.g. Dr. O. A. Babalola"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Lecturer Title / Designation</label>
            <input
              type="text"
              value={formData.creator_title}
              onChange={(e) => setFormData(prev => ({ ...prev, creator_title: e.target.value }))}
              placeholder="e.g. Chief Lecturer & HOD"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Academic Department</label>
            <select
              value={formData.department_id}
              onChange={(e) => {
                const found = departmentsList.find(d => d.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  department_id: e.target.value,
                  department_name: found ? found.name : prev.department_name
                }));
              }}
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            >
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Course Code (e.g. CEM 111, COM 212)</label>
            <input
              type="text"
              value={formData.course_code}
              onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value.toUpperCase() }))}
              placeholder="e.g. CEM 111"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Target Level</label>
            <select
              value={formData.target_level}
              onChange={(e) => setFormData(prev => ({ ...prev, target_level: e.target.value }))}
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            >
              <option value="ND I">National Diploma I (ND I)</option>
              <option value="ND II">National Diploma II (ND II)</option>
              <option value="HND I">Higher National Diploma I (HND I)</option>
              <option value="HND II">Higher National Diploma II (HND II)</option>
              <option value="General">General Institutional / All Levels</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            >
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Duration (Formatted)</label>
            <input
              type="text"
              value={formData.duration_formatted}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_formatted: e.target.value }))}
              placeholder="e.g. 45:00 or 01:15:00"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* DESCRIPTION & KEYWORDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Lecture Summary &amp; Learning Objectives</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Explain core concepts covered in this recorded lecture..."
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-emerald-300">Keywords &amp; Examination Tags (Comma-separated)</label>
            <textarea
              rows={3}
              value={formData.subject_keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_keywords: e.target.value }))}
              placeholder="e.g. Rochdale Principles, Democratic Control, Credit Unions, Co-operative Finance"
              className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* ROW 4: CHAPTER MARKERS (AVALON / IIIF SPECIFICATION) */}
        <div className="p-5 rounded-2xl bg-[#02130c] border border-emerald-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" />
                <span>Lecture Chapter Timestamps (Avalon &amp; IIIF 3.0 AV Cues)</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Provide timestamp cue markers so students can jump straight to specific sub-topics.
              </p>
            </div>
            <button
              type="button"
              onClick={addChapter}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Chapter</span>
            </button>
          </div>

          <div className="space-y-2">
            {chapters.map((ch, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 bg-[#010e08] p-2.5 rounded-xl border border-emerald-900/80">
                <input
                  type="text"
                  value={ch.timestamp_formatted}
                  onChange={(e) => updateChapter(idx, 'timestamp_formatted', e.target.value)}
                  placeholder="00:00"
                  className="w-20 bg-slate-900 text-cyan-300 text-center font-mono font-bold border border-emerald-700/60 rounded-lg px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={ch.title}
                  onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                  placeholder="Chapter title (e.g. Normalization to 3NF)"
                  className="flex-1 min-w-[200px] bg-slate-900 text-white border border-emerald-700/60 rounded-lg px-3 py-1 text-xs"
                />
                <input
                  type="text"
                  value={ch.description}
                  onChange={(e) => updateChapter(idx, 'description', e.target.value)}
                  placeholder="Brief chapter notes (optional)"
                  className="flex-1 min-w-[150px] bg-slate-900 text-slate-300 border border-emerald-700/60 rounded-lg px-3 py-1 text-xs"
                />
                {chapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChapter(idx)}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/60 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ROW 5: TRANSCRIPT & ACCESSIBILITY */}
        <div className="p-5 rounded-2xl bg-[#02130c] border border-emerald-800 space-y-2">
          <label className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-emerald-400" />
            <span>Synchronized Lecture Transcript / Subtitles (Optional)</span>
          </label>
          <p className="text-[11px] text-slate-400">
            Paste or enter transcription text. The player will automatically synchronize it with student playback for accessibility and search indexing.
          </p>
          <textarea
            rows={4}
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Good morning students, welcome to today's lecture on..."
            className="w-full bg-[#010e08] text-white border border-emerald-700/80 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-400 leading-relaxed"
          />
        </div>

        {/* SUBMIT BUTTON WITH PROGRESS BAR */}
        <div className="pt-2">
          {isSubmitting && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-emerald-300">
                <span>Ingesting &amp; Cataloguing High-Definition Media...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-emerald-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-2xl cursor-pointer ${
              isSubmitting
                ? 'bg-emerald-900 text-emerald-300 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/80'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processing &amp; Publishing to Institutional Repository...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Publish High-Definition {mediaType === 'video' ? 'Video Lecture' : 'Audio Resource'} Live</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

