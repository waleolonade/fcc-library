import React, { useState } from 'react';
import {
  Bookmark, Plus, Trash2, Edit3, Share2, Download,
  BookOpen, Layers, Check, Copy, FileText, ChevronRight, Link2
} from 'lucide-react';
import TraceBadge from '../common/TraceBadge';
import { formatCitation, downloadCitationFile } from '../utils/citationFormatter';
import { sounds } from '../utils/soundEffects';

export default function StudentReadingLists({
  readingLists = [],
  books = [],
  onCreateList,
  onDeleteList,
  onRemoveItem,
  onOpenReader,
  onSelectBook,
  user
}) {
  const [selectedListId, setSelectedListId] = useState(readingLists[0]?.id || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const activeList = readingLists.find(l => l.id === selectedListId) || readingLists[0];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList({
      matric: user?.matric || 'FCC/CEM/2024/042',
      name: newListName.trim(),
      description: newListDesc.trim(),
      items: []
    });
    setNewListName('');
    setNewListDesc('');
    setShowCreateModal(false);
    sounds.playSuccessChime();
  };

  const handleExportBibliography = () => {
    if (!activeList || !activeList.items) return;
    const listBooks = activeList.items.map(i => books.find(b => b.id === i.bookId)).filter(Boolean);
    const textCitations = listBooks.map(b => formatCitation(b, 'APA')).join('\n\n');
    const fullText = `FCC IBADAN SMART LIBRARY — SCHOLAR BIBLIOGRAPHY\nReading List: ${activeList.name}\nScholar: ${user?.name || 'FCC Scholar'} (${user?.matric || 'FCC/CEM/2024/042'})\nGenerated: ${new Date().toLocaleDateString()}\n\n` + textCitations;

    downloadCitationFile(fullText, `${activeList.name.toLowerCase().replace(/\s+/g, '_')}_bibliography.txt`);
    sounds.playSuccessChime();
  };

  const handleExportBibTeX = () => {
    if (!activeList || !activeList.items) return;
    const listBooks = activeList.items.map(i => books.find(b => b.id === i.bookId)).filter(Boolean);
    const bibtex = listBooks.map(b => formatCitation(b, 'BIBTEX')).join('\n\n');
    downloadCitationFile(bibtex, `${activeList.name.toLowerCase().replace(/\s+/g, '_')}.bib`);
    sounds.playSuccessChime();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
              SCHOLAR STUDY WORKSPACE
            </span>
            <TraceBadge uri="#/reading_lists" label="Reading Lists URI" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Personal Reading Lists</h2>
          <p className="text-xs text-slate-400">
            Curate research bibliographies, final-year project citations, and semester exam reading folders.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950 transition shrink-0"
        >
          <Plus size={16} /> New Reading List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Lists Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            My Folders ({readingLists.length})
          </div>

          <div className="space-y-2">
            {readingLists.map(list => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-lg ${
                  activeList?.id === list.id
                    ? 'bg-purple-950/80 border-purple-700 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold flex items-center gap-2">
                    <Bookmark size={14} className={activeList?.id === list.id ? 'text-purple-400' : 'text-slate-500'} />
                    <span>{list.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {list.items?.length || 0} saved citations • {list.createdDate}
                  </div>
                </div>

                <ChevronRight size={16} className={activeList?.id === list.id ? 'text-purple-400' : 'text-slate-600'} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Active List Items Canvas */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
          {activeList ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{activeList.name}</h3>
                    <TraceBadge uri={`#/reading_lists?id=${activeList.id}`} label="List URI" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeList.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportBibliography}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
                    title="Export text bibliography"
                  >
                    <Download size={13} /> Export APA
                  </button>

                  <button
                    onClick={handleExportBibTeX}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
                    title="Export BibTeX file"
                  >
                    <FileText size={13} /> Export .bib
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete reading list "${activeList.name}"?`)) {
                        onDeleteList(activeList.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition"
                    title="Delete List"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Items List */}
              {(!activeList.items || activeList.items.length === 0) ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                  <Bookmark size={24} className="mx-auto text-slate-600" />
                  <div>This reading list is currently empty.</div>
                  <p className="text-[11px] text-slate-500">Add resources while browsing the discovery catalog or course resources.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeList.items.map((item, idx) => {
                    const book = books.find(b => b.id === item.bookId);
                    if (!book) return null;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-purple-300 border border-slate-800">
                              {book.callNumber}
                            </span>
                            <TraceBadge uri={`#/book/${book.id}`} label="Book Link" />
                            <span className="text-[10px] text-slate-500 font-mono">ISBN: {book.isbn}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug">{book.title}</h4>
                          <p className="text-xs text-slate-400">{book.author} ({book.year})</p>

                          {item.notes && (
                            <div className="text-[11px] text-purple-300/90 italic pt-1">
                              "{item.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onSelectBook(book)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                          >
                            Details
                          </button>
                          {book.isDigital && (
                            <button
                              onClick={() => onOpenReader(book)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                            >
                              <BookOpen size={12} /> Read
                            </button>
                          )}
                          {book.isDigital && (
                            <TraceBadge uri={`#/read/${book.id}`} label="PDF Link" />
                          )}
                          <button
                            onClick={() => onRemoveItem(activeList.id, book.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                            title="Remove from list"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs p-8">Select a reading list on the left to view contents.</div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Personal Reading List</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">List Title</label>
                <input
                  type="text"
                  placeholder="e.g. My Final Year Project, Exam Preparation"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Description (Optional)</label>
                <textarea
                  placeholder="Brief description of the research scope..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
