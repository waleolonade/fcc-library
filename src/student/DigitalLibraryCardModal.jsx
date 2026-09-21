import React, { useState } from 'react';
import {
  X, QrCode, Download, Share2, Shield, CheckCircle,
  Smartphone, Sparkles, Printer, Copy, Check
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { sounds } from '../utils/soundEffects';

export default function DigitalLibraryCardModal({ user, onClose }) {
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [walletAdded, setWalletAdded] = useState(false);

  const handleAddToWallet = () => {
    setWalletAdded(true);
    sounds.playSuccessChime();
    setTimeout(() => setWalletAdded(false), 3000);
  };

  const handlePrint = () => {
    sounds.playSuccessChime();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Digital Institutional Library Card</h3>
              <p className="text-[11px] text-emerald-400 font-mono">Official Turnstile & Self-Service Token</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* High-Fidelity Smart PVC Card Preview */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 border-2 border-emerald-500/40 p-6 sm:p-7 shadow-2xl text-white space-y-5">
          {/* Card Top Brand */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-xl text-slate-950 font-serif">
                FCC
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider">{INSTITUTION.shortName}</div>
                <div className="text-[9px] text-emerald-300 font-mono">SMART SCHOLAR CARD</div>
              </div>
            </div>

            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono font-bold">
              RFID / NFC ENABLED
            </span>
          </div>

          {/* Middle Body: Photo & Details */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-slate-800 border-2 border-emerald-400/60 overflow-hidden shrink-0 shadow-lg">
              <img
                src={user?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-base font-black tracking-tight">{user?.name || 'Wale Olonade'}</div>
              <div className="text-emerald-400 font-mono font-bold">{user?.matric || 'FCC/CEM/2024/042'}</div>
              <div className="text-[11px] text-slate-300 truncate">{user?.department || 'Co-operative Economics'}</div>
              <div className="text-[10px] text-indigo-300 font-mono">{user?.level || 'HND II'} • {user?.faculty || 'Management Sciences'}</div>
              <div className="text-[10px] text-slate-400 font-mono">Valid Thru: <strong className="text-slate-200">{user?.validUntil || '2027-11-30'}</strong></div>
            </div>
          </div>

          {/* Bottom Barcode & QR Code Section */}
          <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between gap-3">
            {/* Simulated 1D Barcode */}
            <div className="space-y-1">
              <div className="flex items-center h-8 gap-0.5 bg-white p-1 rounded">
                {[4, 2, 6, 3, 5, 2, 7, 4, 3, 6, 2, 5, 4, 7, 3, 5, 2, 6, 3, 4, 2, 7, 5, 3].map((w, i) => (
                  <div key={i} className="h-full bg-black" style={{ width: `${w * 1.2}px` }}></div>
                ))}
              </div>
              <div className="text-[9px] font-mono text-center tracking-widest text-slate-400">
                {user?.libraryId || 'LIB-FCC-42091'}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-1.5 bg-white rounded-xl shadow-lg shrink-0 cursor-pointer" onClick={() => setShowQrExpanded(!showQrExpanded)}>
              <QrCode size={36} className="text-slate-950" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToWallet}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
            >
              <Smartphone size={15} className="text-emerald-400" />
              <span>{walletAdded ? '✓ Added to Apple/Google Wallet' : 'Add to Wallet'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition"
            >
              <Printer size={15} /> Print PVC Card
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">Offline Cached Token ✓</span>
        </div>
      </div>
    </div>
  );
}
