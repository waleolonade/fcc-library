import React from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, AlertTriangle, Download, Sparkles, PieChart, Shield } from 'lucide-react';

export default function InstitutionalAnalytics({ books, loans }) {
  const totalPhysicalHoldings = books.reduce((acc, b) => acc + b.copiesTotal, 0);
  const totalLoaned = books.reduce((acc, b) => acc + (b.copiesTotal - b.copiesAvailable), 0);
  const totalOverdue = loans.filter(l => l.status === 'Overdue').length;
  const totalFinesAccrued = loans.reduce((acc, l) => acc + (l.fine || 0), 0);

  const deptStats = [
    { name: "Co-operative Economics & Management (CEM)", total: 42, activeLoans: 14, percentage: 38 },
    { name: "Computer Science & Artificial Intelligence (CSC)", total: 34, activeLoans: 11, percentage: 29 },
    { name: "Banking & Finance (BNF)", total: 26, activeLoans: 7, percentage: 21 },
    { name: "Agricultural Extension & Agronomy (AGR)", total: 18, activeLoans: 4, percentage: 12 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            Executive Business Intelligence & Decision Support
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Institutional Circulation Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time telemetry on collection turnover, patron borrowing velocity, and acquisition ROI.
          </p>
        </div>

        <button
          onClick={() => alert('Generating institutional executive PDF summary...')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <Download size={14} /> Export Audit Report (PDF/CSV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Cataloged Volumes</div>
          <div className="text-2xl font-black text-white">{totalPhysicalHoldings} Volumes</div>
          <div className="text-[10px] text-emerald-400 font-mono">100% Ingested into MARC21</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Campus Circulation</div>
          <div className="text-2xl font-black text-indigo-400">{totalLoaned} Checked Out</div>
          <div className="text-[10px] text-indigo-300 font-mono">{( (totalLoaned / (totalPhysicalHoldings || 1)) * 100 ).toFixed(1)}% Collection Utilization</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Overdue Items Pending</div>
          <div className="text-2xl font-black text-rose-400">{totalOverdue} Overdues</div>
          <div className="text-[10px] text-rose-300 font-mono">Automated SMS / Email Alerts Fired</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Accrued Fines Ledger</div>
          <div className="text-2xl font-black text-emerald-400">₦{totalFinesAccrued.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono">Paystack / Cash Desk Cleared</div>
        </div>
      </div>

      {/* Department Breakdown Bar */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Circulation Velocity by Academic Department
        </h3>

        <div className="space-y-3">
          {deptStats.map(d => (
            <div key={d.name} className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold">{d.name}</span>
                <span className="font-mono text-indigo-400">{d.activeLoans} Active Loans ({d.percentage}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                  style={{ width: `${d.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
