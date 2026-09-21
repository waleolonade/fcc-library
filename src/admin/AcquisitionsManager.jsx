import React, { useState } from 'react';
import { ShoppingBag, Plus, CheckCircle2, Clock, Building, DollarSign, Sparkles } from 'lucide-react';
import { INITIAL_ACQUISITIONS } from '../data/institutionalSeedData';

export default function AcquisitionsManager() {
  const [acquisitions, setAcquisitions] = useState(INITIAL_ACQUISITIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDept, setNewDept] = useState('CEM');

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `PO-2026-0${acquisitions.length + 85}`,
      title: newTitle,
      vendor: newVendor,
      budget: Number(newBudget),
      status: 'Approved',
      requestedBy: `Dept Head - ${newDept}`,
      date: new Date().toISOString().split('T')[0]
    };
    setAcquisitions([newOrder, ...acquisitions]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewVendor('');
    setNewBudget('');
  };

  const handleApprove = (id) => {
    setAcquisitions(acquisitions.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
  };

  const totalCommitted = acquisitions.reduce((acc, a) => acc + a.budget, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-indigo-400" />
            Acquisitions & Fiscal Ledger
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Library Acquisitions & Purchase Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage vendor book procurement, departmental fund allocations, and receiving workflows.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition"
        >
          <Plus size={15} /> Create Purchase Order
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Committed Procurement</div>
          <div className="text-2xl font-black text-white mt-1">₦{totalCommitted.toLocaleString()}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Active Orders in Pipeline</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{acquisitions.length} Purchase Orders</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Registered Institutional Vendors</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">12 Approved Vendors</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs font-bold text-slate-300">
          <span>Active Purchase Orders</span>
          <span className="text-slate-500 font-mono">FY 2026 CAPEX ALLOCATION</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {acquisitions.map(order => (
            <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400">{order.id}</span>
                  <span className="text-slate-400">• {order.date}</span>
                  <span className="text-slate-500">Requested by: {order.requestedBy}</span>
                </div>
                <div className="font-bold text-white text-sm">{order.title}</div>
                <div className="text-slate-400">Vendor: <strong className="text-slate-200">{order.vendor}</strong></div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400 text-sm">₦{order.budget.toLocaleString()}</div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.status === 'Approved' || order.status === 'Delivered & Cataloged'
                      ? 'bg-emerald-950 text-emerald-300'
                      : 'bg-amber-950 text-amber-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {order.status === 'Under Review' && (
                  <button
                    onClick={() => handleApprove(order.id)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                  >
                    Authorize
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white">Create Acquisition Purchase Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Resource Title & Quantity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Agronomic Practices (6 copies)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Approved Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spectrum Books Ltd, Ibadan"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Estimated Budget (₦)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 185000"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="CEM">CEM</option>
                    <option value="CSC">CSC</option>
                    <option value="BNF">BNF</option>
                    <option value="AGR">AGR</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  Generate PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
