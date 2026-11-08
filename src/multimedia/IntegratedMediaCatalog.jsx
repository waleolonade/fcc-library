import React, { useState, useEffect, useMemo } from 'react';
import {
  Video, Headphones, Play, Clock, BookOpen, Layers, Search, Filter,
  Sparkles, FileText, Download, ExternalLink, RefreshCw, Bookmark,
  Award, ShieldCheck, CheckCircle2, Star, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { getApiBase } from '../api/libraryApi';
import { sounds } from '../utils/soundEffects';
import MultimediaStudioPlayer from './MultimediaStudioPlayer';
import MultimediaUploadStudio from './MultimediaUploadStudio';

export default function IntegratedMediaCatalog({
  activeUser = null,
  onOpenCompanionBook = null,
  embedded = false,
  initialSearch = ''
}) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [mediaType, setMediaType] = useState('all'); // 'all' | 'video' | 'audio'
  const [resourceType, setResourceType] = useState('all'); // 'all' | 'lecture_recording' | 'practical_demo' | 'audiobook' | 'documentary' | 'podcast'
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Active player modal
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [activeResource, setActiveResource] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = getApiBase();
      const params = new URLSearchParams();
      if (mediaType !== 'all') params.append('media_type', mediaType);
      if (resourceType !== 'all') params.append('resource_type', resourceType);
      if (selectedDept !== 'ALL') params.append('department', selectedDept);
      if (selectedLevel !== 'ALL') params.append('target_level', selectedLevel);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('sort_by', sortBy);
      params.append('per_page', '50');

      const res = await fetch(`${base}/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.data || (Array.isArray(data) ? data : []);
        setMediaList(items);
      } else {
        setError('Unable to fetch media catalogue from library server.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia();
    }, 250);
    return () => clearTimeout(timer);
  }, [mediaType, resourceType, selectedDept, selectedLevel, searchQuery, sortBy]);

  // Real-time listener when a staff, HOD, admin, or developer uploads a new lecture
  useEffect(() => {
    const handleUpdated = () => {
      fetchMedia();
    };
    window.addEventListener('fcc-media-catalog-updated', handleUpdated);
    return () => window.removeEventListener('fcc-media-catalog-updated', handleUpdated);
  }, []);

  const handlePlay = (item) => {
    sounds.playClick();
    setActiveResource(item);
    setActivePlaybackId(item.id);
  };

  const departments = [
    'ALL',
    'Co-operative Economics & Management',
    'Computer Science',
    'Banking & Finance',
    'Agricultural Extension & Management',
    'Accounting',
    'Public Administration'
  ];

  const levels = ['ALL', 'ND I', 'ND II', 'HND I', 'HND II'];

  const videoCount = mediaList.filter(m => m.media_type === 'video').length;
  const audioCount = mediaList.filter(m => m.media_type === 'audio').length;

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-4 sm:p-6 max-w-7xl mx-auto'}`}>
      {/* HEADER BANNER */}
      {!embedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021810] via-[#032317] to-[#01140d] border border-emerald-700/60 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                AUDIO &amp; VIDEO DIGITAL REPOSITORY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800">
                IIIF AV &amp; Avalon Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800">
                HTTP 206 Partial Stream Engine
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Audiobooks, Recorded Lectures &amp; Practical Video Demonstrations
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl leading-relaxed">
              First-class digital audiovisual resources indexed into the Federal Co-operative College master catalogue. Stream recorded lectures, practical farm and laboratory tutorials, institutional audiobooks, and oral history archives with synchronized transcripts, cue-point chapters, and companion lecture notes.
            </p>
          </div>
        </div>
      )}

      {/* FILTER & DISCOVERY TOOLBAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#032317]/90 border border-emerald-800/80 shadow-xl space-y-4">
        {/* TOP ROW: SEARCH BAR & MEDIA TYPE TOGGLE */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures, audiobooks, topics, lecturers, course codes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#01140d] border border-emerald-800/80 focus:border-emerald-500 text-xs sm:text-sm text-white placeholder-emerald-600/70 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* MEDIA TYPE PILLS (ALL / VIDEO / AUDIO) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#01140d] border border-emerald-800/80 shrink-0">
            <button
              onClick={() => { setMediaType('all'); sounds.playClick(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <span>All Media ({mediaList.length})</span>
            </button>

            <button
              onClick={() => { setMediaType('video'); sounds.playClick(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'video'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-cyan-300/80 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <Video size={13} />
              <span>Videos ({videoCount})</span>
            </button>

            <button
              onClick={() => { setMediaType('audio'); sounds.playClick(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'audio'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Headphones size={13} />
              <span>Audio ({audioCount})</span>
            </button>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setShowUploadModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition cursor-pointer shrink-0"
            title="Upload High-Definition Lecture Video or Audiobook"
          >
            <Sparkles size={14} />
            <span>Upload AV Lecture</span>
          </button>
        </div>

        {/* BOTTOM ROW: RESOURCE TYPES & DROPDOWN FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-900/60 text-xs">
          {/* RESOURCE TYPE PILLS */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'lecture_recording', label: 'Recorded Lectures' },
              { id: 'practical_demo', label: 'Practical & Lab Demos' },
              { id: 'audiobook', label: 'Audiobooks' },
              { id: 'documentary', label: 'Documentaries' },
              { id: 'podcast', label: 'Oral History & Podcasts' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setResourceType(t.id); sounds.playClick(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  resourceType === t.id
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400'
                    : 'bg-[#01140d] text-emerald-400/80 hover:text-white border border-emerald-900/80'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* DEPARTMENT & LEVEL SELECTORS */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-[#01140d] text-emerald-200 border border-emerald-800/80 rounded-xl px-2.5 py-1 text-xs font-sans focus:outline-none focus:border-emerald-500"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-[#01140d] text-emerald-200 border border-emerald-800/80 rounded-xl px-2.5 py-1 text-xs font-sans focus:outline-none focus:border-emerald-500"
            >
              {levels.map(l => (
                <option key={l} value={l}>{l === 'ALL' ? 'All Levels' : l}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#01140d] text-emerald-200 border border-emerald-800/80 rounded-xl px-2.5 py-1 text-xs font-sans focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Viewed</option>
              <option value="plays">Most Streamed</option>
              <option value="rating">Highest Rated</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* MEDIA GRID LISTING */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-300">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono tracking-wide">Loading institutional media collections...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[#032317] border border-red-500/40 text-center space-y-3">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchMedia}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Retry Connection
          </button>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="py-16 text-center space-y-3 p-8 rounded-3xl bg-[#032317]/40 border border-emerald-800/60">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mx-auto">
            <Video size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No Media Resources Found</h3>
          <p className="text-xs text-emerald-300/80 max-w-md mx-auto">
            No audio or video recordings matched the selected filter criteria. Try resetting filters or searching with broader keywords.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setMediaType('all');
              setResourceType('all');
              setSelectedDept('ALL');
              setSelectedLevel('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaList.map((item) => {
            const isVid = item.media_type === 'video';
            const chaptersCount = item.chapters?.length || 0;

            return (
              <div
                key={item.id}
                className="group rounded-3xl bg-[#032317] border border-emerald-800/80 hover:border-emerald-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-950 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* POSTER CARD WITH PLAY OVERLAY & DURATION BADGE */}
                  <div
                    className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                    onClick={() => handlePlay(item)}
                  >
                    <img
                      src={item.cover_image || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                      <div className="w-13 h-13 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition duration-300">
                        <Play size={22} className="ml-0.5 fill-white" />
                      </div>
                    </div>

                    {/* TOP BADGES: MEDIA TYPE & RESOLUTION */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white shadow-md flex items-center gap-1 ${
                        isVid ? 'bg-cyan-700/90' : 'bg-emerald-700/90'
                      }`}>
                        {isVid ? <Video size={11} /> : <Headphones size={11} />}
                        <span className="uppercase">{item.resource_type.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {/* DURATION PILL */}
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold border border-white/20 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{item.duration_formatted}</span>
                    </div>
                  </div>

                  {/* DETAILS CARD BODY */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* DEPARTMENT & COURSE TAGS */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      {item.course_code && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-cyan-300 border border-emerald-700 font-bold">
                          {item.course_code}
                        </span>
                      )}
                      {item.target_level && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-amber-300 border border-emerald-700">
                          {item.target_level}
                        </span>
                      )}
                      <span className="text-emerald-400/80 truncate max-w-[150px]">
                        {item.department_name}
                      </span>
                    </div>

                    {/* TITLE */}
                    <h3
                      className="text-sm font-bold text-white group-hover:text-emerald-300 transition line-clamp-2 leading-snug cursor-pointer"
                      onClick={() => handlePlay(item)}
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* CREATOR / LECTURER */}
                    <div className="text-xs text-slate-300">
                      <span>Lecturer: <strong className="text-white">{item.creator}</strong></span>
                      {item.creator_title && (
                        <span className="block text-[11px] text-emerald-400/80 truncate">{item.creator_title}</span>
                      )}
                    </div>

                    {/* DESCRIPTION EXCERPT */}
                    <p className="text-[11px] text-slate-300/80 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* CARD FOOTER WITH ACTION BUTTONS */}
                <div className="p-4 sm:p-5 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-emerald-900/60 text-xs">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/80">
                      {chaptersCount > 0 && (
                        <span>{chaptersCount} Chapters</span>
                      )}
                      {item.companion_pdf_url && (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <FileText size={10} /> Handout
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handlePlay(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <span>{isVid ? 'Watch Video' : 'Listen Audio'}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MULTIMEDIA UPLOAD STUDIO MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto my-auto">
            <MultimediaUploadStudio
              role={activeUser?.role || 'staff'}
              currentUser={activeUser}
              onClose={() => setShowUploadModal(false)}
              onUploadSuccess={() => {
                setShowUploadModal(false);
                fetchMedia();
              }}
            />
          </div>
        </div>
      )}

      {/* FULLSCREEN MULTIMEDIA STUDIO PLAYER MODAL */}
      {activePlaybackId && activeResource && (
        <MultimediaStudioPlayer
          mediaId={activePlaybackId}
          initialResource={activeResource}
          activeUser={activeUser}
          onOpenCompanionBook={onOpenCompanionBook}
          onClose={() => {
            setActivePlaybackId(null);
            setActiveResource(null);
          }}
        />
      )}
    </div>
  );
}

