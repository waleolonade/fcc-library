import React, { useState } from 'react';
import { X, ExternalLink, BookOpen, Maximize2, Minimize2, Sparkles, ShieldCheck } from 'lucide-react';

export default function GoogleBooksViewerModal({ book, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!book) return null;

  const cleanIsbn = (book.isbn || '').replace(/[-\s]/g, '');
  const googleId = book.googleBookId || '';

  // Embedded URL priority: Direct Google Volume ID > ISBN
  const embedUrl = googleId
    ? `https://books.google.com/books?id=${googleId}&printsec=frontcover&output=embed`
    : `https://books.google.com/books?isbn=${cleanIsbn}&printsec=frontcover&output=embed`;

  const externalUrl = book.externalUrl || `https://books.google.com/books?isbn=${cleanIsbn}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className={`bg-slate-900 border border-emerald-500/50 rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
      }`}>
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{book.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                  Google Books Preview
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                By {book.author || 'Author'} • ISBN: {book.isbn || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Open full page in Google Books"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Google Books Tab</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white transition"
              title="Close Preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Container */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          <iframe
            src={embedUrl}
            title={`Preview of ${book.title}`}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        </div>

        {/* Bottom Status Ribbon */}
        <div className="px-4 py-2 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Authenticated Institutional Embedded Access • FCC Ibadan Digital Gateway</span>
          </div>
          <div className="font-mono text-emerald-400 text-[10px]">
            GOOGLE-BOOKS-VIEWER-V1
          </div>
        </div>
      </div>
    </div>
  );
}
