import React, { useState } from 'react';
import {
  FileText, CheckCircle, XCircle, Clock, ShoppingBag,
  Award, Shield, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function AdminApprovalCenter({
  theses,
  acquisitions,
  onApproveThesis,
  onRejectThesis,
  onApproveAcquisition
}) {
  const [activeTab, setActiveTab] = useState('theses'); // 'theses' | 'acquisitions'

  const pendingTheses = theses.filter(t => t.status === 'Submitted' || t.status === 'Under Review');
  const pendingAcquisitions = acquisitions.filter(a => a.status === 'Under Review' || a.status === 'Requested');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
            EXECUTIVE WORKFLOW & GOVERNANCE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Central Approvals Queue</h2>
          <p className="text-xs text-slate-400">
            Review student dissertation repository submissions, book acquisition orders, and cataloging changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('theses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'theses' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'
            }`}
          >
            <FileText size={15} />
            <span>Theses ({pendingTheses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('acquisitions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'acquisitions' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-950 border border-slate-800 text-slate-400'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Acquisitions ({pendingAcquisitions.length})</span>
          </button>
        </div>
      </div>

      {/* 1. THESIS & DISSERTATION APPROVALS */}
      {activeTab === 'theses' && (
        <div className="space-y-4">
          {pendingTheses.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
              All student theses submissions have been reviewed and published!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTheses.map(thesis => (
                <div
                  key={thesis.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-600/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-800">
                        {thesis.degree}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded-md border border-amber-800">
                        {thesis.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{thesis.title}</h3>
                    <p className="text-xs text-slate-400">
                      Scholar: <strong className="text-white">{thesis.author}</strong> ({thesis.matric}) • Advisor: {thesis.advisor}
                    </p>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {thesis.abstract}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onRejectThesis(thesis.id);
                        sounds.playClick();
                        alert(`Requested revisions on "${thesis.title}"`);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-semibold border border-slate-700 transition"
                    >
                      Request Revisions
                    </button>

                    <button
                      onClick={() => {
                        onApproveThesis(thesis.id);
                        sounds.playSuccessChime();
                        alert(`Approved and Published "${thesis.title}" to Institutional Repository!`);
                      }}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <Check size={14} /> Approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ACQUISITION PROCUREMENT APPROVALS */}
      {activeTab === 'acquisitions' && (
        <div className="space-y-4">
          {pendingAcquisitions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
              All acquisition procurement requests are currently processed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAcquisitions.map(acq => (
                <div
                  key={acq.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-600/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-mono font-bold bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        REQ ID: {acq.id}
                      </span>
                      <span className="font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                        {acq.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{acq.title}</h3>
                    <p className="text-xs text-slate-400">
                      Author: <strong className="text-white">{acq.author || 'Academic Author'}</strong> • Requested by: {acq.requestedBy}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                      <span>Budget: <strong className="text-emerald-400 font-bold">₦{(acq.budget || 45000).toLocaleString()}</strong></span>
                      <span>Vendor: {acq.vendor || 'CSS Bookshops'}</span>
                      <span>Date: {acq.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onApproveAcquisition(acq.id);
                        sounds.playSuccessChime();
                        alert(`Approved purchase order for "${acq.title}"`);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition"
                    >
                      <Check size={14} /> Approve Purchase Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
