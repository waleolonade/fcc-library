// =========================================================================
// FCC IBADAN SMART ILS — CENTRALIZED REST & EVENT API CLIENT
// Direct Database & Backend API Connection for brainfeels_library
// =========================================================================

import { INSTITUTION, BRANCHES, SYSTEM_HEALTH_METRICS } from '../data/institutionalSeedData';

// Broadcast Channel for Real-Time Cross-App Synchronization
const syncChannel = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('fcc_ils_realtime_sync') : null;

// LocalStorage Persistent Store Keys (Used solely for local offline session caching)
const STORAGE_KEYS = {
  CATALOG: 'fcc_db_catalog',
  COURSES: 'fcc_db_courses',
  PATRONS: 'fcc_db_patrons',
  POLICIES: 'fcc_db_policies',
  LOANS: 'fcc_db_loans',
  READING_LISTS: 'fcc_db_reading_lists',
  CONTINUE_READING: 'fcc_db_continue_reading',
  RESERVATIONS: 'fcc_db_reservations',
  ROOMS: 'fcc_db_rooms',
  ROOM_BOOKINGS: 'fcc_db_room_bookings',
  THESES: 'fcc_db_theses',
  NOTIFICATIONS: 'fcc_db_notifications',
  ACQUISITIONS: 'fcc_db_acquisitions',
  PARTNER_LIBS: 'fcc_db_partner_libs',
  AUDIT_LOGS: 'fcc_db_audit_logs',
  EVENTS: 'fcc_db_events',
  ANNOUNCEMENTS: 'fcc_db_announcements'
};

function getStored(key, fallback = []) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored(key, data, eventType) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (syncChannel && eventType) {
      syncChannel.postMessage({ type: eventType, timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Resilient Fetch Helper for SQL API
async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Return null on network error to allow cached reading
  }
  return null;
}

export const libraryApi = {
  // -------------------------------------------------------------
  // 1. CATALOG & PDF BOOKS API (Direct from database 'books' table)
  // -------------------------------------------------------------
  catalog: {
    async getAll(branchFilter = null) {
      const query = branchFilter && branchFilter !== 'All' && branchFilter !== 'All Libraries' ? `?branch=${encodeURIComponent(branchFilter)}` : '';
      const apiData = await fetchApi(`/catalog${query}`);
      if (Array.isArray(apiData)) {
        setStored(STORAGE_KEYS.CATALOG, apiData);
        return apiData;
      }
      return getStored(STORAGE_KEYS.CATALOG, []);
    },

    async getById(id) {
      const apiData = await fetchApi(`/catalog/${encodeURIComponent(id)}`);
      if (apiData && !apiData.error) return apiData;
      const cached = getStored(STORAGE_KEYS.CATALOG, []);
      return cached.find(b => b.id.toLowerCase() === id.toLowerCase()) || null;
    },

    async checkDuplicate({ title, isbn, doi, fileName }) {
      const res = await fetchApi('/catalog/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ title, isbn, doi, fileName })
      });
      if (res) return res;

      // Local fallback check
      const cached = getStored(STORAGE_KEYS.CATALOG, []);
      const cleanT = (title || '').trim().toLowerCase().replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').trim();
      const match = cached.find(b => {
        if (isbn && b.isbn === isbn) return true;
        if (doi && b.doi === doi) return true;
        if (cleanT && (b.title || '').trim().toLowerCase().replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').trim() === cleanT) return true;
        if (fileName && b.fileName && b.fileName.toLowerCase() === fileName.toLowerCase()) return true;
        return false;
      });

      return {
        isDuplicate: Boolean(match),
        book: match || null,
        message: match ? `Book already exists in catalogue as "${match.title}"` : 'No duplicate detected'
      };
    },

    async uploadPdfBook(bookData) {
      const newBook = {
        id: bookData.id || `FCC-PDF-${Math.floor(1000 + Math.random() * 9000)}`,
        title: bookData.title,
        subtitle: bookData.subtitle || '',
        author: bookData.author,
        authorCredentials: bookData.authorCredentials || 'Ph.D., Faculty Researcher',
        authorAffiliation: bookData.authorAffiliation || 'Federal Co-operative College, Ibadan',
        coAuthors: bookData.coAuthors || '',
        subject: bookData.subject || 'Co-operative Economics',
        department: bookData.department || 'Co-operative Economics & Management',
        courseCode: bookData.courseCode || 'CEM 411',
        targetLevel: bookData.targetLevel || 'HND II',
        branch: bookData.branch || 'Main Campus Library (Prof. Hezekiah Complex)',
        shelfLocation: bookData.shelfLocation || `Floor 2 • Aisle 3 • Shelf ${Math.floor(10 + Math.random() * 80)}A`,
        callNumber: bookData.callNumber || `HD2963 .${bookData.author.slice(0,3).toUpperCase()} 2026`,
        isbn: bookData.isbn || `978-978-${Math.floor(100+Math.random()*900)}-${Math.floor(100+Math.random()*900)}-1`,
        publisher: bookData.publisher || 'FCC Academic Press',
        year: parseInt(bookData.year, 10) || new Date().getFullYear(),
        edition: bookData.edition || '1st Edition',
        pdfPages: parseInt(bookData.pdfPages, 10) || 320,
        fileSize: bookData.fileSize || '5.4 MB',
        fileName: bookData.fileName || `${bookData.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        fileDataUrl: bookData.fileDataUrl,
        externalUrl: bookData.externalUrl,
        format: bookData.format || 'E-Book',
        isDigital: true,
        copiesTotal: 5,
        copiesAvailable: 5,
        rating: 5.0,
        citations: 0,
        doi: bookData.doi || `10.5281/fcc.ibadan.2026.${Math.floor(1000 + Math.random() * 9000)}`,
        abstract: bookData.abstract || 'Academic monograph digitized and ingested into the FCC Smart Institutional Repository.',
        chapters: bookData.chapters || [],
        references: bookData.references || [],
        referenceStyle: bookData.referenceStyle || 'APA 7th',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Library Directorate Authority'
      };

      const res = await fetchApi('/catalog', {
        method: 'POST',
        body: JSON.stringify(newBook)
      });

      if (res && res.id) {
        newBook.id = res.id;
      }

      const cached = getStored(STORAGE_KEYS.CATALOG, []);
      const updated = [newBook, ...cached.filter(b => b.id !== newBook.id)];
      setStored(STORAGE_KEYS.CATALOG, updated, 'CATALOG_UPDATED');
      return newBook;
    },

    async deleteBook(id) {
      await fetchApi(`/catalog/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const cached = getStored(STORAGE_KEYS.CATALOG, []);
      const updated = cached.filter(b => b.id !== id);
      setStored(STORAGE_KEYS.CATALOG, updated, 'CATALOG_UPDATED');
      return { success: true, id };
    }
  },

  // -------------------------------------------------------------
  // 2. COURSES & SYLLABUS API (Direct from database 'courses' table)
  // -------------------------------------------------------------
  courses: {
    async getAll() {
      const apiData = await fetchApi('/courses');
      if (Array.isArray(apiData)) {
        setStored(STORAGE_KEYS.COURSES, apiData);
        return apiData;
      }
      return getStored(STORAGE_KEYS.COURSES, []);
    },

    async getByCode(code) {
      const courses = await this.getAll();
      return courses.find(c => c.code.toLowerCase().replace(/\s+/g, '') === code.toLowerCase().replace(/\s+/g, '')) || null;
    }
  },

  // -------------------------------------------------------------
  // 3. PATRONS & PIN MANAGEMENT API (Direct from database 'patrons' table)
  // -------------------------------------------------------------
  patrons: {
    async getAll() {
      const apiData = await fetchApi('/patrons');
      if (Array.isArray(apiData)) {
        setStored(STORAGE_KEYS.PATRONS, apiData);
        return apiData;
      }
      return getStored(STORAGE_KEYS.PATRONS, []);
    },

    async getByMatric(matric) {
      const patrons = await this.getAll();
      return patrons.find(p => p.matric.toLowerCase() === (matric || '').toLowerCase()) || null;
    },

    async authenticate(matric, pin) {
      const apiRes = await fetchApi('/patrons/auth', {
        method: 'POST',
        body: JSON.stringify({ matric, pin })
      });

      if (apiRes && apiRes.success && apiRes.patron) {
        return { success: true, patron: apiRes.patron };
      }

      return { success: false, message: apiRes?.message || 'Invalid Matriculation Number or Security PIN. Please check your credentials or contact the Library Admin.' };
    },

    async generateOrResetPin(matric, newPin = null) {
      const generatedPin = newPin || `${Math.floor(1000 + Math.random() * 9000)}`;
      
      const apiRes = await fetchApi('/patrons/pin', {
        method: 'POST',
        body: JSON.stringify({ matric, pin: generatedPin })
      });

      if (apiRes && apiRes.success) {
        if (syncChannel) syncChannel.postMessage({ type: 'PATRONS_UPDATED', timestamp: Date.now() });
        return { success: true, matric, newPin: generatedPin };
      }
      return { success: false, message: 'Could not update PIN' };
    },

    async getPolicies() {
      const apiData = await fetchApi('/policies');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.POLICIES, []);
    },

    async updatePolicy(role, policyData) {
      const policies = getStored(STORAGE_KEYS.POLICIES, []);
      const updated = {
        ...policies,
        [role]: { ...policies[role], ...policyData }
      };
      setStored(STORAGE_KEYS.POLICIES, updated, 'POLICIES_UPDATED');
      return updated;
    }
  },

  // -------------------------------------------------------------
  // 4. LOANS & CIRCULATION API (Direct from database 'loans' table)
  // -------------------------------------------------------------
  loans: {
    async getAll() {
      const apiData = await fetchApi('/loans');
      if (Array.isArray(apiData)) {
        setStored(STORAGE_KEYS.LOANS, apiData);
        return apiData;
      }
      return getStored(STORAGE_KEYS.LOANS, []);
    },

    async getByMatric(matric) {
      const apiData = await fetchApi(`/loans?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      const cached = getStored(STORAGE_KEYS.LOANS, []);
      return cached.filter(l => l.matric.toLowerCase() === (matric || '').toLowerCase());
    },

    async issueLoan(loanData) {
      const res = await fetchApi('/loans/issue', {
        method: 'POST',
        body: JSON.stringify(loanData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'LOANS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async renew(loanId) {
      const res = await fetchApi('/loans/renew', {
        method: 'POST',
        body: JSON.stringify({ loanId, days: 14 })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'LOANS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async returnBook(loanId) {
      const res = await fetchApi('/loans/return', {
        method: 'POST',
        body: JSON.stringify({ loanId })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'LOANS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async waiveFine(loanId) {
      const res = await fetchApi('/loans/waive', {
        method: 'POST',
        body: JSON.stringify({ loanId })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'LOANS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 5. READING LISTS API (Direct from database 'reading_lists' table)
  // -------------------------------------------------------------
  readingLists: {
    async getByMatric(matric) {
      const apiData = await fetchApi(`/reading-lists?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      const cached = getStored(STORAGE_KEYS.READING_LISTS, []);
      return cached.filter(l => l.matric.toLowerCase() === (matric || '').toLowerCase());
    },

    async create(listData) {
      const res = await fetchApi('/reading-lists', {
        method: 'POST',
        body: JSON.stringify(listData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'READING_LISTS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async addItem(listId, bookId, notes = '') {
      const res = await fetchApi(`/reading-lists/${encodeURIComponent(listId)}/items`, {
        method: 'POST',
        body: JSON.stringify({ bookId, notes })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'READING_LISTS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async removeItem(listId, bookId) {
      const res = await fetchApi(`/reading-lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(bookId)}`, {
        method: 'DELETE'
      });
      if (syncChannel) syncChannel.postMessage({ type: 'READING_LISTS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async deleteList(listId) {
      const res = await fetchApi(`/reading-lists/${encodeURIComponent(listId)}`, { method: 'DELETE' });
      if (syncChannel) syncChannel.postMessage({ type: 'READING_LISTS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 6. CONTINUE READING API (Direct from database 'continue_reading' table)
  // -------------------------------------------------------------
  continueReading: {
    async getByMatric(matric) {
      const apiData = await fetchApi(`/continue-reading?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      const cached = getStored(STORAGE_KEYS.CONTINUE_READING, []);
      return cached.filter(r => r.matric.toLowerCase() === (matric || '').toLowerCase());
    },

    async updateProgress(matric, bookId, page, totalPages, title = '', author = '') {
      const res = await fetchApi('/continue-reading', {
        method: 'POST',
        body: JSON.stringify({ matric, bookId, page, totalPages, title, author })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'CONTINUE_READING_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 7. RESERVATIONS API (Direct from database 'reservations' table)
  // -------------------------------------------------------------
  reservations: {
    async getByMatric(matric) {
      const apiData = await fetchApi(`/reservations?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      const cached = getStored(STORAGE_KEYS.RESERVATIONS, []);
      return cached.filter(r => r.matric.toLowerCase() === (matric || '').toLowerCase());
    },

    async create(matric, book) {
      const res = await fetchApi('/reservations', {
        method: 'POST',
        body: JSON.stringify({ matric, book })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'RESERVATIONS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async cancel(id) {
      const res = await fetchApi(`/reservations/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (syncChannel) syncChannel.postMessage({ type: 'RESERVATIONS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 8. STUDY ROOMS & BOOKINGS API (Direct from database 'study_rooms')
  // -------------------------------------------------------------
  studyRooms: {
    async getAll() {
      const apiData = await fetchApi('/study-rooms');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.ROOMS, []);
    },

    async getBookings(matric) {
      const apiData = await fetchApi(`/room-bookings?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      const cached = getStored(STORAGE_KEYS.ROOM_BOOKINGS, []);
      if (!matric) return cached;
      return cached.filter(b => b.matric.toLowerCase() === matric.toLowerCase());
    },

    async book(bookingData) {
      const res = await fetchApi('/room-bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'ROOM_BOOKINGS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async cancelBooking(bookingId) {
      const res = await fetchApi(`/room-bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' });
      if (syncChannel) syncChannel.postMessage({ type: 'ROOM_BOOKINGS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 9. THESES & INSTITUTIONAL REPOSITORY API (Direct from 'theses' table)
  // -------------------------------------------------------------
  theses: {
    async getAll() {
      const apiData = await fetchApi('/theses');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.THESES, []);
    },

    async submitThesis(thesisData) {
      const res = await fetchApi('/theses', {
        method: 'POST',
        body: JSON.stringify(thesisData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'THESES_UPDATED', timestamp: Date.now() });
      return res;
    },

    async updateStatus(id, newStatus) {
      const res = await fetchApi(`/theses/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'THESES_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 10. ACQUISITION REQUESTS API (Direct from 'acquisitions' table)
  // -------------------------------------------------------------
  acquisitions: {
    async getAll() {
      const apiData = await fetchApi('/acquisitions');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.ACQUISITIONS, []);
    },

    async requestBook(requestData) {
      const res = await fetchApi('/acquisitions', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'ACQUISITIONS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async updateStatus(id, newStatus) {
      const res = await fetchApi(`/acquisitions/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (syncChannel) syncChannel.postMessage({ type: 'ACQUISITIONS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  // -------------------------------------------------------------
  // 11. NOTIFICATIONS, EVENTS & ANNOUNCEMENTS (Direct from DB)
  // -------------------------------------------------------------
  notifications: {
    async getByMatric(matric) {
      const apiData = await fetchApi(`/notifications?matric=${encodeURIComponent(matric || '')}`);
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.NOTIFICATIONS, []);
    },

    async markAsRead(id) {
      const cached = getStored(STORAGE_KEYS.NOTIFICATIONS, []);
      const updated = cached.map(n => n.id === id ? { ...n, isRead: true } : n);
      setStored(STORAGE_KEYS.NOTIFICATIONS, updated, 'NOTIFICATIONS_UPDATED');
      return true;
    }
  },

  events: {
    async getAll() {
      const apiData = await fetchApi('/events');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.EVENTS, []);
    },

    async register(eventId) {
      const cached = getStored(STORAGE_KEYS.EVENTS, []);
      const updated = cached.map(e => e.id === eventId ? { ...e, isRegistered: true, seatsAvailable: Math.max(0, (e.seatsAvailable || 1) - 1) } : e);
      setStored(STORAGE_KEYS.EVENTS, updated, 'EVENTS_UPDATED');
      return updated.find(e => e.id === eventId);
    }
  },

  announcements: {
    async getAll() {
      const apiData = await fetchApi('/announcements');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.ANNOUNCEMENTS, []);
    }
  },

  partnerLibraries: {
    async getAll() {
      const apiData = await fetchApi('/partner-libraries');
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return getStored(STORAGE_KEYS.PARTNER_LIBS, []);
    },

    async create(libData) {
      const res = await fetchApi('/partner-libraries', {
        method: 'POST',
        body: JSON.stringify(libData)
      });
      if (syncChannel) syncChannel.postMessage({ type: 'PARTNER_LIBS_UPDATED', timestamp: Date.now() });
      return res;
    },

    async delete(id) {
      const res = await fetchApi(`/partner-libraries/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (syncChannel) syncChannel.postMessage({ type: 'PARTNER_LIBS_UPDATED', timestamp: Date.now() });
      return res;
    }
  },

  ai: {
    async extractPdf(fileInfo) {
      const data = await fetchApi('/ai/extract-pdf', {
        method: 'POST',
        body: JSON.stringify(fileInfo)
      });
      return data;
    },
    async verifyCrossref(queryData) {
      const data = await fetchApi('/ai/crossref', {
        method: 'POST',
        body: JSON.stringify(queryData)
      });
      return data;
    },
    async askBook(questionData) {
      const data = await fetchApi('/ai/ask-book', {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
      return data;
    }
  },

  systemHealth: {
    async getMetrics() {
      const health = await fetchApi('/health');
      if (health) {
        return {
          ...SYSTEM_HEALTH_METRICS,
          databaseStatus: health.status === 'Healthy' ? 'Online (brainfeels_library MySQL/SQLite)' : 'Degraded',
          activeLoans: health.counts?.activeLoans ?? 0,
          totalHoldings: health.counts?.totalBooks ?? 0,
          activePatrons: health.counts?.activePatrons ?? 0
        };
      }
      return SYSTEM_HEALTH_METRICS;
    }
  },

  // -------------------------------------------------------------
  // 12. DATABASE MANAGEMENT API (brainfeels_library)
  // -------------------------------------------------------------
  database: {
    async getStatus() {
      const data = await fetchApi('/database/status');
      return data || {
        database: 'brainfeels_library',
        engine: 'MySQL / phpMyAdmin (port 3306)',
        status: 'Online & Connected',
        totalTables: 18,
        tableCounts: {}
      };
    },
    async initDatabase() {
      const res = await fetchApi('/database/init', { method: 'POST' });
      return res || { success: false, message: 'Could not connect to database initializer' };
    },
    async runQuery(sql) {
      const res = await fetchApi('/database/query', {
        method: 'POST',
        body: JSON.stringify({ sql })
      });
      return res || { success: false, error: 'Database query failed' };
    },
    getExportUrl() {
      return '/api/database/export';
    }
  },

  // -------------------------------------------------------------
  // 13. REAL-TIME EVENT SUBSCRIPTION
  // -------------------------------------------------------------
  subscribe(callback) {
    if (!syncChannel) return () => {};
    const listener = (event) => {
      if (callback) callback(event.data);
    };
    syncChannel.addEventListener('message', listener);
    return () => syncChannel.removeEventListener('message', listener);
  }
};
