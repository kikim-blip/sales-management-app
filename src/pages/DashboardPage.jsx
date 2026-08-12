// src/pages/DashboardPage.jsx
import React from 'react';
import { useData } from '../context/DataContext';
import { DollarSign, AlertCircle, FileText, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { customers, sales, payments, loading, error } = useData();

  const totalSalesAmount = sales.reduce((acc, curr) => acc + curr.total_price, 0);
  const totalPaymentAmount = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaidAmount = totalSalesAmount - totalPaymentAmount;

  const customerSummary = customers.map((cust) => {
    const custSales = sales
      .filter((s) => s.customer_id === cust.id)
      .reduce((acc, curr) => acc + curr.total_price, 0);
    const custPayments = payments
      .filter((p) => p.customer_id === cust.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      ...cust,
      totalSales: custSales,
      totalPayment: custPayments,
      unpaid: custSales - custPayments,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
        <span>구글 시트에서 데이터를 읽어오는 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs">
          <strong>시트 데이터 읽기 에러:</strong> {error}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-800">영업 및 미수 현황 대시보드</h2>
        <p className="text-xs text-slate-500 mt-1">구글 시트(DB) 기반 실시간 미수금 요약 현황입니다.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 매출 청구액</p>
            <p className="text-xl font-bold text-slate-900">{totalSalesAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 입금/수금액</p>
            <p className="text-xl font-bold text-emerald-600">{totalPaymentAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-500 mb-1">총 미수금 (잔액)</p>
            <p className="text-xl font-bold text-rose-600">{totalUnpaidAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">고객사별 미수 현황 리스트</h3>
          <span className="text-xs text-slate-400">총 {customerSummary.length}개 고객사</span>
        </div>
        <div className="divide-y divide-slate-100">
          {customerSummary.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">등록된 고객 데이터가 없습니다.</div>
          ) : (
            customerSummary.map((item) => (
              <div key={item.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{item.name || '(이름없음)'}</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.dept}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">담당자: {item.contact_person} ({item.phone})</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6 text-right">
                  <div>
                    <p className="text-[11px] text-slate-400">총 청구</p>
                    <p className="text-xs font-medium text-slate-700">{item.totalSales.toLocaleString()} 원</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">수금 완료</p>
                    <p className="text-xs font-medium text-emerald-600">{item.totalPayment.toLocaleString()} 원</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-rose-500">미수금액</p>
                    <p className="text-sm font-bold text-rose-600">{item.unpaid.toLocaleString()} 원</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}