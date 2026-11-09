import React, { useState, useEffect, useRef } from 'react';
import {
  Video, RefreshCw, ArrowLeft, Users, BookOpen, Play, CheckCircle2,
  Building2, Search, Radio, Clock, Copy, Check, ShieldCheck, ExternalLink, Layers
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { parseCurrentRoute, navigateTo } from '../utils/router';
import { subscribeRealtimeEvents } from '../services/realtimeSync';
import StudentLiveBroadcastViewer from './StudentLiveBroadcastViewer';

export default function LiveClassroomPage({
  currentUser = null,
  onBack = null
}) {
  const [broadcast, setBroadcast] = useState(null);
  const [endedSessionInfo, setEndedSessionInfo] = useState(null);
  const [activeStreams, setActiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChannelDirectory, setShowChannelDirectory] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const broadcastRef = useRef(null);
  useEffect(() => {
    broadcastRef.current = broadcast;
  }, [broadcast]);

  const extractBroadcastIdFromRoute = () => {
    const { path, params } = parseCurrentRoute();
    if (params?.id) return params.id;
    const parts = path.split('/').filter(Boolean);
    // e.g. /live-classroom/LIVE-CSC-2026... or /opac/live/LIVE-CSC-...
    if (parts.length >= 2 && parts[0] === 'live-classroom' && parts[1] !== 'active') {
      return decodeURIComponent(parts[1]);
    }
    if (parts.length >= 3 && parts[0] === 'opac' && parts[1] === 'live') {
      return decodeURIComponent(parts[2]);
    }
    return 'active';
  };

  const fetchSession = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const base = getApiBase();
      const targetId = extractBroadcastIdFromRoute();
      const ts = Date.now();
      const [sessionRes, activeRes] = await Promise.all([
        fetch(`${base}/live-broadcast/session/${encodeURIComponent(targetId)}?t=${ts}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch(`${base}/live-broadcast/active?t=${ts}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      let foundActiveSession = null;
      let validStreams = [];

      if (activeRes.ok) {
        const aData = await activeRes.json();
        validStreams = Array.isArray(aData.streams)
          ? aData.streams.filter(s => s && Boolean(Number(s.is_live ?? 0)) && String(s.status || '').toLowerCase() === 'live')
          : [];
        setActiveStreams(validStreams);
      }

      if (sessionRes.ok) {
        const sData = await sessionRes.json();
        const b = sData.broadcast;
        const isLiveSession = Boolean(
          sData.active &&
          !sData.ended &&
          b &&
          b.id &&
          Boolean(Number(b.is_live ?? 0)) &&
          String(b.status || '').toLowerCase() === 'live'
        );
        if (isLiveSession) {
          foundActiveSession = b;
          setEndedSessionInfo(null);
        } else {
          if (sData.ended_broadcast && targetId !== 'active') {
            setEndedSessionInfo(sData.ended_broadcast);
          }
        }
      }

      // If route was generic '/live-classroom' ('active'):
      // - If multiple departments are live simultaneously, show the Multi-Department Classroom Hub unless the user already selected a channel
      // - If only 1 department is live, auto-select it unless the user opened the Channel Directory
      if (targetId === 'active') {
        if (validStreams.length > 1) {
          const currentSelected = broadcastRef.current
            ? validStreams.find(s => s.id === broadcastRef.current.id)
            : null;
          if (currentSelected) {
            foundActiveSession = currentSelected;
          } else {
            // Multiple departments are live: open the Multi-Department Channel Directory so each student joins their own department
            foundActiveSession = null;
            setShowChannelDirectory(true);
          }
        } else if (validStreams.length === 1) {
          foundActiveSession = validStreams[0];
        } else {
          foundActiveSession = null;
        }
      }

      setBroadcast(foundActiveSession);
    } catch (e) {} finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession(false);

    const pollInterval = setInterval(() => {
      fetchSession(true);
    }, 4000);

    const onHashChange = () => {
      const tid = extractBroadcastIdFromRoute();
      if (tid !== 'active') {
        setShowChannelDirectory(false);
      }
      fetchSession(false);
    };

    const handleEndedSignal = (endedId) => {
      const currentB = broadcastRef.current;
      if (!endedId || endedId === 'ALL' || !currentB || currentB.id === endedId) {
        setBroadcast(null);
      }
      fetchSession(true);
    };

    const onEnded = (e) => {
      const endedId = e?.detail?.id || null;
      handleEndedSignal(endedId);
    };
    const onStarted = () => fetchSession(true);

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('fcc-live-broadcast-ended', onEnded);
    window.addEventListener('fcc-live-broadcast-started', onStarted);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('fcc_live_broadcast_channel');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'LIVE_BROADCAST_ENDED') {
            handleEndedSignal(msg.data?.id);
          } else if (msg.data?.type === 'LIVE_BROADCAST_STARTED') {
            fetchSession(true);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (!evt) return;
      if (evt.action === 'LIVE_BROADCAST_ENDED') {
        handleEndedSignal(evt.id || evt.data?.id);
      } else if (evt.action === 'LIVE_BROADCAST_STARTED') {
        fetchSession(true);
      }
    });

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('fcc-live-broadcast-ended', onEnded);
      window.removeEventListener('fcc-live-broadcast-started', onStarted);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      if (typeof unsubRealtime === 'function') unsubRealtime();
    };
  }, []);

  const handleExit = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (currentUser?.role === 'student') {
      navigateTo('/scholar/profile');
    } else if (currentUser?.role === 'hod' || currentUser?.role === 'hod_staff') {
      navigateTo('/hod/multimedia');
    } else {
      navigateTo('/opac');
    }
  };

  const handleSelectChannel = (stream) => {
    if (!stream || !stream.id) return;
    setEndedSessionInfo(null);
    setShowChannelDirectory(false);
    setBroadcast(stream);
    navigateTo(`/live-classroom/${stream.id}`);
  };

  const handleCopyChannelLink = (streamId, e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/live-classroom/${streamId}`;
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(streamId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
  };

  const formatElapsed = (sec) => {
    const s = Math.max(0, Number(sec || 0));
    const mins = Math.floor(s / 60);
    if (mins < 1) return 'Just started';
    if (mins < 60) return `${mins}m live`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m live`;
  };

  // Compute unique departments currently live
  const liveDepartments = Array.from(
    new Map(
      activeStreams
        .filter(s => s.department_code)
        .map(s => [String(s.department_code).toUpperCase(), {
          code: String(s.department_code).toUpperCase(),
          name: s.department_name || s.department_code
        }])
    ).values()
  );

  // Detect student's own department code if logged in
  const userDeptText = String(currentUser?.department_code || currentUser?.department || '').toUpperCase();

  // Filter active streams by department & search query
  const filteredStreams = activeStreams.filter(s => {
    const deptCode = String(s.department_code || '').toUpperCase();
    if (selectedDeptFilter !== 'ALL' && deptCode !== selectedDeptFilter) {
      return false;
    }
    const q = channelSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(s.id || '').toLowerCase().includes(q) ||
      String(s.department_code || '').toLowerCase().includes(q) ||
      String(s.department_name || '').toLowerCase().includes(q) ||
      String(s.course_code || '').toLowerCase().includes(q) ||
      String(s.title || '').toLowerCase().includes(q) ||
      String(s.lecturer_name || '').toLowerCase().includes(q)
    );
  });

  if (loading && !broadcast && activeStreams.length === 0) {
    return (
      <div className="min-h-screen bg-[#02140e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 animate-pulse">
          <Video size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Connecting to Institutional Live Classroom Hub...</h2>
          <p className="text-xs text-emerald-300 font-mono">Synchronizing concurrent departmental broadcast channels from database</p>
        </div>
      </div>
    );
  }

  // Show Multi-Department Live Classroom Hub when multiple departments are live (and no single broadcast is locked in) OR when user clicks "Switch Channel / All Classrooms"
  if ((showChannelDirectory && activeStreams.length > 0) || (!broadcast && activeStreams.length > 0 && !endedSessionInfo)) {
    return (
      <div className="min-h-screen bg-[#02140e] text-white p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Multi-Department Hub Banner */}
          <div className="bg-gradient-to-r from-[#042419] via-[#062d20] to-[#1a0b12] border-2 border-emerald-700/80 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-black bg-rose-600 text-white flex items-center gap-1.5 shadow">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>{activeStreams.length} {activeStreams.length === 1 ? 'DEPARTMENT' : 'DEPARTMENTS'} BROADCASTING LIVE</span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 flex items-center gap-1.5">
                    <Layers size={12} />
                    <span>MULTI-DEPARTMENT CONCURRENT CLASSROOM HUB</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Institutional Multi-Department Live Classroom Directory
                </h1>
                <p className="text-xs text-emerald-200/90 max-w-3xl">
                  Multiple academic departments are hosting live interactive lectures concurrently. Select your department&apos;s broadcast channel below or enter your departmental broadcast link code (e.g. <span className="font-mono font-bold text-amber-300">LIVE-CSC-...</span>, <span className="font-mono font-bold text-amber-300">LIVE-CEM-...</span>) to join your class and record your First 10 Minutes &amp; Final Minute attendance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {broadcast && (
                  <button
                    onClick={() => setShowChannelDirectory(false)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-lg"
                  >
                    <Play size={14} />
                    <span>Return to {broadcast.department_code} Classroom</span>
                  </button>
                )}
                <button
                  onClick={() => fetchSession(false)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-bold flex items-center gap-1.5 border border-emerald-600/60 transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Refresh Channels</span>
                </button>
                <button
                  onClick={handleExit}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Library</span>
                </button>
              </div>
            </div>

            {/* Department Filter Pills & Search / Link Code Bar */}
            <div className="mt-5 pt-5 border-t border-emerald-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedDeptFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black font-mono transition cursor-pointer flex items-center gap-1.5 ${
                    selectedDeptFilter === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900/90 text-emerald-200 hover:bg-slate-800 border border-emerald-800/70'
                  }`}
                >
                  <Building2 size={13} />
                  <span>ALL DEPARTMENTS ({activeStreams.length})</span>
                </button>
                {liveDepartments.map(dept => {
                  const deptCount = activeStreams.filter(s => String(s.department_code || '').toUpperCase() === dept.code).length;
                  const isUserDept = userDeptText && (userDeptText.includes(dept.code) || userDeptText.includes(String(dept.name || '').toUpperCase()));
                  return (
                    <button
                      key={dept.code}
                      onClick={() => setSelectedDeptFilter(dept.code)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black font-mono transition cursor-pointer flex items-center gap-1.5 ${
                        selectedDeptFilter === dept.code
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : isUserDept
                            ? 'bg-amber-950/80 text-amber-200 border-2 border-amber-500/80 hover:bg-amber-900/80'
                            : 'bg-slate-900/90 text-emerald-200 hover:bg-slate-800 border border-emerald-800/70'
                      }`}
                    >
                      <span>{dept.code}</span>
                      <span className="text-[10px] opacity-85 font-sans font-semibold hidden sm:inline">• {dept.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30">{deptCount}</span>
                      {isUserDept && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-slate-950 font-black">YOUR DEPT</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <Search size={15} className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  placeholder="Search Dept, Course, Lecturer or Link Code (LIVE-CSC-...)..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/90 border border-emerald-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Concurrent Departmental Broadcast Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredStreams.map((stream) => {
              const deptCode = String(stream.department_code || 'CEM').toUpperCase();
              const deptName = stream.department_name || `Department of ${deptCode}`;
              const phase1Open = Boolean(stream.phase1_window_open);
              const isMyDept = userDeptText && (userDeptText.includes(deptCode) || userDeptText.includes(String(deptName).toUpperCase()));

              return (
                <div
                  key={stream.id}
                  className={`rounded-3xl p-6 border-2 transition shadow-xl flex flex-col justify-between gap-4 ${
                    isMyDept
                      ? 'bg-gradient-to-br from-[#062c1e] to-[#1f1218] border-amber-500/90'
                      : 'bg-[#031c14] border-emerald-800/80 hover:border-emerald-500/80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-rose-600 text-white flex items-center gap-1.5">
                          <Radio size={12} className="animate-pulse" />
                          <span>LIVE • {deptCode}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-200 border border-emerald-700/70">
                          {deptName}
                        </span>
                        {isMyDept && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black bg-amber-400 text-slate-950">
                            YOUR DEPARTMENT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-900 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <Users size={12} />
                          <span>{stream.viewers_count ?? 0} Online</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatElapsed(stream.elapsed_seconds)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Course & Title */}
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-300">
                        {stream.course_code || `${deptCode} 111`} • {stream.resolution || '1080p Full HD'}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-0.5 leading-snug">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-emerald-200 mt-1">
                        Lecturer / Host: <span className="font-bold text-white">{stream.lecturer_name}</span>
                      </p>
                    </div>

                    {/* Departmental Access & Attendance Window Status */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-900/80 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-400" />
                          <span>Dept Channel Code: <strong className="text-amber-300">{stream.id}</strong></span>
                        </span>
                        <button
                          onClick={(e) => handleCopyChannelLink(stream.id, e)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === stream.id ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedId === stream.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          phase1Open
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                        }`}>
                          {phase1Open
                            ? '✓ Phase 1 Attendance Window OPEN (First 10 Mins)'
                            : '✓ Phase 2 Final-Minute Attendance Tracked Automatically'}
                        </span>
                        <span className="text-slate-400">
                          Restricted to {deptName} ({deptCode}) &amp; Lecturer Roster
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Join Classroom Action */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-emerald-900/60">
                    <a
                      href={`#/live-classroom/${stream.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectChannel(stream);
                      }}
                      className="text-[11px] font-mono text-emerald-300 hover:text-amber-300 underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink size={12} />
                      <span className="truncate">#/live-classroom/{stream.id}</span>
                    </a>

                    <button
                      onClick={() => handleSelectChannel(stream)}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0"
                    >
                      <Play size={14} />
                      <span>Join {deptCode} Classroom</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-[#02140e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-[#01110b] border-2 border-emerald-800/80 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-emerald-950 border border-emerald-600/60 flex items-center justify-center text-emerald-300 mx-auto">
            {endedSessionInfo ? <CheckCircle2 size={30} /> : <Video size={30} />}
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-amber-300 border border-amber-700/60">
              {endedSessionInfo ? 'SESSION CONCLUDED & ARCHIVED' : 'CLASSROOM STANDBY'}
            </span>
            <h2 className="text-xl font-black text-white">
              {endedSessionInfo ? 'Departmental Live Broadcast Has Ended' : 'No Live Lecture Broadcast Currently Active'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {endedSessionInfo
                ? `The live lecture "${endedSessionInfo.title}" (${endedSessionInfo.department_code || 'Department'}) by ${endedSessionInfo.lecturer_name || 'Lecturer'} has concluded and been archived to the Audiobooks & Recorded Lectures catalogue.`
                : 'There is no active live broadcast in progress at this moment, or the lecturer has concluded the session and archived the recording to the Audiobooks & Recorded Lectures catalogue.'}
            </p>
          </div>

          {activeStreams.length > 0 && (
            <div className="space-y-2 text-left pt-2">
              <div className="text-xs font-mono font-bold text-emerald-300">
                Other Departmental Classrooms Live Right Now ({activeStreams.length}):
              </div>
              {activeStreams.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectChannel(s)}
                  className="w-full p-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/60 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px]">{s.department_code}</span>
                      <span>{s.title}</span>
                    </div>
                    <div className="text-[11px] text-rose-200 mt-0.5">{s.lecturer_name} • {s.course_code || s.department_name} • {s.viewers_count ?? 0} online</div>
                  </div>
                  <Play size={15} className="text-rose-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchSession(false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Check Again</span>
            </button>
            <button
              onClick={handleExit}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Return to Library</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentLiveBroadcastViewer
      broadcast={broadcast}
      activeStreams={activeStreams}
      currentUser={currentUser}
      isStandalonePage={true}
      onSwitchChannel={handleSelectChannel}
      onOpenChannelHub={() => setShowChannelDirectory(true)}
      onBroadcastEnded={(endedInfo) => {
        if (endedInfo) setEndedSessionInfo(endedInfo);
        setBroadcast(null);
        fetchSession(true);
      }}
      onClose={handleExit}
    />
  );
}
