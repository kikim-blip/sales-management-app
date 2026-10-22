// src/components/quoteTemplates/TemplateTheSeoul.jsx
// 3_C사: 더서울미디어 주식회사 공식 견적서 템플릿 (영문 병기 모던 미니멀형)
import React from 'react';
import { Stamp, Globe } from 'lucide-react';

export default function TemplateTheSeoul({
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
    <div className="font-sans text-slate-800 text-xs space-y-4 print:text-black">
      {/* 1. 모던 영문 병기 헤더 */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
        <div className="flex items-center space-x-3">
          {logoImage ? (
            <img src={logoImage} alt="로고" className="h-10 max-w-[150px] object-contain" />
          ) : (
            <div className="text-xl font-black tracking-tighter text-slate-900">
              THESEOUL <span className="text-sky-600 text-sm font-semibold">MEDIA</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-wider text-slate-900">
            견적서 <span className="text-slate-400 font-light text-base">｜ ESTIMATE</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono">Quotation No. {quote.code_number || `TS-${Date.now().toString().slice(-6)}`}</p>
        </div>
      </div>

      {/* 2. 상단 좌측 Client 정보 & 우측 공급사 정보 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 Client/Project 메타 */}
        <div className="col-span-12 sm:col-span-6 space-y-1.5 py-1 text-[11.5px] bg-slate-50/70 p-3 rounded-xl border border-slate-200">
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Client/거래처 :</span>
            <span className="font-bold text-slate-900 text-sm">{custName}</span>
          </div>
          {shouldShowContact && custContact ? (
            <div className="flex">
              <span className="w-24 text-slate-500 font-semibold">담당자 &nbsp; &nbsp; :</span>
              <span className="font-semibold text-slate-800">{custContact}</span>
            </div>
          ) : null}
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Date/날짜 &nbsp; &nbsp; :</span>
            <span className="font-semibold text-slate-700">{todayKorean}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-500 font-semibold">Project/건명 &nbsp; :</span>
            <span className="font-bold text-slate-900">{quote.title}</span>
          </div>
          <div className="flex pt-1.5 border-t border-slate-200">
            <span className="w-24 text-slate-500 font-semibold">Amount/금액 &nbsp; :</span>
            <span className="font-bold text-sky-900 text-sm">
              일금 {koreanTotalPrice}원정 <span className="text-xs text-slate-600">(₩ {totalPrice.toLocaleString()})</span>
            </span>
          </div>
        </div>

        {/* 우측 공급사 격자 박스 */}
        <div className="col-span-12 sm:col-span-6 border border-slate-300 text-[10.5px] relative bg-white rounded-xl overflow-hidden">
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
            <div className="absolute right-2 top-4 w-11 h-11 rounded-full border border-rose-500 text-rose-500 flex items-center justify-center font-bold text-[8px] transform rotate-6 select-none pointer-events-none bg-rose-50/20">
              더서울<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 명세 테이블 (미니멀 가로선 중심) */}
      <div className="border-t-2 border-b-2 border-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] font-semibold text-center">
              <th className="p-2 border-r border-slate-700 w-16">항 목</th>
              <th className="p-2 border-r border-slate-700 min-w-[130px]">내 &nbsp; 용</th>
              <th className="p-2 border-r border-slate-700 w-24">규 &nbsp; 격</th>
              <th className="p-2 border-r border-slate-700 w-14">페이지</th>
              <th className="p-2 border-r border-slate-700 w-16">수 &nbsp; 량</th>
              <th className="p-2 border-r border-slate-700 w-24 text-right pr-3">단 &nbsp; 가</th>
              <th className="p-2 border-r border-slate-700 w-28 text-right pr-3">금 &nbsp; 액</th>
              <th className="p-2 w-28">비 &nbsp; 고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-slate-50 transition">
                <td className="p-2 text-center text-slate-500 font-mono text-[11px] border-r border-slate-200">{idx + 1}</td>
                <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{it.name || quote.title}</td>
                <td className="p-2 text-slate-600 text-center border-r border-slate-200">{it.spec || '-'}</td>
                <td className="p-2 text-center font-mono border-r border-slate-200">{it.pages || 1}</td>
                <td className="p-2 text-center font-mono font-semibold border-r border-slate-200">{Number(it.quantity || 1).toLocaleString()} {it.unit || '부'}</td>
                <td className="p-2 text-right pr-3 font-mono border-r border-slate-200">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 text-right pr-3 font-mono font-bold text-slate-900 border-r border-slate-200">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-500 text-[11px]">{it.note || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold divide-y divide-slate-200">
            <tr>
              <td colSpan={6} className="p-2 text-right pr-4 text-slate-600 font-semibold">소 계 (SUB TOTAL)</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {(calcData.rawSupplyPrice || supplyPrice).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={6} className="p-2 text-right pr-4 text-slate-600 font-semibold">공급가액 (SUPPLY AMOUNT)</td>
              <td className="p-2 text-right pr-3 font-mono font-black text-slate-900">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">{calcData.discountAmount > 0 ? '절사' : ''}</td>
            </tr>
            <tr>
              <td colSpan={6} className="p-2 text-right pr-4 text-slate-600 font-semibold">부 가 세 (V.A.T 10%)</td>
              <td className="p-2 text-right pr-3 font-mono text-slate-700">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-900 text-white font-black">
              <td colSpan={6} className="p-2.5 text-right pr-4 text-sm font-black">총 견적합계 (TOTAL AMOUNT)</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-emerald-400">₩ {totalPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-400">VAT포함</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. 결제정보 & 비고 */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
        <div>
          <span className="font-semibold text-slate-800">결제조건: </span> {quote.payment_terms || '납품 후 100% 현금'} &nbsp;|&nbsp; 
          <span className="font-semibold text-slate-800">유효기간: </span> {quote.valid_days || '견적 후 30일'}
        </div>
        <div>
          <span className="font-semibold text-slate-800">입금계좌: </span> {supplier.bank}
        </div>
      </div>
    </div>
  );
}
