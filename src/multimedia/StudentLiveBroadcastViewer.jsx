import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Users, MessageSquare, Hand, Sparkles, Send, Volume2,
  VolumeX, Maximize2, Minimize2, Download, FileText, ArrowLeft,
  CheckCircle2, Share2, BookOpen, Wifi, ShieldAlert, MonitorUp, Eye,
  Lock, UserCheck, LogIn, KeyRound, GraduationCap, Layers, Check, Copy
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import { getActiveUserSession, storeUserSession } from '../utils/authSessionManager';
import { navigateTo } from '../utils/router';
import { subscribeRealtimeEvents } from '../services/realtimeSync';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

export default function StudentLiveBroadcastViewer({
  broadcast: initialBroadcast,
  currentUser = null,
  onClose = null,
  onBroadcastEnded = null,
  isStandalonePage = false
}) {
  const [broadcast, setBroadcast] = useState(initialBroadcast || null);

  // Resolve whether user is already logged into their Student Dashboard (or HOD/Admin/Developer)
  const resolveInitialVerifiedStudent = () => {
    const activeSession = currentUser || getActiveUserSession();
    if (
      activeSession &&
      ['student', 'hod', 'hod_staff', 'admin', 'developer'].includes(String(activeSession.role || '').toLowerCase()) &&
      (activeSession.matric || activeSession.barcode || activeSession.email || activeSession.id || activeSession.name)
    ) {
      return {
        ...activeSession,
        verified_via: 'dashboard_login'
      };
    }

    try {
      const savedVerified = sessionStorage.getItem('fcc_verified_live_student');
      if (savedVerified) {
        const parsed = JSON.parse(savedVerified);
        if (parsed && (parsed.matric || parsed.id || parsed.name)) {
          return parsed;
        }
      }
    } catch (e) {}

    return null;
  };

  const [verifiedStudent, setVerifiedStudent] = useState(resolveInitialVerifiedStudent);

  // Two-Way Verification Gate Form States (For Public / OPAC visitors not logged into Student Dashboard)
  const [gateMode, setGateMode] = useState('hod_details'); // 'hod_details' | 'dashboard_login'
  const [identifierInput, setIdentifierInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');

  // Presentation & Stage View States
  const [stageMode, setStageMode] = useState('video_and_board'); // 'video_and_board' | 'presentation_slides' | 'split_view'
  const [liveFrameUrl, setLiveFrameUrl] = useState('');
  const [hasLiveFrame, setHasLiveFrame] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Classroom Chat & Q&A States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [viewersCount, setViewersCount] = useState(initialBroadcast?.viewers_count || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time media connection states
  const [streamActive, setStreamActive] = useState(false);
  const [streamMode, setStreamMode] = useState('connecting'); // 'connecting' | 'webrtc' | 'http_buffer' | 'live_frame' | 'presentation_board'
  const [connectionDetails, setConnectionDetails] = useState('Synchronizing live classroom presentation & video stream...');

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const pcRef = useRef(null);
  const signalingChannelRef = useRef(null);

  const studentName = verifiedStudent?.name || currentUser?.name || 'FCC Student Scholar';
  const studentMatric = verifiedStudent?.matric || verifiedStudent?.barcode || currentUser?.matric || currentUser?.id || 'FCC/2026/01';
  const studentDept = verifiedStudent?.department || verifiedStudent?.department_name || currentUser?.department || '';

  const viewerIdRef = useRef(
    'VIEWER-' + Math.random().toString(36).substring(2, 9) + '-' + String(studentMatric).replace(/[^a-zA-Z0-9]/g, '')
  );

  // Sync if currentUser prop updates (e.g. student logs into dashboard)
  useEffect(() => {
    const resolved = resolveInitialVerifiedStudent();
    if (resolved) {
      setVerifiedStudent(resolved);
    }
  }, [currentUser]);

  // Sync broadcast prop updates
  useEffect(() => {
    if (initialBroadcast) {
      setBroadcast(initialBroadcast);
    }
  }, [initialBroadcast]);

  // Unconditional liveness listener (handles broadcast termination even while on the Student Access Gate)
  useEffect(() => {
    if (!broadcast?.id) return;
    let active = true;

    const triggerEnded = (endedInfo = null) => {
      if (!active) return;
      active = false;
      if (onBroadcastEnded) {
        onBroadcastEnded(endedInfo);
      } else if (onClose) {
        onClose();
      }
    };

    const onEndedWindow = () => triggerEnded(null);
    window.addEventListener('fcc-live-broadcast-ended', onEndedWindow);

    let liveBc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        liveBc = new BroadcastChannel('fcc_live_broadcast_channel');
        liveBc.onmessage = (msg) => {
          if (msg.data?.type === 'LIVE_BROADCAST_ENDED') {
            triggerEnded(null);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (evt && evt.action === 'LIVE_BROADCAST_ENDED') {
        triggerEnded(evt.data || null);
      }
    });

    return () => {
      active = false;
      window.removeEventListener('fcc-live-broadcast-ended', onEndedWindow);
      if (liveBc) {
        try { liveBc.close(); } catch (e) {}
      }
      if (typeof unsubRealtime === 'function') unsubRealtime();
    };
  }, [broadcast?.id]);

  // Way 1 Handler: Verify HOD-Registered Student Details against Database (POST /api/live-broadcast/verify-student)
  const handleVerifyHodStudentDetails = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setGateError('Please enter your HOD-registered Matriculation Number, Library Card ID, or Email.');
      return;
    }

    setGateLoading(true);
    setGateError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/verify-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput.trim(),
          name: nameInput.trim(),
          pin: pinInput.trim()
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.student) {
        sounds.playSuccessChime();
        try {
          sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(data.student));
        } catch (err) {}
        setVerifiedStudent(data.student);
      } else {
        sounds.playErrorBuzz();
        setGateError(
          data.error ||
            'Could not verify student details. Only students registered by their HOD can access the online lecture.'
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setGateError('Network error verifying student details with the database.');
    } finally {
      setGateLoading(false);
    }
  };

  // Way 2 Handler: Direct Student Dashboard Login (Logs student into their full Student Dashboard + enters classroom)
  const handleDashboardLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim() || !pinInput.trim()) {
      setGateError('Please enter your Student Matriculation Number / ID and Security PIN to log into your dashboard.');
      return;
    }

    setGateLoading(true);
    setGateError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput.trim(),
          matric: identifierInput.trim(),
          password: pinInput.trim(),
          pin: pinInput.trim(),
          role: 'student'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.user || data.student)) {
        const u = data.user || data.student;
        const studentSession = {
          ...u,
          role: u.role || 'student',
          matric: u.matric || u.barcode || identifierInput.trim(),
          verified_via: 'dashboard_login'
        };
        storeUserSession(studentSession, data.token || null, 'student');
        try {
          sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(studentSession));
        } catch (err) {}
        window.dispatchEvent(new CustomEvent('fcc-auth-changed', { detail: studentSession }));
        sounds.playSuccessChime();
        setVerifiedStudent(studentSession);
      } else {
        // Fallback to verify-student if PIN matches patron table directly
        const vRes = await fetch(`${base}/live-broadcast/verify-student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifierInput.trim(),
            pin: pinInput.trim()
          })
        });
        const vData = await vRes.json().catch(() => ({}));
        if (vRes.ok && vData.success && vData.student) {
          const studentSession = {
            ...vData.student,
            role: 'student',
            verified_via: 'dashboard_login'
          };
          storeUserSession(studentSession, null, 'student');
          try {
            sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(studentSession));
          } catch (err) {}
          window.dispatchEvent(new CustomEvent('fcc-auth-changed', { detail: studentSession }));
          sounds.playSuccessChime();
          setVerifiedStudent(studentSession);
        } else {
          sounds.playErrorBuzz();
          setGateError(data.error || data.message || vData.error || 'Invalid Student Dashboard login credentials.');
        }
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setGateError('Network error connecting to Student Dashboard authentication server.');
    } finally {
      setGateLoading(false);
    }
  };

  // Copy Dedicated Live Classroom Link
  const handleCopyClassroomLink = () => {
    const origin = window.location.origin + window.location.pathname;
    const link = broadcast?.id
      ? `${origin}#/live-classroom/${broadcast.id}`
      : `${origin}#/live-classroom`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedLink(true);
    sounds.playSuccessChime();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // 1. WebRTC Signaling Transmitter
  const sendSignalToHost = async (type, payload) => {
    const viewerId = viewerIdRef.current;

    if (signalingChannelRef.current) {
      signalingChannelRef.current.postMessage({
        sender_id: viewerId,
        recipient_id: 'host',
        signal_type: type,
        payload: payload
      });
    }

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

  // 3. Initialize WebRTC + Live Presentation Frame Polling + HTTP Stream once student is verified
  useEffect(() => {
    if (!broadcast?.id || !verifiedStudent) return;

    let isSubscribed = true;
    const viewerId = viewerIdRef.current;

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

    sendSignalToHost('join', {
      viewer_id: viewerId,
      name: studentName,
      matric: studentMatric
    });

    // Poll WebRTC signals every 1.5s
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

    // Poll Live Presentation Frame & Broadcast Metadata every 2.5s
    const handleRemoteEnded = (endedInfo = null) => {
      if (!isSubscribed) return;
      isSubscribed = false;
      if (onBroadcastEnded) {
        onBroadcastEnded(endedInfo);
      } else if (onClose) {
        onClose();
      }
    };

    const pollFrameAndSession = async () => {
      if (!isSubscribed) return;
      try {
        const base = getApiBase();
        const sRes = await fetch(`${base}/live-broadcast/session/${encodeURIComponent(broadcast.id)}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          const b = sData.broadcast;
          const isStillLive = Boolean(
            sData.active &&
            !sData.ended &&
            b &&
            Boolean(Number(b.is_live ?? 0)) &&
            String(b.status || '').toLowerCase() === 'live'
          );
          if (!isStillLive) {
            handleRemoteEnded(sData.ended_broadcast || null);
            return;
          }
          setBroadcast(prev => ({ ...prev, ...b }));
          if (b.has_live_frame) {
            setHasLiveFrame(true);
            setLiveFrameUrl(`${base}/live-broadcast/${broadcast.id}/frame?t=${Date.now()}`);
            if (!videoRef.current?.srcObject) {
              setStreamActive(true);
              setStreamMode(prev => (prev === 'webrtc' ? 'webrtc' : 'live_frame'));
            }
          }
        }
      } catch (e) {}
    };

    pollFrameAndSession();
    const framePollInterval = setInterval(pollFrameAndSession, 2500);

    const onEndedWindow = () => handleRemoteEnded(null);
    window.addEventListener('fcc-live-broadcast-ended', onEndedWindow);

    let liveBc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        liveBc = new BroadcastChannel('fcc_live_broadcast_channel');
        liveBc.onmessage = (msg) => {
          if (msg.data?.type === 'LIVE_BROADCAST_ENDED') {
            handleRemoteEnded(null);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (evt && evt.action === 'LIVE_BROADCAST_ENDED') {
        handleRemoteEnded(evt.data || null);
      }
    });

    // Check HTTP chunk stream or Presentation Board after 2.5s
    const bufferCheckTimer = setTimeout(() => {
      if (!videoRef.current?.srcObject) {
        attemptHttpBufferFallback();
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(signalInterval);
      clearInterval(framePollInterval);
      clearTimeout(bufferCheckTimer);
      window.removeEventListener('fcc-live-broadcast-ended', onEndedWindow);
      if (liveBc) {
        try { liveBc.close(); } catch (e) {}
      }
      if (typeof unsubRealtime === 'function') unsubRealtime();
      if (signalingChannelRef.current) {
        signalingChannelRef.current.close();
        signalingChannelRef.current = null;
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [broadcast?.id, verifiedStudent]);

  // Fallback to HTTP Live buffer or Interactive Course Presentation Board
  const attemptHttpBufferFallback = async () => {
    if (!broadcast?.id) return;
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
          return;
        }
      }
    } catch (e) {}

    // Even if lecturer camera stream isn't transmitting video packets yet, activate the Live Course Presentation Board
    setStreamActive(true);
    setStreamMode(prev => (prev === 'webrtc' || prev === 'live_frame' ? prev : 'presentation_board'));
    setConnectionDetails('📊 Live Classroom Presentation Board Active');
  };

  // Poll chat messages & heartbeat every 3 seconds once verified
  useEffect(() => {
    if (!broadcast?.id || !verifiedStudent) return;

    const fetchChat = async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcast.id}/chat`);
        if (res.ok) {
          const json = await res.json();
          if (json.messages) setMessages(json.messages);
          if (typeof json.viewers_count === 'number') setViewersCount(json.viewers_count);
        }
      } catch (e) {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);

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
  }, [broadcast?.id, verifiedStudent]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !broadcast?.id) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/${broadcast.id}/chat`, {
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
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) setMessages(data.messages);
      }
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
      const res = await fetch(`${base}/live-broadcast/${broadcast.id}/chat`, {
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
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) setMessages(data.messages);
      }
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

  // ============================================================================
  // TWO-WAY STUDENT ACCESS GATE (Shown ONLY if accessed from OPAC/Public without Student Dashboard Login)
  // ============================================================================
  if (!verifiedStudent) {
    return (
      <div className={`${isStandalonePage ? 'min-h-screen' : 'fixed inset-0 z-50'} bg-[#02140e] text-white flex flex-col justify-between overflow-y-auto animate-fadeIn`}>
        {/* TOP HEADER */}
        <header className="h-16 bg-[#01110b] border-b border-emerald-800/80 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to OPAC</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-600 text-white animate-pulse">
                🔴 LIVE LECTURE CLASSROOM GATEWAY
              </span>
              <span className="text-xs font-mono text-cyan-300 hidden sm:inline">
                {broadcast?.course_code || broadcast?.department_code}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyClassroomLink}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Classroom Link Copied!' : 'Copy Classroom Link'}</span>
          </button>
        </header>

        {/* CENTER VERIFICATION CARD */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#032217] to-[#01140d] border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* LECTURE SUMMARY BANNER */}
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white">
                    {broadcast?.course_code || broadcast?.department_code || 'LIVE CLASS'}
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    {broadcast?.department_name || 'Federal Cooperative College, Ibadan'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {broadcast?.title || 'Live Interactive Lecture & Presentation'}
                </h2>
                <p className="text-xs text-rose-200">
                  Supervising Lecturer: <strong className="text-white">{broadcast?.lecturer_name || 'Head of Department'}</strong>
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-rose-500/40 text-xs font-mono text-amber-300 flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                <Users size={14} />
                <span>{viewersCount} Online</span>
              </div>
            </div>

            {/* TWO-WAY ACCESS EXPLANATION */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-mono font-bold">
                <UserCheck size={13} />
                <span>TWO-WAY STUDENT CLASSROOM ACCESS VERIFICATION</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Verify Student Identity to Access Live Presentation
              </h3>
              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                Because you are joining from the public OPAC link, please either <strong>enter your HOD-registered student details</strong> below or <strong>log into your Student Dashboard</strong> (students already logged into their dashboard enter automatically without this prompt).
              </p>
            </div>

            {/* MODE SWITCHER TABS: WAY 1 (HOD-REGISTERED DETAILS) vs WAY 2 (STUDENT DASHBOARD LOGIN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#01110b] border border-emerald-800/80">
              <button
                type="button"
                onClick={() => { setGateMode('hod_details'); setGateError(''); sounds.playClick(); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  gateMode === 'hod_details'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'text-emerald-300/80 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <GraduationCap size={15} />
                <span>Option 1: HOD-Registered Student Details</span>
              </button>

              <button
                type="button"
                onClick={() => { setGateMode('dashboard_login'); setGateError(''); sounds.playClick(); }}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  gateMode === 'dashboard_login'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                    : 'text-cyan-300/80 hover:text-white hover:bg-cyan-950/50'
                }`}
              >
                <LogIn size={15} />
                <span>Option 2: Login to Student Dashboard</span>
              </button>
            </div>

            {gateError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500 text-xs text-rose-200 flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span>{gateError}</span>
              </div>
            )}

            {gateMode === 'hod_details' ? (
              <form onSubmit={handleVerifyHodStudentDetails} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-emerald-300 block">
                    HOD-Registered Matriculation Number / Library Card ID / Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="e.g. FCC/CEM/ND1/001 or Library Barcode or Student Email"
                    className="w-full px-4 py-3 rounded-xl bg-[#01110b] border border-emerald-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Registered Student Name (As Registered by HOD):
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Adewale Ogunleye"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#01110b] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Or Student Security PIN (Optional):
                    </label>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter 4-digit PIN (if set)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#01110b] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={gateLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
                >
                  <UserCheck size={17} />
                  <span>{gateLoading ? 'Verifying with HOD Database...' : 'Verify HOD-Registered Details & Enter Live Class'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleDashboardLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-cyan-300 block">
                    Student Matriculation Number / Library ID / Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="Enter your Matric Number or Student Email"
                    className="w-full px-4 py-3 rounded-xl bg-[#01110b] border border-cyan-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-cyan-300 block">
                    Student Portal Security PIN / Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter your Student Portal PIN / Password"
                    className="w-full px-4 py-3 rounded-xl bg-[#01110b] border border-cyan-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={gateLoading}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-950 transition cursor-pointer disabled:opacity-50"
                  >
                    <LogIn size={17} />
                    <span>{gateLoading ? 'Signing In to Dashboard...' : 'Login to Student Dashboard & Enter Class'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (broadcast?.id) {
                          sessionStorage.setItem('fcc_return_to_live_class', broadcast.id);
                        }
                      } catch (e) {}
                      navigateTo('/login');
                    }}
                    className="px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    Open Full Portal Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VERIFIED STUDENT LIVE CLASSROOM & PRESENTATION WORKSPACE
  // ============================================================================
  const renderPresentationBoard = () => (
    <div className="w-full h-full flex flex-col justify-between p-5 sm:p-8 bg-gradient-to-br from-[#021d14] via-[#01110b] to-[#06152d] text-white overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-600 text-white flex items-center gap-1.5">
            <Layers size={12} />
            <span>LIVE LECTURE PRESENTATION DECK</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-black/60 text-cyan-300 border border-cyan-700/70">
            {broadcast?.course_code || broadcast?.department_code}
          </span>
          {broadcast?.target_level && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-black/60 text-amber-300 border border-amber-700/70">
              {broadcast.target_level}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-emerald-300">
          {broadcast?.department_name}
        </span>
      </div>

      {/* CENTRAL PRESENTATION SLIDE STAGE */}
      <div className="my-auto py-6 space-y-5 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>Interactive Classroom Presentation - Active Session</span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
          {broadcast?.title || 'Live Departmental Lecture'}
        </h2>

        <p className="text-xs sm:text-sm text-cyan-200 font-mono">
          Presented by: <strong className="text-white">{broadcast?.lecturer_name}</strong> ({broadcast?.department_name})
        </p>

        {broadcast?.announcement && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto shadow-lg text-left">
            <div className="text-[10px] font-mono font-bold text-emerald-300 uppercase mb-1">
              📢 Lecturer Presentation Bulletin &amp; Key Note:
            </div>
            <p className="leading-relaxed">{broadcast.announcement}</p>
          </div>
        )}

        {/* COMPANION PDF / SLIDE DECK EMBED OR DIRECT LAUNCH */}
        {broadcast?.companion_pdf_url ? (
          <div className="pt-2 space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStageMode('presentation_slides')}
                className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition"
              >
                <FileText size={15} />
                <span>Open Fullscreen Lecture Slides / Handout</span>
              </button>
              <a
                href={broadcast.companion_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-600/70 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                <span>Download Presentation PDF</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left text-xs">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-800/80 space-y-1">
              <div className="text-[10px] font-mono text-emerald-400 font-bold">MODULE 01</div>
              <div className="font-bold text-white">Core Concepts &amp; Principles</div>
              <p className="text-[11px] text-slate-300">
                Foundational theoretical framework for {broadcast?.course_code || broadcast?.department_code}.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-800/80 space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold">MODULE 02</div>
              <div className="font-bold text-white">Practical Case Application</div>
              <p className="text-[11px] text-slate-300">
                Real-world cooperative &amp; institutional case analysis with live Q&amp;A.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/50 border border-emerald-800/80 space-y-1">
              <div className="text-[10px] font-mono text-amber-400 font-bold">MODULE 03</div>
              <div className="font-bold text-white">Interactive Assessment</div>
              <p className="text-[11px] text-slate-300">
                Use the Classroom Discussion panel on the right to ask questions or raise your hand.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-emerald-900/60 text-[11px] font-mono text-slate-400">
        <span>Connected Student: <strong className="text-emerald-300">{studentName} ({studentMatric})</strong></span>
        <span>Stream Resolution: <strong className="text-cyan-300">{broadcast?.resolution || '1080p Full HD'}</strong></span>
      </div>
    </div>
  );

  return (
    <div className={`${isStandalonePage ? 'min-h-screen' : 'fixed inset-0 z-50'} bg-slate-950 text-white flex flex-col overflow-hidden animate-fadeIn`}>
      {/* APEX HEADER */}
      <header className="min-h-14 py-2 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                <Video size={11} />
                <span>LIVE CLASSROOM</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {broadcast?.course_code || broadcast?.department_code}
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={10} />
                <span>
                  {verifiedStudent?.verified_via === 'dashboard_login'
                    ? `Dashboard Verified: ${studentName}`
                    : `HOD Record Verified: ${studentName} (${studentMatric})`}
                </span>
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-xl" title={broadcast?.title}>
              {broadcast?.title}
            </h1>
          </div>
        </div>

        {/* STAGE VIEW MODE SWITCHER & ONLINE COUNT */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStageMode('video_and_board')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                stageMode === 'video_and_board' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎥 Live Stream
            </button>
            <button
              type="button"
              onClick={() => setStageMode('presentation_slides')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                stageMode === 'presentation_slides' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Presentation
            </button>
            <button
              type="button"
              onClick={() => setStageMode('split_view')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer hidden md:inline-block ${
                stageMode === 'split_view' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🖥️ Split View
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyClassroomLink}
            className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
            title="Copy Dedicated Page Link for this Live Lecture"
          >
            <Share2 size={12} />
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied ✓' : 'Share Link'}</span>
          </button>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/80 text-amber-300 border border-amber-600/60 flex items-center gap-1.5 shadow">
            <Users size={13} />
            <span>{viewersCount} Online</span>
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* WORKSPACE: 2 COLUMNS */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: LIVE VIDEO & PRESENTATION STAGE */}
        <div className="lg:col-span-8 bg-black flex flex-col justify-between relative group overflow-hidden" ref={playerContainerRef}>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-950 to-black">
            {/* 1. VIDEO + PRESENTATION MODE */}
            {stageMode === 'video_and_board' && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className={`w-full h-full object-contain max-h-[82vh] ${
                    streamMode === 'webrtc' || streamMode === 'http_buffer' ? 'block' : 'hidden'
                  }`}
                />

                {streamMode === 'live_frame' && hasLiveFrame && liveFrameUrl && (
                  <img
                    src={liveFrameUrl}
                    alt="Live Lecturer Presentation Feed"
                    className="w-full h-full object-contain max-h-[82vh]"
                  />
                )}

                {(streamMode === 'presentation_board' || streamMode === 'connecting') && (
                  renderPresentationBoard()
                )}
              </>
            )}

            {/* 2. DEDICATED PRESENTATION SLIDES / PDF HANDOUT VIEW */}
            {stageMode === 'presentation_slides' && (
              broadcast?.companion_pdf_url ? (
                <iframe
                  src={broadcast.companion_pdf_url}
                  title="Live Lecture Companion Presentation PDF"
                  className="w-full h-full border-0 bg-slate-900"
                />
              ) : (
                renderPresentationBoard()
              )
            )}

            {/* 3. SPLIT VIEW (LIVE STREAM + PRESENTATION SLIDES SIDE BY SIDE) */}
            {stageMode === 'split_view' && (
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
                <div className="relative bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className={`w-full h-full object-contain ${
                      streamMode === 'webrtc' || streamMode === 'http_buffer' ? 'block' : 'hidden'
                    }`}
                  />
                  {streamMode !== 'webrtc' && streamMode !== 'http_buffer' && hasLiveFrame && liveFrameUrl ? (
                    <img
                      src={liveFrameUrl}
                      alt="Live Lecturer Camera/Screen Feed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    streamMode !== 'webrtc' &&
                    streamMode !== 'http_buffer' && (
                      <div className="p-6 text-center space-y-2">
                        <Video size={32} className="mx-auto text-rose-400 animate-pulse" />
                        <p className="text-xs font-bold text-white">Lecturer Camera / Screen Feed</p>
                        <p className="text-[11px] text-slate-400 font-mono">{connectionDetails}</p>
                      </div>
                    )
                  )}
                </div>
                <div className="h-full overflow-y-auto">
                  {broadcast?.companion_pdf_url ? (
                    <iframe
                      src={broadcast.companion_pdf_url}
                      title="Lecture Presentation Slides"
                      className="w-full h-full border-0 bg-slate-900"
                    />
                  ) : (
                    renderPresentationBoard()
                  )}
                </div>
              </div>
            )}

            {/* LIVE STREAM MODE & STATUS BADGES (TOP LEFT) */}
            <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap z-20 pointer-events-none">
              <div className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-600/95 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>FCC LIVE CLASSROOM</span>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-600/60 shadow">
                {streamMode === 'webrtc'
                  ? '⚡ 1080p WebRTC Live Stream'
                  : streamMode === 'live_frame'
                  ? '🖥️ Live Presentation Feed'
                  : streamMode === 'http_buffer'
                  ? '📺 HD Buffer Stream'
                  : '📊 Interactive Presentation Stage'}
              </span>
            </div>

            {/* CONTROLS (BOTTOM RIGHT) */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              <button
                type="button"
                onClick={attemptHttpBufferFallback}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1 cursor-pointer"
                title="Refresh Live Stream & Presentation"
              >
                <Wifi size={12} />
                <span className="hidden sm:inline">Sync Feed</span>
              </button>

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

              <button
                onClick={togglePictureInPicture}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                title="Picture-in-Picture Mode"
              >
                <MonitorUp size={15} />
              </button>

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

            {broadcast?.announcement && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-200">
                📢 <strong>Lecturer:</strong> {broadcast.announcement}
              </div>
            )}

            {broadcast?.companion_pdf_url && (
              <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-700/80 text-[11px] text-cyan-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStageMode('presentation_slides')}
                  className="flex items-center gap-1.5 font-bold hover:text-white cursor-pointer text-left"
                >
                  <FileText size={13} className="text-cyan-400 shrink-0" />
                  <span>View Presentation Slides / Handout</span>
                </button>
                <a
                  href={broadcast.companion_pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 hover:text-white shrink-0"
                >
                  <Download size={11} /> PDF
                </a>
              </div>
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
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-amber-300 cursor-pointer font-mono">
                <input
                  type="checkbox"
                  checked={isQuestion}
                  onChange={(e) => setIsQuestion(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Tag as Question for Lecturer</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {studentMatric}
              </span>
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
