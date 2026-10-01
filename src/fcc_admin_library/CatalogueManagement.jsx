import React, { useState, useMemo } from 'react';
import {
  BookOpen, Plus, Search, Edit2, Trash2, Eye, X, CheckCircle,
  AlertTriangle, Upload, Globe, Tag, Hash, Calendar, User,
  FileText, Image, Save, ChevronDown, Filter, Download
} from 'lucide-react';

// =========================================================================
// CATALOGUE MANAGEMENT MODULE
// Complete bibliographic record management with all standard fields
// =========================================================================

const RESOURCE_TYPES = [
  'Book', 'E-Book', 'Journal', 'Article', 'Thesis', 'Dissertation',
  'Conference Paper', 'Report', 'Video', 'Audio', 'Map', 'Reference',
  'Newspaper', 'Magazine', 'Patent', 'Standard', 'Dataset'
];

const LANGUAGES = ['English', 'Yoruba', 'Igbo', 'Hausa', 'French', 'Arabic', 'Portuguese'];

const EMPTY_RECORD = {
  id: '',
  title: '',
  subtitle: '',
  author: '',
  additionalAuthors: '',
  isbn: '',
  issn: '',
  doi: '',
  edition: '',
  publisher: '',
  publicationPlace: '',
  year: new Date().getFullYear(),
  language: 'English',
  pages: '',
  series: '',
  subject: '',
  keywords: '',
  abstract: '',
  notes: '',
  classification: '',
  callNumber: '',
  resourceType: 'Book',
  coverImage: '',
  branch: '',
  shelfLocation: '',
  copiesTotal: 1,
  copiesAvailable: 1,
  isDigital: false,
  accessLevel: 'campus',
  department: '',
};

function FieldGroup({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputField({ value, onChange, placeholder, type = 'text', readOnly }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
    />
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange && onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function BiblioForm({ record, onSave, onCancel, isNew }) {
  const [form, setForm] = useState({ ...EMPTY_RECORD, ...record });
  const [errors, setErrors] = useState({});

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'Title is required';
    if (!form.author?.trim()) e.author = 'Author is required';
    if (!form.publisher?.trim()) e.publisher = 'Publisher is required';
    if (!form.year) e.year = 'Year is required';
    if (!form.callNumber?.trim()) e.callNumber = 'Call number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const id = form.id || `FCC-B${Date.now().toString().slice(-5)}`;
    onSave({ ...form, id });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">{isNew ? 'Add New Bibliographic Record' : 'Edit Record'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">All fields marked * are mandatory</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Title" required>
              <InputField value={form.title} onChange={set('title')} placeholder="Full title of the resource" />
              {errors.title && <p className="text-rose-400 text-[11px] mt-0.5">{errors.title}</p>}
            </FieldGroup>
            <FieldGroup label="Subtitle">
              <InputField value={form.subtitle} onChange={set('subtitle')} placeholder="Subtitle or variant title" />
            </FieldGroup>
          </div>

          {/* Authors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Primary Author / Corporate Body" required>
              <InputField value={form.author} onChange={set('author')} placeholder="e.g. Prof. A. O. Adebayo" />
              {errors.author && <p className="text-rose-400 text-[11px] mt-0.5">{errors.author}</p>}
            </FieldGroup>
            <FieldGroup label="Additional Authors / Editors">
              <InputField value={form.additionalAuthors} onChange={set('additionalAuthors')} placeholder="Comma-separated co-authors" />
            </FieldGroup>
          </div>

          {/* Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="ISBN">
              <InputField value={form.isbn} onChange={set('isbn')} placeholder="978-..." />
            </FieldGroup>
            <FieldGroup label="ISSN">
              <InputField value={form.issn} onChange={set('issn')} placeholder="XXXX-XXXX" />
            </FieldGroup>
            <FieldGroup label="DOI">
              <InputField value={form.doi} onChange={set('doi')} placeholder="10.xxxx/..." />
            </FieldGroup>
          </div>

          {/* Publication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FieldGroup label="Edition">
              <InputField value={form.edition} onChange={set('edition')} placeholder="e.g. 3rd Edition" />
            </FieldGroup>
            <FieldGroup label="Publisher" required>
              <InputField value={form.publisher} onChange={set('publisher')} placeholder="Publisher name" />
              {errors.publisher && <p className="text-rose-400 text-[11px] mt-0.5">{errors.publisher}</p>}
            </FieldGroup>
            <FieldGroup label="Publication Place">
              <InputField value={form.publicationPlace} onChange={set('publicationPlace')} placeholder="City, Country" />
            </FieldGroup>
            <FieldGroup label="Year" required>
              <InputField value={form.year} onChange={set('year')} type="number" placeholder="e.g. 2024" />
              {errors.year && <p className="text-rose-400 text-[11px] mt-0.5">{errors.year}</p>}
            </FieldGroup>
          </div>

          {/* Physical Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Language">
              <SelectField value={form.language} onChange={set('language')} options={LANGUAGES} />
            </FieldGroup>
            <FieldGroup label="Pages">
              <InputField value={form.pages} onChange={set('pages')} placeholder="e.g. 384" type="number" />
            </FieldGroup>
            <FieldGroup label="Series">
              <InputField value={form.series} onChange={set('series')} placeholder="Series title if applicable" />
            </FieldGroup>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Subject">
              <InputField value={form.subject} onChange={set('subject')} placeholder="Primary subject heading" />
            </FieldGroup>
            <FieldGroup label="Keywords">
              <InputField value={form.keywords} onChange={set('keywords')} placeholder="Comma-separated keywords" />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Classification Number">
              <InputField value={form.classification} onChange={set('classification')} placeholder="e.g. DDC 334.6 / LCC HD2963" />
            </FieldGroup>
            <FieldGroup label="Call Number" required>
              <InputField value={form.callNumber} onChange={set('callNumber')} placeholder="e.g. HD2963 .A34 2024" />
              {errors.callNumber && <p className="text-rose-400 text-[11px] mt-0.5">{errors.callNumber}</p>}
            </FieldGroup>
          </div>

          {/* Resource type & Access */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Resource Type">
              <SelectField value={form.resourceType} onChange={set('resourceType')} options={RESOURCE_TYPES} />
            </FieldGroup>
            <FieldGroup label="Access Level">
              <SelectField value={form.accessLevel} onChange={set('accessLevel')} options={['open', 'campus', 'registered', 'restricted']} />
            </FieldGroup>
            <FieldGroup label="Department">
              <InputField value={form.department} onChange={set('department')} placeholder="Responsible department" />
            </FieldGroup>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Branch / Library">
              <InputField value={form.branch} onChange={set('branch')} placeholder="e.g. Main Campus Library" />
            </FieldGroup>
            <FieldGroup label="Shelf Location">
              <InputField value={form.shelfLocation} onChange={set('shelfLocation')} placeholder="e.g. Floor 2 • Aisle 4 • Shelf 12B" />
            </FieldGroup>
            <FieldGroup label="Copies">
              <InputField value={form.copiesTotal} onChange={set('copiesTotal')} type="number" placeholder="1" />
            </FieldGroup>
          </div>

          {/* Abstract & Notes */}
          <FieldGroup label="Abstract">
            <textarea
              value={form.abstract || ''}
              onChange={e => set('abstract')(e.target.value)}
              rows={3}
              placeholder="Summary or abstract of the resource..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
            />
          </FieldGroup>

          <FieldGroup label="Notes">
            <InputField value={form.notes} onChange={set('notes')} placeholder="Cataloguer notes, restrictions, source, etc." />
          </FieldGroup>

          <FieldGroup label="Cover Image URL">
            <InputField value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." />
          </FieldGroup>

          {/* Digital */}
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.isDigital}
              onChange={e => set('isDigital')(e.target.checked)}
              className="rounded"
            />
            This is a digital / electronic resource
          </label>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md">
              <Save size={15} /> {isNew ? 'Add to Catalogue' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CatalogueManagement({ books = [], setBooks }) {
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDigital, setFilterDigital] = useState('All');
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchType = filterType === 'All' || (b.resourceType || 'Book') === filterType;
      const matchDigital = filterDigital === 'All' || (filterDigital === 'Digital' ? b.isDigital : !b.isDigital);
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.includes(q) ||
        b.callNumber?.toLowerCase().includes(q) ||
        b.subject?.toLowerCase().includes(q);
      return matchType && matchDigital && matchQuery;
    });
  }, [books, filterType, filterDigital, searchQuery]);

  const handleSave = (record) => {
    if (editRecord) {
      setBooks(books.map(b => b.id === record.id ? { ...b, ...record } : b));
      setActionStatus({ type: 'success', message: `Record "${record.title}" updated.` });
    } else {
      setBooks([record, ...books]);
      setActionStatus({ type: 'success', message: `"${record.title}" added to catalogue.` });
    }
    setShowForm(false);
    setEditRecord(null);
    try {
      localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(editRecord ? books.map(b => b.id === record.id ? { ...b, ...record } : b) : [record, ...books]));
    } catch (e) {}
  };

  const handleDelete = (id) => {
    const book = books.find(b => b.id === id);
    setBooks(books.filter(b => b.id !== id));
    setActionStatus({ type: 'success', message: `"${book?.title}" removed from catalogue.` });
    setConfirmDelete(null);
  };

  const exportCatalogueCSV = () => {
    const headers = ['ID', 'Title', 'Author', 'ISBN', 'Call Number', 'Subject', 'Publisher', 'Year', 'Copies', 'Available', 'Digital'];
    const rows = books.map(b => [b.id, `"${b.title}"`, `"${b.author}"`, b.isbn || '', b.callNumber || '', b.subject || '', b.publisher || '', b.year || '', b.copiesTotal || 1, b.copiesAvailable || 1, b.isDigital ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'FCC_Catalogue.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Catalogue Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">{books.length} records in the institutional catalogue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCatalogueCSV} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-2 border border-slate-700 transition">
            <Download size={15} /> Export
          </button>
          <button onClick={() => { setEditRecord(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
          actionStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search title, author, ISBN, call number..." className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-1.5">
          {['All', 'Digital', 'Physical'].map(s => (
            <button key={s} onClick={() => setFilterDigital(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterDigital === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Title & Author</th>
                <th className="py-3 px-4 text-left">ISBN / Call No.</th>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-left">Year</th>
                <th className="py-3 px-4 text-left">Copies</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/60 divide-y divide-slate-800/60">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono text-indigo-400 text-[10px]">{book.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white max-w-[200px] truncate">{book.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{book.author}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-300 text-[10px]">{book.isbn || '—'}</div>
                    <div className="font-mono text-emerald-400 text-[10px]">{book.callNumber}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{book.subject}</td>
                  <td className="py-3 px-4 text-slate-300">{book.year}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${book.copiesAvailable > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {book.copiesAvailable}/{book.copiesTotal}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      book.isDigital ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {book.isDigital ? 'Digital' : 'Physical'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewRecord(book)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"><Eye size={13} /></button>
                      <button onClick={() => { setEditRecord(book); setShowForm(true); }} className="p-1.5 rounded hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={13} /></button>
                      <button onClick={() => setConfirmDelete(book)} className="p-1.5 rounded hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBooks.length === 0 && <div className="text-center py-12 text-slate-500">No records found.</div>}
        </div>
      </div>

      {/* View modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">{viewRecord.title}</h3>
              <button onClick={() => setViewRecord(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries({
                'Author': viewRecord.author, 'ISBN': viewRecord.isbn, 'Call Number': viewRecord.callNumber,
                'Publisher': viewRecord.publisher, 'Year': viewRecord.year, 'Edition': viewRecord.edition,
                'Subject': viewRecord.subject, 'Language': viewRecord.language, 'Pages': viewRecord.pages,
                'Branch': viewRecord.branch, 'Shelf': viewRecord.shelfLocation,
                'Copies': `${viewRecord.copiesAvailable} / ${viewRecord.copiesTotal}`,
                'Resource Type': viewRecord.resourceType, 'Access Level': viewRecord.accessLevel,
              }).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex gap-2"><span className="text-slate-400">{k}:</span><span className="text-white">{v}</span></div>
              ))}
            </div>
            {viewRecord.abstract && <p className="text-sm text-slate-300 leading-relaxed">{viewRecord.abstract}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditRecord(viewRecord); setShowForm(true); setViewRecord(null); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2">
                <Edit2 size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Record?</h3>
            <p className="text-sm text-slate-300">Remove <strong>"{confirmDelete.title}"</strong> from the catalogue? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <BiblioForm
          record={editRecord || {}}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditRecord(null); }}
          isNew={!editRecord}
        />
      )}
    </div>
  );
}
