// Safe storage boundary.
// Some embedded/file:// browsers block window.localStorage entirely. Direct access
// throws before the app can enter the canvas, so every module should go through
// this small wrapper.

const MemoryStorage = (() => {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(String(key));
    },
    clear() {
      data.clear();
    }
  };
})();

const APP_CHANNEL = (() => {
  const meta = document.querySelector('meta[name="xiaoma-ai-channel"]')?.content;
  const value = String(meta || window.__XIAOMA_AI_CHANNEL__ || '').trim().toLowerCase();
  return value === 'dev' || value === 'debug' || value === 'test' ? 'dev' : 'stable';
})();
const STORAGE_NAMESPACE = APP_CHANNEL === 'stable' ? '' : `_${APP_CHANNEL}`;

function appChannel() {
  return APP_CHANNEL;
}

function isDevChannel() {
  return APP_CHANNEL !== 'stable';
}

function namespacedStorageKey(key) {
  const raw = String(key || '');
  if (!raw || !STORAGE_NAMESPACE) return raw;
  return raw.endsWith(STORAGE_NAMESPACE) ? raw : raw + STORAGE_NAMESPACE;
}

function getSafeStorage() {
  try {
    const storage = window.localStorage;
    const probe = '__canvas_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch (err) {
    console.warn('[小马AI画布] localStorage unavailable, falling back to memory storage:', err.message);
    return MemoryStorage;
  }
}

const SafeStorage = getSafeStorage();

function storageGet(key, fallback = '') {
  try {
    const value = SafeStorage.getItem(namespacedStorageKey(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    SafeStorage.setItem(namespacedStorageKey(key), value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(key) {
  try {
    SafeStorage.removeItem(namespacedStorageKey(key));
    return true;
  } catch {
    return false;
  }
}

function storageClear() {
  try {
    SafeStorage.clear();
    return true;
  } catch {
    return false;
  }
}
