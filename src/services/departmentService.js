// =========================================================================
// ACADEMIC DEPARTMENTS MANAGEMENT SERVICE
// Federal Co-operative College, Ibadan (FCC Ibadan)
// Centralized register of Academic Units, HOD Portals, and Course Reserves
// Exclusively synchronized with Laravel Backend & Database
// =========================================================================

const STORAGE_KEY = 'fcc_departments_v48_gov';

export const departmentService = {
  _cached: null,
  _fetchPromise: null,

  fetchDepartments: async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          departmentService._cached = data;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
              window.dispatchEvent(new CustomEvent('fcc-departments-updated', { detail: data }));
            } catch (e) {}
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('departmentService: Failed to fetch departments from backend:', err);
    }
    return departmentService._cached || [];
  },

  getDepartments: () => {
    if (departmentService._cached && departmentService._cached.length > 0) {
      return departmentService._cached;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            departmentService._cached = parsed;
            // Background re-fetch to ensure fresh database counts
            departmentService.fetchDepartments();
            return parsed;
          }
        } catch (e) {}
      }
      departmentService.fetchDepartments();
    }
    return departmentService._cached || [];
  },

  getDepartmentByCode: (code) => {
    const list = departmentService.getDepartments();
    if (!list || list.length === 0) return null;
    return list.find(d => d.code?.toUpperCase() === (code || '').toUpperCase()) || list[0];
  },

  addDepartment: async (dept) => {
    const code = (dept.code || 'NEW').trim().toUpperCase();
    const payload = {
      name: dept.name?.trim() || 'New Academic Department',
      code: code,
      hod_name: dept.hod?.trim() || dept.hod_name?.trim() || 'Department Head',
      hod_email: dept.hodEmail?.trim() || dept.hod_email?.trim() || `hod.${code.toLowerCase()}@fccibadan.edu.ng`,
      hod_pin: dept.pin?.trim() || dept.hod_pin?.trim() || '1234',
      student_count: parseInt(dept.student_count || dept.studentCount) || 0,
      faculty_count: parseInt(dept.faculty_count) || 8
    };

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await departmentService.fetchDepartments();
        return data.department;
      }
      throw new Error(data.message || 'Error saving department to database.');
    } catch (err) {
      console.error('Error saving department to backend:', err);
      throw err;
    }
  },

  updateDepartment: async (code, updates) => {
    const cleanCode = (code || '').trim().toUpperCase();
    const payload = {
      ...updates,
      code: cleanCode
    };
    if (updates.hod && !payload.hod_name) payload.hod_name = updates.hod;
    if (updates.hodEmail && !payload.hod_email) payload.hod_email = updates.hodEmail;
    if (updates.pin && !payload.hod_pin) payload.hod_pin = updates.pin;
    if (updates.studentCount && !payload.student_count) payload.student_count = updates.studentCount;

    try {
      const res = await fetch(`/api/departments/${encodeURIComponent(cleanCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await departmentService.fetchDepartments();
        return data.department;
      }
      throw new Error(data.message || 'Error updating department in database.');
    } catch (err) {
      console.error('Error updating department in backend:', err);
      throw err;
    }
  },

  deleteDepartment: async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    try {
      const res = await fetch(`/api/departments/${encodeURIComponent(cleanCode)}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await departmentService.fetchDepartments();
        return true;
      }
      throw new Error(data.message || 'Error deleting department from database.');
    } catch (err) {
      console.error('Error deleting department from backend:', err);
      throw err;
    }
  },

  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e.detail);
    window.addEventListener('fcc-departments-updated', handler);
    return () => window.removeEventListener('fcc-departments-updated', handler);
  }
};

// Initial background prefetch when running in browser
if (typeof window !== 'undefined') {
  departmentService.fetchDepartments();
}

