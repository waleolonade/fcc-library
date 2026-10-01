import React, { useState, useMemo } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, X, CheckCircle, ChevronRight,
  ChevronDown, Building2, BookOpen, Layers, Save, Hash
} from 'lucide-react';
import { INITIAL_LOCATIONS } from '../data/institutionalSeedData';

// =========================================================================
// LOCATION MANAGEMENT — Hierarchical
// Institution → Library → Branch → Section → Floor → Shelf → Rack
// Full CRUD at each level
// =========================================================================

const LOCATION_TYPES = ['institution', 'library', 'branch', 'floor', 'section', 'shelf', 'rack'];

const TYPE_ICONS = {
  institution: Building2,
  library: BookOpen,
  branch: MapPin,
  floor: Layers,
  section: Layers,
  shelf: Hash,
  rack: Hash,
};

const TYPE_COLORS = {
  institution: 'indigo',
  library: 'emerald',
  branch: 'teal',
  floor: 'amber',
  section: 'orange',
  shelf: 'slate',
  rack: 'slate',
};

function TypeBadge({ type }) {
  const colors = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    slate: 'bg-slate-700 text-slate-400 border-slate-600',
  };
  const color = TYPE_COLORS[type] || 'slate';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${colors[color]}`}>{type}</span>
  );
}

function LocationForm({ location, parentOptions, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: '', name: '', code: '', type: 'library', parentId: '', capacity: '', hours: '', description: '',
    ...location,
  });
  const set = (f) => (v) => setForm(s => ({ ...s, [f]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.type) { alert('Name and type are required.'); return; }
    onSave({ ...form, id: form.id || `LOC-${Date.now().toString().slice(-6)}`, children: form.children || [] });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{form.id ? 'Edit Location' : 'Add Location'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location Type *</label>
              <select value={form.type} onChange={e => set('type')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 capitalize">
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code / Short Name</label>
              <input type="text" value={form.code || ''} onChange={e => set('code')(e.target.value)} placeholder="e.g. MAIN, ENG, F1" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. Main Campus Library (Prof. Hezekiah Complex)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Location</label>
            <select value={form.parentId || ''} onChange={e => set('parentId')(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">None (top-level)</option>
              {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Capacity (seats)</label>
              <input type="number" value={form.capacity || ''} onChange={e => set('capacity')(e.target.value)} placeholder="e.g. 650" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Hours</label>
              <input type="text" value={form.hours || ''} onChange={e => set('hours')(e.target.value)} placeholder="08:00 AM - 08:00 PM" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Notes</label>
            <input type="text" value={form.description || ''} onChange={e => set('description')(e.target.value)} placeholder="Additional information about this location..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
              <Save size={14} /> Save Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocationNode({ location, allLocations, depth = 0, onEdit, onDelete, onAddChild }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = allLocations.filter(l => l.parentId === location.id);
  const Icon = TYPE_ICONS[location.type] || MapPin;
  const hasChildren = children.length > 0;
  const indentPx = depth * 20;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-800/40 transition group"
        style={{ paddingLeft: `${12 + indentPx}px` }}
      >
        <button onClick={() => setExpanded(!expanded)} className={`p-0.5 rounded transition ${hasChildren ? 'text-slate-400 hover:text-white' : 'text-transparent cursor-default'}`}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Icon size={15} className={`shrink-0 ${
          location.type === 'institution' ? 'text-indigo-400' :
          location.type === 'library' ? 'text-emerald-400' :
          location.type === 'floor' ? 'text-amber-400' : 'text-slate-400'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">{location.name}</span>
            {location.code && <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{location.code}</span>}
            <TypeBadge type={location.type} />
          </div>
          <div className="flex gap-3 text-[10px] text-slate-500 mt-0.5">
            {location.capacity && <span>{location.capacity} seats</span>}
            {location.hours && <span>{location.hours}</span>}
            {children.length > 0 && <span>{children.length} sub-location{children.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onAddChild(location)} className="p-1.5 rounded hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300 transition" title="Add child location"><Plus size={13} /></button>
          <button onClick={() => onEdit(location)} className="p-1.5 rounded hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={13} /></button>
          <button onClick={() => onDelete(location)} className="p-1.5 rounded hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={13} /></button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="border-l border-slate-800/60 ml-6">
          {children.map(child => (
            <LocationNode key={child.id} location={child} allLocations={allLocations} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationManagement() {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [showForm, setShowForm] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [parentForNew, setParentForNew] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const topLevel = useMemo(() => locations.filter(l => !l.parentId), [locations]);

  const handleSave = (loc) => {
    if (editLocation) {
      setLocations(locations.map(l => l.id === loc.id ? loc : l));
      setActionStatus({ message: `"${loc.name}" updated.` });
    } else {
      setLocations([...locations, loc]);
      setActionStatus({ message: `"${loc.name}" added.` });
    }
    setShowForm(false);
    setEditLocation(null);
    setParentForNew(null);
  };

  const handleDelete = (loc) => {
    const hasChildren = locations.some(l => l.parentId === loc.id);
    if (hasChildren) {
      alert('Cannot delete a location that has child locations. Remove children first.');
      setConfirmDelete(null);
      return;
    }
    setLocations(locations.filter(l => l.id !== loc.id));
    setActionStatus({ message: `"${loc.name}" removed.` });
    setConfirmDelete(null);
  };

  const handleAddChild = (parentLoc) => {
    setParentForNew(parentLoc);
    setEditLocation(null);
    setShowForm(true);
  };

  const stats = useMemo(() => ({
    total: locations.length,
    libraries: locations.filter(l => l.type === 'library').length,
    floors: locations.filter(l => l.type === 'floor').length,
    sections: locations.filter(l => l.type === 'section').length,
  }), [locations]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Location Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Hierarchical library location structure</p>
        </div>
        <button onClick={() => { setEditLocation(null); setParentForNew(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
          <Plus size={15} /> Add Location
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
          { label: 'Total Nodes', value: stats.total, color: 'indigo' },
          { label: 'Libraries', value: stats.libraries, color: 'emerald' },
          { label: 'Floors', value: stats.floors, color: 'amber' },
          { label: 'Sections', value: stats.sections, color: 'teal' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className={`text-xl font-extrabold ${s.color === 'indigo' ? 'text-indigo-400' : s.color === 'emerald' ? 'text-emerald-400' : s.color === 'amber' ? 'text-amber-400' : 'text-teal-400'}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Hierarchy breadcrumb legend */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span className="font-semibold text-slate-300">Hierarchy:</span>
        {['Institution', 'Library', 'Branch', 'Floor', 'Section', 'Shelf', 'Rack'].map((t, i, arr) => (
          <React.Fragment key={t}>
            <span>{t}</span>
            {i < arr.length - 1 && <ChevronRight size={12} className="text-slate-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Location Tree */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 space-y-0.5">
        {topLevel.map(loc => (
          <LocationNode
            key={loc.id}
            location={loc}
            allLocations={locations}
            depth={0}
            onEdit={(l) => { setEditLocation(l); setParentForNew(null); setShowForm(true); }}
            onDelete={setConfirmDelete}
            onAddChild={handleAddChild}
          />
        ))}
        {topLevel.length === 0 && (
          <div className="text-center py-12 text-slate-500">No locations configured. Add your first location above.</div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Location?</h3>
            <p className="text-sm text-slate-300">Remove <strong>"{confirmDelete.name}"</strong>?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <LocationForm
          location={editLocation || (parentForNew ? { parentId: parentForNew.id } : {})}
          parentOptions={locations}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditLocation(null); setParentForNew(null); }}
        />
      )}
    </div>
  );
}
