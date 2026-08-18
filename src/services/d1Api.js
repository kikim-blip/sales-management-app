// src/services/d1Api.js
// Cloudflare D1 Workers API 클라이언트
// Google Sheets API를 완전 대체합니다

// Workers API 엔드포인트 (배포 후 실제 URL로 자동 설정)
const API_BASE = import.meta.env.VITE_WORKERS_API_URL || 'https://sales-management-api.richkikim.workers.dev';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API Error ${res.status}`);
  }
  return res.json();
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
