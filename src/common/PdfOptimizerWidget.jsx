import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle,
  FileText,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { COMPRESSION_PRESETS, formatBytes } from '../utils/pdfCompressor';

export default function PdfOptimizerWidget({
  compressionResult,
  isCompressing,
  progress,
  activePreset,
  onSelectPreset,
  onRecompress,
  onPreviewPdf,
  themeColor = '#0d9488', // default teal
  accentColor = '#14b8a6'
}) {
  const [showPresetDrawer, setShowPresetDrawer] = useState(false);

  return (
    <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/30 p-4 sm:p-5 shadow-xl space-y-4 font-sans text-xs animate-fadeIn">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md"
            style={{ backgroundColor: `${themeColor}25`, color: accentColor }}
          >
            <Zap size={18} className={isCompressing ? 'animate-bounce' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Intelligent PDF & E-Book Optimizer</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px] font-semibold border border-teal-500/30">
                10x Upload Acceleration
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Downsamples oversized scanned pages, removes redundant streams & compresses payload before transmission.
            </p>
          </div>
        </div>

        {/* Preset selector toggle */}
        <button
          type="button"
          onClick={() => setShowPresetDrawer(!showPresetDrawer)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition border border-slate-700/80"
        >
          <Sliders size={13} className="text-teal-400" />
          <span>Preset: <strong className="text-white uppercase">{activePreset || 'recommended'}</strong></span>
          {showPresetDrawer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Preset drawer options */}
      {showPresetDrawer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 animate-fadeIn">
          {Object.values(COMPRESSION_PRESETS).map((p) => {
            const isSelected = (activePreset || 'recommended').toLowerCase() === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (onSelectPreset) onSelectPreset(p.id);
                  if (onRecompress) onRecompress(p.id);
                  setShowPresetDrawer(false);
                }}
                className={`p-2.5 rounded-xl cursor-pointer transition border text-left space-y-1 ${
                  isSelected
                    ? 'border-teal-400 bg-teal-950/50 shadow-md'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-[11px] ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                  {isSelected && <CheckCircle size={12} className="text-teal-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                <div className="text-[10px] font-mono font-bold text-emerald-400 pt-0.5">
                  Est. Savings: {p.targetSavings}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compression progress bar while running */}
      {isCompressing && (
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-teal-300 font-semibold flex items-center gap-1.5">
              <RefreshCw size={13} className="animate-spin text-teal-400" />
              {progress?.message || 'Compressing & re-encoding PDF document streams...'}
            </span>
            <span className="font-mono font-bold text-white">{progress?.percent || 50}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 relative rounded-full"
              style={{ width: `${progress?.percent || 40}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Comparison metrics card once compressed */}
      {compressionResult && !isCompressing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Original Size */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-left">
            <div className="text-[10px] text-slate-500 font-medium">Original Document</div>
            <div className="text-sm font-bold text-slate-300 mt-0.5 font-mono line-through decoration-rose-500/60">
              {compressionResult.originalFormatted}
            </div>
            <div className="text-[10px] text-slate-500">Uncompressed scan</div>
          </div>

          {/* 2. Optimized Size */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-left">
            <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle size={11} /> Optimized Size
            </div>
            <div className="text-sm font-black text-emerald-300 mt-0.5 font-mono">
              {compressionResult.compressedFormatted}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-bold">
              -{compressionResult.savingsPercent}% smaller
            </div>
          </div>

          {/* 3. Space Saved */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-left">
            <div className="text-[10px] text-slate-500 font-medium">Disk & DB Saved</div>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              {compressionResult.savedFormatted}
            </div>
            <div className="text-[10px] text-teal-400 font-mono">
              in {(compressionResult.durationMs / 1000).toFixed(1)}s
            </div>
          </div>

          {/* 4. Network Speedup */}
          <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/40 text-left">
            <div className="text-[10px] text-teal-400 font-medium flex items-center gap-1">
              <Zap size={11} /> Upload Acceleration
            </div>
            <div className="text-sm font-black text-white mt-0.5 font-mono text-teal-200">
              {compressionResult.speedupFactor}
            </div>
            <div className="text-[10px] text-slate-400">Guaranteed payload fit</div>
          </div>
        </div>
      )}

      {/* Action bar */}
      {compressionResult && !isCompressing && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Sparkles size={13} className="text-amber-400" />
            <span>High-speed compression applied: Document will upload in seconds without network timeouts.</span>
          </div>

          <div className="flex items-center gap-2">
            {onPreviewPdf && compressionResult.blobUrl && (
              <button
                type="button"
                onClick={() => onPreviewPdf(compressionResult.blobUrl)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Eye size={12} className="text-teal-400" />
                <span>Verify Clarity</span>
              </button>
            )}

            {onRecompress && (
              <button
                type="button"
                onClick={() => onRecompress(activePreset || 'recommended')}
                className="px-3 py-1 rounded-lg bg-teal-900/40 hover:bg-teal-900/60 border border-teal-700 text-teal-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <RefreshCw size={12} />
                <span>Re-optimize</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
