// src/components/common/CustomerDetailModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, Building2, User, Phone, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomerDetailModal({ customer, sales, payments, onClose }) {
  const printRef = useRef();

  if (!customer) return null;

  // 고객사의 매출 및 수금 내역 추출
  const customerSales = sales.filter(s => s.customer_id === customer.id);
  const customerPayments = payments.filter(p => p.customer_id === customer.id);

  const totalSales = customerSales.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const totalPayment = customerPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const unpaidBalance = totalSales - totalPayment;

  // 전체 거래 장부 (날짜 순 정렬 및 잔액 계산)
  const ledgerItems = [
    ...customerSales.map(s => ({
      date: s.delivery_date || s.reg_date || '',
      type: s.type || '매출',
      title: s.title || '',
      content: s.content || '',
      salesAmount: s.total_price || 0,
      paymentAmount: 0,
      rawItem: s,
    })),
    ...customerPayments.map(p => ({
      date: p.payment_date || '',
      type: '수금',
      title: `수금 입금 (${p.method || '계좌이체'})`,
      content: `결제수단: ${p.method || '계좌이체'}`,
      salesAmount: 0,
      paymentAmount: p.amount || 0,
      rawItem: p,
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 누적 미수 잔액 계산
  let runningBalance = 0;
  const ledgerWithBalance = ledgerItems.map(item => {
    runningBalance += (item.salesAmount - item.paymentAmount);
    return {
      ...item,
      runningBalance,
    };
  });

  // 1. 엑셀 다운로드 기능 (.xlsx)
  const handleExportExcel = () => {
    const today = new Date().toISOString().split('T')[0];

    const excelData = [
      ['고객사명', customer.name, '과/부서명', customer.dept],
      ['담당자', customer.contact_person, '연락처', customer.phone],
      ['총 매출액', `${totalSales.toLocaleString()} 원`, '총 수금액', `${totalPayment.toLocaleString()} 원`],
      ['미수 잔액', `${unpaidBalance.toLocaleString()} 원`, '기준일자', today],
      [], // 공백
      ['날짜', '구분', '항목명/작업내용', '청구 금액(매출)', '입금 금액(수금)', '누적 미수 잔액'],
      ...ledgerWithBalance.map(item => [
        item.date,
        item.type,
        item.title,
        item.salesAmount ? item.salesAmount : 0,
        item.paymentAmount ? item.paymentAmount : 0,
        item.runningBalance,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '미수금내역서');

    // 파일 저장
    const fileName = `${customer.name}_미수금내역서_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 2. PDF / 브라우저 인쇄 기능
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 상단 헤더 (인쇄 시 숨김) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {customer.name} - 미수금 상세 내역서
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 영역 (인쇄 대상) */}
        <div ref={printRef} className="p-6 space-y-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          
          {/* 고객 정보 & 잔액 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 고객 기본 정보 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 md:col-span-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-base">{customer.name}</span>
                {customer.dept && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{customer.dept}</span>}
              </div>
              <p className="text-xs text-slate-600 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>담당자: {customer.contact_person || '미지정'}</span>
              </p>
              <p className="text-xs text-slate-600 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>연락처: {customer.phone || '미지정'}</span>
              </p>
            </div>

            {/* 재무 요약 3종 */}
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl flex flex-col justify-center">
                <p className="text-xs font-semibold text-blue-600 mb-1">총 청구 (매출)</p>
                <p className="text-base sm:text-lg font-bold text-slate-900">{totalSales.toLocaleString()} 원</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl flex flex-col justify-center">
                <p className="text-xs font-semibold text-emerald-600 mb-1">총 수금 (입금)</p>
                <p className="text-base sm:text-lg font-bold text-emerald-700">{totalPayment.toLocaleString()} 원</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex flex-col justify-center">
                <p className="text-xs font-semibold text-rose-600 mb-1">잔여 미수금</p>
                <p className="text-base sm:text-lg font-extrabold text-rose-600">{unpaidBalance.toLocaleString()} 원</p>
              </div>
            </div>
          </div>

          {/* 상세 거래 장부 테이블 */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>거래 및 수금 연동 상세 장부</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">날짜</th>
                    <th className="p-3">구분</th>
                    <th className="p-3">작업명 / 상세내용</th>
                    <th className="p-3 text-right">매출 청구액</th>
                    <th className="p-3 text-right">수금 입금액</th>
                    <th className="p-3 text-right">누적 미수잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        거래 및 수금 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithBalance.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-600 font-mono">{item.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.type === '수금'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.type === '매출'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          <div>{item.title}</div>
                          {item.content && <div className="text-[11px] text-slate-400 font-normal mt-0.5">{item.content}</div>}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800">
                          {item.salesAmount > 0 ? `${item.salesAmount.toLocaleString()} 원` : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {item.paymentAmount > 0 ? `+${item.paymentAmount.toLocaleString()} 원` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {item.runningBalance.toLocaleString()} 원
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 (인쇄 시 숨김) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 다운로드 (.xlsx)</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF 저장</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
