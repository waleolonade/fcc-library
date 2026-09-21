import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Sparkles, HelpCircle } from 'lucide-react';

export default function HelpdeskTickets({ user }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Reference & Literature Search');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([
    {
      id: "TKT-4412",
      subject: "Accessing Scopus & ScienceDirect via Campus Proxy",
      category: "E-Library & Digital Databases",
      status: "Resolved",
      librarianReply: "Institutional credentials for remote ScienceDirect access have been synced with your student email.",
      timestamp: "2026-09-17 14:22"
    }
  ]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const newTicket = {
      id: `TKT-${Math.floor(4000 + Math.random() * 5000)}`,
      subject,
      category,
      status: "Assigned to Duty Librarian",
      librarianReply: "Thank you for reaching out. A reference librarian is reviewing your research query and will respond shortly.",
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
    };

    setTickets([newTicket, ...tickets]);
    setIsSuccess(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold mb-2">
          <Sparkles size={13} className="text-emerald-400" />
          Ask a Librarian Service Desk
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Reference Inquiries & Consultation Helpdesk
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Submit research assistance requests, thesis formatting inquiries, and digital database access queries directly to the library staff.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ticket Form */}
        <div className="lg:col-span-5 bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-400" /> Open Inquiry Ticket
          </h3>

          {isSuccess && (
            <div className="p-3.5 bg-emerald-950 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Ticket logged successfully! Duty librarian notified.</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Inquiry Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option>Reference & Literature Search</option>
                <option>E-Library & Digital Databases</option>
                <option>Thesis Formatting & Repository</option>
                <option>Borrowing & Turnstile Access</option>
                <option>Acquisition Book Suggestion</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Subject Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Assistance finding empirical data on cocoa apexes"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 uppercase font-bold mb-1">Detailed Question</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your research question or library access challenge..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send to Duty Librarian
            </button>
          </form>
        </div>

        {/* Right: Existing Consultation Threads */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock size={16} className="text-emerald-400" /> My Consultation History
          </h3>

          <div className="space-y-3">
            {tickets.map(tkt => (
              <div key={tkt.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {tkt.id}
                    </span>
                    <span className="text-[10px] text-slate-400">{tkt.category}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    tkt.status === 'Resolved' ? 'bg-emerald-950 text-emerald-300' : 'bg-indigo-950 text-indigo-300'
                  }`}>
                    {tkt.status}
                  </span>
                </div>

                <div className="font-bold text-white text-sm">{tkt.subject}</div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <User size={12} /> Librarian Response:
                  </div>
                  <p>{tkt.librarianReply}</p>
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-right">{tkt.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
