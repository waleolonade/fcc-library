import React, { useState } from 'react';
import {
  ShieldAlert, UserCheck, AlertTriangle, Building2, Mail, Phone,
  CheckCircle2, ArrowRight, X, Sparkles, Send, Lock, HelpCircle
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const FCC_HOD_REGISTRY = [
  {
    code: 'CEM',
    dept: 'Co-operative Economics & Management',
    hodName: 'Dr. O. A. Babalola',
    title: 'Chief Lecturer & Head of Department',
    office: 'Faculty of Cooperative Studies, Room 102',
    email: 'hod.cem@fccibadanlibrary.com.ng'
  },
  {
    code: 'CS',
    dept: 'Computer Science',
    hodName: 'Engr. K. M. Balogun',
    title: 'Senior Lecturer & Head of Department',
    office: 'Software Systems Engineering Wing, Room 204',
    email: 'hod.cs@fccibadanlibrary.com.ng'
  },
  {
    code: 'BFN',
    dept: 'Banking & Finance',
    hodName: 'Dr. Y. O. Oladipo',
    title: 'Head of Department & Monetary Economics Fellow',
    office: 'Banking Hall Complex, Room 108',
    email: 'hod.bfn@fccibadanlibrary.com.ng'
  },
  {
    code: 'AGR',
    dept: 'Agricultural Extension & Management',
    hodName: 'Dr. (Mrs) F. T. Adeyemi',
    title: 'Associate Professor & Head of Department',
    office: 'Agronomy Demonstration Complex, Farm Office 01',
    email: 'hod.agr@fccibadanlibrary.com.ng'
  },
  {
    code: 'ACC',
    dept: 'Accounting',
    hodName: 'Mrs. A. O. Adeleke',
    title: 'Head of Department & Financial Reporting Lead',
    office: 'School of Business Studies, Room 115',
    email: 'hod.acc@fccibadanlibrary.com.ng'
  },
  {
    code: 'PAD',
    dept: 'Public Administration',
    hodName: 'Dr. E. K. Ogundele',
    title: 'Head of Department & Institutional Policy Chair',
    office: 'Administrative Sciences Wing, Room 301',
    email: 'hod.pad@fccibadanlibrary.com.ng'
  }
];

/**
 * Student HOD Concept & Clearance Modal
 * Displays when a student/user clicks to upload video/audio without prior HOD clearance
 */
export function StudentHodClearanceModal({ onClose, studentDept = null }) {
  const [selectedHod, setSelectedHod] = useState(
    FCC_HOD_REGISTRY.find(h => h.code === studentDept || h.dept === studentDept) || FCC_HOD_REGISTRY[0]
  );
  const [requestSent, setRequestSent] = useState(false);
  const [note, setNote] = useState('');

  const handleSendRequest = () => {
    sounds.playSuccessChime();
    setRequestSent(true);
    setTimeout(() => {
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#032317] to-[#01140d] border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* HEADER ICON & TITLE */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/40">
            <UserCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                Departmental Concept Clearance
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-800">
                FCC Academic Policy
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              HOD Authorization Required to Upload Media
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 leading-relaxed">
              In accordance with Federal Co-operative College institutional guidelines, student video lectures, seminar recordings, and coursework media require endorsement under the concept of your Departmental Head of Department (HOD) before catalogue publication.
            </p>
          </div>
        </div>

        {/* INSTRUCTION CARD */}
        <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-2">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <ShieldAlert size={14} />
            <span>How to Obtain Upload Clearance:</span>
          </h4>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Select your academic department below to identify your supervising Head of Department.</li>
            <li>Submit your lecture recording, lab demonstration, or audiobook concept for academic vetting.</li>
            <li>Once vetted, your HOD will authorize your student upload token or ingest the media directly into the digital repository stacks on your behalf.</li>
          </ol>
        </div>

        {/* HOD SELECTION DIRECTORY */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
            Select Your Department to View Supervising HOD:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {FCC_HOD_REGISTRY.map((hod) => (
              <button
                key={hod.code}
                type="button"
                onClick={() => { sounds.playClick(); setSelectedHod(hod); }}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                  selectedHod.code === hod.code
                    ? 'bg-emerald-800/50 border-emerald-400 shadow-md shadow-emerald-950'
                    : 'bg-[#021d13]/80 border-emerald-900/80 hover:border-emerald-700 hover:bg-[#022418]'
                }`}
              >
                <Building2 size={16} className={selectedHod.code === hod.code ? 'text-emerald-300' : 'text-slate-400'} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">{hod.dept}</div>
                  <div className="text-[10px] text-amber-300/90 font-mono">{hod.hodName}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SELECTED HOD CONTACT PROFILE */}
        {selectedHod && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#022418] border border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{selectedHod.hodName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                  {selectedHod.code}
                </span>
              </div>
              <div className="text-[11px] text-emerald-300/90">{selectedHod.title}</div>
              <div className="text-[10px] text-slate-400 font-mono">{selectedHod.office}</div>
              <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                <Mail size={10} />
                <span>{selectedHod.email}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <a
                href={`mailto:${selectedHod.email}?subject=Student%20Media%20Upload%20Concept%20Clearance%20Request&body=Dear%20${encodeURIComponent(selectedHod.hodName)},%0D%0A%0D%0AI%20am%20requesting%20departmental%20clearance%20under%20your%20concept%20to%20upload%20an%20academic%20lecture/media%20resource%20to%20the%20FCC%20Smart%20Library.%0D%0A%0D%0ADepartment:%20${encodeURIComponent(selectedHod.dept)}%0D%0AStudent%20Name:%0D%0AMatric%20No:`}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition shadow"
              >
                <Mail size={12} />
                <span>Email HOD for Clearance</span>
              </a>
            </div>
          </div>
        )}

        {/* CONFIRMATION / ACTION */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-900/60">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            I Understand / Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * HOD Developer Activation Modal
 * Displays when an HOD's department AV ingestion feature is pending Developer Portal activation
 */
export function HodDeveloperActivationModal({ onClose, deptName = 'Academic Department', deptCode = 'HOD' }) {
  const [pingSent, setPingSent] = useState(false);

  const handleSendPing = () => {
    sounds.playSuccessChime();
    setPingSent(true);
    // Broadcast notification for developer
    window.dispatchEvent(new CustomEvent('fcc-developer-activation-requested', {
      detail: { department: deptName, code: deptCode, timestamp: new Date().toISOString() }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-xl bg-gradient-to-b from-[#021d15] to-[#01140d] border-2 border-cyan-500/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-white relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* ICON & TITLE */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-950/50">
            <Lock size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wide">
                Developer Authority Control
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800">
                {deptCode} Pending Activation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Contact Developer to Activate Video Feature
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200/80 mt-1 leading-relaxed">
              High-definition video lecture and digital repository ingestion for the <strong className="text-white">{deptName}</strong> is currently locked pending Developer Portal authorization.
            </p>
          </div>
        </div>

        {/* EXPLANATION BOX */}
        <div className="p-4 rounded-2xl bg-[#01140d] border border-cyan-800/60 space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            To ensure bandwidth allocation and storage quota governance across the campus server, the Library Systems Developer manages video upload access on a per-department basis.
          </p>
          <p className="text-cyan-300 font-semibold">
            Please contact the Developer to flip the authorization switch for your department in the Developer Media Governance Matrix.
          </p>
        </div>

        {/* DEVELOPER CONTACT CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-700/60 space-y-2">
          <div className="text-xs font-bold text-white flex items-center justify-between">
            <span>Library Systems &amp; Software Developer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700">
              Authority Desk
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            Federal Co-operative College Digital Library Engineering Directorate
          </div>
          <div className="text-[11px] text-cyan-300 font-mono flex items-center gap-2 pt-1">
            <Mail size={12} />
            <span>developer@fccibadanlibrary.com.ng</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-cyan-900/60">
          <button
            onClick={handleSendPing}
            disabled={pingSent}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              pingSent
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-950/60'
            }`}
          >
            {pingSent ? (
              <>
                <CheckCircle2 size={15} />
                <span>Activation Request Logged!</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Ping Developer for Activation</span>
              </>
            )}
          </button>

          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
}

