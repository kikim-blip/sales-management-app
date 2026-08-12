// src/context/DataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleAuth } from './GoogleAuthContext';
import { getSheetValues, appendSheetValue, parseCustomers, parseSales, parsePayments } from '../services/googleSheetsApi';
import { sendWebhookEvent } from '../services/webhookService';
import { initialCustomers, initialSales, initialPayments } from '../data/dummyData';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { accessToken, isLoggedIn } = useGoogleAuth();

  const [customers, setCustomers] = useState(initialCustomers);
  const [sales, setSales] = useState(initialSales);
  const [payments, setPayments] = useState(initialPayments);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn || !accessToken) {
      setCustomers(initialCustomers);
      setSales(initialSales);
      setPayments(initialPayments);
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
    } catch (err) {
      console.error('시트 데이터 불러오기 에러:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isLoggedIn]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 1. 신규 고객 저장
  const addCustomer = async (newCust) => {
    const custId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const row = [custId, newCust.name, newCust.dept, newCust.contact_person, newCust.phone];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '01_고객관리', row);
    }
    setCustomers(prev => [...prev, { id: custId, ...newCust }]);
  };

  // 2. 신규 매출/견적 저장 (구글 시트 + Webhook 연동)
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

    // 구글 캘린더 / 슈퍼스레드 Webhook 전송
    const custObj = customers.find(c => c.id === newSale.customer_id);
    const payload = {
      ...newSale,
      id: saleId,
      customer_name: custObj ? `${custObj.name} (${custObj.dept})` : '미지정',
    };
    sendWebhookEvent(payload);

    setSales(prev => [...prev, { id: saleId, ...newSale }]);
  };

  // 3. 신규 수금 저장
  const addPayment = async (newPay) => {
    const payId = `PAY-${String(payments.length + 201).padStart(3, '0')}`;
    const row = [payId, newPay.payment_date, newPay.customer_id, newPay.amount, newPay.method];

    if (isLoggedIn && accessToken) {
      await appendSheetValue(accessToken, '03_수금관리', row);
    }
    setPayments(prev => [...prev, { id: payId, ...newPay }]);
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        sales,
        payments,
        loading,
        error,
        refreshData: fetchAllData,
        addCustomer,
        addSales,
        addPayment,
        isUsingSheetsDB: isLoggedIn && !error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);