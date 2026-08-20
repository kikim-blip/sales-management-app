import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiError, getCacheEntry, setCacheEntry } from './d1Api.js';

const makeMemoryStorage = () => {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(String(key), String(value)); },
    removeItem(key) { store.delete(String(key)); },
    clear() { store.clear(); },
  };
};

globalThis.localStorage = makeMemoryStorage();

test('normalizeApiError converts network failure to user-friendly message', () => {
  assert.equal(normalizeApiError(new Error('fetch failed')), '네트워크 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  assert.equal(normalizeApiError(new Error('API Error 500')), '서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.');
});

test('cache helpers keep fresh data and expire stale data', () => {
  const key = 'test-cache';
  setCacheEntry(key, { ok: true }, 1000);
  assert.deepEqual(getCacheEntry(key, null, 1000), { ok: true });

  const expired = {
    value: { ok: false },
    savedAt: Date.now() - 2000,
    expiresAt: Date.now() - 1000,
  };
  globalThis.localStorage.setItem(`d1_cache_${key}`, JSON.stringify(expired));
  assert.equal(getCacheEntry(key, null, 1000), null);
});
