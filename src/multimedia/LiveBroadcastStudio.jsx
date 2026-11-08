import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Radio, Camera, Mic, MicOff, Monitor, Settings, Users,
  MessageSquare, Globe, Share2, Sparkles, Send, ShieldCheck,
  CheckCircle2, AlertTriangle, Play, Square, RefreshCw, Hand,
  Layers, HardDrive, KeyRound, ExternalLink, Sliders, Volume2
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function LiveBroadcastStudio({
  role = 'hod',
  currentDept = null,
  currentUser = null,
  onClose = null
}) {
  // Broadcaster states
  const [isLive, setIsLive] = useState(false);
  const [broadcastId, setBroadcastId] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewersCount, setViewersCount] = useState(1);
  const [streamMode, setStreamMode] = useState('system_camera'); // 'system_camera' | 'external_cam' | 'screen_share' | 'pip'
  const [resolution, setResolution] = useState('1080p Full HD');

  // Device selections
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Social Simulcast Configuration
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [socialDestinations, setSocialDestinations] = useState([
    { platform: 'youtube', platform_name: 'YouTube Live', enabled: true, server_url: 'rtmp://a.rtmp.youtube.com/live2', stream_key: 'xxxx-xxxx-xxxx-xxxx', status: 'ready' },
    { platform: 'facebook', platform_name: 'Facebook Live', enabled: true, server_url: 'rtmps://live-api-s.facebook.com:443/rtmp/', stream_key: 'FB-LIVE-KEY-9942', status: 'ready' },
    { platform: 'linkedin', platform_name: 'LinkedIn Live', enabled: false, server_url: 'rtmps://live-api.linkedin.com:443/rtmp/', stream_key: '', status: 'configured' },
    { platform: 'twitter', platform_name: 'X (Twitter) Live', enabled: false, server_url: 'rtmp://va.pscp.tv:80/x', stream_key: '', status: 'configured' },
    { platform: 'twitch', platform_name: 'Twitch Academic', enabled: false, server_url: 'rtmp://live.twitch.tv/app/', stream_key: '', status: 'configured' },
    { platform: 'custom_rtmp', platform_name: 'Custom Institutional RTMP', enabled: true, server_url: 'rtmp://stream.fccibadanlibrary.com.ng/live', stream_key: 'fcc-cem-key-2026', status: 'ready' }
  ]);

  // Form states
  const [lectureTitle, setLectureTitle] = useState(
    `Principles and Practices of Co-operative Societies — Live Lecture (${currentDept?.code || 'CEM'})`
  );
  const [courseCode, setCourseCode] = useState(currentDept?.code ? `${currentDept.code} 111` : 'CEM 111');
  const [announcement, setAnnouncement] = useState('Welcome scholars. Please post your questions in the live chat.');

  // Chat & Q&A
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatText, setNewChatText] = useState('');
  const [raisedHands, setRaisedHands] = useState(0);

  // Media references
  const liveVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  const deptCode = currentDept?.code || currentUser?.department_code || 'COM 221';
  const deptName = currentDept?.name || currentUser?.department_name || 'Basic Computer Network';
  const lecturerName = currentUser?.name || currentDept?.hod_name || currentDept?.hod || 'Engineer Olawale';

  // 1. Enumerate and initialize audio/video capture devices
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

  // 2. Start Camera Feed
  const startCameraStream = async (deviceId = selectedVideoDeviceId, mode = streamMode) => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }

      let stream = null;
      if (mode === 'screen_share') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true
        });
      } else {
        const constraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      mediaStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }

      // Initialize Audio Meter
      initAudioMeter(stream);
    } catch (err) {
      console.warn('Error starting camera stream:', err);
    }
  };

  // 3. Audio VU Meter simulation
  const initAudioMeter = (stream) => {
    try {
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

  useEffect(() => {
    initDevices();
    startCameraStream();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Poll Chat Messages when live
  useEffect(() => {
    if (!isLive || !broadcastId) return;

    const interval = setInterval(async () => {
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
          if (json.viewers_count) setViewersCount(json.viewers_count);
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, broadcastId]);

  // Start Live Broadcast
  const handleStartBroadcast = async () => {
    sounds.playSuccessChime();
    try {
      const base = getApiBase();
      const enabledSocial = socialDestinations.filter(d => d.enabled);

      const payload = {
        title: lectureTitle,
        department_code: deptCode,
        department_name: deptName,
        course_code: courseCode,
        lecturer_name: lecturerName,
        lecturer_role: role,
        stream_mode: streamMode,
        resolution: resolution,
        simulcast_destinations: enabledSocial,
        announcement: announcement
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

        // Start Recording using MediaRecorder
        if (mediaStreamRef.current && window.MediaRecorder) {
          try {
            recordedChunksRef.current = [];
            const rec = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
            rec.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
            };
            rec.start(1000);
            mediaRecorderRef.current = rec;
          } catch (e) {}
        }

        // Timer
        timerRef.current = setInterval(() => {
          setElapsedSeconds(prev => prev + 1);
        }, 1000);

        // Broadcast system-wide event
        window.dispatchEvent(new CustomEvent('fcc-live-broadcast-started', { detail: json.broadcast }));
      } else {
        const errJson = await res.json();
        alert(errJson.error || 'Unable to start live stream.');
      }
    } catch (err) {
      alert('Network error initiating live stream.');
    }
  };

  // Stop Live Broadcast & Auto-Archive
  const handleStopBroadcast = async () => {
    sounds.playClick();
    if (!confirm('Are you sure you want to end this live broadcast? The recorded session will be archived into the FCC Central Library Catalogue for student revision.')) {
      return;
    }

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      const base = getApiBase();
      const formData = new FormData();
      formData.append('duration_seconds', elapsedSeconds);
      formData.append('duration_formatted', formatDuration(elapsedSeconds));

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
        sounds.playSuccessChime();
        alert('✓ Live Broadcast concluded successfully! The recorded lecture is now indexed in the FCC Central Repository Catalogue.');
        window.dispatchEvent(new CustomEvent('fcc-live-broadcast-ended', { detail: { id: broadcastId } }));
      }
    } catch (err) {
      setIsLive(false);
    }
  };

  // Send Host Message in Chat
  const handleSendHostMessage = async (e) => {
    e.preventDefault();
    if (!newChatText.trim() || !broadcastId) return;

    try {
      const base = getApiBase();
      const msgText = newChatText.trim();
      setNewChatText('');
      await fetch(`${base}/live-broadcast/${broadcastId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: `${lecturerName} (Host / HOD)`,
          user_role: 'hod',
          user_matric: 'HOD-FACULTY',
          message: msgText,
          is_question: false,
          hand_raised: false
        })
      });
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
              <Radio size={12} className={isLive ? 'animate-spin' : ''} />
              <span>{isLive ? '🔴 ON AIR: BROADCASTING LIVE' : 'STUDIO STANDBY / READY TO TRANSMIT'}</span>
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#01140d] text-cyan-300 border border-cyan-800">
              {deptCode} • {deptName}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
              <Share2 size={10} />
              <span>{enabledSocialCount} Social Simulcasts Active</span>
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
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
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
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs flex items-center gap-2 shadow-xl shadow-rose-950 transition cursor-pointer animate-pulse"
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
            </div>

            {/* LIVE VIEWERS PILL */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-black/80 backdrop-blur-md text-amber-300 border border-amber-600/60 flex items-center gap-1.5 shadow">
                <Users size={13} />
                <span>{viewersCount} Students Connected</span>
              </span>
            </div>

            {/* AUDIO LEVEL VU METER (BOTTOM LEFT) */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 flex items-center gap-2">
              <Volume2 size={13} className="text-emerald-400" />
              <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-300">{audioLevel}%</span>
            </div>
          </div>

          {/* HARDWARE DEVICE & STREAM CONTROLS */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-mono flex items-center justify-between">
              <span>Hardware &amp; Video Input Configuration</span>
              <button
                onClick={initDevices}
                className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-mono"
              >
                <RefreshCw size={11} /> Refresh Devices
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* VIDEO SOURCE SELECTOR */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Camera size={11} />
                  <span>Video Input (System / External Cam):</span>
                </label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => {
                    setSelectedVideoDeviceId(e.target.value);
                    startCameraStream(e.target.value, 'system_camera');
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

              {/* STREAM SOURCE MODE (WEBCAM / SCREEN / PIP) */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Monitor size={11} />
                  <span>Presentation Mode:</span>
                </label>
                <select
                  value={streamMode}
                  onChange={(e) => {
                    setStreamMode(e.target.value);
                    startCameraStream(selectedVideoDeviceId, e.target.value);
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
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#021d13] text-emerald-200 border border-emerald-700 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="720p HD">720p HD (Low Bandwidth)</option>
                  <option value="1080p Full HD">1080p Full HD (Recommended)</option>
                  <option value="4K UHD">4K UHD Broadcast</option>
                </select>
              </div>
            </div>
          </div>

          {/* LECTURE METADATA FORM */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-emerald-800/80 space-y-3 text-xs">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide font-mono">
              Live Lecture Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Course Code &amp; Level:</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400">Lecturer / Presenter:</label>
                <input
                  type="text"
                  value={lecturerName}
                  disabled
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400">Lecture Topic / Broadcast Title:</label>
              <input
                type="text"
                value={lectureTitle}
                onChange={(e) => setLectureTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#021d13] border border-emerald-700 text-white text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 COLS): LIVE STUDENT CHAT, Q&A & SIMULCAST STATUS */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* SIMULCAST DESTINATION BADGES */}
          <div className="p-4 rounded-2xl bg-[#01140d] border border-purple-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <Globe size={13} />
                <span>Multi-Platform Simulcast</span>
              </span>
              <button
                onClick={() => { sounds.playClick(); setShowSocialModal(true); }}
                className="text-[10px] text-cyan-300 hover:text-white font-mono font-bold"
              >
                Edit Keys
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              {socialDestinations.map((d) => (
                <div
                  key={d.platform}
                  className={`p-2 rounded-xl border flex items-center justify-between ${
                    d.enabled
                      ? 'bg-purple-950/70 border-purple-600 text-purple-200'
                      : 'bg-black/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="truncate">{d.platform_name.split(' ')[0]}</span>
                  <span className={`w-2 h-2 rounded-full ${d.enabled && isLive ? 'bg-rose-500 animate-ping' : d.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                </div>
              ))}
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

                {raisedHands > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                    <Hand size={10} />
                    <span>{raisedHands} Hands</span>
                  </span>
                )}
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
                placeholder="Broadcast host message or answer..."
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
                  Simulcast your live lecture simultaneously to social media platforms via standard RTMP/RTMPS ingests.
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
                        checked={dest.enabled}
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx].enabled = e.target.checked;
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
                        value={dest.server_url}
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx].server_url = e.target.value;
                          setSocialDestinations(updated);
                        }}
                        className="w-full bg-[#021d13] text-purple-200 border border-purple-900 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">Stream Key:</span>
                      <input
                        type="password"
                        value={dest.stream_key}
                        placeholder="Paste Stream Key..."
                        onChange={(e) => {
                          const updated = [...socialDestinations];
                          updated[idx].stream_key = e.target.value;
                          setSocialDestinations(updated);
                        }}
                        className="w-full bg-[#021d13] text-purple-200 border border-purple-900 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-950">
              <button
                onClick={() => {
                  sounds.playSuccessChime();
                  setShowSocialModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
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
