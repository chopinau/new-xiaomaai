// IndexedDB image store — unlimited capacity, replaces localStorage for base64 blobs.

const DB_NAME = appChannel && appChannel() === 'stable'
  ? 'pipeline_canvas_db'
  : `pipeline_canvas_db_${appChannel ? appChannel() : 'dev'}`;
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
  return dbPromise;
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDel(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbKeys() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ===== STORAGE QUOTA CHECK =====
let quotaWarned = false;

async function checkStorageQuota() {
  if (!navigator.storage || !navigator.storage.estimate) return;
  try {
    const est = await navigator.storage.estimate();
    if (!est.quota || !est.usage) return;
    const used = est.usage;
    const total = est.quota;
    const pct = used / total;
    const remaining = total - used;
    const remainingPct = remaining / total;
    if (remainingPct < 0.10 && !quotaWarned) {
      quotaWarned = true;
      toast(`⚠️ 存储空间即将耗尽（剩余 ${(remainingPct * 100).toFixed(1)}%），建议尽快清理作品`, 'error', 6000);
    }
  } catch (e) {
    // ignore
  }
}

// 每次保存后检查
function triggerQuotaCheck() {
  // 延迟执行，避免阻塞保存
  setTimeout(checkStorageQuota, 500);
}
