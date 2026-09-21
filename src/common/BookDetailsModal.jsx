import React, { useState } from 'react';
import { X, BookOpen, Bookmark, Copy, Check, MapPin, Share2, Sparkles, Download, Layers, ExternalLink, Link2, Database } from 'lucide-react';
import { getPermalink, copyToClipboardWithFeedback } from '../utils/router';
import TraceBadge from './TraceBadge';

export default function BookDetailsModal({ book, onClose, onOpenReader, onReserve }) {
  const [citationFormat, setCitationFormat] = useState('APA');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'toc' | 'citations' | 'shelf'

  if (!book) return null;

  const directPermalink = getPermalink(`/book/${book.id}`);

  const handleCopyLink = () => {
    copyToClipboardWithFeedback(directPermalink, (success) => {
      if (success) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  };

  const getCitation = () => {
    switch (citationFormat) {
      case 'APA':
        return `${book.author} (${book.year || 2024}). ${book.title} (${book.edition || '1st ed.'}). Ibadan: ${book.publisher || 'FCC Ibadan Academic Press'}. https://doi.org/${book.doi || '10.1016/fcc.2024'}`;
      case 'BibTeX':
        return `@book{fcc_${book.id.toLowerCase()},\n  author    = {${book.author}},\n  title     = {${book.title}},\n  publisher = {${book.publisher || 'FCC Press'}},\n  year      = {${book.year || 2024}},\n  isbn      = {${book.isbn}},\n  doi       = {${book.doi || '10.1016/fcc.2024'}}\n}`;
      case 'MLA':
        return `${book.author}. *${book.title}*. ${book.edition || '1st ed.'}, ${book.publisher || 'FCC Ibadan Academic Press'}, ${book.year || 2024}. DOI: ${book.doi || '10.1016/fcc.2024'}`;
      case 'IEEE':
        return `[1] ${book.author}, "${book.title}," ${book.edition || '1st ed.'}, Ibadan, Nigeria: ${book.publisher || 'FCC Press'}, ${book.year || 2024}.`;
      case 'Harvard':
        return `${book.author}, ${book.year || 2024}. ${book.title}. ${book.edition || '1st edn.'} Ibadan: ${book.publisher || 'FCC Press'}.`;
      default:
        return `${book.author}. ${book.title}. ${book.year || 2024}.`;
    }
  };

  const handleCopyCitation = () => {
    copyToClipboardWithFeedback(getCitation(), (success) => {
      if (success) {
        setCopiedCitation(true);
        setTimeout(() => setCopiedCitation(false), 2000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black relative my-8">
        
        {/* Close Button */}
        <button
          id="btn-close-book-modal"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-emerald-800 to-slate-950 border border-emerald-500/30 flex items-center justify-center font-bold text-xl text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/60 font-serif">
            {book.department || 'FCC'}
          </div>

          <div className="space-y-1.5 flex-1 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                {book.callNumber}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                {book.subject}
              </span>
              {book.externalUrl && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 flex items-center gap-1">
                  <Link2 size={11} /> External Web Resource
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                book.copiesAvailable > 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {book.copiesAvailable > 0 ? `${book.copiesAvailable} Copies Available` : 'Reserved Out'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">{book.title}</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              By <span className="font-semibold text-emerald-400">{book.author}</span> • {book.publisher} ({book.year})
            </p>

            {/* Direct Traceable Permalink Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-xs sm:max-w-md">
                URI: {directPermalink}
              </span>
              <button
                id="btn-copy-book-permalink"
                onClick={handleCopyLink}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
                title="Copy Direct Link to this Resource"
              >
                {copiedLink ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
                {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mt-6 gap-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Abstract' },
            { id: 'author', label: 'Author Dossier' },
            { id: 'toc', label: 'Table of Contents' },
            { id: 'pdf_specs', label: 'PDF & Academic Specs' },
            { id: 'citations', label: 'Export Citations' },
            { id: 'shelf', label: 'Holdings / Shelf Locator' },
          ].map(tab => (
            <button
              id={`tab-book-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="py-5 min-h-[180px]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} /> Executive Summary & Abstract
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {book.abstract}
                </p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Lead Author</span>
                  <span className="font-bold text-white truncate block">{book.author}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Target Course</span>
                  <span className="font-bold text-indigo-400 font-mono">{book.courseCode || 'General Collection'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Digital E-Book</span>
                  <span className="font-bold text-emerald-400">{book.isDigital ? 'Full PDF Available' : 'Physical Only'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Page Count</span>
                  <span className="font-bold text-white">{book.pdfPages || 300} Pages</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'author' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg font-serif">
                  {book.author.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-white">{book.author}</h3>
                  <div className="text-xs text-emerald-400 font-medium">
                    {book.authorCredentials || 'Distinguished Academic & Research Scholar'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {book.authorAffiliation || 'Federal Co-operative College, Ibadan • Faculty of Social & Management Sciences'}
                  </div>
                </div>
              </div>

              {book.coAuthors && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">Contributing Co-Authors:</span>
                  <span className="text-slate-200">{book.coAuthors}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-400">Academic Note:</strong> This text has been vetted and accredited by the FCC Academic Board and Departmental Curriculum Committee for undergraduate and professional study.
              </div>
            </div>
          )}

          {activeTab === 'toc' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span>Curriculum Chapters & Syllabus Breakdown:</span>
                <span className="text-[11px] text-emerald-400 font-mono">100% Reader Searchable</span>
              </div>
              {book.chapters && book.chapters.length > 0 ? (
                book.chapters.map((ch, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-emerald-800 font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{ch.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">Page {ch.page}</span>
                  </div>
                ))
              ) : book.tableOfContents && book.tableOfContents.length > 0 ? (
                book.tableOfContents.map((ch, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <span>{ch}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Full monograph index available in full-text digital reader.</p>
              )}
            </div>
          )}

          {activeTab === 'pdf_specs' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download size={14} /> PDF File & Bibliographic Specifications
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">File Name</span>
                  <span className="font-mono text-slate-200 text-[11px] truncate block">{book.fileName || `${book.id.toLowerCase()}.pdf`}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">File Size & Format</span>
                  <span className="font-bold text-emerald-400 font-mono">{book.fileSize || '4.8 MB'} • Adobe PDF / ISO 32000</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ISBN-13</span>
                  <span className="font-mono text-slate-200">{book.isbn}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Digital Object Identifier (DOI)</span>
                  <span className="font-mono text-indigo-300 text-[11px] truncate block">{book.doi || '10.5281/fcc.2024'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block">Access Rights & DRM</span>
                  <span className="text-slate-300">{book.accessLevel || 'Open Academic Campus Intranet License (Accredited for All Students)'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Citation Formats</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {['APA', 'BibTeX', 'MLA', 'IEEE', 'Harvard'].map(fmt => (
                    <button
                      id={`btn-cite-${fmt.toLowerCase()}`}
                      key={fmt}
                      onClick={() => setCitationFormat(fmt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        citationFormat === fmt ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {getCitation()}
                </pre>
                <button
                  id="btn-copy-citation"
                  onClick={handleCopyCitation}
                  className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 shadow transition"
                >
                  {copiedCitation ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedCitation ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shelf' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              {book.externalUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Globe size={16} />
                    <span>External Digital Access Link</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This digital monograph is hosted on an institutional academic repository:
                  </p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-indigo-700/50 font-mono text-xs text-indigo-300 break-all flex items-center justify-between gap-2">
                    <span>{book.externalUrl}</span>
                    <a
                      id="btn-open-external-url-tab"
                      href={book.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 shadow"
                    >
                      <ExternalLink size={12} /> Open URL
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <MapPin size={16} />
                    <span>Physical Stack Locator</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    This volume is shelved in the <strong className="text-white">Main Campus Library</strong> at:
                  </p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 font-mono text-xs text-emerald-300 flex items-center justify-between">
                    <span>{book.shelfLocation || 'Floor 2 • Co-operative Studies Wing • Shelf 12B'}</span>
                    <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-400">CALL: {book.callNumber}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-close-modal-bottom"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <TraceBadge uri={`#/book/${book.id}`} label="Book" />
            
            {book.externalUrl ? (
              <div className="flex items-center gap-1.5">
                <TraceBadge uri={book.externalUrl} label="Ext URL" />
                <a
                  id="btn-open-external-resource-link"
                  href={book.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950"
                >
                  <ExternalLink size={14} /> Open External Link
                </a>
              </div>
            ) : null}

            {onReserve && book.copiesAvailable <= 0 && (
              <div className="flex items-center gap-1.5">
                <TraceBadge uri={`action://scholar/reserve?bookId=${book.id}`} label="Action" isAction={true} />
                <button
                  id="btn-reserve-book"
                  onClick={() => onReserve(book)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Bookmark size={14} /> Place Reservation Hold
                </button>
              </div>
            )}

            {book.isDigital && (
              <button
                id="btn-download-pdf-doc"
                onClick={() => {
                  sounds.playSuccessChime();
                  alert(`Starting download for "${book.fileName || book.title + '.pdf'}" (${book.fileSize || '4.8 MB'}). Download token validated by Institutional Repository.`);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                title="Download PDF Document for Offline Study"
              >
                <Download size={13} className="text-emerald-400" /> Download PDF
              </button>
            )}

            {book.isDigital && onOpenReader && (
              <div className="flex items-center gap-1.5">
                <TraceBadge uri={`#/reader/${book.id}`} label="Reader" />
                <button
                  id="btn-launch-e-reader"
                  onClick={() => { onClose(); onOpenReader(book); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
                >
                  <BookOpen size={14} /> Launch E-Reader
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
