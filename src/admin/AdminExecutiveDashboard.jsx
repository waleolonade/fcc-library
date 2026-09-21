import React from 'react';
import {
  Shield, BookOpen, Users, CheckCircle, Clock, AlertTriangle,
  Sparkles, Layers, Activity, Database, Globe, ShoppingBag,
  TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3,
  FileText, Award, Building2, Link2, Check, Zap, Server, ChevronRight
} from 'lucide-react';
import { INSTITUTION, BRANCHES } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function AdminExecutiveDashboard({
  books,
  loans,
  patrons,
  theses,
  acquisitions,
  partnerLibraries,
  selectedBranch,
  onNavigateTab,
  onOpenCommandPalette
}) {
  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const overdueLoans = loans.filter(l => l.status === 'Overdue');
  const pendingTheses = theses.filter(t => t.status === 'Submitted' || t.status === 'Under Review');
  const pendingAcquisitions = acquisitions.filter(a => a.status === 'Pending Dean Approval' || a.status === 'Requested');
  const digitalBooks = books.filter(b => b.isDigital);

  // Mock live transaction telemetry
  const recentActivities = [
    { id: 1, type: 'thesis', title: 'Dissertation Submitted', detail: 'Impact of Micro-Credit Cooperatives by Adebayo, Samuel', time: '4 mins ago', status: 'Pending Review', color: 'indigo' },
    { id: 2, type: 'pin', title: 'PIN Generated', detail: 'Patron PIN issued for FCC/CEM/2024/042 (Amina Bello)', time: '12 mins ago', status: 'Active', color: 'emerald' },
    { id: 3, type: 'ingest', title: 'MARC21 Ingestion', detail: 'Database Systems: The Complete Book (QA76.9 .G37)', time: '28 mins ago', status: 'Indexed', color: 'teal' },
    { id: 4, type: 'loan', title: 'RFID Self-Checkout', detail: 'Cooperative Banking & Microfinance (CEM 411)', time: '45 mins ago', status: 'Checked Out', color: 'blue' },
    { id: 5, type: 'consortia', title: 'Consortia Sync', detail: 'Kenneth Dike Library (UI) OPAC gateway sync verified', time: '1 hr ago', status: 'Synchronized', color: 'purple' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. EXECUTIVE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                ENTERPRISE ILS • {INSTITUTION.shortName}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">Current Scope: <strong className="text-white">{selectedBranch}</strong></span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Library Operations Executive Command Deck
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time monitoring of campus circulation velocity, digital repository ingestion, NBTE accreditation compliance, and patron authorization.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-emerald-400 font-mono flex items-center gap-1.5">
                <Activity size={13} /> Vector Latency: <strong>24ms</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                PostgreSQL Cluster: <strong className="text-emerald-400">Sync 100%</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-indigo-300 font-medium">
                NBTE Compliance: <strong className="text-white">96.4% (Grade A)</strong>
              </span>
            </div>
          </div>

          {/* Quick System Action Launchpad */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <a
              href="/student.html#/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              title="Open Student Catalog OPAC (student.html#/catalog)"
            >
              <BookOpen size={14} />
              <span>Student Catalog OPAC</span>
              <ArrowUpRight size={13} />
            </a>
            <button
              onClick={() => onNavigateTab('pdf_upload')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap size={14} /> 1-Click Ingest PDF
            </button>
            <button
              onClick={() => onNavigateTab('patrons')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users size={14} /> Patron PIN Authority
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE 8-KPI REAL-TIME METRICS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Live Institutional KPIs</h2>
          <span className="text-xs text-slate-500 font-mono">Auto-refreshed via Broadcast Mesh</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total Titles', value: books.length + 125400, format: '125,400+', color: 'indigo', sub: '+14 this week', tab: 'marc' },
            { label: 'Active Loans', value: activeLoans.length, format: String(activeLoans.length), color: 'emerald', sub: '98% on-time', tab: 'circulation' },
            { label: 'Overdue Fines', value: overdueLoans.length, format: String(overdueLoans.length), color: 'rose', sub: 'Action required', tab: 'circulation' },
            { label: 'Digital Reads', value: digitalBooks.length * 128, format: '4,280', color: 'teal', sub: 'High concurrency', tab: 'pdf_upload' },
            { label: 'Theses Queue', value: pendingTheses.length, format: String(pendingTheses.length), color: 'amber', sub: 'Needs approval', tab: 'approvals', isAlert: pendingTheses.length > 0 },
            { label: 'Active Patrons', value: patrons.length, format: '4,892', color: 'purple', sub: '100% PIN secured', tab: 'patrons' },
            { label: 'Partner Libs', value: partnerLibraries.length, format: String(partnerLibraries.length), color: 'blue', sub: 'Z39.50 Connected', tab: 'partner_libs' },
            { label: 'Accreditation', value: '96.4%', format: '96.4%', color: 'emerald', sub: 'NBTE Certified', tab: 'accreditation' },
          ].map((stat, idx) => (
            <button
              key={idx}
              onClick={() => onNavigateTab(stat.tab)}
              className={`p-3.5 rounded-2xl bg-slate-900 border text-left group shadow-lg transition-all flex flex-col justify-between ${
                stat.isAlert ? 'border-amber-500/60 bg-gradient-to-br from-slate-900 to-amber-950/20' : 'border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight block truncate">{stat.label}</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-400 transition font-mono">
                  {stat.format}
                </span>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">{stat.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. MULTI-BRANCH CONSORTIA STATUS & LIVE ACTIVITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Network Status (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-indigo-400" />
              <h2 className="text-base font-bold text-white">Campus Branch Utilization & Staff Telemetry</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{BRANCHES.length} Active Nodes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BRANCHES.map(branch => (
              <div
                key={branch.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-indigo-700/50 transition space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white leading-snug">{branch.name}</h3>
                    <p className="text-[11px] text-slate-400">{branch.location}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    ONLINE
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Capacity ({branch.currentOccupancy || 84}/{branch.seats})</span>
                    <span className="text-indigo-300 font-bold">{Math.round(((branch.currentOccupancy || 84) / branch.seats) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round(((branch.currentOccupancy || 84) / branch.seats) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  <span>Librarian: {branch.headLibrarian || 'Duty Officer'}</span>
                  <span>{branch.holdingsCount?.toLocaleString() || '14,200'} vols</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Operational Activity Log (1 Col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                <h2 className="text-base font-bold text-white">Live Transactions</h2>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-2.5">
              {recentActivities.map(act => (
                <div key={act.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-300 uppercase tracking-tight font-mono">{act.title}</span>
                    <span className="text-slate-500 font-mono">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{act.detail}</p>
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>Status: <strong className="text-emerald-400">{act.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('audit')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition mt-2"
          >
            <FileText size={14} /> Full Audit Trail
          </button>
        </div>
      </div>

      {/* 4. RAPID WORKFLOW MATRIX (QUICK ACCESS CARDS) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">Administrative Quick Launchpad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Upload PDF Book', icon: FileText, tab: 'pdf_upload', desc: 'Ingest text & chapter TOC' },
            { label: 'Patrons & PINs', icon: Users, tab: 'patrons', desc: '1-Click security credentials' },
            { label: 'Approval Queue', icon: CheckCircle, tab: 'approvals', desc: 'Theses & procurement review' },
            { label: 'Circulation Desk', icon: RefreshCw, tab: 'circulation', desc: 'Barcode/RFID checkouts' },
            { label: 'Linked Libraries', icon: Globe, tab: 'partner_libs', desc: 'UI, OAU, NLN OPAC gateways' },
            { label: 'MARC21 Catalog', icon: Database, tab: 'marc', desc: 'RDA Leader & standard tags' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigateTab(item.tab)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-600/50 transition-all text-left group shadow-lg flex flex-col justify-between"
              >
                <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition w-fit mb-2">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
