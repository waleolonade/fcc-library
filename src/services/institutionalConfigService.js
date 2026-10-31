// =========================================================================
// INSTITUTIONAL CONFIGURATION & DELEGATION SERVICE
// Centralized state manager for Federal Co-operative College, Ibadan (FCC)
// Synchronized with Laravel API (/api/institution/config) & SQLite/MySQL
// =========================================================================

import { developerConfigService } from './developerConfigService';
import { developerApiCall, DEV_DEFAULT_PASSKEY } from './developerApi';

export const DEFAULT_INSTITUTION = {
  name: "Federal Co-operative College, Ibadan",
  shortName: "FCC Ibadan",
  motto: "Pioneering Co-operative Excellence & Technological Advancement",
  established: 1943,
  campus: "Eleyele, Ibadan, Oyo State, Nigeria",
  systemVersion: "v4.8-LSP Enterprise (Production Edition)",
  currentSession: "2026/2027 Academic Session",
  currentSemester: "Second Semester",
  todayHours: "08:00 AM – 08:00 PM (Extended Exam Hours: 24/7 Virtual Hub)"
};

class InstitutionalConfigService {
  constructor() {
    this.storageKey = 'fcc_institution_config_v2';
    this.permsKey = 'fcc_institution_permissions_v2';
    this.listeners = [];
    this.current = this.loadFromStorage();
    this.permissions = this.loadPermissionsFromStorage();

    // Fetch initial config from backend API
    this.fetchFromApi().catch(() => {});

    // Listen for developer config updates to keep institutional state in sync
    if (typeof window !== 'undefined') {
      window.addEventListener('fcc-config-updated', (e) => {
        if (e.detail?.branding) {
          this.current = {
            ...this.current,
            name: e.detail.branding.institutionName || this.current.name,
            shortName: e.detail.branding.shortName || this.current.shortName,
            motto: e.detail.branding.slogan || this.current.motto
          };
          this.notifyListeners();
        }
      });

      // Listen for cross-tab storage changes
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
            this.notifyListeners();
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

  /**
   * Returns live institutional configuration.
   * Lead Developer modifications on Developer Master Portal take HIGHEST PRIORITY.
   */
  getInstitution() {
    let devBranding = {};
    try {
      devBranding = developerConfigService.getConfig()?.branding || {};
    } catch (e) {}

    return {
      ...this.current,
      ...(devBranding.institutionName ? { name: devBranding.institutionName } : {}),
      ...(devBranding.shortName ? { shortName: devBranding.shortName } : {}),
      ...(devBranding.slogan ? { motto: devBranding.slogan } : {}),
      ...(devBranding.libraryTitle ? { libraryTitle: devBranding.libraryTitle } : {}),
      ...(devBranding.logoUrl ? { logoUrl: devBranding.logoUrl } : {})
    };
  }

  getPermissions() {
    return { ...this.permissions };
  }

  async fetchFromApi() {
    try {
      const res = await developerApiCall('/api/institution/config');
      if (res && res.ok) {
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
        return { institution: this.getInstitution(), permissions: this.permissions };
      }
    } catch (e) {}
    return { institution: this.getInstitution(), permissions: this.permissions };
  }

  async saveInstitution(newValues, actor = 'Chief Librarian', role = 'admin', department = '') {
    const updated = { ...this.current, ...newValues };
    this.current = updated;
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.notifyListeners();

    // If role is developer, immediately sync with developer master config
    if (role === 'developer') {
      try {
        const curDev = developerConfigService.getConfig();
        const updatedDev = {
          ...curDev,
          branding: {
            ...curDev.branding,
            institutionName: updated.name || curDev.branding.institutionName,
            shortName: updated.shortName || curDev.branding.shortName,
            slogan: updated.motto || curDev.branding.slogan
          }
        };
        developerConfigService.saveConfig(updatedDev);
      } catch (e) {}
    }

    try {
      const res = await developerApiCall('/api/institution/config', {
        method: 'POST',
        body: {
          role,
          department,
          actor,
          institution: updated
        }
      });

      const data = await res.json().catch(() => ({}));
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
      return { success: true, institution: this.getInstitution() };
    } catch (err) {
      console.warn('Backend sync failed, stored locally:', err);
      return { success: true, localOnly: true, institution: this.getInstitution() };
    }
  }

  async updatePermissions(permissionsPayload, devPasskey = DEV_DEFAULT_PASSKEY) {
    try {
      const res = await developerApiCall('/api/developer/institution/permissions', {
        method: 'POST',
        passkey: devPasskey,
        body: permissionsPayload
      });
      const data = await res.json().catch(() => ({}));
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

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    const inst = this.getInstitution();
    const perms = this.getPermissions();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fcc-institution-updated', {
        detail: {
          institution: inst,
          permissions: perms
        }
      }));
    }
    this.listeners.forEach(cb => {
      try {
        cb(inst, perms);
      } catch (e) {}
    });
  }
}

export const institutionalConfigService = new InstitutionalConfigService();
export default institutionalConfigService;

