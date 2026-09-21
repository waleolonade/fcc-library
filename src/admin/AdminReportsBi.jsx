import React, { useState } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Download, FileSpreadsheet,
  FileText, Calendar, Filter, Layers, Building2, Check
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function AdminReportsBi({ books, loans }) {
  const [reportPeriod, setReportPeriod] = useState('Second Semester 2026/2027');
  const [exportedFeedback, setExportedFeedback] = useState(null);

  const handleExport = (format) => {
    sounds.playSuccessChime();
    setExportedFeedback(format);
    setTimeout(() => setExportedFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800">
            BUSINESS INTELLIGENCE & ACCREDITATION REPORTS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Institutional Analytics & BI</h2>
          <p className="text-xs text-slate-400">
            Circulation velocity, departmental borrowing intensity, collection growth, and branch comparison data.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF Executive Summary')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
          >
            <FileText size={14} className="text-rose-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => handleExport('Excel Comprehensive Workbook')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {exportedFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check size={18} />
          <span>Report successfully compiled and exported as <strong>{exportedFeedback}</strong>!</span>
        </div>
      )}

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Borrowing Intensity */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" /> Borrowing Intensity by Department
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Total 8,421 Active Loans</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { dept: 'Co-operative Economics & Management', percent: 42, count: '3,536 loans', color: 'bg-emerald-500' },
              { dept: 'Computer Science & Software Engineering', percent: 28, count: '2,357 loans', color: 'bg-indigo-500' },
              { dept: 'Banking & Finance', percent: 18, count: '1,515 loans', color: 'bg-teal-500' },
              { dept: 'Agricultural Extension & Rural Sociology', percent: 12, count: '1,013 loans', color: 'bg-amber-500' },
            ].map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{d.dept}</span>
                  <span className="text-white font-mono font-bold">{d.count} ({d.percent}%)</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className={`${d.color} h-full rounded-full transition-all duration-500`} style={{ width: `${d.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Branch Campus Comparison */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-emerald-400" /> Campus Branch Utilization
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Daily Traffic Avg</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { branch: 'Main Campus Library (Prof. Hezekiah)', occupancy: '86% Occupancy', visitors: '1,240 / day', bar: 'w-[86%]', color: 'bg-emerald-500' },
              { branch: 'E-Library & Virtual Commons', occupancy: '94% Occupancy', visitors: '890 / day', bar: 'w-[94%]', color: 'bg-indigo-500' },
              { branch: 'Faculty of Science & Computing Library', occupancy: '72% Occupancy', visitors: '420 / day', bar: 'w-[72%]', color: 'bg-teal-500' },
              { branch: 'Faculty of Engineering Library', occupancy: '68% Occupancy', visitors: '350 / day', bar: 'w-[68%]', color: 'bg-purple-500' },
            ].map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-[200px]">{b.branch}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{b.visitors} • <strong className="text-white">{b.occupancy}</strong></span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className={`${b.color} h-full rounded-full ${b.bar}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
