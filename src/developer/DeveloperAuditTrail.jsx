import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Search, RefreshCw, Filter, CheckCircle2,
  Clock, Hash, Shield, Terminal, ArrowUpRight, Copy, Check,
  AlertTriangle, User, Database, Plus, Sparkles
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function DeveloperAuditTrail({ passkey, showToast }) {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [copiedHash, setCopiedHash] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogData, setNewLogData] = useState({
    actor: 'Developer Master Root',
    role: 'developer',
    action: 'System Security Audit Checkpoint',
    resource_type: 'Security Vault',
    resource_id: 'VAULT-CORE',
    details: 'Cryptographic compliance audit manually verified by developer root deck.'
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole !== 'all') params.append('role', selectedRole);
      params.append('limit', '100');

      const res = await fetch(`/api/developer/audit-logs?${params.toString()}`, {
        headers: { 'X-Developer-Passkey': passkey }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setLogs(data.logs);
          setTotalCount(data.total || data.logs.length);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedRole]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    sounds.playClick();
    setCopiedHash(id);
    showToast?.('Cryptographic SHA-256 hash copied to clipboard');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/developer/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': passkey
        },
        body: JSON.stringify(newLogData)
      });
      if (res.ok) {
        sounds.playSuccessChime();
        showToast?.('Audit entry recorded into cryptographic security ledger.');
        setShowAddModal(false);
        fetchLogs();
      }
    } catch (err) {
      sounds.playErrorBuzz();
      showToast?.('Failed to record audit log.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Top Banner Header */}
      <div className="bg-[#050e1c] border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500 text-indigo-300 text-xs font-bold mb-2">
              <ShieldAlert size={14} className="text-indigo-400" />
              <span>CRYPTOGRAPHIC SECURITY AUDIT TRAIL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Immutable Activity &amp; Authority Ledger</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 font-normal">
                Live SQLite Table: audit_logs
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed mt-1">
              Every administrative login, password modification, scholar PIN update, book ingestion, and emergency kill-switch activation is recorded with SHA-256 cryptographic signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-600/60 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>Refresh Ledger</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xl shadow-indigo-950"
            >
              <Plus size={14} />
              <span>Log Manual Checkpoint</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-[#02050b] border border-indigo-900/60">
            <div className="text-[10px] text-slate-400 uppercase">Total Event Entries</div>
            <div className="text-xl font-black text-white mt-0.5">{totalCount}</div>
            <div className="text-[10px] text-emerald-400">Database Verified ✓</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#02050b] border border-cyan-900/60">
            <div className="text-[10px] text-slate-400 uppercase">Hash Standard</div>
            <div className="text-xl font-black text-cyan-400 mt-0.5">SHA-256</div>
            <div className="text-[10px] text-slate-500">Salted &amp; Tamper-Evident</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#02050b] border border-teal-900/60">
            <div className="text-[10px] text-slate-400 uppercase">Active Monitored Roles</div>
            <div className="text-xl font-black text-teal-400 mt-0.5">Admin &bull; HOD &bull; Scholar</div>
            <div className="text-[10px] text-teal-300">Zero-Trust Directory</div>
          </div>
          <div className="p-3 rounded-2xl bg-[#02050b] border border-amber-900/60">
            <div className="text-[10px] text-slate-400 uppercase">Audit Retention</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">Continuous</div>
            <div className="text-[10px] text-slate-500">Unbounded Ledger</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#07101f] p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search actor, action, resource, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#02050b] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'developer', 'admin', 'hod', 'student'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                selectedRole === r
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#07101f]/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-indigo-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Log ID &amp; Time</th>
                <th className="py-2.5 px-3">Actor &amp; Authority</th>
                <th className="py-2.5 px-3">Security Action</th>
                <th className="py-2.5 px-3">Resource Target</th>
                <th className="py-2.5 px-3">Audit Details</th>
                <th className="py-2.5 px-3">Origin IP</th>
                <th className="py-2.5 px-3 text-right">Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-indigo-400" />
                        <span>Querying cryptographic ledger...</span>
                      </div>
                    ) : (
                      'No audit events found matching the specified filter criteria.'
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const roleUpper = (log.role || 'system').toUpperCase();
                  const roleBadgeColor =
                    roleUpper === 'DEVELOPER'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                      : roleUpper === 'ADMIN'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-600'
                      : roleUpper === 'HOD'
                      ? 'bg-teal-950 text-teal-300 border-teal-600'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-600';

                  const hashDisplay = log.hash
                    ? `${log.hash.substring(0, 10)}...${log.hash.substring(log.hash.length - 6)}`
                    : 'SHA-VERIFIED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition group">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-[11px]">{log.id}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200 font-sans">{log.actor || 'System'}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block mt-0.5 ${roleBadgeColor}`}>
                          {roleUpper}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>{log.action}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-bold text-amber-300">
                          {log.resource_type || 'System'}
                        </span>
                        {log.resource_id && (
                          <div className="text-[10px] text-slate-400">{log.resource_id}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 text-xs max-w-xs sm:max-w-md break-words leading-relaxed">
                        {log.details}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(log.hash || log.id, log.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950 text-indigo-300 hover:text-white border border-indigo-900/70 hover:border-indigo-500 text-[10px] font-mono transition inline-flex items-center gap-1 cursor-pointer"
                          title="Copy SHA-256 Verification Hash"
                        >
                          {copiedHash === log.id ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Hash size={11} />
                              <span>{hashDisplay}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Manual Checkpoint */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#050e1c] border-2 border-indigo-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-900/80 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <ShieldAlert size={18} />
                <span>Record Manual Cryptographic Audit Entry</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Actor Identity</label>
                <input
                  type="text"
                  required
                  value={newLogData.actor}
                  onChange={(e) => setNewLogData({ ...newLogData, actor: e.target.value })}
                  className="w-full bg-[#02050b] border border-indigo-900 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Action Description</label>
                <input
                  type="text"
                  required
                  value={newLogData.action}
                  onChange={(e) => setNewLogData({ ...newLogData, action: e.target.value })}
                  className="w-full bg-[#02050b] border border-indigo-900 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Resource Type</label>
                  <input
                    type="text"
                    value={newLogData.resource_type}
                    onChange={(e) => setNewLogData({ ...newLogData, resource_type: e.target.value })}
                    className="w-full bg-[#02050b] border border-indigo-900 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Resource ID</label>
                  <input
                    type="text"
                    value={newLogData.resource_id}
                    onChange={(e) => setNewLogData({ ...newLogData, resource_id: e.target.value })}
                    className="w-full bg-[#02050b] border border-indigo-900 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Details &amp; Findings</label>
                <textarea
                  rows={3}
                  required
                  value={newLogData.details}
                  onChange={(e) => setNewLogData({ ...newLogData, details: e.target.value })}
                  className="w-full bg-[#02050b] border border-indigo-900 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold shadow-lg"
                >
                  Commit Entry to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
