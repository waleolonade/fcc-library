import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  RotateCw, Download, ExternalLink, RefreshCw, AlertTriangle, FileText,
  ChevronsLeft, ChevronsRight, Eye
} from 'lucide-react';

/**
 * Loads Mozilla's PDF.js dynamically from local public assets or CDN.
 */
let pdfjsPromise = null;
function getPdfJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR not supported'));
  const existing = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (existing) {
    if (!existing.GlobalWorkerOptions?.workerSrc) {
      existing.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
    }
    return Promise.resolve(existing);
  }
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/pdfjs/pdf.min.js';
    script.async = true;

    script.onload = () => {
      const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
        resolve(lib);
      } else {
        fallbackToCdn(resolve, reject);
      }
    };

    script.onerror = () => {
      fallbackToCdn(resolve, reject);
    };

    function fallbackToCdn(res, rej) {
      const cdn = document.createElement('script');
      cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      cdn.async = true;
      cdn.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          res(window.pdfjsLib);
        } else {
          rej(new Error('Failed to load PDF engine'));
        }
      };
      cdn.onerror = () => rej(new Error('PDF viewer engine could not be loaded'));
      document.head.appendChild(cdn);
    }

    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

export default function PdfCanvasViewer({
  pdfUrl,
  currentPage = 1,
  onPageChange,
  onTotalPages,
  title = 'Document',
  fileName = 'document.pdf',
  theme = 'dark',
  onSwitchToInteractive
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pdfBytesRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [fitWidth, setFitWidth] = useState(true);

  // Load PDF document from url
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadDocument() {
      try {
        const pdfjs = await getPdfJs();
        if (cancelled) return;

        // Build resilient candidate URLs covering Vite proxy, XAMPP path, and direct port 8000
        const base = (pdfUrl || '').split('#')[0];
        if (!base) throw new Error('No PDF URL specified');

        const idMatch = base.match(/\/books\/([^\/]+)/) || base.match(/\/catalog\/([^\/]+)/) || base.match(/\/department-uploads\/([^\/]+)/);
        const bookId = idMatch ? idMatch[1] : '';

        const candidateUrls = Array.from(new Set([
          bookId ? `/api/books/${bookId}/pdf` : null,
          base,
          bookId ? `/api/catalog/${bookId}/file` : null,
          bookId ? `/fcclibrary/backend/public/api/books/${bookId}/pdf` : null,
          bookId ? `/fcclibrary/backend/public/api/catalog/${bookId}/file` : null,
          typeof window !== 'undefined' && bookId ? `http://127.0.0.1:8000/api/books/${bookId}/pdf` : null,
          typeof window !== 'undefined' && bookId ? `http://${window.location.hostname}:8000/api/books/${bookId}/pdf` : null,
          typeof window !== 'undefined' && bookId ? `${window.location.protocol}//${window.location.hostname}:8000/api/books/${bookId}/pdf` : null,
        ].filter(Boolean)));

        let arrayBuffer = null;
        let lastErr = null;

        for (const testUrl of candidateUrls) {
          try {
            const res = await fetch(testUrl);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              if (buf && buf.byteLength > 100) {
                arrayBuffer = buf;
                break;
              }
            }
          } catch (e) {
            lastErr = e;
          }
        }

        if (cancelled) return;

        if (!arrayBuffer) {
          throw new Error(lastErr?.message || 'Unable to retrieve PDF stream from server.');
        }

        pdfBytesRef.current = arrayBuffer;

        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (cancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        if (onTotalPages) onTotalPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('PDF Canvas Viewer Load Error:', err);
        setError(err.message || 'Failed to render PDF document');
        setLoading(false);
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Render current page onto Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    const targetPage = Math.max(1, Math.min(currentPage || 1, numPages || 1));

    try {
      setRendering(true);

      // Cancel previous render if in progress
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }

      const page = await pdfDoc.getPage(targetPage);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });

      let calculatedScale = scale;
      if (fitWidth && containerRef.current) {
        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        if (containerWidth > 200) {
          calculatedScale = containerWidth / unscaledViewport.width;
        }
      }

      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: calculatedScale, rotation });

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);

      // Background fill before render
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      ctx.restore();
      setRendering(false);
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('PDF Page Render Warning:', err);
      }
      setRendering(false);
    }
  }, [pdfDoc, currentPage, numPages, scale, rotation, fitWidth, theme]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Handle Resize for Fit-Width
  useEffect(() => {
    const handleResize = () => {
      if (fitWidth) {
        renderPage();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitWidth, renderPage]);

  // Page Navigation Handlers
  const goToPrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < numPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const goToFirst = () => {
    if (onPageChange) onPageChange(1);
  };

  const goToLast = () => {
    if (onPageChange && numPages > 0) onPageChange(numPages);
  };

  const handleZoomIn = () => {
    setFitWidth(false);
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setFitWidth(false);
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFitWidth = () => {
    setFitWidth(prev => !prev);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadUrl = (() => {
    const clean = (pdfUrl || '').split('#')[0];
    const idMatch = clean.match(/\/books\/([^\/]+)/) || clean.match(/\/catalog\/([^\/]+)/) || clean.match(/\/department-uploads\/([^\/]+)/);
    const bookId = idMatch ? idMatch[1] : '';
    if (bookId) {
      return `/api/books/${encodeURIComponent(bookId)}/pdf/download`;
    }
    return clean + (clean.includes('?') ? '&' : '?') + 'download=1';
  })();

  const triggerDownload = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (downloading) return;
    try {
      setDownloading(true);
      const targetFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // 1. If we already hold the raw bytes in memory from Canvas load, use them immediately
      if (pdfBytesRef.current && pdfBytesRef.current.byteLength > 100) {
        const blob = new Blob([pdfBytesRef.current], { type: 'application/pdf' });
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = targetFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
        return;
      }

      // 2. Otherwise fetch the binary stream from backend download endpoint
      const clean = (pdfUrl || '').split('#')[0];
      const idMatch = clean.match(/\/books\/([^\/]+)/) || clean.match(/\/catalog\/([^\/]+)/) || clean.match(/\/department-uploads\/([^\/]+)/);
      const bookId = idMatch ? idMatch[1] : '';

      const candidates = [
        downloadUrl,
        bookId ? `/api/books/${encodeURIComponent(bookId)}/pdf/download` : null,
        bookId ? `http://127.0.0.1:8000/api/books/${encodeURIComponent(bookId)}/pdf/download` : null,
        clean
      ].filter(Boolean);

      let fetched = false;
      for (const c of candidates) {
        try {
          const res = await fetch(c);
          if (res.ok) {
            const blob = await res.blob();
            if (blob && blob.size > 100) {
              const objUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = objUrl;
              link.download = targetFileName;
              document.body.appendChild(link);
              link.click();
              link.remove();
              setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
              fetched = true;
              break;
            }
          }
        } catch (err) {}
      }

      if (!fetched) {
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      window.open(downloadUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 min-h-[720px] rounded-2xl flex flex-col overflow-hidden border shadow-2xl transition-all ${
        theme === 'dark'
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : theme === 'sepia'
          ? 'bg-[#fcf7ee] border-[#dfd2be] text-[#332a1e]'
          : 'bg-slate-100 border-slate-300 text-slate-900'
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none ${
        theme === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        {/* Document Title / Status */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="text-emerald-400 font-bold shrink-0">Canvas PDF:</span>
          <span className="font-sans font-medium truncate max-w-[200px] sm:max-w-xs text-slate-300">
            {fileName || title}
          </span>
          {numPages > 0 && (
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px]">
              {numPages} {numPages === 1 ? 'Page' : 'Pages'}
            </span>
          )}
        </div>

        {/* Page Jump / Pagination Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
          <button
            onClick={goToFirst}
            disabled={currentPage <= 1 || loading}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-300"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={goToPrev}
            disabled={currentPage <= 1 || loading}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-300"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="px-1 text-[11px] font-bold text-slate-200">
            {loading ? '...' : currentPage} <span className="opacity-50">/</span> {numPages || 1}
          </span>

          <button
            onClick={goToNext}
            disabled={currentPage >= numPages || loading}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-300"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={goToLast}
            disabled={currentPage >= numPages || loading}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-300"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || loading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={toggleFitWidth}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
              fitWidth
                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Fit to Width"
          >
            {fitWidth ? 'Fit: Auto' : `${Math.round(scale * 100)}%`}
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || loading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Rotate Page (90° Clockwise)"
          >
            <RotateCw size={13} />
          </button>

          {/* Download PDF Button */}
          <button
            onClick={triggerDownload}
            disabled={downloading}
            className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-sans font-bold text-xs flex items-center gap-1.5 shadow transition ml-1 disabled:opacity-60"
            title="Download PDF to computer/phone"
          >
            <Download size={12} className={downloading ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download'}</span>
          </button>

          {/* Open Native Tab */}
          <a
            href={(pdfUrl || '').split('#')[0]}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Open Raw PDF in Separate Tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="relative flex-1 overflow-auto flex flex-col items-center justify-start p-4 sm:p-6 min-h-[640px] bg-slate-950/70">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
            <RefreshCw size={28} className="text-teal-400 animate-spin" />
            <span className="text-xs font-mono text-teal-300">Rendering high-resolution PDF pages...</span>
          </div>
        )}

        {/* Error Fallback Card */}
        {error && (
          <div className="m-auto max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/70 border border-amber-800 text-amber-300 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Document Streaming Ready</h4>
              <p className="text-xs text-slate-400">
                {error}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {onSwitchToInteractive && (
                <button
                  onClick={onSwitchToInteractive}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Read in Interactive Text View
                </button>
              )}
              <button
                onClick={triggerDownload}
                disabled={downloading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <Download size={13} className={downloading ? 'animate-bounce' : ''} />
                <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Page Canvas */}
        <div className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'} ${rendering ? 'opacity-80' : 'opacity-100'} shadow-2xl rounded-lg overflow-hidden border border-slate-800`}>
          <canvas ref={canvasRef} className="block mx-auto max-w-full" />
        </div>

        {/* Page indicator pill at bottom */}
        {!loading && !error && numPages > 0 && (
          <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 shadow-lg flex items-center gap-2">
            <span>Page {currentPage} of {numPages}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{Math.round((currentPage / numPages) * 100)}% Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
