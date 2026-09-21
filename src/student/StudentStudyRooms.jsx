import React, { useState } from 'react';
import {
  DoorOpen, Users, Wifi, Tv, Wind, Zap, Check, Clock,
  Calendar, CheckCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function StudentStudyRooms({
  rooms,
  bookings,
  onBookRoom,
  onCancelBooking,
  user
}) {
  const [selectedDay, setSelectedDay] = useState('Today');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const userBookings = bookings.filter(b => b.matric === user?.matric);

  const handleConfirmBooking = (room, slot) => {
    onBookRoom({
      matric: user.matric,
      studentName: user.name,
      roomId: room.id,
      roomName: room.name,
      timeSlot: slot,
      date: new Date().toISOString().split('T')[0]
    });
    sounds.playSuccessChime();
    setBookingSuccess({ roomName: room.name, slot });
    setTimeout(() => {
      setBookingSuccess(null);
      setSelectedRoom(null);
      setSelectedSlot(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
            RESEARCH CARRELS & COLLABORATIVE PODS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Study Spaces & Carrel Reservation</h2>
          <p className="text-xs text-slate-400">
            Reserve quiet research cubicles, group project rooms, and multimedia seminar suites equipped with presentation screens.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs shrink-0">
          {['Today', 'Tomorrow', 'This Week'].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                selectedDay === d ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle size={20} className="shrink-0 text-emerald-400" />
          <div>
            <strong>Reservation Confirmed!</strong> Booked {bookingSuccess.roomName} ({bookingSuccess.slot}). Your access token is generated.
          </div>
        </div>
      )}

      {/* Active Bookings Summary */}
      {userBookings.length > 0 && (
        <div className="p-5 rounded-3xl bg-blue-950/40 border border-blue-800/50 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 font-mono flex items-center gap-2">
            <Clock size={15} /> Your Active Reservations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userBookings.map(bkg => (
              <div key={bkg.id} className="p-4 rounded-2xl bg-slate-900 border border-blue-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{bkg.roomName}</div>
                  <div className="text-[11px] text-blue-300 font-mono mt-0.5">{bkg.date} • {bkg.timeSlot}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">Check-in Pass: <strong>{bkg.checkInCode || 'CHK-782'}</strong></div>
                </div>
                <button
                  onClick={() => onCancelBooking(bkg.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map(room => (
          <div
            key={room.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-600/50 transition flex flex-col justify-between space-y-5 shadow-2xl"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {room.floor}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{room.name}</h3>
                  <p className="text-xs text-slate-400">{room.type}</p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Users size={12} /> {room.capacity} Person{room.capacity > 1 ? 's' : ''}
                </span>
              </div>

              {/* Amenities Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {room.facilities?.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-medium">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Available 2-Hour Time Slots ({selectedDay})</div>
              <div className="grid grid-cols-3 gap-2">
                {room.availableTimeSlots?.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => handleConfirmBooking(room, slot)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500 text-[11px] font-mono font-semibold transition text-center"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
