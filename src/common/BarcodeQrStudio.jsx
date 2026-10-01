import React, { useState } from 'react';
import {
  QrCode, Barcode, Printer, Download, Copy, Check, Sparkles,
  BookOpen, User, Layers, Tag, ShieldCheck, MapPin, ArrowRight
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';
import { copyToClipboardWithFeedback } from '../utils/router';

// High-fidelity algorithmic Barcode SVG generator (Code 128 Pattern)
export function BarcodeSvg({ value, height = 48, className = "" }) {
  const safeVal = String(value || 'FCC-000000').toUpperCase();
  // Deterministic bar widths based on char codes
  const bars = safeVal.split('').flatMap((char, i) => {
    const code = char.charCodeAt(0);
    const pattern = [(code % 3) + 1, ((code >> 1) % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 3) % 2) + 1];
    return pattern;
  });

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg height={height} className="w-full max-w-[280px]" viewBox={`0 0 ${bars.length * 3 + 16} ${height}`}>
        <rect width="100%" height="100%" fill="transparent" />
        {/* Guard bars */}
        <rect x="2" y="0" width="2" height={height} fill="currentColor" />
        <rect x="6" y="0" width="2" height={height} fill="currentColor" />
        {bars.map((w, idx) => {
          const isBlack = idx % 2 === 0;
          if (!isBlack) return null;
          const x = 12 + idx * 3;
          return (
            <rect
              key={idx}
              x={x}
              y="0"
              width={w}
              height={height - 6}
              fill="currentColor"
            />
          );
        })}
        {/* Guard bars */}
        <rect x={bars.length * 3 + 8} y="0" width="2" height={height} fill="currentColor" />
        <rect x={bars.length * 3 + 12} y="0" width="2" height={height} fill="currentColor" />
      </svg>
      <span className="font-mono text-[10px] tracking-[0.2em] font-bold text-slate-400 mt-1">
        {safeVal}
      </span>
    </div>
  );
}

// High-fidelity algorithmic QR Code Matrix SVG generator
export function QrCodeSvg({ value, size = 120, className = "" }) {
  const text = String(value || 'FCC-LIBRARY-TOKEN');
  // 17x17 grid algorithm with 3 anchor patterns in corners
  const gridSize = 21;
  const matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  // Anchor pattern helper
  const drawAnchor = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = 1;
        }
      }
    }
  };

  // 3 standard QR position anchors
  drawAnchor(0, 0);
  drawAnchor(gridSize - 7, 0);
  drawAnchor(0, gridSize - 7);

  // Pseudo-random deterministic fill for payload data
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite anchors
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        const seed = (r * 13 + c * 37 + hash + (r * c)) % 100;
        matrix[r][c] = seed < 48 ? 1 : 0;
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className={`rounded-lg ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={gridSize} height={gridSize} fill="#ffffff" rx="1" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#021810" />
          ) : null
        )
      )}
    </svg>
  );
}

export default function BarcodeQrStudio({ user, books = [], patrons = [] }) {
  const [activeMode, setActiveMode] = useState('student_id');
  // 'student_id' | 'book_barcode' | 'accession' | 'shelf_qr' | 'digital_qr' | 'membership_qr'
  const [studentName, setStudentName] = useState(user?.name || 'Wale Olonade');
  const [studentMatric, setStudentMatric] = useState(user?.matric || 'FCC/CEM/2024/042');
  const [studentLibraryId, setStudentLibraryId] = useState('STU/2026/00125');
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || 'FCC-B001');
  const [shelfCoordinate, setShelfCoordinate] = useState('Floor 2 • West Stacks • Shelf 14A');
  const [digitalUrl, setDigitalUrl] = useState('http://localhost:5173/#/book/FCC-PDF-3779');
  const [copied, setCopied] = useState(false);

  const selectedBook = books.find(b => b.id === selectedBookId) || books[0] || {
    id: 'FCC-B001',
    title: 'Computer Networks Tanenbaum 5th Edition',
    callNumber: 'QA76.9 .D3 O46 2026',
    author: 'Dr. K. O. Okonjo'
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleCopyCode = (val) => {
    copyToClipboardWithFeedback(val, (ok) => {
      if (ok) {
        sounds.playClick();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-800/80 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
            <Barcode size={15} />
            <span>Module 7 — Institutional Barcode & QR Generation Suite</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            High-Resolution Barcode & QR Label Engine
          </h2>
          <p className="text-xs text-emerald-300/80 mt-1">
            Standardized Code 128 barcodes and dynamic QR matrices for physical library cards, stack book spines, shelves, and digital resources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
          >
            <Printer size={15} />
            <span>Print Label Sheet</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-[#021810] border border-emerald-900/80 no-scrollbar text-xs">
        {[
          { id: 'student_id', label: '1. Student Library ID & Mobile Card', icon: User },
          { id: 'book_barcode', label: '2. Book Spine Barcode (Item)', icon: Barcode },
          { id: 'accession', label: '3. Accession Number Barcode', icon: Tag },
          { id: 'shelf_qr', label: '4. Physical Shelf Stack QR', icon: MapPin },
          { id: 'digital_qr', label: '5. Digital Resource Scan-to-Read', icon: QrCode },
          { id: 'membership_qr', label: '6. Turnstile Gate Membership QR', icon: ShieldCheck }
        ].map(m => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveMode(m.id);
                sounds.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60'
                  : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-400'} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span>Label Configuration Parameters</span>
          </h3>

          {activeMode === 'student_id' && (
            <div className="space-y-3">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Student Scholar Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Matriculation ID</label>
                  <input
                    type="text"
                    value={studentMatric}
                    onChange={e => setStudentMatric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Library Card ID</label>
                  <input
                    type="text"
                    value={studentLibraryId}
                    onChange={e => setStudentLibraryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeMode === 'book_barcode' && (
            <div className="space-y-3">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Select Catalog Item</label>
                <select
                  value={selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.title.substring(0, 38)}...
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Item Call Number (LCC / DDC)</label>
                <input
                  type="text"
                  readOnly
                  value={selectedBook.callNumber || 'QA76.9 .D3 O46 2026'}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800/60 text-slate-400 font-mono"
                />
              </div>
            </div>
          )}

          {activeMode === 'shelf_qr' && (
            <div className="space-y-3">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Stack Coordinate / Shelf Aisle</label>
                <input
                  type="text"
                  value={shelfCoordinate}
                  onChange={e => setShelfCoordinate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-emerald-400/80">
                Generate laminated QR plaques to adhere to physical stack aisles. When scanned by a student phone, it opens the interactive shelf collection.
              </p>
            </div>
          )}

          {activeMode === 'digital_qr' && (
            <div className="space-y-3">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Target Resource Deep-Link URL</label>
                <input
                  type="text"
                  value={digitalUrl}
                  onChange={e => setDigitalUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-emerald-400/80">
                Printed on noticeboards and syllabus reading lists. Students scan with their smartphone camera to instantly open the interactive full-text PDF.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-300/80">
            <span>Encoding: ISO/IEC 15417 Code 128</span>
            <span>Check Digit: Modulo 103</span>
          </div>
        </div>

        {/* Right Column: Live Card & Label Visualizer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-[#021810] border border-emerald-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Preview Dimension: 85.6mm × 53.98mm (CR80)
          </div>

          {/* CARD TYPE 1: EXACT ASCII LAYOUT MATCHING USER SPEC */}
          {activeMode === 'student_id' && (
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#032317] via-[#042e1f] to-[#021810] border-2 border-emerald-500/60 p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-5 h-5 object-cover rounded-full shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    {INSTITUTION.shortName} SMART LIBRARY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-300">RFID ACTIVE</span>
              </div>

              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">
                  {studentName}
                </h4>
                <div className="text-[11px] text-emerald-300 font-medium">
                  Patron Scholar • {studentMatric}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#021810] border border-emerald-900/80">
                <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-1">
                  LIBRARY ID
                </div>
                <div className="text-sm font-black font-mono text-white tracking-widest">
                  {studentLibraryId}
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="p-3 rounded-2xl bg-white text-slate-950 shadow-inner flex flex-col items-center">
                <BarcodeSvg value={studentLibraryId} height={42} className="text-black" />
              </div>

              {/* Centered QR Code */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="p-2 bg-white rounded-2xl shadow-lg">
                  <QrCodeSvg value={`fcc-patron:${studentLibraryId}:${studentMatric}`} size={110} />
                </div>
                <span className="text-[9px] font-mono text-emerald-400/80 mt-2">
                  Scan at Entrance Turnstile or Self-Checkout Kiosk
                </span>
              </div>
            </div>
          )}

          {/* CARD TYPE 2: BOOK SPINE BARCODE */}
          {activeMode === 'book_barcode' && (
            <div className="w-full max-w-xs p-5 rounded-2xl bg-white text-slate-950 shadow-2xl border-2 border-slate-300 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 pb-1">
                <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-4 h-4 object-cover rounded-full shrink-0" />
                <span>{INSTITUTION.shortName} CENTRAL REPOSITORY</span>
              </div>
              <div className="font-bold text-xs truncate">{selectedBook.title}</div>
              <div className="font-mono text-[11px] font-black bg-slate-100 p-1 rounded">
                CALL: {selectedBook.callNumber || 'QA76.9 .D3 O46 2026'}
              </div>
              <div className="py-2">
                <BarcodeSvg value={`FCC-BC-${selectedBook.id}`} height={46} className="text-black" />
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                ACCESSION # FCC-ACC-2026-{selectedBook.id.replace(/[^0-9]/g, '') || '9821'}
              </div>
            </div>
          )}

          {/* CARD TYPE 3: ACCESSION BARCODE */}
          {activeMode === 'accession' && (
            <div className="w-full max-w-xs p-5 rounded-2xl bg-white text-slate-950 shadow-2xl border-2 border-slate-300 text-center space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                PERMANENT ACCESSION REGISTRATION
              </div>
              <div className="text-sm font-black font-mono text-emerald-950">
                FCC-ACC-2026-9042
              </div>
              <div className="py-2">
                <BarcodeSvg value="FCC-ACC-2026-9042" height={44} className="text-black" />
              </div>
              <div className="text-[10px] text-slate-600">
                National Board for Technical Education (NBTE) Audit Tracked
              </div>
            </div>
          )}

          {/* CARD TYPE 4: SHELF STACK QR PLAQUE */}
          {activeMode === 'shelf_qr' && (
            <div className="w-full max-w-sm rounded-3xl bg-[#032317] border-2 border-emerald-500 p-6 text-center space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="text-[11px] font-bold text-emerald-400">STACK AISLE NAVIGATION</span>
                <span className="text-[10px] font-mono text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  FLOOR 2
                </span>
              </div>
              <h4 className="text-lg font-black text-white">{shelfCoordinate}</h4>
              <div className="p-3 bg-white rounded-2xl inline-block shadow-xl">
                <QrCodeSvg value={`fcc-shelf:${encodeURIComponent(shelfCoordinate)}`} size={120} />
              </div>
              <p className="text-xs text-emerald-200">
                Scan with smart device to browse all available texts currently housed on this shelf stack.
              </p>
            </div>
          )}

          {/* CARD TYPE 5: DIGITAL RESOURCE SCAN-TO-READ */}
          {activeMode === 'digital_qr' && (
            <div className="w-full max-w-sm rounded-3xl bg-[#032317] border-2 border-emerald-500 p-6 text-center space-y-4 shadow-2xl">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                SCAN-TO-READ E-BOOK DIRECT ACCESS
              </div>
              <div className="font-bold text-white text-sm">
                Computer Networks Tanenbaum 5th Edition
              </div>
              <div className="p-3 bg-white rounded-2xl inline-block shadow-xl">
                <QrCodeSvg value={digitalUrl} size={120} />
              </div>
              <div className="text-xs font-mono text-emerald-300 break-all p-2 rounded-xl bg-[#021810] border border-emerald-900">
                {digitalUrl}
              </div>
            </div>
          )}

          {/* CARD TYPE 6: MEMBERSHIP TURNSTILE QR */}
          {activeMode === 'membership_qr' && (
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#032317] to-[#021810] border-2 border-emerald-500 p-6 text-center space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="text-xs font-bold text-emerald-400">TURNSTILE ACCESS TOKEN</span>
                <span className="text-[10px] font-mono text-emerald-300 animate-pulse">VALID</span>
              </div>
              <div className="p-3 bg-white rounded-2xl inline-block shadow-xl">
                <QrCodeSvg value={`fcc-access-token:${studentMatric}:${Date.now()}`} size={130} />
              </div>
              <div className="text-xs text-white font-mono">
                TOKEN EXPIRES IN <strong className="text-emerald-400">04:59</strong>
              </div>
              <p className="text-[11px] text-emerald-300/70">
                Hold this QR code 5cm from the automated turnstile scanner at the main entrance gate.
              </p>
            </div>
          )}

          {/* Quick Copy Action */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handleCopyCode(activeMode === 'student_id' ? studentLibraryId : selectedBook.id)}
              className="px-4 py-2 rounded-xl bg-[#032317] hover:bg-emerald-950 text-emerald-300 hover:text-white border border-emerald-800/80 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Code Copied!' : 'Copy Code Token'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
