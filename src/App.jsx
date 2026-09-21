import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Award, Sparkles, Copy, Check, Share2, Link2 } from 'lucide-react';
import {
  INITIAL_BOOKS,
  INITIAL_LOANS,
  INITIAL_PARTNER_LIBRARIES,
  INSTITUTION
} from './data/institutionalSeedData';

import WorldClassLogin from './auth/WorldClassLogin';
import PublicDiscovery from './public_opac/PublicDiscovery';
import StudentPortal from './student/StudentPortal';
import AdminPortal from './admin/AdminPortal';
import BookDetailsModal from './common/BookDetailsModal';
import DigitalBookReader from './student/DigitalBookReader';
import RouteTracerHUD from './common/RouteTracerHUD';
import { sounds } from './utils/soundEffects';
import { parseCurrentRoute, navigateTo, copyToClipboardWithFeedback } from './utils/router';

export default function App() {
  // Navigation & Authentication State
  const [currentUser, setCurrentUser] = useState(null); // null | { role: 'student'|'admin', matric, name, dept }
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'public_opac'
  const [isMuted, setIsMuted] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/opac');
  const [copiedUrlFeedback, setCopiedUrlFeedback] = useState(false);

  // Global State with LocalStorage
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('fcc_catalog_v48_gov');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [partnerLibraries, setPartnerLibraries] = useState(() => {
    const saved = localStorage.getItem('fcc_partner_libs_v48');
    return saved ? JSON.parse(saved) : INITIAL_PARTNER_LIBRARIES;
  });

  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('fcc_loans_v48_gov');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [activeBookForReader, setActiveBookForReader] = useState(null);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('fcc_partner_libs_v48', JSON.stringify(partnerLibraries));
  }, [partnerLibraries]);

  useEffect(() => {
    localStorage.setItem('fcc_loans_v48_gov', JSON.stringify(loans));
  }, [loans]);

  // Master Hash Route Listener & Direct URL Deep-Linking
  useEffect(() => {
    const handleHashChange = () => {
      const { path, params } = parseCurrentRoute();
      setCurrentHash(window.location.hash);

      // Book Deep-Link (e.g. #/book/FCC-B001)
      if (path.startsWith('/book/')) {
        const bookId = path.split('/book/')[1];
        const found = books.find(b => b.id.toLowerCase() === bookId.toLowerCase());
        if (found) {
          setSelectedBookForDetails(found);
        }
      }

      // Reader Deep-Link (e.g. #/reader/FCC-B001 or #/scholar/reader?bookId=FCC-B001)
      if (path.includes('/reader') || params.bookId) {
        const bookId = params.bookId || path.split('/reader/')[1];
        if (bookId) {
          const found = books.find(b => b.id.toLowerCase() === bookId.toLowerCase());
          if (found) {
            setActiveBookForReader(found);
          }
        }
      }

      // Route switching for unauthenticated view
      if (!currentUser) {
        if (path.startsWith('/opac')) {
          setViewMode('public_opac');
        } else if (path.startsWith('/login')) {
          setViewMode('login');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial Route Check
    if (!window.location.hash) {
      navigateTo('/opac');
    } else {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [books, currentUser]);

  // Sync sound muted state
  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.muted = nextMuted;
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode('login');
    setSelectedBookForDetails(null);
    setActiveBookForReader(null);
    navigateTo('/login');
  };

  // Copy Full Browser Traceable URL
  const handleCopyPageUrl = () => {
    copyToClipboardWithFeedback(window.location.href, (success) => {
      if (success) {
        setCopiedUrlFeedback(true);
        setTimeout(() => setCopiedUrlFeedback(false), 2000);
      }
    });
  };

  // Loan Renewal
  const handleRenewLoan = (loanId) => {
    setLoans(loans.map(l => {
      if (l.id === loanId) {
        const currDue = new Date(l.dueDate);
        const newDue = new Date(currDue.getTime() + 14 * 86400000).toISOString().split('T')[0];
        return {
          ...l,
          dueDate: newDue,
          renewalsCount: (l.renewalsCount || 0) + 1,
          status: 'Active'
        };
      }
      return l;
    }));
    sounds.playSuccessChime();
    alert(`Loan ${loanId} renewed for an additional 14 days!`);
  };

  // Fine Payment
  const handlePayFine = (loanId) => {
    setLoans(loans.map(l => {
      if (l.id === loanId) {
        return {
          ...l,
          fine: 0,
          status: 'Active'
        };
      }
      return l;
    }));
    sounds.playSuccessChime();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col pb-16">
      {/* Top Banner Notice with Traceable URL Address Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-emerald-800/40 text-xs py-1.5 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-emerald-400 font-semibold">{INSTITUTION.shortName} INTRANET NODE</span>
          <span className="hidden lg:inline text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-mono">
            NBTE GRADE A ACCREDITED
          </span>
        </div>

        {/* Global Page URL Address Trace Bar */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 max-w-sm lg:max-w-md truncate">
          <Link2 size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate text-slate-400">{currentHash}</span>
          <button
            id="btn-copy-trace-url"
            onClick={handleCopyPageUrl}
            className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0 ml-1"
            title="Copy Traceable Link Address"
          >
            {copiedUrlFeedback ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          {/* Audio toggle button */}
          <button
            id="btn-toggle-audio"
            onClick={toggleAudio}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isMuted ? "Unmute Hardware Audio" : "Mute Hardware Audio"}
          >
            {isMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Audio On"}</span>
          </button>

          <span className="hidden md:inline font-mono">MARC21 Rev.42</span>
          {currentUser && (
            <button
              id="btn-global-sign-out"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white underline font-semibold"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {!currentUser ? (
          viewMode === 'public_opac' ? (
            <PublicDiscovery
              books={books}
              partnerLibraries={partnerLibraries}
              onSelectBook={(book) => {
                setSelectedBookForDetails(book);
                navigateTo(`/book/${book.id}`);
              }}
              onOpenLogin={() => {
                setViewMode('login');
                navigateTo('/login');
              }}
            />
          ) : (
            <WorldClassLogin
              onLogin={(user) => {
                sounds.playSuccessChime();
                setCurrentUser(user);
                navigateTo(user.role === 'admin' ? '/admin/circulation' : '/scholar/catalog');
              }}
              onOpenPublicOpac={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          )
        ) : currentUser.role === 'admin' ? (
          <AdminPortal
            user={currentUser}
            onLogout={handleLogout}
            books={books}
            setBooks={setBooks}
            partnerLibraries={partnerLibraries}
            setPartnerLibraries={setPartnerLibraries}
            loans={loans}
            setLoans={setLoans}
            onOpenReader={(b) => {
              setActiveBookForReader(b);
              navigateTo(`/reader/${b.id}`);
            }}
          />
        ) : (
          <StudentPortal
            user={currentUser}
            onLogout={handleLogout}
            books={books}
            partnerLibraries={partnerLibraries}
            loans={loans}
            onRenewLoan={handleRenewLoan}
            onPayFine={handlePayFine}
          />
        )}
      </div>

      {/* Global Book Details & Citation Modal */}
      {selectedBookForDetails && (
        <BookDetailsModal
          book={selectedBookForDetails}
          onClose={() => {
            setSelectedBookForDetails(null);
            const { path } = parseCurrentRoute();
            if (path.startsWith('/book/')) {
              navigateTo(currentUser ? (currentUser.role === 'admin' ? '/admin/circulation' : '/scholar/catalog') : '/opac');
            }
          }}
          onOpenReader={(b) => {
            setSelectedBookForDetails(null);
            setActiveBookForReader(b);
            navigateTo(`/scholar/reader`, { bookId: b.id });
          }}
          onReserve={(b) => alert(`Reserved copy of "${b.title}". Notification queued.`)}
        />
      )}

      {/* Global E-Book Reader Modal */}
      {activeBookForReader && (
        <div className="fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 overflow-y-auto">
          <DigitalBookReader
            book={activeBookForReader}
            onClose={() => {
              setActiveBookForReader(null);
              navigateTo(currentUser ? (currentUser.role === 'admin' ? '/admin/circulation' : '/scholar/catalog') : '/opac');
            }}
          />
        </div>
      )}

      {/* Global Interactive Route & Link Tracer Inspector HUD */}
      <RouteTracerHUD
        books={books}
        currentUser={currentUser}
      />
    </div>
  );
}
