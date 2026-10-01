import React, { useState, useMemo } from 'react';
import {
  Megaphone, Plus, Edit2, Trash2, X, CheckCircle, Save,
  Calendar, Eye, EyeOff, Globe, Lock
} from 'lucide-react';
import { INITIAL_FULL_ANNOUNCEMENTS } from '../data/institutionalSeedData';

// =========================================================================
// ANNOUNCEMENTS MANAGER — Admin creates/manages announcements
// Fields: Title, Content, Image, Start date, End date, Status, Priority
// Shown on OPAC homepage when Published
// =========================================================================

const STATUSES = ['Draft', 'Published', 'Archived'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const TARGET_AUDIENCES = ['All', 'All Students', 'All Staff', 'Postgraduate', 'Undergraduate', 'Faculty Only'];

const EMPTY = {
  id: '', title: '', content: '', image: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  status: 'Draft', priority: 'Medium', author: '', targetAudience: 'All', badgeColor: 'emerald',
};

function AnnouncementForm({ announcement, onSave, onCancel, authorName }) {
  const [form, setForm] = useState({ ...EMPTY, author: authorName || 'Library Admin', ...announcement });
  const set = (f) => (v) => setForm(s => ({ ...s, [f]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { alert('Title and content are required.'); return; }
    onSave({ ...form, id: form.id || `ANN-${Date.now().toString().slice(-6)}` });
  };

  const BADGE_COLORS = ['emerald', 'indigo', 'rose', 'amber', 'teal', 'purple'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{form.id ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Announcement title..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Content *</label>
            <textarea value={form.content} onChange={e => set('content')(e.target.value)} rows={5} placeholder="Full announcement text..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL (optional)</label>
            <input type="url" value={form.image || ''} onChange={e => set('image')(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select value={form.priority} onChange={e => set('priority')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
              <select value={form.targetAudience} onChange={e => set('targetAudience')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
                {TARGET_AUDIENCES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Badge Colour</label>
            <div className="flex gap-2">
              {BADGE_COLORS.map(c => {
                const bg = { emerald: 'bg-emerald-500', indigo: 'bg-indigo-500', rose: 'bg-rose-500', amber: 'bg-amber-500', teal: 'bg-teal-500', purple: 'bg-purple-500' };
                return (
                  <button key={c} type="button" onClick={() => set('badgeColor')(c)} className={`w-7 h-7 rounded-lg ${bg[c]} transition ${form.badgeColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'opacity-60 hover:opacity-100'}`} />
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
            <button type="button" onClick={() => { set('status')('Draft'); handleSubmit({ preventDefault: () => {} }); }} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm">Save Draft</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md">
              <Save size={14} /> {form.status === 'Published' ? 'Publish' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsManager({ user }) {
  const [announcements, setAnnouncements] = useState(INITIAL_FULL_ANNOUNCEMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [previewAnn, setPreviewAnn] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const filtered = useMemo(() =>
    announcements.filter(a => filterStatus === 'All' || a.status === filterStatus),
    [announcements, filterStatus]
  );

  const published = announcements.filter(a => {
    if (a.status !== 'Published') return false;
    const today = new Date().toISOString().split('T')[0];
    return a.startDate <= today && a.endDate >= today;
  });

  const handleSave = (ann) => {
    if (editAnn) {
      setAnnouncements(announcements.map(a => a.id === ann.id ? ann : a));
      setActionStatus({ message: `"${ann.title}" updated.` });
    } else {
      setAnnouncements([ann, ...announcements]);
      setActionStatus({ message: `"${ann.title}" ${ann.status === 'Published' ? 'published' : 'saved as draft'}.` });
    }
    setShowForm(false);
    setEditAnn(null);
  };

  const togglePublish = (id) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, status: a.status === 'Published' ? 'Draft' : 'Published' } : a));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setAnnouncements(announcements.filter(a => a.id !== id));
    setActionStatus({ message: 'Announcement deleted.' });
  };

  const BADGE_BG = { emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30', amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30', teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30', purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Announcements</h2>
          <p className="text-slate-400 text-sm mt-0.5">{published.length} active on OPAC homepage • {announcements.length} total</p>
        </div>
        <button onClick={() => { setEditAnn(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(ann => (
          <div key={ann.id} className={`p-4 rounded-2xl border transition ${ann.status === 'Published' ? 'bg-slate-900 border-slate-700' : ann.status === 'Draft' ? 'bg-slate-900/60 border-slate-800 opacity-75' : 'bg-slate-900/40 border-slate-800/60 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${BADGE_BG[ann.badgeColor] || BADGE_BG.emerald}`}>{ann.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ann.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ann.status === 'Draft' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>{ann.status}</span>
                  <span className="text-[10px] text-slate-500">{ann.targetAudience}</span>
                </div>
                <h3 className="font-bold text-white">{ann.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{ann.content}</p>
                <div className="flex gap-4 text-[11px] text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {ann.startDate} → {ann.endDate}</span>
                  <span>By: {ann.author}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setPreviewAnn(ann)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"><Eye size={14} /></button>
                <button onClick={() => togglePublish(ann.id)} className={`p-1.5 rounded-lg transition ${ann.status === 'Published' ? 'hover:bg-amber-600/20 text-emerald-400 hover:text-amber-300' : 'hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300'}`} title={ann.status === 'Published' ? 'Unpublish' : 'Publish'}>
                  {ann.status === 'Published' ? <EyeOff size={14} /> : <Globe size={14} />}
                </button>
                <button onClick={() => { setEditAnn(ann); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No announcements.</div>}
      </div>

      {/* Preview modal */}
      {previewAnn && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">Preview: OPAC Display</h3>
              <button onClick={() => setPreviewAnn(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
            </div>
            <div className={`p-4 rounded-xl border ${BADGE_BG[previewAnn.badgeColor]?.split(' ').slice(1).join(' ')}`}>
              <div className="flex items-start gap-3">
                <Megaphone size={20} className={BADGE_BG[previewAnn.badgeColor]?.split(' ')[0]} />
                <div>
                  <p className="font-bold text-white">{previewAnn.title}</p>
                  <p className="text-xs mt-1 text-slate-300">{previewAnn.content}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{previewAnn.startDate} • {previewAnn.author}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">This is how the announcement will appear on the public OPAC homepage when Published and within the active date range.</p>
          </div>
        </div>
      )}

      {showForm && (
        <AnnouncementForm
          announcement={editAnn || {}}
          authorName={user?.name}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditAnn(null); }}
        />
      )}
    </div>
  );
}
