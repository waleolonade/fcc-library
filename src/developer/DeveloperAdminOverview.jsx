import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BookOpen,
    Building2,
    Clock,
    Database, Globe,
    Lock,
    Play,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DeveloperAdminOverview({ passkey, onSwitchTab, onImpersonate, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/admin-overview', {
        headers: { 'X-Developer-Passkey': passkey }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.warn('Admin overview fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats || {};
  const recentLoans = data?.recent_loans || [];
  const recentAudit = data?.recent_audit || [];

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Header Card */}
      <div className="bg-[#050e1c] border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500 text-indigo-300 text-xs font-bold mb-2">
              <Activity size={14} className="text-indigo-400" />
              <span>CENTRAL LIBRARY OPERATIONS &bull; MASTER ADMIN DECK</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Integrated Administrative Control Console</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 font-normal">
                Mirroring #/admin/ Live State
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed mt-1">
              Real-time synchronization between the Chief Librarian administrative desk, HOD departmental review pipelines, student circulation turnstiles, and developer root controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-600/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>Sync Telemetry</span>
            </button>

            <button
              onClick={() => onImpersonate?.('admin', { role: 'admin', name: 'Dr. Alhaji Balogun O.', email: 'admin@fccibadanlibrary.com.ng' })}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xl shadow-emerald-950"
            >
              <Play size={14} />
              <span>Launch Chief Librarian Mode</span>
            </button>
          </div>
        </div>

        {/* 6 Key Operational Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          {/* Card 1: Holdings */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-cyan-800/70 hover:border-cyan-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">Total Holdings</span>
              <BookOpen size={14} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1">{stats.books_count || 13}</div>
            <div className="text-[10px] text-slate-500 font-sans">{stats.copies_total || 130} Physical Copies</div>
          </div>

          {/* Card 2: Digital Repository */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-indigo-800/70 hover:border-indigo-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">Digital E-Books</span>
              <Globe size={14} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1">{stats.digital_books_count || 13}</div>
            <div className="text-[10px] text-emerald-400 font-sans">24/7 Virtual Hub Active</div>
          </div>

          {/* Card 3: Scholars */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-emerald-800/70 hover:border-emerald-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">Enrolled Scholars</span>
              <Users size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{stats.patrons_count || 3}</div>
            <div className="text-[10px] text-slate-500 font-sans">{stats.active_patrons_count || 3} Active Patrons</div>
          </div>

          {/* Card 4: Active Loans */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-teal-800/70 hover:border-teal-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">Circulation Loans</span>
              <Clock size={14} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-300 mt-1">{stats.active_loans_count || 0}</div>
            <div className="text-[10px] text-teal-400 font-sans">Active Holding Loans</div>
          </div>

          {/* Card 5: Overdue Alerts */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-rose-800/70 hover:border-rose-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">Overdue Alerts</span>
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.overdue_loans_count || 0}</div>
            <div className="text-[10px] text-rose-400 font-sans">₦50.00/day fine rate</div>
          </div>

          {/* Card 6: HOD Submissions */}
          <div className="p-3.5 rounded-2xl bg-[#02050b] border border-amber-800/70 hover:border-amber-500 transition">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-bold">HOD Pipeline</span>
              <Building2 size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{stats.pending_submissions || 0}</div>
            <div className="text-[10px] text-amber-400 font-sans">Pending Review Queue</div>
          </div>
        </div>
      </div>

      {/* Quick Action Station */}
      <div className="bg-[#07101f] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={16} className="text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Developer Rapid Action &amp; Control Station
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">Instant Root Superpowers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => onSwitchTab?.('books')}
            className="p-4 rounded-2xl bg-[#02050b] border border-slate-800 hover:border-cyan-500 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                <BookOpen size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition transform group-hover:translate-x-1" />
            </div>
            <div className="text-xs font-bold text-white">Book Ingestion Studio</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Catalog books, journals &amp; student projects into database</div>
          </button>

          <button
            onClick={() => onSwitchTab?.('vault')}
            className="p-4 rounded-2xl bg-[#02050b] border border-slate-800 hover:border-emerald-500 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Lock size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition transform group-hover:translate-x-1" />
            </div>
            <div className="text-xs font-bold text-white">Credentials Vault</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">Manage unhashed passwords, edit PINs &amp; block/restrict</div>
          </button>

          <button
            onClick={() => onSwitchTab?.('audit')}
            className="p-4 rounded-2xl bg-[#02050b] border border-slate-800 hover:border-indigo-500 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                <ShieldCheck size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
            </div>
            <div className="text-xs font-bold text-white">Security Audit Trail</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">SHA-256 cryptographic ledger with tamper-evident logs</div>
          </button>

          <button
            onClick={() => onSwitchTab?.('system')}
            className="p-4 rounded-2xl bg-[#02050b] border border-slate-800 hover:border-amber-500 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
                <Database size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition transform group-hover:translate-x-1" />
            </div>
            <div className="text-xs font-bold text-white">System Diagnostics</div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">SQLite &amp; MySQL engine health, cache flush &amp; API latency</div>
          </button>
        </div>
      </div>

      {/* 2-Column Section: Live Circulation Table & Real-Time Security Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Circulation Activity */}
        <div className="lg:col-span-7 bg-[#07101f] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Clock size={15} className="text-cyan-400" />
                <span>Live Circulation &amp; Holding Velocity</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">Current patron borrowings synchronized with central database</p>
            </div>
            <button
              onClick={() => onSwitchTab?.('students')}
              className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold border border-cyan-800 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Patrons Desk</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-cyan-400 font-mono uppercase">
                  <th className="py-2.5 px-3">Loan ID</th>
                  <th className="py-2.5 px-3">Patron Scholar</th>
                  <th className="py-2.5 px-3">Monograph Title</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {recentLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      All physical copies currently accounted for in stacks. No active loan overdues.
                    </td>
                  </tr>
                ) : (
                  recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 px-3 text-cyan-300 font-bold">{loan.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white font-sans">{loan.patron_name || 'Scholar'}</div>
                        <div className="text-[10px] text-slate-400">{loan.patron_matric || loan.patron_id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-sans max-w-[180px] truncate">
                        {loan.book_title || loan.book_id}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{loan.due_date || '2026-10-25'}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          loan.status === 'overdue'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        }`}>
                          {(loan.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Live Security & Audit Stream */}
        <div className="lg:col-span-5 bg-[#07101f] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <ShieldCheck size={15} className="text-indigo-400" />
                <span>Live Security &amp; Audit Stream</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">SHA-256 signed events across institutional nodes</p>
            </div>
            <button
              onClick={() => onSwitchTab?.('audit')}
              className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 text-[11px] font-bold border border-indigo-800 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Full Ledger</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3 font-sans">
            {recentAudit.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No recent security incidents logged. System operating in nominal zero-trust state.
              </div>
            ) : (
              recentAudit.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-[#02050b] border border-slate-800/80 hover:border-indigo-500/40 transition space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-indigo-300">{log.actor || 'System'}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
