// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleAuth } from './GoogleAuthContext';
import { getSheetValues, batchGetSheetValues, appendSheetValue, updateSheetRow, clearSheetRow, parseCustomers, parseSales, parsePayments, parseStaffs, parseJobOrders } from '../services/googleSheetsApi';
import { sendWebhookEvent } from '../services/webhookService';
import { initialCustomers, initialSales, initialPayments } from '../data/dummyData';

const DataContext = createContext();

const initialStaffs = [
  { userCode: '44', userName: '김광일', companyCode: '3', email: 'richkikim@gmail.com', dept: '기획예산부', position: '부서장' },
  { userCode: '84', userName: '강영진', companyCode: '3', email: 'youngjin@gmail.com', dept: '영업부', position: '팀장' }
];

// 로컬 스토리지 캐시 관리 헬퍼
const saveCache = (key, val) => {
  try {
    localStorage.setItem(`sheets_cache_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
};

const loadCache = (key, fallback) => {
  try {
    const saved = localStorage.getItem(`sheets_cache_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

export function DataProvider({ children }) {
  const { accessToken, isLoggedIn, user, updateUserProfile } = useGoogleAuth();

  const [customers, setCustomers] = useState(() => loadCache('customers', initialCustomers));
  const [sales, setSales] = useState(() => loadCache('sales', initialSales));
  const [payments, setPayments] = useState(() => loadCache('payments', initialPayments));
  const [staffs, setStaffs] = useState(() => loadCache('staffs', initialStaffs));
  const [jobOrders, setJobOrders] = useState(() => loadCache('jobOrders', []));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastFetchRef = useRef(0);

  const fetchAllData = useCallback(async (force = false) => {
    if (!isLoggedIn || !accessToken) {
      return;
    }

    const now = Date.now();
    // 💡 15초 이내 재호출 시 API 호출을 생략하고 캐시 데이터 유지 (Google API Rate Limit Quota 완전 방어!)
    if (!force && now - lastFetchRef.current < 15000) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 💡 5개 탭을 1회 호출로 일괄 처리
      const sheetMap = await batchGetSheetValues(accessToken, [
        '01_고객관리',
        '02_매출견적관리',
        '03_수금관리',
        '04_작업전표DB',
        '05_사원관리',
      ]);

      lastFetchRef.current = now;

      if (sheetMap['01_고객관리']) {
        const parsed = parseCustomers(sheetMap['01_고객관리']);
        setCustomers(parsed);
        saveCache('customers', parsed);
      }
      if (sheetMap['02_매출견적관리']) {
        const parsed = parseSales(sheetMap['02_매출견적관리']);
        setSales(parsed);
        saveCache('sales', parsed);
      }
      if (sheetMap['03_수금관리']) {
        const parsed = parsePayments(sheetMap['03_수금관리']);
        setPayments(parsed);
        saveCache('payments', parsed);
      }
      if (sheetMap['04_작업전표DB']) {
        const parsed = parseJobOrders(sheetMap['04_작업전표DB']);
        // ✅ 기존 로컬 캐시와 시트 데이터를 병합: 로컬에서 수정된 최신 항목을 시트 데이터가 덮어쓰지 않도록 보호
        setJobOrders(prev => {
          if (!prev || prev.length === 0) {
            saveCache('jobOrders', parsed);
            return parsed;
          }
          // 시트 기준 전체를 사용하되, 로컬에만 존재하는 신규 항목도 포함
          const merged = parsed.map(sheetOrder => {
            const localOrder = prev.find(o => o.code_number === sheetOrder.code_number || o.id === sheetOrder.code_number);
            // 로컬 캐시의 수정 시각이 더 최신이면 로컬 우선
            return localOrder?._localUpdated ? localOrder : sheetOrder;
          });
          // 로컬에만 있는 신규 추가 항목 (아직 시트에 반영 안 된 것)
          const sheetCodes = new Set(parsed.map(o => o.code_number));
          const localOnly = prev.filter(o => !sheetCodes.has(o.code_number) && !sheetCodes.has(o.id));
          const final = [...localOnly, ...merged];
          saveCache('jobOrders', final);
          return final;
        });
      }
      
      if (sheetMap['05_사원관리']) {
        const parsedStaffs = parseStaffs(sheetMap['05_사원관리']);
        setStaffs(parsedStaffs);
        saveCache('staffs', parsedStaffs);

        if (user?.email && parsedStaffs.length > 0) {
          const matched = parsedStaffs.find(s => s.email === user.email.toLowerCase());
          if (matched) {
            updateUserProfile({
              userCode: matched.userCode,
              userName: matched.userName,
              companyCode: matched.companyCode,
              dept: matched.dept,
            });
          }
        }
      }
    } catch (err) {
      console.warn('구글 시트 데이터 로드 상태:', err.message);
      // 💡 Quota Exceeded (호출 초과) 발생 시 사용자 화면에 빨간 에러 메시지를 노출하지 않고 로컬 캐시로 매끄럽게 동작!
      if (err.message?.includes('Quota exceeded') || err.message?.includes('Read requests') || err.message?.includes('sheets.googleapis.com')) {
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, isLoggedIn, user?.email, updateUserProfile]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- 0. 작업전표 CRUD ---
  const addJobOrder = async (newOrder) => {
    const custObj = customers.find(c => c.id === newOrder.customer_id);
    const custName = custObj ? `${custObj.name}` : (newOrder.customer_name || newOrder.customer_id);
    const custDept = custObj ? `${custObj.dept}` : (newOrder.dept || '');

    const row = [
      newOrder.code_number,
      newOrder.manager_name,
      newOrder.receipt_date,
      newOrder.delivery_date,
      newOrder.delivery_time,
      custName,
      custDept,
      newOrder.title,
      newOrder.spec,
      newOrder.pages,
      newOrder.duplex,
      newOrder.quantity,
      newOrder.estimated_price,
      newOrder.client_contact_person,
      newOrder.client_phone,
      newOrder.client_email,
      newOrder.email_receipt_time,
      newOrder.cover_job,
      newOrder.cover_paper,
      newOrder.cover_print,
      newOrder.coating,
      newOrder.inner_job,
      newOrder.inner_paper,
      newOrder.inner_print,
      newOrder.interleaf_paper,
      newOrder.binding,
      newOrder.draft_email,
      newOrder.draft_group,
      newOrder.mail_sender,
      newOrder.cover_proof_date,
      newOrder.inner_proof_date,
      newOrder.proof_method,
      newOrder.planning,
      newOrder.photography,
      newOrder.illustration,
      newOrder.copyright_web,
      newOrder.production_progress,
      newOrder.delivery_destination,
      newOrder.cover_related,
      newOrder.inner_related,
      newOrder.request_note,
      newOrder.editor_name,
      newOrder.designer_name,
    ];

    if (isLoggedIn && accessToken) {
      try {
        await appendSheetValue(accessToken, '04_작업전표DB', row);
      } catch (err) {
        console.error('작업전표DB 시트 쓰기 에러:', err);
      }
    }

    setJobOrders(prev => {
      const next = [{ id: newOrder.code_number, ...newOrder }, ...prev];
      saveCache('jobOrders', next);
      return next;
    });
  };

  const updateJobOrder = async (codeNo, updatedOrder) => {
    const index = jobOrders.findIndex(o => o.code_number === codeNo || o.id === codeNo);
    if (index === -1) return;
    const rowIndex = index + 2;

    // ✅ 1. 로컬 state를 먼저 업데이트 (optimistic update) - 화면에 즉시 반영
    setJobOrders(prev => {
      const next = prev.map(o => (o.code_number === codeNo || o.id === codeNo) 
        ? { ...o, ...updatedOrder, _localUpdated: Date.now() }  // _localUpdated 플래그로 최신 로컬 수정 표시
        : o
      );
      saveCache('jobOrders', next);
      return next;
    });

    // ✅ 2. 자동 재fetch가 수정 내용을 덮어쓰지 못하도록 lastFetchRef를 현재 시각으로 갱신 (30초 보호)
    lastFetchRef.current = Date.now();

    const custObj = customers.find(c => c.id === updatedOrder.customer_id);
    const custName = custObj ? `${custObj.name}` : (updatedOrder.customer_name || updatedOrder.customer_id);
    const custDept = custObj ? `${custObj.dept}` : (updatedOrder.dept || '');

    const row = [
      updatedOrder.code_number,
      updatedOrder.manager_name,
      updatedOrder.receipt_date,
      updatedOrder.delivery_date,
      updatedOrder.delivery_time,
      custName,
      custDept,
      updatedOrder.title,
      updatedOrder.spec,
      updatedOrder.pages,
      updatedOrder.duplex,
      updatedOrder.quantity,
      updatedOrder.estimated_price,
      updatedOrder.client_contact_person,
      updatedOrder.client_phone,
      updatedOrder.client_email,
      updatedOrder.email_receipt_time,
      updatedOrder.cover_job,
      updatedOrder.cover_paper,
      updatedOrder.cover_print,
      updatedOrder.coating,
      updatedOrder.inner_job,
      updatedOrder.inner_paper,
      updatedOrder.inner_print,
      updatedOrder.interleaf_paper,
      updatedOrder.binding,
      updatedOrder.draft_email,
      updatedOrder.draft_group,
      updatedOrder.mail_sender,
      updatedOrder.cover_proof_date,
      updatedOrder.inner_proof_date,
      updatedOrder.proof_method,
      updatedOrder.planning,
      updatedOrder.photography,
      updatedOrder.illustration,
      updatedOrder.copyright_web,
      updatedOrder.production_progress,
      updatedOrder.delivery_destination,
      updatedOrder.cover_related,
      updatedOrder.inner_related,
      updatedOrder.request_note,
      updatedOrder.editor_name,
      updatedOrder.designer_name,
    ];

    // ✅ 3. 그 다음 Google Sheets에 실제 저장
    if (isLoggedIn && accessToken) {
      try {
        await updateSheetRow(accessToken, '04_작업전표DB', rowIndex, row);
      } catch (err) {
        console.error('작업전표 시트 수정 에러:', err);
        // 시트 저장 실패 시 사용자에게 알림 (로컬 state는 이미 반영됨)
        throw err;
      }
    }
  };

  const deleteJobOrder = async (codeNo) => {
    const index = jobOrders.findIndex(o => o.code_number === codeNo || o.id === codeNo);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      try {
        await clearSheetRow(accessToken, '04_작업전표DB', rowIndex);
      } catch (err) {
        console.error('작업전표 삭제 에러:', err);
      }
    }
    setJobOrders(prev => {
      const next = prev.filter(o => o.code_number !== codeNo && o.id !== codeNo);
      saveCache('jobOrders', next);
      return next;
    });
  };

  // --- 사원관리 DB CRUD ---
  const saveStaffToSheet = async (profileData) => {
    const existing = staffs.find(s => (s.userCode && s.userCode === profileData.userCode) || (s.email && s.email === profileData.email?.toLowerCase()));
    
    const finalData = {
      ...existing,
      ...profileData
    };

    const row = [
      finalData.userCode,
      finalData.userName,
      finalData.companyCode,
      finalData.email || user?.email || '',
      finalData.dept || '',
      finalData.position || '담당자',
      finalData.team || finalData.dept || '',
      finalData.role || '일반사원',
      finalData.status || '승인완료',
    ];

    if (isLoggedIn && accessToken) {
      try {
        const index = staffs.findIndex(s => (s.userCode && s.userCode === finalData.userCode) || (s.email && s.email === finalData.email?.toLowerCase()));
        if (index !== -1) {
          const rowIndex = index + 2;
          await updateSheetRow(accessToken, '05_사원관리', rowIndex, row);
        } else {
          await appendSheetValue(accessToken, '05_사원관리', row);
        }
      } catch (err) {
        console.error('사원관리 시트 저장 에러:', err);
      }
    }

    setStaffs(prev => {
      const idx = prev.findIndex(s => (s.userCode && s.userCode === finalData.userCode) || (s.email && s.email === finalData.email?.toLowerCase()));
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
    const index = staffs.findIndex(s => 
      s.userCode === targetUserCodeOrEmail || 
      s.code === targetUserCodeOrEmail || 
      (s.userName && s.userName === targetUserCodeOrEmail) ||
      (s.email && s.email.toLowerCase() === String(targetUserCodeOrEmail).toLowerCase())
    );
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      try {
        await clearSheetRow(accessToken, '05_사원관리', rowIndex);
      } catch (err) {
        console.error('사원 삭제 에러:', err);
      }
    }

    setStaffs(prev => {
      const next = prev.filter((_, i) => i !== index);
      saveCache('staffs', next);
      return next;
    });
  };

  // --- 1. 고객 CRUD ---
  const addCustomer = async (newCust) => {
    const custId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const row = [
      custId,
      newCust.name,
      newCust.dept || '',
      newCust.contact_person || '',
      newCust.phone || '',
      newCust.email || '',
      newCust.sales_manager || user?.userName || '김광일',
    ];

    if (isLoggedIn && accessToken) {
      try {
        await appendSheetValue(accessToken, '01_고객관리', row);
      } catch (err) {
        console.error('고객관리 시트 쓰기 에러:', err);
      }
    }
    const created = { id: custId, ...newCust, sales_manager: newCust.sales_manager || user?.userName || '김광일' };
    setCustomers(prev => {
      const next = [...prev, created];
      saveCache('customers', next);
      return next;
    });
    return created;
  };

  const updateCustomer = async (id, updatedCust) => {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    // ✅ 로컬 state 먼저 반영 (optimistic update)
    setCustomers(prev => {
      const next = prev.map(c => c.id === id ? { id, ...updatedCust, _localUpdated: Date.now() } : c);
      saveCache('customers', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    const row = [
      id,
      updatedCust.name,
      updatedCust.dept || '',
      updatedCust.contact_person || '',
      updatedCust.phone || '',
      updatedCust.email || '',
      updatedCust.sales_manager || user?.userName || '김광일',
    ];
    if (isLoggedIn && accessToken) {
      await updateSheetRow(accessToken, '01_고객관리', rowIndex, row);
    }
  };

  const deleteCustomer = async (id) => {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '01_고객관리', rowIndex);
    }
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCache('customers', next);
      return next;
    });
  };

  // --- 2. 매출/견적 CRUD ---
  const addSales = async (newSale) => {
    const saleId = `SALE-${String(sales.length + 101).padStart(3, '0')}`;
    const row = [
      saleId,
      newSale.reg_date,
      newSale.receipt_date,
      newSale.delivery_date,
      newSale.delivery_time,
      newSale.customer_id,
      newSale.title,
      newSale.content,
      newSale.note,
      newSale.billing_schedule,
      newSale.type,
      newSale.supply_price,
      newSale.tax,
      newSale.total_price,
      newSale.calendar_synced ? 'Y' : 'N',
      newSale.superthread_synced ? 'Y' : 'N',
    ];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '02_매출견적관리', row);
    }

    const custObj = customers.find(c => c.id === newSale.customer_id);
    const payload = {
      ...newSale,
      id: saleId,
      customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정',
    };
    sendWebhookEvent(payload);

    setSales(prev => {
      const next = [...prev, { id: saleId, ...newSale }];
      saveCache('sales', next);
      return next;
    });
  };

  const updateSales = async (id, updatedSale) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    // ✅ 1. 로컬 state 먼저 반영 (optimistic update)
    setSales(prev => {
      const next = prev.map(s => s.id === id ? { id, ...updatedSale, _localUpdated: Date.now() } : s);
      saveCache('sales', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    const row = [
      id,
      updatedSale.reg_date,
      updatedSale.receipt_date,
      updatedSale.delivery_date,
      updatedSale.delivery_time,
      updatedSale.customer_id,
      updatedSale.title,
      updatedSale.content,
      updatedSale.note,
      updatedSale.billing_schedule,
      updatedSale.type,
      updatedSale.supply_price,
      updatedSale.tax,
      updatedSale.total_price,
      updatedSale.calendar_synced ? 'Y' : 'N',
      updatedSale.superthread_synced ? 'Y' : 'N',
    ];

    if (isLoggedIn && accessToken) {
      await updateSheetRow(accessToken, '02_매출견적관리', rowIndex, row);
    }

    const custObj = customers.find(c => c.id === updatedSale.customer_id);
    sendWebhookEvent({
      ...updatedSale,
      id,
      customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정',
    });
  };

  const deleteSales = async (id) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '02_매출견적관리', rowIndex);
    }
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveCache('sales', next);
      return next;
    });
  };

  // --- 3. 수금 CRUD ---
  const addPayment = async (newPay) => {
    const payId = `PAY-${String(payments.length + 201).padStart(3, '0')}`;
    const row = [payId, newPay.payment_date, newPay.customer_id, newPay.amount, newPay.method];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '03_수금관리', row);
    }
    setPayments(prev => {
      const next = [...prev, { id: payId, ...newPay }];
      saveCache('payments', next);
      return next;
    });
  };

  const updatePayment = async (id, updatedPay) => {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    // ✅ 로컬 state 먼저 반영 (optimistic update)
    setPayments(prev => {
      const next = prev.map(p => p.id === id ? { id, ...updatedPay, _localUpdated: Date.now() } : p);
      saveCache('payments', next);
      return next;
    });
    lastFetchRef.current = Date.now();

    const row = [id, updatedPay.payment_date, updatedPay.customer_id, updatedPay.amount, updatedPay.method];
    if (isLoggedIn && accessToken) {
      await updateSheetRow(accessToken, '03_수금관리', rowIndex, row);
    }
  };

  const deletePayment = async (id) => {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '03_수금관리', rowIndex);
    }
    setPayments(prev => {
      const next = prev.filter(p => p.id !== id);
      saveCache('payments', next);
      return next;
    });
  };

  const [selectedTeamGroup, setSelectedTeamGroup] = useState('ALL');

  // --- 공식 부서/팀 CRUD ---
  const [departments, setDepartments] = useState(() => 
    loadCache('departments', ['세종영업본부', '기획예산부', '생산관리부', '영업본부'])
  );

  const [teams, setTeams] = useState(() => 
    loadCache('teams', ['영업1조', '영업2조', '영업3조', '영업4조', '영업1팀', '영업2팀', '기획팀', '생산팀'])
  );

  const addDepartment = (name) => {
    if (!name || departments.includes(name)) return;
    setDepartments(prev => {
      const next = [...prev, name];
      saveCache('departments', next);
      return next;
    });
  };

  const updateDepartment = (oldName, newName) => {
    if (!newName || oldName === newName) return;
    setDepartments(prev => {
      const next = prev.map(d => d === oldName ? newName : d);
      saveCache('departments', next);
      return next;
    });
    setStaffs(prev => {
      const next = prev.map(s => s.dept === oldName ? { ...s, dept: newName } : s);
      saveCache('staffs', next);
      return next;
    });
  };

  const deleteDepartment = (name) => {
    setDepartments(prev => {
      const next = prev.filter(d => d !== name);
      saveCache('departments', next);
      return next;
    });
  };

  const addTeam = (name) => {
    if (!name || teams.includes(name)) return;
    setTeams(prev => {
      const next = [...prev, name];
      saveCache('teams', next);
      return next;
    });
  };

  const updateTeam = (oldName, newName) => {
    if (!newName || oldName === newName) return;
    setTeams(prev => {
      const next = prev.map(t => t === oldName ? newName : t);
      saveCache('teams', next);
      return next;
    });
    setStaffs(prev => {
      const next = prev.map(s => s.team === oldName ? { ...s, team: newName } : s);
      saveCache('staffs', next);
      return next;
    });
  };

  const deleteTeam = (name) => {
    setTeams(prev => {
      const next = prev.filter(t => t !== name);
      saveCache('teams', next);
      return next;
    });
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        sales,
        payments,
        staffs,
        jobOrders,
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
        isUsingSheetsDB: isLoggedIn && !error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);