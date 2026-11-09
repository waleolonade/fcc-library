import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Users, MessageSquare, Hand, Sparkles, Send, Volume2,
  VolumeX, Maximize2, Minimize2, Download, FileText, ArrowLeft,
  CheckCircle2, Share2, BookOpen, Wifi, ShieldAlert, MonitorUp, Eye
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

export default function StudentLiveBroadcastViewer({
  broadcast,
  currentUser = null,
  onClose = null
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [viewersCount, setViewersCount] = useState(broadcast?.viewers_count || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time media connection states
  const [streamActive, setStreamActive] = useState(false);
  const [streamMode, setStreamMode] = useState('connecting'); // 'connecting' | 'webrtc' | 'http_buffer' | 'waiting'
  const [connectionDetails, setConnectionDetails] = useState('Initiating secure WebRTC handshake...');

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const pcRef = useRef(null);
  const signalingChannelRef = useRef(null);
  const viewerIdRef = useRef(
    'VIEWER-' + Math.random().toString(36).substring(2, 9) + '-' + (currentUser?.matric || 'FCC').replace(/[^a-zA-Z0-9]/g, '')
  );

  const studentName = currentUser?.name || 'FCC Student Scholar';
  const studentMatric = currentUser?.matric || currentUser?.id || 'FCC/2026/01';

  // 1. WebRTC Signaling Transmitter
  const sendSignalToHost = async (type, payload) => {
    const viewerId = viewerIdRef.current;

    // A. Local BroadcastChannel for instant same-browser / same-LAN transmission
    if (signalingChannelRef.current) {
      signalingChannelRef.current.postMessage({
        sender_id: viewerId,
        recipient_id: 'host',
        signal_type: type,
        payload: payload
      });
    }

    // B. Send via Laravel backend for remote LAN / Internet students
    if (broadcast?.id) {
      try {
        const base = getApiBase();
        await fetch(`${base}/live-broadcast/${broadcast.id}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: viewerId,
            recipient_id: 'host',
            signal_type: type,
            payload: payload
          })
        });
      } catch (e) {}
    }
  };

  // 2. WebRTC Signal Receiver
  const handleHostSignal = async (signal) => {
    const { signal_type, payload } = signal;

    if (signal_type === 'offer') {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        const offerDesc = typeof payload === 'string' ? JSON.parse(payload) : payload;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendSignalToHost('answer', answer);
        setConnectionDetails('WebRTC handshake established. Synchronizing live audio/video...');
      } catch (err) {
        console.warn('Error handling offer from host:', err);
      }
    } else if (signal_type === 'ice_candidate') {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        const candidate = typeof payload === 'string' ? JSON.parse(payload) : payload;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {}
    }
  };

  // 3. Initialize WebRTC connection to Broadcaster
  useEffect(() => {
    if (!broadcast?.id) return;

    let isSubscribed = true;
    const viewerId = viewerIdRef.current;

    // Create RTCPeerConnection
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch(() => {});
        }
        setStreamActive(true);
        setStreamMode('webrtc');
        setConnectionDetails('🔴 Real-time WebRTC Live Stream Connected (Zero Latency)');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalToHost('ice_candidate', event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStreamActive(true);
        setStreamMode('webrtc');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        attemptHttpBufferFallback();
      }
    };

    // Setup Local BroadcastChannel for fast tab-to-tab transmission
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('fcc_live_signaling_' + broadcast.id);
        bc.onmessage = (e) => {
          if (e.data && e.data.recipient_id === viewerId) {
            handleHostSignal(e.data);
          }
        };
        signalingChannelRef.current = bc;
      }
    } catch (e) {}

    // Send Join request to Lecturer
    sendSignalToHost('join', {
      viewer_id: viewerId,
      name: studentName,
      matric: studentMatric
    });

    // Poll signals from backend every 1.5s
    const signalInterval = setInterval(async () => {
      if (!isSubscribed) return;
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcast.id}/signal?recipient_id=${viewerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.signals && data.signals.length > 0) {
            for (const sig of data.signals) {
              handleHostSignal(sig);
            }
          }
        }
      } catch (e) {}
    }, 1500);

    // Fallback: Check server-side HTTP chunk stream after 3.5s if WebRTC track has not arrived
    const bufferCheckTimer = setTimeout(() => {
      if (!streamActive) {
        attemptHttpBufferFallback();
      }
    }, 3500);

    return () => {
      isSubscribed = false;
      clearInterval(signalInterval);
      clearTimeout(bufferCheckTimer);
      if (signalingChannelRef.current) {
        signalingChannelRef.current.close();
        signalingChannelRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [broadcast?.id]);

  // Fallback to HTTP Live buffer if WebRTC peer connection is pending or blocked
  const attemptHttpBufferFallback = async () => {
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/${broadcast.id}/stream`, { method: 'HEAD' });
      if (res.ok || res.status === 206 || res.status === 200) {
        if (videoRef.current && !videoRef.current.srcObject) {
          videoRef.current.src = `${base}/live-broadcast/${broadcast.id}/stream?t=${Date.now()}`;
          videoRef.current.play().catch(() => {});
          setStreamActive(true);
          setStreamMode('http_buffer');
          setConnectionDetails('🟡 HTTP Partial Live Stream Connected (Server Ingest Buffer)');
        }
      } else {
        setConnectionDetails('Waiting for lecturer video packet transmission...');
      }
    } catch (e) {
      setConnectionDetails('Waiting for lecturer camera broadcast feed...');
    }
  };

  // Poll chat messages & heartbeat every 3 seconds
  useEffect(() => {
    if (!broadcast?.id) return;

    const fetchChat = async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcast.id}/chat`);
        if (res.ok) {
          const json = await res.json();
          if (json.messages) setMessages(json.messages);
          if (json.viewers_count) setViewersCount(json.viewers_count);
        }
      } catch (e) {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);

    // Immediate + periodic heartbeat to keep viewer counted online in database
    const sendHeartbeat = async (isLeaving = false) => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcast.id}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewer_id: viewerIdRef.current,
            matric: studentMatric,
            name: studentName,
            leave: isLeaving
          })
        });
        if (res.ok && !isLeaving) {
          const hbData = await res.json();
          if (typeof hbData.viewers_count === 'number') {
            setViewersCount(hbData.viewers_count);
          }
        }
      } catch (e) {}
    };

    sendHeartbeat(false);
    const hbInterval = setInterval(() => sendHeartbeat(false), 12000);

    return () => {
      clearInterval(interval);
      clearInterval(hbInterval);
      sendHeartbeat(true);
    };
  }, [broadcast?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !broadcast?.id) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const base = getApiBase();
      await fetch(`${base}/live-broadcast/${broadcast.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: studentName,
          user_role: 'student',
          user_matric: studentMatric,
          message: text,
          is_question: isQuestion,
          hand_raised: hasRaisedHand
        })
      });
      sounds.playClick();
      setIsQuestion(false);
    } catch (e) {}
  };

  const handleToggleHandRaise = async () => {
    const newState = !hasRaisedHand;
    setHasRaisedHand(newState);
    sounds.playSuccessChime();

    try {
      const base = getApiBase();
      await fetch(`${base}/live-broadcast/${broadcast.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: studentName,
          user_role: 'student',
          user_matric: studentMatric,
          message: newState ? '✋ Raised hand to ask an academic question.' : 'Lowered hand.',
          is_question: true,
          hand_raised: newState
        })
      });
    } catch (e) {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP failed:', e);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden animate-fadeIn">
      {/* APEX HEADER */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                <Video size={11} />
                <span>LIVE TRANSMISSION</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {broadcast.course_code || broadcast.department_code}
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {broadcast.department_name}
              </span>
            </div>
            <h1 className="text-sm font-bold text-white truncate max-w-xl" title={broadcast.title}>
              {broadcast.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/80 text-amber-300 border border-amber-600/60 flex items-center gap-1.5 shadow">
            <Users size={13} />
            <span>{viewersCount} Students Online</span>
          </span>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </header>

      {/* WORKSPACE: 2 COLUMNS */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: LIVE VIDEO PLAYER STAGE */}
        <div className="lg:col-span-8 bg-black flex flex-col justify-between relative group" ref={playerContainerRef}>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-950 to-black">
            {/* REAL VIDEO ELEMENT - ATTACHED TO WEBRTC MEDIASTREAM OR REAL LIVE STREAM */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-contain max-h-[80vh]"
            />

            {/* WAITING OVERLAY IF FEED IS CONNECTING */}
            {!streamActive && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 animate-pulse">
                  <Video size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Connecting to Lecturer's Live Stream</h3>
                  <p className="text-xs text-rose-200/80 font-mono max-w-md">
                    {connectionDetails}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={attemptHttpBufferFallback}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
                  >
                    <Wifi size={13} />
                    <span>Force Reconnect Live Feed</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE STREAM MODE & STATUS BADGES (TOP LEFT) */}
            <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-20">
              <div className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-600/95 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>FCC LIVE CLASSROOM</span>
              </div>

              {streamActive && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-600/60 shadow">
                  {streamMode === 'webrtc' ? '⚡ 1080p Ultra-Low Latency' : '📺 HD Buffer Stream'}
                </span>
              )}
            </div>

            {/* LECTURER BANNER (BOTTOM LEFT) */}
            <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-xs space-y-0.5 z-20 pointer-events-none">
              <div className="text-[10px] font-mono text-cyan-300 uppercase">Supervising Lecturer:</div>
              <div className="font-bold text-white">{broadcast.lecturer_name}</div>
              <div className="text-[10px] text-slate-400">{broadcast.department_name}</div>
            </div>

            {/* CONTROLS (BOTTOM RIGHT) */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              {/* Volume Slider & Mute Toggle */}
              <div className="flex items-center gap-1.5 px-2">
                <button
                  onClick={() => handleVolumeChange(isMuted ? 0.8 : 0)}
                  className="p-1.5 text-white hover:text-emerald-400 transition cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-emerald-500 cursor-pointer h-1.5"
                />
              </div>

              {/* Picture-in-Picture Button */}
              <button
                onClick={togglePictureInPicture}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                title="Picture-in-Picture Mode"
              >
                <MonitorUp size={15} />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE STUDENT CHAT & HAND RAISE */}
        <div className="lg:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col justify-between overflow-hidden">
          {/* TOP ANNOUNCEMENT & HAND RAISE BAR */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wide font-mono flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-400" />
                <span>Classroom Discussion</span>
              </span>

              <button
                onClick={handleToggleHandRaise}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                  hasRaisedHand
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                }`}
              >
                <Hand size={13} />
                <span>{hasRaisedHand ? 'Hand Raised!' : 'Raise Hand'}</span>
              </button>
            </div>

            {broadcast.announcement && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-200">
                📢 <strong>Lecturer:</strong> {broadcast.announcement}
              </div>
            )}

            {broadcast.companion_pdf_url && (
              <a
                href={broadcast.companion_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-700/80 text-[11px] text-cyan-200 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <FileText size={13} className="text-cyan-400" />
                  <span>Lecture Handout / Companion PDF</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300">
                  <Download size={11} /> Download
                </span>
              </a>
            )}
          </div>

          {/* MESSAGES SCROLL LIST */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-mono">
                Live discussion channel open. Post your thoughts and questions to the lecturer.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className={`p-3 rounded-2xl space-y-1 ${
                    m.user_role === 'hod'
                      ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-100'
                      : m.is_question
                      ? 'bg-amber-950/80 border border-amber-700/80 text-amber-100'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-white">{m.user_name}</span>
                    {m.is_question && <span className="text-amber-300 font-bold">QUESTION</span>}
                    {m.hand_raised && <span className="text-cyan-300">✋ RAISED HAND</span>}
                  </div>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              ))
            )}
          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-amber-300 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={isQuestion}
                  onChange={(e) => setIsQuestion(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Tag as Question for Lecturer</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a question or comment..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
