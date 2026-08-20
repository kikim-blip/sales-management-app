// src/context/DataContext.jsx
// Google Sheets → Cloudflare D1 (Workers API) 완전 마이그레이션 버전
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleAuth } from './GoogleAuthContext';
import { sendWebhookEvent } from '../services/webhookService';
import {
  fetchAllD1Data,
  createCustomer, updateCustomerApi, deleteCustomerApi,
  createSaleApi, updateSaleApi, deleteSaleApi,
  createPaymentApi, updatePaymentApi, deletePaymentApi,
  createJobOrderApi, updateJobOrderApi, deleteJobOrderApi,
  upsertStaffApi, deleteStaffApi,
  createDepartmentApi, updateDepartmentApi, deleteDepartmentApi,
  createTeamApi, updateTeamApi, deleteTeamApi,
  createPostApi, updatePostApi, deletePostApi,
  createMemoApi, updateMemoApi, deleteMemoApi,
  createLogApi, clearLogsApi,
} from '../services/d1Api';

const DataContext = createContext();

// 로컬 스토리지 캐시 관리 헬퍼 (오프라인 폴백용)
const saveCache = (key, val) => {
  try { localStorage.setItem(`d1_cache_${key}`, JSON.stringify(val)); } catch (e) { console.error(e); }
};

const loadCache = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`d1_cache_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) { return fallback; }
};

// 💡 고유 ID 기준 중복 아이템 제거 헬퍼 (동일 항목 2번 중복 노출 원천 차단)
const deduplicateById = (arr) => {
  if (!Array.isArray(arr)) return [];
  const map = new Map();
  arr.forEach(item => {
    if (item) {
      const key = item.id || item.code_number || JSON.stringify(item);
      map.set(key, item);
    }
  });
  return Array.from(map.values());
};

// 💡 기존 목록 중 최고 번호를 감지하여 고유 ID 생성 (번호 중복 충돌 방지)
const generateUniqueId = (arr, prefix = 'SALE', start = 101) => {
  const numbers = (arr || [])
    .map(item => {
      const raw = String(item?.id || item?.code_number || '');
      const num = parseInt(raw.replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? null : num;
    })
    .filter(n => n !== null);

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : start - 1;
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
};

export function DataProvider({ children }) {
  const { isLoggedIn, user, updateUserProfile } = useGoogleAuth();

  const [customers, setCustomers] = useState(() => loadCache('customers', []));
  const [sales, setSales] = useState(() => loadCache('sales', []));
  const [payments, setPayments] = useState(() => loadCache('payments', []));
  const [staffs, setStaffs] = useState(() => loadCache('staffs', []));
  const [jobOrders, setJobOrders] = useState(() => loadCache('jobOrders', []));
  const [posts, setPosts] = useState(() => loadCache('posts', []));
  const [memos, setMemos] = useState(() => loadCache('memos', []));
  const [logs, setLogs] = useState(() => loadCache('logs', []));
  const [showCalc, setShowCalc] = useState(false);
  const toggleCalc = useCallback(() => setShowCalc(v => !v), []);

  const addLog = useCallback(async (action, category, details, targetId = '') => {
    const userName = user?.userName || user?.name || (user?.email ? user.email.split('@')[0] : '시스템');
    const userEmail = user?.email || '';
    const now = new Date().toLocaleString('ko-KR');

    const newLog = {
      id: Date.now(),
      user_name: userName,
      user_email: userEmail,
      action,
      category,
      details,
      target_id: String(targetId || ''),
      created_at: now,
    };

    setLogs(prev => {
      const next = [newLog, ...prev].slice(0, 300);
      saveCache('logs', next);
      return next;
    });

    try {
      await createLogApi(newLog);
    } catch (e) {
      console.warn('로그 DB 저장 에러:', e);
    }
  }, [user]);

  const clearLogs = async () => {
    setLogs([]);
    saveCache('logs', []);
    try { await clearLogsApi(); } catch (e) { console.error(e); }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastFetchRef = useRef(0);

  // ─── 전체 데이터 D1에서 일괄 조회 (초기 로딩 + 수동 새로고침) ─────────────
  const fetchAllData = useCallback(async (force = false) => {
    const now = Date.now();
    // 30초 이내 재호출 시 생략 (D1도 과도한 호출 방지)
    if (!force && now - lastFetchRef.current < 30000) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAllD1Data();

      lastFetchRef.current = Date.now();

      if (data.customers) {
        const cleanCust = deduplicateById(data.customers);
        setCustomers(cleanCust);
        saveCache('customers', cleanCust);
      }
      if (data.sales) {
        const cleanSales = deduplicateById(data.sales);
        setSales(cleanSales);
        saveCache('sales', cleanSales);
      }
      if (data.payments) {
        const cleanPay = deduplicateById(data.payments);
        setPayments(cleanPay);
        saveCache('payments', cleanPay);
      }
      if (Array.isArray(data.jobOrders)) {
        const cleanJobs = deduplicateById(data.jobOrders);
        if (cleanJobs.length > 0) {
          localStorage.removeItem('d1_cache_jobOrders');
        }
        setJobOrders(cleanJobs);
        saveCache('jobOrders', cleanJobs);
      }
      if (data.staffs) {
        setStaffs(data.staffs);
        saveCache('staffs', data.staffs);

        // 현재 로그인 사용자의 프로필을 사원 DB에서 자동 매칭
        if (user?.email && data.staffs.length > 0) {
          const userEmailNorm = user.email.toLowerCase().trim();
          const matched = data.staffs.find(s => s.email && s.email.toLowerCase().trim() === userEmailNorm);
          if (matched) {
            updateUserProfile({
              id: matched.id,
              userCode: matched.userCode,
              userName: matched.userName,
              companyCode: matched.companyCode,
              dept: matched.dept,
              team: matched.team,
              role: matched.role,
              status: matched.status || '승인완료',
            });
          }
        }
      }
      if (data.departments) {
        setDepartments(data.departments);
        saveCache('departments', data.departments);
      }
      if (data.teams) {
        setTeams(data.teams);
        saveCache('teams', data.teams);
      }
      if (Array.isArray(data.posts)) {
        setPosts(data.posts);
        saveCache('posts', data.posts);
      }
      if (Array.isArray(data.memos)) {
        setMemos(data.memos);
        saveCache('memos', data.memos);
      }
    } catch (err) {
      console.warn('D1 API 데이터 로드 오류:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email, updateUserProfile]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 💡 구글 로그인 사용자와 사원(staffs) 목록 동기화
  useEffect(() => {
    if (!user?.email || !staffs || staffs.length === 0) return;
    const userEmail = user.email.toLowerCase().trim();
    const matched = staffs.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
    if (matched) {
      if (
        user.userCode !== matched.userCode ||
        user.userName !== matched.userName ||
        user.dept !== matched.dept ||
        user.team !== matched.team ||
        user.role !== matched.role
      ) {
        updateUserProfile({
          userCode: matched.userCode,
          userName: matched.userName,
          companyCode: matched.companyCode || '3',
          dept: matched.dept,
          team: matched.team,
          role: matched.role || (userEmail === 'richkikim@gmail.com' ? '관리자' : '일반사원'),
        });
      }
    }
  }, [user?.email, staffs, updateUserProfile, user?.userCode, user?.userName, user?.dept, user?.team, user?.role]);

  // ════════════════════════════════════════════════════════════════
  // JOB ORDERS (작업전표) CRUD
  // ════════════════════════════════════════════════════════════════
  const addJobOrder = async (newOrder) => {
    // 1. 로컬 즉시 반영
    const tempId = newOrder.code_number || newOrder.id;
    setJobOrders(prev => {
      const next = [{ ...newOrder, id: tempId, code_number: tempId }, ...prev];
      saveCache('jobOrders', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    // 2. D1에 저장
    try {
      const saved = await createJobOrderApi(newOrder);
      setJobOrders(prev => {
        const next = prev.map(o => (o.code_number === tempId || o.id === tempId) ? { ...saved, code_number: saved.code_number || saved.id } : o);
        saveCache('jobOrders', next);
        return next;
      });
      addLog('등록', '작업전표', `작업전표 [${saved.title || newOrder.title}] 신규 발행 완료`, saved.code_number || saved.id);
    } catch (err) {
      console.error('작업전표 D1 저장 에러:', err);
      throw err;
    }
  };

  const updateJobOrder = async (codeNo, updatedOrder) => {
    let fullMergedOrder = { code_number: codeNo, ...updatedOrder, _localUpdated: Date.now() };

    // 1. 로컬 즉시 반영 (optimistic update)
    setJobOrders(prev => {
      const existing = prev.find(o => o.code_number === codeNo || o.id === codeNo);
      fullMergedOrder = { ...existing, ...updatedOrder, _localUpdated: Date.now() };
      const next = prev.map(o =>
        (o.code_number === codeNo || o.id === codeNo)
          ? fullMergedOrder
          : o
      );
      saveCache('jobOrders', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    // 2. D1에 저장
    try {
      await updateJobOrderApi(codeNo, fullMergedOrder);
      addLog('수정', '작업전표', `작업전표 [${fullMergedOrder.title || codeNo}] 내용 수정`, codeNo);
    } catch (err) {
      console.error('작업전표 D1 수정 에러:', err);
      throw err;
    }
  };


  const deleteJobOrder = async (codeNo) => {
    const target = jobOrders.find(o => o.code_number === codeNo || o.id === codeNo);
    setJobOrders(prev => {
      const next = prev.filter(o => o.code_number !== codeNo && o.id !== codeNo);
      saveCache('jobOrders', next);
      return next;
    });
    try {
      await deleteJobOrderApi(codeNo);
      addLog('삭제', '작업전표', `작업전표 [${target ? target.title : codeNo}] 삭제 처리`, codeNo);
    } catch (err) {
      console.error('작업전표 D1 삭제 에러:', err);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // STAFFS (사원) CRUD
  // ════════════════════════════════════════════════════════════════
  const saveStaffToSheet = async (staffData) => {
    const finalData = {
      id: staffData.id || undefined,
      userCode: staffData.userCode || staffData.code || '',
      userName: staffData.userName || staffData.name || '',
      companyCode: staffData.companyCode || '3',
      email: (staffData.email || '').toLowerCase().trim(),
      dept: staffData.dept || '',
      position: staffData.position || '담당자',
      team: staffData.team || staffData.dept || '',
      role: staffData.role || ((staffData.email || '').toLowerCase().trim() === 'richkikim@gmail.com' ? '관리자' : '일반사원'),
      status: staffData.status || '승인완료',
    };

    try {
      const res = await upsertStaffApi(finalData);
      const savedItem = res?.id ? res : { ...finalData, id: res?.id || staffData.id };

      setStaffs(prev => {
        const idx = prev.findIndex(s =>
          (savedItem.id && s.id && Number(s.id) === Number(savedItem.id)) ||
          (savedItem.email && s.email && s.email.toLowerCase().trim() === savedItem.email.toLowerCase().trim())
        );
        let next;
        if (idx !== -1) {
          next = [...prev];
          next[idx] = { ...prev[idx], ...savedItem };
        } else {
          next = [...prev, savedItem];
        }
        saveCache('staffs', next);
        return next;
      });

      addLog('수정', '사원관리', `사원 [${savedItem.userName} (${savedItem.email})] 권한 및 회원 정보 저장/승인`, savedItem.id || savedItem.userCode);

      // 만약 수정한 사원이 현재 로그인한 본인이라면 세션 프로필도 업데이트
      if (user?.email && savedItem.email && user.email.toLowerCase().trim() === savedItem.email.toLowerCase().trim()) {
        updateUserProfile({
          id: savedItem.id,
          userCode: savedItem.userCode,
          userName: savedItem.userName,
          companyCode: savedItem.companyCode,
          dept: savedItem.dept,
          team: savedItem.team,
          role: savedItem.role,
        });
      }
    } catch (err) {
      console.error('사원 저장 에러:', err);
      throw err;
    }
  };

  const deleteStaff = async (targetUserCodeOrEmail) => {
    setStaffs(prev => {
      const next = prev.filter(s =>
        s.userCode !== targetUserCodeOrEmail &&
        s.email !== targetUserCodeOrEmail &&
        s.userName !== targetUserCodeOrEmail
      );
      saveCache('staffs', next);
      return next;
    });
    try {
      await deleteStaffApi(targetUserCodeOrEmail);
      addLog('삭제', '사원관리', `사원 계정 [${targetUserCodeOrEmail}] 삭제`, targetUserCodeOrEmail);
    } catch (err) {
      console.error('사원 D1 삭제 에러:', err);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // CUSTOMERS (고객/거래처) CRUD
  // ════════════════════════════════════════════════════════════════
  const addCustomer = async (newCust) => {
    const custId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const payload = { id: custId, ...newCust, sales_manager: newCust.sales_manager || user?.userName || '' };

    setCustomers(prev => {
      const next = [...prev, payload];
      saveCache('customers', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    try {
      const saved = await createCustomer(payload);
      setCustomers(prev => {
        const next = prev.map(c => c.id === custId ? { ...saved } : c);
        saveCache('customers', next);
        return next;
      });
      addLog('등록', '고객', `신규 고객사 [${payload.name}] (담당: ${payload.sales_manager}) 등록`, custId);
      return saved;
    } catch (err) {
      console.error('고객 D1 저장 에러:', err);
      throw err;
    }
  };

  const updateCustomer = async (id, updatedCust) => {
    let fullMergedCust = { id, ...updatedCust, _localUpdated: Date.now() };

    setCustomers(prev => {
      const existing = prev.find(c => c.id === id);
      fullMergedCust = { ...existing, ...updatedCust, id, _localUpdated: Date.now() };
      const next = prev.map(c => c.id === id ? fullMergedCust : c);
      saveCache('customers', next);
      return next;
    });
    lastFetchRef.current = Date.now();
    await updateCustomerApi(id, fullMergedCust);
    addLog('수정', '고객', `고객사 [${fullMergedCust.name || id}] 상세 정보 수정`, id);
  };

  const deleteCustomer = async (id) => {
    const target = customers.find(c => c.id === id);
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCache('customers', next);
      return next;
    });
    await deleteCustomerApi(id);
    addLog('삭제', '고객', `고객사 [${target ? target.name : id}] 삭제 처리`, id);
  };

  // ════════════════════════════════════════════════════════════════
  // SALES (매출/견적) CRUD
  // ════════════════════════════════════════════════════════════════
  const addSales = async (newSale) => {
    const saleId = generateUniqueId(sales, 'SALE', 101);
    const payload = { id: saleId, ...newSale };

    setSales(prev => {
      const next = deduplicateById([...prev, payload]);
      saveCache('sales', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    try {
      const saved = await createSaleApi(payload);
      setSales(prev => {
        const next = deduplicateById(prev.map(s => s.id === saleId ? saved : s));
        saveCache('sales', next);
        return next;
      });
      const custObj = customers.find(c => c.id === newSale.customer_id);
      sendWebhookEvent({ ...saved, customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정' });
      addLog('등록', '매출/견적', `[${payload.title}] ${payload.type || '매출'} 항목 등록 (공급가: ${Number(payload.supply_price || 0).toLocaleString()}원)`, saleId);
    } catch (err) {
      console.error('매출 D1 저장 에러:', err);
      throw err;
    }
  };

  const updateSales = async (id, updatedSale) => {
    let fullMergedSale = { id, ...updatedSale, _localUpdated: Date.now() };

    setSales(prev => {
      const existing = prev.find(s => s.id === id);
      fullMergedSale = { ...existing, ...updatedSale, id, _localUpdated: Date.now() };
      const next = prev.map(s => s.id === id ? fullMergedSale : s);
      saveCache('sales', next);
      return next;
    });

    lastFetchRef.current = Date.now();
    try {
      await updateSaleApi(id, fullMergedSale);
      const custObj = customers.find(c => c.id === fullMergedSale.customer_id);
      sendWebhookEvent({ ...fullMergedSale, id, customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정' });
      addLog('수정', '매출/견적', `[${fullMergedSale.title || id}] 매출/견적 정보 수정`, id);
    } catch (err) {
      console.error('매출 D1 수정 에러:', err);
      throw err;
    }
  };

  const deleteSales = async (id) => {
    const target = sales.find(s => s.id === id);
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveCache('sales', next);
      return next;
    });
    lastFetchRef.current = Date.now();
    try {
      await deleteSaleApi(id);
      addLog('삭제', '매출/견적', `매출 항목 [${target ? target.title : id}] 삭제 처리`, id);
    } catch (err) {
      console.error('매출 D1 삭제 에러:', err);
      throw err;
    }
  };

  // ════════════════════════════════════════════════════════════════
  // PAYMENTS (수금) CRUD
  // ════════════════════════════════════════════════════════════════
  const addPayment = async (newPay) => {
    const payId = `PAY-${String(payments.length + 201).padStart(3, '0')}`;
    const payload = { id: payId, ...newPay };

    setPayments(prev => {
      const next = [...prev, payload];
      saveCache('payments', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    try {
      const saved = await createPaymentApi(payload);
      setPayments(prev => {
        const next = prev.map(p => p.id === payId ? saved : p);
        saveCache('payments', next);
        return next;
      });
    } catch (err) {
      console.error('수금 D1 저장 에러:', err);
      throw err;
    }
  };

  const updatePayment = async (id, updatedPay) => {
    let fullMergedPay = { id, ...updatedPay, _localUpdated: Date.now() };

    setPayments(prev => {
      const existing = prev.find(p => p.id === id);
      fullMergedPay = { ...existing, ...updatedPay, id, _localUpdated: Date.now() };
      const next = prev.map(p => p.id === id ? fullMergedPay : p);

      saveCache('payments', next);
      return next;
    });
    lastFetchRef.current = Date.now();
    await updatePaymentApi(id, fullMergedPay);
  };

  const deletePayment = async (id) => {
    setPayments(prev => {
      const next = prev.filter(p => p.id !== id);
      saveCache('payments', next);
      return next;
    });
    await deletePaymentApi(id);
  };


  const [selectedTeamGroup, setSelectedTeamGroup] = useState('ALL');

  // ════════════════════════════════════════════════════════════════
  // 공식 부서/팀 CRUD (D1 연동)
  // ════════════════════════════════════════════════════════════════
  const [departments, setDepartments] = useState(() =>
    loadCache('departments', ['세종영업본부', '기획예산부', '생산관리부', '영업본부'])
  );

  const [teams, setTeams] = useState(() =>
    loadCache('teams', ['영업1조', '영업2조', '영업3조', '영업4조', '영업1팀', '영업2팀', '기획팀', '생산팀'])
  );

  const addDepartment = async (name) => {
    if (!name || departments.includes(name)) return;
    setDepartments(prev => { const next = [...prev, name]; saveCache('departments', next); return next; });
    await createDepartmentApi(name).catch(console.error);
  };

  const updateDepartment = async (oldName, newName) => {
    if (!newName || oldName === newName) return;
    setDepartments(prev => { const next = prev.map(d => d === oldName ? newName : d); saveCache('departments', next); return next; });
    setStaffs(prev => { const next = prev.map(s => s.dept === oldName ? { ...s, dept: newName } : s); saveCache('staffs', next); return next; });
    await updateDepartmentApi(oldName, newName).catch(console.error);
  };

  const deleteDepartment = async (name) => {
    setDepartments(prev => { const next = prev.filter(d => d !== name); saveCache('departments', next); return next; });
    await deleteDepartmentApi(name).catch(console.error);
  };

  const addTeam = async (name) => {
    if (!name || teams.includes(name)) return;
    setTeams(prev => { const next = [...prev, name]; saveCache('teams', next); return next; });
    await createTeamApi(name).catch(console.error);
  };

  const updateTeam = async (oldName, newName) => {
    if (!newName || oldName === newName) return;
    setTeams(prev => { const next = prev.map(t => t === oldName ? newName : t); saveCache('teams', next); return next; });
    setStaffs(prev => { const next = prev.map(s => s.team === oldName ? { ...s, team: newName } : s); saveCache('staffs', next); return next; });
    await updateTeamApi(oldName, newName).catch(console.error);
  };

  const deleteTeam = async (name) => {
    setTeams(prev => { const next = prev.filter(t => t !== name); saveCache('teams', next); return next; });
    await deleteTeamApi(name).catch(console.error);
  };

  // ════════════════════════════════════════════════════════════════
  // POSTS (업무 게시판) CRUD
  // ════════════════════════════════════════════════════════════════
  const addPost = async (newPost) => {
    const tempId = `POST-${Date.now()}`;
    const item = { ...newPost, id: tempId, created_at: new Date().toLocaleString('ko-KR') };
    setPosts(prev => { const next = [item, ...prev]; saveCache('posts', next); return next; });
    try {
      const created = await createPostApi({ ...newPost, id: tempId });
      if (created?.id) {
        setPosts(prev => { const next = prev.map(p => p.id === tempId ? created : p); saveCache('posts', next); return next; });
      }
    } catch (e) { console.error('Post add error:', e); }
  };

  const updatePost = async (id, updatedData) => {
    setPosts(prev => { const next = prev.map(p => p.id === id ? { ...p, ...updatedData } : p); saveCache('posts', next); return next; });
    try {
      const res = await updatePostApi(id, updatedData);
      if (res?.id) setPosts(prev => { const next = prev.map(p => p.id === id ? res : p); saveCache('posts', next); return next; });
    } catch (e) { console.error('Post update error:', e); }
  };

  const deletePost = async (id) => {
    setPosts(prev => { const next = prev.filter(p => p.id !== id); saveCache('posts', next); return next; });
    try { await deletePostApi(id); } catch (e) { console.error('Post delete error:', e); }
  };

  // ════════════════════════════════════════════════════════════════
  // MEMOS (포스트잇 스티키 메모) CRUD
  // ════════════════════════════════════════════════════════════════
  const addMemo = async (newMemo) => {
    const tempId = `MEMO-${Date.now()}`;
    const item = {
      id: tempId,
      user_email: user?.email || '',
      content: '',
      color: 'yellow',
      pos_x: 80 + (memos.length % 5) * 30,
      pos_y: 120 + (memos.length % 5) * 30,
      is_pinned: false,
      created_at: new Date().toLocaleString('ko-KR'),
      updated_at: new Date().toLocaleString('ko-KR'),
      ...newMemo,
    };
    setMemos(prev => { const next = [item, ...prev]; saveCache('memos', next); return next; });
    try {
      const created = await createMemoApi(item);
      if (created?.id) {
        setMemos(prev => { const next = prev.map(m => m.id === tempId ? created : m); saveCache('memos', next); return next; });
      }
    } catch (e) { console.error('Memo add error:', e); }
  };

  const updateMemo = async (id, updatedData) => {
    setMemos(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updatedData, updated_at: new Date().toLocaleString('ko-KR') } : m);
      saveCache('memos', next);
      return next;
    });
    try {
      await updateMemoApi(id, updatedData);
    } catch (e) { console.error('Memo update error:', e); }
  };

  const deleteMemo = async (id) => {
    setMemos(prev => { const next = prev.filter(m => m.id !== id); saveCache('memos', next); return next; });
    try { await deleteMemoApi(id); } catch (e) { console.error('Memo delete error:', e); }
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        sales,
        payments,
        staffs,
        jobOrders,
        posts,
        memos,
        departments,
        teams,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addTeam,
        updateTeam,
        deleteTeam,
        loading,
        error,
        selectedTeamGroup,
        setSelectedTeamGroup,
        refreshData: (force = true) => fetchAllData(force),
        saveStaffToSheet,
        deleteStaff,
        addJobOrder,
        updateJobOrder,
        deleteJobOrder,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSales,
        updateSales,
        deleteSales,
        addPayment,
        updatePayment,
        deletePayment,
        addPost,
        updatePost,
        deletePost,
        addMemo,
        updateMemo,
        deleteMemo,
        logs,
        addLog,
        clearLogs,
        showCalc,
        setShowCalc,
        toggleCalc,
        isUsingSheetsDB: false, // D1으로 전환 완료
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);