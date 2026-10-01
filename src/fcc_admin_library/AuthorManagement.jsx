import React, { useState, useMemo } from 'react';
import {
  User, Plus, Search, Edit2, Trash2, Eye, X, CheckCircle,
  BookOpen, Globe, Save, ExternalLink, Hash
} from 'lucide-react';
import { INITIAL_AUTHORS } from '../data/institutionalSeedData';

// =========================================================================
// AUTHOR MANAGEMENT MODULE
// Fields: first/middle/last name, biography, DOB, nationality, profile image,
// related publications. Author page shows all associated resources.
// =========================================================================

const EMPTY_AUTHOR = {
  id: '',
  firstName: '',
  middleName: '',
  lastName: '',
  biography: '',
  dateOfBirth: '',
  nationality: '',
  profileImage: '',
  email: '',
  orcid: '',
  affiliation: '',
  researchAreas: '',
  publicationIds: [],
};

function AuthorForm({ author, books, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...EMPTY_AUTHOR,
    ...author,
    researchAreas: Array.isArray(author?.researchAreas) ? author.researchAreas.join(', ') : (author?.researchAreas || ''),
    publicationIds: author?.publicationIds || [],
  });
  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { alert('First and last name are required.'); return; }
    onSave({
      ...form,
      id: form.id || `AUTH-${Date.now().toString().slice(-5)}`,
      fullName: [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' '),
      researchAreas: form.researchAreas.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const togglePublication = (bookId) => {
    setForm(f => ({
      ...f,
      publicationIds: f.publicationIds.includes(bookId)
        ? f.publicationIds.filter(id => id !== bookId)
        : [...f.publicationIds, bookId],
    }));
  };

  const F = ({ label, field, placeholder, type = 'text', required }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      <input type={type} value={form[field] || ''} onChange={e => set(field)(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{form.id ? 'Edit Author' : 'Add New Author'}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div className="grid grid-cols-3 gap-4">
            <F label="First Name" field="firstName" placeholder="e.g. Adeyemi" required />
            <F label="Middle Name" field="middleName" placeholder="Optional" />
            <F label="Last Name" field="lastName" placeholder="e.g. Adebayo" required />
          </div>

          {/* Profile image */}
          <F label="Profile Image URL" field="profileImage" placeholder="https://..." />

          {/* Contact & IDs */}
          <div className="grid grid-cols-2 gap-4">
            <F label="Email" field="email" placeholder="author@institution.edu.ng" type="email" />
            <F label="ORCID" field="orcid" placeholder="0000-0001-XXXX-XXXX" />
          </div>

          {/* Affiliation */}
          <div className="grid grid-cols-2 gap-4">
            <F label="Affiliation" field="affiliation" placeholder="Institution / Organisation" />
            <F label="Nationality" field="nationality" placeholder="e.g. Nigerian" />
          </div>

          <F label="Date of Birth (where applicable)" field="dateOfBirth" type="date" />

          {/* Biography */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Biography</label>
            <textarea value={form.biography || ''} onChange={e => set('biography')(e.target.value)} rows={4}
              placeholder="Academic background, research contributions, awards..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500" />
          </div>

          {/* Research Areas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Research Areas (comma-separated)</label>
            <input type="text" value={form.researchAreas || ''} onChange={e => set('researchAreas')(e.target.value)}
              placeholder="e.g. Cooperative Economics, Agricultural Finance" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          {/* Publications */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Related Publications</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {books.map(b => (
                <label key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:border-indigo-500/30 transition">
                  <input type="checkbox" checked={form.publicationIds.includes(b.id)} onChange={() => togglePublication(b.id)} className="rounded accent-indigo-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{b.id} • {b.year}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition">
              <Save size={15} /> Save Author
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthorPage({ author, books, onClose, onEdit }) {
  const publications = books.filter(b => (author.publicationIds || []).includes(b.id));
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Author Profile</h2>
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 flex items-center gap-1">
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
              {author.profileImage
                ? <img src={author.profileImage} alt={author.fullName} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                : <div className="w-full h-full flex items-center justify-center"><User size={32} className="text-slate-500" /></div>
              }
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{author.fullName}</h3>
              <p className="text-sm text-slate-400">{author.affiliation}</p>
              {author.nationality && <p className="text-xs text-slate-500">{author.nationality}</p>}
              {author.orcid && (
                <p className="text-xs font-mono text-indigo-400 flex items-center gap-1">
                  <Hash size={11} /> ORCID: {author.orcid}
                </p>
              )}
              {author.email && <p className="text-xs text-slate-400">{author.email}</p>}
            </div>
          </div>

          {/* Research Areas */}
          {Array.isArray(author.researchAreas) && author.researchAreas.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Research Areas</h4>
              <div className="flex flex-wrap gap-2">
                {author.researchAreas.map(area => (
                  <span key={area} className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">{area}</span>
                ))}
              </div>
            </div>
          )}

          {/* Biography */}
          {author.biography && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biography</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{author.biography}</p>
            </div>
          )}

          {/* Publications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={13} /> Publications ({publications.length})
            </h4>
            {publications.length === 0 ? (
              <p className="text-xs text-slate-500">No publications linked to this author.</p>
            ) : (
              <div className="space-y-2">
                {publications.map(b => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{b.title}</p>
                      <p className="text-xs text-slate-400">{b.publisher} • {b.year}</p>
                      <p className="text-xs font-mono text-emerald-400">{b.callNumber}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${b.isDigital ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
                      {b.isDigital ? 'Digital' : 'Physical'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthorManagement({ books = [] }) {
  const [authors, setAuthors] = useState(INITIAL_AUTHORS);
  const [showForm, setShowForm] = useState(false);
  const [editAuthor, setEditAuthor] = useState(null);
  const [viewAuthor, setViewAuthor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredAuthors = useMemo(() =>
    authors.filter(a => !searchQuery ||
      a.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.affiliation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nationality?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [authors, searchQuery]);

  const handleSave = (author) => {
    if (editAuthor) {
      setAuthors(authors.map(a => a.id === author.id ? author : a));
      setActionStatus({ message: `Author "${author.fullName}" updated.` });
    } else {
      setAuthors([author, ...authors]);
      setActionStatus({ message: `Author "${author.fullName}" added.` });
    }
    setShowForm(false);
    setEditAuthor(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Author Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">{authors.length} authors in registry</p>
        </div>
        <button onClick={() => { setEditAuthor(null); setShowForm(true); }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
          <Plus size={15} /> Add Author
        </button>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, affiliation or nationality..."
          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAuthors.map(author => {
          const publications = books.filter(b => (author.publicationIds || []).includes(b.id));
          return (
            <div key={author.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                  {author.profileImage
                    ? <img src={author.profileImage} alt={author.fullName} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                    : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-slate-500" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{author.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{author.affiliation}</p>
                  <p className="text-[10px] text-slate-500">{author.nationality}</p>
                </div>
              </div>

              {Array.isArray(author.researchAreas) && (
                <div className="flex flex-wrap gap-1">
                  {author.researchAreas.slice(0, 2).map(area => (
                    <span key={area} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">{area}</span>
                  ))}
                  {author.researchAreas.length > 2 && (
                    <span className="text-[10px] text-slate-500">+{author.researchAreas.length - 2}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <BookOpen size={11} /> {publications.length} publication{publications.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setViewAuthor(author)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"><Eye size={14} /></button>
                  <button onClick={() => { setEditAuthor(author); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={14} /></button>
                  <button onClick={() => setConfirmDelete(author)} className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredAuthors.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500">No authors found.</div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Author?</h3>
            <p className="text-sm text-slate-300">Remove <strong>{confirmDelete.fullName}</strong> from the registry?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
              <button onClick={() => { setAuthors(authors.filter(a => a.id !== confirmDelete.id)); setConfirmDelete(null); setActionStatus({ message: 'Author removed.' }); }} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && <AuthorForm author={editAuthor || {}} books={books} onSave={handleSave} onCancel={() => { setShowForm(false); setEditAuthor(null); }} />}
      {viewAuthor && <AuthorPage author={viewAuthor} books={books} onClose={() => setViewAuthor(null)} onEdit={() => { setEditAuthor(viewAuthor); setShowForm(true); setViewAuthor(null); }} />}
    </div>
  );
}
