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
  // Navigation & Authentication State (Strictly Session-Based, No Arbitrary Auto-Logins)
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash;
      if (h.includes('/admin') && !h.includes('/admin/login')) {
        const saved = localStorage.getItem('fcc_admin_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.role === 'admin') return parsed;
          } catch (e) {}
        }
        return null;
      }
      if (h.includes('/hod') && !h.includes('/hod/login')) {
        const saved = localStorage.getItem('fcc_hod_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.role === 'hod') return parsed;
          } catch (e) {}
        }
        return null;
      }
      if (h.includes('/scholar')) {
        const saved = localStorage.getItem('fcc_student_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.role === 'student' || parsed.matric)) return parsed;
          } catch (e) {}
        }
        return null;
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
      if (h.includes('/admin')) {
        const saved = localStorage.getItem('fcc_admin_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.role === 'admin') return 'admin';
          } catch (e) {}
        }
        return 'admin_login';
      }
      if (h.includes('/hod/login')) return 'hod_login';
      if (h.includes('/hod')) {
        const saved = localStorage.getItem('fcc_hod_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.role === 'hod') return 'hod';
          } catch (e) {}
        }
        return 'hod_login';
      }
      if (h.includes('/scholar')) {
        const saved = localStorage.getItem('fcc_student_session');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.role === 'student' || parsed.matric)) return 'student';
          } catch (e) {}
        }
        return 'login';
      }
      if (h.includes('/login')) return 'login';
      if (h.includes('/opac')) return 'public_opac';
    }
    return 'public_opac';
  });
  const [isMuted, setIsMuted] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/opac');
  const [copiedUrlFeedback, setCopiedUrlFeedback] = useState(false);

  const isDemoOrExcluded = (item) => {
    if (!item) return false;
    const id = String(item.id || '');
    const demoIds = [
      'HOD-UP-001', 'HOD-UP-002', 'HOD-UP-003', 'HOD-UP-004',
      'FCC-HOD-CSC-001', 'FCC-HOD-CSC-PRJ', 'FCC-HOD-CSC-JRN',
      'FCC-HOD-CEM-001', 'FCC-HOD-CEM-PRJ',
      'FCC-HOD-BNF-001', 'FCC-HOD-BNF-PRJ',
      'FCC-HOD-AGR-001'
    ];
    if (demoIds.includes(id)) return true;

    const callNum = String(item.callNumber || item.call_number || item.assigned_call_number || '');
    if (['QA76.9 .O46 2024', 'TH-CSC-2024-001', 'JRN-CSC-VOL14', 'HD2951 .B12 2024', 'TH-CEM-2024-002', 'HG1811 .S22 2024', 'TH-BNF-2024-003', 'S544 .O33 2024'].includes(callNum)) {
      return true;
    }

    const title = (item.title || '').toLowerCase();
    if (
      title.includes('distributed multi-cloud systems') ||
      title.includes('autonomous multi-agent citation resolution') ||
      title.includes('west african journal of applied computer science') ||
      title.includes('quantitative cooperative econometrics & capital formation') ||
      title.includes('empirical assessment of micro-credit lending') ||
      title.includes('central banking monetary policy & fintech') ||
      title.includes('evaluation of mobile pos terminals & financial deepening') ||
      title.includes('modern agricultural extension methodologies & farm harvest') ||
      title.includes('cooperative econometrics past examination') ||
      title.includes('soil nitrogen dynamics & cocoa harvest') ||
      title.includes('modern micro-credit lending & syndicate') ||
      title.includes('vector indexing lab handout')
    ) {
      return true;
    }

    return false;
  };

  // Global State with LocalStorage (hydrated dynamically from database)
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('fcc_catalog_v48_gov');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(b => !isDemoOrExcluded(b) && !(b.status && b.status !== 'approved')) : [];
    } catch {
      return [];
    }
  });

  const [partnerLibraries, setPartnerLibraries] = useState(() => {
    const saved = localStorage.getItem('fcc_partner_libs_v48');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('fcc_loans_v48_gov');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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
        setBooks(e.detail.filter(b => !isDemoOrExcluded(b) && !(b.status && b.status !== 'approved')));
      } else if (e.detail && e.detail.id) {
        if (!isDemoOrExcluded(e.detail) && !(e.detail.status && e.detail.status !== 'approved')) {
          setBooks(prev => [e.detail, ...prev.filter(b => b.id !== e.detail.id)]);
        }
      }
    };
    window.addEventListener('fcc-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('fcc-catalog-updated', handleCatalogUpdate);
  }, []);

  // Initial Sync from Laravel Backend Database
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.ok ? res.json() : null)
      .then(backendBooks => {
        if (Array.isArray(backendBooks)) {
          const normalized = backendBooks
            .filter(b => !isDemoOrExcluded(b) && !(b.status && b.status !== 'approved'))
            .map(b => ({
              ...b,
              callNumber: b.call_number || b.callNumber,
              shelfLocation: b.shelf_location || b.shelfLocation,
              courseCode: b.course_code || b.courseCode,
              targetLevel: b.target_level || b.targetLevel,
              copiesTotal: b.copies_total !== undefined ? b.copies_total : (b.copiesTotal || 1),
              copiesAvailable: b.copies_available !== undefined ? b.copies_available : (b.copiesAvailable || 1),
              pdfPages: b.pdf_pages || b.pdfPages,
              fileSize: b.file_size || b.fileSize,
              fileName: b.file_name || b.fileName,
              fileDataUrl: b.file_data_url || b.fileDataUrl || '',
              externalUrl: b.external_url || b.externalUrl || '',
              abstract: b.abstract || '',
              isDigital: b.is_digital !== undefined ? Boolean(b.is_digital) : (b.isDigital !== undefined ? Boolean(b.isDigital) : true),
              chapters: (() => { const v = typeof b.chapters === 'string' ? (() => { try { return JSON.parse(b.chapters); } catch { return []; } })() : b.chapters; return Array.isArray(v) ? v : []; })(),
              reviews: (() => { const v = typeof b.reviews === 'string' ? (() => { try { return JSON.parse(b.reviews); } catch { return []; } })() : b.reviews; return Array.isArray(v) ? v : []; })()
            }));
          setBooks(normalized);
          localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(normalized));
        }
      })
      .catch(err => console.warn('Could not sync with backend catalog:', err));

    fetch('/api/loans')
      .then(res => res.ok ? res.json() : null)
      .then(backendLoans => {
        if (Array.isArray(backendLoans)) {
          setLoans(backendLoans);
          localStorage.setItem('fcc_loans_v48_gov', JSON.stringify(backendLoans));
        }
      })
      .catch(() => {});

    fetch('/api/partner-libraries')
      .then(res => res.ok ? res.json() : null)
      .then(backendLibs => {
        if (Array.isArray(backendLibs)) {
          setPartnerLibraries(backendLibs);
          localStorage.setItem('fcc_partner_libs_v48', JSON.stringify(backendLibs));
        }
      })
      .catch(() => {});
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

      // Reader Deep-Link (e.g. #/reader/ or #/reader/FCC-HOD-8201 or #/scholar/reader?bookId=... or #/read/...)
      const isReaderRoute = path === '/reader' || path.startsWith('/reader/') || path.startsWith('/reader') || path.startsWith('/read/') || path.includes('/scholar/reader') || Boolean(params.bookId);

      if (isReaderRoute) {
        let rawReaderId = params.bookId || '';
        if (!rawReaderId) {
          if (path.startsWith('/reader/')) {
            rawReaderId = path.slice('/reader/'.length);
          } else if (path.startsWith('/read/')) {
            rawReaderId = path.slice('/read/'.length);
          } else if (path.includes('/reader/')) {
            rawReaderId = path.split('/reader/')[1] || '';
          }
        }
        rawReaderId = (rawReaderId || '').replace(/\/+$/, '').trim();

        if (rawReaderId) {
          const found = books.find(b => b.id && b.id.toLowerCase() === rawReaderId.toLowerCase());
          if (found) {
            setActiveBookForReader(found);
            // If missing file data, fetch complete book from API
            if (!found.fileDataUrl && !found.file_data_url) {
              fetch(`/api/catalog/${encodeURIComponent(rawReaderId)}`)
                .then(r => r.ok ? r.json() : null)
                .then(full => {
                  if (full && full.id) {
                    setActiveBookForReader(full);
                    setBooks(prev => prev.map(b => b.id.toLowerCase() === full.id.toLowerCase() ? { ...b, ...full } : b));
                  }
                })
                .catch(() => {});
            }
          } else {
            // Asynchronously fetch directly from Laravel API
            fetch(`/api/catalog/${encodeURIComponent(rawReaderId)}`)
              .then(r => r.ok ? r.json() : null)
              .then(remoteBook => {
                if (remoteBook && remoteBook.id) {
                  setActiveBookForReader(remoteBook);
                  setBooks(prev => prev.some(b => b.id.toLowerCase() === remoteBook.id.toLowerCase()) ? prev.map(b => b.id.toLowerCase() === remoteBook.id.toLowerCase() ? remoteBook : b) : [remoteBook, ...prev]);
                } else {
                  // Fallback: Check theses endpoint
                  fetch(`/api/theses/${encodeURIComponent(rawReaderId)}`)
                    .then(tr => tr.ok ? tr.json() : null)
                    .then(thesis => {
                      if (thesis && thesis.id) {
                        setActiveBookForReader({
                          ...thesis,
                          isDigital: true,
                          pdfUrl: `/api/theses/${thesis.id}/file`,
                          callNumber: `TH-${thesis.department_code || 'RES'}-${thesis.id}`
                        });
                      }
                    })
                    .catch(() => {});
                }
              })
              .catch(() => {});
          }
        } else {
          // NO specific book ID given (URL is exactly #/reader/ or #/reader)
          // Fetch real uploaded books from backend to display the real HOD/Admin book
          const pickBestUploadedBook = (list) => {
            if (!Array.isArray(list) || list.length === 0) return null;
            // 1st: Book with PDF file uploaded by HOD or Admin (e.g. COMPUTER NETWORKS NOTES)
            const withPdf = list.find(b => (b.file_data_url || b.fileDataUrl || b.file_name?.toLowerCase().endsWith('.pdf')) && (b.id?.startsWith('FCC-HOD') || b.id?.startsWith('FCC-PDF') || b.uploaded_by?.toLowerCase().includes('hod') || b.uploaded_by?.toLowerCase().includes('librarian')));
            if (withPdf) return withPdf;

            // 2nd: Any book with a PDF
            const anyWithPdf = list.find(b => b.file_data_url || b.fileDataUrl || b.file_name?.toLowerCase().endsWith('.pdf'));
            if (anyWithPdf) return anyWithPdf;

            // 3rd: Any HOD upload
            const anyHod = list.find(b => b.id?.startsWith('FCC-HOD') || b.uploaded_by?.toLowerCase().includes('hod'));
            if (anyHod) return anyHod;

            return list[0];
          };

          // Try from already loaded books first for instant render
          const initialPick = pickBestUploadedBook(books);
          if (initialPick) {
            setActiveBookForReader(initialPick);
          }

          // Always fetch live from backend API to ensure freshly uploaded HOD/Admin books are loaded
          fetch('/api/catalog')
            .then(res => res.ok ? res.json() : null)
            .then(catalogList => {
              if (Array.isArray(catalogList) && catalogList.length > 0) {
                const best = pickBestUploadedBook(catalogList);
                if (best) {
                  fetch(`/api/catalog/${encodeURIComponent(best.id)}`)
                    .then(cr => cr.ok ? cr.json() : best)
                    .then(full => setActiveBookForReader(full || best))
                    .catch(() => setActiveBookForReader(best));
                }
              }
            })
            .catch(() => {});
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
        setViewMode('hod_login');
      } else if (path.startsWith('/admin')) {
        let authenticatedAdmin = currentUser && currentUser.role === 'admin' ? currentUser : null;
        if (!authenticatedAdmin) {
          const savedAdmin = localStorage.getItem('fcc_admin_session');
          if (savedAdmin) {
            try {
              const parsed = JSON.parse(savedAdmin);
              if (parsed && parsed.role === 'admin') {
                authenticatedAdmin = parsed;
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        }

        if (authenticatedAdmin) {
          setViewMode('admin');
        } else {
          setViewMode('admin_login');
          navigateTo('/admin/login');
        }
      } else if (path.startsWith('/hod')) {
        // Direct navigation to /hod or /hod/overview requires an authenticated HOD
        let authenticatedHod = currentUser && currentUser.role === 'hod' ? currentUser : null;
        if (!authenticatedHod) {
          const savedHod = localStorage.getItem('fcc_hod_session');
          if (savedHod) {
            try {
              const parsed = JSON.parse(savedHod);
              if (parsed && parsed.role === 'hod') {
                authenticatedHod = parsed;
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        }

        if (authenticatedHod) {
          setViewMode('hod');
        } else {
          setViewMode('hod_login');
          navigateTo('/hod/login');
        }
      } else if (path.startsWith('/scholar')) {
        let authenticatedStudent = currentUser && currentUser.role === 'student' ? currentUser : null;
        if (!authenticatedStudent) {
          const savedStudent = localStorage.getItem('fcc_student_session');
          if (savedStudent) {
            try {
              const parsed = JSON.parse(savedStudent);
              if (parsed && (parsed.role === 'student' || parsed.matric)) {
                authenticatedStudent = parsed;
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        }

        if (authenticatedStudent) {
          setViewMode('student');
        } else {
          setViewMode('login');
          navigateTo('/login');
        }
      } else if (path === '/communication' || path.startsWith('/communication')) {
        let authenticatedStudent = currentUser && currentUser.role === 'student' ? currentUser : null;
        if (!authenticatedStudent) {
          const savedStudent = localStorage.getItem('fcc_student_session');
          if (savedStudent) {
            try {
              const parsed = JSON.parse(savedStudent);
              if (parsed && (parsed.role === 'student' || parsed.matric)) {
                authenticatedStudent = parsed;
                setCurrentUser(parsed);
              }
            } catch (e) {}
          }
        }

        if (authenticatedStudent) {
          navigateTo('/scholar/communication');
        } else {
          setViewMode('login');
          navigateTo('/login');
        }
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

  // Handle Logout (Clears all active sessions)
  const handleLogout = (roleOverride) => {
    const role = roleOverride || currentUser?.role;
    setCurrentUser(null);
    setSelectedBookForDetails(null);
    setActiveBookForReader(null);
    try {
      localStorage.removeItem('fcc_student_session');
      localStorage.removeItem('fcc_admin_session');
      localStorage.removeItem('fcc_hod_session');
    } catch (e) {}

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
        ) : viewMode === 'admin_login' ? (
          <AdminLogin
            onLogin={(user) => {
              sounds.playSuccessChime();
              setCurrentUser(user);
              setViewMode('admin');
              navigateTo('/admin/overview');
            }}
          />
        ) : viewMode === 'hod_login' ? (
          <HodLogin
            onLogin={(user) => {
              sounds.playSuccessChime();
              setCurrentUser(user);
              try {
                localStorage.setItem('fcc_hod_session', JSON.stringify(user));
              } catch (e) {}
              setViewMode('hod');
              navigateTo('/hod/overview');
            }}
            onBackToPublic={() => {
              setViewMode('public_opac');
              navigateTo('/opac');
            }}
          />
        ) : !currentUser ? (
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
                setViewMode('student');
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
              const hodUser = {
                role: 'hod',
                name: dept?.hod || 'Department Head',
                department_code: dept?.code || 'CEM',
                department_name: dept?.name || 'Academic Department',
                department_id: dept?.id || `DEP-${dept?.code || 'CEM'}`,
                matric: `HOD/${dept?.code || 'CEM'}/001`
              };
              setCurrentUser(hodUser);
              try {
                localStorage.setItem('fcc_hod_session', JSON.stringify(hodUser));
              } catch (e) {}
              setViewMode('hod');
              navigateTo('/hod/overview');
            }}
          />
        ) : currentUser.role === 'hod' ? (
          <HodDashboard
            key={currentUser?.department_code || 'hod'}
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
        <div className="fixed inset-0 z-50 bg-slate-950 p-2 sm:p-6 overflow-y-auto">
          <DigitalBookReader
            book={activeBookForReader}
            user={currentUser}
            onSelectBook={(selected) => {
              setActiveBookForReader(selected);
              navigateTo(`/reader/${selected.id}`);
            }}
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
