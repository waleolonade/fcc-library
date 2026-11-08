import React, { useState, useEffect, useRef } from 'react';
import {
  Radio, Users, MessageSquare, Hand, Sparkles, Send, Volume2,
  VolumeX, Maximize2, Minimize2, Download, FileText, ArrowLeft,
  CheckCircle2, Share2, BookOpen
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const studentName = currentUser?.name || 'FCC Student Scholar';
  const studentMatric = currentUser?.matric || currentUser?.id || 'FCC/2026/01';

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

    // Heartbeat to update viewer count
    const hbInterval = setInterval(async () => {
      try {
        const base = getApiBase();
        await fetch(`${base}/live-broadcast/${broadcast.id}/heartbeat`, { method: 'POST' });
      } catch (e) {}
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(hbInterval);
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
                <Radio size={11} />
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
            <video
              ref={videoRef}
              src="https://vjs.zencdn.net/v/oceans.mp4"
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-contain max-h-[80vh]"
            />

            {/* LIVE WATERMARK */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-600/90 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>FCC LIVE CLASSROOM</span>
            </div>

            {/* LECTURER BANNER */}
            <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-xs space-y-0.5">
              <div className="text-[10px] font-mono text-cyan-300 uppercase">Supervising Lecturer:</div>
              <div className="font-bold text-white">{broadcast.lecturer_name}</div>
              <div className="text-[10px] text-slate-400">{broadcast.department_name}</div>
            </div>

            {/* CONTROLS (BOTTOM RIGHT) */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-black/80 hover:bg-black text-white border border-white/20 transition cursor-pointer"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-black/80 hover:bg-black text-white border border-white/20 transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
