import React, { useState } from 'react';
import {
  Calendar, Bell, Users, MapPin, Clock, CheckCircle,
  Award, Sparkles, ChevronRight, Share2, Plus
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function StudentEventsAndAnnouncements({
  events,
  announcements,
  onRegisterEvent
}) {
  const [registeredFeedback, setRegisteredFeedback] = useState(null);

  const handleRegister = (evt) => {
    onRegisterEvent(evt.id);
    sounds.playSuccessChime();
    setRegisteredFeedback(evt.title);
    setTimeout(() => setRegisteredFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
            CAMPUS NOTICES & WORKSHOPS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Library Events & Announcements</h2>
          <p className="text-xs text-slate-400">
            Institutional notices, extended examination hours, citation masterclasses, and research symposia.
          </p>
        </div>
      </div>

      {registeredFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={18} />
          <span>Seat reserved successfully for <strong>"{registeredFeedback}"</strong>! Event added to your calendar.</span>
        </div>
      )}

      {/* 1. ANNOUNCEMENTS WITH PRIORITY BADGES */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <Bell size={15} className="text-rose-400" /> Institutional Announcements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                    ann.badgeColor === 'rose'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : ann.badgeColor === 'emerald'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}>
                    {ann.priority}
                  </span>
                  <span className="text-slate-500 font-mono">{ann.date}</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{ann.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.message}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                Scope: {ann.branch}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. LIBRARY EVENTS & WORKSHOPS */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <Calendar size={15} className="text-emerald-400" /> Scheduled Workshops & Training Sessions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(evt => (
            <div
              key={evt.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-600/50 transition flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {evt.category}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">{evt.seatsAvailable} Seats Left</span>
                </div>

                <h4 className="text-base font-bold text-white leading-snug">{evt.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{evt.description}</p>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-slate-400 mt-2">
                  <div>📅 <strong className="text-slate-200">{evt.date}</strong></div>
                  <div>⏰ <strong className="text-slate-200">{evt.time}</strong></div>
                  <div>📍 <strong className="text-slate-300 truncate block">{evt.venue}</strong></div>
                  <div>🎙️ <strong className="text-slate-300 truncate block">{evt.speaker?.split('(')[0]}</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Admission: Free (Enrolled Scholars)</span>
                <button
                  disabled={evt.isRegistered}
                  onClick={() => handleRegister(evt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    evt.isRegistered
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                  }`}
                >
                  {evt.isRegistered ? <CheckCircle size={14} /> : <Plus size={14} />}
                  <span>{evt.isRegistered ? 'Registered ✓' : 'Register Now'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
