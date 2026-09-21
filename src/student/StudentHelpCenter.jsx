import React, { useState } from 'react';
import {
  HelpCircle, MessageSquare, Search, ChevronDown, ChevronUp,
  Send, CheckCircle, Clock, FileText, UserCheck, Shield
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function StudentHelpCenter({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Research Assistance');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const [tickets, setTickets] = useState([
    {
      id: "TICK-801",
      subject: "Accessing ScienceDirect Proxy for Offshore Journals",
      category: "E-Resources",
      status: "In Progress",
      assignedTo: "Mr. T. Alabi (Senior Cataloguer)",
      date: "16 Sept 2026",
      response: "Proxy access token generated. Use your student email for federated login."
    },
    {
      id: "TICK-802",
      subject: "Final Year Thesis Formatting Guidelines (APA 7th)",
      category: "Research Assistance",
      status: "Resolved",
      assignedTo: "Dr. Mrs. A. Balogun (College Librarian)",
      date: "10 Sept 2026",
      response: "The updated 2026 FCC dissertation manual is available under Course Reserves."
    }
  ]);

  const faqs = [
    {
      q: "How do I borrow physical books from the campus library?",
      a: "Browse the discovery catalog to find your book and note the call number and shelf location. Present your Digital PVC Library Card or QR code at any circulation desk or self-checkout terminal to borrow up to 5 books for 14 days."
    },
    {
      q: "How do I renew my borrowed books online?",
      a: "Navigate to 'My Library & Loans' in your dashboard. Active loans can be renewed online in 1 click for an additional 14 days, provided no other scholar has placed a reserve hold on the title."
    },
    {
      q: "Are students required to make online monetary payments for library services?",
      a: "No! Under Federal Ministry and FCC Directorate regulations, students do NOT make direct payments into this software. All library services, borrowing privileges, and clearances are managed through your institutional matriculation PIN issued by the Admin."
    },
    {
      q: "How do I access digital eBooks and PDFs?",
      a: "Open the 'Digital Library' section or click 'Read E-Book' on any digital title in the catalog. You can read in full screen, take page-anchored notes, customize fonts, or toggle 'Data Saver Mode' for low-bandwidth reading."
    },
    {
      q: "How do I submit my final-year project or dissertation?",
      a: "Go to the 'Research Center' and select 'Submit Thesis'. Fill in your title, supervisor name, abstract, and upload your PDF defense copy. Your submission will flow through departmental review into the institutional repository."
    },
    {
      q: "How do I reserve a quiet research carrel or study room?",
      a: "Click 'Study Rooms' in the sidebar, select your preferred floor and room type (Individual Carrel or Collaborative Suite), choose an available 2-hour time slot, and click to book. A check-in code will be instantly generated."
    },
    {
      q: "How do I reset my 4-digit library access PIN if forgotten?",
      a: "Visit the Library Administration or Circulation Desk at the Main Campus Library. An authorized librarian can immediately generate and issue a new secure PIN for your matriculation number."
    }
  ];

  const filteredFaqs = faqs.filter(f =>
    !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    const newTicket = {
      id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
      subject: ticketSubject.trim(),
      category: ticketCategory,
      status: "Open",
      assignedTo: "Circulation Desk Duty Officer",
      date: "Today",
      response: "Ticket queued for library officer response."
    };

    setTickets([newTicket, ...tickets]);
    setTicketSubject('');
    setTicketMessage('');
    setTicketSubmitted(true);
    sounds.playSuccessChime();
    setTimeout(() => setTicketSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
            SCHOLAR HELPDESK & KNOWLEDGE BASE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Help Center & Ask a Librarian</h2>
          <p className="text-xs text-slate-400">
            Searchable institutional FAQs, library policies, and live research support ticket desk.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
          Library Hours Today: <strong className="text-emerald-400">08:00 AM – 08:00 PM</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Searchable FAQs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs (e.g. borrowing, thesis submission, study rooms)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all shadow-md"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-emerald-300 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-emerald-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Ask a Librarian Ticket Form & Active Tickets */}
        <div className="lg:col-span-5 space-y-6">
          {/* Submit New Ticket */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MessageSquare size={16} className="text-emerald-400" />
              <span>Ask a Librarian / Submit Request</span>
            </div>

            {ticketSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle size={18} />
                <span>Ticket submitted! A librarian will respond within 24 hours.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Need assistance with thesis literature search"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option>Research Assistance</option>
                    <option>E-Resources & Database Proxy</option>
                    <option>Report Missing / Damaged Book</option>
                    <option>Circulation / Loan Question</option>
                    <option>Thesis Repository Ingestion</option>
                    <option>PIN & Account Support</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Detailed Message</label>
                  <textarea
                    placeholder="Describe your research question or library assistance requirement..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition"
                >
                  <Send size={13} /> Submit Support Ticket
                </button>
              </form>
            )}
          </div>

          {/* Active Support Tickets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Your Support Tickets ({tickets.length})
            </h4>

            <div className="space-y-2">
              {tickets.map(t => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs shadow-md">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono font-bold text-slate-400">{t.id} • {t.category}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      t.status === 'Resolved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="font-bold text-white leading-snug">{t.subject}</div>
                  <p className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-emerald-400">Response:</strong> {t.response}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
