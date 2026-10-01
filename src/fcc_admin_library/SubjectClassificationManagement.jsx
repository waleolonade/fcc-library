import React, { useState, useMemo } from 'react';
import {
  Tag, Plus, Search, Edit2, Trash2, X, CheckCircle, Save,
  ChevronDown, ChevronRight, BookOpen, Hash, Layers, Settings
} from 'lucide-react';
import { INITIAL_SUBJECTS, CLASSIFICATION_SYSTEMS } from '../data/institutionalSeedData';

// =========================================================================
// SUBJECT & CLASSIFICATION MANAGEMENT
// Subjects, Categories, Subcategories, Keywords
// DDC / LCC / Local/Custom classification — NOT hardcoded
// =========================================================================

const EMPTY_SUBJECT = {
  id: '', name: '', category: '', subcategory: '', keywords: '', description: '', resourceCount: 0,
};

function SubjectForm({ subject, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...EMPTY_SUBJECT,
    ...subject,
    keywords: Array.isArray(subject?.keywords) ? subject.keywords.join(', ') : (subject?.keywords || ''),
  });
  const set = (f) => (v) => setForm(s => ({ ...s, [f]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) { alert('Subject name is required.'); return; }
    onSave({
      ...form,
      id: form.id || `SUB-${Date.now().toString().slice(-5)}`,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{form.id ? 'Edit Subject' : 'Add Subject'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Subject Name *', field: 'name', placeholder: 'e.g. Co-operative Economics' },
            { label: 'Category', field: 'category', placeholder: 'e.g. Management Sciences' },
            { label: 'Subcategory', field: 'subcategory', placeholder: 'e.g. Cooperative Finance' },
            { label: 'Keywords (comma-separated)', field: 'keywords', placeholder: 'apex unions, rural finance, cooperative law' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
              <input type="text" value={form[field] || ''} onChange={e => set(field)(e.target.value)} placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => set('description')(e.target.value)} rows={2} placeholder="Brief description of this subject area..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
              <Save size={14} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClassificationPanel({ system, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const colorMap = { 'CLASS-DDC': 'indigo', 'CLASS-LCC': 'emerald', 'CLASS-LOCAL': 'amber' };
  const color = colorMap[system.id] || 'slate';
  const borderColor = { indigo: 'border-indigo-500/30', emerald: 'border-emerald-500/30', amber: 'border-amber-500/30' };
  const bgColor = { indigo: 'bg-indigo-500/10', emerald: 'bg-emerald-500/10', amber: 'bg-amber-500/10' };
  const textColor = { indigo: 'text-indigo-300', emerald: 'text-emerald-300', amber: 'text-amber-300' };

  return (
    <div className={`rounded-2xl border ${system.active ? borderColor[color] : 'border-slate-700'} overflow-hidden`}>
      <div className={`p-4 flex items-center justify-between ${system.active ? bgColor[color] : 'bg-slate-900'}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-slate-800/30 transition">
            {expanded ? <ChevronDown size={16} className={textColor[color]} /> : <ChevronRight size={16} className="text-slate-400" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-sm ${system.active ? textColor[color] : 'text-slate-400'}`}>{system.name}</p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{system.shortCode}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{system.description}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-slate-400">{system.active ? 'Active' : 'Inactive'}</span>
          <div
            onClick={() => onToggle(system.id)}
            className={`w-10 h-5 rounded-full relative cursor-pointer transition ${system.active ? (color === 'indigo' ? 'bg-indigo-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600') : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${system.active ? 'left-5' : 'left-0.5'}`} />
          </div>
        </label>
      </div>
      {expanded && (
        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {system.topClasses.map(cls => (
              <div key={cls.code} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="font-mono font-bold text-white">{cls.code}</span>
                <p className="text-slate-400 mt-0.5 text-[10px]">{cls.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectClassificationManagement({ books = [], setBooks }) {
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [classificationSystems, setClassificationSystems] = useState(CLASSIFICATION_SYSTEMS);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' | 'classification'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionStatus, setActionStatus] = useState(null);

  const filteredSubjects = useMemo(() =>
    subjects.filter(s => !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(s.keywords) ? s.keywords.join(' ') : s.keywords || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [subjects, searchQuery]);

  const handleSaveSubject = (subject) => {
    if (editSubject) {
      setSubjects(subjects.map(s => s.id === subject.id ? subject : s));
      setActionStatus({ message: `Subject "${subject.name}" updated.` });
    } else {
      setSubjects([subject, ...subjects]);
      setActionStatus({ message: `Subject "${subject.name}" added.` });
    }
    setShowSubjectForm(false);
    setEditSubject(null);
  };

  const toggleClassification = (classId) => {
    setClassificationSystems(classificationSystems.map(c =>
      c.id === classId ? { ...c, active: !c.active } : c
    ));
  };

  // Category grouping
  const categories = useMemo(() => {
    const map = {};
    subjects.forEach(s => {
      const cat = s.category || 'Uncategorised';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return map;
  }, [subjects]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Subject &amp; Classification</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage subjects, categories, keywords and classification systems</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
            {[{ id: 'subjects', label: 'Subjects' }, { id: 'classification', label: 'Classification Systems' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}>{t.label}</button>
            ))}
          </div>
          {activeTab === 'subjects' && (
            <button onClick={() => { setEditSubject(null); setShowSubjectForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
              <Plus size={15} /> Add Subject
            </button>
          )}
        </div>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="space-y-5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search subjects, categories, keywords..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          {/* Category groupings */}
          {searchQuery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSubjects.map(s => (
                <SubjectCard key={s.id} subject={s} onEdit={() => { setEditSubject(s); setShowSubjectForm(true); }} onDelete={() => { setSubjects(subjects.filter(x => x.id !== s.id)); setActionStatus({ message: `"${s.name}" removed.` }); }} />
              ))}
            </div>
          ) : (
            Object.entries(categories).map(([category, subs]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={13} /> {category} <span className="text-slate-600 font-normal">({subs.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subs.map(s => (
                    <SubjectCard key={s.id} subject={s} onEdit={() => { setEditSubject(s); setShowSubjectForm(true); }} onDelete={() => { setSubjects(subjects.filter(x => x.id !== s.id)); setActionStatus({ message: `"${s.name}" removed.` }); }} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CLASSIFICATION TAB */}
      {activeTab === 'classification' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <Settings size={14} className="shrink-0 mt-0.5 text-indigo-400" />
            <p>Classification systems can be toggled active/inactive. The system supports DDC, LCC, and custom local classification simultaneously. Call numbers are entered per-record in the Catalogue Management module.</p>
          </div>
          <div className="space-y-3">
            {classificationSystems.map(system => (
              <ClassificationPanel key={system.id} system={system} onToggle={toggleClassification} />
            ))}
          </div>
        </div>
      )}

      {showSubjectForm && (
        <SubjectForm subject={editSubject || {}} onSave={handleSaveSubject} onCancel={() => { setShowSubjectForm(false); setEditSubject(null); }} />
      )}
    </div>
  );
}

function SubjectCard({ subject, onEdit, onDelete }) {
  const keywords = Array.isArray(subject.keywords) ? subject.keywords : (subject.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{subject.name}</p>
          <p className="text-xs text-indigo-400">{subject.category}{subject.subcategory && ` › ${subject.subcategory}`}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300"><Edit2 size={12} /></button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-rose-600/20 text-slate-400 hover:text-rose-300"><Trash2 size={12} /></button>
        </div>
      </div>
      {subject.description && <p className="text-xs text-slate-400">{subject.description}</p>}
      <div className="flex flex-wrap gap-1">
        {keywords.slice(0, 5).map(kw => (
          <span key={kw} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">{kw}</span>
        ))}
        {keywords.length > 5 && <span className="text-[10px] text-slate-500">+{keywords.length - 5}</span>}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-xs text-slate-500 flex items-center gap-1"><BookOpen size={11} /> {subject.resourceCount} resource{subject.resourceCount !== 1 ? 's' : ''}</span>
        <span className="text-[10px] font-mono text-slate-600">{subject.id}</span>
      </div>
    </div>
  );
}
