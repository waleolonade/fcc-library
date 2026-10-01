import React, { useState } from 'react';
import {
  DoorOpen, Clock, Users, Wifi, Tv, CheckCircle, Calendar, Sparkles,
  ShieldCheck, KeyRound, Monitor, Zap, Volume2, Filter, Check, Copy
} from 'lucide-react';
import { INITIAL_STUDY_ROOMS, INITIAL_ROOM_BOOKINGS } from '../data/institutionalSeedData';

export default function StudyRoomBooking({ user }) {
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('fcc_study_rooms');
    return saved ? JSON.parse(saved) : INITIAL_STUDY_ROOMS;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('fcc_room_bookings');
    return saved ? JSON.parse(saved) : INITIAL_ROOM_BOOKINGS;
  });

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_bookings'
  const [selectedSlot, setSelectedSlot] = useState('08:00 - 10:00');
  const [selectedType, setSelectedType] = useState('All');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00'
  ];

  const roomTypes = ['All', 'Individual', 'Collaborative', 'Conference', 'Multimedia'];

  const handleBookRoom = (room) => {
    const passCode = `PIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
      matric: user?.matric || 'FCC/CEM/2024/042',
      studentName: user?.name || 'Wale Olonade',
      roomId: room.id,
      roomName: room.name,
      date: new Date().toISOString().split('T')[0],
      timeSlot: selectedSlot,
      status: 'Confirmed',
      passCode: passCode
    };

    const updatedRooms = rooms.map(r => r.id === room.id ? { ...r, status: 'booked', bookedBy: user?.name || 'Scholar Patron' } : r);
    const updatedBookings = [newBooking, ...bookings];

    setRooms(updatedRooms);
    setBookings(updatedBookings);
    localStorage.setItem('fcc_study_rooms', JSON.stringify(updatedRooms));
    localStorage.setItem('fcc_room_bookings', JSON.stringify(updatedBookings));

    setBookingSuccessModal(newBooking);
  };

  const handleCancelBooking = (bookingId, roomId) => {
    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, status: 'available' } : r);
    setBookings(updatedBookings);
    setRooms(updatedRooms);
    localStorage.setItem('fcc_study_rooms', JSON.stringify(updatedRooms));
    localStorage.setItem('fcc_room_bookings', JSON.stringify(updatedBookings));
  };

  const filteredRooms = rooms.filter(r => {
    if (selectedType === 'All') return true;
    return (r.type || '').toLowerCase().includes(selectedType.toLowerCase());
  });

  const userBookings = bookings.filter(b => !user?.matric || b.matric === user.matric);

  const copyPasscode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles size={13} className="text-emerald-400" />
            <span>Campus Study & Research Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Study Rooms & Research Carrel Reservation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Book private soundproof research carrels, group collaboration suites, and multimedia workstations at the Federal Co-operative College Main Library.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DoorOpen size={14} />
            <span>Available Spaces</span>
          </button>
          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'my_bookings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={14} />
            <span>My Bookings</span>
            {userBookings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                {userBookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Filters & Time Slot Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Slot Picker */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" /> Select Reservation Time Slot:
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedSlot === slot
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-400/50'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Space Type Filter */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-400" /> Filter By Space Category:
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {roomTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedType === t
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-950 ring-1 ring-teal-400/50'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {t === 'All' ? 'All Spaces' : `${t} Pods`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map(room => {
              const facilities = room.facilities || room.amenities || [];
              const isAvailable = room.status === 'available';

              return (
                <div
                  key={room.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xl transition hover:border-slate-700 ${
                    isAvailable ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-900/50 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
                        {room.floor || 'Floor 1'} • {room.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isAvailable
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                        {isAvailable ? 'Available Now' : 'Reserved'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Users size={13} className="text-slate-500" />
                          <span>Max {room.capacity} {room.capacity === 1 ? 'Person' : 'Persons'}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-300">{room.type}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Zap size={11} className="text-emerald-400" />
                        <span>Included Amenities & Technology:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {facilities.map((fac, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800/80"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <button
                      disabled={!isAvailable}
                      onClick={() => handleBookRoom(room)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-800 text-white font-bold text-xs transition shadow-md shadow-emerald-950 flex items-center justify-center gap-2"
                    >
                      <KeyRound size={14} />
                      <span>{isAvailable ? `Instant Book for ${selectedSlot}` : 'Reserved in Current Slot'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* My Active Bookings View */
        <div className="space-y-4">
          {userBookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <Calendar size={40} className="mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-white">No Active Study Room Reservations</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You currently do not have any study carrels or rooms booked. Choose a space from the catalog to get a digital electronic door passkey.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition"
              >
                Browse Available Spaces
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userBookings.map(b => (
                <div key={b.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                        {b.id}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{b.roomName}</h4>
                      <p className="text-xs text-slate-400">{b.roomId} • Reserved for {b.studentName}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Date</span>
                      <span className="text-slate-200 font-semibold">{b.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Time Window</span>
                      <span className="text-slate-200 font-semibold">{b.timeSlot}</span>
                    </div>
                  </div>

                  {/* Smart Door Access Passkey */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Door Access Passcode</div>
                      <div className="text-lg font-mono font-black text-white tracking-widest">{b.passCode || 'PIN-4821'}</div>
                    </div>
                    <button
                      onClick={() => copyPasscode(b.passCode || 'PIN-4821')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleCancelBooking(b.id, b.roomId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-bold transition"
                    >
                      Release Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-600/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-white">Study Space Reserved!</h3>
              <p className="text-xs text-slate-400">
                Your reservation for <strong className="text-slate-200">{bookingSuccessModal.roomName}</strong> has been logged in the campus access controller.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Reference:</span>
                <span className="text-emerald-400 font-bold">{bookingSuccessModal.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Room / Carrel:</span>
                <span className="text-slate-200">{bookingSuccessModal.roomId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Time Slot:</span>
                <span className="text-slate-200">{bookingSuccessModal.timeSlot}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Patron:</span>
                <span className="text-slate-200">{bookingSuccessModal.studentName}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-emerald-400 font-bold">Door Passcode:</span>
                <span className="text-lg font-black text-white tracking-widest bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700">
                  {bookingSuccessModal.passCode}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-950"
              >
                Done & View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
