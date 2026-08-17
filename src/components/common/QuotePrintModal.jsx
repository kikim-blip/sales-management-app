// src/components/common/QuotePrintModal.jsx
import React, { useRef, useState } from 'react';
import { X, Download, Printer, FileText, Stamp, Layers, BookOpen, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { getLocalDateStr } from '../../utils/dateUtils';

// 숫자를 한글 금액 표기(일백삼십이만)로 변환하는 유틸리티
function numberToKoreanWon(num) {
  if (!num || isNaN(num) || num === 0) return '영';
  const units = ['', '만', '억', '조'];
  const smallUnits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const digitUnits = ['', '십', '백', '천'];

  let result = '';
  let unitIndex = 0;
  let n = Math.floor(Math.abs(num));

  while (n > 0) {
    const chunk = n % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const digit = temp % 10;
        if (digit > 0) {
          chunkStr = smallUnits[digit] + digitUnits[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
      }
      result = chunkStr + units[unitIndex] + ' ' + result;
    }
    unitIndex++;
    n = Math.floor(n / 10000);
  }

  return result.trim();
}

export default function QuotePrintModal({ quote, customer, onClose }) {
  const { user } = useGoogleAuth();
  const printRef = useRef();
  const [isComparative, setIsComparative] = useState(false);

  if (!quote) return null;

  const today = getLocalDateStr();
  const todayKorean = `${today.split('-')[0]}년 ${Number(today.split('-')[1])}월 ${Number(today.split('-')[2])}일`;

  const custName = customer ? customer.name : (quote.customer_name || '거래처');
  const custDept = customer ? customer.dept : (quote.dept || '');
  const custContact = customer ? customer.contact_person : (quote.contact_person || '');
  const custPhone = customer ? customer.phone : (quote.phone || '');

  const managerName = quote.sales_manager || quote.manager_name || user?.userName || '김광일';
  const estimateType = quote.estimate_type || 'print'; // 'print' | 'general'

  // 품목 목록 파싱
  const parsedItems = (() => {
    if (Array.isArray(quote.estimate_items) && quote.estimate_items.length > 0) return quote.estimate_items;
    if (typeof quote.estimate_items === 'string' && quote.estimate_items.startsWith('[')) {
      try {
        const parsed = JSON.parse(quote.estimate_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        name: quote.title || '작업명',
        spec: quote.spec || '-',
        pages: '',
        quantity: 1,
        unit: estimateType === 'print' ? '부' : '식',
        unit_price: quote.supply_price || 0,
        amount: quote.supply_price || 0,
        note: quote.content || '',
      }
    ];
  })();

  const isPrintTemplate = estimateType === 'print' || parsedItems.some(it => it.pages && Number(it.pages) > 0);

  const supplyPrice = Number(quote.supply_price) || 0;
  const taxPrice = Number(quote.tax) || Math.round(supplyPrice * 0.1);
  const totalPrice = Number(quote.total_price) || (supplyPrice + taxPrice);
  const koreanTotalPrice = numberToKoreanWon(totalPrice);

  // 비교견적 타사 (비교B사) 자동 계산
  const compPriceB = Math.round(supplyPrice * 1.12);
  const compTaxB = Math.round(compPriceB * 0.1);
  const compTotalB = compPriceB + compTaxB;

  // 엑셀 다운로드 (경성문화사 공식 엑셀 양식 구조)
  const handleExportExcel = () => {
    const fileName = isComparative
      ? `비교견적서_${custName}_${quote.title}_${today}.xlsx`
      : `견적서_${custName}_${quote.title}_${today}.xlsx`;

    let excelRows = [];

    if (!isComparative) {
      excelRows = [
        ['견  적  서', '', '', '', '', '', ''],
        [],
        [`${custName} ${custDept}`.trim(), '貴中', '', '주식회사 경성문화사', '', '사업자번호: 659-87-00026 / 대표: 박진태'],
        ['담당자', custContact || '-', '', '주소', '', '세종특별자치시 한누리대로 486 농협세종센터 9층 (국토부)'],
        ['작성자', managerName, '', '전화/팩스', '', '전화: 044) 864-5577 / 팩스: 044) 866-5540'],
        ['작성일', todayKorean, '', 'e-mail', '', 'ksks5577@hanmail.net'],
        ['품  명', quote.title || '-', '', '', '', ''],
        ['금  액', `${koreanTotalPrice} 원整`, '', '', `₩ ${totalPrice.toLocaleString()} (단위:원)`, ''],
        [],
      ];

      if (isPrintTemplate) {
        excelRows.push(['품명', '규격', '페이지', '수량(부수)', '단가', '금액', '비고']);
        parsedItems.forEach((it) => {
          excelRows.push([
            it.name || quote.title,
            it.spec || '-',
            it.pages || 1,
            it.quantity || 1,
            it.unit_price || 0,
            it.amount || 0,
            it.note || '',
          ]);
        });
      } else {
        excelRows.push(['품명', '규격', '수량', '단위', '단가', '금액', '비고']);
        parsedItems.forEach((it) => {
          excelRows.push([
            it.name || quote.title,
            it.spec || '-',
            it.quantity || 1,
            it.unit || '식',
            it.unit_price || 0,
            it.amount || 0,
            it.note || '',
          ]);
        });
      }

      excelRows.push([]);
      excelRows.push(['', '', '', '', '소계', supplyPrice]);
      excelRows.push(['', '', '', '', '공급가액', supplyPrice, '절사']);
      excelRows.push(['', '', '', '', '부 가 세', taxPrice]);
      excelRows.push(['', '', '', '', '합계금액', totalPrice]);
      if (quote.estimate_note) {
        excelRows.push([]);
        excelRows.push(['특이사항', quote.estimate_note]);
      }
    } else {
      excelRows = [
        ['비 교 견 적 서 (COMPARATIVE QUOTATION)'],
        [],
        ['수신 고객사', `${custName} ${custDept}`, '기준 일자', todayKorean],
        ['작업명', quote.title],
        [],
        ['구분', '공급자 상호', '공급가액', '부가세(VAT)', '총견적금액', '비고'],
        ['당사 (제출안)', `주식회사 경성문화사 (${managerName})`, supplyPrice, taxPrice, totalPrice, '최적단가 적용'],
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* 모달 상단 툴바 (화면 전용) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              공식 견적서 인쇄 및 내보내기
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

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄 / PDF 저장</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 양식 서식 본문 (경성문화사 공식 견적서 양식 100% 재현) ── */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* 1. 견적서 메인 대제목 */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-black tracking-[0.6em] text-slate-950 underline decoration-2 underline-offset-8">
              {isComparative ? '비 교 견 적 서' : '견   적   서'}
            </h1>
          </div>

          {!isComparative ? (
            <div className="space-y-4">
              
              {/* 2. 상단 수신처 및 공급자 경성문화사 테이블 헤더 */}
              <div className="grid grid-cols-12 border-2 border-slate-900 text-xs">
                
                {/* 좌측: 수신처 (공급받는 자) */}
                <div className="col-span-12 sm:col-span-5 border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 flex flex-col justify-between p-3 bg-white">
                  <div className="space-y-1.5 text-center my-auto py-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {custName}
                    </h2>
                    {custDept && (
                      <h3 className="text-sm font-bold text-slate-700">
                        {custDept}
                      </h3>
                    )}
                    <p className="text-base font-black text-slate-900 tracking-widest pt-1">
                      貴  中
                    </p>
                  </div>

                  <div className="border-t border-slate-300 pt-2 space-y-1 text-[11px] text-slate-700">
                    <div className="flex"><span className="w-14 text-slate-500 font-semibold">담당자:</span> <span className="font-bold">{custContact || '-'} {custPhone ? `(${custPhone})` : ''}</span></div>
                    <div className="flex"><span className="w-14 text-slate-500 font-semibold">작성자:</span> <span className="font-bold text-sky-800">{managerName}</span></div>
                    <div className="flex"><span className="w-14 text-slate-500 font-semibold">작성일:</span> <span className="font-semibold">{todayKorean}</span></div>
                  </div>
                </div>

                {/* 우측: 공급자 (경성문화사 공식 정보 + 직인) */}
                <div className="col-span-12 sm:col-span-7 p-3 relative bg-slate-50/40 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="font-black text-slate-900 text-sm">주식회사 경성문화사</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">ISO 9001 / 14001 인증기업</span>
                  </div>

                  <div className="space-y-1 pt-1 text-slate-700">
                    <p>
                      <strong className="text-slate-900">사업자번호 :</strong> 659-87-00026 &nbsp;&nbsp;|&nbsp;&nbsp; 
                      <strong className="text-slate-900">대 표 :</strong> 박 진 태
                    </p>
                    <p>
                      <strong className="text-slate-900">주 소 :</strong> 세종특별자치시 한누리대로 486 농협세종센터 9층 (국토부)
                    </p>
                    <p>
                      <strong className="text-slate-900">전 화 :</strong> 044) 864-5577 &nbsp;&nbsp;|&nbsp;&nbsp; 
                      <strong className="text-slate-900">팩 스 :</strong> 044) 866-5540 &nbsp;&nbsp;|&nbsp;&nbsp; 
                      <strong className="text-slate-900">문 구 :</strong> 044) 862-9559
                    </p>
                    <p>
                      <strong className="text-slate-900">e-mail :</strong> ksks5577@hanmail.net
                    </p>
                  </div>

                  {/* 🔴 공식 직인 도장 (대표자 명 옆 오버레이) */}
                  <div className="absolute right-3 top-7 w-14 h-14 rounded-full border-2 border-rose-600/90 text-rose-600 flex items-center justify-center font-black text-[10px] transform rotate-6 opacity-85 select-none pointer-events-none bg-rose-50/20">
                    <div className="text-center leading-tight">
                      <Stamp className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>경성문화<br/>직인</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. 품명 및 총 견적금액 한글/숫자 배너 바 */}
              <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 text-xs">
                <div className="flex bg-slate-50">
                  <div className="w-20 sm:w-24 bg-slate-200/80 font-black text-center py-2 text-slate-800 flex items-center justify-center border-r-2 border-slate-900 flex-shrink-0">
                    품 &nbsp; 명
                  </div>
                  <div className="p-2 font-black text-slate-900 text-sm flex items-center flex-1">
                    {quote.title}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-amber-50/50">
                  <div className="flex items-center flex-1">
                    <div className="w-20 sm:w-24 bg-slate-200/80 font-black text-center py-2.5 text-slate-800 flex items-center justify-center border-r-2 border-slate-900 flex-shrink-0">
                      금 &nbsp; 액
                    </div>
                    <div className="px-3 py-2 font-black text-slate-900 text-sm sm:text-base tracking-wide">
                      {koreanTotalPrice} 원整
                    </div>
                  </div>

                  <div className="pr-4 font-mono font-black text-slate-900 text-sm sm:text-base">
                    ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">(단위:원)</span>
                  </div>
                </div>
              </div>

              {/* 4. 견적 세부 품목 명세 테이블 */}
              <div className="border-2 border-slate-900 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-100/80 text-slate-900 border-b-2 border-slate-900 text-[11px] font-black text-center">
                      <th className="p-2 border-r border-slate-400 min-w-[140px]">품 &nbsp; 명</th>
                      <th className="p-2 border-r border-slate-400 w-28">규 &nbsp; 격</th>
                      
                      {/* 인쇄 제작형: 페이지 컬럼 */}
                      {isPrintTemplate && (
                        <th className="p-2 border-r border-slate-400 w-20">페이지</th>
                      )}

                      <th className="p-2 border-r border-slate-400 w-20">
                        {isPrintTemplate ? '수 량 (부)' : '수 량'}
                      </th>

                      {!isPrintTemplate && (
                        <th className="p-2 border-r border-slate-400 w-16">단 위</th>
                      )}

                      <th className="p-2 border-r border-slate-400 w-28 text-right pr-3">단 &nbsp; 가</th>
                      <th className="p-2 border-r border-slate-400 w-32 text-right pr-3">금 &nbsp; 액</th>
                      <th className="p-2 min-w-[90px]">비 &nbsp; 고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {parsedItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{it.name || quote.title}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-700">{it.spec || '-'}</td>
                        
                        {isPrintTemplate && (
                          <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-slate-800">
                            {it.pages || 1}
                          </td>
                        )}

                        <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-slate-800">
                          {it.quantity || 1}
                        </td>

                        {!isPrintTemplate && (
                          <td className="p-2 border-r border-slate-300 text-center text-slate-600">
                            {it.unit || '식'}
                          </td>
                        )}

                        <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono text-slate-800">
                          {(Number(it.unit_price) || 0).toLocaleString()}
                        </td>

                        <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono font-bold text-slate-950">
                          {(Number(it.amount) || 0).toLocaleString()}
                        </td>

                        <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
                      </tr>
                    ))}

                    {/* 빈 여백 행 4개 (엑셀 서식 스타일 완성) */}
                    {Array.from({ length: Math.max(0, 4 - parsedItems.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-7 text-transparent select-none">
                        <td className="border-r border-slate-300">&nbsp;</td>
                        <td className="border-r border-slate-300">&nbsp;</td>
                        {isPrintTemplate && <td className="border-r border-slate-300">&nbsp;</td>}
                        <td className="border-r border-slate-300">&nbsp;</td>
                        {!isPrintTemplate && <td className="border-r border-slate-300">&nbsp;</td>}
                        <td className="border-r border-slate-300">&nbsp;</td>
                        <td className="border-r border-slate-300">&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>

                  {/* 하단 합계 / 공급가액 / 부가세 요약 */}
                  <tfoot className="border-t-2 border-slate-900 bg-slate-50/70 font-bold text-slate-900 divide-y divide-slate-200">
                    <tr>
                      <td colSpan={isPrintTemplate ? 5 : 5} className="p-2 text-right pr-4 font-bold text-slate-700">소 &nbsp; 계</td>
                      <td className="p-2 text-right pr-3 font-mono font-bold">₩ {supplyPrice.toLocaleString()}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={isPrintTemplate ? 5 : 5} className="p-2 text-right pr-4 font-bold text-slate-700">공 급 가 액</td>
                      <td className="p-2 text-right pr-3 font-mono font-black text-slate-950">₩ {supplyPrice.toLocaleString()}</td>
                      <td className="p-2 text-center text-slate-500 text-[11px]">절사</td>
                    </tr>
                    <tr>
                      <td colSpan={isPrintTemplate ? 5 : 5} className="p-2 text-right pr-4 font-bold text-slate-700">부 &nbsp; 가 &nbsp; 세</td>
                      <td className="p-2 text-right pr-3 font-mono font-bold text-slate-700">₩ {taxPrice.toLocaleString()}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-amber-100/60 font-black text-slate-950 border-t-2 border-slate-900">
                      <td colSpan={isPrintTemplate ? 5 : 5} className="p-2.5 text-right pr-4 text-sm font-black">합 계 금 액 (VAT 포함)</td>
                      <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-rose-700">₩ {totalPrice.toLocaleString()}</td>
                      <td className="p-2 text-center text-[10px] text-slate-500">원整</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 5. 견적 특이사항 및 결제 조건 안내문 */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 text-xs text-slate-700 space-y-1">
                <p><strong className="text-slate-900">결제조건 :</strong> {quote.payment_terms || '납품 후 100% 현금/계좌이체'}</p>
                <p><strong className="text-slate-900">유효기간 :</strong> {quote.valid_days || '견적 후 30일간'}</p>
                {quote.estimate_note && (
                  <p><strong className="text-slate-900">특이사항 :</strong> {quote.estimate_note}</p>
                )}
              </div>

            </div>
          ) : (
            /* ── 비교 견적서 뷰 ── */
            <div className="space-y-4">
              <div className="border-2 border-slate-900 p-4 bg-slate-50 space-y-2 text-xs">
                <p><strong className="text-slate-900">수신 고객사 :</strong> {custName} {custDept}</p>
                <p><strong className="text-slate-900">작 업 명 :</strong> {quote.title}</p>
                <p><strong className="text-slate-900">기준 일자 :</strong> {todayKorean}</p>
              </div>

              <div className="border-2 border-slate-900 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-black text-[11px] text-center">
                    <tr>
                      <th className="p-2.5">구 분</th>
                      <th className="p-2.5">공급자 상호</th>
                      <th className="p-2.5 text-right pr-3">공급가액</th>
                      <th className="p-2.5 text-right pr-3">부가세 (VAT)</th>
                      <th className="p-2.5 text-right pr-3">총 견적금액</th>
                      <th className="p-2.5">비 고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-sky-50/60 font-bold">
                      <td className="p-3 text-center text-sky-800 font-black">당 사 (제출안)</td>
                      <td className="p-3 font-bold text-slate-900">주식회사 경성문화사 ({managerName})</td>
                      <td className="p-3 text-right pr-3 font-mono">₩ {supplyPrice.toLocaleString()}</td>
                      <td className="p-3 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
                      <td className="p-3 text-right pr-3 font-mono font-black text-sky-700 text-sm">₩ {totalPrice.toLocaleString()}</td>
                      <td className="p-3 text-emerald-700 font-semibold text-xs">최적단가 적용</td>
                    </tr>
                    <tr className="hover:bg-slate-50 text-slate-600">
                      <td className="p-3 text-center font-semibold">비교 (B 사)</td>
                      <td className="p-3">(주)비교디자인</td>
                      <td className="p-3 text-right pr-3 font-mono">₩ {compPriceB.toLocaleString()}</td>
                      <td className="p-3 text-right pr-3 font-mono">₩ {compTaxB.toLocaleString()}</td>
                      <td className="p-3 text-right pr-3 font-mono font-bold text-slate-800">₩ {compTotalB.toLocaleString()}</td>
                      <td className="p-3 text-slate-400 text-xs">시장 표준단가</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

