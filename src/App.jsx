import { Link2, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import {
    INSTITUTION
} from './data/institutionalSeedData';

import AdminLogin from './auth/AdminLogin';
import HodLogin from './auth/HodLogin';
import { QrPhoneApprovalPage } from './auth/QrPhoneLogin';
import WorldClassLogin from './auth/WorldClassLogin';
import BookDetailsModal from './common/BookDetailsModal';
import BookDossierView from './common/BookDossierView';
import HardwareBarcodeListener from './common/HardwareBarcodeListener';
import RouteTracerHUD from './common/RouteTracerHUD';
import SelfServiceKiosk from './common/SelfServiceKiosk';
import FccAdminLibrary from './fcc_admin_library/FccAdminLibrary';
import HodDashboard from './hod/HodDashboard';
import PublicDiscovery from './public_opac/PublicDiscovery';
import DigitalBookReader from './student/DigitalBookReader';
import StudentPortal from './student/StudentPortal';
import DeveloperMasterPortal from './developer/DeveloperMasterPortal';
import PageMaintenanceGuard from './common/PageMaintenanceGuard';
import InstitutionalFooter from './common/InstitutionalFooter';
import PwaDesktopNavBar from './common/PwaDesktopNavBar';
import PwaInstallPromptModal from './common/PwaInstallPromptModal';
import { developerConfigService } from './services/developerConfigService';
import { PATTERNS } from './utils/backgroundPatterns';
import { copyToClipboardWithFeedback, navigateTo, parseCurrentRoute } from './utils/router';
import { sounds } from './utils/soundEffects';
import { clearAllAuthStores, storeUserSession, getActiveUserSession, getDashboardRouteForRole } from './utils/authSessionManager';
import { subscribeRealtimeEvents } from './services/realtimeSync';

export default function App() {
  // Navigation & Authentication State (Strictly Session-Based with Role Isolation)
  const [currentUser, setCurrentUser] = useState(() => {
    return getActiveUserSession();
  });
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash || '';
      const p = window.location.pathname || '';
      if (p.includes('/qr-approve') || h.includes('/qr-approve') || h.includes('/qr-login') || p.includes('/mobile-pass') || h.includes('/mobile-pass')) return 'qr_approval';
      if (h.includes('/developer') || h.includes('/dev') || h.includes('/root') || h.includes('/master')) return 'developer';
      if (h.includes('/kiosk')) return 'kiosk';
      if (h.includes('/book')) return 'book_dossier';
      if (h.includes('/admin/login')) return 'admin_login';
      if (h.includes('/admin')) {
        const active = getActiveUserSession();
        if (active && active.role === 'admin') return 'admin';
        return 'admin_login';
      }
      if (h.includes('/hod/login')) return 'hod_login';
      if (h.includes('/hod')) {
        const active = getActiveUserSession();
        if (active && (active.role === 'hod' || active.role === 'hod_staff')) return 'hod';
        return 'hod_login';
      }
      if (h.includes('/scholar')) {
        const active = getActiveUserSession();
        if (active && active.role === 'student') return 'student';
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
  const [devConfig, setDevConfig] = useState(() => developerConfigService.getConfig());

  useEffect(() => {
    const handleConfigUpdate = (e) => {
      if (e.detail) setDevConfig(e.detail);
    };
    window.addEventListener('fcc-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('fcc-config-updated', handleConfigUpdate);
  }, []);

  // Global State with LocalStorage (hydrated dynamically from live database)
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('fcc_catalog_v48_gov');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter(b => b && (!b.status || ['approved', 'published', 'active'].includes(String(b.status).toLowerCase())))
        : [];
    } catch {
      return [];
    }
  });
  const booksRef = useRef(books);
  booksRef.current = books;

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

  // Sync state changes to localStorage (guarded, strips heavy base64 strings)
  useEffect(() => {
    try {
      const slim = (books || []).map(b => {
        if (!b) return b;
        const copy = { ...b };
        if (copy.file_data_url) copy.file_data_url = '';
        if (copy.fileDataUrl) copy.fileDataUrl = '';
        if (typeof copy.cover_image === 'string' && copy.cover_image.startsWith('data:')) {
          copy.cover_image = copy.id ? `/api/catalog/${copy.id}/cover` : '/assets/fcc-logo.png';
        }
        if (typeof copy.coverImage === 'string' && copy.coverImage.startsWith('data:')) {
          copy.coverImage = copy.id ? `/api/catalog/${copy.id}/cover` : '/assets/fcc-logo.png';
        }
        return copy;
      });
      localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(slim));
    } catch (e) {
      console.warn('Could not cache catalog in localStorage:', e);
    }
  }, [books]);

  useEffect(() => {
    localStorage.setItem('fcc_partner_libs_v48', JSON.stringify(partnerLibraries));
  }, [partnerLibraries]);

  useEffect(() => {
    localStorage.setItem('fcc_loans_v48_gov', JSON.stringify(loans));
  }, [loans]);

  // Strip bloated base64 strings from browser storage on startup to prevent quota exhaustion
  useEffect(() => {
    try {
      ['fcc_catalog_v48_gov', 'fcc_db_catalog', 'fcc_catalog_overrides', 'fcc_pending_department_uploads', 'fcc_hod_submissions_v48', 'fcc_loans_v48_gov', 'fcc_saved_books_list'].forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            let modified = false;
            const clean = parsed.filter(item => item && item.id).map(item => {
              if (item && item.file_data_url && item.file_data_url.length > 50000) {
                modified = true;
                return { ...item, file_data_url: '', fileDataUrl: '' };
              }
              if (item && item.fileDataUrl && item.fileDataUrl.length > 50000) {
                modified = true;
                return { ...item, file_data_url: '', fileDataUrl: '' };
              }
              return item;
            });
            if (clean.length !== parsed.length || modified) {
              localStorage.setItem(key, JSON.stringify(clean));
            }
          }
        }
      });
    } catch {}
  }, []);

  // Real-time catalog update listener across roles (Admin, HOD, Scholar)
  useEffect(() => {
    const isBookApproved = (b) => b && (!b.status || ['approved', 'published', 'active'].includes(String(b.status).toLowerCase()));
    const handleCatalogUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBooks(e.detail.filter(isBookApproved));
      } else if (e.detail && e.detail.id) {
        if (isBookApproved(e.detail)) {
          setBooks(prev => [e.detail, ...prev.filter(b => b.id !== e.detail.id)]);
        }
      }
    };
    window.addEventListener('fcc-catalog-updated', handleCatalogUpdate);

    // Universal Multi-Device Real-Time Synchronization Listener
    const unsubscribeRealtime = subscribeRealtimeEvents((event) => {
      if (!event || !event.action) return;

      if (event.action === 'DELETE') {
        const targetId = String(event.id || '').trim().toLowerCase();
        const targetIds = (event.ids || []).map(i => String(i).trim().toLowerCase());
        const targetTitle = String(event.title || '').trim().toLowerCase();

        // 1. If currently open in Reader, auto-close immediately with alert!
        setActiveBookForReader(current => {
          if (!current) return null;
          const cId = String(current.id || '').trim().toLowerCase();
          const cUpId = String(current.upload_id || '').trim().toLowerCase();
          const cTitle = String(current.title || '').trim().toLowerCase();

          const isMatch = (targetId && (targetId === cId || targetId === cUpId)) ||
                          (targetIds.length > 0 && (targetIds.includes(cId) || targetIds.includes(cUpId))) ||
                          (cTitle && targetTitle && targetTitle.length > 3 && cTitle === targetTitle);

          if (isMatch) {
            try { sounds.playWarning(); } catch {}
            if (typeof window !== 'undefined' && window.location.hash.includes('/reader')) {
              window.location.hash = '#/';
            }
            return null;
          }
          return current;
        });

        // 2. Remove from global catalog state in real time
        setBooks(prev => prev.filter(b => {
          const bId = String(b.id || '').toLowerCase();
          const bUpId = String(b.upload_id || '').toLowerCase();
          const bTitle = String(b.title || '').trim().toLowerCase();
          if (bId === targetId || bUpId === targetId || targetIds.includes(bId) || targetIds.includes(bUpId)) return false;
          if (targetTitle && bTitle && targetTitle.length > 3 && bTitle === targetTitle) return false;
          return true;
        }));

        // 3. Clear from details modal if open
        setSelectedBookForDetails(current => {
          if (!current) return null;
          const cId = String(current.id || '').toLowerCase();
          if (cId === targetId || targetIds.includes(cId)) return null;
          return current;
        });
      } else if (event.action === 'UPLOAD') {
        fetch('/api/catalog')
          .then(res => res.ok ? res.json() : null)
          .then(backendBooks => {
            if (Array.isArray(backendBooks)) {
              setBooks(backendBooks.filter(isBookApproved));
            }
          })
          .catch(() => {});
      } else if (event.action === 'MODIFY' || event.action === 'APPROVE') {
        fetch('/api/catalog')
          .then(res => res.ok ? res.json() : null)
          .then(backendBooks => {
            if (Array.isArray(backendBooks)) {
              setBooks(backendBooks.filter(isBookApproved));
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      window.removeEventListener('fcc-catalog-updated', handleCatalogUpdate);
      unsubscribeRealtime();
    };
  }, []);

  // Initial Sync from Laravel Backend Database
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.ok ? res.json() : null)
      .then(backendBooks => {
        if (Array.isArray(backendBooks)) {
          const normalized = backendBooks
            .filter(b => b && (!b.status || ['approved', 'published', 'active'].includes(String(b.status).toLowerCase())))
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
              cover_image: b.cover_image || b.coverImage || b.cover || '',
              coverImage: b.cover_image || b.coverImage || b.cover || '',
              isDigital: b.is_digital !== undefined ? Boolean(b.is_digital) : (b.isDigital !== undefined ? Boolean(b.isDigital) : true),
              chapters: (() => { const v = typeof b.chapters === 'string' ? (() => { try { return JSON.parse(b.chapters); } catch { return []; } })() : b.chapters; return Array.isArray(v) ? v : []; })(),
              reviews: (() => { const v = typeof b.reviews === 'string' ? (() => { try { return JSON.parse(b.reviews); } catch { return []; } })() : b.reviews; return Array.isArray(v) ? v : []; })()
            }));
          setBooks(normalized);
          localStorage.setItem('fcc_catalog_v48_gov', JSON.stringify(normalized));
          localStorage.setItem('fcc_db_catalog', JSON.stringify(normalized));
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

  // Master Hash Route Listener & Direct URL Deep-Linking
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.href.includes('qr_auth=') || window.location.href.includes('qr_token=')) {
        checkIncomingQrAuth();
        return;
      }
      const { path, params } = parseCurrentRoute();
      setCurrentHash(window.location.hash);

      // Handle root paths: #/, #, or empty path
      if (!path || path === '/' || path === '') {
        setActiveBookForReader(null);
        setSelectedBookForDetails(null);
        const active = currentUserRef.current || getActiveUserSession();
        if (active && active.role === 'admin') {
          setViewMode('admin');
        } else if (active && (active.role === 'hod' || active.role === 'hod_staff')) {
          setViewMode('hod');
        } else if (active && active.role === 'student') {
          setViewMode('student');
        } else {
          setViewMode('public_opac');
        }
        return;
      }

      // Book Deep-Link & Dossier View (e.g. #/book/ or #/book/FCC-PDF-3779 or #/book/FCC-B001)
      if (path === '/book' || path.startsWith('/book')) {
        setActiveBookForReader(null);
        setViewMode('book_dossier');
        const rawId = path.replace('/book/', '').replace('/book', '').trim();
        if (rawId) {
          const currentCatalog = booksRef.current || [];
          const found = currentCatalog.find(b =>
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

      // Reader Deep-Link (e.g. #/reader/ or #/reader/FCC-B001 or #/scholar/reader?bookId=... or #/read/...)
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
            // Asynchronously fetch directly from Laravel API (catalog, department uploads, or theses)
            fetch(`/api/catalog/${encodeURIComponent(rawReaderId)}`)
              .then(r => r.ok ? r.json() : null)
              .then(remoteBook => {
                if (remoteBook && remoteBook.id) {
                  setActiveBookForReader(remoteBook);
                  setBooks(prev => prev.some(b => b.id.toLowerCase() === remoteBook.id.toLowerCase()) ? prev.map(b => b.id.toLowerCase() === remoteBook.id.toLowerCase() ? remoteBook : b) : [remoteBook, ...prev]);
                } else {
                  fetch(`/api/department-uploads/${encodeURIComponent(rawReaderId)}`)
                    .then(ur => ur.ok ? ur.json() : null)
                    .then(upBook => {
                      if (upBook && (upBook.id || upBook.book_id)) {
                        const normUp = {
                          ...upBook,
                          id: upBook.book_id || upBook.id,
                          isDigital: true,
                          hasBinaryPdf: true,
                          pdfUrl: `/api/books/${encodeURIComponent(upBook.book_id || upBook.id)}/pdf`
                        };
                        setActiveBookForReader(normUp);
                        setBooks(prev => [normUp, ...prev]);
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

          // Always fetch live from backend API / OpenAlex to ensure freshly uploaded HOD/Admin books or real journals are loaded
          fetch('/api/catalog')
            .then(res => res.ok ? res.json() : null)
            .then(async (catalogList) => {
              if (Array.isArray(catalogList) && catalogList.length > 0) {
                const best = pickBestUploadedBook(catalogList);
                if (best) {
                  try {
                    const cr = await fetch(`/api/catalog/${encodeURIComponent(best.id)}`);
                    const full = cr.ok ? await cr.json() : best;
                    setActiveBookForReader(full || best);
                    return;
                  } catch {
                    setActiveBookForReader(best);
                    return;
                  }
                }
              }

              // If no catalog uploads exist, load authentic live open-access academic journals
              try {
                const { fetchLiveAcademicJournals } = await import('./services/openSourceJournalsApi');
                const journals = await fetchLiveAcademicJournals({ query: 'cooperative economics agriculture computer science finance', perPage: 10 });
                if (Array.isArray(journals) && journals.length > 0) {
                  setActiveBookForReader(journals[0]);
                }
              } catch (jErr) {
                console.warn('Could not load fallback live journals in App:', jErr);
              }
            })
            .catch(() => {});
        }
      } else if (!path.startsWith('/book')) {
        // Ensure reader is closed when navigating away
        setActiveBookForReader(null);
      }

      // Route switching for authenticated / admin / hod / scholar / opac view
      if (path === '/developer' || path === '/dev' || path === '/root' || path === '/master' || path.startsWith('/developer')) {
        setViewMode('developer');
      } else if (path === '/kiosk' || path.startsWith('/kiosk')) {
        setViewMode('kiosk');
      } else if (path === '/admin/login' || path.startsWith('/admin/login')) {
        const active = getActiveUserSession();
        if (active && active.role === 'admin') {
          setCurrentUser(active);
          setViewMode('admin');
          navigateTo('/admin/overview');
        } else {
          setViewMode('admin_login');
        }
      } else if (path.toLowerCase() === '/hod/login' || path.toLowerCase().startsWith('/hod/login')) {
        setViewMode('hod_login');
      } else if (path.startsWith('/admin')) {
        const active = getActiveUserSession();
        if (active && active.role === 'admin') {
          setCurrentUser(active);
          setViewMode('admin');
        } else {
          setViewMode('admin_login');
          navigateTo('/admin/login');
        }
      } else if (path.toLowerCase().startsWith('/hod')) {
        const active = getActiveUserSession();
        if (active && (active.role === 'hod' || active.role === 'hod_staff')) {
          setCurrentUser(active);
          setViewMode('hod');
        } else if (active && active.role === 'admin') {
          // Admin has administrative authority to access HOD dashboard without email & password
          const defaultHod = {
            role: 'hod',
            isAdminImpersonation: true,
            adminOriginUser: active,
            name: active.name ? `${active.name} (Acting HOD)` : 'Chief College Librarian',
            email: active.email || 'librarian@fccibadan.edu.ng',
            department_code: 'CSC',
            department_name: 'Computer Science & Information Technology',
            department_id: 'DEP-CSC',
            matric: 'HOD/CSC/001'
          };
          storeUserSession(defaultHod, null, 'hod');
          setCurrentUser(defaultHod);
          setViewMode('hod');
        } else {
          setViewMode('hod_login');
          navigateTo('/hod/login');
        }
      } else if (path.startsWith('/scholar') || path.startsWith('/student')) {
        const active = getActiveUserSession();
        if (active && active.role === 'hod_staff') {
          // Departmental staff are strictly blocked from entering the student/scholar portal
          setCurrentUser(active);
          setViewMode('hod');
          navigateTo('/hod/staff-workspace');
        } else if (active && active.role === 'hod') {
          setCurrentUser(active);
          setViewMode('hod');
          navigateTo('/hod/overview');
        } else if (active && active.role === 'student') {
          setCurrentUser(active);
          setViewMode('student');
        } else {
          setViewMode('login');
          navigateTo('/login');
        }
      } else if (path === '/communication' || path.startsWith('/communication')) {
        const active = getActiveUserSession();
        if (active && active.role === 'hod_staff') {
          setCurrentUser(active);
          setViewMode('hod');
          navigateTo('/hod/communication');
        } else if (active && active.role === 'student') {
          setCurrentUser(active);
          setViewMode('student');
        } else {
          setViewMode('login');
          navigateTo('/login');
        }
      } else if (path.startsWith('/login')) {
        const active = getActiveUserSession();
        if (active && active.role === 'hod_staff') {
          // Already authenticated as staff - do not open student login
          setCurrentUser(active);
          setViewMode('hod');
          navigateTo('/hod/staff-workspace');
        } else if (active && active.role === 'hod') {
          setCurrentUser(active);
          setViewMode('hod');
          navigateTo('/hod/overview');
        } else if (active && active.role === 'admin') {
          setCurrentUser(active);
          setViewMode('admin');
          navigateTo('/admin/overview');
        } else {
          setViewMode('login');
        }
      } else if (path === '/qr-approve' || path.startsWith('/qr-approve') || path === '/qr-login' || path.startsWith('/qr-login') || path === '/mobile-pass' || path.startsWith('/mobile-pass') || (typeof window !== 'undefined' && window.location.pathname.includes('/qr-approve'))) {
        setViewMode('qr_approval');
      } else if (!currentUserRef.current) {
        if (path.startsWith('/opac') || path === '/' || path === '') {
          setViewMode('public_opac');
        } else if (path.startsWith('/login')) {
          setViewMode('login');
        } else {
          setViewMode('public_opac');
        }
      }
    };

    // Auto-login when opened via phone camera QR scan URL (e.g. #/login?qr_auth=...)
    const checkIncomingQrAuth = async () => {
      const href = window.location.href;
      // Workstation approval requests (/qr-approve or challenge=) are authenticators for the computer, NOT mobile logins
      if (href.includes('/qr-approve') || href.includes('challenge=') || href.includes('/mobile-pass') || href.includes('/qr-login')) {
        return false;
      }
      const match = href.match(/[?&](?:qr_auth|qr_token|auth_qr)=([^&#]+)/i);
      const claimMatch = href.match(/[?&](?:claim_session|session_id)=([^&#]+)/i);

      if (match) {
        const rawToken = decodeURIComponent(match[1]);
        const sessionId = claimMatch ? decodeURIComponent(claimMatch[1]) : null;

        try {
          // If a cross-device session is attached, authorize it so the desktop logs in too
          if (sessionId) {
            try {
              fetch('/api/auth/qr-session-claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, identifier: rawToken })
              }).catch(() => {});
            } catch (claimErr) {
              const directClaim = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/qr-session-claim`;
              fetch(directClaim, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, identifier: rawToken })
              }).catch(() => {});
            }
          }

          // Immediately log in on this device
          let res;
          try {
            res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: rawToken, login_mode: 'qr' })
            });
          } catch (proxyErr) {
            const directApi = `${window.location.protocol}//${window.location.hostname}:8000/api/auth/login`;
            res = await fetch(directApi, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: rawToken, login_mode: 'qr' })
            });
          }

          let data = null;
          try {
            data = await res.json();
          } catch (jsonErr) {}

          if (res && res.ok && data && data.success && data.user) {
            sounds.playSuccessChime();
            const targetRole = data.role || data.user.role || 'student';
            const user = storeUserSession(data.user, data.token || null, targetRole);
            setCurrentUser(user);
            setViewMode(targetRole === 'admin' ? 'admin' : targetRole === 'hod' ? 'hod' : 'student');
            const targetRoute = getDashboardRouteForRole(targetRole);
            window.history.replaceState(null, '', window.location.pathname + '#' + targetRoute);
            navigateTo(targetRoute);
            return true;
          }
        } catch (err) {
          console.warn('QR auto-login note:', err);
        }
      }
      return false;
    };

    const onAuthStoresCleared = () => {
      setCurrentUser(null);
    };
    const onAuthChanged = (e) => {
      if (e.detail?.user) {
        setCurrentUser(e.detail.user);
      }
    };
    window.addEventListener('fcc-auth-stores-cleared', onAuthStoresCleared);
    window.addEventListener('fcc-auth-changed', onAuthChanged);

    checkIncomingQrAuth().then(didAutoLogin => {
      if (!didAutoLogin) {
        window.addEventListener('hashchange', handleHashChange);
        if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
          navigateTo('/opac');
        } else {
          handleHashChange();
        }
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('fcc-auth-stores-cleared', onAuthStoresCleared);
      window.removeEventListener('fcc-auth-changed', onAuthChanged);
    };
  }, []);

  // Sync sound muted state
  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sounds.muted = nextMuted;
  };

  // Handle Logout (Clears all active sessions and wipes user storage)
  const handleLogout = (roleOverride) => {
    // If Admin was impersonating HOD, return seamlessly back to Admin Console
    if (currentUser?.isAdminImpersonation && currentUser?.adminOriginUser) {
      const restoredAdmin = currentUser.adminOriginUser;
      storeUserSession(restoredAdmin, null, 'admin');
      setCurrentUser(restoredAdmin);
      setViewMode('admin');
      navigateTo('/admin/overview');
      return;
    }

    const role = roleOverride || currentUser?.role;
    setCurrentUser(null);
    setSelectedBookForDetails(null);
    setActiveBookForReader(null);
    clearAllAuthStores({ reason: 'user_logout' });

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
      className={`min-h-screen bg-[#021810] text-emerald-50 font-sans selection:bg-emerald-500 selection:text-white flex flex-col ${
        viewMode === 'student' || viewMode === 'developer'
          ? 'h-screen overflow-hidden'
          : currentUser &&
            ['admin', 'hod', 'hod_staff'].includes(currentUser.role) &&
            !['kiosk', 'book_dossier', 'admin_login', 'hod_login'].includes(viewMode)
          ? 'pb-16 lg:pb-0 lg:h-screen lg:overflow-hidden'
          : 'pb-16'
      }`}
      style={{ backgroundImage: PATTERNS.app }}
    >
      {/* Universal PWA Desktop Navigation Bar (Back / Previous, Front / Forward, Reload, Home, Address Bar) */}
      <PwaDesktopNavBar
        currentUser={currentUser}
        isMuted={isMuted}
        onToggleAudio={toggleAudio}
        onLogout={handleLogout}
        showFloatingQuickNav={true}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {viewMode === 'kiosk' ? (
          devConfig?.pageStatus?.kiosk?.enabled === false ? (
            <PageMaintenanceGuard
              pageTitle={devConfig.pageStatus.kiosk.title || 'Self-Service Kiosk'}
              maintenanceMsg={devConfig.pageStatus.kiosk.maintenanceMsg}
              onReturnToSafePage={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          ) : (
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
          )
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
              if (user && user.role === 'hod_staff') {
                navigateTo('/hod/staff-workspace');
              } else {
                navigateTo('/hod/overview');
              }
            }}
            onBackToPublic={() => {
              setViewMode('public_opac');
              navigateTo('/opac');
            }}
          />
        ) : viewMode === 'qr_approval' ? (
          <QrPhoneApprovalPage
            onLogin={() => {
              // Mobile is solely an authenticator for the workstation.
              // It does NOT log into the student portal on mobile.
            }}
            onBackToLogin={() => {
              setViewMode('login');
              navigateTo('/login');
            }}
          />
        ) : viewMode === 'developer' ? (
          <DeveloperMasterPortal
            onImpersonate={(role, user) => {
              setCurrentUser(user);
              if (role === 'admin') setViewMode('admin');
              else if (role === 'hod' || role === 'hod_staff') setViewMode('hod');
              else if (role === 'student') setViewMode('student');
            }}
            onLogout={() => {
              setViewMode('login');
              navigateTo('/login');
            }}
          />
        ) : viewMode === 'public_opac' ? (
          devConfig?.pageStatus?.opac?.enabled === false ? (
            <PageMaintenanceGuard
              pageTitle={devConfig.pageStatus.opac.title || 'Public Discovery (OPAC)'}
              maintenanceMsg={devConfig.pageStatus.opac.maintenanceMsg}
              onReturnToSafePage={() => {
                setViewMode('login');
                navigateTo('/login');
              }}
            />
          ) : (
            <PublicDiscovery
              books={books}
              currentUser={currentUser}
              partnerLibraries={partnerLibraries}
              onSelectBook={(book) => {
                setSelectedBookForDetails(book);
                navigateTo(`/book/${book.id}`);
              }}
              onOpenReader={(book) => {
                setActiveBookForReader(book);
                navigateTo(`/reader/${book.id}`);
              }}
              onOpenLogin={() => {
                setViewMode('login');
                navigateTo('/login');
              }}
              onOpenDashboard={() => {
                if (currentUser?.role === 'admin') {
                  setViewMode('admin');
                  navigateTo('/admin/dashboard');
                } else if (currentUser?.role === 'hod') {
                  setViewMode('hod');
                  navigateTo('/hod/overview');
                } else if (currentUser?.role === 'hod_staff') {
                  setViewMode('hod');
                  navigateTo('/hod/staff-workspace');
                } else {
                  setViewMode('student');
                  navigateTo('/scholar/profile');
                }
              }}
            />
          )
        ) : !currentUser ? (
          <WorldClassLogin
            onLogin={(user) => {
              sounds.playSuccessChime();
              if (user) {
                if (user.role === 'hod_staff') {
                  storeUserSession(user, null, 'hod');
                  setCurrentUser(user);
                  setViewMode('hod');
                  navigateTo('/hod/staff-workspace');
                  return;
                }
                if (user.role === 'hod') {
                  storeUserSession(user, null, 'hod');
                  setCurrentUser(user);
                  setViewMode('hod');
                  navigateTo('/hod/overview');
                  return;
                }
                if (user.role === 'admin') {
                  storeUserSession(user, null, 'admin');
                  setCurrentUser(user);
                  setViewMode('admin');
                  navigateTo('/admin/overview');
                  return;
                }
                const studentUser = {
                  ...user,
                  role: 'student',
                  matric: user.matric || user.barcode
                };
                storeUserSession(studentUser, null, 'student');
                setCurrentUser(studentUser);
              } else {
                clearAllAuthStores({ reason: 'world_class_login_null' });
                setCurrentUser(null);
              }
              const returnToOpac = sessionStorage.getItem('fcc_return_to_opac_after_login');
              if (returnToOpac) {
                sessionStorage.removeItem('fcc_return_to_opac_after_login');
                setViewMode('public_opac');
                navigateTo('/opac');
                return;
              }
              setViewMode('student');
              const hash = window.location.hash;
              const target = hash.includes('catalog') ? '/scholar/catalog' : '/scholar/profile';
              navigateTo(target);
            }}
            onOpenPublicOpac={() => {
              setViewMode('public_opac');
              navigateTo('/opac');
            }}
          />
        ) : currentUser.role === 'admin' ? (
          devConfig?.pageStatus?.admin?.enabled === false && !currentUser?.isDeveloperImpersonation ? (
            <PageMaintenanceGuard
              pageTitle={devConfig.pageStatus.admin.title || 'Chief Librarian Console'}
              maintenanceMsg={devConfig.pageStatus.admin.maintenanceMsg}
              onReturnToSafePage={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          ) : (
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
                const active = getActiveUserSession();
                if (active && active.role === 'student') {
                  setCurrentUser(active);
                  setViewMode('student');
                  navigateTo('/scholar/catalog');
                } else {
                  setViewMode('public_opac');
                  navigateTo('/opac');
                }
              }}
              onSwitchToHodPortal={(dept) => {
                const targetDept = dept || {
                  code: 'CSC',
                  name: 'Computer Science & Information Technology',
                  hod_name: 'Dr. O. A. Babatunde',
                  id: 'DEP-CSC'
                };
                const hodSession = {
                  role: 'hod',
                  isAdminImpersonation: true,
                  adminOriginUser: currentUser,
                  name: targetDept.hod_name || targetDept.hod || `HOD (${targetDept.code})`,
                  email: targetDept.hod_email || `hod.${(targetDept.code || 'csc').toLowerCase()}@fccibadan.edu.ng`,
                  department_code: targetDept.code || 'CSC',
                  department_name: targetDept.name || `${targetDept.code} Department`,
                  department_id: targetDept.id || `DEP-${targetDept.code}`,
                  matric: `HOD/${targetDept.code}/001`
                };
                storeUserSession(hodSession, null, 'hod');
                setCurrentUser(hodSession);
                setViewMode('hod');
                navigateTo('/hod/overview');
              }}
            />
          )
        ) : (currentUser.role === 'hod' || currentUser.role === 'hod_staff') ? (
          devConfig?.pageStatus?.hod?.enabled === false && !currentUser?.isDeveloperImpersonation ? (
            <PageMaintenanceGuard
              pageTitle={devConfig.pageStatus.hod.title || 'HOD Academic Department'}
              maintenanceMsg={devConfig.pageStatus.hod.maintenanceMsg}
              onReturnToSafePage={() => {
                setViewMode('public_opac');
                navigateTo('/opac');
              }}
            />
          ) : (
            <HodDashboard
              key={currentUser?.id || currentUser?.department_code || 'hod'}
              user={currentUser}
              onLogout={() => handleLogout('hod')}
            />
          )
        ) : devConfig?.pageStatus?.scholar?.enabled === false && !currentUser?.isDeveloperImpersonation ? (
          <PageMaintenanceGuard
            pageTitle={devConfig.pageStatus.scholar.title || 'Student Scholar Portal'}
            maintenanceMsg={devConfig.pageStatus.scholar.maintenanceMsg}
            onReturnToSafePage={() => {
              setViewMode('public_opac');
              navigateTo('/opac');
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
            onOpenReader={(b) => {
              setActiveBookForReader(b);
              navigateTo('/scholar/reader', { bookId: b.id });
            }}
          />
        )}
      </div>

      {/* Global Institutional Copyright & Attribution Footer */}
      {viewMode !== 'admin_login' && (
        <InstitutionalFooter />
      )}

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
            navigateTo(`/reader/${b.id}`);
          }}
          onReserve={async (b) => {
            if (!currentUser) {
              sounds.playClick();
              setViewMode('login');
              navigateTo('/login');
              alert('Please log in with your Student Matric or Staff ID to reserve a physical copy.');
              return;
            }
            try {
              sounds.playClick();
              await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  book_id: b.id,
                  book_title: b.title,
                  call_number: b.callNumber || b.call_number || 'FCC.LIB',
                  matric: currentUser.matric || currentUser.barcode || currentUser.username || 'FCC/SCHOLAR',
                  patron_name: currentUser.name || 'Library Scholar',
                  pickup_branch: 'Main Campus Circulation Desk'
                })
              });
              sounds.playSuccessChime();
              alert(`Reserved copy of "${b.title}". Notification sent to Central Circulation Desk.`);
              window.dispatchEvent(new CustomEvent('fcc-reservation-created', { detail: { book: b, user: currentUser } }));
            } catch (e) {
              sounds.playSuccessChime();
              alert(`Reserved copy of "${b.title}". Pick-up queued at Central Circulation.`);
            }
          }}
        />
      )}


      {/* Global E-Book Reader Modal */}
      {(activeBookForReader || (typeof currentHash === 'string' && (currentHash.startsWith('#/reader') || currentHash.startsWith('#/read')))) && (
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

      {/* Global PWA Install Modal (Triggered by events or install actions) */}
      <PwaInstallPromptModal autoPromptOnMobile={false} />
    </div>
  );
}
