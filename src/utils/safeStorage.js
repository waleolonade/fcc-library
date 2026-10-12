/**
 * Global localStorage quota guard.
 *
 * Books / uploads now carry base64 PDFs and cover images (file_data_url, cover_image ...).
 * Caching those arrays in localStorage overflows the ~5MB browser quota and throws
 * QuotaExceededError inside React effects, which unmounts the whole app (blank page).
 *
 * This patch makes every localStorage.setItem call safe:
 *  1. Try the normal write.
 *  2. On quota error, strip heavy base64 "data:" payloads from the JSON and retry
 *     (the database remains the source of truth for the actual files).
 *  3. If it still fails, drop the key silently instead of crashing the UI.
 */
const HEAVY_THRESHOLD = 2048; // strings longer than this that look like data URLs get stripped

function stripHeavyPayloads(value) {
  if (Array.isArray(value)) return value.map(stripHeavyPayloads);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string' && v.length > HEAVY_THRESHOLD && (v.startsWith('data:') || /^[A-Za-z0-9+/=\s]+$/.test(v.slice(0, 200)))) {
        out[k] = '';
      } else {
        out[k] = stripHeavyPayloads(v);
      }
    }
    return out;
  }
  return value;
}

function isQuotaError(err) {
  return err && (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 || err.code === 1014
  );
}

export function installStorageGuard() {
  if (typeof window === 'undefined' || !window.Storage || window.__fccStorageGuardInstalled) return;
  window.__fccStorageGuardInstalled = true;

  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function guardedSetItem(key, value) {
    try {
      return originalSetItem.call(this, key, value);
    } catch (err) {
      if (!isQuotaError(err)) {
        console.warn(`[storage] write failed for "${key}":`, err);
        return undefined;
      }
      // Retry with heavy base64 payloads removed
      try {
        const parsed = JSON.parse(value);
        const slim = JSON.stringify(stripHeavyPayloads(parsed));
        try {
          this.removeItem(key);
        } catch { /* ignore */ }
        return originalSetItem.call(this, key, slim);
      } catch {
        try {
          this.removeItem(key);
        } catch { /* ignore */ }
        console.warn(`[storage] quota exceeded, skipped caching "${key}" (data stays in database).`);
        return undefined;
      }
    }
  };

  // One-time cleanup: slim down any oversized cached entries already stored
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const raw = key ? localStorage.getItem(key) : null;
      if (raw && raw.length > 500000) {
        try {
          const slim = JSON.stringify(stripHeavyPayloads(JSON.parse(raw)));
          originalSetItem.call(localStorage, key, slim);
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  } catch { /* ignore */ }
}

/** Safe JSON parse helper that never throws */
export function safeJsonParse(value, fallback) {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
