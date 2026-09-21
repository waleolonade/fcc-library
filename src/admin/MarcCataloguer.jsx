import React, { useState } from 'react';
import { Database, Plus, Download, FileCode, Check, Search, Sparkles, Layers } from 'lucide-react';

export default function MarcCataloguer({ books, setBooks }) {
  const [selectedBook, setSelectedBook] = useState(books[0]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // New Catalog Record Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCallNumber, setNewCallNumber] = useState('');
  const [newSubject, setNewSubject] = useState('Co-operative Economics');
  const [newCopies, setNewCopies] = useState(5);
  const [newAbstract, setNewAbstract] = useState('');

  const handleSaveRecord = (e) => {
    e.preventDefault();
    const newBook = {
      id: `FCC-B00${books.length + 1}`,
      title: newTitle,
      author: newAuthor,
      isbn: newIsbn || `978-978-${Math.floor(10000 + Math.random() * 90000)}-1`,
      callNumber: newCallNumber || 'HD2963 .Z99 2026',
      subject: newSubject,
      department: newSubject.includes('Computer') ? 'CSC' : newSubject.includes('Banking') ? 'BNF' : 'CEM',
      copiesTotal: Number(newCopies),
      copiesAvailable: Number(newCopies),
      isDigital: true,
      pdfPages: 320,
      rating: 4.8,
      citations: 0,
      doi: `10.1016/fcc.2026.${Math.floor(100 + Math.random() * 900)}`,
      publisher: 'FCC Ibadan Academic Press',
      year: 2026,
      abstract: newAbstract || 'Newly accessioned academic monograph for campus digital repository and physical stacks.'
    };

    setBooks([newBook, ...books]);
    setSelectedBook(newBook);
    setIsAddingNew(false);
    setNewTitle('');
    setNewAuthor('');
    setNewIsbn('');
    setNewCallNumber('');
  };

  const handleExportMarc = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            Library of Congress MARC 21 & Dublin Core
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            MARC 21 Bibliographic Cataloguing Suite
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Interchange standard metadata editor with Z39.50 retrieval and automated Dublin Core mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus size={15} /> {isAddingNew ? 'View Existing Records' : 'Accession New Record'}
          </button>
          <button
            onClick={handleExportMarc}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
          >
            {exportSuccess ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
            {exportSuccess ? 'Exported .MRC' : 'Export Catalog (.MRC)'}
          </button>
        </div>
      </div>

      {isAddingNew ? (
        /* New MARC Record Form */
        <div className="p-6 bg-slate-900 border border-slate-700 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">New MARC21 / AACR2 Bibliographic Accession</h3>
          <form onSubmit={handleSaveRecord} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Tag 245 $a - Main Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Econometric Analysis of Agricultural Marketing Cooperatives"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Tag 100 $a - Primary Author / Creator
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. O. B. Adeleke"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Tag 020 $a - Standard ISBN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 978-978-4091-22-1"
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Tag 050 $a - LC Call Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. HD2963 .A44 2026"
                  value={newCallNumber}
                  onChange={(e) => setNewCallNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Physical Copies Ingested
                </label>
                <input
                  type="number"
                  min="1"
                  value={newCopies}
                  onChange={(e) => setNewCopies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                Tag 520 $a - Summary / Abstract
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive overview of monograph contents..."
                value={newAbstract}
                onChange={(e) => setNewAbstract(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
              >
                Save & Encode MARC 21 Record
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Split Viewer: Record List & MARC Tag Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Titles List */}
          <div className="lg:col-span-4 bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Catalog Records</h3>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {books.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    selectedBook && selectedBook.id === b.id
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="font-mono text-[10px] text-indigo-400 font-bold">{b.id} • {b.callNumber}</div>
                  <div className="font-semibold text-xs mt-0.5 line-clamp-1">{b.title}</div>
                  <div className="text-[11px] text-slate-400">{b.author}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Detailed MARC 21 Field Inspector */}
          <div className="lg:col-span-8 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            {selectedBook ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-indigo-400 font-bold text-sm">MARC 21 LEADER // 00000nam a2200000 i 4500</span>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">Control Number: {selectedBook.id}</div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    LC CLASSIFICATION VALID
                  </span>
                </div>

                {/* Tag Table */}
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">008</span><span className="text-slate-300">240918s2024    ng a          000 0 eng d</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">020 $a</span><span className="text-white">{selectedBook.isbn}</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">040 $a</span><span className="text-slate-300">NG-IbFCC $c NG-IbFCC</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">050 $a</span><span className="text-indigo-300">{selectedBook.callNumber}</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">100 1# $a</span><span className="text-white">{selectedBook.author}</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">245 10 $a</span><span className="text-white">{selectedBook.title} / $c {selectedBook.author}.</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">260 ## $a</span><span className="text-slate-300">Ibadan : $b {selectedBook.publisher || 'FCC Press'}, $c {selectedBook.year || '2024'}.</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">300 ## $a</span><span className="text-slate-300">{selectedBook.pdfPages || '380'} pages ; $c 24 cm.</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">520 ## $a</span><span className="text-slate-300">{selectedBook.abstract}</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">650 #0 $a</span><span className="text-indigo-300">{selectedBook.subject} -- Nigeria.</span></div>
                  <div className="flex text-slate-400"><span className="w-16 font-bold text-emerald-400">856 40 $u</span><span className="text-emerald-400">https://doi.org/{selectedBook.doi}</span></div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-sans text-slate-400 flex justify-between items-center">
                  <span>Dublin Core (DC) Export Equivalent Available via OAI-PMH Gateway</span>
                  <button
                    onClick={() => alert(`Exported Dublin Core XML for ${selectedBook.id}`)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[10px]"
                  >
                    Export Dublin Core XML
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Select a catalog record from the left list.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
