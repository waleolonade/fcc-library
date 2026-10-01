import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  Clock, 
  Fingerprint,
  RefreshCw,
  Sliders,
  AlertCircle
} from 'lucide-react';

export default function PdfAnalysisInspector({
  isAnalyzing,
  analysisProgress,
  analysisResult,
  onReAnalyze,
  onReset
}) {
  if (!isAnalyzing && !analysisResult) {
    return null;
  }

  // 1. LIVE ANALYSIS RADAR / SCANNING IN PROGRESS
  if (isAnalyzing) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/40 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-fadeIn">
        {/* Animated Laser Scanning Line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse shadow-[0_0_15px_#2dd4bf]" />

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-teal-500/20 animate-ping opacity-40" />
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-lg">
              <Cpu size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-700/60 uppercase tracking-wider">
                FCC AI-PDF INGESTION ENGINE v4.8
              </span>
              <span className="text-[11px] text-teal-400 font-mono animate-pulse">Scanning Binary Streams...</span>
            </div>
            <h4 className="text-base font-bold text-white">Analyzing Academic PDF Monograph</h4>
            <p className="text-xs text-slate-400">
              Extracting document title, author credentials, course code alignment, abstract, and MARC 21 cataloguing tags...
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0 text-right">
            <div className="text-2xl font-black text-teal-300 font-mono">
              {analysisProgress || 65}%
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Analysis Stream</span>
          </div>
        </div>

        {/* Real-time scanning step chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-2 rounded-xl bg-slate-950/70 border border-teal-500/20 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">PDF XRef & Headers</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-teal-500/20 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">Course Code Match</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-teal-500/20 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-teal-400 shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">Abstract & Keywords</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/70 border border-teal-500/20 flex items-center gap-2">
            <RefreshCw size={13} className="text-teal-400 animate-spin shrink-0" />
            <span className="text-[11px] text-teal-300 truncate font-semibold">MARC 21 Tagging</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPLETED ANALYSIS RESULT CARD / HUD
  const { fileMeta, extracted } = analysisResult;

  return (
    <div className="p-5 rounded-3xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl relative overflow-hidden backdrop-blur-xl animate-fadeIn space-y-4">
      {/* Top Banner with Confidence & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Automated PDF Analysis Complete</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                {extracted.confidenceScore}% Confidence
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Form fields below have been automatically populated from genuine document streams.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReAnalyze && (
            <button
              type="button"
              onClick={onReAnalyze}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw size={12} />
              <span>Re-Scan</span>
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Extracted Key Attributes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <BookOpen size={11} className="text-teal-400" /> COURSE ALIGNED
          </div>
          <div className="font-bold text-teal-300 text-xs truncate">
            {extracted.courseCode || 'GENERAL'}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Layers size={11} className="text-indigo-400" /> TARGET LEVEL
          </div>
          <div className="font-bold text-indigo-300 text-xs truncate">
            {extracted.targetLevel || 'HND II'}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Clock size={11} className="text-amber-400" /> SEMESTER
          </div>
          <div className="font-bold text-amber-300 text-xs truncate">
            {extracted.semester || 'First'}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <FileText size={11} className="text-emerald-400" /> PAGINATION
          </div>
          <div className="font-bold text-emerald-300 text-xs font-mono">
            {fileMeta.pageCount} Pages ({fileMeta.fileSize})
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <ShieldCheck size={11} className="text-cyan-400" /> INTEGRITY
          </div>
          <div className="font-bold text-cyan-300 text-xs font-mono truncate">
            {extracted.authenticityStatus === 'AUTHENTIC_VERIFIED' ? 'Verified (Score: ' + extracted.plagiarismScore + '%)' : 'Review Flag'}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Fingerprint size={11} className="text-rose-400" /> CHECKSUM
          </div>
          <div className="font-bold text-slate-300 text-[11px] font-mono truncate" title={fileMeta.checksumHash}>
            {fileMeta.checksumHash}
          </div>
        </div>
      </div>

      {/* Auto-extracted summary highlight */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>EXTRACTED DOCUMENT TITLE</span>
          <span className="text-emerald-400 font-semibold">✓ Auto-Inserted into Form</span>
        </div>
        <div className="text-sm font-semibold text-white">
          {extracted.title}
        </div>
        <div className="text-[11px] text-slate-400">
          Identified Author(s): <strong className="text-teal-300">{extracted.author}</strong>
          {extracted.supervisor && (
            <span> • Supervisor: <strong className="text-slate-300">{extracted.supervisor}</strong></span>
          )}
          {extracted.matric && (
            <span> • Matric: <strong className="text-amber-300 font-mono">{extracted.matric}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
