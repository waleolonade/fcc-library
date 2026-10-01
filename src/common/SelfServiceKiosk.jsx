import React, { useState } from 'react';
import {
  QrCode, Barcode, CheckCircle2, AlertTriangle, ArrowRight,
  BookOpen, User, Clock, ShieldCheck, Printer, RefreshCw,
  Sparkles, Layers, RotateCcw, ChevronRight, X, Phone, Check,
  CreditCard, ExternalLink
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { BarcodeSvg, QrCodeSvg } from './BarcodeQrStudio';
import { sounds } from '../utils/soundEffects';
import { navigateTo } from '../utils/router';

export default function SelfServiceKiosk({
  books = [],
  loans = [],
  setLoans,
  setBooks,
  currentUser,
  onClose
}) {
  const [stationMode, setStationMode] = useState('checkout'); // 'checkout' | 'return'
  
  // Checkout flow state
  // Step 1: Scan Patron -> Step 2: Scan Book -> Step 3: Confirmation -> Step 4: Digital Receipt
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [patronInput, setPatronInput] = useState(currentUser?.matric || 'FCC/CEM/2024/042');
  const [activePatron, setActivePatron] = useState(() => {
    if (currentUser) {
      return {
        name: currentUser.name || 'Wale Olonade',
        matric: currentUser.matric || 'FCC/CEM/2024/042',
        libraryId: 'STU/2026/00125',
        dept: currentUser.dept || 'Co-operative Economics & Management',
        fines: 0,
        quotaMax: 5
      };
    }
    return null;
  });

  const [bookBarcodeInput, setBookBarcodeInput] = useState('FCC-BC-09281');
  const [scannedBook, setScannedBook] = useState(null);
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Return flow state
  // Step 1: Scan Book -> Step 2: System Identifies Borrower -> Step 3: Return Receipt
  const [returnStep, setReturnStep] = useState(1);
  const [returnBarcodeInput, setReturnBarcodeInput] = useState('FCC-BC-09281');
  const [matchedLoanForReturn, setMatchedLoanForReturn] = useState(null);
  const [returnReceipt, setReturnReceipt] = useState(null);
  const [returnError, setReturnError] = useState('');

  // 1. Identify Patron in Checkout
  const handleVerifyPatron = (e) => {
    if (e) e.preventDefault();
    setCheckoutError('');
    if (!patronInput.trim()) {
      setCheckoutError('Please scan your Student QR Card or enter your Matric Number.');
      return;
    }

    sounds.playScannerBeep();

    // Check patron status
    const isCEM = patronInput.toUpperCase().includes('CEM');
    const isCSC = patronInput.toUpperCase().includes('CSC');

    const patronData = {
      name: isCEM ? 'Wale Olonade' : isCSC ? 'Chukwudi Okafor' : 'Folashade Adeleke',
      matric: patronInput.trim().toUpperCase(),
      libraryId: `STU/2026/${patronInput.replace(/[^0-9]/g, '').slice(-5) || '00125'}`,
      dept: isCEM ? 'Co-operative Economics & Management' : isCSC ? 'Computer Science' : 'Banking & Finance',
      fines: patronInput.includes('011') ? 250 : 0, // Simulated fine check
      quotaMax: 5
    };

    const currentPatronLoans = loans.filter(l => l.matric === patronData.matric && l.status !== 'Returned');

    if (patronData.fines > 0) {
      setCheckoutError(`Checkout Blocked: You have an outstanding fine of ₦${patronData.fines}.00. Please clear fines at the Circulation Desk.`);
      sounds.playErrorBuzz();
      return;
    }

    if (currentPatronLoans.length >= patronData.quotaMax) {
      setCheckoutError(`Checkout Blocked: Maximum borrow limit of ${patronData.quotaMax} books reached.`);
      sounds.playErrorBuzz();
      return;
    }

    setActivePatron(patronData);
    setCheckoutStep(2);
    sounds.playSuccessChime();
  };

  // 2. Scan Book in Checkout
  const handleScanBookForCheckout = (e) => {
    if (e) e.preventDefault();
    setCheckoutError('');
    if (!bookBarcodeInput.trim()) {
      setCheckoutError('Please scan the book barcode or enter the barcode number.');
      return;
    }

    sounds.playScannerBeep();

    // Match book by ID, Barcode, or fallback
    const rawCode = bookBarcodeInput.trim().toUpperCase();
    const found = books.find(b =>
      b.id.toUpperCase() === rawCode ||
      `FCC-BC-${b.id}`.toUpperCase() === rawCode ||
      (b.isbn && b.isbn.replace(/[^0-9X]/gi, '') === rawCode.replace(/[^0-9X]/gi, ''))
    ) || books[0];

    if (!found) {
      setCheckoutError('Book barcode not recognized in institutional catalog.');
      sounds.playErrorBuzz();
      return;
    }

    if (found.copiesAvailable <= 0) {
      setCheckoutError(`All copies of "${found.title}" are currently on loan.`);
      sounds.playErrorBuzz();
      return;
    }

    setScannedBook(found);
    setCheckoutStep(3);
    sounds.playSuccessChime();
  };

  // 3. Confirm and Complete Checkout
  const handleConfirmCheckout = () => {
    if (!activePatron || !scannedBook) return;

    sounds.playSuccessChime();

    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 86400000); // 14 days standard
    const txId = `TX-CHK-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan = {
      id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
      bookId: scannedBook.id,
      bookTitle: scannedBook.title,
      matric: activePatron.matric,
      patronName: activePatron.name,
      loanDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      barcode: `FCC-BC-0928${Math.floor(1 + Math.random() * 9)}`,
      shelfLocation: scannedBook.shelfLocation || 'Floor 2 • West Stacks',
      status: 'Active',
      fine: 0,
      renewalsCount: 0
    };

    if (setLoans) {
      setLoans(prev => [newLoan, ...prev]);
    }

    // Decrement available copies in books
    if (setBooks) {
      setBooks(prev => prev.map(b => {
        if (b.id === scannedBook.id) {
          return {
            ...b,
            copiesAvailable: Math.max(0, (b.copiesAvailable !== undefined ? b.copiesAvailable : 3) - 1)
          };
        }
        return b;
      }));
    }

    setCheckoutReceipt({
      transactionId: txId,
      loanId: newLoan.id,
      patron: activePatron,
      book: scannedBook,
      loanDate: today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      barcode: newLoan.barcode,
      rfidStatus: 'Tag Deactivated (Safe Exit Through Turnstiles)',
      returnBin: 'Ground Floor Automated Book Drop or Circulation Desk'
    });

    setCheckoutStep(4);
  };

  // ==========================================
  // RETURN FLOW HANDLERS
  // ==========================================
  const handleScanBookForReturn = (e) => {
    if (e) e.preventDefault();
    setReturnError('');
    if (!returnBarcodeInput.trim()) {
      setReturnError('Please scan the book barcode or accession label.');
      return;
    }

    sounds.playScannerBeep();

    const raw = returnBarcodeInput.trim().toUpperCase();

    // Match loan
    const matchedLoan = loans.find(l =>
      l.status !== 'Returned' && (
        l.id.toUpperCase() === raw ||
        (l.barcode && l.barcode.toUpperCase() === raw) ||
        (l.bookId && l.bookId.toUpperCase() === raw) ||
        (l.bookTitle && l.bookTitle.toUpperCase().includes(raw))
      )
    ) || loans[0];

    if (!matchedLoan) {
      setReturnError('No active borrower loan record found for this item.');
      sounds.playErrorBuzz();
      return;
    }

    // Calculate overdue fine if applicable
    const today = new Date();
    const due = new Date(matchedLoan.dueDate);
    const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
    const fineAccrued = diffDays > 0 ? diffDays * 100 : 0;

    setMatchedLoanForReturn({
      ...matchedLoan,
      daysOverdue: Math.max(0, diffDays),
      calculatedFine: fineAccrued
    });

    setReturnStep(2);
    sounds.playSuccessChime();
  };

  // Complete return
  const handleExecuteReturn = () => {
    if (!matchedLoanForReturn) return;

    sounds.playSuccessChime();

    const today = new Date();
    const retId = `TX-RET-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update loan status
    if (setLoans) {
      setLoans(prev => prev.map(l => {
        if (l.id === matchedLoanForReturn.id) {
          return {
            ...l,
            status: 'Returned',
            returnDate: today.toISOString().split('T')[0]
          };
        }
        return l;
      }));
    }

    // Restore book availability count
    if (setBooks) {
      setBooks(prev => prev.map(b => {
        if (b.id === matchedLoanForReturn.bookId) {
          return {
            ...b,
            copiesAvailable: (b.copiesAvailable !== undefined ? b.copiesAvailable : 2) + 1
          };
        }
        return b;
      }));
    }

    setReturnReceipt({
      transactionId: retId,
      loanId: matchedLoanForReturn.id,
      patronName: matchedLoanForReturn.patronName,
      matric: matchedLoanForReturn.matric,
      bookTitle: matchedLoanForReturn.bookTitle,
      returnedAt: today.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      fineStatus: matchedLoanForReturn.calculatedFine > 0 ? `₦${matchedLoanForReturn.calculatedFine}.00 Overdue Fine Added to Account` : 'Zero Fines • Returned On Time',
      reshelvingBin: 'Bin 3 — Floor 2 West Stacks (Cooperative Economics)',
      rfidStatus: 'Tag Reactivated (Security Gate Active)'
    });

    setReturnStep(3);
  };

  const handleResetKiosk = () => {
    setCheckoutStep(1);
    setScannedBook(null);
    setCheckoutReceipt(null);
    setCheckoutError('');
    setReturnStep(1);
    setMatchedLoanForReturn(null);
    setReturnReceipt(null);
    setReturnError('');
  };

  return (
    <div className="min-h-screen bg-[#021810] text-emerald-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Kiosk Header Bar */}
      <header className="bg-[#032317] border-b border-emerald-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#021810] border border-emerald-500/40 p-1 flex items-center justify-center shadow-lg shadow-emerald-950 overflow-hidden shrink-0">
            <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>{INSTITUTION.shortName} Self-Service Circulation Station</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                KIOSK-04
              </span>
            </h1>
            <p className="text-[11px] text-emerald-400">
              Module 8 — Automated Touchscreen Self-Checkout & Book Return Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Station Switcher */}
          <div className="flex rounded-xl bg-[#021810] p-1 border border-emerald-800/80">
            <button
              onClick={() => {
                setStationMode('checkout');
                handleResetKiosk();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                stationMode === 'checkout'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Self-Checkout</span>
            </button>
            <button
              onClick={() => {
                setStationMode('return');
                handleResetKiosk();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                stationMode === 'return'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              <RotateCcw size={13} />
              <span>Self-Return</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              else navigateTo('/opac');
            }}
            className="p-2 rounded-xl bg-[#021810] hover:bg-emerald-950 text-slate-400 hover:text-white border border-emerald-800/80 transition"
            title="Exit Self-Service Kiosk"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {/* =======================================================
            SECTION A: SELF-CHECKOUT WORKFLOW
        ======================================================= */}
        {stationMode === 'checkout' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Step Progression Indicators */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
              {[
                { step: 1, label: '1. Scan Student QR' },
                { step: 2, label: '2. Scan Book Barcode' },
                { step: 3, label: '3. Security Validation' },
                { step: 4, label: '4. Digital Receipt' }
              ].map(s => {
                const isPassed = checkoutStep >= s.step;
                const isCurrent = checkoutStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-102'
                        : isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-[#021810] text-emerald-700 border-emerald-950'
                    }`}
                  >
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {checkoutError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-3 animate-shake">
                <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* STEP 1: SCAN PATRON CARD */}
            {checkoutStep === 1 && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl text-center space-y-6">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                    <User size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white">Present Student Library Card</h2>
                  <p className="text-xs text-emerald-300/80">
                    Hold your physical PVC Smart Card or Mobile App QR code in front of the scanner below.
                  </p>
                </div>

                {/* Animated Scanner Mockup */}
                <div className="relative w-64 h-48 mx-auto rounded-3xl bg-[#021810] border-2 border-emerald-500/60 p-4 flex flex-col items-center justify-center shadow-inner overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce" />
                  <QrCode size={80} className="text-emerald-500/60" />
                  <span className="text-[10px] font-mono text-emerald-400 mt-3 animate-pulse">
                    READY FOR OPTICAL / NFC WAVE
                  </span>
                </div>

                <form onSubmit={handleVerifyPatron} className="max-w-md mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={patronInput}
                      onChange={e => setPatronInput(e.target.value)}
                      placeholder="e.g. FCC/CEM/2024/042 or STU/2026/00125"
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#021810] border border-emerald-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 placeholder:text-emerald-700"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <span>Identify</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-emerald-400/80">
                    <span>Quick Patrons:</span>
                    <button
                      type="button"
                      onClick={() => { setPatronInput('FCC/CEM/2024/042'); }}
                      className="underline hover:text-white"
                    >
                      Wale Olonade (CEM)
                    </button>
                    •
                    <button
                      type="button"
                      onClick={() => { setPatronInput('FCC/CSC/2024/108'); }}
                      className="underline hover:text-white"
                    >
                      Chukwudi (CSC)
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: SCAN BOOK BARCODE */}
            {checkoutStep === 2 && activePatron && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl space-y-6">
                {/* Active Patron Banner */}
                <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      {activePatron.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{activePatron.name}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        {activePatron.matric} • {activePatron.libraryId}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-300">Account: Active</span>
                    <span className="text-emerald-400">Borrow Limit: 5 Books</span>
                  </div>
                </div>

                <div className="text-center max-w-md mx-auto space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                    <Barcode size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white">Scan Book Barcode</h2>
                  <p className="text-xs text-emerald-300/80">
                    Align the barcode on the back cover or inside title page over the laser beam.
                  </p>
                </div>

                <form onSubmit={handleScanBookForCheckout} className="max-w-md mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bookBarcodeInput}
                      onChange={e => setBookBarcodeInput(e.target.value)}
                      placeholder="e.g. FCC-BC-09281 or FCC-PDF-3779"
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#021810] border border-emerald-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 placeholder:text-emerald-700"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <span>Scan Item</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-emerald-400/80">
                    <span>Quick Scan Samples:</span>
                    {books.slice(0, 3).map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBookBarcodeInput(b.id)}
                        className="px-2 py-0.5 rounded bg-[#021810] hover:bg-emerald-950 border border-emerald-800 underline"
                      >
                        {b.title.substring(0, 18)}...
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3: SYSTEM VALIDATION & DEACTIVATION CONFIRMATION */}
            {checkoutStep === 3 && activePatron && scannedBook && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl space-y-6">
                <div className="text-center max-w-md mx-auto space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                    <ShieldCheck size={28} />
                  </div>
                  <h2 className="text-xl font-black text-white">Confirm Checkout Eligibility</h2>
                  <p className="text-xs text-emerald-300/80">
                    Item validated. Security desensitizer coil is primed for magnetic tag deactivation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Patron Details */}
                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Patron Scholar</div>
                    <div className="font-bold text-sm text-white">{activePatron.name}</div>
                    <div className="text-emerald-300 font-mono">{activePatron.matric} • {activePatron.libraryId}</div>
                    <div className="text-slate-400">{activePatron.dept}</div>
                  </div>

                  {/* Book Details */}
                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Circulation Item</div>
                    <div className="font-bold text-sm text-white">{scannedBook.title}</div>
                    <div className="text-emerald-300">By {scannedBook.author}</div>
                    <div className="text-slate-400 font-mono">Call: {scannedBook.callNumber || 'QA76.9 .FCC 2026'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">Loan Period: 14 Calendar Days</span>
                    <span className="text-emerald-300/80">Due date will be automatically set to 2 weeks from today.</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300">Renewable online</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800 text-xs"
                  >
                    Change Book
                  </button>
                  <button
                    onClick={handleConfirmCheckout}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg transition"
                  >
                    Deactivate RFID Tag & Complete Checkout →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DIGITAL RECEIPT */}
            {checkoutStep === 4 && checkoutReceipt && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl max-w-lg mx-auto space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-400 animate-pulse">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">Checkout Completed Successfully!</h2>
                  <p className="text-xs text-emerald-300 mt-1">
                    Book security tag has been deactivated. You may safely carry this item through the exit gate.
                  </p>
                </div>

                {/* Printable Digital Receipt Card */}
                <div className="p-6 rounded-2xl bg-white text-slate-950 text-left font-mono text-xs space-y-3 shadow-2xl border-2 border-slate-300">
                  <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-0.5">
                    <div className="font-bold text-sm">{INSTITUTION.name}</div>
                    <div className="text-[10px] text-slate-600">SMART INTEGRATED CIRCULATION DESK</div>
                    <div className="text-[9px] text-slate-500">TRANSACTION RECEIPT • {checkoutReceipt.transactionId}</div>
                  </div>

                  <div className="space-y-1 py-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Patron:</span>
                      <strong className="text-slate-900">{checkoutReceipt.patron.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Matric ID:</span>
                      <span>{checkoutReceipt.patron.matric}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Library Card:</span>
                      <span>{checkoutReceipt.patron.libraryId}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                    <div className="font-bold text-slate-900 truncate">{checkoutReceipt.book.title}</div>
                    <div className="text-[10px] text-slate-600">Barcode: {checkoutReceipt.barcode}</div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Issued On:</span>
                      <span>{checkoutReceipt.loanDate}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>RETURN DUE DATE:</span>
                      <span>{checkoutReceipt.dueDate}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-600 text-center">
                    <div>Return Location: {checkoutReceipt.returnBin}</div>
                    <div className="text-[9px] text-slate-500 mt-1">Thank you for utilizing the FCC Smart Library!</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Printer size={14} />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={handleResetKiosk}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg"
                  >
                    Done (Next Patron)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            SECTION B: SELF-RETURN WORKFLOW
        ======================================================= */}
        {stationMode === 'return' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Step Progression Indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              {[
                { step: 1, label: '1. Scan Book Barcode' },
                { step: 2, label: '2. Borrower Audit & Fines' },
                { step: 3, label: '3. Return Completed' }
              ].map(s => {
                const isPassed = returnStep >= s.step;
                const isCurrent = returnStep === s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-teal-600 text-white border-teal-400 shadow-lg scale-102'
                        : isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-[#021810] text-emerald-700 border-emerald-950'
                    }`}
                  >
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {returnError && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-3 animate-shake">
                <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            {/* STEP 1: SCAN BOOK FOR RETURN */}
            {returnStep === 1 && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl text-center space-y-6">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center border border-teal-500/40">
                    <RotateCcw size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white">Place Book on Scanner Chute</h2>
                  <p className="text-xs text-emerald-300/80">
                    The smart scanner will read the spine barcode, look up the loan record, and identify the borrower.
                  </p>
                </div>

                <form onSubmit={handleScanBookForReturn} className="max-w-md mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={returnBarcodeInput}
                      onChange={e => setReturnBarcodeInput(e.target.value)}
                      placeholder="e.g. FCC-BC-09281 or FCC-B001"
                      className="flex-1 px-4 py-3 rounded-2xl bg-[#021810] border border-emerald-800 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 placeholder:text-emerald-700"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <span>Identify Book</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-emerald-400/80">
                    <span>Active Borrowed Items:</span>
                    {loans.filter(l => l.status !== 'Returned').slice(0, 3).map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setReturnBarcodeInput(l.barcode || l.id)}
                        className="px-2 py-0.5 rounded bg-[#021810] hover:bg-emerald-950 border border-emerald-800 underline"
                      >
                        {l.bookTitle.substring(0, 18)}...
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: BORROWER AUDIT & RETURN EXECUTION */}
            {returnStep === 2 && matchedLoanForReturn && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl space-y-6">
                <div className="text-center max-w-md mx-auto space-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center border border-teal-500/40">
                    <CheckCircle2 size={28} />
                  </div>
                  <h2 className="text-xl font-black text-white">Item & Borrower Identified</h2>
                  <p className="text-xs text-emerald-300/80">
                    Confirm return details. RFID security tag will be reactivated on check-in.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Borrower Account</div>
                    <div className="font-bold text-sm text-white">{matchedLoanForReturn.patronName}</div>
                    <div className="text-emerald-300 font-mono">{matchedLoanForReturn.matric}</div>
                    <div className="text-slate-400">Loan ID: {matchedLoanForReturn.id}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2">
                    <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Returned Item</div>
                    <div className="font-bold text-sm text-white">{matchedLoanForReturn.bookTitle}</div>
                    <div className="text-slate-400 font-mono">Barcode: {matchedLoanForReturn.barcode}</div>
                    <div className="text-slate-400">Due Date: {matchedLoanForReturn.dueDate}</div>
                  </div>
                </div>

                {/* Overdue / Fine Status */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                  matchedLoanForReturn.calculatedFine > 0
                    ? 'bg-rose-950/60 border-rose-700/60 text-rose-200'
                    : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                }`}>
                  <div>
                    <span className="font-bold block">
                      {matchedLoanForReturn.calculatedFine > 0 ? 'Item Returned Overdue' : 'Clean Return • On Time'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {matchedLoanForReturn.calculatedFine > 0
                        ? `${matchedLoanForReturn.daysOverdue} days past due date (₦100/day)`
                        : 'Returned within loan validity period. No penalties.'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {matchedLoanForReturn.calculatedFine > 0 ? `₦${matchedLoanForReturn.calculatedFine}.00 Fine` : '₦0.00 Fine'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setReturnStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-[#021810] text-emerald-300 hover:text-white border border-emerald-800 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteReturn}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg transition"
                  >
                    Confirm Return & Reactivate Security Tag →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RETURN RECEIPT */}
            {returnStep === 3 && returnReceipt && (
              <div className="p-8 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl max-w-lg mx-auto space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center border-2 border-teal-400 animate-pulse">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">Item Successfully Returned!</h2>
                  <p className="text-xs text-emerald-300 mt-1">
                    Book has been cleared from your account and the RFID coil reactivated.
                  </p>
                </div>

                {/* Printable Digital Return Receipt */}
                <div className="p-6 rounded-2xl bg-white text-slate-950 text-left font-mono text-xs space-y-3 shadow-2xl border-2 border-slate-300">
                  <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-0.5">
                    <div className="font-bold text-sm">{INSTITUTION.name}</div>
                    <div className="text-[10px] text-slate-600">SELF-SERVICE CIRCULATION RETURN DESK</div>
                    <div className="text-[9px] text-slate-500">RETURN CLEARANCE RECEIPT • {returnReceipt.transactionId}</div>
                  </div>

                  <div className="space-y-1 py-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Patron:</span>
                      <strong className="text-slate-900">{returnReceipt.patronName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Matric:</span>
                      <span>{returnReceipt.matric}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Returned At:</span>
                      <span>{returnReceipt.returnedAt}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                    <div className="font-bold text-slate-900 truncate">{returnReceipt.bookTitle}</div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Fine Status:</span>
                      <strong className="text-emerald-800">{returnReceipt.fineStatus}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Re-Shelving:</span>
                      <span className="text-slate-900">{returnReceipt.reshelvingBin}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Printer size={14} />
                    <span>Print Return Receipt</span>
                  </button>
                  <button
                    onClick={handleResetKiosk}
                    className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg"
                  >
                    Done (Return Next Item)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
