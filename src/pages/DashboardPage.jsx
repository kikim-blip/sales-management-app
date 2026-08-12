// src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { DollarSign, AlertCircle, FileText, RefreshCw, ChevronRight, Clock, AlertTriangle, Calendar, Printer, CheckCircle2 } from 'lucide-react';
import CustomerDetailModal from '../components/common/CustomerDetailModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';

export default function DashboardPage() {
  const { customers, sales, payments, jobOrders, loading, error } = useData();
  const { user } = useGoogleAuth();
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

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

  // D-Day 계산 헬퍼
  const getDDayInfo = (deliveryDateStr) => {
    if (!deliveryDateStr) return { diffDays: 999, label: '일정미정', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    const target = new Date(deliveryDateStr);
    const now = new Date(todayStr);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { diffDays, label: `⚠️ 납품 지연 (D+${Math.abs(diffDays)})`, color: 'bg-rose-600 text-white border-rose-700 animate-pulse' };
    }
    if (diffDays === 0) {
      return { diffDays, label: '🚨 오늘 납품 (D-DAY)', color: 'bg-rose-500 text-white border-rose-600 font-black animate-bounce' };
    }
    if (diffDays === 1) {
      return { diffDays, label: '⚡ 내일 납품 (D-1)', color: 'bg-amber-500 text-white border-amber-600 font-bold' };
    }
    if (diffDays <= 3) {
      return { diffDays, label: `🔥 긴급 임박 (D-${diffDays})`, color: 'bg-sky-500 text-white border-sky-600 font-bold' };
    }
    return { diffDays, label: `📅 D-${diffDays}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // 🚨 납품 일정 급건 순 정렬 리스트 생성
  const urgentDeliveryList = [...jobOrders]
    .map(order => {
      const dday = getDDayInfo(order.delivery_date);
      const cust = customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        dday,
        customerNameDisplay: cust ? `${cust.name} - ${cust.dept}` : (order.customer_name || order.customer_id || '미지정'),
      };
    })
    .sort((a, b) => {
      // 1순위: D-Day 급건순 (지연/당일/내일/임박 순)
      if (a.dday.diffDays !== b.dday.diffDays) {
        return a.dday.diffDays - b.dday.diffDays;
      }
      // 2순위: 납품 시간 빠른 순
      return (a.delivery_time || '23:59').localeCompare(b.delivery_time || '23:59');
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
      {error && !error.includes('Quota exceeded') && !error.includes('Read requests') && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs">
          <strong>시트 데이터 읽기 에러:</strong> {error}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-800">영업 및 미수 현황 대시보드</h2>
        <p className="text-xs text-slate-500 mt-1">긴급 납품 일정을 실시간으로 파악하고 고객사별 미수 내역을 관리합니다.</p>
      </div>

      {/* 요약 현황 카운터 3종 */}
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

      {/* 🚨 1. 실시간 납품 일정 급건 순서 리스트 (신규 추가!) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">🚨 납품 일정 급건 우선 리스트 (D-Day 순)</h3>
          </div>
          <span className="text-xs text-amber-300 font-semibold">
            {urgentDeliveryList.filter(o => o.dday.diffDays <= 1).length}건 급건/오늘 납품대기
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {urgentDeliveryList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-600">현재 예정된 긴급 납품 작업전표가 없습니다.</p>
              <p>작업전표 관리 탭에서 새로운 의뢰 전표를 작성해 보세요.</p>
            </div>
          ) : (
            urgentDeliveryList.map((order) => (
              <div
                key={order.code_number || order.id}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* D-Day 뱃지 */}
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono tracking-wide ${order.dday.color}`}>
                      {order.dday.label}
                    </span>

                    {/* 코드번호 */}
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      코드: {order.code_number}
                    </span>

                    {/* 담당직원 */}
                    <span className="text-xs text-slate-500">
                      담당: <strong className="text-slate-800">{order.manager_name}</strong>
                    </span>
                  </div>

                  {/* 제목 및 발주처 */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{order.title}</h4>
                    <p className="text-xs font-semibold text-sky-600 mt-0.5">
                      발주처: {order.customerNameDisplay} (담당: {order.client_contact_person || '미지정'})
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">
                    사양: {order.spec || '-'} | 수량: {order.quantity ? `${order.quantity}부` : '-'} | 제본: {order.binding || '-'} | 표지: {order.cover_job || '-'}
                  </p>
                </div>

                {/* 납품 희망 일자 및 액션 버튼 */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2 text-right">
                  <div>
                    <p className="text-[11px] text-slate-400">납품 희망 일시</p>
                    <p className="text-xs font-bold text-rose-600 font-mono">
                      {order.delivery_date} {order.delivery_time ? `(${order.delivery_time})` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => setPrintingOrder(order)}
                    className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-300" />
                    <span>실물 전표 인쇄</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. 고객사별 미수 현황 리스트 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">고객사별 미수 현황 리스트</h3>
            <p className="text-[11px] text-slate-400">클릭하여 상세 미수 내역 장부 / 엑셀 / PDF 출력</p>
          </div>
          <span className="text-xs text-slate-400">총 {customerSummary.length}개 고객사</span>
        </div>

        <div className="divide-y divide-slate-100">
          {customerSummary.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">등록된 고객 데이터가 없습니다.</div>
          ) : (
            customerSummary.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCustomer(item)}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sky-50/60 cursor-pointer transition group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition">{item.name || '(이름없음)'}</span>
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
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 미수 상세 장부 및 엑셀/PDF 모달 */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={sales}
          payments={payments}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* 1:1 실물 전표 인쇄 모달 */}
      {printingOrder && (
        <JobOrderPrintModal
          order={printingOrder}
          customer={customers.find(c => c.id === printingOrder.customer_id)}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}