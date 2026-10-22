// src/components/quoteTemplates/TemplateHappyTree.jsx
// 4_D사: 행복한나무 공식 견적서 템플릿 (출판/인쇄 프로덕션형)
import React from 'react';
import { Stamp, Trees } from 'lucide-react';

export default function TemplateHappyTree({
  quote,
  customer,
  supplier,
  calcData,
  todayKorean,
  managerName,
  stampImage,
  logoImage,
}) {
  const custName = customer?.name || quote.customer_name || '거래처';
  const shouldShowContact = quote.show_contact_on_estimate !== undefined
    ? (quote.show_contact_on_estimate === 1 || quote.show_contact_on_estimate === true)
    : (quote.hide_contact_person ? false : (quote.show_contact_person !== undefined ? quote.show_contact_person : true));
  const explicitContact = quote.client_contact_person !== undefined ? quote.client_contact_person : quote.contact_person;
  const custContact = shouldShowContact ? (explicitContact !== undefined ? explicitContact : (customer?.contact_person || '')) : '';
  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;

  return (
    <div className="font-sans text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 친환경 에코 그린 메인 타이틀 */}
      <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-2">
        <div className="flex items-center space-x-2">
          {logoImage ? (
            <img src={logoImage} alt="로고" className="h-10 max-w-[140px] object-contain" />
          ) : (
            <div className="flex items-center space-x-1.5 text-emerald-800 font-black text-lg">
              <Trees className="w-5 h-5 text-emerald-600" />
              <span>행복한나무</span>
            </div>
          )}
        </div>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-black tracking-widest text-slate-950">
            견 &nbsp; 적 &nbsp; 서
          </h1>
          <span className="text-[10px] font-normal text-emerald-700 font-mono tracking-normal">
            / Print Production Estimate /
          </span>
        </div>
        <div className="text-right text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          사회적기업 · 중증장애인생산품
        </div>
      </div>

      {/* 2. 상단 수신처 및 공급자 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 */}
        <div className="col-span-12 sm:col-span-6 space-y-1.5 py-1 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-black text-slate-900">{custName}</span>
            <span className="text-sm font-bold text-slate-700">貴中</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
            {shouldShowContact && custContact ? (
              <p><span className="w-16 inline-block font-semibold text-slate-500">담당자 :</span> {custContact}</p>
            ) : null}
            <p><span className="w-16 inline-block font-semibold text-slate-500">작성일 :</span> {todayKorean}</p>
            <p><span className="w-16 inline-block font-semibold text-slate-500">품 &nbsp; 명 :</span> <strong className="text-slate-900">{quote.title}</strong></p>
          </div>
        </div>

        {/* 우측: 공급자 */}
        <div className="col-span-12 sm:col-span-6 border-l-4 border-emerald-700 pl-3.5 py-1 space-y-1 text-[11px] relative bg-white">
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
            <div className="absolute right-2 top-2 w-12 h-12 rounded-full border-2 border-emerald-700 text-emerald-800 flex items-center justify-center font-bold text-[9px] transform rotate-3 select-none pointer-events-none bg-emerald-50/30">
              행복한나무<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 금액 바 */}
      <div className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-800 p-2.5 text-xs font-bold rounded-xl">
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-800 text-white px-2.5 py-1 rounded text-[11px]">금 액</span>
          <span className="text-sm font-black text-slate-900">일금 {koreanTotalPrice}원정</span>
        </div>
        <div className="font-mono text-base font-black text-emerald-900 pr-1">
          ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-600">(VAT포함)</span>
        </div>
      </div>

      {/* 4. 테이블 */}
      <div className="border border-emerald-800 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-800 text-white border-b border-emerald-800 text-[11px] font-bold text-center">
              <th className="p-2 border-r border-emerald-700 min-w-[130px]">품 &nbsp; &nbsp; &nbsp; &nbsp; 명</th>
              <th className="p-2 border-r border-emerald-700 w-24">규 &nbsp; 격</th>
              <th className="p-2 border-r border-emerald-700 w-16">면 &nbsp; 수</th>
              <th className="p-2 border-r border-emerald-700 w-16">수 &nbsp; 량</th>
              <th className="p-2 border-r border-emerald-700 w-24 text-right pr-3">단가</th>
              <th className="p-2 border-r border-emerald-700 w-28 text-right pr-3">금액</th>
              <th className="p-2 w-28">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-emerald-50/40">
                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-200 text-slate-700 text-center">{it.spec || '-'}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{it.pages || 1}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{Number(it.quantity || 1).toLocaleString()} {it.unit || '부'}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono font-bold text-slate-950">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-emerald-800 bg-emerald-50/70 font-bold divide-y divide-emerald-200">
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-emerald-900">소 &nbsp; &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {(calcData.rawSupplyPrice || supplyPrice).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-emerald-900">공 급 가 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black text-slate-950">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">{calcData.discountAmount > 0 ? '절사' : ''}</td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-emerald-900">부 가 세 (10%)</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-emerald-100 font-black border-t-2 border-emerald-800">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm text-emerald-950">합 계 금 액</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-emerald-900">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 비고 */}
      <div className="border border-emerald-200 p-2.5 bg-emerald-50/50 rounded-xl text-[11px] text-emerald-900 flex justify-between items-center">
        <span>* 특이사항: {quote.estimate_note || '검수 후 계좌입금'}</span>
        {supplier.bank && <span className="font-semibold">결제계좌: {supplier.bank}</span>}
      </div>
    </div>
  );
}
