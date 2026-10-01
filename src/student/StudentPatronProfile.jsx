import React, { useState } from 'react';
import {
  User, QrCode, Barcode, Clock, Bookmark, History, Bell,
  CreditCard, ShieldCheck, CheckCircle2, AlertTriangle, Key,
  Mail, Phone, Building, GraduationCap, Edit3, Save, RefreshCw,
  Printer, ArrowRight, ExternalLink, Sparkles, BookOpen, Layers
} from 'lucide-react';
import { INSTITUTION } from '../data/institutionalSeedData';
import { BarcodeSvg, QrCodeSvg } from '../common/BarcodeQrStudio';
import { sounds } from '../utils/soundEffects';
import PaymentModal from './PaymentModal';
import TraceBadge from '../common/TraceBadge';

export default function StudentPatronProfile({
  user,
  loans = [],
  books = [],
  onRenewLoan,
  onPayFine,
  onOpenReader
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  // 'overview' | 'loans' | 'reservations' | 'fines' | 'history' | 'saved' | 'reading' | 'notifications' | 'settings'

  // Editable Profile fields
  const [profilePhoto, setProfilePhoto] = useState(
    user?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );
  const [phone, setPhone] = useState(user?.phone || '+234 803 456 7890');
  const [email, setEmail] = useState(user?.email || `${(user?.matric || 'fcc042').toLowerCase().replace(/[^a-z0-9]/g, '')}@student.fccibadan.edu.ng`);
  const [pin, setPin] = useState('1234');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);

  // Reservations list
  const [reservations, setReservations] = useState([
    {
      id: 'RES-2026-091',
      bookId: 'FCC-PDF-3779',
      bookTitle: 'Computer Networks Tanenbaum 5th Edition',
      callNumber: 'QA76.9 .D3 O46 2026',
      pickupDesk: 'Main Library Circulation Desk (Ground Floor)',
      status: 'Ready for Pickup (48h Hold)',
      queuePosition: 1,
      reservedOn: '2026-09-28'
    },
    {
      id: 'RES-2026-044',
      bookId: 'FCC-B001',
      bookTitle: 'Principles and Practice of Co-operative Economics',
      callNumber: 'HD2963 .A34 2024',
      pickupDesk: 'Prof. Hezekiah Carrel Annex',
      status: 'In Queue (Position #2)',
      queuePosition: 2,
      reservedOn: '2026-09-29'
    }
  ]);

  // Borrowing History (archived)
  const [borrowingHistory, setBorrowingHistory] = useState([
    {
      id: 'LN-ARCH-891',
      bookTitle: 'Cooperative Banking and Agricultural Micro-Credit',
      author: 'Dr. Kehinde Oladipo',
      borrowedOn: '2026-08-10',
      returnedOn: '2026-08-24',
      status: 'Returned On Time',
      fine: 0
    },
    {
      id: 'LN-ARCH-842',
      bookTitle: 'Financial Accounting in Cooperative Apex Syndicates',
      author: 'Prof. A. O. Adebayo',
      borrowedOn: '2026-07-02',
      returnedOn: '2026-07-16',
      status: 'Returned On Time',
      fine: 0
    },
    {
      id: 'LN-ARCH-789',
      bookTitle: 'Auditing and Internal Controls in Micro-Enterprises',
      author: 'Barrister B. A. Olowookere',
      borrowedOn: '2026-06-11',
      returnedOn: '2026-06-25',
      status: 'Returned On Time',
      fine: 0
    }
  ]);

  // Saved / Favorited Books
  const [savedBooksList, setSavedBooksList] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('fcc_saved_books_list') || '[]');
      const matched = books.filter(b => ids.includes(b.id));
      if (matched.length > 0) return matched;
    } catch (e) {}
    return books.slice(0, 3);
  });

  // Reading History (E-Books)
  const [readingHistory, setReadingHistory] = useState([
    {
      bookTitle: 'Computer Networks Tanenbaum 5th Edition',
      progressPercent: 78,
      lastRead: 'Today, 11:42 AM',
      pagesRead: 220,
      totalPages: 282
    },
    {
      bookTitle: 'Principles and Practice of Co-operative Economics',
      progressPercent: 45,
      lastRead: 'Yesterday',
      pagesRead: 172,
      totalPages: 384
    },
    {
      bookTitle: 'Cooperative Law & Statutory Auditing in Nigeria',
      progressPercent: 100,
      lastRead: '3 days ago',
      pagesRead: 310,
      totalPages: 310
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Hold Item Ready for Pickup',
      message: 'Your reservation for "Computer Networks Tanenbaum 5th Edition" is waiting at the Main Circulation Desk.',
      time: '2 hours ago',
      read: false,
      type: 'hold'
    },
    {
      id: 2,
      title: 'Due Date Reminder (3 Days Remaining)',
      message: 'Loan LN-9821 ("Agro-Allied Enterprise Strategy") is due for return on October 3, 2026.',
      time: '1 day ago',
      read: false,
      type: 'warning'
    },
    {
      id: 3,
      title: 'NBTE Accreditation Digital Collection Live',
      message: 'New TETFUND monographs have been added to the institutional repository.',
      time: '3 days ago',
      read: true,
      type: 'announcement'
    }
  ]);

  const libraryId = `STU/2026/${(user?.matric || '00125').replace(/[^0-9]/g, '').slice(-5) || '00125'}`;
  const barcodeValue = `FCC-STU-${(user?.matric || '00125').replace(/[^0-9]/g, '').slice(-5) || '00125'}`;
  const totalFines = loans.reduce((acc, l) => acc + (l.fine || 0), 0);
  const activeLoans = loans.filter(l => l.matric === user?.matric && l.status !== 'Returned');

  const handleCancelReservation = (resId) => {
    setReservations(reservations.filter(r => r.id !== resId));
    sounds.playClick();
    alert('Reservation cancelled. The item has been released to the next scholar in queue.');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    sounds.playSuccessChime();
    setSaveSuccessMsg('Profile settings and security credentials successfully synchronized with SIS Database.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleMarkNotificationRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP PATRON HERO IDENTITY CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-800/80 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Avatar and Basic Credentials */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <img
                src={profilePhoto}
                alt={user?.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-500 shadow-xl"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#021810]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  VERIFIED PATRON SCHOLAR
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {user?.level || 'HND II (Final Year)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.name || 'Wale Olonade'}
              </h1>
              <div className="text-xs text-emerald-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono font-bold">{user?.matric || 'FCC/CEM/2024/042'}</span>
                <span>•</span>
                <span>{user?.dept || 'Co-operative Economics & Management'}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">Library ID: {libraryId}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#021810] border border-emerald-800/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Loans</span>
              <span className="text-lg font-black text-emerald-400">{activeLoans.length} / 5</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#021810] border border-emerald-800/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Holds Active</span>
              <span className="text-lg font-black text-white">{reservations.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#021810] border border-emerald-800/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Fines Due</span>
              <span className={`text-lg font-black ${totalFines > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₦{totalFines}.00
              </span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-400 hover:text-white font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. TABBED PATRON DOSSIER NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-[#021810] border border-emerald-900/80 no-scrollbar text-xs">
        {[
          { id: 'overview', label: '1. Identity & Card', icon: User },
          { id: 'loans', label: `2. Current Loans (${activeLoans.length})`, icon: Clock, badge: activeLoans.length },
          { id: 'reservations', label: `3. Holds (${reservations.length})`, icon: Layers, badge: reservations.length },
          { id: 'fines', label: `4. Fines & Clearances (₦${totalFines})`, icon: CreditCard },
          { id: 'history', label: '5. Borrowing History', icon: History },
          { id: 'saved', label: `6. Saved Books (${savedBooksList.length})`, icon: Bookmark },
          { id: 'reading', label: '7. Reading Velocity', icon: BookOpen },
          { id: 'notifications', label: `8. Notifications (${notifications.filter(n => !n.read).length})`, icon: Bell, badge: notifications.filter(n => !n.read).length },
          { id: 'settings', label: '9. Security & Settings', icon: Key }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveSubTab(t.id);
                sounds.playClick();
              }}
              className={`px-3.5 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60'
                  : 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-400'} />
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-900 text-emerald-200">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =======================================================
          TAB 1: PATRON IDENTITY & MOBILE DIGITAL CARD
      ======================================================= */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: ASCII-Exact Digital Card Visualizer */}
          <div className="lg:col-span-6 space-y-4">
            <div className="w-full rounded-3xl bg-gradient-to-b from-[#032317] via-[#042e1f] to-[#021810] border-2 border-emerald-500/60 p-6 sm:p-7 shadow-2xl space-y-4 text-center relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <img src="/assets/fcc-logo.png" alt="FCC Logo" className="w-5 h-5 object-cover rounded-full shrink-0" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                    {INSTITUTION.shortName} SMART LIBRARY MEMBERSHIP
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300">RFID: ACTIVE</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {user?.name || 'Wale Olonade'}
                </h3>
                <div className="text-xs text-emerald-300 font-mono mt-0.5">
                  {user?.matric || 'FCC/CEM/2024/042'}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#021810] border border-emerald-900/80">
                <span className="text-[9px] text-slate-400 uppercase font-mono block">LIBRARY ID</span>
                <span className="text-base font-black font-mono text-white tracking-widest">
                  {libraryId}
                </span>
              </div>

              {/* Barcode Strip */}
              <div className="p-3 rounded-2xl bg-white text-slate-950 flex flex-col items-center shadow-inner">
                <BarcodeSvg value={barcodeValue} height={44} className="text-black" />
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="p-2 bg-white rounded-2xl shadow-lg">
                  <QrCodeSvg value={`fcc-patron:${libraryId}:${user?.matric}`} size={110} />
                </div>
                <span className="text-[9px] font-mono text-emerald-400/80 mt-2">
                  Scan at Entrance Turnstile or Self-Checkout Kiosk
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer size={14} />
                <span>Print Official Card</span>
              </button>
            </div>
          </div>

          {/* Right: Academic Profile & SIS Verification */}
          <div className="lg:col-span-6 p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-400" />
                <span>Student Academic Record & SIS Sync</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                SIS Linked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-emerald-200">
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900">
                <span className="text-[10px] text-slate-400 block mb-0.5">Faculty</span>
                <span className="font-bold text-white">Faculty of Co-operative Economics</span>
              </div>
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900">
                <span className="text-[10px] text-slate-400 block mb-0.5">Department</span>
                <span className="font-bold text-white">{user?.dept || 'Co-operative Economics & Management'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900">
                <span className="text-[10px] text-slate-400 block mb-0.5">Programme</span>
                <span className="font-bold text-white">Higher National Diploma (HND)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900">
                <span className="text-[10px] text-slate-400 block mb-0.5">Academic Level</span>
                <span className="font-bold text-white">{user?.level || 'HND II (Final Year)'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-slate-300">
              <div className="flex justify-between p-2 rounded-lg bg-[#021810]">
                <span className="text-slate-400">Institutional Email:</span>
                <span className="font-mono text-emerald-300">{email}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[#021810]">
                <span className="text-slate-400">Telephone / SMS Contact:</span>
                <span className="font-mono text-white">{phone}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-[#021810]">
                <span className="text-slate-400">Borrowing Privileges:</span>
                <span className="text-emerald-400 font-bold">Standard Patron (5 Books • 14 Days)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 2: CURRENT LOANS
      ======================================================= */}
      {activeSubTab === 'loans' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-emerald-400" />
                <span>Active Physical Checkouts & Deadlines</span>
              </h3>
              <p className="text-xs text-emerald-300/70">
                Renew items online up to 3 times before the return date.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
              {activeLoans.length} Checked Out
            </span>
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#021810] rounded-2xl border border-emerald-900">
              You currently have zero active physical checkouts. Browse the catalog to borrow texts.
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map(loan => (
                <div key={loan.id} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">{loan.bookTitle}</div>
                    <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                      Barcode: {loan.barcode || 'FCC-BC-09281'} • Loan Ref: {loan.id}
                    </div>
                    <div className="text-emerald-400 text-[11px] mt-1">
                      Stack Location: {loan.shelfLocation || 'Floor 2 • West Stacks'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">DUE DATE</span>
                      <span className="font-mono text-xs font-bold text-amber-300">{loan.dueDate}</span>
                    </div>

                    {onRenewLoan && (
                      <button
                        onClick={() => onRenewLoan(loan.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                      >
                        +14 Days Renewal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          TAB 3: RESERVATIONS & HOLDS
      ======================================================= */}
      {activeSubTab === 'reservations' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                <span>Active Physical Reservations & Shelf Holds</span>
              </h3>
              <p className="text-emerald-300/70">
                Items are reserved at your designated pickup desk for 48 hours upon physical check-in.
              </p>
            </div>
            <span className="font-mono text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
              {reservations.length} Active Holds
            </span>
          </div>

          <div className="space-y-3">
            {reservations.map(res => (
              <div key={res.id} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900/80 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{res.bookTitle}</div>
                  <div className="text-emerald-400 font-mono text-[11px]">
                    Call: {res.callNumber} • Ref: {res.id}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Pickup Desk: <strong className="text-slate-200">{res.pickupDesk}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    res.status.includes('Ready')
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {res.status}
                  </span>
                  <button
                    onClick={() => handleCancelReservation(res.id)}
                    className="px-3 py-1 rounded-xl bg-[#032317] hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-emerald-800/80 transition"
                  >
                    Cancel Hold
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 4: FINES & CLEARANCE CERTIFICATE
      ======================================================= */}
      {activeSubTab === 'fines' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                <span>Overdue Fines & Graduation Debt Clearance Audit</span>
              </h3>
              <p className="text-emerald-300/70">
                Automated fiscal audit synchronized with the Bursary and Student Affairs Directorates.
              </p>
            </div>
            <span className={`font-mono px-3 py-1 rounded-xl font-bold ${
              totalFines === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {totalFines === 0 ? 'ZERO DEBT (AUDIT CLEAR)' : `OUTSTANDING: ₦${totalFines}.00`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">Graduation Clearance Status</div>
              <div className="text-emerald-300/80 text-[11px]">
                {totalFines === 0
                  ? 'All borrow quotas returned. Ready to generate official signed clearance certificate.'
                  : 'Clear outstanding overdue fines to unlock graduation signature.'}
              </div>
            </div>
            <button
              onClick={() => {
                if (totalFines > 0 && onPayFine) {
                  const fineLoan = loans.find(l => l.fine > 0);
                  if (fineLoan) setSelectedLoanForPayment(fineLoan);
                } else {
                  alert('Generating official Graduation Clearance Certificate (NBTE Grade A)...');
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
            >
              {totalFines > 0 ? `Pay ₦${totalFines} Now` : 'Download Certificate PDF'}
            </button>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 5: BORROWING HISTORY
      ======================================================= */}
      {activeSubTab === 'history' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History size={16} className="text-emerald-400" />
              <span>Lifetime Circulation History & Archived Borrowings</span>
            </h3>
            <span className="font-mono text-slate-400">Total Borrowed: 14 Volumes</span>
          </div>

          <div className="space-y-2">
            {borrowingHistory.map(b => (
              <div key={b.id} className="p-3.5 rounded-xl bg-[#021810] border border-emerald-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{b.bookTitle}</div>
                  <div className="text-[11px] text-slate-400">By {b.author}</div>
                </div>
                <div className="text-right text-[11px] text-emerald-300 font-mono">
                  <div>Borrowed: {b.borrowedOn}</div>
                  <div className="text-emerald-400 font-semibold">Returned: {b.returnedOn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 6: SAVED BOOKS / READING LIST
      ======================================================= */}
      {activeSubTab === 'saved' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bookmark size={16} className="text-emerald-400" />
              <span>Personal Saved Reading List</span>
            </h3>
            <span className="font-mono text-emerald-300">{savedBooksList.length} Saved Titles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedBooksList.map(b => (
              <div key={b.id} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-white truncate">{b.title}</div>
                  <div className="text-[11px] text-slate-400">By {b.author}</div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">{b.callNumber}</div>
                </div>
                <div className="pt-2 border-t border-emerald-900 flex items-center justify-between">
                  <TraceBadge uri={`#/book/${b.id}`} label="Dossier" />
                  {onOpenReader && (
                    <button
                      onClick={() => onOpenReader(b)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                    >
                      Read Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 7: READING HISTORY & VELOCITY
      ======================================================= */}
      {activeSubTab === 'reading' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              <span>Interactive E-Book Reading Velocity</span>
            </h3>
            <span className="font-mono text-emerald-400">Total Reading Time: 42 hrs</span>
          </div>

          <div className="space-y-3">
            {readingHistory.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#021810] border border-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">{item.bookTitle}</div>
                  <span className="font-mono text-emerald-400 font-bold">{item.progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{item.pagesRead} of {item.totalPages} pages read</span>
                  <span>Last active: {item.lastRead}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 8: NOTIFICATIONS & ALERTS
      ======================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-emerald-400" />
              <span>Patron Notifications & Automated Due Date Bulletins</span>
            </h3>
            <span className="font-mono text-emerald-300">
              {notifications.filter(n => !n.read).length} Unread
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkNotificationRead(n.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  n.read
                    ? 'bg-[#021810]/70 border-emerald-900/60 text-slate-400'
                    : 'bg-[#032317] border-emerald-500/60 text-emerald-100 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 9: SECURITY & SETTINGS
      ======================================================= */}
      {activeSubTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-xl space-y-5 text-xs max-w-2xl">
          <div className="border-b border-emerald-800/60 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key size={16} className="text-emerald-400" />
              <span>Patron Account Security & Notification Channels</span>
            </h3>
            <p className="text-emerald-300/70">
              Update password, PIN, SMS alert numbers, and institutional profile preferences.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-emerald-300 font-semibold mb-1">Telephone Contact (SMS Notifications)</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-emerald-300 font-semibold mb-1">Institutional Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-emerald-300 font-semibold mb-1">4-Digit Security PIN (Kiosk & Door Access)</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-48 px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-white font-mono text-center tracking-widest focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-emerald-800/60">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smsCheck"
                  checked={smsAlerts}
                  onChange={e => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="smsCheck" className="text-slate-300">
                  Receive SMS 48 hours before loan due dates
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailCheck"
                  checked={emailAlerts}
                  onChange={e => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="emailCheck" className="text-slate-300">
                  Receive email digest for reservation arrivals and college announcements
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition"
              >
                Save Preferences & Sync with SIS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onPaymentSuccess={() => {
            if (onPayFine) onPayFine(selectedLoanForPayment.id);
            setSelectedLoanForPayment(null);
          }}
        />
      )}
    </div>
  );
}
