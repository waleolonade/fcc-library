import React, { useState } from 'react';
import { QrCode, Printer, X, Shield, Sparkles, UserCheck, CheckCircle2 } from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';

export default function IdCardPrintModal({ user, onClose }) {
  const [cardSide, setCardSide] = useState('front'); // 'front' | 'back'

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800 mb-1">
              <Shield size={12} /> NBTE Standard Identity Credentials
            </div>
            <h3 className="text-xl font-black text-white">Institutional PVC Smart Card Studio</h3>
            <p className="text-xs text-slate-400">High-Resolution Dual-Sided Patron RFID Identification Card</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Flip to {cardSide === 'front' ? 'Back' : 'Front'} Side
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
            >
              <Printer size={14} /> Print Card
            </button>
          </div>
        </div>

        {/* Card Render Stage */}
        <div className="flex justify-center p-4 bg-slate-950/80 rounded-3xl border border-slate-800">
          {cardSide === 'front' ? (
            /* Front of Card */
            <div className="w-[380px] sm:w-[440px] h-[250px] sm:h-[270px] rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border-2 border-emerald-500/50 shadow-2xl p-5 flex flex-col justify-between relative overflow-hidden text-white font-sans">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-emerald-700/40 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white font-serif text-sm shadow">
                    FCC
                  </div>
                  <div>
                    <div className="text-[12px] font-black tracking-tight leading-tight uppercase">{INSTITUTION.name}</div>
                    <div className="text-[9px] text-emerald-400 font-mono">LIBRARY SERVICES & RESEARCH REPOSITORY</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-300">RFID 13.56MHz</span>
                </div>
              </div>

              {/* Body: Photo & Details */}
              <div className="flex gap-4 items-center my-2">
                <div className="w-20 h-24 rounded-xl bg-slate-950 border border-emerald-500/60 flex flex-col items-center justify-center shrink-0 shadow overflow-hidden relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-800/40 border border-emerald-600 flex items-center justify-center text-emerald-300 font-bold text-base mb-1">
                    {user.name?.split(' ').map(n => n[0]).join('') || 'SP'}
                  </div>
                  <span className="text-[8px] font-mono text-emerald-400">PASSPORT</span>
                </div>

                <div className="space-y-1 flex-1">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Scholar Name</div>
                    <div className="text-sm font-bold text-white tracking-wide">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Matriculation ID</div>
                    <div className="text-xs font-mono text-emerald-300 font-bold">{user.matric}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Department</div>
                    <div className="text-[11px] text-slate-200">{user.dept}</div>
                  </div>
                </div>

                <div className="shrink-0 p-1.5 bg-white rounded-lg shadow">
                  <QrCode size={44} className="text-slate-900" />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-emerald-700/40 pt-2 flex justify-between items-center text-[8px] font-mono text-emerald-400">
                <span>EXPIRY: 30-NOV-2027</span>
                <span>STATUS: FULL BORROWING PRIVILEGES</span>
              </div>
            </div>
          ) : (
            /* Back of Card */
            <div className="w-[380px] sm:w-[440px] h-[250px] sm:h-[270px] rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-4 flex flex-col justify-between text-white font-sans">
              {/* Mag Stripe Mock */}
              <div className="w-full h-8 bg-black rounded-md -mx-4 mt-2"></div>

              <div className="space-y-1.5 text-[9px] text-slate-300 leading-relaxed px-1">
                <p>1. This digital smart card remains the property of the Federal Co-operative College, Ibadan.</p>
                <p>2. Must be presented for turnstile entrance, RFID self-checkout, and examination entry.</p>
                <p>3. If found, please return to the Office of the Chief College Librarian, Eleyele, Ibadan.</p>
              </div>

              {/* Barcode Mock */}
              <div className="p-2.5 bg-white rounded-xl text-center">
                <div className="font-mono text-black text-lg tracking-[6px] font-bold">
                  ||||| | |||| ||| |||||| | |||||
                </div>
                <div className="text-[9px] font-mono text-slate-800 font-bold">{user.matric}</div>
              </div>

              <div className="text-center text-[8px] text-slate-500 font-mono">
                AUTONOMOUS LSP NODE • 127.0.0.1:5173
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
