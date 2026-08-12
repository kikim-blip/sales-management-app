// src/components/common/QuotePrintModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, FileText, Stamp, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGoogleAuth } from '../../context/GoogleAuthContext';

export default function QuotePrintModal({ quote, customer, onClose }) {
  const { user } = useGoogleAuth();
  const printRef = useRef();

  if (!quote) return null;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : '거래처';
  const custDept = customer ? customer.dept : '';
  const custContact = customer ? customer.contact_person : '';
  const custPhone = customer ? customer.phone : '';

  const managerName = user?.userName || '홍길동';
  const userCode = user?.userCode || '84';

  // 비교견적서 모드 인가?
  const [isComparative, setIsComparative] = React.useState(false);

  // 비교견적 타사 (비교B사) 자동 계산 마진율 12% 높게 설정
  const compPriceB = Math.round((quote.supply_price || 0) * 1.12);
  const compTaxB = Math.round(compPriceB * 0.1);
  const compTotalB = compPriceB + compTaxB;

  // 엑셀 다운로드
  const handleExportExcel = () => {
    const fileName = isComparative
      ? `비교견적서_${custName}_${quote.title}_${today}.xlsx`
      : `견적서_${custName}_${quote.title}_${today}.xlsx`;

    let excelRows = [];

    if (!isComparative) {
      excelRows = [
        ['견 적 서 (QUOTATION)'],
        [],
        ['견적 번호', quote.id, '발행 일자', today],
        ['수신 (공급받는자)', `${custName} ${custDept}`, '담당자', `${custContact} (${custPhone})`],
        ['발행 (공급자)', '주식회사 영업관리 PWA', '담당 사원', `${managerName} (${userCode})`],
        [],
        ['품명 / 작업명', '상세 사양', '공급가액', '세액(10%)', '합계금액(VAT포함)'],
        [quote.title, quote.content || '-', quote.supply_price, quote.tax, quote.total_price],
        [],
        ['합 계 금 액', '', '', '', `${quote.total_price.toLocaleString()} 원`],
      ];
    } else {
      excelRows = [
        ['비 교 견 적 서 (COMPARATIVE QUOTATION)'],
        [],
        ['수신 고객사', `${custName} ${custDept}`, '기준 일자', today],
        ['작업명', quote.title],
        [],
        ['구분', '공급자 상호', '공급가액', '부가세(VAT)', '총견적금액', '비고'],
        ['당사 (제출안)', `주식회사 영업관리 (${managerName})`, quote.supply_price, quote.tax, quote.total_price, '최적단가 적용'],
        ['비교 (B 사)', '(주)비교디자인', compPriceB, compTaxB, compTotalB, '시장 표준단가'],
      ];
    }

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isComparative ? '비교견적서' : '견적서');
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 탭 & 닫기 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">
              문서 양식 출력 모드
            </h3>
            
            {/* 표준 vs 비교견적 토글 탭 */}
            <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold space-x-1">
              <button
                onClick={() => setIsComparative(false)}
                className={`px-3 py-1 rounded-lg transition ${
                  !isComparative ? 'bg-white text-sky-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                표준 견적서
              </button>
              <button
                onClick={() => setIsComparative(true)}
                className={`px-3 py-1 rounded-lg transition ${
                  isComparative ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                비교 견적서
              </button>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 양식 서식 본문 (인쇄용) */}
        <div ref={printRef} className="p-8 space-y-6 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          
          {/* Document Title Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
              {isComparative ? '비 교 견 적 서' : '견  적  서'}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {isComparative ? 'COMPARATIVE QUOTATION' : 'ESTIMATE & QUOTATION'}
            </p>
          </div>

          {/* 인적사항 / 공급자 / 공급받는자 Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            {/* 공급받는자 (고객사) */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-2 bg-slate-50/50">
              <div className="font-bold text-sky-700 border-b border-slate-200 pb-1 flex justify-between">
                <span>[ 공급받는 자 ]</span>
                <span className="text-[11px] font-mono text-slate-400">NO: {quote.id}</span>
              </div>
              <p><strong className="text-slate-700">고 객 사 :</strong> {custName}</p>
              <p><strong className="text-slate-700">과/부서 :</strong> {custDept || '-'}</p>
              <p><strong className="text-slate-700">담 당 자 :</strong> {custContact || '-'} ({custPhone})</p>
              <p><strong className="text-slate-700">견적일자 :</strong> {today}</p>
            </div>

            {/* 공급자 (당사) */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-2 relative bg-slate-50/50">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between">
                <span>[ 공 급 자 ]</span>
                <span className="text-[11px] text-slate-400">등록번호: 123-45-67890</span>
              </div>
              <p><strong className="text-slate-700">상 호 명 :</strong> 주식회사 영업관리 PWA</p>
              <p><strong className="text-slate-700">담당 사원 :</strong> <span className="font-bold text-sky-700">{managerName}</span> (사원번호: {userCode})</p>
              <p><strong className="text-slate-700">소 재 지 :</strong> 서울특별시 강남구 테헤란로 123</p>
              <p><strong className="text-slate-700">연 락 처 :</strong> 02-1234-5678</p>

              {/* 직인 도장 아이콘 visual */}
              <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full border-2 border-rose-500 text-rose-500 flex items-center justify-center font-bold text-[10px] transform rotate-12 opacity-80 select-none">
                <div className="text-center leading-none">
                  <Stamp className="w-4 h-4 mx-auto mb-0.5" />
                  <span>직인</span>
                </div>
              </div>
            </div>
          </div>700">소 재 지 :</strong> 서울특별시 강남구 테헤란로 123</p>
              <p><strong className="text-slate-700">연 락 처 :</strong> 02-1234-5678</p>

              {/* 직인 도장 아이콘 visual */}
              <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full border-2 border-rose-500 text-rose-500 flex items-center justify-center font-bold text-[10px] transform rotate-12 opacity-80 select-none">
                <div className="text-center leading-none">
                  <Stamp className="w-4 h-4 mx-auto mb-0.5" />
                  <span>직인</span>
                </div>
              </div>
            </div>
          </div>

          {/* 총합 금액 강조 배너 */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider">합계금액 (VAT 포함)</span>
            <span className="text-xl font-extrabold text-sky-400 font-mono">
              ₩ {(isComparative ? quote.total_price : quote.total_price).toLocaleString()} 원
            </span>
          </div>

          {/* 일반 견적서 표 vs 비교 견적서 표 */}
          {!isComparative ? (
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-700">
                  <tr>
                    <th className="p-3">품명 / 작업명</th>
                    <th className="p-3">상세 사양 및 규격</th>
                    <th className="p-3 text-right">공급가액</th>
                    <th className="p-3 text-right">세액 (10%)</th>
                    <th className="p-3 text-right">총 금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-slate-800">{quote.title}</td>
                    <td className="p-3 text-slate-600">{quote.content || '-'}</td>
                    <td className="p-3 text-right font-medium">{quote.supply_price.toLocaleString()} 원</td>
                    <td className="p-3 text-right font-medium text-slate-500">{quote.tax.toLocaleString()} 원</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{quote.total_price.toLocaleString()} 원</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="p-3 text-center text-slate-700">합 계</td>
                    <td className="p-3 text-right">{quote.supply_price.toLocaleString()} 원</td>
                    <td className="p-3 text-right">{quote.tax.toLocaleString()} 원</td>
                    <td className="p-3 text-right text-sky-700">{quote.total_price.toLocaleString()} 원</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* 비교 견적서 테이블 */
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>업체별 단가 비교 명세서</span>
              </p>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50 font-bold border-b border-slate-300 text-purple-900">
                    <tr>
                      <th className="p-3">구분</th>
                      <th className="p-3">공급 업체명</th>
                      <th className="p-3 text-right">공급가액</th>
                      <th className="p-3 text-right">부가세 (VAT)</th>
                      <th className="p-3 text-right">총 견적금액</th>
                      <th className="p-3">비고 / 평가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-sky-50/50">
                      <td className="p-3 font-bold text-sky-700">당 사 (제출안)</td>
                      <td className="p-3 font-bold text-slate-800">주식회사 영업관리 PWA</td>
                      <td className="p-3 text-right font-medium">{quote.supply_price.toLocaleString()} 원</td>
                      <td className="p-3 text-right text-slate-500">{quote.tax.toLocaleString()} 원</td>
                      <td className="p-3 text-right font-extrabold text-sky-700">{quote.total_price.toLocaleString()} 원</td>
                      <td className="p-3 font-bold text-emerald-600">★ 최저가 추천안</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-slate-500">비교 B 사</td>
                      <td className="p-3 text-slate-600">(주)비교디자인</td>
                      <td className="p-3 text-right font-medium">{compPriceB.toLocaleString()} 원</td>
                      <td className="p-3 text-right text-slate-500">{compTaxB.toLocaleString()} 원</td>
                      <td className="p-3 text-right font-bold text-slate-800">{compTotalB.toLocaleString()} 원</td>
                      <td className="p-3 text-slate-400">시장 표준 단가 대비 +12%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p>• <strong>유효기간:</strong> 견적 발행일로부터 30일간 유효합니다.</p>
            <p>• <strong>결제조건:</strong> 납품 완료 후 30일 이내 계좌 입금 기준입니다.</p>
          </div>

        </div>

        {/* 액션 버튼 */}
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
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF 저장</span>
            </button>
          </div>

          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100">
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
