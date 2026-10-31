/**
 * Device Credential Store for FCC Mobile Login Pass
 * Uses IndexedDB for secure, origin-isolated device token persistence
 * with graceful fallback to localStorage.
 */

const DB_NAME = 'fcc-qr-auth';
const STORE_NAME = 'credentials';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function operation(mode, action) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = action(store);

      tx.oncomplete = () => {
        db.close();
        resolve(result?.result !== undefined ? result.result : null);
      };

      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    // Graceful fallback to localStorage
    return null;
  }
}

export async function saveDeviceToken(token) {
  try {
    localStorage.setItem('fcc_device_token', token);
    await operation('readwrite', (store) => store.put(token, 'token'));
  } catch (e) {}
}

export async function getDeviceToken() {
  try {
    const idbToken = await operation('readonly', (store) => store.get('token'));
    if (idbToken) return idbToken;
  } catch (e) {}
  return localStorage.getItem('fcc_device_token');
}

export async function removeDeviceToken() {
  try {
    localStorage.removeItem('fcc_device_token');
    await operation('readwrite', (store) => store.delete('token'));
  } catch (e) {}
}

export async function clearAllDeviceData() {
  try {
    localStorage.removeItem('fcc_device_token');
    localStorage.removeItem('fcc_mobile_pass_vault');
    localStorage.removeItem('fcc_mobile_pass_user');
    localStorage.removeItem('fcc_mobile_pass_installed');
    await operation('readwrite', (store) => {
      try { store.delete('token'); } catch (e) {}
      try { store.delete('profile'); } catch (e) {}
      if (typeof store.clear === 'function') {
        try { store.clear(); } catch (e) {}
      }
    });
  } catch (e) {}
}

export async function saveDeviceProfile(profile) {
  try {
    const json = JSON.stringify(profile);
    localStorage.setItem('fcc_mobile_pass_vault', json);
    localStorage.setItem('fcc_mobile_pass_installed', 'true');
    await operation('readwrite', (store) => store.put(profile, 'profile'));
  } catch (e) {}
}

export async function getDeviceProfile() {
  try {
    const idbProfile = await operation('readonly', (store) => store.get('profile'));
    if (idbProfile) return idbProfile;
  } catch (e) {}
  const raw = localStorage.getItem('fcc_mobile_pass_vault');
  return raw ? JSON.parse(raw) : null;
}
