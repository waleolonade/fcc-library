import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Award, Sparkles, Copy, Check, Share2, Link2 } from 'lucide-react';
import {
  INITIAL_BOOKS,
  INITIAL_LOANS,
  INITIAL_PARTNER_LIBRARIES,
  INSTITUTION
} from './data/institutionalSeedData';

import WorldClassLogin from './auth/WorldClassLogin';
import AdminLogin from './auth/AdminLogin';
import HodLogin from './auth/HodLogin';
import PublicDiscovery from './public_opac/PublicDiscovery';
import StudentPortal from './student/StudentPortal';
import HodDashboard from './hod/HodDashboard';
import FccAdminLibrary from './fcc_admin_library/FccAdminLibrary';
import BookDetailsModal from './common/BookDetailsModal';
import BookDossierView from './common/BookDossierView';
import DigitalBookReader from './student/DigitalBookReader';
import RouteTracerHUD from './common/RouteTracerHUD';
import SelfServiceKiosk from './common/SelfServiceKiosk';
import HardwareBarcodeListener from './common/HardwareBarcodeListener';
import { sounds } from './utils/soundEffects';
import { parseCurrentRoute, navigateTo, copyToClipboardWithFeedback } from './utils/router';
import { PATTERNS } from './utils/backgroundPatterns';

export default function App() {
  // Navigation & Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash;
      if (h.includes('/admin') && !h.includes('/admin/login')) {
        return {
          role: 'admin',
          matric: 'FCC/STAFF/001',
          name: 'Dr. Mrs. A. Balogun',
          dept: 'Chief College Librarian',
          email: 'balogun@fccibadan.edu.ng'
        };
      }
      if (h.includes('/hod') && !h.includes('/hod/login')) {
        return {
          role: 'hod',
          name: 'Dr. Mrs. F. A. Babalola',
          department_code: 'CEM',
          department_name: 'Co-operative Economics & Management',
          department_id: 'DEP-CEM',
          matric: 'HOD/CEM/001'
        };
      }
      if (h.includes('/scholar')) {
        return {
          role: 'student',
          matric: 'FCC/CEM/2024/042',
          name: 'Wale Olonade',
          dept: 'Co-operative Economics & Management'
        };
      }
    }
    return null;
  });
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash;
      if (h.includes('/kiosk')) return 'kiosk';
      if (h.includes('/book')) return 'book_dossier';
      if (h.includes('/admin/login')) return 'admin_login';
      if (h.includes('/admin')) return 'admin';
      if (h.includes('/hod/login')) return 'hod_login';
      if (h.includes('/hod')) return 'hod';
      if (h.includes('/scholar')) return 'student';
      if (h.includes('/opac')) return 'public_opac';
    }
    return 'public_opac';
  });
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

  // Real-time catalog update listener across roles (Admin, HOD, Scholar)
  useEffect(() => {
    const handleCatalogUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBooks(e.detail);
      } else if (e.detail && e.detail.id) {
        setBooks(prev => [e.detail, ...prev.filter(b => b.id !== e.detail.id)]);
      }
    };
    window.addEventListener('fcc-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('fcc-catalog-updated', handleCatalogUpdate);
  }, []);

  // Initial Sync from Laravel Backend Catalog
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.ok ? res.json() : null)
      .then(backendBooks => {
        if (Array.isArray(backendBooks) && backendBooks.length > 0) {
          setBooks(prev => {
            const map = new Map();
            prev.forEach(b => { if (b && b.id) map.set(b.id.toUpperCase(), b); });
            backendBooks.forEach(b => {
              if (b && b.id) {
                const normalized = {
                  ...b,
                  callNumber: b.call_number || b.callNumber,
                  shelfLocation: b.shelf_location || b.shelfLocation,
                  courseCode: b.course_code || b.courseCode,
                  targetLevel: b.target_level || b.targetLevel,
                  copiesTotal: b.copies_total !== undefined ? b.copies_total : b.copiesTotal,
                  copiesAvailable: b.copies_available !== undefined ? b.copies_available : b.copiesAvailable,
                  pdfPages: b.pdf_pages || b.pdfPages,
                  fileSize: b.file_size || b.fileSize,
                  fileName: b.file_name || b.fileName,
                  isDigital: b.is_digital !== undefined ? b.is_digital : b.isDigital
                };
                map.set(normalized.id.toUpperCase(), { ...map.get(normalized.id.toUpperCase()), ...normalized });
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(err => console.warn('Could not sync with backend catalog:', err));
  }, []);

  // Reactive Cross-Portal Master Catalog Synchronizer
  useEffect(() => {
    const handleCatalogUpdated = (e) => {
      if (e.detail) {
        if (Array.isArray(e.detail)) {
          setBooks(e.detail);
        } else if (e.detail.id) {
          setBooks(prev => {
            const updated = [e.detail, ...prev.filter(b => b.id !== e.detail.id)];
            return updated;
          });
        }
      }
    };
    window.addEventListener('fcc-catalog-updated', handleCatalogUpdated);
    return () => window.removeEventListener('fcc-catalog-updated', handleCatalogUpdated);
  }, []);

  // Master Hash Route Listener & Direct URL Deep-Linking
  useEffect(() => {
    const handleHashChange = () => {
      const { path, params } = parseCurrentRoute();
      setCurrentHash(window.location.hash);

      // Book Deep-Link & Dossier View (e.g. #/book/ or #/book/FCC-PDF-3779 or #/book/FCC-B001)
      if (path === '/book' || path.startsWith('/book')) {
        setActiveBookForReader(null);
        setViewMode('book_dossier');
        const rawId = path.replace('/book/', '').replace('/book', '').trim();
        if (rawId) {
          const found = books.find(b =>
            (b.id && b.id.toLowerCase() === rawId.toLowerCase()) ||
            (b.isbn && b.isbn.replace(/[^0-9X]/gi, '') === rawId.replace(/[^0-9X]/gi, ''))
          );
          if (found) {
            setSelectedBookForDetails(found);
          } else {
            // Check local storage databases immediately
            let localFound = null;
            try {
              const dbs = ['fcc_db_catalog', 'fcc_catalog_v48_gov', 'fcc_catalog_overrides'];
              for (const k of dbs) {
                const arr = JSON.parse(localStorage.getItem(k) || '[]');
                localFound = arr.find(b => b && b.id && b.id.toLowerCase() === rawId.toLowerCase());
                if (localFound) break;
              }
            } catch (e) {}

            if (localFound) {
              setSelectedBookForDetails(localFound);
              setBooks(prev => prev.some(b => b.id.toLowerCase() === localFound.id.toLowerCase()) ? prev : [localFound, ...prev]);
            } else {
              // Asynchronously fetch directly from Laravel API
              fetch(`/api/catalog/${encodeURIComponent(rawId)}`)
                .then(r => r.ok ? r.json() : null)
                .then(remoteBook => {
                  if (remoteBook && remoteBook.id) {
                    setSelectedBookForDetails(remoteBook);
                    setBooks(prev => prev.some(b => b.id.toLowerCase() === remoteBook.id.toLowerCase()) ? prev : [remoteBook, ...prev]);
                  }
                })
                .catch(() => {});
            }
          }
        } else if (books.length > 0) {
          setSelectedBookForDetails(books[0]);
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
      } else if (!path.startsWith('/book')) {
        // Ensure reader is closed when navigating away
        setActiveBookForReader(null);
      }

      // Route switching for authenticated / admin / hod / scholar / opac view
      if (path === '/kiosk' || path.startsWith('/kiosk')) {
        setViewMode('kiosk');
      } else if (path === '/admin/login' || path.startsWith('/admin/login')) {
        if (currentUser && currentUser.role === 'admin') {
          navigateTo('/admin/overview');
        } else {
          setViewMode('admin_login');
        }
      } else if (path === '/hod/login' || path.startsWith('/hod/login')) {
        if (currentUser && currentUser.role === 'hod') {
          navigateTo('/hod/overview');
        } else {
          setViewMode('hod_login');
        }
      } else if (path.startsWith('/admin')) {
        setViewMode('admin');
        if (!currentUser || currentUser.role !== 'admin') {
          setCurrentUser({
            role: 'admin',
            matric: 'FCC/STAFF/001',
            name: 'Dr. Mrs. A. Balogun',
            dept: 'Chief College Librarian',
            email: 'balogun@fccibadan.edu.ng'
          });
        }
      } else if (path.startsWith('/hod')) {
        setViewMode('hod');
        if (!currentUser || currentUser.role !== 'hod') {
          setCurrentUser({
            role: 'hod',
            name: 'Dr. Mrs. F. A. Babalola',
            department_code: 'CEM',
            department_name: 'Co-operative Economics & Management',
            department_id: 'DEP-CEM',
            matric: 'HOD/CEM/001'
          });
        }
      } else if (path.startsWith('/scholar')) {
        setViewMode('student');
        if (!currentUser || currentUser.role !== 'student') {
          setCurrentUser({
            role: 'student',
            matric: 'FCC/CEM/2024/042',
            name: 'Wale Olonade',
            dept: 'Co-operative Economics & Management'
          });
        }
      } else if (path === '/communication' || path.startsWith('/communication')) {
        if (!currentUser) {
          setCurrentUser({
            role: 'student',
            matric: 'FCC/CEM/2024/042',
            name: 'Wale Olonade',
            dept: 'Co-operative Economics & Management'
          });
        }
        navigateTo('/scholar/communication');
      } else if (!currentUser) {
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
  const handleLogout = (roleOverride) => {
    const role = roleOverride || currentUser?.role;
    setCurrentUser(null);
    setSelectedBookForDetails(null);
    setActiveBookForReader(null);
    if (role === 'admin') {
      setViewMode('admin_login');
      navigateTo('/admin/login');
    } else if (role === 'hod') {
      setViewMode('hod_login');
      navigateTo('/hod/login');
    } else {
      setViewMode('login');
      navigateTo('/login');
    }
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
    <div
      className="min-h-screen bg-[#021810] text-emerald-50 font-sans selection:bg-emerald-500 selection:text-white flex flex-col pb-16"
      style={{ backgroundImage: PATTERNS.app }}
    >
      {/* Top Banner Notice with Traceable URL Address Bar */}
      <div className="bg-gradient-to-r from-[#032317] via-[#042e1f] to-[#021810] border-b border-emerald-800/40 text-xs py-1.5 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          <img
            src="/assets/fcc-logo.png"
            alt="FCC Logo"
            className="w-5 h-5 object-cover rounded-full shadow-sm ring-1 ring-emerald-400/50 shrink-0"
          />
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-emerald-400 font-semibold">{INSTITUTION.shortName} INTRANET NODE</span>
          <span className="hidden lg:inline text-[10px] px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-mono">
            NBTE GRADE A ACCREDITED
          </span>
        </div>

        {/* Global Page URL Address Trace Bar */}
        <div className="hidden sm:flex items-center gap-2 bg-[#01140d]/90 px-2.5 py-1 rounded-xl border border-emerald-900/60 font-mono text-[10px] text-emerald-200 max-w-sm lg:max-w-md truncate">
          <Link2 size={12} className="text-emerald-400 shrink-0" />
          <span className="truncate text-emerald-300/80">{currentHash}</span>
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
        {viewMode === 'kiosk' ? (
          <SelfServiceKiosk
            books={books}
            loans={loans}
            setLoans={setLoans}
            setBooks={setBooks}
            currentUser={currentUser}
            onClose={() => {
              setViewMode(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'student') : 'public_opac');
              navigateTo(currentUser ? (currentUser.role === 'admin' ? '/admin/overview' : '/scholar/catalog') : '/opac');
            }}
          />
        ) : viewMode === 'book_dossier' ? (
          <BookDossierView
            book={selectedBookForDetails}
            books={books}
            currentUser={currentUser}
            onOpenReader={(b) => {
              setActiveBookForReader(b);
              navigateTo(`/reader/${b.id}`);
            }}
            onBackToCatalog={() => {
              setViewMode(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'student') : 'public_opac');
              navigateTo(currentUser ? (currentUser.role === 'admin' ? '/admin/circulation' : '/scholar/catalog') : '/opac');
            }}
          />
        ) : !currentUser ? (
          viewMode === 'admin_login' ? (
            <AdminLogin
              onLogin={(user) => {
                sounds.playSuccessChime();
                setCurrentUser(user);
                navigateTo('/admin/overview');
              }}
            />
          ) : viewMode === 'hod_login' ? (
            <HodLogin
              onLogin={(user) => {
                sounds.playSuccessChime();
                setCurrentUser(user);
                navigateTo('/hod/overview');
              }}
              onBackToPublic={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          ) : viewMode === 'public_opac' ? (
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
                navigateTo('/scholar/catalog');
              }}
              onOpenPublicOpac={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          )
        ) : currentUser.role === 'admin' ? (
          <FccAdminLibrary
            user={currentUser}
            onLogout={() => handleLogout('admin')}
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
            onSwitchToUserPortal={() => {
              setCurrentUser({
                role: 'student',
                matric: 'FCC/CEM/2024/042',
                name: 'Wale Olonade',
                dept: 'Co-operative Economics & Management'
              });
              navigateTo('/scholar/catalog');
            }}
            onSwitchToHodPortal={(dept) => {
              setCurrentUser({
                role: 'hod',
                name: dept?.hod || 'Department Head',
                department_code: dept?.code || 'CEM',
                department_name: dept?.name || 'Academic Department',
                department_id: dept?.id || `DEP-${dept?.code || 'CEM'}`,
                matric: `HOD/${dept?.code || 'CEM'}/001`
              });
              navigateTo('/hod/overview');
            }}
          />
        ) : currentUser.role === 'hod' ? (
          <HodDashboard
            user={currentUser}
            onLogout={() => handleLogout('hod')}
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
            onOpenReader={(b) => {
              setActiveBookForReader(b);
              navigateTo('/scholar/reader', { bookId: b.id });
            }}
          />
        )}
      </div>

      {/* Global Book Details & Citation Modal (Shown only when opened as an overlay, not on full-page dossier) */}
      {selectedBookForDetails && viewMode !== 'book_dossier' && (
        <BookDetailsModal
          book={selectedBookForDetails}
          onClose={() => {
            setSelectedBookForDetails(null);
            const { path } = parseCurrentRoute();
            if (path.startsWith('/book')) {
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

      {/* Global Physical Hardware Wedge Scanner Listener & Copy Identifier (Prompt 31) */}
      <HardwareBarcodeListener />

      {/* Global Interactive Route & Link Tracer Inspector HUD */}
      <RouteTracerHUD
        books={books}
        currentUser={currentUser}
      />
    </div>
  );
}
