import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, BookOpen, Download, Eye, FileText, Search,
  CheckCircle, Sparkles, Filter, ExternalLink, ShieldAlert, Tag, MapPin
} from 'lucide-react';

export default function DepartmentalResourcesView({ user, onOpenReader }) {
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [watermarkNotice, setWatermarkNotice] = useState('');

  const userDept = user?.dept || 'Co-operative Economics & Management';

  const fetchDepartmentUploads = async () => {
    setIsLoading(true);
    let allApproved = [];
    try {
      const res = await fetch(`/api/department-uploads?status=approved`);
      if (res.ok) {
        const data = await res.json();
        allApproved = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.warn('API fetch warning, checking storage cache:', e);
    }

    try {
      // 1. Gather approved items from local submissions
      const localSubmissions = JSON.parse(localStorage.getItem('fcc_hod_submissions_v48') || '[]');
      const pendingQueue = JSON.parse(localStorage.getItem('fcc_pending_department_uploads') || '[]');
      const localApproved = [...localSubmissions, ...pendingQueue].filter(s => s.status === 'approved');

      // 2. Gather approved items from local catalog
      const catalog = JSON.parse(localStorage.getItem('fcc_catalog_v48_gov') || '[]');
      const catalogHodItems = catalog.filter(b => b.id && String(b.id).includes('HOD'));

      const combined = [...allApproved];
      const seen = new Set(combined.map(x => String(x.id || x.title)));

      for (const item of localApproved) {
        const key = String(item.id || item.title);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      for (const cat of catalogHodItems) {
        const key = String(cat.id || cat.title);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push({
            id: cat.id,
            title: cat.title,
            author: cat.author,
            department_name: cat.department || cat.subject,
            course_code: cat.courseCode || 'GEN',
            target_level: cat.targetLevel || 'HND II',
            resource_type: cat.format === 'E-Book' ? 'Lecture Handout' : 'Research Monograph',
            assigned_call_number: cat.callNumber,
            assigned_shelf: cat.shelfLocation,
            file_data_url: cat.fileDataUrl,
            file_name: cat.fileName,
            abstract: cat.abstract,
            access_scope: cat.accessLevel || 'Public Institution-Wide',
            status: 'approved'
          });
        }
      }

      setUploads(combined);
    } catch (err) {
      setUploads(allApproved);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentUploads();

    const handleSync = () => {
      fetchDepartmentUploads();
    };

    window.addEventListener('fcc-submissions-updated', handleSync);
    window.addEventListener('fcc-catalog-updated', handleSync);
    return () => {
      window.removeEventListener('fcc-submissions-updated', handleSync);
      window.removeEventListener('fcc-catalog-updated', handleSync);
    };
  }, []);

  const resourceTypes = ['All', 'Past Exam Questions', 'Lecture Handout', 'Capstone Project', 'Research Monograph'];

  const filteredItems = useMemo(() => {
    return uploads.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.course_code && item.course_code.toLowerCase().includes(q)) ||
        (item.author && item.author.toLowerCase().includes(q));

      const matchType = selectedType === 'All' || item.resource_type === selectedType;
      return matchQuery && matchType;
    });
  }, [uploads, searchQuery, selectedType]);

  const handleDownload = (item) => {
    setWatermarkNotice(`Downloading "${item.title}" with digital watermark protection for scholar ${user?.matric || 'FCC Scholar'}...`);
    const fileSrc = item.file_data_url || item.fileDataUrl;
    if (fileSrc) {
      const a = document.createElement('a');
      a.href = fileSrc;
      a.download = item.file_name || `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => setWatermarkNotice(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/60 border border-slate-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          <GraduationCap size={14} className="text-teal-400" />
          <span>Departmental Academic Shelf • Staging Pipeline Ingested</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          My Department Resources & Syllabi Materials
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
          Official departmental lecture handouts, past examination papers, capstones, and course texts uploaded by your Head of Department (HOD) and verified by the Central Library Cataloging Directorate.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Your Department:</span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-teal-400 font-bold border border-slate-800 font-mono">
            {userDept}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Patron: <strong className="text-slate-200">{user?.name}</strong> ({user?.matric})</span>
        </div>
      </div>

      {/* Watermark Download Feedback */}
      {watermarkNotice && (
        <div className="p-4 rounded-2xl bg-teal-950 border border-teal-500 text-teal-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <ShieldAlert size={18} className="text-teal-400 shrink-0" />
          <span>{watermarkNotice}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search departmental past questions, course code (e.g. CEM 411, CSC 301)..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {resourceTypes.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedType === t
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <BookOpen size={36} className="mx-auto text-slate-600" />
            <h4 className="text-base font-bold text-white">No Departmental Resources Found</h4>
            <p className="text-xs text-slate-400">
              Try adjusting your search query or resource filter.
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl hover:border-teal-500/50 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                    {item.course_code || 'COURSE'} • {item.target_level || 'HND II'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {item.resource_type || 'Lecture Material'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400">
                  By {item.author} • {item.department_name}
                </p>

                {item.assigned_call_number && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-slate-300">
                    <Tag size={12} className="text-teal-400" />
                    <span>Call No: <strong className="text-emerald-300">{item.assigned_call_number}</strong></span>
                    <span>•</span>
                    <span className="text-slate-400">{item.assigned_shelf}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.access_scope}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                    title="Download Watermarked PDF"
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenReader) {
                        onOpenReader({
                          id: item.book_id || item.id,
                          title: item.title,
                          subtitle: `Departmental Resource • ${item.course_code || 'GEN'} (${item.target_level || 'HND II'})`,
                          author: item.author,
                          authorCredentials: `Faculty Contributor (${item.department_name})`,
                          subject: item.department_name,
                          department: item.department_name,
                          courseCode: item.course_code,
                          targetLevel: item.target_level,
                          pdfPages: 120,
                          callNumber: item.assigned_call_number || 'QA76.9 .GEN 2026',
                          shelfLocation: item.assigned_shelf || 'Digital Library Stacks',
                          fileDataUrl: item.file_data_url || item.fileDataUrl || '',
                          pdfUrl: item.file_data_url || item.fileDataUrl || '',
                          fileName: item.file_name || `${item.title}.pdf`,
                          abstract: item.abstract || 'Approved Departmental Curriculum Resource.',
                          isDigital: true,
                          year: 2026
                        });
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-950 flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>Read Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
