import React, { useState, useMemo } from 'react';
import {
  Scan, Search, User, BookOpen, Calendar, CheckCircle, AlertTriangle,
  RefreshCw, X, Plus, ArrowRight, Clock, Fingerprint, Hash,
  ChevronDown, Filter, Download, Printer, XCircle, Shield
} from 'lucide-react';
import { PATRON_POLICIES, INITIAL_PATRONS } from '../data/institutionalSeedData';

// =========================================================================
// LIBRARY BORROWING SYSTEM
// Issue/Borrow, Return, Renewal
// Renewal blocked when: reservation exists, max renewals, user restricted, overdue beyond period
// =========================================================================

const MAX_RENEWAL_DAYS_OVERDUE = 7; // Block renewal if overdue more than this

function StatusBadge({ status }) {
  const cfg = {
    Active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Overdue: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    Returned: 'bg-slate-700 text-slate-400 border-slate-600',
    Reserved: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg[status] || cfg.Active}`}>
      {status}
    </span>
  );
}

export default function LibraryBorrowingSystem({
  books = [],
  setBooks,
  loans = [],
  setLoans,
  reservations = [],
  patrons = INITIAL_PATRONS,
  user,
}) {
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' | 'return' | 'renew' | 'history'
  const [searchPatron, setSearchPatron] = useState('');
  const [searchBook, setSearchBook] = useState('');
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [actionStatus, setActionStatus] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchLoan, setSearchLoan] = useState('');
  const [confirmBiometric, setConfirmBiometric] = useState(false);

  // Derived
  const activeLoans = useMemo(() => loans.filter(l => l.status !== 'Returned'), [loans]);
  const overdueLoans = useMemo(() => loans.filter(l => l.status === 'Overdue'), [loans]);

  const filteredPatrons = useMemo(() =>
    patrons.filter(p =>
      !searchPatron ||
      p.name?.toLowerCase().includes(searchPatron.toLowerCase()) ||
      p.matric?.toLowerCase().includes(searchPatron.toLowerCase()) ||
      p.libraryId?.toLowerCase().includes(searchPatron.toLowerCase())
    ), [patrons, searchPatron]);

  const filteredBooks = useMemo(() =>
    books.filter(b =>
      !searchBook ||
      b.title?.toLowerCase().includes(searchBook.toLowerCase()) ||
      b.isbn?.includes(searchBook) ||
      b.id?.toLowerCase().includes(searchBook.toLowerCase()) ||
      b.callNumber?.toLowerCase().includes(searchBook.toLowerCase())
    ), [books, searchBook]);

  const displayedLoans = useMemo(() => {
    return loans.filter(l => {
      const matchStatus = filterStatus === 'All' || l.status === filterStatus;
      const q = searchLoan.toLowerCase();
      const matchQuery = !q ||
        l.bookTitle?.toLowerCase().includes(q) ||
        l.matric?.toLowerCase().includes(q) ||
        l.patronName?.toLowerCase().includes(q) ||
        l.id?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [loans, filterStatus, searchLoan]);

  // Check renewal eligibility
  const checkRenewalEligibility = (loan) => {
    const issues = [];
    const policy = PATRON_POLICIES.student;

    // Block if max renewals reached
    if ((loan.renewalsCount || 0) >= policy.renewalsAllowed) {
      issues.push(`Maximum renewal limit (${policy.renewalsAllowed}) reached.`);
    }
    // Block if another user has reserved the resource
    const hasReservation = reservations.some(
      r => r.bookId === loan.bookId &&
           r.matric !== loan.matric &&
           ['Pending', 'Approved'].includes(r.status)
    );
    if (hasReservation) {
      issues.push('Another patron has an active reservation for this resource.');
    }
    // Block if overdue beyond allowed period
    const daysOverdue = Math.ceil((new Date() - new Date(loan.dueDate)) / 86400000);
    if (daysOverdue > MAX_RENEWAL_DAYS_OVERDUE) {
      issues.push(`Overdue by ${daysOverdue} days — exceeds the ${MAX_RENEWAL_DAYS_OVERDUE}-day renewal grace period.`);
    }
    // Block if patron has restrictions
    const patron = patrons.find(p => p.matric === loan.matric);
    if (patron && patron.status !== 'Active') {
      issues.push('Patron account has restrictions. Contact admin.');
    }

    return { eligible: issues.length === 0, issues };
  };

  // Issue Loan
  const handleIssueLoan = () => {
    if (!selectedPatron || !selectedBook) {
      setActionStatus({ type: 'error', message: 'Select both patron and resource to issue a loan.' });
      return;
    }
    if (selectedBook.copiesAvailable <= 0) {
      setActionStatus({ type: 'error', message: `No copies available for "${selectedBook.title}".` });
      return;
    }
    const policy = PATRON_POLICIES[selectedPatron.role] || PATRON_POLICIES.student;
    const patronLoans = loans.filter(l => l.matric === selectedPatron.matric && l.status === 'Active');
    if (patronLoans.length >= policy.maxLoans) {
      setActionStatus({ type: 'error', message: `Patron has reached maximum loan limit (${policy.maxLoans}).` });
      return;
    }

    const newLoan = {
      id: `LN-${Date.now().toString().slice(-6)}`,
      matric: selectedPatron.matric,
      patronName: selectedPatron.name,
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      author: selectedBook.author,
      callNumber: selectedBook.callNumber,
      barcode: `FCC-CP-${Math.floor(10000 + Math.random() * 90000)}`,
      borrowDate: new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Active',
      fine: 0,
      renewalsCount: 0,
      branch: selectedBook.branch,
      issuedBy: user?.name || 'Librarian',
    };

    setLoans([newLoan, ...loans]);
    setBooks(books.map(b => b.id === selectedBook.id
      ? { ...b, copiesAvailable: b.copiesAvailable - 1 }
      : b
    ));
    setActionStatus({
      type: 'success',
      message: `Successfully issued "${selectedBook.title}" to ${selectedPatron.name}. Due: ${dueDate}.`,
    });
    setSelectedPatron(null);
    setSelectedBook(null);
    setSearchPatron('');
    setSearchBook('');
    setConfirmBiometric(false);
  };

  // Return Loan
  const handleReturnLoan = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const today = new Date();
    const due = new Date(loan.dueDate);
    const daysOverdue = Math.ceil((today - due) / 86400000);
    const policy = PATRON_POLICIES.student;
    const fine = daysOverdue > 0 ? daysOverdue * policy.finePerDay : 0;

    setLoans(loans.map(l => l.id === loanId ? {
      ...l,
      status: 'Returned',
      returnDate: today.toISOString().split('T')[0],
      fine: fine > 0 ? fine : (l.fine || 0),
    } : l));

    setBooks(books.map(b => b.id === loan.bookId
      ? { ...b, copiesAvailable: b.copiesAvailable + 1 }
      : b
    ));

    setActionStatus({
      type: 'success',
      message: `Returned "${loan.bookTitle}". ${fine > 0 ? `Fine accrued: ₦${fine.toLocaleString()}.` : 'No fines.'}`,
    });
  };

  // Renew Loan
  const handleRenewLoan = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const check = checkRenewalEligibility(loan);
    if (!check.eligible) {
      setActionStatus({ type: 'error', message: check.issues.join(' | ') });
      return;
    }

    const newDue = new Date(loan.dueDate);
    newDue.setDate(newDue.getDate() + 14);
    setLoans(loans.map(l => l.id === loanId ? {
      ...l,
      dueDate: newDue.toISOString().split('T')[0],
      renewalsCount: (l.renewalsCount || 0) + 1,
      status: 'Active',
    } : l));
    setActionStatus({ type: 'success', message: `Loan "${loan.bookTitle}" renewed. New due date: ${newDue.toISOString().split('T')[0]}.` });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Library Borrowing System</h2>
          <p className="text-slate-400 text-sm mt-0.5">Issue, Return and Renewal management</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {activeLoans.length} Active Loans
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {overdueLoans.length} Overdue
          </span>
        </div>
      </div>

      {/* Status Alert */}
      {actionStatus && (
        <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm ${
          actionStatus.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-start gap-2">
            {actionStatus.type === 'success'
              ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
              : <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            }
            <span>{actionStatus.message}</span>
          </div>
          <button onClick={() => setActionStatus(null)} className="p-0.5 hover:opacity-70">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'issue', label: 'Issue / Borrow', icon: Plus },
          { id: 'return', label: 'Return', icon: ArrowRight },
          { id: 'renew', label: 'Renewal', icon: RefreshCw },
          { id: 'history', label: 'All Loans', icon: BookOpen },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── ISSUE TAB ── */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Patron */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <User size={16} className="text-indigo-400" /> Step 1: Search Member
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchPatron}
                onChange={e => setSearchPatron(e.target.value)}
                placeholder="Search by name, matric or library ID..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredPatrons.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatron(p)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedPatron?.id === p.id
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-800 border-slate-700 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.matric}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                        p.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>{p.status}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.activeLoansCount}/{PATRON_POLICIES[p.role]?.maxLoans || 5} loans</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedPatron && (
              <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-xs space-y-1">
                <p className="font-bold text-indigo-300">Selected: {selectedPatron.name}</p>
                <p className="text-slate-400">{selectedPatron.dept || selectedPatron.department} • {selectedPatron.level}</p>
              </div>
            )}
          </div>

          {/* Search Resource */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" /> Step 2: Search Resource
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                placeholder="Search by title, ISBN, barcode or call number..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredBooks.slice(0, 8).map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBook(b)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedBook?.id === b.id
                      ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                      <p className="text-xs text-slate-400">{b.author}</p>
                      <p className="text-xs font-mono text-indigo-400">{b.callNumber}</p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold block ${
                        b.copiesAvailable > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {b.copiesAvailable > 0 ? `${b.copiesAvailable} avail.` : 'None'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedBook && (
              <div className="p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-xs space-y-1">
                <p className="font-bold text-emerald-300">Selected: {selectedBook.title}</p>
                <p className="text-slate-400">{selectedBook.callNumber} • {selectedBook.copiesAvailable} copies available</p>
              </div>
            )}
          </div>

          {/* Issue Form */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" /> Step 3: Set Due Date &amp; Issue
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end gap-2">
                {['7', '14', '30', '60'].map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      const dt = new Date();
                      dt.setDate(dt.getDate() + parseInt(d));
                      setDueDate(dt.toISOString().split('T')[0]);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-indigo-300 transition"
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedPatron && selectedBook && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Patron: </span><span className="text-white font-semibold">{selectedPatron.name}</span></div>
                <div><span className="text-slate-400">Matric: </span><span className="font-mono text-indigo-400">{selectedPatron.matric}</span></div>
                <div><span className="text-slate-400">Resource: </span><span className="text-white font-semibold">{selectedBook.title}</span></div>
                <div><span className="text-slate-400">Due Date: </span><span className="font-mono text-emerald-400">{dueDate}</span></div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmBiometric}
                  onChange={e => setConfirmBiometric(e.target.checked)}
                  className="rounded"
                />
                <Fingerprint size={14} className="text-indigo-400" />
                Biometric identity verified
              </label>
              <button
                onClick={handleIssueLoan}
                disabled={!selectedPatron || !selectedBook || !confirmBiometric}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 shadow-md transition"
              >
                <Scan size={16} />
                Issue Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RETURN TAB ── */}
      {activeTab === 'return' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchLoan}
                onChange={e => setSearchLoan(e.target.value)}
                placeholder="Search by patron, book title, or loan ID..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            {loans.filter(l => l.status !== 'Returned' && (!searchLoan || l.bookTitle?.toLowerCase().includes(searchLoan.toLowerCase()) || l.matric?.toLowerCase().includes(searchLoan.toLowerCase()) || l.id?.toLowerCase().includes(searchLoan.toLowerCase()))).map(loan => {
              const today = new Date();
              const daysOverdue = Math.ceil((today - new Date(loan.dueDate)) / 86400000);
              const isOverdue = daysOverdue > 0;
              const fine = isOverdue ? daysOverdue * (PATRON_POLICIES.student.finePerDay) : 0;

              return (
                <div key={loan.id} className={`p-4 rounded-xl border ${isOverdue ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-indigo-400">{loan.id}</span>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="font-semibold text-white">{loan.bookTitle}</p>
                      <p className="text-xs text-slate-400">{loan.patronName} • {loan.matric}</p>
                      <div className="flex flex-wrap gap-3 text-xs mt-1">
                        <span className="text-slate-400">Due: <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-white'}>{loan.dueDate}</span></span>
                        {isOverdue && (
                          <span className="text-rose-400 font-semibold">{daysOverdue} days overdue • Fine: ₦{fine.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReturnLoan(loan.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition"
                    >
                      <CheckCircle size={15} /> Record Return
                    </button>
                  </div>
                </div>
              );
            })}
            {loans.filter(l => l.status !== 'Returned').length === 0 && (
              <div className="text-center py-12 text-slate-500">No active loans to return.</div>
            )}
          </div>
        </div>
      )}

      {/* ── RENEW TAB ── */}
      {activeTab === 'renew' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <p className="font-bold">Renewal Restrictions:</p>
            <ul className="space-y-0.5 list-disc list-inside text-amber-400/80">
              <li>Cannot renew if another patron has an active reservation</li>
              <li>Maximum {PATRON_POLICIES.student.renewalsAllowed} renewals per loan</li>
              <li>Cannot renew if overdue by more than {MAX_RENEWAL_DAYS_OVERDUE} days</li>
              <li>Cannot renew if patron account has restrictions</li>
            </ul>
          </div>
          <div className="space-y-2">
            {loans.filter(l => l.status !== 'Returned').map(loan => {
              const check = checkRenewalEligibility(loan);
              return (
                <div key={loan.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-indigo-400">{loan.id}</span>
                        <StatusBadge status={loan.status} />
                        <span className="text-[10px] text-slate-500">{loan.renewalsCount || 0}/{PATRON_POLICIES.student.renewalsAllowed} renewals used</span>
                      </div>
                      <p className="font-semibold text-white">{loan.bookTitle}</p>
                      <p className="text-xs text-slate-400">{loan.patronName} • Due: {loan.dueDate}</p>
                      {!check.eligible && (
                        <div className="mt-1 space-y-0.5">
                          {check.issues.map((issue, i) => (
                            <p key={i} className="text-xs text-rose-400 flex items-center gap-1">
                              <Shield size={11} /> {issue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRenewLoan(loan.id)}
                      disabled={!check.eligible}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 transition"
                    >
                      <RefreshCw size={15} /> Renew +14 Days
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchLoan}
                onChange={e => setSearchLoan(e.target.value)}
                placeholder="Search loans..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1.5">
              {['All', 'Active', 'Overdue', 'Returned'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr className="text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 text-left">Loan ID</th>
                  <th className="py-3 px-4 text-left">Patron</th>
                  <th className="py-3 px-4 text-left">Resource</th>
                  <th className="py-3 px-4 text-left">Issue Date</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Fine</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-indigo-400">{loan.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{loan.patronName}</div>
                      <div className="text-[10px] text-slate-500">{loan.matric}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="font-semibold text-slate-200 truncate">{loan.bookTitle}</div>
                      <div className="text-[10px] text-slate-500">{loan.callNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{loan.borrowDate || loan.issueDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{loan.dueDate}</td>
                    <td className="py-3 px-4"><StatusBadge status={loan.status} /></td>
                    <td className="py-3 px-4">
                      {(loan.fine || 0) > 0
                        ? <span className="text-rose-400 font-semibold">₦{(loan.fine || 0).toLocaleString()}</span>
                        : <span className="text-slate-600">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {loan.status !== 'Returned' && (
                          <>
                            <button onClick={() => handleRenewLoan(loan.id)} className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] border border-indigo-500/30">Renew</button>
                            <button onClick={() => handleReturnLoan(loan.id)} className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] border border-emerald-500/30">Return</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayedLoans.length === 0 && (
              <div className="text-center py-12 text-slate-500">No records found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
