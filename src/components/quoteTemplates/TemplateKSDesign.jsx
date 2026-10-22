// src/components/quoteTemplates/TemplateKSDesign.jsx
// 6_F사: 경성디자인 공식 견적서 템플릿 (시각디자인/홍보물 기획형)
import React from 'react';
import { Stamp, Palette } from 'lucide-react';

export default function TemplateKSDesign({
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
  const shouldShowContact = quote.hide_contact_person ? false : (quote.show_contact_person !== undefined ? quote.show_contact_person : true);
  const explicitContact = quote.client_contact_person !== undefined ? quote.client_contact_person : quote.contact_person;
  const custContact = shouldShowContact ? (explicitContact !== undefined ? explicitContact : (customer?.contact_person || '')) : '';
  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;

  return (
    <div className="font-sans text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 디자인 부티크 스타일 타이틀 */}
      <div className="flex items-center justify-between border-b-2 border-rose-800 pb-2">
        <div className="flex items-center space-x-2">
          {logoImage ? (
            <img src={logoImage} alt="로고" className="h-10 max-w-[140px] object-contain" />
          ) : (
            <div className="flex items-center space-x-1.5 text-rose-900 font-black text-lg">
              <Palette className="w-5 h-5 text-rose-600" />
              <span>KYUNGSUNG DESIGN</span>
            </div>
          )}
        </div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-black tracking-[0.7em] text-slate-950 underline decoration-1 underline-offset-8">
            견 &nbsp; 적 &nbsp; 서
          </h1>
        </div>
        <div className="text-right text-[10px] text-rose-700 font-mono">
          <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">시각디자인 전문기업</span>
        </div>
      </div>

      {/* 2. 상단 수신 및 공급자 박스 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 */}
        <div className="col-span-12 sm:col-span-5 space-y-1 py-1 bg-rose-50/20 p-3 rounded-xl border border-rose-100">
          <div className="flex items-baseline space-x-2 border-b border-rose-200 pb-1.5">
            <span className="text-base font-black text-slate-950">{custName}</span>
            <span className="text-sm font-bold text-slate-700">貴中</span>
          </div>
          <div className="text-[11px] text-slate-700 space-y-1 pt-1">
            {shouldShowContact && custContact ? (
              <p><span className="w-14 inline-block text-slate-500 font-semibold">담당자:</span> {custContact}</p>
            ) : null}
            <p><span className="w-14 inline-block text-slate-500 font-semibold">작성자:</span> <strong className="text-rose-900">{supplier.contactPerson || '김 광 일 부장 (010-9879-5944)'}</strong></p>
            <p><span className="w-14 inline-block text-slate-500 font-semibold">작성일:</span> {todayKorean}</p>
          </div>
        </div>

        {/* 우측 공급사 */}
        <div className="col-span-12 sm:col-span-7 border border-rose-900/30 p-3 bg-rose-50/30 text-[11px] space-y-1 relative rounded-xl">
          <div className="flex justify-between items-center border-b border-rose-200 pb-1">
            <div className="text-sm font-black text-slate-900">{supplier.name}</div>
            <span className="text-[10px] text-rose-800 font-semibold">{supplier.certTag}</span>
          </div>

          <div className="pt-1 text-slate-700 space-y-0.5">
            <p>
              <strong className="text-slate-900">사업자번호 :</strong> {supplier.bizNum} &nbsp;&nbsp;|&nbsp;&nbsp; 
              <strong className="text-slate-900">대 표 :</strong> {supplier.ceo} (인)
            </p>
            <p><strong className="text-slate-900">주 소 :</strong> {supplier.address}</p>
            <p>
              <strong className="text-slate-900">전 화 :</strong> {supplier.phone} &nbsp;|&nbsp; 
              <strong className="text-slate-900">e-mail :</strong> {supplier.email}
            </p>
            {supplier.bank && (
              <p><strong className="text-slate-900">계 좌 :</strong> {supplier.bank}</p>
            )}
          </div>

          {/* 도장 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-3 top-7 w-14 h-14 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-3 top-7 w-12 h-12 rounded-full border-2 border-rose-600 text-rose-600 flex items-center justify-center font-bold text-[9px] transform rotate-3 select-none pointer-events-none bg-rose-50/20">
              경성디자인<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 품명 및 금액 배너 */}
      <div className="border border-rose-900/40 divide-y divide-rose-900/40 text-xs rounded-xl overflow-hidden">
        <div className="flex bg-slate-50">
          <div className="w-20 bg-rose-100/70 font-bold text-center py-2 text-rose-950 border-r border-rose-900/40">
            품 &nbsp; 명
          </div>
          <div className="p-2 font-bold text-slate-900 text-sm flex-1">
            {quote.title}
          </div>
        </div>
        <div className="flex items-center justify-between bg-rose-50/60 p-2 font-bold">
          <div className="flex items-center space-x-2">
            <span className="w-16 text-center text-rose-900">금 &nbsp; 액</span>
            <span className="text-sm font-black text-slate-950">일금 {koreanTotalPrice}원정</span>
          </div>
          <div className="font-mono text-base font-black text-slate-950 pr-2">
            ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">(단위:원/VAT포함)</span>
          </div>
        </div>
      </div>

      {/* 4. 테이블 */}
      <div className="border border-rose-900/40 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-rose-900 text-white border-b border-rose-900 text-[11px] font-bold text-center">
              <th className="p-2 border-r border-rose-800 min-w-[130px]">품 &nbsp; &nbsp; &nbsp; &nbsp; 명</th>
              <th className="p-2 border-r border-rose-800 w-24">규 &nbsp; 격</th>
              <th className="p-2 border-r border-rose-800 w-16">면 &nbsp; 수</th>
              <th className="p-2 border-r border-rose-800 w-16">수 &nbsp; 량</th>
              <th className="p-2 border-r border-rose-800 w-24 text-right pr-3">단 &nbsp; 가</th>
              <th className="p-2 border-r border-rose-800 w-28 text-right pr-3">금 &nbsp; 액</th>
              <th className="p-2 w-28">비 &nbsp; 고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-rose-50/30">
                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-200 text-slate-700 text-center">{it.spec || '-'}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{it.pages || 1}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{Number(it.quantity || 1).toLocaleString()} {it.unit || '부'}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-200 text-right pr-3 font-mono font-bold text-slate-900">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-rose-900/40 bg-rose-50/40 font-bold divide-y divide-rose-200">
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">소 &nbsp; &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {(calcData.rawSupplyPrice || supplyPrice).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">공 급 가 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black text-slate-950">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">{calcData.discountAmount > 0 ? '절사' : ''}</td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">부 가 세 (10%)</td>
              <td className="p-2 text-right pr-3 font-mono text-slate-700">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-rose-100 font-black border-t border-rose-900/60">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm text-rose-950">합 계 금 액</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-rose-900">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 계좌 및 특이사항 */}
      <div className="border border-rose-200 p-2.5 bg-rose-50/40 rounded-xl text-[11px] text-rose-950 flex justify-between items-center">
        <span>* 특이사항: {quote.estimate_note || '검수 후 계좌입금'}</span>
        {supplier.bank && <span className="font-semibold">결제계좌: {supplier.bank}</span>}
      </div>
    </div>
  );
}
