// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleAuth } from './GoogleAuthContext';
import { getSheetValues, appendSheetValue, updateSheetRow, clearSheetRow, parseCustomers, parseSales, parsePayments, parseStaffs } from '../services/googleSheetsApi';
import { sendWebhookEvent } from '../services/webhookService';
import { initialCustomers, initialSales, initialPayments } from '../data/dummyData';

const DataContext = createContext();

const initialStaffs = [
  { userCode: '44', userName: '김광일', companyCode: '3', email: 'richkikim@gmail.com', dept: '기획예산부', position: '부서장' },
  { userCode: '84', userName: '강영진', companyCode: '3', email: 'youngjin@gmail.com', dept: '영업부', position: '팀장' }
];

export function DataProvider({ children }) {
  const { accessToken, isLoggedIn, user, updateUserProfile } = useGoogleAuth();

  const [customers, setCustomers] = useState(initialCustomers);
  const [sales, setSales] = useState(initialSales);
  const [payments, setPayments] = useState(initialPayments);
  const [staffs, setStaffs] = useState(initialStaffs);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn || !accessToken) {
      setCustomers(initialCustomers);
      setSales(initialSales);
      setPayments(initialPayments);
      setStaffs(initialStaffs);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [custRows, salesRows, payRows] = await Promise.all([
        getSheetValues(accessToken, '01_고객관리'),
        getSheetValues(accessToken, '02_매출견적관리'),
        getSheetValues(accessToken, '03_수금관리'),
      ]);

      setCustomers(parseCustomers(custRows));
      setSales(parseSales(salesRows));
      setPayments(parsePayments(payRows));

      // 05_사원관리 시트 로드 (시트가 없거나 오류 시 안전 폴백)
      try {
        const staffRows = await getSheetValues(accessToken, '05_사원관리');
        const parsedStaffs = parseStaffs(staffRows);
        setStaffs(parsedStaffs);

        // 로그인 이메일 기반 사원 자동 매칭 및 프로필 동기화
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
      } catch (e) {
        console.log('05_사원관리 시트 미존재 또는 로드 건너뜀:', e.message);
      }

    } catch (err) {
      console.error('시트 데이터 불러오기 에러:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isLoggedIn, user?.email, updateUserProfile]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- 사원관리 DB CRUD ---
  const saveStaffToSheet = async (profileData) => {
    const row = [
      profileData.userCode,
      profileData.userName,
      profileData.companyCode,
      profileData.email || user?.email || '',
      profileData.dept || '기획예산부',
      profileData.position || '담당자',
    ];

    if (isLoggedIn && accessToken) {
      try {
        const index = staffs.findIndex(s => s.email === profileData.email?.toLowerCase());
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
      const idx = prev.findIndex(s => s.email === profileData.email?.toLowerCase());
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...profileData };
        return updated;
      }
      return [...prev, profileData];
    });
  };

  // --- 1. 고객 CRUD ---
  const addCustomer = async (newCust) => {
    const custId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const row = [custId, newCust.name, newCust.dept, newCust.contact_person, newCust.phone];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '01_고객관리', row);
    }
    setCustomers(prev => [...prev, { id: custId, ...newCust }]);
  };

  const updateCustomer = async (id, updatedCust) => {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return;
    const rowIndex = index + 2; // header is row 1
    const row = [id, updatedCust.name, updatedCust.dept, updatedCust.contact_person, updatedCust.phone];

    if (isLoggedIn && accessToken) {
      await updateSheetRow(accessToken, '01_고객관리', rowIndex, row);
    }
    setCustomers(prev => prev.map(c => c.id === id ? { id, ...updatedCust } : c));
  };

  const deleteCustomer = async (id) => {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '01_고객관리', rowIndex);
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
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

    setSales(prev => [...prev, { id: saleId, ...newSale }]);
  };

  const updateSales = async (id, updatedSale) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;
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

    setSales(prev => prev.map(s => s.id === id ? { id, ...updatedSale } : s));
  };

  const deleteSales = async (id) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '02_매출견적관리', rowIndex);
    }
    setSales(prev => prev.filter(s => s.id !== id));
  };

  // --- 3. 수금 CRUD ---
  const addPayment = async (newPay) => {
    const payId = `PAY-${String(payments.length + 201).padStart(3, '0')}`;
    const row = [payId, newPay.payment_date, newPay.customer_id, newPay.amount, newPay.method];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '03_수금관리', row);
    }
    setPayments(prev => [...prev, { id: payId, ...newPay }]);
  };

  const updatePayment = async (id, updatedPay) => {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;
    const row = [id, updatedPay.payment_date, updatedPay.customer_id, updatedPay.amount, updatedPay.method];

    if (isLoggedIn && accessToken) {
      await updateSheetRow(accessToken, '03_수금관리', rowIndex, row);
    }
    setPayments(prev => prev.map(p => p.id === id ? { id, ...updatedPay } : p));
  };

  const deletePayment = async (id) => {
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) return;
    const rowIndex = index + 2;

    if (isLoggedIn && accessToken) {
      await clearSheetRow(accessToken, '03_수금관리', rowIndex);
    }
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        sales,
        payments,
        staffs,
        loading,
        error,
        refreshData: fetchAllData,
        saveStaffToSheet,
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