import React from 'react';
import {
  Shield, Activity, Database, Server, Cpu, HardDrive,
  CheckCircle, AlertCircle, RefreshCw, Zap, Lock
} from 'lucide-react';
import { SYSTEM_HEALTH_METRICS } from '../data/institutionalSeedData';

export default function AdminSystemHealth() {
  const metrics = SYSTEM_HEALTH_METRICS;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
            INFRASTRUCTURE TELEMETRY & OBSERVABILITY
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">System Health & Services Status</h2>
          <p className="text-xs text-slate-400">
            Real-time monitoring of PostgreSQL clusters, OpenSearch vector engines, Redis caching layer, and storage pools.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          All Systems Operational (99.98% SLA)
        </div>
      </div>

      {/* Health Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Core REST & Event API', status: 'Online', latency: '24ms Latency', desc: 'Zero queue backlog on localhost bus', icon: Activity, color: 'emerald' },
          { title: 'PostgreSQL Primary Cluster', status: 'Healthy', latency: '2.1ms Query Avg', desc: metrics.databaseStatus, icon: Database, color: 'emerald' },
          { title: 'OpenSearch Vector Engine', status: 'Healthy', latency: '98.4% Hit Rate', desc: metrics.searchEngineStatus, icon: Cpu, color: 'emerald' },
          { title: 'Redis Cache Memory Pool', status: 'Active', latency: '0.8ms Read', desc: metrics.redisCacheStatus, icon: Zap, color: 'emerald' },
          { title: 'Encrypted Object Storage', status: 'Healthy', latency: '42.8 GB / 500 GB', desc: 'S3-compatible asset vault', icon: HardDrive, color: 'emerald' },
          { title: 'AI Librarian RAG Engine', status: 'Online', latency: '99.2% Grounding', desc: metrics.aiLibrarianService, icon: Shield, color: 'emerald' }
        ].map((srv, i) => {
          const Icon = srv.icon;
          return (
            <div key={i} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400">
                  <Icon size={20} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {srv.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{srv.title}</h3>
                <div className="text-xs text-emerald-400 font-mono font-semibold mt-0.5">{srv.latency}</div>
                <p className="text-[11px] text-slate-400 mt-1">{srv.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automated Backups & Disaster Recovery */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-white">Automated Backups & Disaster Recovery Vault</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400">Latest Database Snapshot</div>
            <div className="text-white font-mono font-bold text-sm">Today at 04:00 AM</div>
            <div className="text-emerald-400 text-[10px]">SHA-256 Hash Verified ✓</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400">PDF Repository Archive</div>
            <div className="text-white font-mono font-bold text-sm">14,205 Blobs (42.8 GB)</div>
            <div className="text-emerald-400 text-[10px]">Geo-Replicated to AWS S3 ✓</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400">Recovery Time Objective (RTO)</div>
            <div className="text-white font-mono font-bold text-sm">&lt; 15 Minutes</div>
            <div className="text-emerald-400 text-[10px]">Instant Failover Ready ✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
