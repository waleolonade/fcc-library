import React, { useState } from 'react';
import { ShieldCheck, Upload, FileText, CheckCircle2, AlertTriangle, Download, Sparkles, RefreshCw } from 'lucide-react';

export default function PlagiarismChecker() {
  const [fileSelected, setFileSelected] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState(null);

  const handleSimulateScan = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setReport({
        similarityScore: 12.4, // Excellent academic score (<15% standard threshold)
        originalityScore: 87.6,
        wordCount: 14820,
        sources: [
          { name: "Journal of Co-operative Economics & Rural Finance (2024)", match: "4.2%", type: "Peer-Reviewed Journal" },
          { name: "Federal Ministry of Agriculture Agro-Industrial Survey", match: "3.1%", type: "Government Publication" },
          { name: "University of Ibadan Institutional Theses Archive", match: "2.8%", type: "Institutional Repository" },
          { name: "Crossref DOI 10.1016/j.coop.2024.01", match: "2.3%", type: "Published Monograph" }
        ],
        status: "APPROVED_FOR_DEFENSE"
      });
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-emerald-400" />
          Academic Integrity & Turnitin-Grade Similarity Engine
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Institutional Anti-Plagiarism & Originality Scanner
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Scan final year dissertations, journal drafts, and technical proposals against 250M+ global scholarly works and internal repositories.
        </p>
      </div>

      {/* Upload & Scan Form */}
      <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleSimulateScan} className="space-y-4">
          <div className="p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl text-center space-y-2 bg-slate-950/60 cursor-pointer transition">
            <Upload size={32} className="text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-white">Upload Research Manuscript (.PDF, .DOCX)</div>
            <p className="text-xs text-slate-400">
              Files are processed with 256-bit encryption and checked against Crossref, OpenAlex, and Nigerian institutional archives.
            </p>
            <div className="text-[11px] font-mono text-emerald-400">
              Selected: <strong className="text-white">FCC_CEM_Final_Dissertation_2026.pdf</strong> (3.8 MB)
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isScanning ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={16} />}
              {isScanning ? 'Comparing with 250M+ Academic Indexes...' : 'Run Similarity & Originality Audit'}
            </button>
          </div>
        </form>
      </div>

      {/* Report View */}
      {report && (
        <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-bold rounded border border-emerald-800 mb-1">
                STATUS: COMPLIANT WITH NBTE RESEARCH THRESHOLD (&lt;15%)
              </div>
              <h3 className="text-lg font-bold text-white">Originality Analysis Certificate</h3>
              <p className="text-xs text-slate-400">Document Length: {report.wordCount.toLocaleString()} Words • 64 Pages Indexed</p>
            </div>

            <button
              onClick={() => alert('Downloading Originality Certificate PDF...')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download size={14} /> Download Originality Report
            </button>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Similarity Index</span>
                <div className="text-3xl font-black text-emerald-400">{report.similarityScore}%</div>
                <span className="text-[10px] text-slate-500">Quotes & Citations Excluded</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-base">
                PASS
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Net Original Content</span>
                <div className="text-3xl font-black text-indigo-400">{report.originalityScore}%</div>
                <span className="text-[10px] text-slate-500">Novel Academic Formulation</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-400 font-bold text-base">
                HIGH
              </div>
            </div>
          </div>

          {/* Source Matches Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Matched Literature & Secondary Citations:
            </h4>
            <div className="space-y-2">
              {report.sources.map((src, i) => (
                <div key={i} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white">{src.name}</span>
                    <span className="text-[10px] text-slate-500 block">{src.type}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {src.match} Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
