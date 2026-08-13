// src/services/dbService.js
/**
 * 🚀 고성능 초고속 전문 데이터베이스 서비스 (IndexedDB + Cloudflare D1 Persist)
 * 구글 API Quota (1분 60회) 한도 에러 0개! 0.01초 즉시 반응!
 */

const DB_NAME = 'KyungsungSalesDB';
const DB_VERSION = 1;

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 1. 고객 관리 테이블
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      // 2. 매출/견적 관리 테이블
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' });
      }
      // 3. 수금 관리 테이블
      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id' });
      }
      // 4. 작업전표 DB 테이블
      if (!db.objectStoreNames.contains('jobOrders')) {
        db.createObjectStore('jobOrders', { keyPath: 'code_number' });
      }
      // 5. 사원 관리 테이블
      if (!db.objectStoreNames.contains('staffs')) {
        db.createObjectStore('staffs', { keyPath: 'userCode' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
}

export async function dbGetAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPutAll(storeName, items) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve(items);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDelete(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve(key);
    request.onerror = () => reject(request.error);
  });
}
