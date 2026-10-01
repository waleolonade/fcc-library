import React, { useState, useEffect } from 'react';
import {
  X, BookOpen, Bookmark, Copy, Check, MapPin, Share2, Sparkles,
  Download, Layers, ExternalLink, Link2, Database, Star, Clock,
  CheckCircle2, AlertCircle, FileText, User, Building, QrCode,
  ShieldCheck, ArrowRight, CornerDownRight, BookCheck, Quote
} from 'lucide-react';
import { getPermalink, copyToClipboardWithFeedback } from '../utils/router';
import TraceBadge from './TraceBadge';
import { sounds } from '../utils/soundEffects';

export default function BookDetailsModal({ book, onClose, onOpenReader, onReserve }) {
  const [citationFormat, setCitationFormat] = useState('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavedToList, setIsSavedToList] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [holdSuccessMessage, setHoldSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  // 'overview' | 'holdings' | 'toc' | 'reviews' | 'citations' | 'author' | 'similar'

  useEffect(() => {
    if (book) {
      const savedList = JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
      setIsSavedToList(savedList.some(id => id === book.id));
    }
  }, [book]);

  if (!book) return null;

  const directPermalink = getPermalink(`/book/${book.id}`);

  const handleCopyLink = () => {
    copyToClipboardWithFeedback(directPermalink, (success) => {
      if (success) {
        sounds.playClick();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  const handleToggleSaveList = () => {
    const savedList = JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
    let updated;
    if (isSavedToList) {
      updated = savedList.filter(id => id !== book.id);
      setIsSavedToList(false);
    } else {
      updated = [...savedList, book.id];
      setIsSavedToList(true);
      sounds.playSuccessChime();
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
    localStorage.setItem('fcc_saved_books_list', JSON.stringify(updated));
  };

  const handlePlaceHold = () => {
    sounds.playSuccessChime();
    setHoldSuccessMessage(`Hold placed successfully on ${book.title}! You are #1 in queue. You will receive an SMS/email notice when a copy is checked in.`);
    if (onReserve) onReserve(book);
    setTimeout(() => setHoldSuccessMessage(''), 6000);
  };

  const getCitation = () => {
    switch (citationFormat) {
      case 'APA':
        return `${book.author} (${book.year || 2024}). ${book.title} (${book.edition || '1st ed.'}). Ibadan: ${book.publisher || 'FCC Ibadan Academic Press'}. https://doi.org/${book.doi || '10.1016/fcc.2024'}`;
      case 'BibTeX':
        return `@book{fcc_${book.id.toLowerCase()},\n  author    = {${book.author}},\n  title     = {${book.title}},\n  publisher = {${book.publisher || 'FCC Press'}},\n  year      = {${book.year || 2024}},\n  isbn      = {${book.isbn}},\n  doi       = {${book.doi || '10.1016/fcc.2024'}}\n}`;
      case 'MLA':
        return `${book.author}. *${book.title}*. ${book.edition || '1st ed.'}, ${book.publisher || 'FCC Ibadan Academic Press'}, ${book.year || 2024}. DOI: ${book.doi || '10.1016/fcc.2024'}`;
      case 'Chicago':
        return `${book.author}. ${book.title}. ${book.edition || '1st ed.'} Ibadan: ${book.publisher || 'FCC Academic Press'}, ${book.year || 2024}.`;
      case 'Harvard':
        return `${book.author}, ${book.year || 2024}. ${book.title}. ${book.edition || '1st edn.'} Ibadan: ${book.publisher || 'FCC Press'}.`;
      case 'IEEE':
        return `[1] ${book.author}, "${book.title}," ${book.edition || '1st ed.'}, Ibadan, Nigeria: ${book.publisher || 'FCC Press'}, ${book.year || 2024}.`;
      default:
        return `${book.author}. ${book.title}. ${book.year || 2024}.`;
    }
  };

  const handleCopyCitation = () => {
    copyToClipboardWithFeedback(getCitation(), (success) => {
      if (success) {
        sounds.playClick();
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 2000);
      }
    });
  };

  // Simulated Copy-level Real-time stack inventory
  const totalCopies = book.copiesTotal || book.totalCopies || 3;
  const availCopies = book.copiesAvailable !== undefined ? book.copiesAvailable : 2;
  const copiesList = Array.from({ length: totalCopies }, (_, i) => {
    const isAvail = i < availCopies;
    return {
      copyNumber: `Copy 00${i + 1}`,
      barcode: `FCC-BC-${(book.id || 'B001').replace(/[^0-9]/g, '') || '101'}${i + 1}`,
      callNumber: book.callNumber || 'HD 2963 .O43 2024',
      status: isAvail ? 'Available' : 'Borrowed',
      shelfLocation: book.shelfLocation || 'Stack 2 • Aisle 3 • Shelf 14A',
      branch: 'Main Campus Library (Prof. Hezekiah Complex)',
      dueDate: isAvail ? null : '2026-10-18',
      renewals: isAvail ? 0 : 1,
      queue: isAvail ? 0 : 1
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-[#032317] border border-emerald-700/60 w-full max-w-4xl rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black relative my-8 text-emerald-50">
        
        {/* Top Green Accent Glow Line */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-t-full" />

        {/* Close Button */}
        <button
          id="btn-close-book-modal"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-[#021810] text-emerald-400 hover:text-white hover:bg-emerald-900/60 border border-emerald-800/60 transition"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Hold Success Notification */}
        {holdSuccessMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="font-medium">{holdSuccessMessage}</span>
          </div>
        )}

        {/* 1. MAIN BOOK BANNER WITH COVER & METADATA */}
        <div className="flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-emerald-800/50">
          
          {/* BOOK COVER CANVAS */}
          <div className="w-full sm:w-44 h-64 rounded-2xl bg-gradient-to-br from-[#063f2b] via-[#04281c] to-[#02150e] border-2 border-emerald-600/40 p-3 flex flex-col justify-between shrink-0 shadow-2xl shadow-emerald-950 font-serif relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="text-[10px] font-mono font-bold tracking-widest text-emerald-400/80 uppercase">
                {book.department || 'FEDERAL COOPERATIVE COLLEGE'}
              </div>
              <div className="h-0.5 w-8 bg-emerald-500 my-1.5" />
              <h3 className="text-xs font-bold text-white line-clamp-3 leading-snug">
                {book.title}
              </h3>
            </div>

            <div className="relative z-10 text-[10px] font-mono space-y-1">
              <div className="text-emerald-300 font-sans truncate">{book.author}</div>
              <div className="text-emerald-400/70 border-t border-emerald-700/40 pt-1 flex justify-between items-center">
                <span>{book.year || 2024}</span>
                <span className="text-amber-400">★★★★★</span>
              </div>
            </div>
          </div>

          {/* MAIN INFO & ACTION BUTTONS */}
          <div className="flex-1 space-y-3 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                {book.callNumber || 'QA 76.9 .D3'}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#021810] text-emerald-200 border border-emerald-900">
                {book.subject || 'Academic Collection'}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                availCopies > 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {availCopies > 0 ? `${availCopies} of ${totalCopies} Copies Available` : 'All Copies Checked Out'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-xs text-emerald-300/80 font-medium">
                {book.subtitle}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-xs">
              <div className="p-2 rounded-xl bg-[#021a12] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-mono">Author:</span>
                <span className="font-semibold text-white truncate block">{book.author}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#021a12] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-mono">ISBN / ISSN:</span>
                <span className="font-mono text-emerald-200 truncate block">{book.isbn || 'N/A'}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#021a12] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-mono">Publisher:</span>
                <span className="text-slate-300 truncate block">{book.publisher || 'FCC Press'}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#021a12] border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block font-mono">Edition / Year:</span>
                <span className="text-slate-300 block">{book.edition || '1st Edition'} • {book.year || 2024}</span>
              </div>
            </div>

            {/* 3 CORE REQUESTED BUTTONS: [RESERVE] [ADD TO LIST] [CITE] */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                id="btn-modal-reserve"
                onClick={handlePlaceHold}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
              >
                <BookCheck size={15} />
                <span>RESERVE / HOLD ITEM</span>
              </button>

              <button
                id="btn-modal-add-to-list"
                onClick={handleToggleSaveList}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isSavedToList
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-[#021810] text-emerald-200 border-emerald-800 hover:border-emerald-600 hover:text-white'
                }`}
              >
                <Bookmark size={15} className={isSavedToList ? 'fill-emerald-400 text-emerald-400' : ''} />
                <span>{savedFeedback ? '✓ Added to List' : (isSavedToList ? 'Saved in My List' : 'ADD TO LIST')}</span>
              </button>

              <button
                id="btn-modal-cite"
                onClick={() => setActiveTab('citations')}
                className="px-4 py-2.5 rounded-xl bg-[#021810] hover:bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:border-emerald-600 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Quote size={15} />
                <span>CITE</span>
              </button>

              {book.isDigital && (
                <button
                  id="btn-modal-read-online"
                  onClick={() => {
                    if (onOpenReader) onOpenReader(book);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                >
                  <BookOpen size={15} />
                  <span>READ DIGITAL FULL-TEXT</span>
                </button>
              )}
            </div>

            {/* Traceable URI */}
            <div className="flex items-center gap-2 pt-2 text-[11px] font-mono text-emerald-400/80">
              <span className="truncate bg-[#021810] px-2.5 py-1 rounded-lg border border-emerald-900/80 max-w-sm sm:max-w-md select-all">
                {directPermalink}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0 underline"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. TAB CONTROLS (OPAC / DISCOVERY EXTENSION) */}
        <div className="flex items-center gap-1 border-b border-emerald-800/60 my-4 overflow-x-auto scrollbar-none pb-1 text-xs">
          {[
            { id: 'overview', label: 'Abstract & Scope' },
            { id: 'holdings', label: `Copy Availability (${availCopies}/${totalCopies})` },
            { id: 'toc', label: 'Table of Contents' },
            { id: 'reviews', label: 'Reviews & Ratings (5.0)' },
            { id: 'citations', label: 'Citations & DOI' },
            { id: 'author', label: 'Author Profile' },
            { id: 'similar', label: 'More Like This' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-emerald-400 hover:text-white hover:bg-emerald-950/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. TAB PANELS */}
        <div className="min-h-[220px] text-xs space-y-4">
          
          {/* TAB 1: OVERVIEW & ABSTRACT */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/70 space-y-2">
                <span className="font-bold text-white text-sm block">Book Abstract & Scholarly Summary</span>
                <p className="text-emerald-200/90 leading-relaxed text-xs">
                  {book.abstract || 'Comprehensive institutional textbook aligned with NBTE accredited curriculum guidelines. Provides theoretical frameworks, empirical case illustrations, chapter reviews, and computational exercises for students.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono">LCSH Subject Headings:</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(book.keywords || 'Cooperative economics, Agronomy, Public finance, Microcredit, Nigeria').split(',').map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-mono">Location & Shelf Identification:</span>
                  <div className="text-emerald-100 font-semibold">{book.shelfLocation || 'Stack 2 • Aisle 3 • Shelf 14A'}</div>
                  <div className="text-emerald-400/80 text-[11px]">Branch: Main Campus Library (Prof. Hezekiah Complex)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COPY-LEVEL REAL-TIME HOLDINGS HIERARCHY */}
          {activeTab === 'holdings' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building size={14} className="text-emerald-400" />
                  <span>Main Campus Library Holdings Hierarchy</span>
                </span>
                <span className="font-mono text-emerald-400">{availCopies} of {totalCopies} copies in stacks</span>
              </div>

              {/* TREE DISPLAY OF COPIES */}
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 font-mono text-xs space-y-2">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Building size={14} />
                  <span>Main Library (Prof. Hezekiah Complex)</span>
                </div>

                <div className="pl-4 space-y-2 border-l-2 border-emerald-800/60 ml-2 pt-1">
                  {copiesList.map((copy, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-[#032317] border border-emerald-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <CornerDownRight size={14} className="text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold text-white">{copy.copyNumber}</span>
                          <span className="text-emerald-400/80 ml-2 font-mono text-[11px]">[{copy.barcode}]</span>
                          <div className="text-[11px] text-emerald-300/80 font-sans">
                            {copy.shelfLocation} • Call No: <span className="font-mono">{copy.callNumber}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {copy.status === 'Available' ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 size={12} /> Available in Stack
                          </span>
                        ) : (
                          <div className="text-right font-sans">
                            <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-bold text-[11px] inline-block">
                              Borrowed (Due: {copy.dueDate})
                            </span>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              Hold Queue: {copy.queue} request
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TABLE OF CONTENTS */}
          {activeTab === 'toc' && (
            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-3 animate-fadeIn">
              <span className="font-bold text-white text-sm block">Table of Contents & Curriculum Modules</span>
              <div className="space-y-2 font-mono text-xs">
                {(book.chapters || [
                  'Chapter 1: Foundational Framework & Historical Evolution (pp. 1-42)',
                  'Chapter 2: Structural Analysis & Governance Models (pp. 43-88)',
                  'Chapter 3: Accounting Standards, Auditing & Financial Ratios (pp. 89-138)',
                  'Chapter 4: Risk Mitigation & Credit Disbursement Frameworks (pp. 139-194)',
                  'Chapter 5: Digital Automation & Cooperative MIS Systems (pp. 195-248)',
                  'Chapter 6: Practical Case Studies & NBTE Assessment Problems (pp. 249-310)'
                ]).map((ch, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#032317] border border-emerald-900/60 flex justify-between text-emerald-200">
                    <span>{ch}</span>
                    <span className="text-emerald-500 font-bold">✓ Indexed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS & COMMUNITY RATINGS */}
          {activeTab === 'reviews' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-amber-400">5.0 / 5.0</div>
                  <div className="text-xs text-emerald-300">Based on 18 institutional peer and faculty reviews</div>
                </div>
                <div className="text-amber-400 text-lg">★★★★★</div>
              </div>

              <div className="space-y-2">
                <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Dr. K. E. Okonjo (Senior Lecturer, CSC)</span>
                    <span className="text-amber-400">★★★★★</span>
                  </div>
                  <p className="text-emerald-200/80 text-xs">
                    "Exceptionally thorough text. Used in both 300L and 400L lectures. The practical problems mirror current NBTE accreditation standards accurately."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900/60 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Mrs. Folake Sanusi (Banking & Finance)</span>
                    <span className="text-amber-400">★★★★★</span>
                  </div>
                  <p className="text-emerald-200/80 text-xs">
                    "A mandatory reference manual in our departmental library reserve stacks. Clear case studies on cooperative microcredit."
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CITATIONS & SCHOLARLY IDENTIFIERS */}
          {activeTab === 'citations' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {['APA', 'BibTeX', 'MLA', 'Chicago', 'Harvard', 'IEEE'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setCitationFormat(fmt)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        citationFormat === fmt
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-[#021810] text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCitation}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition shadow"
                >
                  {copiedCitation ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCitation ? 'Copied!' : 'Copy Citation'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 font-mono text-xs text-emerald-200 whitespace-pre-wrap select-all">
                {getCitation()}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60">
                  <span className="text-[10px] text-emerald-400 block font-mono">Digital Object Identifier (DOI):</span>
                  <a
                    href={`https://doi.org/${book.doi || '10.1016/fcc.2024.01'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 hover:text-white underline font-mono flex items-center gap-1 pt-1"
                  >
                    <span>https://doi.org/{book.doi || '10.1016/fcc.2024.01'}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60">
                  <span className="text-[10px] text-emerald-400 block font-mono">MARC21 Accession Number:</span>
                  <span className="font-mono text-white font-bold pt-1 block">{book.id} • REV-42</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUTHOR INFORMATION */}
          {activeTab === 'author' && (
            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-800/40 border border-emerald-600 flex items-center justify-center font-bold text-emerald-300 text-lg">
                  {book.author?.charAt(0) || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{book.author}</h4>
                  <p className="text-emerald-400 text-xs font-medium">
                    {book.authorCredentials || 'Principal Lecturer & Faculty Research Chair'}
                  </p>
                </div>
              </div>

              <p className="text-emerald-200/90 leading-relaxed text-xs">
                Affiliated with {book.authorAffiliation || 'Federal Co-operative College, Ibadan (Directorate of Academic Research)'}. Specializes in empirical econometric methodologies, cooperative capital mobilization, and financial risk mitigation in developing economies.
              </p>
            </div>
          )}

          {/* TAB 7: SIMILAR RESOURCES / "MORE LIKE THIS" */}
          {activeTab === 'similar' && (
            <div className="space-y-2 animate-fadeIn">
              <span className="font-bold text-white text-xs block mb-2">Recommended Related Works in Collection:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'FCC-B002', title: 'Modern Database Management & Cloud Distributed Systems', author: 'Jeffrey A. Hoffer', call: 'QA 76.9 .D3 H64' },
                  { id: 'FCC-B003', title: 'Financial Accounting & Cooperative Auditing Standards', author: 'Babatunde R. Adeleke', call: 'HF 5635 .A34 2024' },
                  { id: 'FCC-B004', title: 'Cocoa Agronomy, Post-Harvest Logistics & Value Chain', author: 'Dr. Funmilayo Alabi', call: 'SB 267 .A43 2023' },
                  { id: 'FCC-B005', title: 'Micro-Finance Default Predictor with Gradient Boosting', author: 'K. M. Bello & S. Olanrewaju', call: 'HG 178.33 .N6 B45' }
                ].map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-[#021810] border border-emerald-900/60 hover:border-emerald-500/50 transition">
                    <div className="text-[10px] font-mono text-emerald-400">{item.call}</div>
                    <div className="font-bold text-white text-xs truncate mt-0.5">{item.title}</div>
                    <div className="text-[11px] text-emerald-300/80">{item.author}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
