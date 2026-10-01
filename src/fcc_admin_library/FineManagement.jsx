import React, { useState, useMemo } from 'react';
import {
  DollarSign, Search, Filter, CheckCircle, AlertTriangle, X,
  Clock, User, BookOpen, Calendar, Download, Printer, ChevronDown,
  TrendingUp, PieChart, FileText, Edit2, XCircle
} from 'lucide-react';
import { PATRON_POLICIES } from '../data/institutionalSeedData';

// =========================================================================
// FINE MANAGEMENT SYSTEM
// Auto-calculate, store member/loan/resource/dates/amount/status
// Statuses: Unpaid, Partially Paid, Paid, Waived
// Librarian: record payment, waive, view history, generate reports
// =========================================================================

const FINE_STATUSES = ['Unpaid', 'Partially Paid', 'Paid', 'Waived'];

function StatusBadge({ status }) {
  const cfg = {
    Unpaid: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'Partially Paid': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Waived: 'bg-slate-600 text-slate-300 border-slate-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg[status] || cfg.Unpaid}`}>
      {status}
    </span>
  );
}

function PaymentModal({ fine, onClose, onRecord }) {
  const [amount, setAmount] = useState(fine.fineAmount - fine.amountPaid);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecord(fine.id, parseFloat(amount), note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white">Record Fine Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1 text-xs">
          <p className="font-semibold text-white">{fine.bookTitle}</p>
          <p className="text-slate-400">Patron: {fine.patronName} ({fine.matric})</p>
          <div className="flex gap-4 mt-1.5">
            <span className="text-rose-400">Total: ₦{fine.fineAmount.toLocaleString()}</span>
            <span className="text-emerald-400">Paid: ₦{fine.amountPaid.toLocaleString()}</span>
            <span className="text-white font-bold">Outstanding: ₦{(fine.fineAmount - fine.amountPaid).toLocaleString()}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              max={fine.fineAmount - fine.amountPaid}
              step="50"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Paid at circulation desk — Receipt #4422"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle size={15} /> Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WaiveModal({ fine, onClose, onWaive }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white">Waive Fine</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <p>Waiving this fine will cancel the outstanding balance of ₦{(fine.fineAmount - fine.amountPaid).toLocaleString()} for <strong>{fine.patronName}</strong>.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Waiver *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Compassionate grounds — medical emergency confirmed by welfare office"
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white resize-none focus:outline-none focus:border-amber-500"
            required
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm">
            Cancel
          </button>
          <button
            onClick={() => { if (reason) { onWaive(fine.id, reason); onClose(); } }}
            disabled={!reason}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-sm"
          >
            Confirm Waiver
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FineManagement({
  loans = [],
  books = [],
  fines: propFines = [],
  setFines,
  patrons = [],
}) {
  const [fines, setLocalFines] = useState(propFines);
  const [activeTab, setActiveTab] = useState('overview'); // overview | records | history | report
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [paymentModal, setPaymentModal] = useState(null);
  const [waiveModal, setWaiveModal] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const updateFines = (updated) => {
    setLocalFines(updated);
    if (setFines) setFines(updated);
  };

  // Auto-calculate fines from overdue loans
  const autoCalculatedFines = useMemo(() => {
    const today = new Date();
    return loans
      .filter(l => l.status !== 'Returned')
      .map(l => {
        const daysOverdue = Math.ceil((today - new Date(l.dueDate)) / 86400000);
        if (daysOverdue <= 0) return null;
        const finePerDay = PATRON_POLICIES.student.finePerDay;
        return {
          id: `AUTO-${l.id}`,
          matric: l.matric,
          patronName: l.patronName,
          loanId: l.id,
          bookId: l.bookId,
          bookTitle: l.bookTitle,
          dueDate: l.dueDate,
          returnDate: null,
          daysOverdue,
          finePerDay,
          fineAmount: daysOverdue * finePerDay,
          amountPaid: 0,
          status: 'Unpaid',
          notes: 'Auto-calculated from overdue loan',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
      .filter(Boolean);
  }, [loans]);

  // Merge stored fines with auto-calculated
  const allFines = useMemo(() => {
    const storedIds = new Set(fines.map(f => f.loanId));
    const newAuto = autoCalculatedFines.filter(f => !storedIds.has(f.loanId.replace('AUTO-', '')));
    return [...fines, ...newAuto];
  }, [fines, autoCalculatedFines]);

  const filteredFines = useMemo(() => {
    return allFines.filter(f => {
      const matchStatus = filterStatus === 'All' || f.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        f.patronName?.toLowerCase().includes(q) ||
        f.matric?.toLowerCase().includes(q) ||
        f.bookTitle?.toLowerCase().includes(q) ||
        f.loanId?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [allFines, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    totalFines: allFines.reduce((s, f) => s + f.fineAmount, 0),
    totalCollected: allFines.reduce((s, f) => s + f.amountPaid, 0),
    totalOutstanding: allFines.filter(f => !['Paid','Waived'].includes(f.status))
      .reduce((s, f) => s + (f.fineAmount - f.amountPaid), 0),
    totalWaived: allFines.filter(f => f.status === 'Waived').reduce((s, f) => s + (f.fineAmount - f.amountPaid), 0),
    unpaidCount: allFines.filter(f => f.status === 'Unpaid').length,
    partialCount: allFines.filter(f => f.status === 'Partially Paid').length,
  }), [allFines]);

  const handleRecordPayment = (fineId, amount, note) => {
    const updated = allFines.map(f => {
      if (f.id !== fineId) return f;
      const newPaid = f.amountPaid + amount;
      const newStatus = newPaid >= f.fineAmount ? 'Paid' : 'Partially Paid';
      return {
        ...f,
        amountPaid: newPaid,
        status: newStatus,
        notes: note ? `${f.notes || ''}; Payment: ${note}` : f.notes,
        updatedAt: new Date().toISOString(),
      };
    });
    updateFines(updated.filter(f => !f.id?.startsWith('AUTO-')));
    setActionStatus({ type: 'success', message: `Payment of ₦${amount.toLocaleString()} recorded successfully.` });
  };

  const handleWaiveFine = (fineId, reason) => {
    const updated = allFines.map(f =>
      f.id === fineId ? {
        ...f,
        status: 'Waived',
        notes: `Waived: ${reason}`,
        updatedAt: new Date().toISOString(),
      } : f
    );
    updateFines(updated.filter(f => !f.id?.startsWith('AUTO-')));
    setActionStatus({ type: 'success', message: 'Fine waived successfully.' });
  };

  const generateCSVReport = () => {
    const headers = ['Fine ID','Patron','Matric','Book','Due Date','Days Overdue','Total Fine','Amount Paid','Outstanding','Status'];
    const rows = allFines.map(f => [
      f.id, f.patronName, f.matric, `"${f.bookTitle}"`, f.dueDate,
      f.daysOverdue, f.fineAmount, f.amountPaid, f.fineAmount - f.amountPaid, f.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FCC_Fines_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Fine Management</h2>
          <p className="text-slate-400 text-sm mt-0.5">Auto-calculate, record payments, waive and report</p>
        </div>
        <button onClick={generateCSVReport} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-2 border border-slate-700 transition">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Action Status */}
      {actionStatus && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
          actionStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span className="flex items-center gap-2"><CheckCircle size={15} />{actionStatus.message}</span>
          <button onClick={() => setActionStatus(null)}><X size={15} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Fines', value: `₦${stats.totalFines.toLocaleString()}`, color: 'rose' },
          { label: 'Collected', value: `₦${stats.totalCollected.toLocaleString()}`, color: 'emerald' },
          { label: 'Outstanding', value: `₦${stats.totalOutstanding.toLocaleString()}`, color: 'amber' },
          { label: 'Waived', value: `₦${stats.totalWaived.toLocaleString()}`, color: 'slate' },
          { label: 'Unpaid', value: stats.unpaidCount, color: 'rose' },
          { label: 'Partial', value: stats.partialCount, color: 'amber' },
        ].map(s => {
          const colorMap = { rose: 'text-rose-400', emerald: 'text-emerald-400', amber: 'text-amber-400', slate: 'text-slate-400' };
          return (
            <div key={s.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className={`text-lg font-extrabold ${colorMap[s.color]}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patron, book, or loan ID..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...FINE_STATUSES].map(s => (
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

      {/* Fines Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 text-left">Fine ID</th>
                <th className="py-3 px-4 text-left">Patron</th>
                <th className="py-3 px-4 text-left">Resource</th>
                <th className="py-3 px-4 text-left">Due Date</th>
                <th className="py-3 px-4 text-left">Days Over</th>
                <th className="py-3 px-4 text-left">Total Fine</th>
                <th className="py-3 px-4 text-left">Paid</th>
                <th className="py-3 px-4 text-left">Outstanding</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/60 divide-y divide-slate-800/60">
              {filteredFines.map(fine => (
                <tr key={fine.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono text-indigo-400 text-[10px]">{fine.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{fine.patronName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{fine.matric}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[160px]">
                    <div className="text-slate-200 truncate">{fine.bookTitle}</div>
                    <div className="text-[10px] text-slate-500">{fine.loanId}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{fine.dueDate}</td>
                  <td className="py-3 px-4">
                    <span className="text-rose-400 font-bold">{fine.daysOverdue}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-rose-400">₦{fine.fineAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-emerald-400">₦{fine.amountPaid.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-white">₦{(fine.fineAmount - fine.amountPaid).toLocaleString()}</td>
                  <td className="py-3 px-4"><StatusBadge status={fine.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!['Paid', 'Waived'].includes(fine.status) && (
                        <>
                          <button
                            onClick={() => setPaymentModal(fine)}
                            className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] border border-emerald-500/30 transition"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => setWaiveModal(fine)}
                            className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[11px] border border-amber-500/30 transition"
                          >
                            Waive
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFines.length === 0 && (
            <div className="text-center py-12 text-slate-500">No fines found.</div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Clock size={15} className="text-indigo-400" /> Payment History
        </h3>
        <div className="space-y-2">
          {allFines.filter(f => f.amountPaid > 0 || f.status === 'Waived').map(f => (
            <div key={f.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <span className="font-semibold text-white">{f.patronName}</span>
                <span className="text-slate-400 ml-2">{f.bookTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                {f.status === 'Waived'
                  ? <span className="text-amber-400 font-semibold">Waived ₦{(f.fineAmount - f.amountPaid).toLocaleString()}</span>
                  : <span className="text-emerald-400 font-semibold">Paid ₦{f.amountPaid.toLocaleString()}</span>
                }
                <StatusBadge status={f.status} />
              </div>
            </div>
          ))}
          {allFines.filter(f => f.amountPaid > 0 || f.status === 'Waived').length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">No payment records yet.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      {paymentModal && (
        <PaymentModal
          fine={paymentModal}
          onClose={() => setPaymentModal(null)}
          onRecord={handleRecordPayment}
        />
      )}
      {waiveModal && (
        <WaiveModal
          fine={waiveModal}
          onClose={() => setWaiveModal(null)}
          onWaive={handleWaiveFine}
        />
      )}
    </div>
  );
}
