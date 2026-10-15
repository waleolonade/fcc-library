// =========================================================================
// INSTITUTIONAL CONFIGURATION & DELEGATION SERVICE
// Centralized state manager for Federal Co-operative College, Ibadan (FCC)
// Synchronized with Laravel API (/api/institution/config) & SQLite/MySQL
// =========================================================================

export const DEFAULT_INSTITUTION = {
  name: "Federal Co-operative College, Ibadan",
  shortName: "FCC Ibadan",
  motto: "Pioneering Co-operative Excellence & Technological Advancement",
  established: 1943,
  campus: "Eleyele, Ibadan, Oyo State, Nigeria",
  systemVersion: "v4.8-LSP Enterprise (Localhost Edition)",
  currentSession: "2026/2027 Academic Session",
  currentSemester: "Second Semester",
  todayHours: "08:00 AM – 08:00 PM (Extended Exam Hours: 24/7 Virtual Hub)"
};

class InstitutionalConfigService {
  constructor() {
    this.storageKey = 'fcc_institution_config_v2';
    this.permsKey = 'fcc_institution_permissions_v2';
    this.current = this.loadFromStorage();
    this.permissions = this.loadPermissionsFromStorage();

    // Fetch initial config from backend API
    this.fetchFromApi().catch(() => {});

    // Listen for cross-tab storage changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            this.current = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch (err) {}
        }
        if (e.key === this.permsKey && e.newValue) {
          try {
            this.permissions = JSON.parse(e.newValue);
          } catch (err) {}
        }
      });
    }
  }

  loadFromStorage() {
    if (typeof window === 'undefined') return { ...DEFAULT_INSTITUTION };
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...DEFAULT_INSTITUTION, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return { ...DEFAULT_INSTITUTION };
  }

  loadPermissionsFromStorage() {
    if (typeof window === 'undefined') return { admin_allowed: true, allowed_hod_depts: ['CSC', 'CEM'] };
    try {
      const saved = localStorage.getItem(this.permsKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return { admin_allowed: true, allowed_hod_depts: ['CSC', 'CEM'] };
  }

  getInstitution() {
    return { ...this.current };
  }

  getPermissions() {
    return { ...this.permissions };
  }

  async fetchFromApi() {
    try {
      const res = await fetch('/api/institution/config');
      if (res.ok) {
        const data = await res.json();
        if (data.institution) {
          this.current = { ...DEFAULT_INSTITUTION, ...data.institution };
          localStorage.setItem(this.storageKey, JSON.stringify(this.current));
        }
        if (data.permissions) {
          this.permissions = data.permissions;
          localStorage.setItem(this.permsKey, JSON.stringify(this.permissions));
        }
        this.notifyListeners();
        return { institution: this.current, permissions: this.permissions };
      }
    } catch (e) {}
    return { institution: this.current, permissions: this.permissions };
  }

  async saveInstitution(newValues, actor = 'Chief Librarian', role = 'admin', department = '') {
    const updated = { ...this.current, ...newValues };
    this.current = updated;
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.notifyListeners();

    try {
      const res = await fetch('/api/institution/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          department,
          actor,
          institution: updated
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save institutional settings');
      }
      if (data.institution) {
        this.current = { ...DEFAULT_INSTITUTION, ...data.institution };
        localStorage.setItem(this.storageKey, JSON.stringify(this.current));
      }
      if (data.permissions) {
        this.permissions = data.permissions;
        localStorage.setItem(this.permsKey, JSON.stringify(this.permissions));
      }
      this.notifyListeners();
      return { success: true, institution: this.current };
    } catch (err) {
      console.warn('Backend sync failed, stored locally:', err);
      return { success: true, localOnly: true, institution: updated };
    }
  }

  async updatePermissions(permissionsPayload, devPasskey = 'FCC@DevMaster2026!#') {
    try {
      const res = await fetch('/api/developer/institution/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Passkey': devPasskey
        },
        body: JSON.stringify(permissionsPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.permissions = data.permissions || permissionsPayload;
        localStorage.setItem(this.permsKey, JSON.stringify(this.permissions));
        this.notifyListeners();
        return { success: true, permissions: this.permissions };
      } else {
        throw new Error(data.error || 'Failed to update permissions');
      }
    } catch (err) {
      this.permissions = permissionsPayload;
      localStorage.setItem(this.permsKey, JSON.stringify(this.permissions));
      this.notifyListeners();
      return { success: true, localOnly: true, permissions: permissionsPayload };
    }
  }

  notifyListeners() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-institution-updated', {
        detail: {
          institution: this.current,
          permissions: this.permissions
        }
      }));
    }
  }
}

export const institutionalConfigService = new InstitutionalConfigService();
export default institutionalConfigService;
