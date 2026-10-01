import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Reply, User, GraduationCap, Shield,
  CheckCircle2, Clock, AlertTriangle, Filter, Search, RefreshCw,
  Sparkles, BookOpen, ShoppingBag, FileCheck, Bell, ChevronRight,
  ArrowRight, Check, X, ShieldAlert, Award, Paperclip, Building2,
  Users, Info, Tag
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

/**
 * INSTITUTIONAL TRI-PARTY COMMUNICATION & DISPATCH HUB
 * Blends HODs, Central Library Admin, and Students/Scholars together into a unified,
 * real-time institutional collaboration and inquiry workflow.
 */
export default function InstitutionalCommunicationHub({
  currentRole = 'student', // 'student' | 'hod' | 'admin'
  currentUser = null,
  allowRoleSwitching = true,
  onNavigateToTab
}) {
  const [activeRole, setActiveRole] = useState(currentRole);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread_for_admin: 0,
    pending_acquisitions: 0,
    pending_clearances: 0,
    unread_for_hod: 0,
    unread_for_student: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showNewDispatchModal, setShowNewDispatchModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Active identity profiles based on selected role
  const roleProfiles = {
    student: {
      id: currentUser?.matric || 'FCC/CEM/2024/042',
      name: currentUser?.name || 'Wale Olonade',
      role: 'student',
      dept: currentUser?.dept || 'Co-operative Economics & Management',
      avatarLabel: 'Student Scholar',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    hod: {
      id: 'HOD/CEM/001',
      name: 'Dr. Mrs. F. A. Babalola',
      role: 'hod',
      dept: 'Co-operative Economics & Management',
      avatarLabel: 'Head of Department (HOD)',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    admin: {
      id: 'ADMIN-CHIEF',
      name: 'Dr. Mrs. A. Balogun',
      role: 'admin',
      dept: 'Central Library Services',
      avatarLabel: 'Chief College Librarian',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  };

  const activeProfile = roleProfiles[activeRole] || roleProfiles.student;

  // New Dispatch Form State
  const [newDispatch, setNewDispatch] = useState({
    recipient_type: activeRole === 'student' ? 'hod' : (activeRole === 'hod' ? 'admin' : 'all'),
    category: activeRole === 'student' ? 'course_reserve' : (activeRole === 'hod' ? 'acquisition_request' : 'official_bulletin'),
    subject: '',
    message: '',
    priority: 'normal'
  });

  const broadcastChannelRef = useRef(null);

  // Load communications from Laravel Backend API
  const fetchCommunications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/communications?role=${activeRole}&user_id=${encodeURIComponent(activeProfile.id)}&dept=${encodeURIComponent(activeProfile.dept)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.stats) setStats(data.stats);
        if (!selectedThreadId && data.messages && data.messages.length > 0) {
          setSelectedThreadId(data.messages[0].thread_id);
        }
      }
    } catch (e) {
      console.warn('Backend communications fetch fallback:', e);
      // Fallback local memory
      const cached = JSON.parse(localStorage.getItem('fcc_inter_role_comms_cache') || '[]');
      if (cached.length > 0) setMessages(cached);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [activeRole]);

  // Real-time inter-tab sync via BroadcastChannel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('fcc_inter_role_comms');
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_DISPATCH') {
          fetchCommunications();
          sounds.playScannerBeep();
          setSuccessToast(`Incoming notification from ${event.data.senderName}!`);
          setTimeout(() => setSuccessToast(''), 4000);
        }
      };
      return () => channel.close();
    } catch (e) {}
  }, [activeRole]);

  // Group messages into threads
  const threads = React.useMemo(() => {
    const map = new Map();
    messages.forEach(msg => {
      const tid = msg.thread_id || msg.msg_id;
      if (!map.has(tid)) {
        map.set(tid, []);
      }
      map.get(tid).push(msg);
    });

    const list = Array.from(map.entries()).map(([threadId, msgs]) => {
      // Sort messages within thread chronologically
      msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const latest = msgs[msgs.length - 1];
      const hasUnread = msgs.some(m => m.status === 'unread' && m.recipient_role === activeRole);
      return {
        threadId,
        messages: msgs,
        latest,
        subject: latest.subject,
        category: latest.category,
        hasUnread,
        lastUpdated: latest.created_at
      };
    });

    // Sort threads by most recently updated
    list.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    return list;
  }, [messages, activeRole]);

  // Filtered threads
  const filteredThreads = React.useMemo(() => {
    return threads.filter(th => {
      const matchesCat = activeCategoryFilter === 'all' || th.category === activeCategoryFilter;
      const matchesSearch = !searchFilter.trim() ||
        th.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
        th.messages.some(m => m.message.toLowerCase().includes(searchFilter.toLowerCase()) || m.sender_name.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [threads, activeCategoryFilter, searchFilter]);

  // Active selected thread
  const activeThread = threads.find(t => t.threadId === selectedThreadId) || (filteredThreads[0] || null);

  // Send Reply Handler
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    sounds.playClick();
    const latestMsg = activeThread.latest;
    const recipientId = latestMsg.sender_id === activeProfile.id ? latestMsg.recipient_id : latestMsg.sender_id;
    const recipientName = latestMsg.sender_id === activeProfile.id ? latestMsg.recipient_name : latestMsg.sender_name;
    const recipientRole = latestMsg.sender_id === activeProfile.id ? latestMsg.recipient_role : latestMsg.sender_role;

    const payload = {
      sender_id: activeProfile.id,
      sender_name: activeProfile.name,
      sender_role: activeProfile.role,
      sender_dept: activeProfile.dept,
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_role: recipientRole,
      subject: `RE: ${activeThread.subject}`,
      message: replyText.trim()
    };

    try {
      const res = await fetch(`/api/communications/${activeThread.threadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        sounds.playSuccessChime();
        setReplyText('');
        fetchCommunications();
        setSuccessToast('Reply transmitted successfully.');
        setTimeout(() => setSuccessToast(''), 3000);

        // Notify other tabs
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'NEW_DISPATCH',
            senderName: activeProfile.name
          });
        }
      }
    } catch (err) {
      console.warn('Reply error:', err);
    }
  };

  // Submit New Dispatch
  const handleSubmitNewDispatch = async (e) => {
    e.preventDefault();
    if (!newDispatch.subject.trim() || !newDispatch.message.trim()) return;

    sounds.playClick();

    let recipientId = 'ADMIN-CHIEF';
    let recipientName = 'Dr. Mrs. A. Balogun (Chief College Librarian)';
    let recipientRole = newDispatch.recipient_type;
    let recipientDept = 'Central Library Services';

    if (newDispatch.recipient_type === 'hod') {
      recipientId = 'HOD/CEM/001';
      recipientName = 'Dr. Mrs. F. A. Babalola (HOD CEM)';
      recipientRole = 'hod';
      recipientDept = 'Co-operative Economics & Management';
    } else if (newDispatch.recipient_type === 'all') {
      recipientId = 'all';
      recipientName = 'All Faculty, HODs and Students';
      recipientRole = 'all';
      recipientDept = 'Campus Wide';
    } else if (newDispatch.recipient_type === 'student') {
      recipientId = 'FCC/CEM/2024/042';
      recipientName = 'Wale Olonade';
      recipientRole = 'student';
      recipientDept = 'Co-operative Economics & Management';
    }

    const payload = {
      sender_id: activeProfile.id,
      sender_name: activeProfile.name,
      sender_role: activeProfile.role,
      sender_dept: activeProfile.dept,
      recipient_id: recipientId,
      recipient_name: recipientName,
      recipient_role: recipientRole,
      recipient_dept: recipientDept,
      category: newDispatch.category,
      subject: newDispatch.subject.trim(),
      message: newDispatch.message.trim(),
      priority: newDispatch.priority
    };

    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        sounds.playSuccessChime();
        setShowNewDispatchModal(false);
        setNewDispatch({
          recipient_type: activeRole === 'student' ? 'hod' : (activeRole === 'hod' ? 'admin' : 'all'),
          category: activeRole === 'student' ? 'course_reserve' : (activeRole === 'hod' ? 'acquisition_request' : 'official_bulletin'),
          subject: '',
          message: '',
          priority: 'normal'
        });
        fetchCommunications();
        setSuccessToast('New institutional dispatch initiated.');
        setTimeout(() => setSuccessToast(''), 3500);

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'NEW_DISPATCH',
            senderName: activeProfile.name
          });
        }
      }
    } catch (err) {
      console.warn('Dispatch creation failed:', err);
    }
  };

  // Helper badge for categories
  const getCategoryBadge = (cat) => {
    const map = {
      course_reserve: { label: 'Course Reserve', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
      acquisition_request: { label: 'Book Acquisition', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      clearance_request: { label: 'Graduation Clearance', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      thesis_review: { label: 'Thesis Review', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
      official_bulletin: { label: 'Official Bulletin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      reply: { label: 'In-Thread Reply', color: 'bg-slate-700 text-slate-300 border-slate-600' }
    };
    return map[cat] || { label: cat, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-6 animate-fadeIn text-emerald-100 font-sans">
      
      {/* 1. TOP HEADER & TRI-PARTY ROLE SELECTOR BAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border border-emerald-700/60 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5">
                <Users size={13} className="text-emerald-400" />
                TRI-PARTY COLLABORATION MATRIX
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                Live Broadcast Channel Sync
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Institutional Dispatch & Communication Hub
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300/80 max-w-2xl mt-1">
              Instantaneous tri-directional workflow connecting <strong>HODs</strong> (departmental curations), <strong>Central Library Admin</strong> (acquisition & clearance), and <strong>Students</strong> (inquiries & holdings).
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCommunications()}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#021810] text-emerald-300 border border-emerald-800 hover:bg-emerald-900/40 transition"
              title="Refresh communications"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowNewDispatchModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send size={15} />
              <span>Create New Dispatch</span>
            </button>
          </div>
        </div>

        {/* Live Interactive "Act As" Perspective Switcher */}
        {allowRoleSwitching && (
          <div className="pt-4 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono">
              <span>View As Perspective:</span>
              <div className="inline-flex rounded-2xl bg-[#021810] p-1 border border-emerald-800">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveRole('student');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeRole === 'student'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  <User size={14} />
                  <span>🎓 Student (Wale)</span>
                  {stats.unread_for_student > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveRole('hod');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeRole === 'hod'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-indigo-300 hover:text-white'
                  }`}
                >
                  <GraduationCap size={14} />
                  <span>🏛️ HOD (Dr. Babalola)</span>
                  {stats.unread_for_hod > 0 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  )}
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveRole('admin');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeRole === 'admin'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-amber-300 hover:text-white'
                  }`}
                >
                  <Shield size={14} />
                  <span>👑 Admin (Chief Librarian)</span>
                  {stats.unread_for_admin > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Current Active Persona Banner */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Authenticated As:</span>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${activeProfile.badgeColor}`}>
                {activeProfile.name} • {activeProfile.dept}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 shadow space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>ACTIVE DISPATCHES</span>
            <MessageSquare size={14} />
          </div>
          <div className="text-2xl font-black text-white">{threads.length}</div>
          <div className="text-[11px] text-emerald-300/80">Threads across departments</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#032317] border border-purple-800/60 shadow space-y-1">
          <div className="text-[11px] font-mono text-purple-400 flex items-center justify-between">
            <span>HOD ACQUISITIONS</span>
            <ShoppingBag size={14} />
          </div>
          <div className="text-2xl font-black text-purple-200">{stats.pending_acquisitions}</div>
          <div className="text-[11px] text-purple-300/80">Book orders pending review</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 shadow space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>STUDENT CLEARANCES</span>
            <FileCheck size={14} />
          </div>
          <div className="text-2xl font-black text-emerald-300">{stats.pending_clearances}</div>
          <div className="text-[11px] text-emerald-300/80">Final graduation audits</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#032317] border border-amber-800/60 shadow space-y-1">
          <div className="text-[11px] font-mono text-amber-400 flex items-center justify-between">
            <span>OFFICIAL BULLETINS</span>
            <Bell size={14} />
          </div>
          <div className="text-2xl font-black text-amber-200">
            {messages.filter(m => m.category === 'official_bulletin').length}
          </div>
          <div className="text-[11px] text-amber-300/80">Institutional campus alerts</div>
        </div>
      </div>

      {/* 3. MAIN COMMUNICATION TWO-COLUMN DESK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: THREAD LIST & SEARCH FILTERS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#032317] border border-emerald-800/80 shadow-lg space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                placeholder="Search dispatches, subjects, senders..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {[
                { id: 'all', label: 'All Dispatches' },
                { id: 'course_reserve', label: 'Course Reserve' },
                { id: 'acquisition_request', label: 'Acquisitions' },
                { id: 'clearance_request', label: 'Clearances' },
                { id: 'official_bulletin', label: 'Bulletins' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveCategoryFilter(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    activeCategoryFilter === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#021810] text-emerald-300 border border-emerald-900 hover:bg-emerald-900/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#032317] border border-emerald-800 text-xs text-emerald-400">
                No institutional communications match the active filters.
              </div>
            ) : (
              filteredThreads.map(th => {
                const isSelected = activeThread && activeThread.threadId === th.threadId;
                const catInfo = getCategoryBadge(th.category);
                const senderIsStudent = th.latest.sender_role === 'student';
                const senderIsHod = th.latest.sender_role === 'hod';

                return (
                  <div
                    key={th.threadId}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedThreadId(th.threadId);
                    }}
                    className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#042e1f] to-[#021810] border-emerald-500 shadow-xl ring-1 ring-emerald-500/40'
                        : 'bg-[#032317] border-emerald-800/80 hover:border-emerald-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {th.hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400/80">
                        {th.messages.length} {th.messages.length === 1 ? 'msg' : 'msgs'}
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                      {th.subject}
                    </h4>

                    <p className="text-[11px] text-emerald-300/80 line-clamp-2 leading-relaxed">
                      {th.latest.message}
                    </p>

                    <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                        {senderIsStudent ? (
                          <User size={12} className="text-emerald-400" />
                        ) : senderIsHod ? (
                          <GraduationCap size={12} className="text-indigo-400" />
                        ) : (
                          <Shield size={12} className="text-amber-400" />
                        )}
                        <span className="truncate">{th.latest.sender_name}</span>
                      </div>
                      <span className="font-mono text-slate-400">
                        {new Date(th.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE THREAD CHAT VIEW & REPLY COMPOSER (7 Cols) */}
        <div className="lg:col-span-7">
          {activeThread ? (
            <div className="rounded-3xl bg-[#032317] border border-emerald-800/80 shadow-2xl flex flex-col h-[700px] overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 sm:p-5 border-b border-emerald-800/80 bg-[#021810]/70 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getCategoryBadge(activeThread.category).color}`}>
                      {getCategoryBadge(activeThread.category).label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Thread ID: {activeThread.threadId}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 truncate">
                    {activeThread.subject}
                  </h3>
                </div>

                {/* Quick Workflow Action Button based on Role */}
                {activeRole === 'admin' && activeThread.category === 'acquisition_request' && (
                  <button
                    onClick={() => {
                      sounds.playSuccessChime();
                      alert('Acquisition PO-2026-084 authorized for Spectrum Books and billed to TETFUND library grant.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve PO</span>
                  </button>
                )}

                {activeRole === 'admin' && activeThread.category === 'clearance_request' && (
                  <button
                    onClick={() => {
                      sounds.playSuccessChime();
                      alert('Library clearance verified: 0 outstanding books, 0 fines. Digital clearance certificate signed.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <Award size={13} />
                    <span>Sign Clearance</span>
                  </button>
                )}

                {activeRole === 'hod' && activeThread.category === 'course_reserve' && (
                  <button
                    onClick={() => {
                      sounds.playSuccessChime();
                      if (onNavigateToTab) onNavigateToTab('upload');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                  >
                    <BookOpen size={13} />
                    <span>Open Upload Studio</span>
                  </button>
                )}
              </div>

              {/* Message History Scroller */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 no-scrollbar bg-gradient-to-b from-[#021810]/40 to-[#032317]">
                {activeThread.messages.map((msg, i) => {
                  const isMine = msg.sender_id === activeProfile.id || msg.sender_role === activeRole;
                  const senderRole = msg.sender_role;

                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                        <span className="font-bold text-white">{msg.sender_name}</span>
                        <span>({msg.sender_dept || msg.sender_role.toUpperCase()})</span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed shadow-md ${
                          isMine
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-none'
                            : senderRole === 'hod'
                            ? 'bg-[#0f1d33] border border-indigo-500/40 text-indigo-100 rounded-tl-none'
                            : senderRole === 'admin'
                            ? 'bg-[#291b07] border border-amber-500/40 text-amber-100 rounded-tl-none'
                            : 'bg-[#042e1f] border border-emerald-700/60 text-emerald-100 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>

                        {/* Action payload preview (if any) */}
                        {msg.action_data && (
                          <div className="mt-2.5 pt-2 border-t border-white/20 text-[10px] font-mono opacity-90 flex items-center gap-1.5">
                            <Tag size={11} />
                            <span>Action Reference: {typeof msg.action_data === 'string' ? msg.action_data : JSON.stringify(msg.action_data)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* In-Thread Reply Composer */}
              <form
                onSubmit={handleSendReply}
                className="p-3 sm:p-4 border-t border-emerald-800/80 bg-[#021810] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Reply as ${activeProfile.name} (${activeProfile.avatarLabel})...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#032317] border border-emerald-800 text-xs sm:text-sm text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="h-[700px] rounded-3xl bg-[#032317] border border-emerald-800/80 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare size={48} className="text-emerald-500/60" />
              <h3 className="text-lg font-bold text-white">Select a Dispatch Conversation</h3>
              <p className="text-xs text-emerald-400 max-w-sm">
                Choose an inquiry thread from the left or create a new institutional dispatch to communicate across departments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. NEW DISPATCH MODAL */}
      {showNewDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#032317] border border-emerald-700/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                <h3 className="text-lg font-black text-white">Create Institutional Dispatch</h3>
              </div>
              <button
                onClick={() => setShowNewDispatchModal(false)}
                className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDispatch} className="space-y-4">
              {/* Sender Details */}
              <div className="p-3 rounded-xl bg-[#021810] border border-emerald-900/80 text-xs text-emerald-300 flex items-center justify-between">
                <span>Transmitting From:</span>
                <strong className="text-white">{activeProfile.name} ({activeProfile.avatarLabel})</strong>
              </div>

              {/* Recipient Selector */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Recipient Destination
                </label>
                <select
                  value={newDispatch.recipient_type}
                  onChange={(e) => setNewDispatch({ ...newDispatch, recipient_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {activeRole === 'student' && (
                    <>
                      <option value="hod">🏛️ Head of Department (Dr. Babalola - CEM)</option>
                      <option value="admin">👑 Central Library Administration & Helpdesk</option>
                    </>
                  )}
                  {activeRole === 'hod' && (
                    <>
                      <option value="admin">👑 Chief College Librarian & Acquisitions Board</option>
                      <option value="student">🎓 Wale Olonade (Course Rep / Scholar)</option>
                      <option value="all">📢 Broadcast to All Department Students</option>
                    </>
                  )}
                  {activeRole === 'admin' && (
                    <>
                      <option value="all">📢 Broadcast to All Faculty, HODs & Students</option>
                      <option value="hod">🏛️ HOD Co-operative Economics (Dr. Babalola)</option>
                      <option value="student">🎓 Wale Olonade (Student Scholar)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Workflow Category
                </label>
                <select
                  value={newDispatch.category}
                  onChange={(e) => setNewDispatch({ ...newDispatch, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="course_reserve">📚 Course Reserve & Reading Material Request</option>
                  <option value="acquisition_request">🛒 Physical Book Acquisition Requisition</option>
                  <option value="clearance_request">🎓 Graduation Clearance & Fine Audit</option>
                  <option value="thesis_review">🏛️ Departmental Thesis Topic & Repository Submission</option>
                  <option value="official_bulletin">📢 Official Campus Bulletin / Policy Notice</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Dispatch Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acquisition Requisition for 15 copies of Cooperative Law"
                  value={newDispatch.subject}
                  onChange={(e) => setNewDispatch({ ...newDispatch, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  Message Content / Requisition Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide comprehensive details, course codes, target level, or justification..."
                  value={newDispatch.message}
                  onChange={(e) => setNewDispatch({ ...newDispatch, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#021810] border border-emerald-800 text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-800">
                <button
                  type="button"
                  onClick={() => setShowNewDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#021810] text-emerald-300 border border-emerald-800 text-xs font-bold hover:bg-emerald-900/40 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Send size={13} />
                  <span>Transmit Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-700 text-white border border-emerald-400 shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 size={16} className="text-white" />
          <span>{successToast}</span>
        </div>
      )}

    </div>
  );
}
