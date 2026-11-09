import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Camera, Mic, MicOff, Monitor, Settings, Users,
  MessageSquare, Globe, Share2, Sparkles, Send, ShieldCheck,
  CheckCircle2, AlertTriangle, Play, Square, RefreshCw, Hand,
  Layers, HardDrive, KeyRound, ExternalLink, Sliders, Volume2,
  Database, BookOpen, FileUp, FileText, Trash2, Save, Clock, Eye
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function LiveBroadcastStudio({
  role = 'hod',
  currentDept = null,
  currentUser = null,
  onClose = null
}) {
  // Broadcaster & Database states
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [dbSyncStatus, setDbSyncStatus] = useState('connected'); // 'syncing' | 'saved' | 'connected' | 'error'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [isLive, setIsLive] = useState(false);
  const [broadcastId, setBroadcastId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewersCount, setViewersCount] = useState(0);
  const [streamMode, setStreamMode] = useState('system_camera'); // 'system_camera' | 'external_cam' | 'screen_share' | 'pip'
  const [resolution, setResolution] = useState('1080p Full HD');

  // Hardware Device selections
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Database-backed Departments & Courses
  const [dbDepartments, setDbDepartments] = useState([]);
  const [deptCourses, setDeptCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [deptCode, setDeptCode] = useState(currentDept?.code || currentUser?.department_code || '');
  const [deptName, setDeptName] = useState(currentDept?.name || currentUser?.department_name || '');

  // Lecture Metadata (hydrated from DB)
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [targetLevel, setTargetLevel] = useState('ND I');
  const [lecturerName, setLecturerName] = useState(currentUser?.name || currentDept?.hod_name || currentDept?.hod || '');
  const [lectureTitle, setLectureTitle] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [companionPdfUrl, setCompanionPdfUrl] = useState('');
  const [companionPdfName, setCompanionPdfName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Social Simulcast Configuration (hydrated from live_social_destinations table)
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialDestinations, setSocialDestinations] = useState([]);
  const [togglingPlatform, setTogglingPlatform] = useState(null);

  // Live Chat, Q&A & Broadcast History (hydrated from DB)
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatText, setNewChatText] = useState('');
  const [raisedHands, setRaisedHands] = useState(0);
  const [broadcastHistory, setBroadcastHistory] = useState([]);

  // Media references
  const liveVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const pipCameraStreamRef = useRef(null);
  const pipScreenStreamRef = useRef(null);
  const pipCanvasIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const peersRef = useRef({});
  const signalingChannelRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const saveTimeoutRef = useRef(null);

  // Resolve resolution string to WebRTC video constraints
  const getResolutionConstraints = (resLabel) => {
    if (resLabel && resLabel.includes('4K')) {
      return { width: { ideal: 3840 }, height: { ideal: 2160 } };
    }
    if (resLabel && resLabel.includes('720p')) {
      return { width: { ideal: 1280 }, height: { ideal: 720 } };
    }
    return { width: { ideal: 1920 }, height: { ideal: 1080 } };
  };

  // 1. Fetch Complete Studio Context from Database via Backend API
  const fetchStudioContext = async (overrideDeptCode = null) => {
    setIsLoadingContext(true);
    setDbSyncStatus('syncing');
    try {
      const base = getApiBase();
      const targetCode = overrideDeptCode || currentDept?.code || currentUser?.department_code || deptCode || '';
      const targetName = currentDept?.name || currentUser?.department_name || deptName || '';
      const targetLecturer = currentUser?.name || currentDept?.hod_name || currentDept?.hod || lecturerName || '';

      const params = new URLSearchParams();
      if (targetCode) params.set('department_code', targetCode);
      if (targetName) params.set('department_name', targetName);
      if (targetLecturer) params.set('lecturer_name', targetLecturer);

      const res = await fetch(`${base}/live-broadcast/studio-context?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();

        // Hydrate department & courses from DB
        if (data.department) {
          setDeptCode(data.department.code || targetCode || 'CEM');
          setDeptName(data.department.name || targetName || 'Co-operative Economics & Management');
        }
        if (Array.isArray(data.departments)) setDbDepartments(data.departments);
        if (Array.isArray(data.department_courses)) setDeptCourses(data.department_courses);
        if (Array.isArray(data.all_courses)) setAllCourses(data.all_courses);

        // Hydrate persisted studio configuration from DB
        const cfg = data.studio_config || {};
        setCourseCode(cfg.course_code || '');
        setCourseTitle(cfg.course_title || '');
        setTargetLevel(cfg.target_level || 'ND I');
        setLecturerName(cfg.lecturer_name || data.department?.hod_name || targetLecturer || 'Head of Department');
        setLectureTitle(cfg.lecture_title || '');
        setAnnouncement(cfg.announcement || '');
        setCompanionPdfUrl(cfg.companion_pdf_url || '');
        setCompanionPdfName(cfg.companion_pdf_name || '');
        if (cfg.stream_mode) setStreamMode(cfg.stream_mode);
        if (cfg.resolution) setResolution(cfg.resolution);
        if (typeof cfg.is_audio_muted === 'boolean') setIsAudioMuted(cfg.is_audio_muted);
        if (cfg.video_device_id) setSelectedVideoDeviceId(cfg.video_device_id);
        if (cfg.audio_device_id) setSelectedAudioDeviceId(cfg.audio_device_id);

        // Hydrate social simulcast destinations from live_social_destinations table
        if (Array.isArray(data.destinations)) {
          setSocialDestinations(data.destinations);
        }

        // Hydrate active broadcast session if currently live in DB
        if (data.active_broadcast && data.active_broadcast.is_live) {
          const ab = data.active_broadcast;
          setBroadcastId(ab.id);
          setIsLive(true);
          setElapsedSeconds(Number(data.elapsed_seconds || 0));
          setViewersCount(Number(ab.viewers_count || 0));
          if (ab.title) setLectureTitle(ab.title);
          if (ab.course_code) setCourseCode(ab.course_code);
          if (ab.course_title) setCourseTitle(ab.course_title);
          if (ab.lecturer_name) setLecturerName(ab.lecturer_name);
          if (ab.stream_mode) setStreamMode(ab.stream_mode);
          if (ab.resolution) setResolution(ab.resolution);
          if (ab.announcement) setAnnouncement(ab.announcement);
          if (ab.companion_pdf_url) setCompanionPdfUrl(ab.companion_pdf_url);
        } else {
          setIsLive(false);
          setBroadcastId(null);
          setViewersCount(0);
          setElapsedSeconds(0);
        }

        if (Array.isArray(data.chat_messages)) {
          setChatMessages(data.chat_messages);
          setRaisedHands(data.chat_messages.filter(m => m.hand_raised).length);
        }

        if (Array.isArray(data.broadcast_history)) {
          setBroadcastHistory(data.broadcast_history);
        }

        setDbSyncStatus('connected');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } else {
        setDbSyncStatus('error');
      }
    } catch (err) {
      console.warn('Error loading studio context from database:', err);
      setDbSyncStatus('error');
    } finally {
      setIsLoadingContext(false);
    }
  };

  // 2. Persist Studio Configuration to Database via Backend API
  const persistStudioConfigToDb = async (overrides = {}) => {
    setDbSyncStatus('syncing');
    try {
      const base = getApiBase();
      const vDev = videoDevices.find(d => d.deviceId === (overrides.video_device_id ?? selectedVideoDeviceId));
      const aDev = audioDevices.find(d => d.deviceId === (overrides.audio_device_id ?? selectedAudioDeviceId));

      const payload = {
        broadcast_id: broadcastId,
        department_code: overrides.department_code ?? deptCode,
        department_name: overrides.department_name ?? deptName,
        course_code: overrides.course_code ?? courseCode,
        course_title: overrides.course_title ?? courseTitle,
        target_level: overrides.target_level ?? targetLevel,
        lecturer_name: overrides.lecturer_name ?? lecturerName,
        lecture_title: overrides.lecture_title ?? lectureTitle,
        announcement: overrides.announcement ?? announcement,
        companion_pdf_url: overrides.companion_pdf_url ?? companionPdfUrl,
        companion_pdf_name: overrides.companion_pdf_name ?? companionPdfName,
        stream_mode: overrides.stream_mode ?? streamMode,
        resolution: overrides.resolution ?? resolution,
        video_device_id: overrides.video_device_id ?? selectedVideoDeviceId,
        video_device_label: vDev?.label || '',
        audio_device_id: overrides.audio_device_id ?? selectedAudioDeviceId,
        audio_device_label: aDev?.label || '',
        is_audio_muted: overrides.is_audio_muted ?? isAudioMuted
      };

      const res = await fetch(`${base}/live-broadcast/studio-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setDbSyncStatus('saved');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } else {
        setDbSyncStatus('error');
      }
    } catch (e) {
      setDbSyncStatus('error');
    }
  };

  // Debounced auto-save when typing in form fields
  const scheduleAutoSave = (overrides = {}) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistStudioConfigToDb(overrides);
    }, 900);
  };

  // 3. Enumerate and initialize audio/video capture devices
  const initDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevs = devices.filter(d => d.kind === 'videoinput');
      const aDevs = devices.filter(d => d.kind === 'audioinput');

      setVideoDevices(vDevs);
      setAudioDevices(aDevs);

      if (vDevs.length > 0 && !selectedVideoDeviceId) {
        setSelectedVideoDeviceId(vDevs[0].deviceId);
      }
      if (aDevs.length > 0 && !selectedAudioDeviceId) {
        setSelectedAudioDeviceId(aDevs[0].deviceId);
      }
    } catch (err) {
      console.warn('Unable to enumerate camera devices:', err);
    }
  };

  // Stop any active helper streams (e.g. PiP composite)
  const stopHelperStreams = () => {
    if (pipCanvasIntervalRef.current) {
      clearInterval(pipCanvasIntervalRef.current);
      pipCanvasIntervalRef.current = null;
    }
    if (pipCameraStreamRef.current) {
      pipCameraStreamRef.current.getTracks().forEach(t => t.stop());
      pipCameraStreamRef.current = null;
    }
    if (pipScreenStreamRef.current) {
      pipScreenStreamRef.current.getTracks().forEach(t => t.stop());
      pipScreenStreamRef.current = null;
    }
  };

  // 4. Start Camera / Screen / Picture-in-Picture Feed
  const startCameraStream = async (
    vDeviceId = selectedVideoDeviceId,
    mode = streamMode,
    resLabel = resolution,
    aDeviceId = selectedAudioDeviceId
  ) => {
    try {
      stopHelperStreams();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const dimConstraints = getResolutionConstraints(resLabel);
      const audioConstraint = aDeviceId ? { deviceId: { exact: aDeviceId } } : true;

      let stream = null;
      if (mode === 'screen_share') {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: dimConstraints,
          audio: true
        });
        // Merge microphone audio if available
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false });
          micStream.getAudioTracks().forEach(track => {
            track.enabled = !isAudioMuted;
            displayStream.addTrack(track);
          });
        } catch (e) {}
        stream = displayStream;
      } else if (mode === 'pip') {
        // Real Picture-in-Picture Composite (Screen Presentation + Face Cam Corner Overlay)
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: dimConstraints,
            audio: true
          });
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: vDeviceId ? { deviceId: { exact: vDeviceId }, width: 640, height: 360 } : { width: 640, height: 360 },
            audio: audioConstraint
          });
          pipScreenStreamRef.current = screenStream;
          pipCameraStreamRef.current = camStream;

          const screenVideo = document.createElement('video');
          screenVideo.srcObject = screenStream;
          screenVideo.muted = true;
          await screenVideo.play().catch(() => {});

          const camVideo = document.createElement('video');
          camVideo.srcObject = camStream;
          camVideo.muted = true;
          await camVideo.play().catch(() => {});

          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext('2d');

          pipCanvasIntervalRef.current = setInterval(() => {
            if (!ctx) return;
            ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
            // Draw lecturer facecam in bottom-right corner
            const pipW = 300;
            const pipH = 175;
            const pipX = canvas.width - pipW - 24;
            const pipY = canvas.height - pipH - 24;
            ctx.save();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.strokeRect(pipX - 2, pipY - 2, pipW + 4, pipH + 4);
            ctx.drawImage(camVideo, pipX, pipY, pipW, pipH);
            ctx.restore();
          }, 33);

          const canvasStream = canvas.captureStream(30);
          camStream.getAudioTracks().forEach(t => {
            t.enabled = !isAudioMuted;
            canvasStream.addTrack(t);
          });
          stream = canvasStream;
        } catch (pipErr) {
          // Fallback to camera if screen share dialog cancelled
          stream = await navigator.mediaDevices.getUserMedia({
            video: vDeviceId ? { deviceId: { exact: vDeviceId }, ...dimConstraints } : dimConstraints,
            audio: audioConstraint
          });
        }
      } else {
        const constraints = {
          video: vDeviceId ? { deviceId: { exact: vDeviceId }, ...dimConstraints } : dimConstraints,
          audio: audioConstraint
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // Apply mute state to audio tracks
      stream.getAudioTracks().forEach(t => {
        t.enabled = !isAudioMuted;
      });

      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }

      // If currently broadcasting via WebRTC, replace tracks on active peer connections seamlessly
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      Object.values(peersRef.current).forEach(pc => {
        try {
          const senders = pc.getSenders();
          if (videoTrack) {
            const vSender = senders.find(s => s.track && s.track.kind === 'video');
            if (vSender) vSender.replaceTrack(videoTrack);
          }
          if (audioTrack) {
            const aSender = senders.find(s => s.track && s.track.kind === 'audio');
            if (aSender) aSender.replaceTrack(audioTrack);
          }
        } catch (e) {}
      });

      // Re-enumerate so device labels are populated after permission grant
      initDevices();
      initAudioMeter(stream);
    } catch (err) {
      console.warn('Error starting camera stream:', err);
    }
  };

  // Toggle Microphone Mute and persist to DB
  const handleToggleMute = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextMuted;
      });
    }
    sounds.playClick();
    persistStudioConfigToDb({ is_audio_muted: nextMuted });
  };

  // 5. Audio VU Meter
  const initAudioMeter = (stream) => {
    try {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch (e) {}
  };

  // Initial mount: load database context + start camera preview
  useEffect(() => {
    fetchStudioContext(currentDept?.code || currentUser?.department_code);
    initDevices();
    startCameraStream();

    return () => {
      stopHelperStreams();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentDept?.code]);

  // Run live timer when isLive is true
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isLive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  // Start MediaRecorder chunk streaming whenever broadcast is live and camera stream is ready
  useEffect(() => {
    if (!isLive || !broadcastId || !mediaStreamRef.current || !window.MediaRecorder) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;

    try {
      recordedChunksRef.current = [];
      chunkIndexRef.current = 0;
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const rec = new MediaRecorder(mediaStreamRef.current, { mimeType: mime });
      rec.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
          try {
            const chunkBase = getApiBase();
            const form = new FormData();
            form.append('chunk', e.data);
            form.append('chunk_index', chunkIndexRef.current++);
            fetch(`${chunkBase}/live-broadcast/${broadcastId}/chunk`, {
              method: 'POST',
              body: form
            }).catch(() => {});
          } catch (err) {}
        }
      };
      rec.start(2000);
      mediaRecorderRef.current = rec;
    } catch (e) {}
  }, [isLive, broadcastId]);

  // WebRTC Host Signaling Engine
  const sendSignalToViewer = async (viewerId, type, data) => {
    if (signalingChannelRef.current) {
      signalingChannelRef.current.postMessage({
        sender_id: 'host',
        recipient_id: viewerId,
        signal_type: type,
        payload: data
      });
    }

    if (broadcastId) {
      try {
        const base = getApiBase();
        await fetch(`${base}/live-broadcast/${broadcastId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_id: 'host',
            recipient_id: viewerId,
            signal_type: type,
            payload: data
          })
        });
      } catch (e) {}
    }
  };

  const handleViewerSignal = async (signal) => {
    const { sender_id, signal_type, payload } = signal;
    if (!sender_id || sender_id === 'host') return;

    if (signal_type === 'join') {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' }
          ]
        });

        peersRef.current[sender_id] = pc;

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, mediaStreamRef.current);
          });
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignalToViewer(sender_id, 'ice_candidate', event.candidate);
          }
        };

        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);

        sendSignalToViewer(sender_id, 'offer', offer);
      } catch (err) {
        console.warn('Error handling viewer join:', err);
      }
    } else if (signal_type === 'answer') {
      const pc = peersRef.current[sender_id];
      if (pc) {
        try {
          const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
          await pc.setRemoteDescription(new RTCSessionDescription(parsed));
        } catch (e) {}
      }
    } else if (signal_type === 'ice_candidate') {
      const pc = peersRef.current[sender_id];
      if (pc) {
        try {
          const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
          await pc.addIceCandidate(new RTCIceCandidate(parsed));
        } catch (e) {}
      }
    }
  };

  // Setup WebRTC Host Listener when broadcast becomes live
  useEffect(() => {
    if (!isLive || !broadcastId) return;

    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('fcc_live_signaling_' + broadcastId);
        bc.onmessage = (e) => {
          if (e.data && e.data.recipient_id === 'host') {
            handleViewerSignal(e.data);
          }
        };
        signalingChannelRef.current = bc;
      }
    } catch (e) {}

    const signalInterval = setInterval(async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcastId}/signal?recipient_id=host`);
        if (res.ok) {
          const data = await res.json();
          if (data.signals && data.signals.length > 0) {
            for (const sig of data.signals) {
              handleViewerSignal(sig);
            }
          }
        }
      } catch (e) {}
    }, 1500);

    return () => {
      clearInterval(signalInterval);
      if (signalingChannelRef.current) {
        signalingChannelRef.current.close();
        signalingChannelRef.current = null;
      }
      Object.values(peersRef.current).forEach(pc => {
        try { pc.close(); } catch (e) {}
      });
      peersRef.current = {};
    };
  }, [isLive, broadcastId]);

  // Poll Chat Messages & Accurate Viewer Count from Database when live
  useEffect(() => {
    if (!isLive || !broadcastId) return;

    const pollChat = async () => {
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/live-broadcast/${broadcastId}/chat`);
        if (res.ok) {
          const json = await res.json();
          if (json.messages) {
            setChatMessages(json.messages);
            const hands = json.messages.filter(m => m.hand_raised).length;
            setRaisedHands(hands);
          }
          if (typeof json.viewers_count === 'number') {
            setViewersCount(json.viewers_count);
          }
        }
      } catch (e) {}
    };

    pollChat();
    const interval = setInterval(pollChat, 3000);
    return () => clearInterval(interval);
  }, [isLive, broadcastId]);

  // Select a Curriculum Course from Database dropdown
  const handleSelectCurriculumCourse = (selectedCode) => {
    if (!selectedCode) return;
    const matched = allCourses.find(c => c.code === selectedCode) || deptCourses.find(c => c.code === selectedCode);
    if (matched) {
      const nextCode = matched.code;
      const nextTitle = matched.title || '';
      const nextLevel = matched.level || 'ND I';
      const nextLectureTitle = `${nextCode}: ${nextTitle} — Live Interactive Lecture`;

      setCourseCode(nextCode);
      setCourseTitle(nextTitle);
      setTargetLevel(nextLevel);
      setLectureTitle(nextLectureTitle);
      sounds.playClick();

      persistStudioConfigToDb({
        course_code: nextCode,
        course_title: nextTitle,
        target_level: nextLevel,
        lecture_title: nextLectureTitle
      });
    }
  };

  // Upload Companion PDF Handout to Database & Storage
  const handleCompanionPdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setDbSyncStatus('syncing');
    try {
      const base = getApiBase();
      const formData = new FormData();
      formData.append('pdf_file', file);
      formData.append('department_code', deptCode);
      if (broadcastId) formData.append('broadcast_id', broadcastId);

      const res = await fetch(`${base}/live-broadcast/companion-pdf`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setCompanionPdfUrl(data.companion_pdf_url || '');
        setCompanionPdfName(data.companion_pdf_name || file.name);
        setDbSyncStatus('saved');
        setLastSyncedAt(new Date().toLocaleTimeString());
        sounds.playSuccessChime();
      } else {
        setDbSyncStatus('error');
      }
    } catch (err) {
      setDbSyncStatus('error');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Toggle a Social Simulcast Platform directly in the Database
  const handleToggleSocialPlatform = async (platform) => {
    setTogglingPlatform(platform);
    setDbSyncStatus('syncing');
    sounds.playClick();
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/social-destinations/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_code: deptCode,
          platform
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.destinations)) {
          setSocialDestinations(data.destinations);
        }
        setDbSyncStatus('saved');
        setLastSyncedAt(new Date().toLocaleTimeString());
      } else {
        setDbSyncStatus('error');
      }
    } catch (e) {
      setDbSyncStatus('error');
    } finally {
      setTogglingPlatform(null);
    }
  };

  // Start Live Broadcast in Database
  const handleStartBroadcast = async () => {
    sounds.playSuccessChime();
    setDbSyncStatus('syncing');
    try {
      const base = getApiBase();
      const enabledSocial = socialDestinations.filter(d => d.enabled);

      const payload = {
        title: lectureTitle || `${courseCode || deptCode} Live Interactive Lecture`,
        department_code: deptCode || 'CEM',
        department_name: deptName || 'Co-operative Economics & Management',
        course_code: courseCode || `${deptCode} 111`,
        course_title: courseTitle || lectureTitle,
        target_level: targetLevel || 'ND I',
        lecturer_name: lecturerName || 'Head of Department',
        lecturer_role: role,
        stream_mode: streamMode,
        resolution: resolution,
        simulcast_destinations: enabledSocial,
        announcement: announcement,
        companion_pdf_url: companionPdfUrl
      };

      const res = await fetch(`${base}/live-broadcast/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const bId = json.broadcast.id;
        setBroadcastId(bId);
        setIsLive(true);
        setElapsedSeconds(0);
        setViewersCount(0);
        setDbSyncStatus('saved');
        setLastSyncedAt(new Date().toLocaleTimeString());

        // Fetch initial welcome chat message from DB
        fetch(`${base}/live-broadcast/${bId}/chat`)
          .then(r => r.json())
          .then(d => {
            if (d.messages) setChatMessages(d.messages);
          })
          .catch(() => {});

        window.dispatchEvent(new CustomEvent('fcc-live-broadcast-started', { detail: json.broadcast }));
      } else {
        const errJson = await res.json();
        setDbSyncStatus('error');
        alert(errJson.error || 'Unable to start live stream.');
      }
    } catch (err) {
      setDbSyncStatus('error');
      alert('Network error initiating live stream.');
    }
  };

  // Stop Live Broadcast & Auto-Archive to Database
  const handleStopBroadcast = async () => {
    sounds.playClick();
    if (!confirm('Are you sure you want to end this live broadcast? The recorded session will be archived into the FCC Central Library Database Catalogue for student revision.')) {
      return;
    }

    setDbSyncStatus('syncing');
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      const base = getApiBase();
      const formData = new FormData();
      formData.append('duration_seconds', elapsedSeconds);
      formData.append('duration_formatted', formatDuration(elapsedSeconds));
      formData.append('target_level', targetLevel || 'ND I');

      if (recordedChunksRef.current.length > 0) {
        const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        formData.append('recording_file', recordedBlob, `live-lecture-${deptCode}-${Date.now()}.webm`);
      }

      const res = await fetch(`${base}/live-broadcast/${broadcastId}/end`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setIsLive(false);
        setViewersCount(0);
        sounds.playSuccessChime();
        setDbSyncStatus('saved');
        setLastSyncedAt(new Date().toLocaleTimeString());
        window.dispatchEvent(new CustomEvent('fcc-live-broadcast-ended', { detail: { id: broadcastId } }));
        // Refresh studio context so broadcast history updates immediately from DB
        fetchStudioContext(deptCode);
      }
    } catch (err) {
      setIsLive(false);
      setDbSyncStatus('error');
    }
  };

  // Delete a Past Broadcast Session from Database
  const handleDeleteHistoryItem = async (id) => {
    if (!confirm('Delete this broadcast session record from the database?')) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBroadcastHistory(prev => prev.filter(item => item.id !== id));
        sounds.playClick();
      }
    } catch (e) {}
  };

  // Clear Chat or Lower Raised Hands in Database
  const handleClearChatOrHands = async (mode = 'hands') => {
    if (!broadcastId) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/live-broadcast/${broadcastId}/chat?mode=${mode}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setChatMessages(data.messages);
          setRaisedHands(data.messages.filter(m => m.hand_raised).length);
        }
        sounds.playClick();
      }
    } catch (e) {}
  };

  // Send Host Message in Chat (Persisted in live_broadcast_chats table)
  const handleSendHostMessage = async (e) => {
    e.preventDefault();
    if (!newChatText.trim() || !broadcastId) return;

    try {
      const base = getApiBase();
      const msgText = newChatText.trim();
      setNewChatText('');
      const res = await fetch(`${base}/live-broadcast/${broadcastId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: `${lecturerName} (Host / HOD)`,
          user_role: 'hod',
          user_matric: `HOD-${deptCode}`,
          message: msgText,
          is_question: false,
          hand_raised: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      }
      sounds.playClick();
    } catch (e) {}
  };

  const formatDuration = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rem = secs % 60;
    return hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const enabledSocialCount = socialDestinations.filter(d => d.enabled).length;
  const availableCourses = deptCourses.length > 0 ? deptCourses : allCourses;

  return (
    <div className="bg-[#021810] border-2 border-emerald-600/70 rounded-3xl p-4 sm:p-7 space-y-6 text-white shadow-2xl animate-fadeIn">
      {/* APEX HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-900/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow ${
              isLive
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/80'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}>
              <Video size={12} className={isLive ? 'animate-pulse' : ''} />
              <span>{isLive ? '🔴 ON AIR: BROADCASTING LIVE' : 'STUDIO STANDBY / READY TO TRANSMIT'}</span>
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#01140d] text-cyan-300 border border-cyan-800">
              {deptCode || 'DEPT'} • {lecturerName || deptName}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
              <Share2 size={10} />
              <span>{enabledSocialCount} Social Simulcasts Active</span>
            </span>

            {/* LIVE MYSQL DATABASE SYNC BADGE */}
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 border ${
              dbSyncStatus === 'syncing'
                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                : dbSyncStatus === 'error'
                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
            }`}>
              <Database size={10} className={dbSyncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span>
                {dbSyncStatus === 'syncing'
                  ? 'Syncing with Database...'
                  : dbSyncStatus === 'saved'
                  ? `Saved to DB (${lastSyncedAt || 'Live'})`
                  : dbSyncStatus === 'error'
                  ? 'DB Sync Retry'
                  : 'MySQL DB Connected'}
              </span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            Institutional Live Broadcast &amp; Social Simulcast Studio
          </h2>
          <p className="text-xs text-emerald-200/80">
            Stream high-definition lectures with integrated system webcam, external USB cameras, screen sharing, and multi-platform simulcasting across YouTube Live, Facebook, LinkedIn, X, and campus students.
          </p>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => { sounds.playClick(); setShowSocialModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-[#01140d] hover:bg-emerald-950 border border-emerald-700 text-xs font-bold text-emerald-200 flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Settings size={14} className="text-purple-400" />
            <span>Social Simulcast ({enabledSocialCount})</span>
          </button>

          {isLive ? (
            <button
              onClick={handleStopBroadcast}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition cursor-pointer"
            >
              <Square size={14} />
              <span>End Live Broadcast</span>
            </button>
          ) : (
            <button
              onClick={handleStartBroadcast}
              disabled={isLoadingContext}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs flex items-center gap-2 shadow-xl shadow-rose-950 transition cursor-pointer animate-pulse disabled:opacity-50"
            >
              <Play size={15} className="fill-white" />
              <span>GO LIVE NOW</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MAIN STUDIO GRID: 2 COLUMNS (CAMERA STAGE & INTERACTIVE CLASSROOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (8 COLS): CAMERA & PRESENTATION STAGE */}
        <div className="lg:col-span-8 space-y-4">
          {/* VIDEO MONITOR VIEWPORT */}
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-2 border-emerald-700/80 shadow-2xl flex items-center justify-center group">
            <video
              ref={liveVideoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* LIVE ON-AIR BADGE OVERLAY */}
            <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-black text-white flex items-center gap-1.5 shadow-lg ${
                isLive ? 'bg-rose-600 animate-pulse' : 'bg-slate-900/90 border border-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white' : 'bg-amber-400'}`} />
                <span>{isLive ? 'LIVE' : 'PREVIEW'}</span>
              </span>

              {isLive && (
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-600/60 shadow">
                  ⏱️ {formatDuration(elapsedSeconds)}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-black/80 text-cyan-300 border border-cyan-800">
                {resolution}
              </span>

              {courseCode && (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-black/80 text-emerald-300 border border-emerald-700">
                  {courseCode} ({targetLevel})
                </span>
              )}
            </div>

            {/* LIVE VIEWERS PILL */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-black/80 backdrop-blur-md text-amber-300 border border-amber-600/60 flex items-center gap-1.5 shadow">
                <Users size={13} />
                <span>{isLive ? viewersCount : 0} Students Connected</span>
              </span>
            </div>

            {/* AUDIO LEVEL VU METER & MUTE BUTTON (BOTTOM LEFT) */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isAudioMuted ? 'bg-rose-600 text-white' : 'text-emerald-400 hover:text-white'
                }`}
                title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isAudioMuted ? <MicOff size={13} /> : <Volume2 size={13} />}
              </button>
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                  style={{ width: `${isAudioMuted ? 0 : audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-300">
                {isAudioMuted ? 'MUTED' : `${audioLevel}%`}
              </span>
            </div>
          </div>

          {/* HARDWARE DEVICE & STREAM CONTROLS */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-mono flex items-center justify-between">
              <span>Hardware &amp; Video Input Configuration</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  initDevices();
                  startCameraStream(selectedVideoDeviceId, streamMode, resolution, selectedAudioDeviceId);
                }}
                className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
              >
                <RefreshCw size={11} /> Refresh Devices
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* VIDEO SOURCE SELECTOR */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Camera size={11} />
                  <span>Video Input (System / External Cam):</span>
                </label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedVideoDeviceId(nextId);
                    startCameraStream(nextId, streamMode, resolution, selectedAudioDeviceId);
                    persistStudioConfigToDb({ video_device_id: nextId });
                  }}
                  className="w-full bg-[#021d13] text-emerald-200 border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera Device ${i + 1}`}
                    </option>
                  ))}
                  {videoDevices.length === 0 && <option value="">Default System Webcam</option>}
                </select>
              </div>

              {/* MICROPHONE AUDIO INPUT SELECTOR */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Mic size={11} />
                  <span>Audio / Microphone Input:</span>
                </label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => {
                    const nextAudioId = e.target.value;
                    setSelectedAudioDeviceId(nextAudioId);
                    startCameraStream(selectedVideoDeviceId, streamMode, resolution, nextAudioId);
                    persistStudioConfigToDb({ audio_device_id: nextAudioId });
                  }}
                  className="w-full bg-[#021d13] text-emerald-200 border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  {audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))}
                  {audioDevices.length === 0 && <option value="">Default System Microphone</option>}
                </select>
              </div>

              {/* STREAM SOURCE MODE (WEBCAM / SCREEN / PIP) */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Monitor size={11} />
                  <span>Presentation Mode:</span>
                </label>
                <select
                  value={streamMode}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    setStreamMode(nextMode);
                    startCameraStream(selectedVideoDeviceId, nextMode, resolution, selectedAudioDeviceId);
                    persistStudioConfigToDb({ stream_mode: nextMode });
                  }}
                  className="w-full bg-[#021d13] text-emerald-200 border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="system_camera">System Webcam / Face Cam</option>
                  <option value="external_cam">External USB Cam / Podium Cam</option>
                  <option value="screen_share">Screen Presentation / Slide Deck</option>
                  <option value="pip">Picture-in-Picture (Slides + Face)</option>
                </select>
              </div>

              {/* RESOLUTION SELECTOR */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Sliders size={11} />
                  <span>Broadcast Quality:</span>
                </label>
                <select
                  value={resolution}
                  onChange={(e) => {
                    const nextRes = e.target.value;
                    setResolution(nextRes);
                    startCameraStream(selectedVideoDeviceId, streamMode, nextRes, selectedAudioDeviceId);
                    persistStudioConfigToDb({ resolution: nextRes });
                  }}
                  className="w-full bg-[#021d13] text-emerald-200 border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="720p HD">720p HD (Low Bandwidth)</option>
                  <option value="1080p Full HD">1080p Full HD (Recommended)</option>
                  <option value="4K UHD">4K UHD Broadcast</option>
                </select>
              </div>
            </div>
          </div>

          {/* LECTURE METADATA FORM (CONNECTED TO COURSES & LIBRARY_SETTINGS IN DATABASE) */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>Live Lecture Information (Database Linked)</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playSuccessChime();
                  persistStudioConfigToDb();
                }}
                className="px-3 py-1 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-mono text-[10px] font-bold flex items-center gap-1 border border-emerald-600 transition cursor-pointer"
              >
                <Save size={11} />
                <span>Save Lecture Setup to DB</span>
              </button>
            </div>

            {/* CURRICULUM COURSE SELECTOR FROM DATABASE + LEVEL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono text-slate-400">
                  Select Registered Curriculum Course from Database ({availableCourses.length} Available):
                </label>
                <select
                  value={availableCourses.some(c => c.code === courseCode) ? courseCode : ''}
                  onChange={(e) => handleSelectCurriculumCourse(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-emerald-200 text-xs focus:outline-none"
                >
                  <option value="">-- Choose from Curriculum Database or Type Custom Code Below --</option>
                  {deptCourses.length > 0 && (
                    <optgroup label={`${deptCode} Departmental Courses`}>
                      {deptCourses.map(c => (
                        <option key={`dept-${c.code}`} value={c.code}>
                          {c.code} — {c.title} ({c.level || 'ND I'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {allCourses.length > deptCourses.length && (
                    <optgroup label="All College Curriculum Courses">
                      {allCourses.map(c => (
                        <option key={`all-${c.code}`} value={c.code}>
                          {c.code} — {c.title} ({c.department || 'General'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Target Academic Level:</label>
                <select
                  value={targetLevel}
                  onChange={(e) => {
                    setTargetLevel(e.target.value);
                    persistStudioConfigToDb({ target_level: e.target.value });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white font-mono text-xs focus:outline-none"
                >
                  <option value="ND I">ND I</option>
                  <option value="ND II">ND II</option>
                  <option value="HND I">HND I</option>
                  <option value="HND II">HND II</option>
                  <option value="All Levels">All Levels (General)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Course Code &amp; Level:</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(e.target.value);
                    scheduleAutoSave({ course_code: e.target.value });
                  }}
                  placeholder="e.g. CEM 111 / COM 221"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Lecturer / Presenter:</label>
                <input
                  type="text"
                  value={lecturerName}
                  onChange={(e) => {
                    setLecturerName(e.target.value);
                    scheduleAutoSave({ lecturer_name: e.target.value });
                  }}
                  placeholder="Enter Lecturer Name"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400">Lecture Topic / Broadcast Title:</label>
              <input
                type="text"
                value={lectureTitle}
                onChange={(e) => {
                  setLectureTitle(e.target.value);
                  scheduleAutoSave({ lecture_title: e.target.value });
                }}
                placeholder="Enter Live Lecture Topic / Title"
                className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white text-xs font-bold focus:outline-none"
              />
            </div>

            {/* CLASSROOM TICKER ANNOUNCEMENT & COMPANION PDF HANDOUT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Classroom Ticker / Student Announcement:</label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => {
                    setAnnouncement(e.target.value);
                    scheduleAutoSave({ announcement: e.target.value });
                  }}
                  placeholder="Announcement shown to connected students..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-emerald-200 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Companion Lecture Handout (PDF):</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-1.5 rounded-xl bg-[#021d13] hover:bg-emerald-950 border border-emerald-700 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer transition truncate">
                    <FileUp size={12} />
                    <span className="truncate">
                      {isUploadingPdf
                        ? 'Uploading to DB...'
                        : companionPdfName || (companionPdfUrl ? 'Handout Linked ✓' : 'Attach Lecture PDF')}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={handleCompanionPdfUpload}
                      className="hidden"
                    />
                  </label>
                  {companionPdfUrl && (
                    <a
                      href={companionPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] font-mono hover:text-white"
                      title="View Attached Handout"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 COLS): LIVE STUDENT CHAT, Q&A & SIMULCAST STATUS */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* SIMULCAST DESTINATION BADGES (CLICK TO TOGGLE DIRECTLY IN DATABASE) */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-purple-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <Globe size={13} />
                <span>Multi-Platform Simulcast</span>
              </span>
              <button
                type="button"
                onClick={() => { sounds.playClick(); setShowSocialModal(true); }}
                className="text-[10px] text-cyan-300 hover:text-white font-mono font-bold cursor-pointer"
              >
                Edit Keys
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {socialDestinations.map((d) => (
                <button
                  type="button"
                  key={d.platform}
                  onClick={() => handleToggleSocialPlatform(d.platform)}
                  disabled={togglingPlatform === d.platform}
                  title={`Click to ${d.enabled ? 'disable' : 'enable'} ${d.platform_name} in database`}
                  className={`p-2 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                    d.enabled
                      ? 'bg-purple-950/70 border-purple-500 text-purple-200 hover:bg-purple-900/70'
                      : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <span className="truncate">{(d.platform_name || d.platform).split(' ')[0]}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    d.enabled && isLive
                      ? 'bg-rose-500 animate-ping'
                      : d.enabled
                      ? 'bg-emerald-400'
                      : 'bg-slate-600'
                  }`} />
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Click any platform above to toggle active simulcast in database, or click <strong>Edit Keys</strong> for RTMP keys.
            </div>
          </div>

          {/* LIVE CHAT & STUDENT Q&A WORKSPACE */}
          <div className="flex-1 rounded-2xl bg-[#01140d] border border-emerald-800/80 p-4 flex flex-col justify-between min-h-[350px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <MessageSquare size={13} className="text-emerald-400" />
                  <span>Live Student Chat &amp; Q&amp;A</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {raisedHands > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearChatOrHands('hands')}
                      title="Click to acknowledge and lower raised hands"
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse cursor-pointer"
                    >
                      <Hand size={10} />
                      <span>{raisedHands} Hands</span>
                    </button>
                  )}

                  {chatMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearChatOrHands('all')}
                      title="Clear chat log in database"
                      className="text-[10px] font-mono text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* MESSAGES LIST */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-[11px] font-mono">
                    No student messages yet. When live, student questions appear here in real-time.
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`p-2.5 rounded-xl text-xs space-y-1 ${
                        msg.user_role === 'hod'
                          ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-200'
                          : msg.is_question
                          ? 'bg-amber-950/80 border border-amber-700 text-amber-200'
                          : 'bg-black/60 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-white">{msg.user_name}</span>
                        {msg.is_question && <span className="text-amber-400 font-bold">QUESTION</span>}
                        {msg.hand_raised && <span className="text-cyan-400">✋ RAISED HAND</span>}
                      </div>
                      <p className="leading-snug">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEND HOST CHAT FORM */}
            <form onSubmit={handleSendHostMessage} className="pt-2 border-t border-emerald-900/60 flex items-center gap-1.5">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                placeholder={isLive ? 'Broadcast host message or answer...' : 'Go live to chat with connected students...'}
                disabled={!isLive}
                className="flex-1 px-3 py-2 rounded-xl bg-[#021d13] border border-emerald-700 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isLive || !newChatText.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RECENT DEPARTMENTAL BROADCAST SESSIONS ARCHIVE (FROM DATABASE) */}
      {broadcastHistory.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
              <Clock size={13} />
              <span>Departmental Live Broadcast Database Log ({broadcastHistory.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Synced with live_broadcasts &amp; media_resources tables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {broadcastHistory.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#021d13] border border-emerald-900/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      item.is_live ? 'bg-rose-600 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {item.is_live ? 'LIVE' : 'ARCHIVED'}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 truncate">
                      {item.course_code || item.department_code}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {item.lecturer_name} • {item.resolution || '1080p'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.media_url && (
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700"
                      title="Play Archived Lecture Video"
                    >
                      <Play size={12} />
                    </a>
                  )}
                  {!item.is_live && (
                    <button
                      type="button"
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 cursor-pointer"
                      title="Delete Record from Database"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOCIAL SIMULCAST MODAL */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#021d15] to-[#01140d] border-2 border-purple-500/70 rounded-3xl p-6 sm:p-7 space-y-5 text-white shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-purple-900 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 size={18} className="text-purple-400" />
                  <span>Configure Multi-Platform Social Simulcast Destinations</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Simulcast your live lecture simultaneously to social media platforms via standard RTMP/RTMPS ingests. Saved directly to <span className="font-mono text-purple-300">live_social_destinations</span> in MySQL.
                </p>
              </div>
              <button
                onClick={() => setShowSocialModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
              {socialDestinations.map((dest, idx) => (
                <div key={dest.platform} className="p-3.5 rounded-2xl bg-[#01140d] border border-purple-900/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dest.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span>{dest.platform_name}</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] font-mono text-slate-400">{dest.enabled ? 'Active' : 'Disabled'}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(dest.enabled)}
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setSocialDestinations(updated);
                        }}
                        className="rounded accent-purple-500"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Server Ingest URL:</span>
                      <input
                        type="text"
                        value={dest.server_url || ''}
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx] = { ...updated[idx], server_url: e.target.value };
                          setSocialDestinations(updated);
                        }}
                        className="w-full bg-[#021d13] text-purple-200 border border-purple-900 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Stream Key:</span>
                      <input
                        type="password"
                        value={dest.stream_key || ''}
                        placeholder="Paste RTMP Stream Key..."
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx] = { ...updated[idx], stream_key: e.target.value };
                          setSocialDestinations(updated);
                        }}
                        className="w-full bg-[#021d13] text-purple-200 border border-purple-900 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Direct Portal Launch Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 text-[10px]">
                    {dest.platform === 'youtube' && (
                      <a
                        href="https://studio.youtube.com/channel/live/ingest"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-300 hover:text-white flex items-center gap-1 font-sans"
                      >
                        <ExternalLink size={10} />
                        <span>Open YouTube Live Studio</span>
                      </a>
                    )}
                    {dest.platform === 'facebook' && (
                      <a
                        href="https://www.facebook.com/live/producer/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-300 hover:text-white flex items-center gap-1 font-sans"
                      >
                        <ExternalLink size={10} />
                        <span>Open Facebook Live Producer</span>
                      </a>
                    )}
                    {dest.platform === 'twitch' && (
                      <a
                        href="https://dashboard.twitch.tv/stream-manager"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-300 hover:text-white flex items-center gap-1 font-sans"
                      >
                        <ExternalLink size={10} />
                        <span>Open Twitch Dashboard</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-950">
              <span className="text-[10px] text-slate-400 font-mono">
                Keys encrypted &amp; saved in institutional database ({deptCode})
              </span>
              <button
                onClick={async () => {
                  sounds.playSuccessChime();
                  setDbSyncStatus('syncing');
                  try {
                    const base = getApiBase();
                    const res = await fetch(`${base}/live-broadcast/social-destinations`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        department_code: deptCode,
                        destinations: socialDestinations
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (Array.isArray(data.destinations)) {
                        setSocialDestinations(data.destinations);
                      }
                      setDbSyncStatus('saved');
                      setLastSyncedAt(new Date().toLocaleTimeString());
                    }
                  } catch (e) {
                    setDbSyncStatus('error');
                  }
                  setShowSocialModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-950"
              >
                Save &amp; Apply Simulcast Destinations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
