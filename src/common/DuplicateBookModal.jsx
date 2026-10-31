import React from 'react';
import {
  AlertTriangle, Copy, Check, ExternalLink, X, BookOpen,
  Building2, Hash, MapPin, User, Calendar, ShieldAlert, ArrowRight
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

/**
 * High-Visibility Duplicate Detection & Tracing Modal
 * Displays institutional card number, call mark, shelf, and metadata
 * whenever an Admin, HOD, Staff, or Developer attempts to upload an existing document.
 */
export default function DuplicateBookModal({
  isOpen,
  duplicateInfo,
  onClose,
  onTrace,
  onProceedAnyway
}) {
  const [copiedCard, setCopiedCard] = React.useState(false);

  if (!isOpen || !duplicateInfo) return null;

  const cardNo = duplicateInfo.card_number || duplicateInfo.book?.card_number || duplicateInfo.book?.id || duplicateInfo.id || 'N/A';
  const callNo = duplicateInfo.call_number || duplicateInfo.book?.call_number || duplicateInfo.book?.callNumber || 'FCC.LIB.2026';
  const title = duplicateInfo.title || duplicateInfo.book?.title || 'Academic Document';
  const author = duplicateInfo.author || duplicateInfo.book?.author || 'Institutional Scholar';
  const department = duplicateInfo.department || duplicateInfo.book?.department || 'Federal Co-operative College';
  const shelf = duplicateInfo.shelf_location || duplicateInfo.book?.shelf_location || duplicateInfo.book?.shelfLocation || 'Digital E-Library & Repository';
  const uploadedBy = duplicateInfo.uploaded_by || duplicateInfo.book?.uploaded_by || duplicateInfo.book?.hod_name || 'Administration';
  const uploadedAt = duplicateInfo.uploaded_at || duplicateInfo.book?.uploaded_at || duplicateInfo.book?.uploadedAt || 'Current Session';
  const status = duplicateInfo.status || duplicateInfo.book?.status || 'Cataloged & Active';
  const source = duplicateInfo.source || 'Institutional Central Catalog';
  const isbn = duplicateInfo.isbn || duplicateInfo.book?.isbn;
  const doi = duplicateInfo.doi || duplicateInfo.book?.doi;

  const handleCopyCard = (e) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard.writeText(cardNo);
      setCopiedCard(true);
      try { sounds.playClick(); } catch {}
      setTimeout(() => setCopiedCard(false), 2500);
    } catch (err) {}
  };

  const handleTrace = () => {
    try { sounds.playClick(); } catch {}
    if (onTrace) {
      onTrace(duplicateInfo.book || duplicateInfo);
    } else {
      // Default fallback: route to catalogue search for this card/id
      if (typeof window !== 'undefined') {
        window.location.hash = `#/reader/${encodeURIComponent(cardNo)}`;
      }
    }
    if (onClose) onClose();
  };

  const handleProceed = () => {
    try { sounds.playClick(); } catch {}
    if (onProceedAnyway) onProceedAnyway();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-950/50 p-6 md:p-8 space-y-6 text-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Duplicate Warning
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {source}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight mt-0.5">
                Document Already Exists in Repository
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Banner */}
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
          A matching publication is already registered and active in the Federal Co-operative College institutional repository. Use the official <strong className="text-amber-300 font-semibold">Card Reference Number</strong> below to trace or review the existing entry.
        </p>

        {/* PROMINENT CARD NUMBER & CALL NUMBER TRACING BLOCK */}
        <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Hash size={12} />
                Institutional Card Number
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xl md:text-2xl font-black text-amber-200 tracking-tight">
                  {cardNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCard}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1 transition"
                  title="Copy Card Number to clipboard"
                >
                  {copiedCard ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCard ? 'Copied' : 'Copy Card No.'}</span>
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Classification Call No.
              </span>
              <div className="font-mono text-sm md:text-base font-bold text-emerald-300 mt-1">
                {callNo}
              </div>
            </div>
          </div>

          {/* Key Tracing Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <BookOpen size={12} className="text-indigo-400" /> Title:
              </span>
              <div className="font-semibold text-slate-200 line-clamp-2">
                {title}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <User size={12} className="text-emerald-400" /> Author / Researcher:
              </span>
              <div className="font-semibold text-slate-200 line-clamp-1">
                {author}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Building2 size={12} className="text-amber-400" /> Department:
              </span>
              <div className="font-semibold text-slate-300">
                {department}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <MapPin size={12} className="text-rose-400" /> Shelf Location:
              </span>
              <div className="font-semibold text-slate-300">
                {shelf}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Uploaded By:</span>
              <div className="text-slate-300 font-medium">
                {uploadedBy}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Status & Access:</span>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {(isbn || doi) && (
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-3">
              {isbn && <span><strong>ISBN:</strong> {isbn}</span>}
              {doi && <span><strong>DOI:</strong> {doi}</span>}
            </div>
          )}
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <X size={14} />
            <span>Cancel Upload (Recommended)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onProceedAnyway && (
              <button
                type="button"
                onClick={handleProceed}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition text-center"
                title="Upload as another edition or supplementary copy"
              >
                Upload Anyway
              </button>
            )}

            <button
              type="button"
              onClick={handleTrace}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen size={14} />
              <span>Trace in Catalogue</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
