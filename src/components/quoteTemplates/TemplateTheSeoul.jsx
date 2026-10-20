// src/components/quoteTemplates/TemplateTheSeoul.jsx
// 3_C사: 더서울미디어 주식회사 공식 견적서 템플릿 (영문 병기 모던 미니멀형)
import React from 'react';
import { Stamp } from 'lucide-react';

export default function TemplateTheSeoul({
  quote,
  customer,
  supplier,
  calcData,
  todayKorean,
  managerName,
  stampImage,
}) {
  const custName = customer?.name || quote.customer_name || '거래처';
  const custContact = quote.contact_person || customer?.contact_person || '사업총괄팀 귀중';
  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;

  return (
    <div className="font-sans text-slate-800 text-xs space-y-4 print:text-black">
      {/* 1. 모던 타이틀 */}
      <div className="border-b-2 border-slate-900 pb-2">
        <h1 className="text-2xl font-bold tracking-wider text-slate-900">
          견적서 <span className="text-slate-400 font-light text-xl">｜ ESTIMATE</span>
        </h1>
      </div>

      {/* 2. 상단 좌측 Client 정보 & 우측 공급사 정보 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 Client/Project 메타 */}
        <div className="col-span-12 sm:col-span-6 space-y-1.5 py-1 text-[11.5px]">
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Client/거래처 :</span>
            <span className="font-bold text-slate-900 text-sm">{custName}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">담당자 &nbsp; &nbsp; :</span>
            <span className="font-semibold text-slate-800">{custContact}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Date/날짜 &nbsp; &nbsp; :</span>
            <span className="font-semibold text-slate-700">{todayKorean}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Project/건명 &nbsp; :</span>
            <span className="font-bold text-slate-900">{quote.title}</span>
          </div>
          <div className="flex pt-1 border-t border-slate-200">
            <span className="w-24 text-slate-500 font-semibold">Amount/금액 &nbsp; :</span>
            <span className="font-bold text-sky-900 text-sm">
              일금 {koreanTotalPrice}원정 <span className="text-xs text-slate-600">(₩ {totalPrice.toLocaleString()})</span>
            </span>
          </div>
        </div>

        {/* 우측 공급사 격자 박스 */}
        <div className="col-span-12 sm:col-span-6 border border-slate-300 text-[10.5px] relative bg-slate-50/50">
          <div className="divide-y divide-slate-200">
            <div className="flex">
              <span className="w-20 bg-slate-100 p-1.5 font-bold text-center border-r border-slate-200">등록번호</span>
              <span className="p-1.5 font-mono font-bold flex-1">{supplier.bizNum}</span>
            </div>
            <div className="flex">
              <span className="w-20 bg-slate-100 p-1.5 font-bold text-center border-r border-slate-200">상 &nbsp; &nbsp; 호</span>
              <span className="p-1.5 font-bold flex-1">{supplier.name}</span>
              <span className="w-16 bg-slate-100 p-1.5 font-bold text-center border-l border-r border-slate-200">대표자</span>
              <span className="p-1.5 font-bold w-20">{supplier.ceo} (인)</span>
            </div>
            <div className="flex">
              <span className="w-20 bg-slate-100 p-1.5 font-bold text-center border-r border-slate-200">사 업 장</span>
              <span className="p-1.5 text-[10px] leading-tight flex-1">{supplier.address}</span>
            </div>
            <div className="flex">
              <span className="w-20 bg-slate-100 p-1.5 font-bold text-center border-r border-slate-200">업 &nbsp; &nbsp; 태</span>
              <span className="p-1.5 flex-1">{supplier.bizType}</span>
              <span className="w-16 bg-slate-100 p-1.5 font-bold text-center border-l border-r border-slate-200">종 &nbsp; 목</span>
              <span className="p-1.5 flex-1">{supplier.bizItem}</span>
            </div>
          </div>

          {/* 도장 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-2 top-4 w-12 h-12 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-2 top-4 w-11 h-11 rounded-full border border-rose-500 text-rose-500 flex items-center justify-center font-bold text-[8px] transform rotate-6 select-none pointer-events-none">
              더서울<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 명세 테이블 */}
      <div className="border border-slate-400 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-[11px] font-semibold text-center">
              <th className="p-2 border-r border-slate-600 w-16">항 목</th>
              <th className="p-2 border-r border-slate-600 min-w-[130px]">내 &nbsp; 용</th>
              <th className="p-2 border-r border-slate-600 w-24">규 &nbsp; 격</th>
              <th className="p-2 border-r border-slate-600 w-14">페이지</th>
              <th className="p-2 border-r border-slate-600 w-16">부수</th>
              <th className="p-2 border-r border-slate-600 w-24 text-right pr-3">단 &nbsp; 가</th>
              <th className="p-2 border-r border-slate-600 w-28 text-right pr-3">금 &nbsp; 액</th>
              <th className="p-2 w-28">비 &nbsp; 고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-slate-50/50">
                <td className="p-2 border-r border-slate-200 text-center text-slate-500 text-[10.5px]">
                  {idx === 0 ? '제작/인쇄' : ''}
                </td>
                <td className="p-2 border-r border-slate-200 font-medium text-slate-900">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-200 text-slate-600 text-center">{it.spec || '-'}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{it.pages || 1}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{Number(it.quantity || 1).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono font-semibold">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-500 text-[10.5px]">{it.note || '-'}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-7 text-transparent select-none">
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td className="border-r border-slate-200">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-700 bg-slate-50 font-semibold divide-y divide-slate-200">
            <tr>
              <td colSpan={6} className="p-2 text-right pr-4 text-slate-600">공 급 가 액</td>
              <td className="p-2 text-right pr-3 font-mono font-bold text-slate-900">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={6} className="p-2 text-right pr-4 text-slate-600">부 가 세 (10%)</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-100 font-bold border-t border-slate-700">
              <td colSpan={6} className="p-2.5 text-right pr-4 text-sm text-slate-900">합 계 금 액 (VAT포함)</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-sky-800">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. 하단 계좌 및 안내 */}
      <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1 border-t border-slate-200">
        <span>* 유효기간: 견적일로부터 30일 &nbsp;|&nbsp; 납품기한: 발주일로부터 14일 이내</span>
        {supplier.bank && <span className="font-semibold text-slate-800">입금계좌: {supplier.bank}</span>}
      </div>
    </div>
  );
}
