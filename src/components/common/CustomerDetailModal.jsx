// src/components/common/CustomerDetailModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, Building2, User, Phone, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomerDetailModal({ customer, sales = [], payments = [], onClose }) {
  const printRef = useRef();

  if (!customer) return null;

  const targetOrgName = customer.orgName || customer.name || customer.customer_name || '';
  const targetDeptName = customer.deptName || customer.dept || '';
  const targetContact = customer.contactPerson || customer.contact_person || '';

  // 1. 해당 고객(또는 그룹)의 매출 내역 추출
  let rawSales = [];
  if (customer.salesList && customer.salesList.length > 0) {
    rawSales = customer.salesList;
  } else if (customer.custIds && customer.custIds.length > 0) {
    rawSales = sales.filter(s => customer.custIds.includes(s.customer_id));
  } else {
    rawSales = sales.filter(s => {
      if (customer.id && s.customer_id === customer.id) return true;
      if (s.customer_name === targetOrgName) {
        if (!targetDeptName) return true;
        return (s.dept || '') === targetDeptName;
      }
      return false;
    });
  }

  // 2. 해당 고객(또는 그룹)의 수금 내역 추출
  let rawPayments = [];
  if (customer.paymentList && customer.paymentList.length > 0) {
    rawPayments = customer.paymentList;
  } else if (customer.custIds && customer.custIds.length > 0) {
    rawPayments = payments.filter(p => customer.custIds.includes(p.customer_id));
  } else {
    rawPayments = payments.filter(p => {
      if (customer.id && p.customer_id === customer.id) return true;
      if (p.customer_name === targetOrgName) {
        if (!targetDeptName) return true;
        return (p.dept || '') === targetDeptName;
      }
      return false;
    });
  }

  // 3. 거래원장 일자별 목록 산출 (정확한 금액 및 거래처 세부정보 매핑)
  const ledgerItems = [];

  rawSales.forEach((s) => {
    const amount = Number(s.sales || s.total_price || s.salesAmount || 0);
    const dateVal = s.date || s.reg_date || s.receipt_date || s.delivery_date || '';
    const org = s.orgName || s.customer_name || targetOrgName;
    const dept = s.deptName || s.dept || targetDeptName;
    const contact = s.contactPerson || s.contact_person || s.client_contact_person || targetContact;
    const titleVal = s.title || s.description || '매출 건';
    const noteVal = s.note || s.content || s.billing_schedule || '';

    ledgerItems.push({
      date: dateVal,
      orgName: org,
      deptName: dept,
      contactPerson: contact,
      type: '매출',
      title: titleVal,
      salesAmount: amount,
      paymentAmount: 0,
      note: noteVal,
    });
  });

  rawPayments.forEach((p) => {
    const amount = Number(p.payment || p.amount || p.paymentAmount || 0);
    const dateVal = p.date || p.payment_date || '';
    const org = p.orgName || p.customer_name || targetOrgName;
    const dept = p.deptName || p.dept || targetDeptName;
    const contact = p.contactPerson || p.contact_person || targetContact;
    const titleVal = p.title || p.description || `수금 입금 (${p.method || '계좌이체'})`;
    const noteVal = p.note || p.content || (p.method ? `결제수단: ${p.method}` : '수금 정산');

    ledgerItems.push({
      date: dateVal,
      orgName: org,
      deptName: dept,
      contactPerson: contact,
      type: '수금',
      title: titleVal,
      salesAmount: 0,
      paymentAmount: amount,
      note: noteVal,
    });
  });

  // 일자순 정렬
  ledgerItems.sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31'));

  // 누적 미수 잔액 계산
  let runningBalance = 0;
  let totalSales = 0;
  let totalPayment = 0;

  const ledgerWithBalance = ledgerItems.map((item) => {
    totalSales += item.salesAmount;
    totalPayment += item.paymentAmount;
    runningBalance += (item.salesAmount - item.paymentAmount);
    return {
      ...item,
      runningBalance,
    };
  });

  const unpaidBalance = totalSales - totalPayment;

  // 1. 요청하신 컬럼 순서로 엑셀 다운로드 (.xlsx)
  // 순서: 일자 | 기관명 | 과 | 담당자 | 작업명 | 매출금액 | 수금금액 | 비고
  const handleExportExcel = () => {
    const today = new Date().toISOString().split('T')[0];

    const excelData = [
      [`${targetOrgName} - 일자별 거래 및 미수금 상세 장부`, '', '', '', '', '', '', `추출일자: ${today}`],
      [],
      ['기관명(고객사)', targetOrgName, '부서/과', targetDeptName || '전체', '담당자', targetContact || '미지정', '기준일자', today],
      ['총 매출액', totalSales, '총 수금액', totalPayment, '미수금 잔액', unpaidBalance, '', ''],
      [],
      ['일자', '기관명', '과', '담당자', '작업명', '매출금액', '수금금액', '비고'],
      ...ledgerWithBalance.map((item) => [
        item.date || '-',
        item.orgName || '-',
        item.deptName || '-',
        item.contactPerson || '-',
        item.title || '-',
        item.salesAmount || 0,
        item.paymentAmount || 0,
        item.note || '-',
      ]),
      [],
      [
        '합계', '', '', '', `${ledgerWithBalance.length} 건`,
        totalSales,
        totalPayment,
        `미수 잔액: ₩ ${unpaidBalance.toLocaleString()} 원`,
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '거래상세장부');

    const fileName = `${targetOrgName}${targetDeptName ? `_${targetDeptName}` : ''}_거래장부_${today}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // 2. 브라우저 인쇄
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 상단 헤더 (인쇄 시 숨김) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              {targetOrgName} {targetDeptName ? `(${targetDeptName})` : ''} - 일자별 거래 및 미수금 상세 장부
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 영역 */}
        <div ref={printRef} className="p-6 space-y-5 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          
          {/* 고객 정보 & 잔액 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 기본 정보 */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 md:col-span-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                <span>{targetOrgName}</span>
                {targetDeptName && (
                  <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-normal">
                    {targetDeptName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>담당: {targetContact || '미지정'}</span>
              </p>
              {(customer.phone || customer.email) && (
                <p className="text-xs text-slate-600 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.phone || customer.email}</span>
                </p>
              )}
            </div>

            {/* 재무 요약 3종 */}
            <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl flex flex-col justify-center">
              <p className="text-xs font-semibold text-blue-600 mb-1">총 청구 (매출)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900">₩ {totalSales.toLocaleString()} 원</p>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl flex flex-col justify-center">
              <p className="text-xs font-semibold text-emerald-600 mb-1">총 수금 (입금)</p>
              <p className="text-base sm:text-lg font-bold text-emerald-700">₩ {totalPayment.toLocaleString()} 원</p>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-col justify-center">
              <p className="text-xs font-semibold text-rose-600 mb-1">잔여 미수금</p>
              <p className="text-base sm:text-lg font-extrabold text-rose-600">₩ {unpaidBalance.toLocaleString()} 원</p>
            </div>
          </div>

          {/* 상세 거래 장부 테이블 (요청된 컬럼: 일자 | 기관명 | 과 | 담당자 | 작업명 | 매출금액 | 수금금액 | 비고) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>일자별 상세 거래 및 수금 장부</span>
                <span className="text-xs font-normal text-slate-500">({ledgerWithBalance.length}건)</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3 pl-4">일자</th>
                    <th className="p-3">기관명</th>
                    <th className="p-3">과 (부서)</th>
                    <th className="p-3">담당자</th>
                    <th className="p-3">작업명</th>
                    <th className="p-3 text-right">매출금액</th>
                    <th className="p-3 text-right">수금금액</th>
                    <th className="p-3 pr-4">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        해당 조건에 등록된 거래 및 수금 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithBalance.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 pl-4 text-slate-600 font-mono">{item.date || '-'}</td>
                        <td className="p-3 font-bold text-slate-900">{item.orgName || '-'}</td>
                        <td className="p-3 text-slate-600 font-medium">{item.deptName || '-'}</td>
                        <td className="p-3 text-slate-600">{item.contactPerson || '-'}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.type === '수금' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.type}
                            </span>
                            <span>{item.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {item.salesAmount > 0 ? `₩ ${item.salesAmount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          {item.paymentAmount > 0 ? `₩ ${item.paymentAmount.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 pr-4 text-slate-500 text-[11px] max-w-[200px] truncate" title={item.note}>
                          {item.note || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="p-3 pl-4" colSpan={5}>
                      합계 ({ledgerWithBalance.length}건)
                    </td>
                    <td className="p-3 text-right font-mono text-slate-900">
                      ₩ {totalSales.toLocaleString()} 원
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700">
                      ₩ {totalPayment.toLocaleString()} 원
                    </td>
                    <td className="p-3 pr-4 text-rose-700 font-black">
                      미수: ₩ {unpaidBalance.toLocaleString()} 원
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              title="일자, 기관명, 과, 담당자, 작업명, 매출금액, 수금금액, 비고 순으로 엑셀을 추출합니다."
            >
              <Download className="w-4 h-4" />
              <span>📥 엑셀 다운로드 (.xlsx)</span>
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



