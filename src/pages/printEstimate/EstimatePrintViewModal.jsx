// src/pages/printEstimate/EstimatePrintViewModal.jsx
import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { exportEstimateDetailToExcel } from '../../services/printEstimateStorage';

export default function EstimatePrintViewModal({ estimate, onClose }) {
  const printRef = useRef(null);

  if (!estimate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    exportEstimateDetailToExcel(estimate);
  };

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 상단 컨트롤 바 (화면 전용, 인쇄 시 숨김) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-slate-800">인쇄 견적서 미리보기</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
              {estimate.version || 1}차 견적 {estimate.isFinal ? '(최종확정)' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExcel}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>견적서 인쇄 (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 인쇄 본문 (A4 규격 서식) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="max-w-[760px] mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-0 text-slate-800 text-xs sm:text-sm font-sans"
          >
            {/* 타이틀 헤더 */}
            <div className="text-center pb-6 border-b-2 border-slate-900">
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-slate-900">
                인 쇄 견 적 서
              </h1>
              <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                <span>견적번호: <strong className="text-slate-800">{estimate.estimateNo}</strong></span>
                <span>견적일자: <strong className="text-slate-800">{estimate.createdAt?.slice(0, 10) || todayStr}</strong></span>
              </div>
            </div>

            {/* 공급받는자 / 공급자 정보 2단 박스 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {/* 귀하 (수신자) */}
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">수신 (귀하)</div>
                  <div className="text-lg font-black text-slate-900 mb-2">
                    {estimate.clientName || '고객사 귀중'}
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>담당자: <span className="font-semibold text-slate-800">{estimate.contactName || '-'}</span></p>
                    <p>연락처: <span className="font-semibold text-slate-800">{estimate.phone || '-'}</span></p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                  아래와 같이 견적하오니 검토 후 결정하여 주시기 바랍니다.
                </div>
              </div>

              {/* 공급자 (경성문화사) */}
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50">
                <div className="text-xs text-slate-500 mb-1">공급자</div>
                <div className="text-base font-black text-slate-900 mb-2">
                  (주)경성문화사
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>등록번호: <span className="font-medium">314-81-22904</span></p>
                  <p>대표자: <span className="font-medium">김광일</span></p>
                  <p>사업장: <span className="font-medium">대전광역시 중구 대흥로 115번길 5</span></p>
                  <p>업태/종목: <span className="font-medium">제조, 서비스 / 인쇄, 출판, 전산</span></p>
                  <p>담당자: <span className="font-bold text-sky-700">{estimate.authorName || '영업담당'}</span></p>
                </div>
              </div>
            </div>

            {/* 견적 총액 강조 바 */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 my-4 flex items-center justify-between">
              <span className="font-bold text-slate-700 text-sm">합계 견적금액 (VAT 포함)</span>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-sky-700">
                  ₩ {(estimate.totalAmount || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (공급가 {(estimate.subtotal || 0).toLocaleString()}원 / 세액 {(estimate.vat || 0).toLocaleString()}원)
                </span>
              </div>
            </div>

            {/* 품명 및 기본 제작 사양 표 */}
            <div className="mb-6">
              <div className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide">■ 인쇄물 제작 기본 사양</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <th className="bg-slate-100 p-2 text-left w-24 font-bold text-slate-700">품 명</th>
                    <td className="p-2 font-bold text-slate-900" colSpan={3}>{estimate.productName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="bg-slate-100 p-2 text-left w-24 font-bold text-slate-700">제작부수</th>
                    <td className="p-2 font-semibold">{(estimate.quantity || 0).toLocaleString()} {estimate.unit || '부'}</td>
                    <th className="bg-slate-100 p-2 text-left w-24 font-bold text-slate-700">규 격</th>
                    <td className="p-2">{estimate.sizeWidth} × {estimate.sizeHeight} mm ({estimate.paperCut || '규격'})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">면 수</th>
                    <td className="p-2">{estimate.pages || 0} 면</td>
                    <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">색 도</th>
                    <td className="p-2">{estimate.colors || '4도/4도'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">제본방식</th>
                    <td className="p-2">{estimate.bindingType || '무선제본'}</td>
                    <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">부당단가</th>
                    <td className="p-2 font-bold text-sky-700">{(estimate.unitPrice || 0).toLocaleString()} 원/부</td>
                  </tr>
                  {estimate.paperType && (
                    <tr className="border-b border-slate-200">
                      <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">용 지</th>
                      <td className="p-2" colSpan={3}>{estimate.paperType}</td>
                    </tr>
                  )}
                  {estimate.finishingOptions && (
                    <tr className="border-b border-slate-200">
                      <th className="bg-slate-100 p-2 text-left font-bold text-slate-700">후 가 공</th>
                      <td className="p-2" colSpan={3}>{estimate.finishingOptions}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 공정별 세부 견적 내역 */}
            <div className="mb-6">
              <div className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wide">■ 공정별 산출 내역</div>
              <table className="w-full border-collapse border border-slate-300 text-xs text-center">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-10">No</th>
                    <th className="p-2 border-r border-slate-300 w-24">구분</th>
                    <th className="p-2 border-r border-slate-300 text-left">공정 / 내역</th>
                    <th className="p-2 border-r border-slate-300 w-16">수량</th>
                    <th className="p-2 border-r border-slate-300 w-12">단위</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">단가</th>
                    <th className="p-2 text-right w-28">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(estimate.items) && estimate.items.length > 0 ? (
                    estimate.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                        <td className="p-2 border-r border-slate-200 text-slate-400">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-semibold text-slate-600">{item.category}</td>
                        <td className="p-2 border-r border-slate-200 text-left">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          {item.spec && <span className="text-[11px] text-slate-500 block">{item.spec}</span>}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium">{(item.quantity || 0).toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-500">{item.unit || '-'}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-medium">{(item.unitPrice || 0).toLocaleString()}</td>
                        <td className="p-2 text-right font-bold text-slate-900">{(item.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">등록된 세부 항목이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={6} className="p-2.5 text-right text-slate-700">공급가액 합계</td>
                    <td className="p-2.5 text-right text-slate-900">{(estimate.subtotal || 0).toLocaleString()} 원</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={6} className="p-2 text-right text-slate-700">부가가치세 (10%)</td>
                    <td className="p-2 text-right text-slate-900">{(estimate.vat || 0).toLocaleString()} 원</td>
                  </tr>
                  <tr className="bg-sky-50 font-black border-t-2 border-slate-400">
                    <td colSpan={6} className="p-3 text-right text-sky-900 text-sm">최종 견적 총액</td>
                    <td className="p-3 text-right text-sky-700 text-sm">{(estimate.totalAmount || 0).toLocaleString()} 원</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 비고 및 납품 조건 */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 text-xs text-slate-600 space-y-1 mb-8">
              <div className="font-bold text-slate-700 mb-1">■ 참고 및 계약 특이사항</div>
              {estimate.notes ? (
                <p className="whitespace-pre-wrap">{estimate.notes}</p>
              ) : (
                <>
                  <p>1. 견적 유효기간: 견적일로부터 30일간 유효합니다.</p>
                  <p>2. 원고 및 데이터 변경, 교정 횟수 초과 시 추가 비용이 발생할 수 있습니다.</p>
                  <p>3. 제작 일정은 최종 교정 확정 및 작업 발주 승인 후 협의된 일정에 준합니다.</p>
                </>
              )}
            </div>

            {/* 서명부 */}
            <div className="text-right pt-6 text-sm">
              <div className="font-bold text-slate-900 text-base mb-1">(주)경성문화사 대표이사 김광일 (인)</div>
              <div className="text-xs text-slate-500">문의: 042-226-4444 / sales@kyungsung.co.kr</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
