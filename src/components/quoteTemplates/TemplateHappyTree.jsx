// src/components/quoteTemplates/TemplateHappyTree.jsx
// 4_D사: 행복한나무 공식 견적서 템플릿 (출판/인쇄 프로덕션형)
import React from 'react';
import { Stamp } from 'lucide-react';

export default function TemplateHappyTree({
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
    <div className="font-sans text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 메인 타이틀 */}
      <div className="text-center pt-2 pb-1 border-b border-emerald-800 pb-2">
        <h1 className="text-2xl font-black tracking-widest text-slate-950">
          견 적 서 <span className="text-sm font-normal text-slate-500 font-mono">/ Print Production Estimate/Invoice</span>
        </h1>
      </div>

      {/* 2. 상단 수신처 및 공급자 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 */}
        <div className="col-span-12 sm:col-span-6 space-y-1.5 py-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-black text-slate-900">{custName}</span>
            <span className="text-sm font-bold text-slate-700">貴中</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
            <p><span className="w-16 inline-block font-semibold">담당자 :</span> {custContact}</p>
            <p><span className="w-16 inline-block font-semibold">작성일 :</span> {todayKorean}</p>
            <p><span className="w-16 inline-block font-semibold">품 &nbsp; 명 :</span> <strong className="text-slate-900">{quote.title}</strong></p>
          </div>
        </div>

        {/* 우측: 공급자 */}
        <div className="col-span-12 sm:col-span-6 border-l-2 border-emerald-700 pl-3 py-1 space-y-1 text-[11px] relative">
          <p className="text-sm font-black text-emerald-950">상호명 : {supplier.name}</p>
          <p>
            <strong className="text-slate-800">사업자번호 :</strong> {supplier.bizNum} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong className="text-slate-800">대표 :</strong> {supplier.ceo} (인)
          </p>
          <p><strong className="text-slate-800">주 소 :</strong> {supplier.address}</p>
          <p>
            <strong className="text-slate-800">전화 :</strong> {supplier.phone} &nbsp;|&nbsp; 
            <strong className="text-slate-800">e-mail :</strong> {supplier.email}
          </p>

          {/* 도장 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-2 top-2 w-14 h-14 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-2 top-2 w-12 h-12 rounded-full border-2 border-rose-600/80 text-rose-600 flex items-center justify-center font-bold text-[9px] transform rotate-3 select-none pointer-events-none">
              행복한나무<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 금액 바 */}
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-800 p-2.5 text-xs font-bold">
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-800 text-white px-2 py-0.5 rounded text-[11px]">금 액</span>
          <span className="text-sm font-black text-slate-900">일금 {koreanTotalPrice}원정</span>
        </div>
        <div className="font-mono text-base font-black text-emerald-900">
          ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-600">(VAT포함)</span>
        </div>
      </div>

      {/* 4. 테이블 */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-100/70 text-slate-900 border-b border-slate-700 text-[11px] font-bold text-center">
              <th className="p-2 border-r border-slate-300 min-w-[130px]">품 &nbsp; &nbsp; &nbsp; &nbsp; 명</th>
              <th className="p-2 border-r border-slate-300 w-24">규 &nbsp; 격</th>
              <th className="p-2 border-r border-slate-300 w-16">면 &nbsp; 수</th>
              <th className="p-2 border-r border-slate-300 w-16">수 &nbsp; 량</th>
              <th className="p-2 border-r border-slate-300 w-24 text-right pr-3">단가</th>
              <th className="p-2 border-r border-slate-300 w-28 text-right pr-3">금액</th>
              <th className="p-2 w-28">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-200 text-slate-700 text-center">{it.spec || '-'}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{it.pages || 1}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{Number(it.quantity || 1).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono font-bold">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
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
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-700 bg-slate-50 font-bold divide-y divide-slate-200">
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">소 &nbsp; &nbsp; &nbsp; &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">공 &nbsp; 급 &nbsp; 가 &nbsp; 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">부 &nbsp; 가 &nbsp; 세</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-emerald-100/50 font-black border-t border-slate-700">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm text-slate-950">합 &nbsp; 계 &nbsp; 금 &nbsp; 액</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-emerald-950">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 계좌 */}
      {supplier.bank && (
        <div className="p-2 border border-slate-300 text-slate-700 text-[11px] flex justify-between bg-white">
          <span>* 특이사항: {quote.estimate_note || '검수 후 계좌입금'}</span>
          <span className="font-bold text-slate-900">결제계좌: {supplier.bank}</span>
        </div>
      )}
    </div>
  );
}
