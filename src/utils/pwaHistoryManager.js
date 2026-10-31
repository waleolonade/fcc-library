// =========================================================================
// FCC PWA DESKTOP NAVIGATION & HISTORY MANAGER
// Provides native desktop Back (Previous) & Front (Forward) navigation
// for standalone installed PWAs, desktop environments, and browsers.
// =========================================================================

import { SYSTEM_ROUTES, parseCurrentRoute, navigateTo } from './router';
import { sounds } from './soundEffects';

const STORAGE_KEY_STACK = 'fcc_pwa_nav_history_stack_v2';
const STORAGE_KEY_INDEX = 'fcc_pwa_nav_history_idx_v2';
const MAX_HISTORY = 50;

// Resolve clean human-readable title for any route or hash
export function resolveRouteTitle(hashOrPath) {
  if (!hashOrPath) return 'FCC Smart Library';
  const clean = hashOrPath.replace(/^#/, '');
  const [pathPart] = clean.split('?');
  const path = pathPart.startsWith('/') ? pathPart : '/' + pathPart;

  // Exact system route matches
  const found = SYSTEM_ROUTES.find(r => r.path === path);
  if (found) return found.label;

  // Dynamic book routes (#/book/ID)
  if (path.startsWith('/book')) {
    const bookId = path.replace('/book/', '').replace('/book', '').trim();
    return bookId ? `Book Dossier (${bookId})` : 'Book Dossier & Catalog Record';
  }

  // Dynamic reader routes (#/reader/ID or #/read/ID)
  if (path.startsWith('/reader') || path.startsWith('/read')) {
    const rawId = path.replace(/^\/(?:reader|read)\/?/, '').trim();
    return rawId ? `E-Reader (${rawId})` : 'Digital Book Reader';
  }

  // Scholar subroutes
  if (path.startsWith('/scholar/')) {
    const sub = path.replace('/scholar/', '');
    const titles = {
      discover: 'Scholarly Resources Discovery',
      catalog: 'Scholar Catalog Explorer',
      profile: 'Student Patron Profile',
      loans: 'Smart Loans & Card Manager',
      theses: 'Institutional Theses Repository',
      plagiarism: 'Plagiarism & Originality Scanner',
      'dept-resources': 'Department Resources & Syllabi',
      libraries: 'Partner Libraries Network',
      reserves: 'Course Reserves & Reading Lists',
      clearance: 'Graduation Clearance Certificate',
      rooms: 'Study Rooms & Collaborative Carrels',
      ill: 'Inter-Library Loan (ILL)',
      helpdesk: 'Ask-a-Librarian Helpdesk',
      'ai-librarian': 'AI Research Librarian Desk',
      kiosk: 'Self-Service Checkout Station',
      barcode_studio: 'Barcode & QR ID Studio',
      notifications: 'Patron System Notifications',
      communication: 'Campus Communication Board'
    };
    if (titles[sub]) return titles[sub];
    return `Scholar: ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
  }

  // Admin subroutes
  if (path.startsWith('/admin/')) {
    const sub = path.replace('/admin/', '');
    const titles = {
      overview: 'Command Center & Executive Dashboard',
      circulation: 'Circulation Desk (Barcode & RFID)',
      'pdf-upload': 'PDF Upload & Metadata Studio',
      pdf_upload: 'PDF Upload & Metadata Studio',
      marc: 'MARC 21 & Dublin Core Cataloguer',
      research: 'OpenAlex Scholarly Harvester',
      patrons: 'Patron Registry & SIS Batch Import',
      shelves: 'Interactive Shelf Audit Map',
      acquisitions: 'Acquisitions & Vendor Orders',
      'partner-libraries': 'Partner Libraries Gateway Manager',
      partner_libs: 'Partner Libraries Gateway Manager',
      analytics: 'Institutional Analytics & BI',
      audit: 'Cryptographic Security Audit Logs',
      apis: 'API Configuration & Gateway',
      'hod-submissions': 'HOD Submissions Queue',
      hod_submissions: 'HOD Submissions Queue',
      policies: 'Institutional RBAC & Policies',
      integrations: 'Institutional Integrations Hub',
      'barcode-qr': 'Barcode & QR Studio',
      barcode_qr: 'Barcode & QR Studio',
      settings: 'Configurable Library Settings',
      departments: 'Department Management',
      comms: 'Institutional Communications'
    };
    if (titles[sub]) return titles[sub];
    return `Admin: ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
  }

  // HOD subroutes
  if (path.startsWith('/hod/')) {
    const sub = path.replace('/hod/', '');
    const titles = {
      overview: 'HOD Departmental Overview',
      upload: 'Departmental Resource Ingestion',
      submissions: 'Departmental Submissions Tracker',
      curriculum: 'Course Reserves & Reading Lists',
      analytics: 'Departmental Library Analytics'
    };
    if (titles[sub]) return titles[sub];
    return `HOD: ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
  }

  if (path.includes('mobile-pass') || path.includes('qr-approve')) {
    return 'Mobile Library Pass & Authenticator';
  }

  return 'FCC Smart Library';
}

class PwaHistoryManager {
  constructor() {
    this.stack = [];
    this.currentIndex = 0;
    this.isNavigatingProgrammatically = false;
    this.listeners = new Set();
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Hydrate from sessionStorage
    try {
      const savedStack = sessionStorage.getItem(STORAGE_KEY_STACK);
      const savedIndex = sessionStorage.getItem(STORAGE_KEY_INDEX);
      if (savedStack) {
        this.stack = JSON.parse(savedStack);
        this.currentIndex = parseInt(savedIndex, 10) || 0;
        if (this.currentIndex >= this.stack.length) {
          this.currentIndex = Math.max(0, this.stack.length - 1);
        }
      }
    } catch (e) {
      this.stack = [];
      this.currentIndex = 0;
    }

    const currentHash = window.location.hash || '#/opac';
    if (this.stack.length === 0) {
      this.stack = [{ hash: currentHash, title: resolveRouteTitle(currentHash), time: Date.now() }];
      this.currentIndex = 0;
      this.persist();
    } else if (this.stack[this.currentIndex]?.hash !== currentHash) {
      // If refreshed or navigated on different hash, ensure currentHash is in stack
      this.recordRoute(currentHash);
    }

    // Hashchange listener
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());

    // Setup global keyboard hotkeys for desktop PWA:
    // Alt + LeftArrow (Back) & Alt + RightArrow (Forward)
    // Backspace outside inputs (Back)
    window.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    // Skip if user is actively typing in an input, textarea, or contentEditable
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );

    // Alt + LeftArrow: Go Back
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      this.goBack();
      return;
    }

    // Alt + RightArrow: Go Forward
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      this.goForward();
      return;
    }

    // Browser back / forward media keys on desktop multimedia keyboards
    if (e.key === 'BrowserBack') {
      e.preventDefault();
      this.goBack();
      return;
    }
    if (e.key === 'BrowserForward') {
      e.preventDefault();
      this.goForward();
      return;
    }

    // Backspace when not typing
    if (e.key === 'Backspace' && !isTyping && !e.altKey && !e.ctrlKey && !e.metaKey) {
      if (this.canGoBack()) {
        e.preventDefault();
        this.goBack();
      }
    }
  }

  handleHashChange() {
    const currentHash = window.location.hash || '#/opac';

    if (this.isNavigatingProgrammatically) {
      this.isNavigatingProgrammatically = false;
      this.persist();
      this.notify();
      return;
    }

    // Check if the change corresponds to previous route (user clicked browser back or shortcut)
    if (this.currentIndex > 0 && this.stack[this.currentIndex - 1]?.hash === currentHash) {
      this.currentIndex -= 1;
    }
    // Check if corresponds to next route (user clicked browser forward or shortcut)
    else if (this.currentIndex < this.stack.length - 1 && this.stack[this.currentIndex + 1]?.hash === currentHash) {
      this.currentIndex += 1;
    }
    // Otherwise it's a new link click/navigation
    else {
      this.recordRoute(currentHash);
    }

    this.persist();
    this.notify();
  }

  recordRoute(hash) {
    if (!hash) return;
    const currentEntry = this.stack[this.currentIndex];
    if (currentEntry && currentEntry.hash === hash) {
      return; // already on this route
    }

    // Drop forward history when a new navigation happens
    const nextStack = this.stack.slice(0, this.currentIndex + 1);
    nextStack.push({
      hash,
      title: resolveRouteTitle(hash),
      time: Date.now()
    });

    if (nextStack.length > MAX_HISTORY) {
      nextStack.shift();
    }

    this.stack = nextStack;
    this.currentIndex = this.stack.length - 1;
  }

  persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY_STACK, JSON.stringify(this.stack));
      sessionStorage.setItem(STORAGE_KEY_INDEX, String(this.currentIndex));
    } catch (e) {}
  }

  notify() {
    try {
      window.dispatchEvent(new CustomEvent('fcc-pwa-nav-change', {
        detail: {
          canGoBack: this.canGoBack(),
          canGoForward: this.canGoForward(),
          currentIndex: this.currentIndex,
          stackLength: this.stack.length,
          current: this.getCurrentRoute()
        }
      }));
    } catch (e) {}

    this.listeners.forEach(cb => {
      try { cb(); } catch (e) {}
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  canGoBack() {
    return this.currentIndex > 0 || (typeof window !== 'undefined' && window.history.length > 1);
  }

  canGoForward() {
    return this.currentIndex < this.stack.length - 1;
  }

  getPreviousRoute() {
    if (this.currentIndex > 0 && this.stack[this.currentIndex - 1]) {
      return this.stack[this.currentIndex - 1];
    }
    return null;
  }

  getNextRoute() {
    if (this.currentIndex < this.stack.length - 1 && this.stack[this.currentIndex + 1]) {
      return this.stack[this.currentIndex + 1];
    }
    return null;
  }

  getCurrentRoute() {
    const cur = this.stack[this.currentIndex];
    const currentHash = typeof window !== 'undefined' ? (window.location.hash || '#/opac') : '#/opac';
    return {
      hash: currentHash,
      title: cur?.title || resolveRouteTitle(currentHash)
    };
  }

  goBack(fallbackHome) {
    try { sounds.playClick(); } catch (e) {}

    if (this.currentIndex > 0) {
      this.isNavigatingProgrammatically = true;
      this.currentIndex -= 1;
      this.persist();
      window.history.back();
      this.notify();
      return true;
    }

    // If history length allows
    if (typeof window !== 'undefined' && window.history.length > 1) {
      try {
        window.history.back();
        return true;
      } catch (e) {}
    }

    // Intelligent fallback if user landed directly on a deep page
    const currentHash = window.location.hash || '';
    if (fallbackHome) {
      navigateTo(fallbackHome);
      return true;
    }

    if (currentHash.includes('/book') || currentHash.includes('/reader') || currentHash.includes('/read')) {
      const studentSession = localStorage.getItem('fcc_student_session');
      const adminSession = localStorage.getItem('fcc_admin_session');
      if (adminSession) navigateTo('/admin/circulation');
      else if (studentSession) navigateTo('/scholar/catalog');
      else navigateTo('/opac');
      return true;
    }

    if (currentHash.includes('/scholar')) {
      navigateTo('/scholar/catalog');
      return true;
    }

    if (currentHash.includes('/admin')) {
      navigateTo('/admin/overview');
      return true;
    }

    if (currentHash.includes('/hod')) {
      navigateTo('/hod/overview');
      return true;
    }

    navigateTo('/opac');
    return true;
  }

  goForward() {
    if (!this.canGoForward()) return false;
    try { sounds.playClick(); } catch (e) {}

    this.isNavigatingProgrammatically = true;
    this.currentIndex += 1;
    this.persist();
    window.history.forward();
    this.notify();
    return true;
  }

  reload() {
    try { sounds.playClick(); } catch (e) {}
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  goHome(user) {
    try { sounds.playClick(); } catch (e) {}
    if (user && user.role === 'admin') {
      navigateTo('/admin/overview');
    } else if (user && user.role === 'hod') {
      navigateTo('/hod/overview');
    } else if (user && (user.role === 'student' || user.matric)) {
      navigateTo('/scholar/catalog');
    } else {
      navigateTo('/opac');
    }
  }

  // Detect whether running in standalone PWA mode (desktop or mobile)
  isStandalonePwa() {
    if (typeof window === 'undefined') return false;
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: window-controls-overlay)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }
}

export const pwaHistory = new PwaHistoryManager();
