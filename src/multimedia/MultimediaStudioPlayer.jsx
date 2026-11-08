import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Maximize2, Minimize2,
  FileText, Clock, BookOpen, Layers, Check, Copy, Quote, ExternalLink,
  ChevronRight, Sparkles, Download, ArrowLeft, BookmarkCheck, Share2,
  ListOrdered, Subtitles, Settings, AlertCircle, Headphones, Video as VideoIcon
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';

export default function MultimediaStudioPlayer({
  mediaId,
  initialResource = null,
  onClose,
  activeUser = null,
  onOpenCompanionBook = null
}) {
  const [resource, setResource] = useState(initialResource);
  const [loading, setLoading] = useState(!initialResource);
  const [error, setError] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialResource?.duration_seconds || 0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chapters'); // 'chapters' | 'transcript' | 'handout' | 'details'
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(null);
  const [sizeMode, setSizeMode] = useState('auto'); // 'auto' | 'compact' | 'original'

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressSaveTimerRef = useRef(null);

  const isVideo = resource?.media_type === 'video';
  const mediaRef = isVideo ? videoRef : audioRef;

  // Fetch full media dossier if not fully loaded
  useEffect(() => {
    let isMounted = true;
    const fetchDossier = async () => {
      if (!mediaId) return;
      // If this is an external World Open API item, initialResource contains all necessary metadata and direct stream URL
      if (typeof mediaId === 'string' && (mediaId.startsWith('ia-') || mediaId.startsWith('wiki-') || mediaId.startsWith('librivox-') || mediaId.startsWith('nasa-') || mediaId.startsWith('europeana-') || mediaId.startsWith('ocw-') || mediaId.startsWith('ext-'))) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const base = getApiBase();
        const matric = activeUser?.matric || activeUser?.id || '';
        const url = `${base}/media/${encodeURIComponent(mediaId)}${matric ? `?user_id=${encodeURIComponent(matric)}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setResource(data.resource);
            if (data.resource?.duration_seconds) {
              setDuration(data.resource.duration_seconds);
            }
            if (data.progress?.last_position_seconds > 10 && !data.progress?.completed) {
              setResumePrompt(data.progress.last_position_seconds);
            }
          }
        } else {
          if (isMounted && !initialResource) setError('Unable to load media resource details.');
        }
      } catch (err) {
        if (isMounted && !initialResource) setError(err.message || 'Network connection failed.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDossier();
    return () => { isMounted = false; };
  }, [mediaId, activeUser, initialResource]);

  // Stream URL calculation
  const streamSrc = useMemo(() => {
    if (!resource) return '';
    const directUrl = resource.playback_url || resource.media_url;
    if (directUrl?.startsWith('http://') || directUrl?.startsWith('https://')) {
      return directUrl;
    }
    const base = getApiBase();
    return `${base}/media/${encodeURIComponent(resource.id)}/stream`;
  }, [resource]);

  // Sync playback position to server (media_progress) every 15 seconds
  const saveProgressToServer = (pos, total) => {
    const userIdentifier = activeUser?.matric || activeUser?.id || activeUser?.username;
    if (!userIdentifier || !resource?.id || total <= 0) return;

    const base = getApiBase();
    fetch(`${base}/media/${encodeURIComponent(resource.id)}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_identifier: userIdentifier,
        position_seconds: Math.floor(pos),
        total_seconds: Math.floor(total),
        completed: (pos / total) >= 0.9
      })
    }).catch(() => {});
  };

  const handleTimeUpdate = () => {
    const el = mediaRef.current;
    if (!el) return;
    const cur = el.currentTime;
    setCurrentTime(cur);

    // Save progress periodically
    if (!progressSaveTimerRef.current || Math.abs(cur - progressSaveTimerRef.current) > 15) {
      progressSaveTimerRef.current = cur;
      saveProgressToServer(cur, el.duration || duration);
    }
  };

  const handleLoadedMetadata = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.duration && !isNaN(el.duration)) {
      setDuration(el.duration);
    }
  };

  const togglePlay = () => {
    const el = mediaRef.current;
    if (!el) return;
    sounds.playClick();
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (seconds) => {
    const el = mediaRef.current;
    if (!el) return;
    sounds.playClick();
    el.currentTime = Math.max(0, Math.min(seconds, duration));
  };

  const handleSkip = (delta) => {
    const el = mediaRef.current;
    if (!el) return;
    sounds.playClick();
    el.currentTime = Math.max(0, Math.min(el.currentTime + delta, duration));
  };

  const handleSpeedChange = (speed) => {
    const el = mediaRef.current;
    if (!el) return;
    sounds.playClick();
    el.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleMute = () => {
    const el = mediaRef.current;
    if (!el) return;
    sounds.playClick();
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const handleVolumeChange = (newVol) => {
    const el = mediaRef.current;
    if (!el) return;
    el.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      el.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    sounds.playClick();
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.code === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isMuted, isPlaying]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const s = Math.floor(secs);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const chapters = resource?.chapters || [];
  const transcripts = resource?.transcripts?.[0]?.timed_cues || [];

  // Active chapter lookup based on playhead
  const currentChapter = useMemo(() => {
    if (!chapters.length) return null;
    return [...chapters].reverse().find(c => currentTime >= c.start_seconds) || chapters[0];
  }, [chapters, currentTime]);

  // Generate APA 7th Citation for Audiovisual Resource
  const citationText = useMemo(() => {
    if (!resource) return '';
    const creator = resource.creator || 'Federal Co-operative College';
    const year = resource.publication_date ? new Date(resource.publication_date).getFullYear() : '2026';
    const format = resource.media_type === 'video' ? 'Video recording' : 'Audio recording';
    const publisher = resource.publisher || 'Federal Co-operative College Press & Digital Media Center';
    return `${creator} (${year}). ${resource.title} [${format}]. ${publisher}. ${window.location.origin}/#/opac`;
  }, [resource]);

  const copyCitation = () => {
    navigator.clipboard?.writeText(citationText);
    sounds.playSuccessChime();
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono tracking-wide text-emerald-300">Initializing Media Stream Engine...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-red-500/50 text-center space-y-4">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <h3 className="text-lg font-bold">Playback Error</h3>
          <p className="text-sm text-slate-300">{error || 'Resource not found'}</p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Return to Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-fadeIn">
      {/* TOP APEX HEADER */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
            title="Return to Library Catalogue"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Catalogue</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold text-white ${isVideo ? 'bg-cyan-600' : 'bg-emerald-600'}`}>
                {isVideo ? 'Video Lecture' : 'Audiobook / Audio'}
              </span>
              {resource.course_code && (
                <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {resource.course_code}
                </span>
              )}
              {resource.target_level && (
                <span className="text-[10px] font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {resource.target_level}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-white truncate max-w-xl" title={resource.title}>
              {resource.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyCitation}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            title="Copy APA 7th Citation"
          >
            {copiedCitation ? <Check size={14} className="text-emerald-400" /> : <Quote size={14} />}
            <span className="hidden md:inline">{copiedCitation ? 'Citation Copied' : 'Cite APA'}</span>
          </button>

          {resource.companion_pdf_url && (
            <button
              onClick={() => {
                if (onOpenCompanionBook && resource.companion_book_id) {
                  onOpenCompanionBook(resource.companion_book_id);
                } else {
                  window.open(resource.companion_pdf_url, '_blank');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold flex items-center gap-1.5 shadow transition"
              title="Open Lecture Notes Handout"
            >
              <FileText size={14} />
              <span className="hidden md:inline">Lecture Handout (PDF)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 flex items-center justify-center text-slate-400 transition"
            title="Close Player"
          >
            ✕
          </button>
        </div>
      </header>

      {/* RESUME PLAYBACK BANNER */}
      {resumePrompt && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-500/40 px-6 py-2 flex items-center justify-between text-xs animate-fadeIn shrink-0">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <BookmarkCheck size={16} className="text-emerald-400" />
            <span>Resume playback where you stopped at <strong>{formatTime(resumePrompt)}</strong>?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleSeek(resumePrompt);
                setResumePrompt(null);
                togglePlay();
              }}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
            >
              Resume ({formatTime(resumePrompt)})
            </button>
            <button
              onClick={() => setResumePrompt(null)}
              className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
            >
              Start from beginning
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE: TWO COLUMNS (PLAYER ON LEFT, METADATA/CHAPTERS ON RIGHT) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT COLUMN: AUDIO/VIDEO PLAYER STAGE */}
        <div className="lg:col-span-8 bg-black flex flex-col justify-between overflow-hidden relative group" ref={playerContainerRef}>
          {/* MEDIA ELEMENT */}
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-950 to-black relative overflow-hidden p-2 sm:p-4">
            {isVideo ? (
              (() => {
                const isReduced = sizeMode === 'compact' || (sizeMode === 'auto' && !isPlaying);
                return (
                  <div className={`transition-all duration-500 ease-out flex items-center justify-center ${
                    isReduced
                      ? 'w-full max-w-lg mx-auto py-4 px-2'
                      : 'w-full h-full max-h-[75vh]'
                  }`}>
                    <div className={`relative overflow-hidden transition-all duration-500 shadow-2xl ${
                      isReduced
                        ? 'w-full rounded-3xl border-2 border-emerald-500/50 scale-95 hover:scale-100 hover:border-emerald-400 bg-black cursor-pointer group/compact shadow-emerald-950/60'
                        : 'w-full h-full rounded-xl bg-black'
                    }`}>
                      <video
                        ref={videoRef}
                        src={streamSrc}
                        poster={resource.cover_image || '/assets/fcc-logo.png'}
                        className={`object-contain transition-all duration-500 ${
                          isReduced
                            ? 'w-full aspect-video max-h-[44vh]'
                            : 'w-full h-full max-h-[75vh]'
                        }`}
                        onClick={() => {
                          togglePlay();
                          if (isReduced) sounds.playClick();
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                      />

                      {/* REDUCED IDLE PREVIEW OVERLAY: Click to expand to Original Full HD */}
                      {isReduced && (
                        <div
                          onClick={() => {
                            togglePlay();
                            sounds.playClick();
                          }}
                          className="absolute inset-0 bg-black/40 hover:bg-black/20 flex flex-col items-center justify-center gap-2.5 transition backdrop-blur-[1px] p-4 text-center cursor-pointer select-none"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-emerald-600/90 group-hover/compact:bg-emerald-500 text-white flex items-center justify-center shadow-2xl transform group-hover/compact:scale-110 transition duration-300 border border-emerald-400">
                            <Play size={26} className="ml-1 fill-white" />
                          </div>
                          <div className="bg-black/90 px-4 py-1.5 rounded-full border border-emerald-500/60 shadow-xl">
                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                              <Sparkles size={13} className="text-emerald-400" />
                              <span>Click to Play in Original Full Clarity (1080p HD)</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-300/90 font-mono">
                            Reduced preview saves data while paused • Click to stream full size
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="w-full max-w-md p-8 flex flex-col items-center justify-center text-center space-y-6">
                <audio
                  ref={audioRef}
                  src={streamSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="relative">
                  <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 bg-slate-900 mx-auto group">
                    <img
                      src={resource.cover_image || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80'}
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-mono font-bold border shadow-xl flex items-center gap-1.5 ${
                    isPlaying ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    <Headphones size={13} />
                    <span>{isPlaying ? 'Now Playing' : 'Audiobook / Audio'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{resource.title}</h3>
                  <p className="text-xs text-emerald-400 font-medium">{resource.creator}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{resource.department_name}</p>
                </div>
              </div>
            )}

            {/* FLOATING WATERMARK ACCREDITATION */}
            <div className="absolute top-4 right-4 pointer-events-none opacity-40 hover:opacity-100 transition text-[10px] font-mono text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              FCC Institutional Repository • Verified Stream
            </div>
          </div>

          {/* CUSTOM PROFESSIONAL AUDIO/VIDEO CONTROLLER BAR */}
          <div className="bg-slate-950/95 border-t border-slate-800 p-3 sm:p-4 space-y-2 select-none">
            {/* TIMELINE SLIDER WITH CHAPTER TOOLTIPS */}
            <div className="space-y-1">
              <div className="relative group/bar flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-800 accent-emerald-500 cursor-pointer appearance-none transition"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                  {currentChapter && (
                    <span className="hidden sm:inline text-emerald-400 font-sans truncate max-w-xs">
                      • {currentChapter.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {resource.video_resolution && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                      {resource.video_resolution}
                    </span>
                  )}
                  {resource.audio_bitrate && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                      {resource.audio_bitrate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* BUTTON CONTROLS ROW */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* LEFT GROUP: PLAY, PAUSE, SKIP */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>

                <button
                  onClick={() => handleSkip(-10)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                  title="Rewind 10 seconds (J / ←)"
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                  title="Forward 10 seconds (L / →)"
                >
                  <RotateCw size={16} />
                </button>

                {/* VOLUME SLIDER */}
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1.5 rounded-lg bg-slate-800 accent-emerald-500 cursor-pointer appearance-none hidden sm:inline"
                    title="Volume slider"
                  />
                </div>
              </div>

              {/* RIGHT GROUP: SPEED, FULLSCREEN, DOWNLOAD */}
              <div className="flex items-center gap-2">
                {/* PLAYBACK SPEED SELECTOR */}
                <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-1">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                        playbackSpeed === spd
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {resource.download_allowed && resource.download_url && (
                  <a
                    href={resource.download_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                    title="Download Offline Copy"
                  >
                    <Download size={16} />
                  </a>
                )}

                {isVideo && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSizeMode(prev => (prev === 'original' ? 'compact' : 'original'));
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title={
                      (sizeMode === 'compact' || (sizeMode === 'auto' && !isPlaying))
                        ? 'Click to Expand to Original Full HD (1080p)'
                        : 'Switch to Compact Bandwidth Saver'
                    }
                  >
                    {(sizeMode === 'compact' || (sizeMode === 'auto' && !isPlaying)) ? (
                      <>
                        <Sparkles size={12} className="text-emerald-400" />
                        <span className="hidden sm:inline">Original Full HD</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 size={12} className="text-cyan-400" />
                        <span className="hidden sm:inline">Compact Size</span>
                      </>
                    )}
                  </button>
                )}

                {isVideo && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                    title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHAPTERS, TRANSCRIPTS & DOSSIER TABS */}
        <div className="lg:col-span-4 bg-slate-900 border-l border-slate-800 flex flex-col min-h-0">
          {/* TAB SWITCHER */}
          <div className="flex border-b border-slate-800 bg-slate-950/80 p-2 gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'chapters'
                  ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ListOrdered size={14} />
              <span>Chapters ({chapters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'transcript'
                  ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Subtitles size={14} />
              <span>Transcript</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen size={14} />
              <span>Details</span>
            </button>
          </div>

          {/* TAB CONTENT SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. CHAPTERS (Avalon Media / IIIF Presentation 3.0 AV Cues) */}
            {activeTab === 'chapters' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Structured Timeline Cue Points</span>
                  <span className="font-mono text-emerald-400">{chapters.length} Cues</span>
                </div>

                {chapters.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-950 rounded-xl text-center">
                    No chapter markers set for this recording.
                  </p>
                ) : (
                  chapters.map((ch, idx) => {
                    const isCur = currentChapter?.id === ch.id;
                    return (
                      <div
                        key={ch.id || idx}
                        onClick={() => handleSeek(ch.start_seconds)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                          isCur
                            ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md text-white'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          isCur ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold truncate">{ch.title}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 shrink-0">
                              {ch.timestamp_formatted || formatTime(ch.start_seconds)}
                            </span>
                          </div>
                          {ch.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {ch.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. TIMED TRANSCRIPT */}
            {activeTab === 'transcript' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Live Synchronized Transcript</span>
                  <span className="text-[10px] font-mono text-cyan-300">Auto-Scroll Active</span>
                </div>

                {transcripts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                    <p>Live timed transcript is being generated by the institutional speech recognition engine.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transcripts.map((cue, idx) => {
                      const isActiveCue = currentTime >= cue.start && currentTime <= cue.end;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSeek(cue.start)}
                          className={`p-3 rounded-xl transition cursor-pointer text-xs leading-relaxed ${
                            isActiveCue
                              ? 'bg-cyan-950/80 border border-cyan-500 text-white font-semibold shadow'
                              : 'bg-slate-950/50 hover:bg-slate-950 text-slate-300 hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="font-mono text-[10px] text-cyan-400 mr-2 font-bold">
                            [{formatTime(cue.start)}]
                          </span>
                          <span>{cue.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. DETAILS & METADATA (Dublin Core Standards) */}
            {activeTab === 'details' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm">Bibliographic Record</h3>

                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Creator</span>
                      <strong className="text-white">{resource.creator}</strong>
                      {resource.creator_title && <span className="block text-[11px] text-slate-400">{resource.creator_title}</span>}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Department</span>
                      <strong className="text-white">{resource.department_name || 'General Studies'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Course Code</span>
                      <strong className="text-cyan-400 font-mono">{resource.course_code || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Target Level</span>
                      <strong className="text-amber-300">{resource.target_level}</strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Call Number</span>
                      <span className="font-mono text-slate-300">{resource.call_number}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Access Level</span>
                      <span className="text-emerald-400 font-bold uppercase text-[10px]">{resource.access_level}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">Description / Abstract</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{resource.description}</p>
                  </div>

                  {Array.isArray(resource.subject_keywords) && resource.subject_keywords.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Subject Headings</span>
                      <div className="flex flex-wrap gap-1">
                        {resource.subject_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400 space-y-0.5">
                    <div>Copyright: {resource.copyright_owner}</div>
                    <div>License: {resource.license_type}</div>
                    <div>Publisher: {resource.publisher}</div>
                  </div>
                </div>

                {/* CITATION PREVIEW BOX */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Quote size={13} className="text-emerald-400" />
                      <span>APA 7th Edition Citation</span>
                    </span>
                    <button
                      onClick={copyCitation}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      {copiedCitation ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] font-serif text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 select-all leading-relaxed">
                    {citationText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

