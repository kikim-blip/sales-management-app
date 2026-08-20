// src/services/d1Api.js
// Cloudflare D1 Workers API 클라이언트
// Google Sheets API를 완전 대체합니다

// Workers API 엔드포인트 (배포 후 실제 URL로 자동 설정)
const viteEnv = typeof import.meta !== 'undefined' && import.meta && import.meta.env ? import.meta.env : {};
const API_BASE = viteEnv.VITE_WORKERS_API_URL || 'https://sales-management-api.richkikim.workers.dev';
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function normalizeApiError(error) {
  const message = (error && (error.message || String(error))) || '';

  if (!message) {
    return '서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (/fetch.*failed|network|Failed to fetch|load failed/i.test(message)) {
    return '네트워크 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (/API Error|status|response/i.test(message) || /500|502|503|504/.test(message)) {
    return '서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.';
  }

  return message;
}

export function setCacheEntry(key, value, ttlMs = DEFAULT_CACHE_TTL_MS) {
  try {
    const payload = {
      value,
      savedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(`d1_cache_${key}`, JSON.stringify(payload));
    return payload;
  } catch (e) {
    console.warn(`캐시 저장 실패: ${key}`, e);
    return null;
  }
}

export function getCacheEntry(key, fallback = null, ttlMs = DEFAULT_CACHE_TTL_MS) {
  try {
    const raw = localStorage.getItem(`d1_cache_${key}`);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const now = Date.now();
    const isExpired = typeof parsed.expiresAt === 'number' ? now > parsed.expiresAt : now - (parsed.savedAt || now) > ttlMs;

    if (isExpired) {
      localStorage.removeItem(`d1_cache_${key}`);
      return fallback;
    }

    return parsed.value ?? fallback;
  } catch (e) {
    console.warn(`캐시 로드 실패: ${key}`, e);
    return fallback;
  }
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? MAX_RETRIES;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        signal: controller.signal,
        ...options,
      });

      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        const msg = payload?.error || payload?.message || response.statusText || `API Error ${response.status}`;
        throw new Error(msg);
      }

      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (error) {
      const message = normalizeApiError(error);
      const shouldRetry = attempt < retries && /네트워크|fetch|timeout|abort|API Error|500|502|503|504/i.test(message);

      if (shouldRetry) {
        await sleep(400 * (attempt + 1));
        continue;
      }

      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.');
}

// ─── 배치 전체 조회 (초기 로딩 1회 API 호출) ─────────────────────────────
export async function fetchAllD1Data() {
  return apiFetch('/api/batch');
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
export async function fetchCustomers() {
  return apiFetch('/api/customers');
}

export async function createCustomer(data) {
  return apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCustomerApi(id, data) {
  return apiFetch(`/api/customers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCustomerApi(id) {
  return apiFetch(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── SALES ───────────────────────────────────────────────────────────────────
export async function fetchSales(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/sales${qs ? '?' + qs : ''}`);
}

export async function createSaleApi(data) {
  return apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSaleApi(id, data) {
  return apiFetch(`/api/sales/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteSaleApi(id) {
  return apiFetch(`/api/sales/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export async function fetchPayments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/payments${qs ? '?' + qs : ''}`);
}

export async function createPaymentApi(data) {
  return apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePaymentApi(id, data) {
  return apiFetch(`/api/payments/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePaymentApi(id) {
  return apiFetch(`/api/payments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── JOB ORDERS (작업전표) ────────────────────────────────────────────────────
export async function fetchJobOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/job-orders${qs ? '?' + qs : ''}`);
}

export async function createJobOrderApi(data) {
  return apiFetch('/api/job-orders', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateJobOrderApi(id, data) {
  return apiFetch(`/api/job-orders/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteJobOrderApi(id) {
  return apiFetch(`/api/job-orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── STAFFS ──────────────────────────────────────────────────────────────────
export async function fetchStaffs() {
  return apiFetch('/api/staffs');
}

export async function upsertStaffApi(data) {
  return apiFetch('/api/staffs', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteStaffApi(identifier) {
  return apiFetch(`/api/staffs/${encodeURIComponent(identifier)}`, { method: 'DELETE' });
}

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
export async function fetchDepartments() {
  return apiFetch('/api/departments');
}

export async function createDepartmentApi(name) {
  return apiFetch('/api/departments', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function updateDepartmentApi(oldName, newName) {
  return apiFetch(`/api/departments/${encodeURIComponent(oldName)}`, {
    method: 'PUT', body: JSON.stringify({ newName }),
  });
}

export async function deleteDepartmentApi(name) {
  return apiFetch(`/api/departments/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

// ─── TEAMS ───────────────────────────────────────────────────────────────────
export async function fetchTeams() {
  return apiFetch('/api/teams');
}

export async function createTeamApi(name) {
  return apiFetch('/api/teams', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function updateTeamApi(oldName, newName) {
  return apiFetch(`/api/teams/${encodeURIComponent(oldName)}`, {
    method: 'PUT', body: JSON.stringify({ newName }),
  });
}

export async function deleteTeamApi(name) {
  return apiFetch(`/api/teams/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

// ─── POSTS (업무 게시판 / 자료실) ─────────────────────────────────────────────
export async function fetchPosts() {
  return apiFetch('/api/posts');
}

export async function createPostApi(data) {
  return apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePostApi(id, data) {
  return apiFetch(`/api/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePostApi(id) {
  return apiFetch(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── MEMOS (포스트잇 스티키 메모) ─────────────────────────────────────────────
export async function fetchMemos() {
  return apiFetch('/api/memos');
}

export async function createMemoApi(data) {
  return apiFetch('/api/memos', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMemoApi(id, data) {
  return apiFetch(`/api/memos/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteMemoApi(id) {
  return apiFetch(`/api/memos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── AUDIT LOGS (시스템 조작 로그) ──────────────────────────────────────────
export async function fetchLogs() {
  return apiFetch('/api/logs');
}

export async function createLogApi(data) {
  return apiFetch('/api/logs', { method: 'POST', body: JSON.stringify(data) });
}

export async function clearLogsApi() {
  return apiFetch('/api/logs', { method: 'DELETE' });
}
