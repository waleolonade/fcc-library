import React, { useState, useMemo } from 'react';
import {
  Star, List, Plus, Trash2, Edit2, X, BookOpen, CheckCircle,
  Save, Lock, Globe, Heart, BookMarked
} from 'lucide-react';

// =========================================================================
// FAVORITES & READING LISTS
// Favorites: add/remove/view
// Reading Lists: create, rename, delete, add/remove resource
// =========================================================================

function FavoriteButton({ bookId, favorites, onToggle }) {
  const isFav = favorites.some(f => f.bookId === bookId);
  return (
    <button
      onClick={() => onToggle(bookId)}
      className={`p-1.5 rounded-lg transition ${isFav ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-400/10'}`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star size={15} className={isFav ? 'fill-amber-400' : ''} />
    </button>
  );
}

function CreateListModal({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create Reading List</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">List Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Research Materials, Final Year Project..." className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What is this list for?" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded accent-indigo-500" />
            {isPublic ? <Globe size={15} className="text-emerald-400" /> : <Lock size={15} className="text-slate-500" />}
            {isPublic ? 'Public list (visible to librarians)' : 'Private list (only you)'}
          </label>
        </div>
        <div className="flex gap-3 pt-2 border-t border-slate-800">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
          <button onClick={() => { if (name.trim()) onSave({ name: name.trim(), description, isPublic }); }} disabled={!name.trim()} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Save size={14} /> Create List
          </button>
        </div>
      </div>
    </div>
  );
}

function AddToListModal({ book, readingLists, onAdd, onClose }) {
  const [selectedListId, setSelectedListId] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Add to Reading List</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-3 rounded-xl bg-slate-800 text-xs">
          <p className="font-semibold text-white truncate">{book.title}</p>
          <p className="text-slate-400">{book.author}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Reading List</label>
            <select value={selectedListId} onChange={e => setSelectedListId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Choose a list...</option>
              {readingLists.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.items.length} items)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note (optional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Focus on Chapter 3" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm">Cancel</button>
          <button onClick={() => { if (selectedListId) { onAdd(selectedListId, book.id, note); onClose(); } }} disabled={!selectedListId} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm">Add</button>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesAndReadingLists({
  user,
  books = [],
  favorites: propFavorites = [],
  readingLists: propReadingLists = [],
  onFavoritesChange,
  onReadingListsChange,
  onSelectBook,
}) {
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'lists'
  const [favorites, setFavorites] = useState(propFavorites);
  const [readingLists, setReadingLists] = useState(propReadingLists);
  const [showCreateList, setShowCreateList] = useState(false);
  const [addToListBook, setAddToListBook] = useState(null);
  const [editListId, setEditListId] = useState(null);
  const [editListName, setEditListName] = useState('');
  const [expandedList, setExpandedList] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const updateFavorites = (updated) => {
    setFavorites(updated);
    if (onFavoritesChange) onFavoritesChange(updated);
  };

  const updateReadingLists = (updated) => {
    setReadingLists(updated);
    if (onReadingListsChange) onReadingListsChange(updated);
  };

  const toggleFavorite = (bookId) => {
    const isFav = favorites.some(f => f.bookId === bookId);
    if (isFav) {
      updateFavorites(favorites.filter(f => f.bookId !== bookId));
      setActionStatus({ message: 'Removed from favorites.' });
    } else {
      updateFavorites([...favorites, { id: `FAV-${Date.now()}`, matric: user?.matric, bookId, addedAt: new Date().toISOString() }]);
      setActionStatus({ message: 'Added to favorites!' });
    }
  };

  const handleCreateList = ({ name, description, isPublic }) => {
    const newList = {
      id: `RL-${Date.now()}`,
      matric: user?.matric,
      name,
      description,
      isPublic,
      createdDate: new Date().toISOString().split('T')[0],
      items: [],
    };
    updateReadingLists([...readingLists, newList]);
    setShowCreateList(false);
    setActionStatus({ message: `Reading list "${name}" created.` });
  };

  const handleRenameList = (listId) => {
    if (!editListName.trim()) return;
    updateReadingLists(readingLists.map(l => l.id === listId ? { ...l, name: editListName.trim() } : l));
    setEditListId(null);
    setEditListName('');
    setActionStatus({ message: 'List renamed.' });
  };

  const handleDeleteList = (listId) => {
    if (!window.confirm('Delete this reading list?')) return;
    updateReadingLists(readingLists.filter(l => l.id !== listId));
    setActionStatus({ message: 'Reading list deleted.' });
  };

  const handleAddToList = (listId, bookId, note) => {
    updateReadingLists(readingLists.map(l => {
      if (l.id !== listId) return l;
      if (l.items.some(i => i.bookId === bookId)) return l; // already in list
      return { ...l, items: [...l.items, { bookId, notes: note, addedAt: new Date().toISOString() }] };
    }));
    setActionStatus({ message: 'Resource added to reading list.' });
  };

  const handleRemoveFromList = (listId, bookId) => {
    updateReadingLists(readingLists.map(l =>
      l.id === listId ? { ...l, items: l.items.filter(i => i.bookId !== bookId) } : l
    ));
  };

  const userFavorites = favorites.filter(f => f.matric === user?.matric);
  const userLists = readingLists.filter(l => l.matric === user?.matric);
  const favoriteBooks = useMemo(() => userFavorites.map(f => books.find(b => b.id === f.bookId)).filter(Boolean), [userFavorites, books]);

  const suggestedPresets = ['Research Materials', 'Final Year Project', 'Programming Books', 'Business', 'Personal Reading'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
          <button onClick={() => setActiveTab('favorites')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${activeTab === 'favorites' ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white'}`}>
            <Star size={14} /> Favorites <span className="text-[11px]">({userFavorites.length})</span>
          </button>
          <button onClick={() => setActiveTab('lists')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${activeTab === 'lists' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'}`}>
            <List size={14} /> Reading Lists <span className="text-[11px]">({userLists.length})</span>
          </button>
        </div>
        {activeTab === 'lists' && (
          <button onClick={() => setShowCreateList(true)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition">
            <Plus size={15} /> New List
          </button>
        )}
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl border flex items-center justify-between text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* FAVORITES TAB */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoriteBooks.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Star size={40} className="mx-auto text-slate-700" />
              <p className="text-slate-400 font-semibold">No favorites yet</p>
              <p className="text-slate-500 text-sm">Click the ⭐ star icon on any catalog card to save resources.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteBooks.map(book => (
                <div key={book.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{book.title}</p>
                      <p className="text-xs text-slate-400">{book.author} • {book.year}</p>
                      <p className="text-xs font-mono text-indigo-400 mt-0.5">{book.callNumber}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setAddToListBook(book)} className="p-1.5 rounded-lg hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition" title="Add to reading list">
                        <List size={14} />
                      </button>
                      <FavoriteButton bookId={book.id} favorites={userFavorites} onToggle={toggleFavorite} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${book.copiesAvailable > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                      {book.copiesAvailable > 0 ? `${book.copiesAvailable} available` : 'Unavailable'}
                    </span>
                    <button onClick={() => onSelectBook && onSelectBook(book)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* READING LISTS TAB */}
      {activeTab === 'lists' && (
        <div className="space-y-4">
          {/* Quick create suggestions */}
          {userLists.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-400">Quick-start templates:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPresets.map(preset => (
                  <button key={preset} onClick={() => handleCreateList({ name: preset, description: '', isPublic: false })} className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5">
                    <Plus size={12} /> {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {userLists.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <List size={40} className="mx-auto text-slate-700" />
              <p className="text-slate-400">No reading lists yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userLists.map(list => {
                const listBooks = list.items.map(i => books.find(b => b.id === i.bookId)).filter(Boolean);
                const isExpanded = expandedList === list.id;
                return (
                  <div key={list.id} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                    {/* List header */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {editListId === list.id ? (
                          <div className="flex gap-2">
                            <input value={editListName} onChange={e => setEditListName(e.target.value)} className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-indigo-500 text-sm text-white focus:outline-none" onKeyDown={e => e.key === 'Enter' && handleRenameList(list.id)} />
                            <button onClick={() => handleRenameList(list.id)} className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs"><CheckCircle size={13} /></button>
                            <button onClick={() => { setEditListId(null); setEditListName(''); }} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"><X size={13} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{list.name}</p>
                            {list.isPublic ? <Globe size={13} className="text-emerald-400" /> : <Lock size={13} className="text-slate-500" />}
                          </div>
                        )}
                        {list.description && <p className="text-xs text-slate-400 mt-0.5">{list.description}</p>}
                        <p className="text-[10px] text-slate-500 mt-1">{list.items.length} resource{list.items.length !== 1 ? 's' : ''} • Created {list.createdDate}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setExpandedList(isExpanded ? null : list.id)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
                          {isExpanded ? 'Collapse' : 'View'}
                        </button>
                        <button onClick={() => { setEditListId(list.id); setEditListName(list.name); }} className="p-1.5 rounded-lg hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition"><Edit2 size={13} /></button>
                        <button onClick={() => handleDeleteList(list.id)} className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={13} /></button>
                      </div>
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 p-4 space-y-2">
                        {listBooks.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">No resources in this list yet. Add from the catalog.</p>
                        ) : (
                          listBooks.map((book, idx) => {
                            const item = list.items[idx];
                            return (
                              <div key={book.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <BookOpen size={14} className="text-indigo-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{book.title}</p>
                                  {item?.notes && <p className="text-[10px] text-slate-400 italic">{item.notes}</p>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => onSelectBook && onSelectBook(book)} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] transition">Info</button>
                                  <button onClick={() => handleRemoveFromList(list.id, book.id)} className="p-1 rounded hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition"><Trash2 size={11} /></button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showCreateList && <CreateListModal onSave={handleCreateList} onCancel={() => setShowCreateList(false)} />}
      {addToListBook && <AddToListModal book={addToListBook} readingLists={userLists} onAdd={handleAddToList} onClose={() => setAddToListBook(null)} />}
    </div>
  );
}

// Export FavoriteButton for use in catalog cards
export { FavoriteButton };
