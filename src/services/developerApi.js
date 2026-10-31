import { getApiBase } from '../api/libraryApi';

export const DEV_DEFAULT_PASSKEY = 'FCC@DevMaster2026!#';

/**
 * Resilient Central API Dispatcher for Lead Developer operations.
 * Resolves across Vite Dev Server, XAMPP Apache (/fcclibrary/backend/public),
 * LAN IP hosts, and cPanel Production (fccibadanlibrary.com.ng).
 */
export async function developerApiCall(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBase();

  let primaryUrl;
  if (cleanEndpoint.startsWith('/api/')) {
    primaryUrl = base.endsWith('/api') ? `${base}${cleanEndpoint.replace('/api', '')}` : `${base}${cleanEndpoint}`;
  } else {
    primaryUrl = `${base}${cleanEndpoint}`;
  }

  const candidateUrls = [primaryUrl];

  if (typeof window !== 'undefined') {
    const isProd = window.location.hostname.includes('fccibadanlibrary.com.ng');
    const stdApiUrl = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;

    if (isProd) {
      if (!candidateUrls.includes(stdApiUrl)) candidateUrls.push(stdApiUrl);
      const fullProdUrl = `https://fccibadanlibrary.com.ng${stdApiUrl}`;
      if (!candidateUrls.includes(fullProdUrl)) candidateUrls.push(fullProdUrl);
      const backendPublicUrl = `/backend/public${stdApiUrl}`;
      if (!candidateUrls.includes(backendPublicUrl)) candidateUrls.push(backendPublicUrl);
    } else {
      if (!candidateUrls.includes(stdApiUrl)) candidateUrls.push(stdApiUrl);
      if (window.location.pathname.includes('/fcclibrary')) {
        const xamppPath = `/fcclibrary/backend/public${stdApiUrl}`;
        if (!candidateUrls.includes(xamppPath)) candidateUrls.push(xamppPath);
      }
    }
  }

  const passkey = options.passkey || DEV_DEFAULT_PASSKEY;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const defaultHeaders = {
    'Accept': 'application/json',
    'X-Developer-Passkey': passkey,
    'Authorization': `Bearer ${passkey}`,
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {})
  };

  const finalHeaders = {
    ...defaultHeaders,
    ...(options.headers || {})
  };

  let formattedBody = options.body;
  if (options.body && !isFormData && typeof options.body === 'object') {
    formattedBody = JSON.stringify(options.body);
  }

  let lastError = null;
  for (const rawUrl of candidateUrls) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    const targetUrl = rawUrl.includes('passkey=') ? rawUrl : `${rawUrl}${sep}passkey=${encodeURIComponent(passkey)}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;
    try {
      const res = await fetch(targetUrl, {
        ...options,
        signal: controller ? controller.signal : undefined,
        headers: finalHeaders,
        body: formattedBody
      });
      if (timeoutId) clearTimeout(timeoutId);

      // If this URL 404s/502s and there are alternative candidate paths, try the next candidate
      if ((res.status === 404 || res.status === 502 || res.status === 503) && candidateUrls.indexOf(rawUrl) < candidateUrls.length - 1) {
        continue;
      }
      return res;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error(`Failed to dispatch developer request to ${cleanEndpoint}`);
}

/**
 * Departmental Staff & Workspaces Developer Operations
 */
export async function fetchHodStaff(params = {}) {
  const query = new URLSearchParams();
  if (params.department_code) query.append('department_code', params.department_code);
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const res = await developerApiCall(`/api/developer/hod-staff${qStr}`);
  return res.json();
}

export async function createHodStaff(payload) {
  const res = await developerApiCall('/api/developer/hod-staff', {
    method: 'POST',
    body: payload
  });
  return res.json();
}

export async function updateHodStaff(id, payload) {
  const res = await developerApiCall(`/api/developer/hod-staff/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload
  });
  return res.json();
}

export async function deleteHodStaff(id) {
  const res = await developerApiCall(`/api/developer/hod-staff/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchStaffFeaturesCatalog() {
  const res = await developerApiCall('/api/developer/hod-staff/features-catalog');
  return res.json();
}

export async function saveStaffFeaturesCatalog(features) {
  const res = await developerApiCall('/api/developer/hod-staff/features-catalog', {
    method: 'POST',
    body: { features }
  });
  return res.json();
}

export async function fetchStaffActivityLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.department) query.append('department', params.department);
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const res = await developerApiCall(`/api/developer/hod-staff/activities${qStr}`);
  return res.json();
}

/**
 * Universal Departmental Staff Action Logger
 * Called by frontend whenever a staff member operates on the system
 */
export async function logStaffActivity(payload) {
  try {
    const res = await fetch('/api/hod/staff/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      // Fallback for XAMPP path
      const base = getApiBase();
      const fallbackUrl = base.endsWith('/api') ? `${base}/hod/staff/log-activity` : `${base}/api/hod/staff/log-activity`;
      await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (err) {
    console.warn('[StaffActivityLogger] Log write failed non-blockingly:', err);
  }
}

/**
 * Maintenance & Broadcast Matrix APIs
 */
export async function fetchMaintenanceBroadcasts() {
  const res = await developerApiCall('/api/developer/maintenance-broadcasts');
  return res.json();
}

export async function updateMaintenanceBroadcast(payload) {
  const res = await developerApiCall('/api/developer/maintenance-broadcasts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchSystemBroadcast(role = 'student') {
  try {
    const res = await fetch(`/api/system/maintenance-broadcasts?role=${encodeURIComponent(role)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) return await res.json();
    
    const base = getApiBase();
    const fallbackUrl = base.endsWith('/api')
      ? `${base}/system/maintenance-broadcasts?role=${encodeURIComponent(role)}`
      : `${base}/api/system/maintenance-broadcasts?role=${encodeURIComponent(role)}`;
    const fRes = await fetch(fallbackUrl, { headers: { 'Accept': 'application/json' } });
    return await fRes.json();
  } catch (err) {
    console.warn('[fetchSystemBroadcast] Failed to load broadcast:', err);
    return { success: false, broadcast: null };
  }
}


