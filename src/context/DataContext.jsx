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

export function DataProvider({ children }) {
  const { isLoggedIn, user, updateUserProfile } = useGoogleAuth();

  const [customers, setCustomers] = useState(() => loadCache('customers', []));
  const [sales, setSales] = useState(() => loadCache('sales', []));
  const [payments, setPayments] = useState(() => loadCache('payments', []));
  const [staffs, setStaffs] = useState(() => loadCache('staffs', []));
  const [jobOrders, setJobOrders] = useState(() => loadCache('jobOrders', []));
  const [posts, setPosts] = useState(() => loadCache('posts', []));

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
        setCustomers(data.customers);
        saveCache('customers', data.customers);
      }
      if (data.sales) {
        setSales(data.sales);
        saveCache('sales', data.sales);
      }
      if (data.payments) {
        setPayments(data.payments);
        saveCache('payments', data.payments);
      }
      if (Array.isArray(data.jobOrders)) {
        if (data.jobOrders.length > 0) {
          localStorage.removeItem('d1_cache_jobOrders');
        }
        setJobOrders(data.jobOrders);
        saveCache('jobOrders', data.jobOrders);
      }
      if (data.staffs) {
        setStaffs(data.staffs);
        saveCache('staffs', data.staffs);

        // 현재 로그인 사용자의 프로필을 사원 DB에서 자동 매칭
        if (user?.email && data.staffs.length > 0) {
          const matched = data.staffs.find(s => s.email === user.email.toLowerCase());
          if (matched) {
            updateUserProfile({
              userCode: matched.userCode,
              userName: matched.userName,
              companyCode: matched.companyCode,
              dept: matched.dept,
              team: matched.team,
              role: matched.role,
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
    } catch (err) {
      console.error('작업전표 D1 수정 에러:', err);
      throw err;
    }
  };


  const deleteJobOrder = async (codeNo) => {
    setJobOrders(prev => {
      const next = prev.filter(o => o.code_number !== codeNo && o.id !== codeNo);
      saveCache('jobOrders', next);
      return next;
    });
    try {
      await deleteJobOrderApi(codeNo);
    } catch (err) {
      console.error('작업전표 D1 삭제 에러:', err);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // STAFFS (사원) CRUD
  // ════════════════════════════════════════════════════════════════
  const saveStaffToSheet = async (staffData) => {
    const finalData = {
      userCode: staffData.userCode || staffData.code || '',
      userName: staffData.userName || staffData.name || '',
      companyCode: staffData.companyCode || '3',
      email: (staffData.email || '').toLowerCase().trim(),
      dept: staffData.dept || '',
      position: staffData.position || '담당자',
      team: staffData.team || staffData.dept || '',
      role: staffData.role || '일반사원',
      status: staffData.status || '승인완료',
    };

    await upsertStaffApi(finalData);

    setStaffs(prev => {
      const idx = prev.findIndex(s =>
        (finalData.email && s.email && s.email.toLowerCase() === finalData.email.toLowerCase()) ||
        (!finalData.email && finalData.userName && s.userName === finalData.userName)
      );
      let next;
      if (idx !== -1) {
        next = [...prev];
        next[idx] = finalData;
      } else {
        next = [...prev, finalData];
      }
      saveCache('staffs', next);
      return next;
    });
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
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCache('customers', next);
      return next;
    });
    await deleteCustomerApi(id);
  };

  // ════════════════════════════════════════════════════════════════
  // SALES (매출/견적) CRUD
  // ════════════════════════════════════════════════════════════════
  const addSales = async (newSale) => {
    const saleId = `SALE-${String(sales.length + 101).padStart(3, '0')}`;
    const payload = { id: saleId, ...newSale };

    setSales(prev => {
      const next = [...prev, payload];
      saveCache('sales', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    try {
      const saved = await createSaleApi(payload);
      setSales(prev => {
        const next = prev.map(s => s.id === saleId ? saved : s);
        saveCache('sales', next);
        return next;
      });
      const custObj = customers.find(c => c.id === newSale.customer_id);
      sendWebhookEvent({ ...saved, customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정' });
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
    } catch (err) {
      console.error('매출 D1 수정 에러:', err);
      throw err;
    }
  };

  const deleteSales = async (id) => {
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveCache('sales', next);
      return next;
    });
    await deleteSaleApi(id);
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

  return (
    <DataContext.Provider
      value={{
        customers,
        sales,
        payments,
        staffs,
        jobOrders,
        posts,
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
        isUsingSheetsDB: false, // D1으로 전환 완료
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);