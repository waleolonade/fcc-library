import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag, Newspaper, Plus, Search, Filter, RefreshCw, CheckCircle2,
  Clock, AlertCircle, Trash2, Edit3, Printer, Download, Eye, FileText,
  DollarSign, Building2, BookOpen, Layers, Check, X, ChevronDown,
  Calendar, User, Tag, Sparkles, ExternalLink, ArrowUpDown, Truck, ShieldCheck
} from 'lucide-react';
import { libraryApi } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function AcquisitionsSerialsDesk({
  departments = [],
  currentUser = null,
  acquisitions: propAcquisitions = []
}) {
  const [activeSubTab, setActiveSubTab] = useState('acquisitions'); // 'acquisitions' | 'serials' | 'vendors'
  const [acquisitions, setAcquisitions] = useState(() => (Array.isArray(propAcquisitions) ? propAcquisitions : []));
  const [serials, setSerials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (Array.isArray(propAcquisitions) && propAcquisitions.length > 0 && acquisitions.length === 0) {
      setAcquisitions(propAcquisitions);
    }
  }, [propAcquisitions]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [voucherItem, setVoucherItem] = useState(null);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [editingSerial, setEditingSerial] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'acquisition'|'serial'|'vendor', item }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - clean without dummy or mock values
  const [orderForm, setOrderForm] = useState({
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    department: departments[0]?.name || 'General',
    requested_by: currentUser?.name || '',
    requester_role: currentUser?.role || 'Library Staff',
    cost: '',
    copies: 1,
    status: 'Pending Dean Approval',
    priority: 'Normal',
    justification: ''
  });

  const [serialForm, setSerialForm] = useState({
    title: '',
    issn: '',
    publisher: '',
    frequency: 'Quarterly',
    department: departments[0]?.name || 'General',
    latest_volume: '',
    latest_issue: '',
    holding_summary: '',
    subscription_status: 'Active Subscription'
  });

  const [vendorForm, setVendorForm] = useState({
    name: '',
    location: '',
    contact: '',
    email: '',
    specialty: '',
    rating: 'Tier-1 Approved'
  });

  const printRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    if (type === 'success') sounds?.playSuccessChime?.();
    else if (type === 'error') sounds?.playErrorBuzz?.();
    else sounds?.playClick?.();
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch live database records & backend computed stats directly from API
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, acqData, serData, venData] = await Promise.all([
        libraryApi.acquisitions.getStats().catch(() => null),
        libraryApi.acquisitions.getAll().catch(() => []),
        libraryApi.serials.getAll().catch(() => []),
        libraryApi.vendors.getAll().catch(() => [])
      ]);
      if (statsRes && statsRes.success) {
        setDbStats(statsRes);
      }
      if (Array.isArray(acqData)) {
        setAcquisitions(acqData);
      }
      if (Array.isArray(serData)) {
        setSerials(serData);
      }
      if (Array.isArray(venData)) {
        setVendors(venData);
      }
    } catch (err) {
      console.error('Error fetching acquisitions/serials/vendors:', err);
      showToast('Failed to load fresh database records', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live database KPIs fetched directly from database via backend API
  const displayKpis = useMemo(() => {
    const allocationBudget = Number(dbStats?.stacks_vote_allocation ?? 0);
    const totalCommittedCost = Number(dbStats?.committed_procurement ?? 0);
    const totalOrders = Number(dbStats?.total_requisitions ?? acquisitions.length);
    const deliveredCost = Number(dbStats?.delivered_cataloged_cost ?? 0);
    const deliveredCount = Number(dbStats?.delivered_cataloged_count ?? 0);
    const pendingCount = Number(dbStats?.pending_reviews_count ?? 0);
    const highPriorityCount = Number(dbStats?.high_priority_count ?? 0);
    const activeSerialsCount = Number(dbStats?.active_serials_count ?? 0);
    const totalSerialsCount = Number(dbStats?.total_serials_count ?? serials.length);
    const budgetUsedPercent = Number(dbStats?.budget_used_percent ?? 0);

    return {
      allocationBudget,
      totalCommittedCost,
      totalOrders,
      deliveredCost,
      deliveredCount,
      pendingCount,
      highPriorityCount,
      activeSerialsCount,
      totalSerialsCount,
      budgetUsedPercent,
      isLiveDb: Boolean(dbStats && dbStats.success)
    };
  }, [dbStats, acquisitions.length, serials.length]);


  // Filtered and Sorted Acquisitions
  const filteredAcquisitions = useMemo(() => {
    return acquisitions.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.author || '').toLowerCase().includes(q) ||
        (item.isbn || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q) ||
        (item.publisher || '').toLowerCase().includes(q) ||
        (item.requested_by || '').toLowerCase().includes(q);

      const matchesDept = selectedDept === 'ALL' || item.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;

      return matchesSearch && matchesDept && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date_requested || 0) - new Date(a.date_requested || 0);
      if (sortBy === 'date_asc') return new Date(a.date_requested || 0) - new Date(b.date_requested || 0);
      if (sortBy === 'cost_desc') return Number(b.cost_estimate_ngn || 0) - Number(a.cost_estimate_ngn || 0);
      if (sortBy === 'cost_asc') return Number(a.cost_estimate_ngn || 0) - Number(b.cost_estimate_ngn || 0);
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
  }, [acquisitions, searchTerm, selectedDept, selectedStatus, selectedPriority, sortBy]);

  // Filtered Serials
  const filteredSerials = useMemo(() => {
    return serials.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        (s.title || '').toLowerCase().includes(q) ||
        (s.issn || '').toLowerCase().includes(q) ||
        (s.publisher || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q);
      const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [serials, searchTerm, selectedDept]);

  // Fast inline status change with optional auto-cataloging
  const handleUpdateStatus = async (item, newStatus) => {
    try {
      sounds?.playClick?.();
      const res = await libraryApi.acquisitions.updateStatus(item.id, newStatus, 'Status updated via Acquisitions Desk', true);
      if (res && (res.success || res.status === 200 || res.ok)) {
        if (newStatus === 'Delivered & Cataloged') {
          showToast(`Order ${item.id} fulfilled and automatically cataloged into Central Library Stacks!`);
        } else {
          showToast(`Order ${item.id} status updated to: ${newStatus}`);
        }
        await fetchData();
      } else {
        showToast('Failed to update status in database', 'error');
      }
    } catch (err) {
      showToast('Network error while updating status', 'error');
    }
  };

  // Submit New or Edited Order
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...orderForm,
        cost: Number(String(orderForm.cost).replace(/[^0-9.]/g, '') || 0),
        copies: Number(orderForm.copies || 1),
        department: orderForm.department || (departments[0]?.name || 'General')
      };

      if (editingItem) {
        await libraryApi.acquisitions.update(editingItem.id, payload);
        showToast(`Order ${editingItem.id} updated in database!`);
      } else {
        await libraryApi.acquisitions.requestBook(payload);
        showToast(`Purchase order registered successfully!`);
      }
      setShowOrderModal(false);
      setEditingItem(null);
      await fetchData();
    } catch (err) {
      showToast('Failed to save acquisition order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New or Edited Serial
  const handleSaveSerial = async (e) => {
    e.preventDefault();
    if (!serialForm.title.trim()) {
      showToast('Journal title is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...serialForm,
        department: serialForm.department || (departments[0]?.name || 'General')
      };
      if (editingSerial) {
        await libraryApi.serials.update(editingSerial.id, payload);
        showToast(`Journal serial ${editingSerial.id} updated!`);
      } else {
        await libraryApi.serials.create(payload);
        showToast(`New journal serial registered in database!`);
      }
      setShowSerialModal(false);
      setEditingSerial(null);
      await fetchData();
    } catch (err) {
      showToast('Failed to save serial subscription', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New or Edited Vendor
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      showToast('Vendor name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingVendor) {
        await libraryApi.vendors.update(editingVendor.id, vendorForm);
        showToast(`Vendor ${vendorForm.name} updated in database!`);
      } else {
        await libraryApi.vendors.create(vendorForm);
        showToast(`New approved vendor registered in database!`);
      }
      setShowVendorModal(false);
      setEditingVendor(null);
      await fetchData();
    } catch (err) {
      showToast('Failed to save vendor to database', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update allocation budget in database
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const cleanAmount = Number(String(newBudgetInput).replace(/[^0-9.]/g, '') || 0);
    if (cleanAmount <= 0) {
      showToast('Please enter a valid budget allocation amount', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await libraryApi.acquisitions.updateBudget(cleanAmount);
      if (res && res.success) {
        showToast('Stacks vote budget allocation updated in database!');
        setShowBudgetModal(false);
        await fetchData();
      } else {
        showToast('Failed to update budget in database', 'error');
      }
    } catch (err) {
      showToast('Network error while updating budget', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === 'acquisition') {
        await libraryApi.acquisitions.delete(deleteTarget.item.id);
        showToast(`Order ${deleteTarget.item.id} removed from database.`);
      } else if (deleteTarget.type === 'serial') {
        await libraryApi.serials.delete(deleteTarget.item.id);
        showToast(`Serial ${deleteTarget.item.id} removed from database.`);
      } else if (deleteTarget.type === 'vendor') {
        await libraryApi.vendors.delete(deleteTarget.item.id);
        showToast(`Vendor ${deleteTarget.item.name} removed from database.`);
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      showToast('Failed to delete record from database', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    sounds?.playClick?.();
    const rows = [
      ['PO Number', 'Title', 'Author', 'Publisher', 'ISBN', 'Department', 'Requested By', 'Cost (NGN)', 'Copies', 'Status', 'Priority', 'Date']
    ];
    filteredAcquisitions.forEach(item => {
      rows.push([
        item.id,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.author || '').replace(/"/g, '""')}"`,
        `"${(item.publisher || '').replace(/"/g, '""')}"`,
        item.isbn || '',
        `"${(item.department || '').replace(/"/g, '""')}"`,
        `"${(item.requested_by || '').replace(/"/g, '""')}"`,
        item.cost_estimate_ngn || 0,
        item.copies_requested || 1,
        item.status || '',
        item.priority || '',
        item.date_requested || ''
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FCC_Library_Acquisitions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Procurement schedule exported to CSV!');
  };

  // Print PO Voucher
  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-2.5 text-xs font-bold transition-all transform animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-700'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Institutional Top Executive Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1526] to-slate-900 border border-slate-800/80 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                FCC Collection Development Directorate
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono flex items-center gap-1.5 ${
                displayKpis.isLiveDb
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${displayKpis.isLiveDb ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <ShieldCheck size={11} />
                <span>{displayKpis.isLiveDb ? 'Live Backend DB Synced' : 'TETFUND & Capital Budget Active'}</span>
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Fiscal Session {new Date().getFullYear()} / {new Date().getFullYear() + 1}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-inner">
                <ShoppingBag size={22} />
              </div>
              <span>Acquisitions &amp; Journal Serials Desk</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Centralized institutional procurement workflow for accredited academic textbooks, monographs, international journal subscriptions, and departmental purchase orders (POs) connected live to the college database.
            </p>
          </div>

          {/* Action Button Group */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh live data from database"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Export all acquisition orders to CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds?.playClick?.();
                setEditingItem(null);
                setOrderForm({
                  title: '',
                  author: '',
                  publisher: '',
                  isbn: '',
                  department: departments[0]?.name || 'General',
                  requested_by: currentUser?.name || '',
                  requester_role: currentUser?.role || 'Library Staff',
                  cost: '',
                  copies: 1,
                  status: 'Pending Dean Approval',
                  priority: 'Normal',
                  justification: ''
                });
                setShowOrderModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-700/30 border border-indigo-400/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Raise Purchase Order</span>
            </button>
          </div>
        </div>

        {/* Live Budget KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 relative group">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>Stacks Vote Allocation</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewBudgetInput(displayKpis.allocationBudget || '');
                    setShowBudgetModal(true);
                  }}
                  className="hover:text-emerald-400 text-slate-500 transition cursor-pointer p-0.5 rounded hover:bg-slate-800"
                  title="Edit allocation budget in database"
                >
                  <Edit3 size={11} />
                </button>
                <DollarSign size={12} className="text-emerald-400" />
              </div>
            </div>
            <div className="text-lg font-black text-white font-mono flex items-center justify-between">
              <span>₦{displayKpis.allocationBudget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${displayKpis.budgetUsedPercent}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">{displayKpis.isLiveDb ? '● DB Live' : 'Database'}</span>
              <span>{displayKpis.budgetUsedPercent}% Allocated</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>Committed Procurement</span>
              <ShoppingBag size={12} className="text-indigo-400" />
            </div>
            <div className="text-lg font-black text-indigo-300 font-mono">
              ₦{displayKpis.totalCommittedCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {displayKpis.totalOrders} Requisitions Total
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>Delivered &amp; Cataloged</span>
              <Truck size={12} className="text-teal-400" />
            </div>
            <div className="text-lg font-black text-teal-300 font-mono">
              ₦{displayKpis.deliveredCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-400/80 font-bold truncate">
              {displayKpis.deliveredCount > 0 ? `${displayKpis.deliveredCount} Fulfilled & Integrated` : 'Integrated into Central Stacks'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>Pending Reviews</span>
              <Clock size={12} className="text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">
              {displayKpis.pendingCount}
            </div>
            <div className="text-[10px] text-amber-400/80">
              {displayKpis.highPriorityCount} High/Urgent Priority
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
              <span>Journal Serials</span>
              <Newspaper size={12} className="text-purple-400" />
            </div>
            <div className="text-lg font-black text-purple-300 font-mono">
              {displayKpis.activeSerialsCount} Active
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {displayKpis.totalSerialsCount} Registered Publications
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { sounds?.playClick?.(); setActiveSubTab('acquisitions'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'acquisitions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Book Acquisitions &amp; POs</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'acquisitions' ? 'bg-indigo-900/60 text-indigo-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {acquisitions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { sounds?.playClick?.(); setActiveSubTab('serials'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'serials'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Newspaper size={14} />
            <span>Journal Serials &amp; Periodicals</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'serials' ? 'bg-purple-900/60 text-purple-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {serials.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { sounds?.playClick?.(); setActiveSubTab('vendors'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'vendors'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Approved Vendors ({vendors.length})</span>
          </button>
        </div>

        {/* View Mode Toggle when on acquisitions */}
        {activeSubTab === 'acquisitions' && (
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Matrix Card View"
            >
              <Layers size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Dense Data Table"
            >
              <FileText size={14} />
            </button>
          </div>
        )}

        {activeSubTab === 'serials' && (
          <button
            type="button"
            onClick={() => {
              sounds?.playClick?.();
              setEditingSerial(null);
              setSerialForm({
                title: '',
                issn: '',
                publisher: '',
                frequency: 'Quarterly',
                department: departments[0]?.name || 'General',
                latest_volume: '',
                latest_issue: '',
                holding_summary: '',
                subscription_status: 'Active Subscription'
              });
              setShowSerialModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={14} />
            <span>+ Add Journal Serial</span>
          </button>
        )}

        {activeSubTab === 'vendors' && (
          <button
            type="button"
            onClick={() => {
              sounds?.playClick?.();
              setEditingVendor(null);
              setVendorForm({
                name: '',
                location: '',
                contact: '',
                email: '',
                specialty: '',
                rating: 'Tier-1 Approved'
              });
              setShowVendorModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={14} />
            <span>+ Register Approved Vendor</span>
          </button>
        )}
      </div>

      {/* FILTER AND SEARCH BAR (Only for Acquisitions & Serials) */}
      {(activeSubTab === 'acquisitions' || activeSubTab === 'serials') && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={activeSubTab === 'acquisitions'
                  ? "Search by Book Title, Author, ISBN, PO #, Publisher or Requester..."
                  : "Search journals by Title, ISSN, Publisher or Department..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d.code || d.name} value={d.name}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Status & Priority Filter (Acquisitions specific) */}
            {activeSubTab === 'acquisitions' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending Dean Approval">Pending Dean Approval</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Delivered & Cataloged">Delivered &amp; Cataloged</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans font-mono"
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="cost_desc">Cost (Highest)</option>
                    <option value="cost_asc">Cost (Lowest)</option>
                    <option value="title_asc">Title (A-Z)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 1: ACQUISITIONS ORDERS (GRID / TABLE) */}
      {/* ============================================================== */}
      {activeSubTab === 'acquisitions' && (
        <div className="space-y-4">
          {filteredAcquisitions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-3">
              <ShoppingBag size={36} className="mx-auto text-slate-600" />
              <h3 className="text-sm font-bold text-slate-300">No Acquisition Orders Matching Filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No departmental purchase requisitions match your current search query or filter. Click "+ Raise Purchase Order" to register a new textbook acquisition.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAcquisitions.map((item) => {
                const costVal = Number(item.cost_estimate_ngn || item.cost || 0);
                const isDelivered = item.status === 'Delivered & Cataloged' || item.status === 'Delivered';
                const isApproved = item.status === 'Approved';
                const isReview = item.status === 'Under Review';
                const isRejected = item.status === 'Rejected';

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#07101f] border border-slate-800/90 hover:border-indigo-500/50 transition-all duration-300 space-y-3.5 shadow-xl relative group"
                  >
                    {/* Top Row: PO Badge, Priority, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                            {item.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            item.priority === 'High' || item.priority === 'Urgent'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.priority || 'Normal'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.date_requested || 'Recent'}
                          </span>
                        </div>
                      </div>

                      {/* Status Dropdown Indicator */}
                      <select
                        value={item.status || 'Pending Dean Approval'}
                        onChange={(e) => handleUpdateStatus(item, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition font-mono ${
                          isDelivered ? 'bg-teal-950 text-teal-300 border-teal-700' :
                          isApproved ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                          isReview ? 'bg-amber-950 text-amber-300 border-amber-700' :
                          isRejected ? 'bg-rose-950 text-rose-300 border-rose-700' :
                          'bg-indigo-950 text-indigo-300 border-indigo-700'
                        }`}
                      >
                        <option value="Pending Dean Approval">Pending Dean Approval</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Delivered & Cataloged">Delivered &amp; Cataloged</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white font-sans leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      {item.author && (
                        <div className="text-xs text-slate-300 font-medium">
                          by {item.author}
                        </div>
                      )}
                      {item.publisher && (
                        <div className="text-[11px] text-slate-400 truncate">
                          Publisher: <span className="text-slate-300">{item.publisher}</span>
                        </div>
                      )}
                      {item.isbn && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          ISBN: {item.isbn}
                        </div>
                      )}
                    </div>

                    {/* Requester & Department Quote */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                        <span>Requester</span>
                        <span className="text-cyan-400">{item.department || 'General'}</span>
                      </div>
                      <div className="text-white font-bold text-xs truncate">
                        {item.requested_by || 'Staff'}
                        {item.requester_role ? <span className="text-slate-400 font-normal ml-1">({item.requester_role})</span> : null}
                      </div>
                      {item.justification && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-2 pt-0.5">
                          "{item.justification}"
                        </p>
                      )}
                    </div>

                    {/* Financial & Quantities Summary */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Cost Estimate</div>
                        <div className="font-mono text-base font-black text-emerald-400">
                          ₦{costVal.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Copies</div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {item.copies_requested || item.copies || 1} copies
                        </span>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setVoucherItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/80 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="View Official Purchase Order Voucher"
                      >
                        <Printer size={12} />
                        <span>PO Voucher</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setOrderForm({
                              title: item.title || '',
                              author: item.author || '',
                              publisher: item.publisher || '',
                              isbn: item.isbn || '',
                              department: item.department || '',
                              requested_by: item.requested_by || '',
                              requester_role: item.requester_role || 'Faculty',
                              cost: item.cost_estimate_ngn || item.cost || '',
                              copies: item.copies_requested || item.copies || 1,
                              status: item.status || 'Pending Dean Approval',
                              priority: item.priority || 'High',
                              justification: item.justification || ''
                            });
                            setShowOrderModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                          title="Edit Order Details"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'acquisition', item })}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs transition cursor-pointer"
                          title="Cancel/Delete Purchase Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="rounded-2xl bg-[#07101f] border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">PO Number</th>
                      <th className="py-3 px-3">Book &amp; Author</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Requester</th>
                      <th className="py-3 px-3 text-right">Cost (NGN)</th>
                      <th className="py-3 px-3 text-center">Copies</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAcquisitions.map((item) => {
                      const costVal = Number(item.cost_estimate_ngn || item.cost || 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                            {item.id}
                          </td>
                          <td className="py-3 px-3 max-w-[220px]">
                            <div className="font-bold text-white truncate">{item.title}</div>
                            {item.author && <div className="text-[11px] text-slate-400 truncate">{item.author}</div>}
                            {item.isbn && <div className="text-[10px] text-slate-500 font-mono">{item.isbn}</div>}
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 font-mono">
                              {item.department || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            <div>{item.requested_by}</div>
                            <div className="text-[10px] text-slate-500">{item.requester_role}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-right">
                            ₦{costVal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                            {item.copies_requested || item.copies || 1}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={item.status || 'Pending Dean Approval'}
                              onChange={(e) => handleUpdateStatus(item, e.target.value)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 cursor-pointer font-mono"
                            >
                              <option value="Pending Dean Approval">Pending Dean Approval</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Delivered & Cataloged">Delivered &amp; Cataloged</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setVoucherItem(item)}
                                className="p-1.5 rounded bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700 text-xs cursor-pointer"
                                title="PO Voucher"
                              >
                                <Printer size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem(item);
                                  setOrderForm({
                                    title: item.title || '',
                                    author: item.author || '',
                                    publisher: item.publisher || '',
                                    isbn: item.isbn || '',
                                    department: item.department || '',
                                    requested_by: item.requested_by || '',
                                    requester_role: item.requester_role || 'Faculty',
                                    cost: item.cost_estimate_ngn || item.cost || '',
                                    copies: item.copies_requested || item.copies || 1,
                                    status: item.status || 'Pending Dean Approval',
                                    priority: item.priority || 'High',
                                    justification: item.justification || ''
                                  });
                                  setShowOrderModal(true);
                                }}
                                className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'acquisition', item })}
                                className="p-1.5 rounded bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 text-xs cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: JOURNAL SERIALS & PERIODICALS */}
      {/* ============================================================== */}
      {activeSubTab === 'serials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Federally accredited print &amp; digital periodicals, peer-reviewed journals, and agricultural magazines subscribed by the college library.
            </p>
          </div>

          {filteredSerials.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-3">
              <Newspaper size={36} className="mx-auto text-slate-600" />
              <h3 className="text-sm font-bold text-slate-300">No Journal Serials Registered</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active periodical or journal subscriptions found. Click "+ Add Journal Serial" to register a new subscription.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSerials.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-[#07101f] border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      {s.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      s.subscription_status?.toLowerCase().includes('active')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {s.subscription_status || 'Active'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white font-sans line-clamp-2">
                      {s.title}
                    </h4>
                    <div className="text-xs text-purple-300 font-mono font-bold">
                      ISSN: {s.issn}
                    </div>
                    {s.publisher && (
                      <div className="text-[11px] text-slate-400 truncate">
                        Publisher: <span className="text-slate-300">{s.publisher}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Frequency: <strong className="text-white">{s.frequency || 'Quarterly'}</strong></span>
                      <span className="text-cyan-400 font-bold">{s.department || 'General'}</span>
                    </div>
                    {(s.latest_volume || s.latest_issue) && (
                      <div className="text-[11px] text-slate-200">
                        Latest: <strong className="text-white">{s.latest_volume}</strong> {s.latest_issue ? `(${s.latest_issue})` : ''}
                      </div>
                    )}
                    {s.holding_summary && (
                      <div className="text-[10px] text-slate-400 italic truncate pt-0.5">
                        {s.holding_summary}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                      {s.holding_summary || 'Serial Bay'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSerial(s);
                          setSerialForm({
                            title: s.title || '',
                            issn: s.issn || '',
                            publisher: s.publisher || '',
                            frequency: s.frequency || 'Quarterly',
                            department: s.department || '',
                            latest_volume: s.latest_volume || '',
                            latest_issue: s.latest_issue || '',
                            holding_summary: s.holding_summary || '',
                            subscription_status: s.subscription_status || 'Active Subscription'
                          });
                          setShowSerialModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                        title="Edit Serial"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'serial', item: s })}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs transition cursor-pointer"
                        title="Delete Serial"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: APPROVED VENDORS & PUBLISHERS DIRECTORY (FROM DB) */}
      {/* ============================================================== */}
      {activeSubTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-400">
              Approved publishing houses, accredited book vendors, and subscription contractors managed live in central database.
            </p>
          </div>

          {vendors.length === 0 ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-3">
              <Building2 size={36} className="mx-auto text-slate-600" />
              <h3 className="text-sm font-bold text-slate-300">No Approved Vendors in Database</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No vendors are currently registered. Click "+ Register Approved Vendor" to store accredited book suppliers and publishers in the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((v) => (
                <div
                  key={v.id || v.name}
                  className="p-5 rounded-2xl bg-[#07101f] border border-slate-800 hover:border-teal-500/50 transition-all space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 size={16} className="text-teal-400 shrink-0" />
                      <span className="line-clamp-1">{v.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-teal-950 text-teal-300 border border-teal-700 shrink-0">
                      {v.rating || 'Tier-1 Approved'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    {v.location && <div className="text-slate-400 text-[11px] truncate">{v.location}</div>}
                    {v.contact && <div className="font-mono text-cyan-300 text-[11px]">{v.contact}</div>}
                    {v.email && <div className="text-slate-400 text-[10px] font-mono truncate">{v.email}</div>}
                  </div>

                  {v.specialty && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Specialty</div>
                      <div className="line-clamp-2">{v.specialty}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(null);
                        setOrderForm(prev => ({
                          ...prev,
                          publisher: v.name
                        }));
                        setShowOrderModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Raise PO</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVendor(v);
                          setVendorForm({
                            name: v.name || '',
                            location: v.location || '',
                            contact: v.contact || '',
                            email: v.email || '',
                            specialty: v.specialty || '',
                            rating: v.rating || 'Tier-1 Approved'
                          });
                          setShowVendorModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                        title="Edit Vendor"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'vendor', item: v })}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs transition cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: RAISE / EDIT PURCHASE ORDER */}
      {/* ============================================================== */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#050e1c] border-2 border-indigo-500 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? `Edit Purchase Order (${editingItem.id})` : 'Raise New Acquisition Order'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Direct integration with centralized library stacks and financial procurement record
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowOrderModal(false); setEditingItem(null); }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Book Title / Monograph Heading *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.title}
                    onChange={(e) => setOrderForm({ ...orderForm, title: e.target.value })}
                    placeholder="e.g. Modern Principles of Agricultural Co-operatives"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Author(s) / Editor(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.author}
                    onChange={(e) => setOrderForm({ ...orderForm, author: e.target.value })}
                    placeholder="e.g. Prof. O. A. Adewale"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Publisher / Vendor
                  </label>
                  <input
                    type="text"
                    list="dbVendorList"
                    value={orderForm.publisher}
                    onChange={(e) => setOrderForm({ ...orderForm, publisher: e.target.value })}
                    placeholder="Select from approved vendors or enter publisher"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  />
                  <datalist id="dbVendorList">
                    {vendors.map((v) => (
                      <option key={v.id || v.name} value={v.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    ISBN (10 or 13-digit)
                  </label>
                  <input
                    type="text"
                    value={orderForm.isbn}
                    onChange={(e) => setOrderForm({ ...orderForm, isbn: e.target.value })}
                    placeholder="e.g. 978-978-030-992-1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-cyan-300 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Department Assignment
                  </label>
                  <select
                    value={orderForm.department}
                    onChange={(e) => setOrderForm({ ...orderForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  >
                    {departments.map(d => (
                      <option key={d.code || d.name} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                    <option value="General">General Studies &amp; Reference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Cost Estimate (NGN ₦)
                  </label>
                  <input
                    type="text"
                    value={orderForm.cost}
                    onChange={(e) => setOrderForm({ ...orderForm, cost: e.target.value })}
                    placeholder="e.g. 150000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Copies Requested
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={orderForm.copies}
                    onChange={(e) => setOrderForm({ ...orderForm, copies: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Requested By
                  </label>
                  <input
                    type="text"
                    value={orderForm.requested_by}
                    onChange={(e) => setOrderForm({ ...orderForm, requested_by: e.target.value })}
                    placeholder="e.g. Dr. K. E. Okonjo - HOD"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Accreditation Requirement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Procurement Status
                  </label>
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans"
                  >
                    <option value="Pending Dean Approval">Pending Dean Approval</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Delivered & Cataloged">Delivered &amp; Cataloged</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                  Curriculum Justification / Memo Note
                </label>
                <textarea
                  rows="2"
                  value={orderForm.justification}
                  onChange={(e) => setOrderForm({ ...orderForm, justification: e.target.value })}
                  placeholder="e.g. Required textbook for HND II Cooperative Accounting Accreditation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-indigo-400 font-sans resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowOrderModal(false); setEditingItem(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Update Order' : 'Commit Order to DB'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: NEW / EDIT JOURNAL SERIAL */}
      {/* ============================================================== */}
      {showSerialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[#050e1c] border-2 border-purple-500 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-purple-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-700">
                  <Newspaper size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSerial ? `Edit Journal Serial (${editingSerial.id})` : 'Register Journal Serial / Periodical'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Manage continuous subscriptions, ISSN control, and physical shelf holdings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSerialModal(false); setEditingSerial(null); }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSerial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                  Journal / Periodical Title *
                </label>
                <input
                  type="text"
                  required
                  value={serialForm.title}
                  onChange={(e) => setSerialForm({ ...serialForm, title: e.target.value })}
                  placeholder="e.g. African Journal of Cooperative Studies & Rural Finance"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    ISSN *
                  </label>
                  <input
                    type="text"
                    required
                    value={serialForm.issn}
                    onChange={(e) => setSerialForm({ ...serialForm, issn: e.target.value })}
                    placeholder="e.g. 1597-2844"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Frequency
                  </label>
                  <select
                    value={serialForm.frequency}
                    onChange={(e) => setSerialForm({ ...serialForm, frequency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-sans"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-monthly">Bi-monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-annual">Bi-annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Publisher / Press
                  </label>
                  <input
                    type="text"
                    list="dbVendorList"
                    value={serialForm.publisher}
                    onChange={(e) => setSerialForm({ ...serialForm, publisher: e.target.value })}
                    placeholder="e.g. Academic Press or select from vendors"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Department
                  </label>
                  <select
                    value={serialForm.department}
                    onChange={(e) => setSerialForm({ ...serialForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-sans"
                  >
                    {departments.map(d => (
                      <option key={d.code || d.name} value={d.name}>{d.name} ({d.code})</option>
                    ))}
                    <option value="General">General Studies &amp; Reference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Latest Volume
                  </label>
                  <input
                    type="text"
                    value={serialForm.latest_volume}
                    onChange={(e) => setSerialForm({ ...serialForm, latest_volume: e.target.value })}
                    placeholder="e.g. Vol. 28 No. 3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={serialForm.subscription_status}
                    onChange={(e) => setSerialForm({ ...serialForm, subscription_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-sans"
                  >
                    <option value="Active Subscription">Active Subscription</option>
                    <option value="Pending Renewal">Pending Renewal</option>
                    <option value="Lapsed / Ceased">Lapsed / Ceased</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                  Physical Holdings Location Summary
                </label>
                <input
                  type="text"
                  value={serialForm.holding_summary}
                  onChange={(e) => setSerialForm({ ...serialForm, holding_summary: e.target.value })}
                  placeholder="e.g. All physical holdings intact in Serials Room, Bay 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-400 font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowSerialModal(false); setEditingSerial(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSerial ? 'Update Serial' : 'Save Serial Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: OFFICIAL PURCHASE ORDER VOUCHER (PRINTABLE) */}
      {/* ============================================================== */}
      {voucherItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-7 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none">
            {/* Header / Action Buttons */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <span className="text-xs font-mono font-bold text-slate-500">
                OFFICIAL PROCUREMENT DOCUMENT
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintVoucher}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer size={14} />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherItem(null)}
                  className="text-slate-500 hover:text-black p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Voucher Body */}
            <div ref={printRef} className="space-y-6 text-slate-900 font-sans">
              {/* College Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <div className="text-[11px] font-mono tracking-widest text-slate-600 uppercase">
                  Federal Republic of Nigeria
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Federal Co-operative College, Ibadan
                </h2>
                <div className="text-xs font-serif text-slate-700 italic">
                  Directorate of Library Services &bull; Stacks Procurement Division &bull; P.M.B. 5033, Eleyele
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded bg-slate-100 border border-slate-300 font-mono text-xs font-bold tracking-wider">
                  OFFICIAL ACQUISITION PURCHASE ORDER VOUCHER
                </div>
              </div>

              {/* Order Meta Table */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div><strong>PO Reference:</strong> <span className="font-mono text-indigo-700 font-bold">{voucherItem.id}</span></div>
                  <div><strong>Date Requested:</strong> {voucherItem.date_requested || new Date().toISOString().slice(0, 10)}</div>
                  <div><strong>Status:</strong> <span className="font-bold uppercase text-emerald-700">{voucherItem.status}</span></div>
                  <div><strong>Priority:</strong> {voucherItem.priority || 'Normal'}</div>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div><strong>Allocated Dept:</strong> {voucherItem.department || 'General'}</div>
                  <div><strong>Requester:</strong> {voucherItem.requested_by} ({voucherItem.requester_role})</div>
                  <div><strong>Authorized Vendor:</strong> {voucherItem.publisher || 'Direct Procurement'}</div>
                  <div><strong>Fiscal Year:</strong> {new Date().getFullYear()}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700 font-mono text-[10px] uppercase">
                    <th className="py-2 px-2">Item Description / Monograph</th>
                    <th className="py-2 px-2">ISBN</th>
                    <th className="py-2 px-2 text-center">Copies</th>
                    <th className="py-2 px-2 text-right">Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{voucherItem.title}</div>
                      <div className="text-[11px] text-slate-600">Author: {voucherItem.author}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        Memo: {voucherItem.justification || 'Curriculum delivery'}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-700">
                      {voucherItem.isbn || '—'}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold">
                      {voucherItem.copies_requested || voucherItem.copies || 1}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      ₦{Number(voucherItem.cost_estimate_ngn || voucherItem.cost || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold bg-slate-50">
                    <td colSpan="3" className="py-2.5 px-2 text-right uppercase font-mono text-xs">
                      Total Authorized Vote:
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-sm text-emerald-800">
                      ₦{Number(voucherItem.cost_estimate_ngn || voucherItem.cost || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Authorization Block */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
                <div className="space-y-4">
                  <div className="text-[11px] font-bold uppercase text-slate-600">Recommending Officer:</div>
                  <div className="h-10 border-b border-dashed border-slate-400" />
                  <div className="text-[10px] text-slate-600">
                    Head of Department / Requisitioner<br />
                    Date: ....................................................
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[11px] font-bold uppercase text-slate-600">Approval &amp; Audit Seal:</div>
                  <div className="h-10 border-b border-dashed border-slate-400" />
                  <div className="text-[10px] text-slate-600">
                    College Librarian / Bursary Vote Controller<br />
                    Federal Co-operative College, Ibadan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: REGISTER / EDIT VENDOR IN DATABASE */}
      {/* ============================================================== */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#050e1c] border-2 border-teal-500 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-teal-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-900/60 text-teal-300 border border-teal-700">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingVendor ? `Edit Vendor (${editingVendor.name})` : 'Register Approved Vendor in DB'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Store book vendors, university presses, and subscription contractors in central database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowVendorModal(false); setEditingVendor(null); }}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                  Vendor / Publisher Name *
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. University Press Plc, Ibadan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={vendorForm.contact}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
                    placeholder="e.g. +234 803 322 1190"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="e.g. orders@press.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Office / Warehouse Location
                  </label>
                  <input
                    type="text"
                    value={vendorForm.location}
                    onChange={(e) => setVendorForm({ ...vendorForm, location: e.target.value })}
                    placeholder="e.g. Three Crowns Building, Jericho, Ibadan"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Specialty / Category
                  </label>
                  <input
                    type="text"
                    value={vendorForm.specialty}
                    onChange={(e) => setVendorForm({ ...vendorForm, specialty: e.target.value })}
                    placeholder="e.g. Academic Monographs & Curriculum"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold uppercase text-[10px] mb-1">
                    Institutional Rating
                  </label>
                  <select
                    value={vendorForm.rating}
                    onChange={(e) => setVendorForm({ ...vendorForm, rating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-400 font-sans"
                  >
                    <option value="Tier-1 Approved">Tier-1 Approved</option>
                    <option value="Tier-2 Registered">Tier-2 Registered</option>
                    <option value="Global Consortia Partner">Global Consortia Partner</option>
                    <option value="Internal Press">Internal Press</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowVendorModal(false); setEditingVendor(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to DB...' : editingVendor ? 'Update Vendor' : 'Save Vendor to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ============================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#050e1c] border-2 border-rose-500 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 border-b border-rose-900/60 pb-3">
              <AlertCircle size={20} />
              <h3 className="text-sm font-bold uppercase text-rose-200">
                Confirm Database Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete {deleteTarget.type === 'acquisition' ? 'purchase order' : deleteTarget.type === 'serial' ? 'journal serial' : 'vendor'}{' '}
              <strong className="text-white font-mono">{deleteTarget.item.id || deleteTarget.item.name}</strong>{' '}
              {deleteTarget.item.title ? <span>(<em>"{deleteTarget.item.title}"</em>)</span> : null}? This action will remove the record directly from the database.
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: EDIT BUDGET ALLOCATION IN DATABASE */}
      {/* ============================================================== */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#050e1c] border-2 border-emerald-500 rounded-3xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <DollarSign size={20} />
                <h3 className="text-sm font-bold uppercase text-emerald-200">
                  Update Stacks Vote Allocation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Set the total institutional stacks vote procurement budget for the central library. This value is saved directly to the database in <code className="text-emerald-300 font-mono">library_settings</code>.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Allocation Budget (NGN ₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    required
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    placeholder="e.g. 15000000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving to DB...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
