import React, { useState, useMemo } from 'react';
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, CheckCircle,
  AlertTriangle, Barcode, MapPin, Calendar, Save, Filter, Hash
} from 'lucide-react';
import { INITIAL_ITEM_COPIES } from '../data/institutionalSeedData';

// =========================================================================
// COPY MANAGEMENT — Per-copy records for each physical copy of a title
// Statuses: Available, Borrowed, Reserved, Lost, Damaged, Missing, Under Repair, Reference Only, Withdrawn
// =========================================================================

const COPY_STATUSES = ['Available', 'Borrowed', 'Reserved', 'Lost', 'Damaged', 'Missing', 'Under Repair', 'Reference Only', 'Withdrawn'];
const CONDITIONS = ['New', 'Very Good', 'Good', 'Fair', 'Poor', 'Damaged'];

function StatusBadge({ status }) {
  const cfg = {
    Available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Borrowed: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Reserved: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Lost: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Damaged: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Missing: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'Under Repair': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Reference Only': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Withdrawn: 'bg-slate-600 text-slate-400 border-slate-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg[status] || cfg.Available}`}>
      {status}
    </span>
  );
}

const EMPTY_COPY = {
  id: '',
  bookId: '',
  copyNumber: 1,
  accessionNumber: '',
  barcode: '',
  rfidTag: '',
  callNumber: '',
  branch: '',
  section: '',
  shelf: '',
  rack: '',
  acquisitionDate: new Date().toISOString().split('T')[0],
  acquisitionSource: '',
  price: '',
  condition: 'Good',
  status: 'Available',
  notes: '',
};

function CopyForm({ copy, books, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_COPY, ...copy });
  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bookId || !form.barcode || !form.accessionNumber) {
      alert('Book, Barcode, and Accession Number are required.');
      return;
    }
    onSave({
      ...form,
      id: form.id || `CPY-${form.bookId}-${Date.now().toString().slice(-5)}`,
    });
  };

  const InputF = ({ field, placeholder, type = 'text', readOnly }) => (
    <input
      type={type}
      value={form[field] || ''}
      onChange={e => set(field)(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
    />
  );

  const SelectF = ({ field, options }) => (
    <select
      value={form[field] || ''}
      onChange={e => set(field)(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const Label = ({ children, required }) => (
    <label className="block text-xs font-semibold text-slate-300 mb-1">
      {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{copy?.id ? 'Edit Copy Record' : 'Add New Copy'}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Title Link */}
          <div>
            <Label required>Parent Title (Book)</Label>
            <select
              value={form.bookId}
              onChange={e => {
                const book = books.find(b => b.id === e.target.value);
                set('bookId')(e.target.value);
                if (book) {
                  set('callNumber')(book.callNumber);
                  set('branch')(book.branch || '');
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a title...</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title} ({b.id})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><Label required>Copy Number</Label><InputF field="copyNumber" type="number" placeholder="1" /></div>
            <div><Label required>Accession Number</Label><InputF field="accessionNumber" placeholder="ACC-2024-0001" /></div>
            <div><Label required>Barcode</Label><InputF field="barcode" placeholder="FCC-CP-00001" /></div>
            <div><Label>RFID Tag</Label><InputF field="rfidTag" placeholder="RFID-A01-001" /></div>
            <div><Label>Call Number</Label><InputF field="callNumber" placeholder="HD2963 .A34" /></div>
            <div><Label>Copy ID</Label><InputF field="id" placeholder="CPY-B001-001" /></div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><Label>Branch</Label><InputF field="branch" placeholder="Main Campus Library" /></div>
            <div><Label>Section</Label><InputF field="section" placeholder="Academic Holdings" /></div>
            <div><Label>Shelf</Label><InputF field="shelf" placeholder="Shelf 12B" /></div>
            <div><Label>Rack</Label><InputF field="rack" placeholder="Rack 3" /></div>
          </div>

          {/* Acquisition */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><Label>Acquisition Date</Label><InputF field="acquisitionDate" type="date" /></div>
            <div><Label>Acquisition Source</Label><InputF field="acquisitionSource" placeholder="Publisher / Donor / Purchase" /></div>
            <div><Label>Price (₦)</Label><InputF field="price" type="number" placeholder="4500" /></div>
          </div>

          {/* Status & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Condition</Label><SelectF field="condition" options={CONDITIONS} /></div>
            <div><Label>Status</Label><SelectF field="status" options={COPY_STATUSES} /></div>
          </div>

          <div>
            <Label>Notes</Label>
            <input type="text" value={form.notes || ''} onChange={e => set('notes')(e.target.value)} placeholder="Additional notes about this copy..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition">
              <Save size={15} /> Save Copy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CopyManagement({ books = [] }) {
  const [copies, setCopies] = useState(INITIAL_ITEM_COPIES);
  const [showForm, setShowForm] = useState(false);
  const [editCopy, setEditCopy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBook, setFilterBook] = useState('All');
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredCopies = useMemo(() => {
    return copies.filter(c => {
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      const matchBook = filterBook === 'All' || c.bookId === filterBook;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        c.barcode?.toLowerCase().includes(q) ||
        c.accessionNumber?.toLowerCase().includes(q) ||
        c.rfidTag?.toLowerCase().includes(q) ||
        c.callNumber?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q);
      return matchStatus && matchBook && matchQuery;
    });
  }, [copies, filterStatus, filterBook, searchQuery]);

  const stats = useMemo(() => ({
    total: copies.length,
    available: copies.filter(c => c.status === 'Available').length,
    borrowed: copies.filter(c => c.status === 'Borrowed').length,
    damaged: copies.filter(c => ['Damaged', 'Lost', 'Missing', 'Under Repair'].includes(c.status)).length,
  }), [copies]);

  const handleSave = (copy) => {
    if (editCopy) {
      setCopies(copies.map(c => c.id === copy.id ? copy : c));
      setActionStatus({ type: 'success', message: `Copy ${copy.barcode} updated.` });
    } else {
      setCopies([copy, ...copies]);
      setActionStatus({ type: 'success', message: `Copy ${copy.barcode} added.` });
    }
    setShowForm(false);
    setEditCopy(null);
  };

  const handleDelete = (id) => {
    setCopies(copies.filter(c => c.id !== id));
    setActionStatus({ type: 'success', message: 'Copy record removed.' });
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Copy Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Individual physical copy records for each title</p>
        </div>
        <button onClick={() => { setEditCopy(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
          <Plus size={15} /> Add Copy
        </button>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Copies', value: stats.total, color: 'indigo' },
          { label: 'Available', value: stats.available, color: 'emerald' },
          { label: 'Borrowed', value: stats.borrowed, color: 'amber' },
          { label: 'Issues', value: stats.damaged, color: 'rose' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className={`text-xl font-extrabold ${s.color === 'indigo' ? 'text-indigo-400' : s.color === 'emerald' ? 'text-emerald-400' : s.color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search barcode, accession, RFID..." className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={filterBook} onChange={e => setFilterBook(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
          <option value="All">All Titles</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.id} — {b.title?.slice(0, 30)}...</option>)}
        </select>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...COPY_STATUSES.slice(0, 4)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 text-left">Copy ID</th>
                <th className="py-3 px-4 text-left">Barcode / Accession</th>
                <th className="py-3 px-4 text-left">Book</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Acquisition</th>
                <th className="py-3 px-4 text-left">Condition</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/60 divide-y divide-slate-800/60">
              {filteredCopies.map(copy => {
                const book = books.find(b => b.id === copy.bookId);
                return (
                  <tr key={copy.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-indigo-400 text-[10px]">{copy.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-white">{copy.barcode}</div>
                      <div className="text-[10px] text-slate-500">{copy.accessionNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white truncate max-w-[140px]">{book?.title || copy.bookId}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{copy.callNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300 truncate max-w-[120px]">{copy.branch}</div>
                      <div className="text-[10px] text-slate-500">{copy.shelf} • {copy.rack}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300">{copy.acquisitionDate}</div>
                      <div className="text-[10px] text-slate-500">{copy.acquisitionSource}</div>
                      {copy.price && <div className="text-[10px] text-amber-400">₦{Number(copy.price).toLocaleString()}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{copy.condition}</td>
                    <td className="py-3 px-4"><StatusBadge status={copy.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditCopy(copy); setShowForm(true); }} className="p-1.5 rounded hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={13} /></button>
                        <button onClick={() => setConfirmDelete(copy)} className="p-1.5 rounded hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCopies.length === 0 && <div className="text-center py-12 text-slate-500">No copy records found.</div>}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Copy Record?</h3>
            <p className="text-sm text-slate-300">Remove copy <strong>{confirmDelete.barcode}</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <CopyForm
          copy={editCopy || {}}
          books={books}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditCopy(null); }}
        />
      )}
    </div>
  );
}
