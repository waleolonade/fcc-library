import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Users, MessageSquare, Hand, Sparkles, Send, Volume2,
  VolumeX, Maximize2, Minimize2, Download, FileText, ArrowLeft,
  CheckCircle2, Share2, BookOpen, Wifi, ShieldAlert, MonitorUp, Eye,
  Lock, UserCheck, LogIn, KeyRound, GraduationCap, Layers, Check, Copy,
  UserPlus, ClipboardCheck, Clock
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
  activeStreams: initialActiveStreams = [],
  currentUser = null,
  onClose = null,
  onBroadcastEnded = null,
  onSwitchChannel = null,
  onOpenChannelHub = null,
  isStandalonePage = false
}) {
  const [broadcast, setBroadcast] = useState(initialBroadcast || null);
  const [campusActiveStreams, setCampusActiveStreams] = useState(
    Array.isArray(initialActiveStreams) ? initialActiveStreams : []
  );

  useEffect(() => {
    if (Array.isArray(initialActiveStreams)) {
      setCampusActiveStreams(initialActiveStreams);
    }
  }, [initialActiveStreams]);

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

  // Verification & Matric Submission Gate States
  const [gateMode, setGateMode] = useState('hod_details'); // 'hod_details' | 'submit_matric' | 'dashboard_login'
  const [identifierInput, setIdentifierInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [submitLevelInput, setSubmitLevelInput] = useState('ND I');
  const [matricSubmittedSuccess, setMatricSubmittedSuccess] = useState(false);
  const [matricSubmittedMsg, setMatricSubmittedMsg] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');

  // Two-Phase Student Class Attendance State (First 10 Minutes & Last Minute)
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [lastMinuteWindowOpen, setLastMinuteWindowOpen] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

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

    const matchesCurrentBroadcast = (endedId) => {
      if (!endedId || endedId === 'ALL') return true;
      return String(endedId) === String(broadcast.id);
    };

    const onEndedWindow = (e) => {
      const endedId = e?.detail?.id || null;
      if (matchesCurrentBroadcast(endedId)) {
        triggerEnded(null);
      }
    };
    window.addEventListener('fcc-live-broadcast-ended', onEndedWindow);

    let liveBc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        liveBc = new BroadcastChannel('fcc_live_broadcast_channel');
        liveBc.onmessage = (msg) => {
          if (msg.data?.type === 'LIVE_BROADCAST_ENDED' && matchesCurrentBroadcast(msg.data?.id)) {
            triggerEnded(null);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (evt && evt.action === 'LIVE_BROADCAST_ENDED') {
        const endedId = evt.id || evt.data?.id || null;
        if (matchesCurrentBroadcast(endedId)) {
          triggerEnded(evt.data || null);
        }
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

  // Enforce Departmental Access Control & Record First 10-Minute Attendance even for pre-logged-in students
  useEffect(() => {
    if (!broadcast?.id || !verifiedStudent) return;
    const roleStr = String(verifiedStudent.role || 'student').toLowerCase();
    // Admin / Developer / HOD bypass strict student gate
    if (['admin', 'developer', 'hod', 'hod_staff'].includes(roleStr)) return;

    // If already verified specifically for this broadcast_id, skip duplicate call
    if (verifiedStudent.verified_for_broadcast_id === broadcast.id && studentAttendance) return;

    let cancelled = false;
    const verifyDeptAndMarkAttendance = async () => {
      try {
        const base = getApiBase();
        const ident = verifiedStudent.matric || verifiedStudent.barcode || verifiedStudent.email || verifiedStudent.id || '';
        if (!ident) return;

        const res = await fetch(`${base}/live-broadcast/verify-student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            identifier: ident,
            name: verifiedStudent.name || '',
            broadcast_id: broadcast.id,
            department_code: broadcast.department_code || '',
            department_name: broadcast.department_name || ''
          })
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok && data.success && data.student) {
          const updatedStudent = {
            ...verifiedStudent,
            ...data.student,
            verified_for_broadcast_id: broadcast.id
          };
          setVerifiedStudent(updatedStudent);
          if (data.attendance) {
            setStudentAttendance(data.attendance);
          }
          try {
            sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(updatedStudent));
          } catch (e) {}
        } else if (res.status === 403 || data.code === 'DEPARTMENT_ACCESS_RESTRICTED') {
          // Student belongs to a different department — block access and show Departmental Access Gate
          try {
            sessionStorage.removeItem('fcc_verified_live_student');
          } catch (e) {}
          setVerifiedStudent(null);
          setIdentifierInput(ident);
          setGateError(
            data.error ||
              `Departmental Access Restricted: This classroom is organized by ${broadcast.department_name || broadcast.department_code}. Only students of ${broadcast.department_code} can join.`
          );
        }
      } catch (e) {}
    };

    verifyDeptAndMarkAttendance();
    return () => {
      cancelled = true;
    };
  }, [broadcast?.id, broadcast?.department_code]);

  // Listen for real-time Lecturer Roster Approval when a student has submitted their Matric No.
  useEffect(() => {
    if (verifiedStudent || !identifierInput.trim()) return;

    const unsub = subscribeRealtimeEvents((evt) => {
      if (evt && evt.action === 'LIVE_ROSTER_STUDENT_ADDED') {
        const cleanInput = identifierInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cleanApproved = String(evt.id || evt.data?.matric_no || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!cleanApproved || cleanApproved === cleanInput) {
          // Auto-attempt verification now that lecturer approved the Matric No.
          handleVerifyStudentByMatricDirect(identifierInput.trim(), nameInput.trim(), pinInput.trim());
        }
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [verifiedStudent, identifierInput, nameInput, pinInput, broadcast?.id]);

  // Helper to verify Matric No. & enter classroom
  const handleVerifyStudentByMatricDirect = async (identVal, nameVal = '', pinVal = '') => {
    if (!identVal) return;
    setGateLoading(true);
    setGateError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/verify-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          identifier: identVal,
          name: nameVal,
          pin: pinVal,
          broadcast_id: broadcast?.id || '',
          department_code: broadcast?.department_code || '',
          department_name: broadcast?.department_name || ''
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.student) {
        sounds.playSuccessChime();
        const verifiedObj = {
          ...data.student,
          verified_for_broadcast_id: broadcast?.id || ''
        };
        if (data.attendance) {
          setStudentAttendance(data.attendance);
        }
        try {
          sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(verifiedObj));
        } catch (err) {}
        setVerifiedStudent(verifiedObj);
      } else {
        sounds.playErrorBuzz();
        setGateError(
          data.error ||
            `Could not verify Matric No. for ${broadcast?.department_name || broadcast?.department_code || 'this department'}. You can submit your Matric No. to the lecturer on Tab 2 so they can add you.`
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setGateError('Network error verifying student Matric No. with the database.');
    } finally {
      setGateLoading(false);
    }
  };

  // Way 1 Handler: Join Classroom by Matric No. (or Lecturer-Created Username + Password)
  const handleVerifyHodStudentDetails = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setGateError('Please enter your Matriculation Number (or Lecturer-assigned Username) to join the class.');
      return;
    }
    await handleVerifyStudentByMatricDirect(identifierInput.trim(), nameInput.trim(), pinInput.trim());
  };

  // Way 2 Handler: Submit Matric No. to Lecturer so Lecturer Can Add Student to Classroom Roster
  const handleSubmitMatricToLecturer = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setGateError('Please enter your Matriculation Number to submit to the lecturer.');
      return;
    }

    setGateLoading(true);
    setGateError('');
    setMatricSubmittedSuccess(false);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/roster/submit-matric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          broadcast_id: broadcast?.id || '',
          department_code: broadcast?.department_code || '',
          department_name: broadcast?.department_name || '',
          matric_no: identifierInput.trim(),
          student_name: nameInput.trim() || `${broadcast?.department_code || 'FCC'} Student`,
          level: submitLevelInput || broadcast?.target_level || 'ND I'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        sounds.playSuccessChime();
        if (data.already_approved) {
          // Already approved by lecturer! Enter classroom immediately
          await handleVerifyStudentByMatricDirect(identifierInput.trim(), nameInput.trim(), pinInput.trim());
          return;
        }
        setMatricSubmittedSuccess(true);
        setMatricSubmittedMsg(
          data.message ||
            'Your Matric No. has been submitted to the lecturer! Once the lecturer clicks "Approve & Add" in the studio, click "Join Class Now" below.'
        );
      } else {
        sounds.playErrorBuzz();
        setGateError(data.error || 'Unable to submit Matric No. to lecturer.');
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setGateError('Network error submitting Matric No. to the lecturer.');
    } finally {
      setGateLoading(false);
    }
  };

  // Way 3 Handler: Direct Student Dashboard Login + Departmental Verification
  const handleDashboardLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifierInput.trim() || !pinInput.trim()) {
      setGateError('Please enter your Student Matriculation Number / ID and Security PIN / Password.');
      return;
    }

    setGateLoading(true);
    setGateError('');
    try {
      const base = getApiBase();
      // Verify against classroom endpoint first (checks Lecturer Roster + Departmental Match + PIN)
      const vRes = await fetch(`${base}/live-broadcast/verify-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput.trim(),
          name: nameInput.trim(),
          pin: pinInput.trim(),
          broadcast_id: broadcast?.id || '',
          department_code: broadcast?.department_code || '',
          department_name: broadcast?.department_name || ''
        })
      });
      const vData = await vRes.json().catch(() => ({}));
      if (vRes.ok && vData.success && vData.student) {
        const studentSession = {
          ...vData.student,
          role: 'student',
          verified_via: 'dashboard_login',
          verified_for_broadcast_id: broadcast?.id || ''
        };
        if (vData.attendance) {
          setStudentAttendance(vData.attendance);
        }
        storeUserSession(studentSession, null, 'student');
        try {
          sessionStorage.setItem('fcc_verified_live_student', JSON.stringify(studentSession));
        } catch (err) {}
        window.dispatchEvent(new CustomEvent('fcc-auth-changed', { detail: studentSession }));
        sounds.playSuccessChime();
        setVerifiedStudent(studentSession);
      } else {
        sounds.playErrorBuzz();
        setGateError(
          vData.error ||
            'Access denied: Invalid credentials or your department does not match the department organizing this classroom.'
        );
      }
    } catch (err) {
      sounds.playErrorBuzz();
      setGateError('Network error connecting to Student Dashboard authentication server.');
    } finally {
      setGateLoading(false);
    }
  };

  // Manual / Explicit Student Attendance Check-In (First 10 Mins or Last Minute)
  const handleManualAttendanceCheckIn = async () => {
    if (!broadcast?.id || !verifiedStudent) return;
    setIsMarkingAttendance(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/${encodeURIComponent(broadcast.id)}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matric_no: studentMatric,
          student_name: studentName,
          department_code: studentDept || broadcast.department_code || '',
          level: verifiedStudent.level || broadcast.target_level || 'ND I',
          phase: 'auto'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.attendance) {
        sounds.playSuccessChime();
        setStudentAttendance(data.attendance);
      }
    } catch (e) {} finally {
      setIsMarkingAttendance(false);
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
          if (Array.isArray(sData.active_streams)) {
            setCampusActiveStreams(sData.active_streams);
          }
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

    const matchesBroadcastId = (endedId) => {
      if (!endedId || endedId === 'ALL') return true;
      return String(endedId) === String(broadcast.id);
    };

    const onEndedWindow = (e) => {
      if (matchesBroadcastId(e?.detail?.id)) {
        handleRemoteEnded(null);
      }
    };
    window.addEventListener('fcc-live-broadcast-ended', onEndedWindow);

    let liveBc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        liveBc = new BroadcastChannel('fcc_live_broadcast_channel');
        liveBc.onmessage = (msg) => {
          if (msg.data?.type === 'LIVE_BROADCAST_ENDED' && matchesBroadcastId(msg.data?.id)) {
            handleRemoteEnded(null);
          }
        };
      }
    } catch (e) {}

    const unsubRealtime = subscribeRealtimeEvents((evt) => {
      if (evt && evt.action === 'LIVE_BROADCAST_ENDED') {
        const endedId = evt.id || evt.data?.id || null;
        if (matchesBroadcastId(endedId)) {
          handleRemoteEnded(evt.data || null);
        }
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
            department_code: studentDept || broadcast.department_code || '',
            level: verifiedStudent?.level || broadcast.target_level || 'ND I',
            leave: isLeaving
          })
        });
        if (res.ok && !isLeaving) {
          const hbData = await res.json();
          if (typeof hbData.viewers_count === 'number') {
            setViewersCount(hbData.viewers_count);
          }
          if (hbData.attendance) {
            setStudentAttendance(hbData.attendance);
          }
          if (typeof hbData.last_minute_window_open === 'boolean') {
            setLastMinuteWindowOpen(hbData.last_minute_window_open);
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
            {/* MULTI-DEPARTMENT CONCURRENT CHANNEL SWITCHER (Shown when >1 Department is Live) */}
            {campusActiveStreams.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/70 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-black text-amber-300 flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>📡 {campusActiveStreams.length} DEPARTMENTS BROADCASTING LIVE — SWITCH TO YOUR DEPARTMENT:</span>
                  </span>
                  {onOpenChannelHub && (
                    <button
                      type="button"
                      onClick={onOpenChannelHub}
                      className="text-[10px] font-mono font-bold text-emerald-300 hover:text-white underline cursor-pointer"
                    >
                      View All Classroom Channels →
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {campusActiveStreams.map((s) => {
                    const isCurrent = s.id === broadcast?.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setGateError('');
                          if (onSwitchChannel) {
                            onSwitchChannel(s);
                          } else {
                            setBroadcast(s);
                            navigateTo(`/live-classroom/${s.id}`);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isCurrent
                            ? 'bg-rose-600 text-white shadow border border-rose-400'
                            : 'bg-slate-900 hover:bg-emerald-950 text-emerald-200 border border-emerald-700/70'
                        }`}
                      >
                        <span>{s.department_code}</span>
                        <span className="text-[10px] opacity-85 font-sans">({s.course_code || s.department_name})</span>
                        {isCurrent && <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded">ACTIVE</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* DEPARTMENTAL ACCESS & ATTENDANCE EXPLANATION */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-mono font-bold">
                <Lock size={13} />
                <span>
                  {broadcast?.department_code
                    ? `DEPARTMENTAL CLASSROOM (${broadcast.department_code} STUDENTS ONLY)`
                    : 'DEPARTMENTAL STUDENT CLASSROOM ACCESS'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                Enter Your {broadcast?.department_code || 'Departmental'} Matric No. to Join Class
              </h3>
              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                This live classroom (<span className="font-mono text-cyan-300">{broadcast?.id || 'LIVE'}</span>) is organized by <strong>{broadcast?.department_name || broadcast?.department_code || 'the Department'}</strong>. Only students of <strong>{broadcast?.department_code || 'this department'}</strong> or Matric Nos. added by the lecturer can join. Attendance is marked automatically during the <strong>First 10 Minutes</strong> and the <strong>Last Minute</strong> of class.
              </p>
            </div>

            {/* 3-TAB MODE SWITCHER: JOIN BY MATRIC NO. | SUBMIT MATRIC TO LECTURER | PORTAL LOGIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#01110b] border border-emerald-800/80">
              <button
                type="button"
                onClick={() => { setGateMode('hod_details'); setGateError(''); setMatricSubmittedSuccess(false); sounds.playClick(); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  gateMode === 'hod_details'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'text-emerald-300/80 hover:text-white hover:bg-emerald-950/50'
                }`}
              >
                <GraduationCap size={14} />
                <span>1. Join with Matric No.</span>
              </button>

              <button
                type="button"
                onClick={() => { setGateMode('submit_matric'); setGateError(''); sounds.playClick(); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  gateMode === 'submit_matric'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                    : 'text-amber-300/80 hover:text-white hover:bg-amber-950/50'
                }`}
              >
                <UserPlus size={14} />
                <span>2. Submit Matric to Lecturer</span>
              </button>

              <button
                type="button"
                onClick={() => { setGateMode('dashboard_login'); setGateError(''); setMatricSubmittedSuccess(false); sounds.playClick(); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  gateMode === 'dashboard_login'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                    : 'text-cyan-300/80 hover:text-white hover:bg-cyan-950/50'
                }`}
              >
                <LogIn size={14} />
                <span>3. Student Portal Login</span>
              </button>
            </div>

            {gateError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500 text-xs text-rose-200 flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <span className="block">{gateError}</span>
                  {gateMode !== 'submit_matric' && (
                    <button
                      type="button"
                      onClick={() => { setGateMode('submit_matric'); setGateError(''); }}
                      className="text-[11px] font-mono font-bold text-amber-300 underline hover:text-white cursor-pointer"
                    >
                      Not yet on the lecturer&apos;s list? Click here to submit your Matric No. to the lecturer →
                    </button>
                  )}
                </div>
              </div>
            )}

            {gateMode === 'hod_details' ? (
              <form onSubmit={handleVerifyHodStudentDetails} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-emerald-300 block">
                    Enter Your {broadcast?.department_code || 'Student'} Matriculation Number (or Lecturer-Assigned Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder={`e.g. FCC/${broadcast?.department_code || 'CSC'}/ND1/001`}
                    className="w-full px-4 py-3 rounded-xl bg-[#01110b] border border-emerald-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 block">
                      Student Full Name (Optional if already registered):
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
                      Classroom Password / PIN (If assigned by Lecturer):
                    </label>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Leave blank if joining by Matric No. only"
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
                  <span>
                    {gateLoading
                      ? 'Verifying Matric No. & Marking Attendance...'
                      : `Join ${broadcast?.department_code || ''} Live Classroom & Mark Attendance`}
                  </span>
                </button>
              </form>
            ) : gateMode === 'submit_matric' ? (
              <div className="space-y-4">
                {matricSubmittedSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 space-y-3 text-xs">
                    <div className="font-mono font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Matric No. Submitted to {broadcast?.lecturer_name || 'Lecturer'}!</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{matricSubmittedMsg}</p>
                    <button
                      type="button"
                      disabled={gateLoading}
                      onClick={() => handleVerifyStudentByMatricDirect(identifierInput.trim(), nameInput.trim(), pinInput.trim())}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
                    >
                      <UserCheck size={15} />
                      <span>{gateLoading ? 'Checking Lecturer Approval...' : 'Lecturer Approved? Click Here to Join Class Now'}</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmitMatricToLecturer} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-amber-300 block">
                      Your {broadcast?.department_code || 'Department'} Matriculation Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder={`e.g. FCC/${broadcast?.department_code || 'CSC'}/ND1/025`}
                      className="w-full px-4 py-3 rounded-xl bg-[#01110b] border border-amber-600 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-300 block">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Adebayo Tunde"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#01110b] border border-amber-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-300 block">
                        Academic Level:
                      </label>
                      <select
                        value={submitLevelInput}
                        onChange={(e) => setSubmitLevelInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#01110b] border border-amber-800 text-xs text-white font-mono focus:outline-none"
                      >
                        <option value="ND I">ND I</option>
                        <option value="ND II">ND II</option>
                        <option value="HND I">HND I</option>
                        <option value="HND II">HND II</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={gateLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-950 transition cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus size={17} />
                    <span>
                      {gateLoading
                        ? 'Submitting Matric No. to Lecturer...'
                        : `Submit Matric No. to ${broadcast?.lecturer_name || 'Lecturer'} for Classroom Access`}
                    </span>
                  </button>
                </form>
              </div>
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

          {campusActiveStreams.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (onOpenChannelHub) {
                  onOpenChannelHub();
                } else {
                  navigateTo('/live-classroom');
                }
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-500/80 flex items-center gap-1.5 cursor-pointer"
              title="Switch between concurrent departmental live classrooms"
            >
              <Layers size={12} />
              <span>📡 {campusActiveStreams.length} Depts Live</span>
            </button>
          )}

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

        {/* RIGHT COLUMN: INTERACTIVE STUDENT CHAT, TWO-PHASE ATTENDANCE & HAND RAISE */}
        <div className="lg:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/90">
            {/* TWO-PHASE LIVE STUDENT ATTENDANCE REGISTER STATUS CARD */}
            <div className="p-3 rounded-2xl bg-[#01140d] border border-emerald-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <ClipboardCheck size={13} />
                  <span>Class Attendance ({studentMatric})</span>
                </span>
                <button
                  type="button"
                  disabled={isMarkingAttendance}
                  onClick={handleManualAttendanceCheckIn}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold cursor-pointer transition shadow"
                >
                  {isMarkingAttendance ? 'Checking In...' : '✋ Confirm Attendance'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div className={`p-2 rounded-xl border flex items-center justify-between ${
                  studentAttendance && Number(studentAttendance.first_10m_marked)
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                    : 'bg-black/50 border-slate-800 text-slate-400'
                }`}>
                  <span>First 10 Mins:</span>
                  <span className="font-bold">
                    {studentAttendance && Number(studentAttendance.first_10m_marked) ? '✅ Marked' : '⏳ Window'}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border flex items-center justify-between ${
                  studentAttendance && Number(studentAttendance.last_min_marked)
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                    : lastMinuteWindowOpen
                    ? 'bg-amber-900/80 border-amber-400 text-amber-100 animate-pulse'
                    : 'bg-black/50 border-slate-800 text-slate-400'
                }`}>
                  <span>Last Minute:</span>
                  <span className="font-bold">
                    {studentAttendance && Number(studentAttendance.last_min_marked)
                      ? '✅ Marked'
                      : lastMinuteWindowOpen
                      ? '🔔 Roll Call'
                      : '⏳ Final Min'}
                  </span>
                </div>
              </div>
            </div>

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
