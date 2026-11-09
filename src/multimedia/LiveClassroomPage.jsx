import React, { useState, useEffect } from 'react';
import { Video, RefreshCw, ArrowLeft, Users, BookOpen, Play, CheckCircle2 } from 'lucide-react';
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

  const extractBroadcastIdFromRoute = () => {
    const { path, params } = parseCurrentRoute();
    if (params?.id) return params.id;
    const parts = path.split('/').filter(Boolean);
    // e.g. /live-classroom/LIVE-OAO-2026... or /opac/live/LIVE-OAO-...
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
          if (sData.ended_broadcast) {
            setEndedSessionInfo(sData.ended_broadcast);
          }
        }
      }

      if (activeRes.ok) {
        const aData = await activeRes.json();
        const validStreams = Array.isArray(aData.streams)
          ? aData.streams.filter(s => s && Boolean(Number(s.is_live ?? 0)) && String(s.status || '').toLowerCase() === 'live')
          : [];
        setActiveStreams(validStreams);

        // Only auto-select an active broadcast if route was '/live-classroom' (generic 'active'), NOT a specific ended broadcast ID
        if (!foundActiveSession && targetId === 'active' && validStreams.length > 0) {
          foundActiveSession = validStreams[0];
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

    const onHashChange = () => fetchSession(false);
    const onEnded = () => {
      setBroadcast(null);
      fetchSession(true);
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
            setBroadcast(null);
            fetchSession(true);
          } else if (msg.data?.type === 'LIVE_BROADCAST_STARTED') {
            fetchSession(true);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (!evt) return;
      if (evt.action === 'LIVE_BROADCAST_ENDED') {
        setBroadcast(null);
        fetchSession(true);
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

  if (loading && !broadcast) {
    return (
      <div className="min-h-screen bg-[#02140e] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400 animate-pulse">
          <Video size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">Connecting to Institutional Live Classroom...</h2>
          <p className="text-xs text-emerald-300 font-mono">Synchronizing lecture session and presentation stream from database</p>
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
              {endedSessionInfo ? 'Live Lecture Broadcast Has Ended' : 'No Live Lecture Broadcast Currently Active'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {endedSessionInfo
                ? `The live lecture "${endedSessionInfo.title}" by ${endedSessionInfo.lecturer_name || 'Lecturer'} has concluded and been archived to the Audiobooks & Recorded Lectures catalogue.`
                : 'There is no active live broadcast in progress at this moment, or the lecturer has concluded the session and archived the recording to the Audiobooks & Recorded Lectures catalogue.'}
            </p>
          </div>

          {activeStreams.length > 0 && (
            <div className="space-y-2 text-left pt-2">
              <div className="text-xs font-mono font-bold text-emerald-300">Active Sessions Available Now:</div>
              {activeStreams.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setEndedSessionInfo(null);
                    setBroadcast(s);
                    navigateTo(`/live-classroom/${s.id}`);
                  }}
                  className="w-full p-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/60 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-white">{s.title}</div>
                    <div className="text-[11px] text-rose-200">{s.lecturer_name} • {s.course_code || s.department_code}</div>
                  </div>
                  <Play size={15} className="text-rose-300" />
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
      currentUser={currentUser}
      isStandalonePage={true}
      onBroadcastEnded={(endedInfo) => {
        if (endedInfo) setEndedSessionInfo(endedInfo);
        setBroadcast(null);
      }}
      onClose={handleExit}
    />
  );
}

