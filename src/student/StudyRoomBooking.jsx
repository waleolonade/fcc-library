import React, { useState } from 'react';
import { DoorOpen, Clock, Users, Wifi, Tv, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { INITIAL_STUDY_ROOMS } from '../data/institutionalSeedData';

export default function StudyRoomBooking({ user }) {
  const [rooms, setRooms] = useState(INITIAL_STUDY_ROOMS);
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 11:00');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  const timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00'
  ];

  const handleBookRoom = (roomId) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'booked', bookedBy: user.name } : r));
    setBookingSuccessMsg(`Reserved room ${roomId} for slot ${selectedSlot}! Passcode sent to your student portal.`);
    setTimeout(() => setBookingSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-emerald-400" />
          Campus Study & Research Infrastructure
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Study Rooms & Research Carrel Reservation
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Reserve individual soundproof research carrels, group collaboration rooms, or seminar suites at the Main Campus Library.
        </p>
      </div>

      {bookingSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{bookingSuccessMsg}</span>
        </div>
      )}

      {/* Time Slot Picker */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={14} className="text-emerald-400" /> Select Session Time Slot:
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {timeSlots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedSlot === slot
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {rooms.map(room => (
          <div
            key={room.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">
                  {room.floor} • {room.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  room.status === 'available'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {room.status === 'available' ? 'Available' : 'Currently Reserved'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{room.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Users size={13} className="text-slate-500" /> Max Capacity: {room.capacity} Persons ({room.type})
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-400 font-semibold">Included Amenities:</div>
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities.map((a, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                disabled={room.status !== 'available'}
                onClick={() => handleBookRoom(room.id)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:bg-slate-800 text-white font-bold text-xs transition shadow-md shadow-emerald-950"
              >
                {room.status === 'available' ? `Book for ${selectedSlot}` : 'Reserved in Current Slot'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
