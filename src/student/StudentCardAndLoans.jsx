import React, { useState } from 'react';
import { QrCode, Clock, AlertTriangle, RefreshCw, CheckCircle, CreditCard, Shield, Sparkles, BookOpen, Layers } from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import PaymentModal from './PaymentModal';

export default function StudentCardAndLoans({ user, loans, books, onRenewLoan, onPayFine }) {
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [nfcTapped, setNfcTapped] = useState(false);

  const handleSimulateNfc = () => {
    setNfcTapped(true);
    setTimeout(() => setNfcTapped(false), 2500);
  };

  const totalFines = loans.reduce((acc, l) => acc + (l.fine || 0), 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / NFC Status */}
      {nfcTapped && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span>NFC Wave Broadcasted: Turnstile Gates & RFID Shelf Scanners Synced!</span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900 px-2 py-0.5 rounded">13.56 MHz ISO/IEC 14443</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Digital Smart ID Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 relative overflow-hidden group">
            {/* Holographic Watermark effect */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-500"></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-mono text-emerald-400 font-bold block">
                  Official Patron Membership
                </span>
                <div className="text-lg font-black text-white">{INSTITUTION.shortName}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-600/50 shadow">
                <QrCode size={38} className="text-emerald-400" />
              </div>
            </div>

            <div className="my-8 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Scholar Name</div>
              <div className="text-xl sm:text-2xl font-bold text-white tracking-wide">{user.name}</div>
              <div className="text-xs font-mono text-emerald-300 font-bold">{user.matric}</div>
            </div>

            <div className="pt-4 border-t border-emerald-800/40 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">Department</span>
                <span className="font-semibold text-slate-200">{user.dept}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">Borrowing Quota</span>
                <span className="font-semibold text-emerald-400">{loans.length} / {user.borrowQuota || 5} Items</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>RFID: E2801160600{user.matric.replace(/[^0-9]/g, '') || '42'}</span>
              <span className="text-emerald-400">STATUS: VALID</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSimulateNfc}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <Sparkles size={14} className="text-emerald-400" /> Simulate NFC Tap
            </button>
            {totalFines > 0 && (
              <button
                onClick={() => setSelectedLoanForPayment(loans.find(l => l.fine > 0))}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <CreditCard size={14} /> Pay Fines (₦{totalFines})
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Active Physical Loans & Return Deadlines */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" /> Active Campus Circulation & Overdues
            </h3>
            <span className="text-xs text-slate-400">{loans.length} active holdings</span>
          </div>

          {loans.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <CheckCircle size={32} className="text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-white">No Active Physical Loans</div>
              <p className="text-[11px] text-slate-400">
                You have full borrowing privileges. Explore the discovery catalog to reserve or check out books.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                const isOverdue = loan.status === 'Overdue' || loan.fine > 0;

                return (
                  <div
                    key={loan.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isOverdue
                        ? 'bg-rose-950/30 border-rose-800/60 shadow-lg shadow-rose-950/20'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">
                            {loan.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOverdue ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{book ? book.title : loan.bookId}</h4>
                        <div className="text-xs text-slate-400">
                          Due Date: <strong className="text-slate-200">{loan.dueDate}</strong> • Issued: {loan.issueDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOverdue && loan.fine > 0 ? (
                          <button
                            onClick={() => setSelectedLoanForPayment(loan)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <CreditCard size={13} /> Settle ₦{loan.fine} Fine
                          </button>
                        ) : (
                          <button
                            onClick={() => onRenewLoan(loan.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <RefreshCw size={13} /> 14-Day Renewal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nigerian Payment Gateway Modal */}
      {selectedLoanForPayment && (
        <PaymentModal
          amount={selectedLoanForPayment.fine || 300}
          purpose={`Overdue Circulation Fine for Loan Ref #${selectedLoanForPayment.id}`}
          reference={`FCC-FINE-${selectedLoanForPayment.id}`}
          onClose={() => setSelectedLoanForPayment(null)}
          onSuccess={() => {
            onPayFine(selectedLoanForPayment.id);
            setSelectedLoanForPayment(null);
          }}
        />
      )}
    </div>
  );
}
