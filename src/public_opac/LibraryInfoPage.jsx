import React, { useState } from 'react';
import {
  BookOpen, Clock, MapPin, Phone, Mail, Globe, Users,
  Shield, Award, ChevronDown, ChevronRight, Building2, Star, Layers
} from 'lucide-react';
import { LIBRARY_INFO, INSTITUTION, BRANCHES } from '../data/institutionalSeedData';

// =========================================================================
// LIBRARY INFORMATION PAGE — "About the Library"
// Description, Mission, Vision, Rules, Hours, Contact, Depts, Services
// =========================================================================

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Icon size={16} className="text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-800 pt-4">{children}</div>}
    </div>
  );
}

export default function LibraryInfoPage({ onClose }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{INSTITUTION.name}</h1>
            <p className="text-emerald-400 text-sm font-medium">Library Directorate</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{LIBRARY_INFO.description}</p>
        <div className="flex flex-wrap gap-3 mt-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">NBTE Grade A Accredited</span>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">Est. {INSTITUTION.established}</span>
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">7 Branch Libraries</span>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-800/30 space-y-2">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Our Mission</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{LIBRARY_INFO.mission}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-800/30 space-y-2">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Our Vision</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{LIBRARY_INFO.vision}</p>
        </div>
      </div>

      {/* Opening Hours */}
      <Section title="Opening Hours" icon={Clock}>
        <div className="space-y-2">
          {LIBRARY_INFO.openingHours.map((h, i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${i % 2 === 0 ? 'bg-slate-800/40' : ''}`}>
              <span className="text-sm font-semibold text-slate-200">{h.day}</span>
              <span className={`text-sm font-mono ${h.hours.includes('Closed') ? 'text-rose-400' : h.hours.includes('24') ? 'text-emerald-400' : 'text-indigo-300'}`}>{h.hours}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact Information */}
      <Section title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: MapPin, label: 'Address', value: LIBRARY_INFO.contactInfo.address },
            { icon: Phone, label: 'Phone', value: LIBRARY_INFO.contactInfo.phone },
            { icon: Mail, label: 'Email', value: LIBRARY_INFO.contactInfo.email },
            { icon: Globe, label: 'Website', value: LIBRARY_INFO.contactInfo.website },
            { icon: Users, label: 'Chief Librarian', value: LIBRARY_INFO.contactInfo.librarian },
            { icon: Mail, label: 'Librarian Email', value: LIBRARY_INFO.contactInfo.librarianEmail },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40">
              <Icon size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">{label}</p>
                <p className="text-sm text-slate-200">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Branch Libraries */}
      <Section title="Branch Libraries" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRANCHES.map(branch => (
            <div key={branch.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
              <p className="font-semibold text-white text-sm">{branch.name}</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><MapPin size={10} /> {branch.location}</span>
                <span className="flex items-center gap-1"><Users size={10} /> {branch.capacity} seats</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {branch.hours}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Departments / Sections */}
      <Section title="Library Departments & Sections" icon={Layers}>
        <div className="space-y-2">
          {LIBRARY_INFO.departments.map((dept, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div>
                <p className="font-semibold text-white text-sm">{dept.name}</p>
                <p className="text-xs text-slate-400">{dept.location}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500">Head</p>
                <p className="text-xs text-emerald-300 font-semibold">{dept.head}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section title="Services Offered" icon={Award}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LIBRARY_INFO.services.map((service, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/40 text-sm text-slate-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              {service}
            </div>
          ))}
        </div>
      </Section>

      {/* Library Rules */}
      <Section title="Library Rules & Regulations" icon={Shield} defaultOpen={false}>
        <div className="space-y-2">
          {LIBRARY_INFO.rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold font-mono shrink-0">{String(i + 1).padStart(2, '0')}.</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
