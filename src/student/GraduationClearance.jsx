import React, { useState } from 'react';
import { Award, CheckCircle2, AlertTriangle, Printer, ShieldCheck, Sparkles, FileText, Download } from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';

export default function GraduationClearance({ user, loans }) {
  const [clearanceGenerated, setClearanceGenerated] = useState(false);

  const userLoans = loans.filter(l => l.matric === user.matric && l.status !== 'Returned');
  const userFines = loans.filter(l => l.matric === user.matric).reduce((acc, l) => acc + (l.fine || 0), 0);
  const hasZeroLoans = userLoans.length === 0;
  const hasZeroFines = userFines === 0;
  const thesisDeposited = true; // Simulated institutional deposit verified

  const isEligible = hasZeroLoans && hasZeroFines && thesisDeposited;

  const handleGenerateCertificate = () => {
    setClearanceGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Award size={13} className="text-emerald-400" />
          Federal Institutional Graduation Clearance
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Library Final Exit & Graduation Clearance
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Automated multi-point audit for final year HND & ND scholars. Verify borrowing records and obtain official clearance for NYSC mobilization and certificate issuance.
        </p>
      </div>

      {/* Audit Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${
          hasZeroLoans ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Physical Holdings Status</span>
            {hasZeroLoans ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-rose-400" />}
          </div>
          <div className="text-lg font-bold text-white">
            {hasZeroLoans ? 'Zero Books on Loan' : `${userLoans.length} Unreturned Books`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasZeroLoans ? 'All physical library holdings returned to stacks.' : 'Must check-in all physical items at circulation desk.'}
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          hasZeroFines ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
        }`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Financial Liability</span>
            {hasZeroFines ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-rose-400" />}
          </div>
          <div className="text-lg font-bold text-white">
            {hasZeroFines ? '₦0.00 Outstanding Balance' : `₦${userFines.toLocaleString()} Overdue Penalty`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasZeroFines ? 'Account ledger in good standing.' : 'Clear outstanding fines via Paystack/Flutterwave portal.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Institutional Thesis</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white">Dissertation Verified</div>
          <p className="text-[11px] text-slate-400 mt-1">
            OAI-PMH e-copy archived in Federal Repository.
          </p>
        </div>
      </div>

      {/* Action Area */}
      {!clearanceGenerated ? (
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
          <div>
            <h4 className="text-base font-bold text-white">
              {isEligible ? 'All Clearance Benchmarks Met' : 'Action Required for Graduation Clearance'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEligible
                ? 'Your library profile is certified free of liability. Generate your official verifiable clearance certificate.'
                : 'Please return any physical books or settle outstanding fines to unlock official clearance.'}
            </p>
          </div>

          <button
            disabled={!isEligible}
            onClick={handleGenerateCertificate}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition flex items-center gap-2 shrink-0"
          >
            <ShieldCheck size={16} /> Issue Official Clearance Certificate
          </button>
        </div>
      ) : (
        /* Printable Official Institutional Certificate */
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer size={14} /> Print Certificate (PDF)
            </button>
          </div>

          <div className="p-8 sm:p-12 bg-white text-slate-900 rounded-3xl border-4 border-double border-emerald-800 shadow-2xl space-y-6 relative overflow-hidden font-serif">
            {/* Watermark Crest Mock */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none font-black text-8xl text-emerald-950">
              FCC IBADAN
            </div>

            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b-2 border-emerald-900">
              <div className="text-xs font-sans font-bold tracking-widest text-emerald-800 uppercase">
                FEDERAL REPUBLIC OF NIGERIA
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                {INSTITUTION.name}
              </h1>
              <div className="text-xs font-sans text-slate-600 font-semibold">
                OFFICE OF THE COLLEGE LIBRARIAN • ELEYELE, IBADAN, OYO STATE
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-900 font-sans font-bold text-xs rounded-full border border-emerald-300">
                OFFICIAL LIBRARY GRADUATION CLEARANCE CERTIFICATE
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-800">
              <p>
                This is to certify that the student named below has satisfied all academic library regulations, returned all borrowed physical monographs, settled all financial obligations, and deposited an approved digital copy of their final dissertation into the Institutional Scholarly Repository:
              </p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-sans text-xs">
                <div>
                  <span className="text-slate-500 block">Full Name of Scholar:</span>
                  <strong className="text-sm text-slate-900">{user.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Matriculation Number:</span>
                  <strong className="text-sm font-mono text-emerald-900">{user.matric}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Academic Department:</span>
                  <strong className="text-slate-900">{user.dept}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Clearance Certificate Ref:</span>
                  <strong className="font-mono text-emerald-800">FCC/LIB/CLR/2026/0892</strong>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                The Academic Affairs Directorate and NYSC Mobilization Board are hereby authorized to release final transcripts, statements of results, and graduation scrolls to this candidate.
              </p>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-6 border-t border-slate-300 flex justify-between items-end font-sans text-xs">
              <div className="text-center">
                <div className="font-serif italic text-emerald-900 font-bold text-base">Dr. Mrs. A. Balogun</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
                  Chief College Librarian & System Architect
                </div>
              </div>

              <div className="text-center p-3 rounded-xl border border-dashed border-emerald-700 bg-emerald-50/50">
                <ShieldCheck size={32} className="text-emerald-700 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-emerald-900">VERIFIED CRYPTOGRAPHIC SEAL</div>
                <div className="text-[9px] font-mono text-slate-500">SHA-256: e8f921...491a</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
