import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, Terminal, Play, Download, CheckCircle2,
  AlertTriangle, Table, HardDrive, Cpu, ShieldCheck, Sparkles,
  Layers, Code, CheckCircle, ExternalLink, Search
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function AdminDatabaseManager() {
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initOutput, setInitOutput] = useState('');
  
  // SQL Query Console State
  const [sqlQuery, setSqlQuery] = useState('SELECT id, title, author, isbn, call_number FROM books LIMIT 10;');
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState('');

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await libraryApi.database.getStatus();
      setDbStatus(status);
    } catch (e) {
      console.error('Failed to get database status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitDatabase = async () => {
    if (!window.confirm('Are you sure you want to re-initialize the database "brainfeels_library"? All initial institutional records, tables, and schema will be freshly built and seeded.')) {
      return;
    }
    setInitializing(true);
    setInitOutput('');
    sounds.playClick();
    try {
      const res = await libraryApi.database.initDatabase();
      if (res.success) {
        sounds.playSuccessChime();
        setInitOutput(res.output || res.message);
        await fetchStatus();
      } else {
        sounds.playErrorBuzz();
        setInitOutput(`Error: ${res.error || res.message}`);
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setInitOutput(`Initialization Exception: ${err.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const handleRunQuery = async (queryToRun) => {
    const query = queryToRun || sqlQuery;
    if (!query.trim()) return;
    setQueryRunning(true);
    setQueryError('');
    setQueryResult(null);
    sounds.playClick();
    try {
      const res = await libraryApi.database.runQuery(query);
      if (res.success) {
        sounds.playSuccessChime();
        setQueryResult(res);
      } else {
        sounds.playErrorBuzz();
        setQueryError(res.error || 'Query failed');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setQueryError(err.message);
    } finally {
      setQueryRunning(false);
    }
  };

  const quickQueries = [
    { label: 'Books (Digital & Physical)', sql: 'SELECT id, title, author, isbn, call_number, is_digital FROM books;' },
    { label: 'Patrons & Security PINs', sql: 'SELECT matric, name, role, department, pin, clearance_status FROM patrons;' },
    { label: 'Active & Overdue Loans', sql: 'SELECT id, matric, patron_name, book_title, borrow_date, due_date, status FROM loans;' },
    { label: 'Theses & Dissertations', sql: 'SELECT id, title, author, matric, degree, status, access FROM theses;' },
    { label: 'Study Rooms & Quotas', sql: 'SELECT id, name, branch, capacity, status, available_today FROM study_rooms;' },
    { label: 'Reading Progress & Pages', sql: 'SELECT matric, book_id, title, last_page, total_pages, progress FROM continue_reading;' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Identity Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database size={160} className="text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SQL Engine: brainfeels_library Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SQL Database Architecture & Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Centralized relational database engine <span className="font-mono text-indigo-300 font-bold">brainfeels_library</span> powering both the Admin Authority and Student Portals with instant synchronizations, ACID compliance, and SQL query routing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleInitDatabase}
              disabled={initializing}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-2.5 transition active:scale-95"
            >
              <RefreshCw size={16} className={initializing ? "animate-spin" : ""} />
              {initializing ? 'Re-Initializing & Seeding...' : '⚡ Re-Initialize Database (init-db)'}
            </button>

            <a
              href="/api/database/export"
              download="brainfeels_library.sql"
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition"
            >
              <Download size={16} className="text-indigo-400" />
              Download .SQL Dump
            </a>

            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Refresh Database Stats"
            >
              <RefreshCw size={16} className={loadingStatus ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. System Status & Table Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Target SQL Database</div>
          <div className="text-lg font-black text-indigo-400 font-mono">brainfeels_library</div>
          <div className="text-[10px] text-slate-500 font-mono">SQLite3 & MySQL Relay</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Schema Tables</div>
          <div className="text-lg font-black text-emerald-400 font-mono">{dbStatus?.totalTables || 18} Relational Tables</div>
          <div className="text-[10px] text-slate-500 font-mono">100% Normalized DDL</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Catalog Holdings</div>
          <div className="text-lg font-black text-amber-400 font-mono">{dbStatus?.tableCounts?.books || 8} Books / Digital</div>
          <div className="text-[10px] text-slate-500 font-mono">Synced to Student Portal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Patrons & Security</div>
          <div className="text-lg font-black text-purple-400 font-mono">{dbStatus?.tableCounts?.patrons || 4} Verified Profiles</div>
          <div className="text-[10px] text-slate-500 font-mono">4-Digit PIN Authentication</div>
        </div>
      </div>

      {/* 3. Relational Tables Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold">
              <Table size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Database Table Breakdown (18 Tables)</h2>
              <p className="text-xs text-slate-400">Live row counts in database/brainfeels_library.sqlite</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Updated: Just now</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {dbStatus?.tableCounts && Object.entries(dbStatus.tableCounts).map(([table, count]) => (
            <div
              key={table}
              onClick={() => {
                const q = `SELECT * FROM ${table} LIMIT 10;`;
                setSqlQuery(q);
                handleRunQuery(q);
              }}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-700 cursor-pointer transition space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300 group-hover:text-indigo-400 truncate">{table}</span>
                <Code size={12} className="text-slate-600 group-hover:text-indigo-400" />
              </div>
              <div className="text-base font-black text-white font-mono">{count} <span className="text-[10px] text-slate-500 font-normal">rows</span></div>
            </div>
          ))}
        </div>

        {initOutput && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {initOutput}
          </div>
        )}
      </div>

      {/* 4. Interactive SQL Query Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Interactive SQL Query Terminal</h2>
              <p className="text-xs text-slate-400">Execute native queries directly against brainfeels_library</p>
            </div>
          </div>

          <button
            onClick={() => handleRunQuery()}
            disabled={queryRunning}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95"
          >
            <Play size={14} className={queryRunning ? "animate-spin" : ""} />
            {queryRunning ? 'Running SQL...' : 'Execute SQL Query'}
          </button>
        </div>

        {/* Quick Query Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-500 mr-1">Quick Templates:</span>
          {quickQueries.map((qq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSqlQuery(qq.sql);
                handleRunQuery(qq.sql);
              }}
              className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-indigo-300 transition"
            >
              {qq.label}
            </button>
          ))}
        </div>

        {/* SQL Code Input */}
        <div className="relative">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500 selection:bg-indigo-900 selection:text-white"
            placeholder="Type your SQL command here (e.g. SELECT * FROM books;)"
          />
        </div>

        {/* Query Error Notice */}
        {queryError && (
          <div className="p-4 rounded-2xl bg-rose-950 border border-rose-800 text-rose-300 font-mono text-xs flex items-start gap-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">SQL Execution Error:</div>
              <div>{queryError}</div>
            </div>
          </div>
        )}

        {/* Query Results Table */}
        {queryResult && queryResult.rows && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">✓ Query executed successfully: {queryResult.count} records returned</span>
              <span>Execution Target: brainfeels_library</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950 max-h-96">
              {queryResult.rows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Query returned 0 rows.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 font-mono text-slate-400 uppercase text-[10px]">
                    <tr>
                      {Object.keys(queryResult.rows[0]).map((col) => (
                        <th key={col} className="p-3 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-mono">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-300 max-w-xs truncate" title={String(val)}>
                            {val === null || val === undefined ? (
                              <span className="text-slate-600 italic">NULL</span>
                            ) : typeof val === 'boolean' ? (
                              val ? 'TRUE' : 'FALSE'
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
