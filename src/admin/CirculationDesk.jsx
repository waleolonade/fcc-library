import React, { useState } from 'react';
import { RefreshCw, Scan, CheckCircle, AlertTriangle, UserCheck, ArrowRight, BookDown, BookUp, ShieldAlert, Sparkles, Fingerprint } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import BiometricScannerModal from '../common/BiometricScannerModal';

export default function CirculationDesk({ books, setBooks, loans, setLoans }) {
  const [mode, setMode] = useState('checkout'); // 'checkout' | 'checkin'
  const [matricInput, setMatricInput] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null);

  // Quick 1-click test items
  const testMatrics = ['FCC/CEM/2024/042', 'FCC/CSC/2024/108', 'FCC/BNF/2024/015'];
  const testBarcodes = ['FCC-B001', 'FCC-B002', 'FCC-B003', 'FCC-B004', 'FCC-B005'];

  const handleCheckout = (e) => {
    e.preventDefault();
    sounds.playScannerBeep();

    const barcodeTrimmed = itemInput.trim().toUpperCase();
    const matricTrimmed = matricInput.trim().toUpperCase();

    const book = books.find(b => b.id === barcodeTrimmed || b.isbn === barcodeTrimmed || b.callNumber.toUpperCase().includes(barcodeTrimmed));
    if (!book) {
      sounds.playErrorBuzz();
      setStatusMsg({ type: 'error', text: `Catalog accession or ISBN "${itemInput}" not found in holdings.` });
      return;
    }

    if (book.copiesAvailable <= 0) {
      sounds.playErrorBuzz();
      setStatusMsg({ type: 'error', text: `Holdings exhausted: All physical copies of "${book.title}" are currently checked out.` });
      return;
    }

    // Trigger biometric optical confirmation
    setPendingCheckoutData({ book, matricTrimmed });
    setShowBiometricModal(true);
  };

  const confirmBiometricCheckout = () => {
    if (!pendingCheckoutData) return;
    const { book, matricTrimmed } = pendingCheckoutData;

    setBooks(books.map(b => b.id === book.id ? { ...b, copiesAvailable: b.copiesAvailable - 1 } : b));
    const newLoan = {
      id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
      matric: matricTrimmed,
      patronName: matricTrimmed.includes('CEM') ? "Ibrahim Adekunle" : matricTrimmed.includes('CSC') ? "Chukwudi Okafor" : "Patron Scholar",
      bookId: book.id,
      barcode: `FCC-CP-${Math.floor(10000 + Math.random() * 90000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      fine: 0,
      renewalsCount: 0
    };

    setLoans([newLoan, ...loans]);
    sounds.playSuccessChime();
    setStatusMsg({ type: 'success', text: `Biometrics Verified & Issued: Checked out "${book.title}" to ${matricTrimmed}. Due date: ${newLoan.dueDate}` });
    setItemInput('');
    setShowBiometricModal(false);
    setPendingCheckoutData(null);
  };

  const handleCheckin = (e) => {
    e.preventDefault();
    sounds.playScannerBeep();

    const barcodeTrimmed = itemInput.trim().toUpperCase();
    const loanIndex = loans.findIndex(l => (l.bookId === barcodeTrimmed || l.barcode === barcodeTrimmed || l.id === barcodeTrimmed) && l.status !== 'Returned');

    if (loanIndex === -1) {
      sounds.playErrorBuzz();
      setStatusMsg({ type: 'error', text: `No active circulation record found for item ref "${itemInput}".` });
      return;
    }

    const loan = loans[loanIndex];
    const book = books.find(b => b.id === loan.bookId);

    // Return book & increment copies
    if (book) {
      setBooks(books.map(b => b.id === book.id ? { ...b, copiesAvailable: b.copiesAvailable + 1 } : b));
    }

    const updatedLoans = [...loans];
    updatedLoans[loanIndex] = {
      ...loan,
      status: 'Returned',
      returnDate: new Date().toISOString().split('T')[0]
    };
    setLoans(updatedLoans);

    sounds.playSuccessChime();
    setStatusMsg({ type: 'success', text: `Check-in Complete: Returned copy of "${book ? book.title : loan.bookId}" from ${loan.matric}.` });
    setItemInput('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-indigo-400" />
          High-Velocity Circulation Engine with Biometric Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Rapid Barcode / RFID Circulation Desk
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Process student borrowings, return check-ins, barcode scans, and circulation overrides with zero latency.
        </p>
      </div>

      {/* Mode Switcher Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circulation Terminal Form */}
        <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => { setMode('checkout'); setStatusMsg(null); }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'checkout' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookDown size={14} /> Rapid Issue (Check-Out)
            </button>
            <button
              onClick={() => { setMode('checkin'); setStatusMsg(null); }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'checkin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookUp size={14} /> Item Return (Check-In)
            </button>
          </div>

          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle size={16} className="shrink-0 text-emerald-400" /> : <AlertTriangle size={16} className="shrink-0 text-rose-400" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={mode === 'checkout' ? handleCheckout : handleCheckin} className="space-y-3.5">
            {mode === 'checkout' && (
              <div>
                <label className="block text-[11px] text-slate-300 uppercase font-bold tracking-wider mb-1">
                  Patron College Matric Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. FCC/CEM/2024/042"
                    value={matricInput}
                    onChange={(e) => setMatricInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-mono">PATRON</span>
                </div>
                {/* 1-click test matric */}
                <div className="flex gap-1.5 pt-1.5">
                  {testMatrics.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMatricInput(m)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                    >
                      {m.split('/')[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold tracking-wider mb-1">
                {mode === 'checkout' ? 'Catalog ID, ISBN, or Barcode' : 'Scanned Barcode / Loan ID'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. FCC-B001 or 978-978-49021-1-4"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Scan size={15} className="absolute right-3 top-2.5 text-indigo-400" />
              </div>
              {/* 1-click test barcode */}
              <div className="flex gap-1.5 pt-1.5">
                {testBarcodes.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setItemInput(b)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                mode === 'checkout'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              {mode === 'checkout' ? (
                <>
                  <Fingerprint size={15} /> Scan & Biometrically Authorize Loan
                </>
              ) : (
                <>
                  <BookUp size={15} /> Process Item Check-In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Circulation Ledger */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Campus Circulation Ledger
            </h3>
            <span className="text-xs font-mono text-indigo-400 font-bold">{loans.length} Total Records</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {loans.map(loan => {
              const book = books.find(b => b.id === loan.bookId);
              const isOverdue = loan.status === 'Overdue';

              return (
                <div
                  key={loan.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                    isOverdue
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : loan.status === 'Returned'
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{loan.matric}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {loan.id}
                      </span>
                    </div>
                    <div className="text-white font-semibold text-xs">{book ? book.title : loan.bookId}</div>
                    <div className="text-[11px] text-slate-400">
                      Issued: {loan.issueDate} • Due: {loan.dueDate} {loan.fine > 0 && <span className="text-rose-400 font-bold">(Fine: ₦{loan.fine})</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      isOverdue
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : loan.status === 'Returned'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Biometric Confirmation Modal */}
      {showBiometricModal && (
        <BiometricScannerModal
          patron={{ matric: pendingCheckoutData?.matricTrimmed }}
          purpose="Circulation Loan Authorization"
          onClose={() => {
            setShowBiometricModal(false);
            setPendingCheckoutData(null);
          }}
          onVerified={confirmBiometricCheckout}
        />
      )}
    </div>
  );
}
