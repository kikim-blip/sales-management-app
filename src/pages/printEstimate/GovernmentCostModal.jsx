// src/pages/printEstimate/GovernmentCostModal.jsx
import React, { useState, useRef } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building, ShieldCheck } from 'lucide-react';
import { exportEstimateDetailToExcel } from '../../services/printEstimateStorage';
import { calculateGovernmentLightPrint } from '../../utils/printCalculators/governmentCostCalculator';

export default function GovernmentCostModal({ estimate, onClose }) {
  const [activeDocTab, setActiveDocTab] = useState('costSheet'); // 'costSheet' | 'specDoc' | 'commercial'
  const printRef = useRef(null);

  if (!estimate) return null;

  const gov = estimate.governmentReport || {};
  const isLightPrint = (estimate.printType || '').includes('경인쇄') || (estimate.printType || '').includes('마스터');
  const isOffset = (estimate.printType || '옵셋인쇄').includes('옵셋');
  const isDigital = (estimate.printType || '').includes('디지털');

  const light = gov.lightReport || (isLightPrint ? calculateGovernmentLightPrint({
    quantity: estimate.quantity,
    paperCut: estimate.paperCut,
    cover: {
      paperName: estimate.coverPaperName,
      colorCount: estimate.coverColor === '4도' ? 4 : estimate.coverColor === '2도' ? 2 : 1,
      color: estimate.coverColor,
    },
    body: {
      paperName: estimate.bodyPaperName,
      pages: estimate.bodyPages,
    },
    options: {
      hasCoating: estimate.hasCoating,
      hasTypesetDiscount: estimate.hasTypesetDiscount ?? true,
      extraCost: estimate.discountOrAdd || 0,
    }
  }) : null);

  const todayStr = estimate.regDate || new Date().toISOString().slice(0, 10);
  const deliveryDateStr = estimate.deliveryDate || '-';
  const proofDateStr = estimate.proofDate || '-';
  const writerTitle = estimate.writerTitle || '담당자';
  const writerName = estimate.writerName || estimate.authorName || '김광일';

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    exportEstimateDetailToExcel(estimate);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 상단 툴바 및 서식 선택 탭 (화면 전용, 인쇄 시 숨김) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-teal-600 text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>조달청 공공 표준원가</span>
            </span>
            <span className="text-sm font-bold text-slate-800 truncate max-w-xs">
              {estimate.productName || '인쇄원가계산'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({estimate.estimateNo})
            </span>
          </div>

          {/* 3가지 서식 전환 탭 */}
          <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveDocTab('costSheet')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDocTab === 'costSheet'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 공공 인쇄원가계산서
            </button>
            <button
              onClick={() => setActiveDocTab('specDoc')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDocTab === 'specDoc'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 인쇄물 규격서
            </button>
            <button
              onClick={() => setActiveDocTab('commercial')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeDocTab === 'commercial'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 거래처용 견적서
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExcel}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
              title="엑셀 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">엑셀</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄 (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 인쇄 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="max-w-[760px] mx-auto bg-white p-6 sm:p-10 shadow-lg print:shadow-none print:p-0 text-slate-900 font-sans print:max-w-none print:w-full"
            style={{ fontFamily: "'Noto Serif KR', 'Batang', serif" }}
          >

            {/* ════════════════════════════════════════════════════════════
                1. 공공 인쇄원가계산서 (Official Government Cost Sheet)
               ════════════════════════════════════════════════════════════ */}
            {activeDocTab === 'costSheet' && (
              <div>
                {/* 계산서 타이틀 */}
                <div className="text-center pb-4 pt-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-black border-b-2 border-black pb-2">
                    {isOffset ? '옵 셋 인 쇄 원 가 계 산 서' : (isDigital ? '디 지 털 인 쇄 원 가 계 산 서' : '경 인 쇄 원 가 계 산 서')}
                  </h1>
                </div>

                {/* 작성 메타 정보 헤더 */}
                <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-slate-800 my-3 leading-relaxed border-b border-slate-300 pb-2">
                  <div className="space-y-0.5">
                    <div>■ 작성기준 : 조달청 인쇄요금 원가계산 기준 (국가계약법 시행규칙 제6조)</div>
                    <div>■ 작성일자 : {todayStr}</div>
                  </div>
                  <div className="sm:text-right mt-1 sm:mt-0 font-bold">
                    ■ 작 성 자 : {writerTitle} {writerName}&nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="inline-block border border-black px-2 py-0.5 rounded text-[11px] font-normal">
                      (인)
                    </span>
                  </div>
                </div>

                {/* 1. 상단 품목 및 규격 사양표 */}
                <table className="w-full border-collapse border-2 border-black text-xs text-center my-3">
                  <thead>
                    <tr className="bg-sky-50/80 font-bold border-b border-black">
                      <th className="border border-black py-2 px-3 w-16 bg-blue-100/60">건명</th>
                      <th colSpan="5" className="border border-black py-2 px-3 text-left font-black text-sm text-slate-900">
                        {estimate.productName || '미지정 품명'}
                      </th>
                      <th className="border border-black py-2 px-3 w-16 bg-blue-100/60">부수</th>
                      <th className="border border-black py-2 px-3 w-24 font-black text-sky-800 text-sm">
                        {(estimate.quantity || 1000).toLocaleString()} 부
                      </th>
                    </tr>
                    <tr className="bg-slate-100 font-bold border-b border-black text-[11px]">
                      <th className="border border-black py-1.5">구분</th>
                      <th className="border border-black py-1.5">용지종류</th>
                      <th className="border border-black py-1.5">평량</th>
                      <th className="border border-black py-1.5">인쇄판형</th>
                      <th className="border border-black py-1.5">절수</th>
                      <th className="border border-black py-1.5">색도수</th>
                      <th className="border border-black py-1.5">총면수</th>
                      <th className="border border-black py-1.5">인쇄면수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 표지 */}
                    <tr>
                      <td className="border border-black py-1.5 font-bold bg-slate-50">표지</td>
                      <td className="border border-black py-1.5">{estimate.coverPaperName || '아트지'}</td>
                      <td className="border border-black py-1.5">{estimate.coverWeight || 200}g/㎡</td>
                      <td className="border border-black py-1.5">{estimate.paperCut || '국배판(A4)'}</td>
                      <td className="border border-black py-1.5">{gov.coverCalc?.cuts || 8}절</td>
                      <td className="border border-black py-1.5">{estimate.coverColor || '4도'} ({estimate.coverSide || '단면'})</td>
                      <td className="border border-black py-1.5 font-bold">{estimate.coverPages ?? 4}</td>
                      <td className="border border-black py-1.5">{gov.coverCalc?.printedPages ?? (estimate.coverPages ?? 4)}</td>
                    </tr>
                    {/* 화보 (있을 경우) */}
                    {estimate.hasSupplement && (
                      <tr>
                        <td className="border border-black py-1.5 font-bold bg-slate-50">화보</td>
                        <td className="border border-black py-1.5">{estimate.suppPaperName || '스노우지'}</td>
                        <td className="border border-black py-1.5">{estimate.suppWeight || 120}g/㎡</td>
                        <td className="border border-black py-1.5">{estimate.paperCut || '국배판(A4)'}</td>
                        <td className="border border-black py-1.5">{gov.supplementCalc?.cuts || 16}절</td>
                        <td className="border border-black py-1.5">{estimate.suppColor || '4도'} ({estimate.suppSide || '양면'})</td>
                        <td className="border border-black py-1.5 font-bold">{estimate.suppPages || 8}</td>
                        <td className="border border-black py-1.5">{gov.supplementCalc?.printedPages ?? (estimate.suppPages || 8)}</td>
                      </tr>
                    )}
                    {/* 본문 */}
                    <tr>
                      <td className="border border-black py-1.5 font-bold bg-slate-50">본문</td>
                      <td className="border border-black py-1.5">{estimate.bodyPaperName || '백상지'}</td>
                      <td className="border border-black py-1.5">{estimate.bodyWeight || 80}g/㎡</td>
                      <td className="border border-black py-1.5">{estimate.paperCut || '국배판(A4)'}</td>
                      <td className="border border-black py-1.5">{gov.bodyCalc?.cuts || 16}절</td>
                      <td className="border border-black py-1.5">{estimate.bodyColor || '1도'} ({estimate.bodySide || '양면'})</td>
                      <td className="border border-black py-1.5 font-bold">{estimate.bodyPages ?? 64}</td>
                      <td className="border border-black py-1.5">{gov.bodyCalc?.printedPages ?? (estimate.bodyPages ?? 64)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. 원가 산출내역 테이블 (경인쇄 전용 vs 옵셋 14단계) */}
                {isLightPrint && light ? (
                  /* ── 🏛️ 경인쇄(마스터인쇄) 전용 조달 공공 산출 테이블 (jne.go.kr / 공공 기준 완전 일치) ── */
                  <table className="w-full border-collapse border-2 border-black text-xs my-3">
                    <thead>
                      <tr className="bg-sky-50/80 font-bold border-b border-black text-center">
                        <th className="border border-black py-2 px-2 w-24 bg-blue-100/60">항목</th>
                        <th colSpan="6" className="border border-black py-2 px-3 text-left">산 출 내 역</th>
                        <th className="border border-black py-2 px-3 w-28 text-right bg-blue-100/60">금액(원)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-[11px] leading-relaxed">
                      {/* 1. 기본사항 */}
                      <tr>
                        <td className="border border-black py-2.5 px-2 text-center font-bold bg-slate-50 align-top">
                          1. 기본사항
                        </td>
                        <td colSpan="6" className="border border-black py-2.5 px-3 space-y-1.5 font-sans">
                          <div className="font-bold text-slate-800">▒▒ 표&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;지 ▒▒▒▒▒▒▒▒</div>
                          <div>
                            □ 50부까지 요금: {light.coverBasePrice50.toLocaleString()}원 × &#123;{light.baseCoverSheets}매(기본) + {light.extraSheets}매(추가색도)&#125; = {light.cover50Cost.toLocaleString()}원
                            <div className="pl-3 text-[10px] text-slate-600">※ 추가색도 {light.extraSheets}매 산출내역: {light.extraSheetsDesc}</div>
                          </div>
                          <div>
                            □ 10부마다 요금: {light.extraSteps > 0 ? `${light.coverExtra10Price.toLocaleString()}원 × ${light.extraSteps}스텝(10부) × ${light.totalCoverSheets}매 = ${light.cover10Cost.toLocaleString()}원` : '-'}
                          </div>
                          <div className="font-bold">
                            □ 표지 요금: {light.cover50Cost.toLocaleString()}원 + {light.cover10Cost.toLocaleString()}원 = <span className="text-blue-700">{light.totalCoverCost.toLocaleString()}원</span>
                          </div>

                          <div className="border-t border-dotted border-slate-300 my-1.5 pt-1.5">
                            <div className="font-bold text-slate-800">▒▒ 본문흑백 ▒▒▒▒▒▒▒▒</div>
                            <div>
                              □ 50부까지 요금: {light.bodyBasePrice50.toLocaleString()}원 × {light.bodyPages}면 = {light.body50Cost.toLocaleString()}원
                            </div>
                            <div>
                              □ 10부마다 요금: {light.extraSteps > 0 ? `${light.bodyExtra10Price.toLocaleString()}원 × ${light.extraSteps}스텝(10부) × ${light.bodyPages}면 = ${light.body10Cost.toLocaleString()}원` : '-'}
                            </div>
                            <div className="font-bold">
                              □ 본문흑백 요금: {light.body50Cost.toLocaleString()}원 + {light.body10Cost.toLocaleString()}원 = <span className="text-blue-700">{light.totalBodyCost.toLocaleString()}원</span>
                            </div>
                          </div>
                        </td>
                        <td className="border border-black py-2.5 px-3 text-right font-bold align-bottom">
                          {light.basicTotal.toLocaleString()}
                        </td>
                      </tr>

                      {/* 2. 계산가감 */}
                      <tr>
                        <td className="border border-black py-2.5 px-2 text-center font-bold bg-slate-50 align-top">
                          2. 계산가감
                        </td>
                        <td colSpan="6" className="border border-black py-2.5 px-3 space-y-1">
                          <div>□ 조판생략: 글자의 크기나 행간간격의 조정, 규격 등 변환을 요하는 파일을 제공할 때</div>
                          <div>□ 조판생략 감액: -{light.unitDiscount.toLocaleString()}원 × 흑백{light.bodyPages}면 = {light.discountAmount.toLocaleString()}원</div>
                        </td>
                        <td className="border border-black py-2.5 px-3 text-right font-bold align-bottom text-rose-700">
                          {light.discountAmount.toLocaleString()}
                        </td>
                      </tr>

                      {/* 3. 기타추가 */}
                      <tr>
                        <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                          3. 기타추가
                        </td>
                        <td colSpan="6" className="border border-black py-2 px-3 text-slate-500">
                          {light.extraCost > 0 ? `특수 후가공 실비: ${light.extraCost.toLocaleString()}원` : '-'}
                        </td>
                        <td className="border border-black py-2 px-3 text-right font-bold">
                          {light.extraCost > 0 ? light.extraCost.toLocaleString() : '0'}
                        </td>
                      </tr>

                      {/* 4. 소계 */}
                      <tr className="bg-slate-50 font-bold">
                        <td className="border border-black py-2 px-2 text-center font-bold">
                          4. 소계
                        </td>
                        <td colSpan="6" className="border border-black py-2 px-3">
                          1+2+3 (순제조원가 / 공급가액)
                        </td>
                        <td className="border border-black py-2 px-3 text-right font-bold text-slate-900">
                          {light.subtotal.toLocaleString()}
                        </td>
                      </tr>

                      {/* 5. 부가세 */}
                      <tr>
                        <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                          5. 부가세
                        </td>
                        <td colSpan="6" className="border border-black py-2 px-3">
                          4 × 10% (부가가치세)
                        </td>
                        <td className="border border-black py-2 px-3 text-right font-bold">
                          {light.vat.toLocaleString()}
                        </td>
                      </tr>

                      {/* 6. 합계 */}
                      <tr className="bg-blue-50 font-bold text-sm">
                        <td className="border border-black py-2.5 px-2 text-center font-black">
                          6. 합계
                        </td>
                        <td colSpan="6" className="border border-black py-2 px-3 text-blue-900">
                          4+5 (예정가격)
                        </td>
                        <td className="border border-black py-2.5 px-3 text-right font-black text-blue-900 text-sm">
                          {light.targetTotal.toLocaleString()}
                        </td>
                      </tr>

                      {/* 7. 계약금액 */}
                      <tr className="bg-teal-100 font-bold text-sm">
                        <td className="border border-black py-2.5 px-2 text-center font-black text-teal-900">
                          7. 계약금액
                        </td>
                        <td colSpan="6" className="border border-black py-2 px-3 text-teal-900">
                          6 × 100% (조달청 고시 기준, 천원단위 이하 절사)
                        </td>
                        <td className="border border-black py-2.5 px-3 text-right font-black text-teal-950 text-base">
                          ₩ {light.contractAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  /* ── 🏛️ 옵셋/디지털 14단계 법정 원가 산출내역 테이블 ── */
                  <table className="w-full border-collapse border-2 border-black text-xs my-3">
                  <thead>
                    <tr className="bg-sky-50/80 font-bold border-b border-black text-center">
                      <th className="border border-black py-2 px-2 w-20 bg-blue-100/60">항목</th>
                      <th className="border border-black py-2 px-2 w-16">구분</th>
                      <th colSpan="5" className="border border-black py-2 px-3 text-left">산 출 내 역</th>
                      <th className="border border-black py-2 px-3 w-28 text-right bg-blue-100/60">금액(원)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[11px] leading-relaxed">
                    
                    {/* 1. 용지료 */}
                    <tr>
                      <td rowSpan={estimate.hasSupplement ? 3 : 2} className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        1. 용지료
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center font-medium">표지</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        <div>①소요량: {gov.coverCalc?.netReams ?? 0}연 | ②대수: {gov.coverCalc?.signatures ?? 1}대 | ③기준통수: {(gov.coverCalc?.basePasses ?? 1000).toLocaleString()}통</div>
                        <div>④손지율: {gov.coverCalc?.wasteRate ?? 10}% | ⑤총소요: {gov.coverCalc?.totalReams ?? 0}연 × {Number(estimate.coverUnitPrice || 94000).toLocaleString()}원</div>
                      </td>
                      <td rowSpan={estimate.hasSupplement ? 3 : 2} className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step1_paperCost || 0).toLocaleString()}
                      </td>
                    </tr>
                    {estimate.hasSupplement && (
                      <tr>
                        <td className="border border-black py-1.5 px-2 text-center font-medium">화보</td>
                        <td colSpan="5" className="border border-black py-1.5 px-3">
                          소요량: {gov.supplementCalc?.netReams ?? 0}연 | 대수: {gov.supplementCalc?.signatures ?? 1}대 | 손지율: {gov.supplementCalc?.wasteRate ?? 10}% | 총: {gov.supplementCalc?.totalReams ?? 0}연 × {Number(estimate.suppUnitPrice || 75000).toLocaleString()}원
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="border border-black py-1.5 px-2 text-center font-medium">본문</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        <div>①소요량: {gov.bodyCalc?.netReams ?? 0}연 | ②대수: {gov.bodyCalc?.signatures ?? 1}대 | ③기준통수: {(gov.bodyCalc?.basePasses ?? 1000).toLocaleString()}통</div>
                        <div>④손지율: {gov.bodyCalc?.wasteRate ?? 10}% | ⑤총소요: {gov.bodyCalc?.totalReams ?? 0}연 × {Number(estimate.bodyUnitPrice || 46136).toLocaleString()}원</div>
                      </td>
                    </tr>

                    {/* 2. 조판료 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        2. 조판료
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">전체</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        표지({gov.coverCalc?.typesetPages ?? 0}면×{gov.coverCalc?.typesetRate ?? 0}%) + 본문({gov.bodyCalc?.typesetPages ?? 0}면×{gov.bodyCalc?.typesetRate ?? 0}%) × 면당 기준단가
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step2_typesetCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 3. 인쇄판료 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        3. 인쇄판료
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">CTP</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        총 판수: {(gov.coverCalc?.plates ?? 0) + (gov.bodyCalc?.plates ?? 0) + (gov.supplementCalc?.plates ?? 0)}판 [표지 {gov.coverCalc?.plates ?? 0}판 + 본문 {gov.bodyCalc?.plates ?? 0}판] × 판당단가 {gov.coverCalc?.plateUnitPrice?.toLocaleString() ?? '17,500'}원
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step3_ctpCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 4. 인쇄료 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        4. 인쇄료
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">인쇄</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        기준통수 × 통당단가 × 인쇄면수 × 지질/특수색 할증 (표지 {gov.coverCalc?.printCost?.toLocaleString() || 0}원 + 본문 {gov.bodyCalc?.printCost?.toLocaleString() || 0}원)
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step4_printCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 5. 제본료 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        5. 제본료
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">{estimate.bindingType || '무사무선'}</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        {(estimate.quantity || 1000).toLocaleString()}부 × {Math.max(100, gov.totalPages || 68)}면(100면 기본) × 면당 단가 0.825원
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step5_bindingCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 6. 기타추가 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        6. 기타추가
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">후가공</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        {estimate.hasCoating ? `표지 코팅 (${estimate.coatingType || '무광코팅'}) ${gov.coatingCost?.toLocaleString() || 0}원` : '코팅 없음'}
                        {estimate.hasFoil ? `, 박가공 ${gov.foilCost?.toLocaleString() || 0}원` : ''}
                        {estimate.hasDiecut ? `, 톰슨가공 ${gov.diecutCost?.toLocaleString() || 0}원` : ''}
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step6_extraCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 7. 소계 (순제조원가) */}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-black py-2 px-2 text-center font-bold">
                        7. 소계
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">순제조원가</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        1 + 2 + 3 + 4 + 5 + 6 (직접재료비 및 제조비용 합계)
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-black text-slate-900">
                        {(gov.step7_subtotal || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 8. 일반관리비 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        8. 일반관리비
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">법정요율</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        순제조원가(7) × {gov.manageRate || 5}% (국가계약법상 14% 한도 이내)
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step8_manageCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 9. 계 */}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-black py-2 px-2 text-center font-bold">
                        9. 계
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">제조원가</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        소계(7) + 일반관리비(8)
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step9_manufacturingTotal || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 10. 이윤 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        10. 이윤
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">법정이윤</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3 text-rose-800">
                        (계 9 - 용지료 1) × {gov.profitRate || 10}% <span className="text-[10px] text-slate-500">(국가계약법 시행규칙 제6조: 용지비 공제 산식, 25% 한도)</span>
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold text-rose-800">
                        {(gov.step10_profitCost || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 11. 공급가액 */}
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-black py-2 px-2 text-center font-bold">
                        11. 공급가액
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">가액</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        계(9) + 이윤(10)
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step11_supplyPrice || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 12. 부가가치세 */}
                    <tr>
                      <td className="border border-black py-2 px-2 text-center font-bold bg-slate-50">
                        12. 부가세
                      </td>
                      <td className="border border-black py-1.5 px-2 text-center">VAT</td>
                      <td colSpan="5" className="border border-black py-1.5 px-3">
                        공급가액(11) × 10%
                      </td>
                      <td className="border border-black py-2 px-3 text-right font-bold">
                        {(gov.step12_vat || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 13. 합계 (예정가격) */}
                    <tr className="bg-blue-50 font-bold text-sm">
                      <td className="border border-black py-2.5 px-2 text-center font-black">
                        13. 합계
                      </td>
                      <td className="border border-black py-2 px-2 text-center text-blue-900">예정가격</td>
                      <td colSpan="5" className="border border-black py-2 px-3 text-blue-900 font-bold">
                        공급가액(11) + 부가가치세(12)
                      </td>
                      <td className="border border-black py-2.5 px-3 text-right font-black text-blue-900 text-sm">
                        {(gov.step13_targetTotal || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* 14. 계약금액 / 낙찰금액 */}
                    <tr className="bg-teal-100 font-bold text-sm">
                      <td className="border border-black py-2.5 px-2 text-center font-black text-teal-900">
                        14. 계약금액
                      </td>
                      <td className="border border-black py-2 px-2 text-center text-teal-900">낙찰금액</td>
                      <td colSpan="5" className="border border-black py-2 px-3 text-teal-900">
                        예정가격(13) × {gov.contractRate || 88}% (조달청 낙찰하한율, 천원단위 이하 절사)
                      </td>
                      <td className="border border-black py-2.5 px-3 text-right font-black text-teal-950 text-base">
                        ₩ {(gov.step14_contractAmount || 0).toLocaleString()}
                      </td>
                    </tr>

                  </tbody>
                </table>
                )}

                {/* 하단 공문서 안내 문구 */}
                <div className="mt-6 text-[11px] text-slate-500 leading-relaxed border-t border-slate-300 pt-3">
                  <p>※ 본 계산서는 국가계약법 시행규칙 제6조 및 조달청 인쇄요금 공인 표준원가 기준에 의해 정밀 산출되었습니다.</p>
                  <p>※ 권당 예정가격: ₩ {(gov.perBookTargetPrice || 0).toLocaleString()}원 / 권당 계약금액: ₩ {(gov.perBookContractPrice || 0).toLocaleString()}원</p>
                </div>
              </div>
            )}


            {/* ════════════════════════════════════════════════════════════
                2. 인쇄물 규격서 (Official Specification Document)
               ════════════════════════════════════════════════════════════ */}
            {activeDocTab === 'specDoc' && (
              <div>
                <div className="text-center pb-4 pt-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-black border-b-2 border-black pb-2">
                    인 쇄 물 규 격 서
                  </h1>
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-slate-800 my-3 border-b border-slate-300 pb-2">
                  <div>■ 작성일자 : {todayStr}</div>
                  <div className="font-bold">
                    ■ 작 성 자 : {writerTitle} {writerName}&nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="inline-block border border-black px-2 py-0.5 rounded text-[11px] font-normal">
                      (인)
                    </span>
                  </div>
                </div>

                <table className="w-full border-collapse border-2 border-black text-xs my-4">
                  <tbody className="divide-y divide-black">
                    <tr>
                      <td className="border border-black py-3 px-4 w-32 bg-slate-100 font-bold text-center">
                        1. 제&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;목
                      </td>
                      <td className="border border-black py-3 px-4 font-bold text-sm">
                        {estimate.productName || '미지정 품명'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        2. 크&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;기
                      </td>
                      <td className="border border-black py-3 px-4">
                        {estimate.paperCut || '국배판(A4)'} ({gov.bodyCalc?.cuts || 16}절)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        3. 수&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;량
                      </td>
                      <td className="border border-black py-3 px-4 font-bold text-sky-900">
                        {(estimate.quantity || 1000).toLocaleString()} 부
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center align-top">
                        4. 예상면수
                      </td>
                      <td className="border border-black py-3 px-4 space-y-1">
                        <div>□ 표지 : {estimate.coverPages ?? 4}면 (인쇄면 : {gov.coverCalc?.printedPages ?? 4}면)</div>
                        {estimate.hasSupplement && (
                          <div>□ 화보 : {estimate.suppPages || 8}면 (인쇄면 : {gov.supplementCalc?.printedPages ?? 8}면)</div>
                        )}
                        <div>□ 본문 : {estimate.bodyPages ?? 64}면 (인쇄면 : {gov.bodyCalc?.printedPages ?? 64}면)</div>
                        <div className="font-bold pt-1 text-slate-700">□ 총 면수 : {gov.totalPages || 68}면</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center align-top">
                        5. 지&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;질
                      </td>
                      <td className="border border-black py-3 px-4 space-y-1">
                        <div>□ 표지 : {estimate.coverPaperName || '아트지'} {estimate.coverWeight || 200}g/㎡, {estimate.coverColor || '4도'} ({estimate.coverSide || '단면'})</div>
                        {estimate.hasSupplement && (
                          <div>□ 화보 : {estimate.suppPaperName || '스노우지'} {estimate.suppWeight || 120}g/㎡, {estimate.suppColor || '4도'} ({estimate.suppSide || '양면'})</div>
                        )}
                        <div>□ 본문 : {estimate.bodyPaperName || '백상지'} {estimate.bodyWeight || 80}g/㎡, {estimate.bodyColor || '1도'} ({estimate.bodySide || '양면'})</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        6. 조&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;판
                      </td>
                      <td className="border border-black py-3 px-4">
                        전자조판 및 기획편집
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        7. 글씨크기
                      </td>
                      <td className="border border-black py-3 px-4">
                        인쇄용 원고 파일 규격에 따름 (표준 본문 10~11pt)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        8. 코&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;팅
                      </td>
                      <td className="border border-black py-3 px-4">
                        {estimate.hasCoating ? `${estimate.coatingType || '무광코팅'}` : '해당없음'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        9. 인쇄방법
                      </td>
                      <td className="border border-black py-3 px-4 font-semibold">
                        {estimate.printType || '옵셋인쇄'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        10. 제&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;본
                      </td>
                      <td className="border border-black py-3 px-4">
                        {estimate.bindingType || '무사무선'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        11. 교정기한
                      </td>
                      <td className="border border-black py-3 px-4">
                        {proofDateStr}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        12. 납품기한
                      </td>
                      <td className="border border-black py-3 px-4 font-bold text-rose-800">
                        {deliveryDateStr}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-3 px-4 bg-slate-100 font-bold text-center">
                        13. 기타사항
                      </td>
                      <td className="border border-black py-3 px-4 text-slate-700 whitespace-pre-wrap">
                        {estimate.notes || '인쇄 및 제본 완성품은 납품기한 내 지정 장소로 안전 포장 납품함.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}


            {/* ════════════════════════════════════════════════════════════
                3. 거래처용 견적서 (Commercial Quote Format)
               ════════════════════════════════════════════════════════════ */}
            {activeDocTab === 'commercial' && (
              <div>
                <div className="text-center pb-6 border-b-2 border-slate-900">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-slate-900">
                    인 쇄 견 적 서
                  </h1>
                  <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                    <span>견적번호: <strong className="text-slate-800">{estimate.estimateNo}</strong></span>
                    <span>견적일자: <strong className="text-slate-800">{todayStr}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                  <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">수신 (귀하)</div>
                      <div className="text-lg font-black text-slate-900 mb-2">
                        {estimate.clientName || '고객사 귀중'} {estimate.clientDept ? `(${estimate.clientDept})` : ''}
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
                      <p>담당자: <span className="font-bold text-sky-700">{writerName}</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 my-4 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-sm">합계 견적금액 (조달 계약금액 기준, VAT 포함)</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-teal-700">
                      ₩ {(gov.step14_contractAmount || estimate.totalAmount || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      (권당 단가: ₩ {(gov.perBookContractPrice || 0).toLocaleString()})
                    </span>
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-xs my-4">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300 text-center">
                      <th className="border border-slate-300 p-2">품목/규격</th>
                      <th className="border border-slate-300 p-2 w-24">수량</th>
                      <th className="border border-slate-300 p-2 w-28">공급가액</th>
                      <th className="border border-slate-300 p-2 w-24">부가세</th>
                      <th className="border border-slate-300 p-2 w-28">합계금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-3">
                        <div className="font-bold text-sm text-slate-900">{estimate.productName || '인쇄물'}</div>
                        <div className="text-slate-500 text-[11px] mt-1">
                          {estimate.paperCut} / {gov.totalPages || 68}면 / {estimate.bindingType} / {estimate.hasCoating ? estimate.coatingType : '코팅없음'}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-3 text-center font-bold">
                        {(estimate.quantity || 1000).toLocaleString()} 부
                      </td>
                      <td className="border border-slate-300 p-3 text-right">
                        {(Math.round((gov.step14_contractAmount || estimate.totalAmount || 0) / 1.1)).toLocaleString()}
                      </td>
                      <td className="border border-slate-300 p-3 text-right">
                        {((gov.step14_contractAmount || estimate.totalAmount || 0) - Math.round((gov.step14_contractAmount || estimate.totalAmount || 0) / 1.1)).toLocaleString()}
                      </td>
                      <td className="border border-slate-300 p-3 text-right font-bold text-teal-800">
                        {(gov.step14_contractAmount || estimate.totalAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
