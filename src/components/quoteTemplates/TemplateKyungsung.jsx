// src/components/quoteTemplates/TemplateKyungsung.jsx
// 1_당사: 주식회사 경성문화사 공식 견적서 템플릿
import React from 'react';
import { Stamp } from 'lucide-react';

export default function TemplateKyungsung({
  quote,
  customer,
  supplier,
  calcData,
  todayKorean,
  managerName,
  stampImage,
}) {
  const custName = customer?.name || quote.customer_name || '거래처';
  const custDept = quote.dept || customer?.dept || '';
  const custContact = quote.contact_person || customer?.contact_person || '';
  const custPhone = quote.phone || customer?.phone || '';

  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;
  const isPrintTemplate = items.some(it => it.pages && Number(it.pages) > 0);

  return (
    <div className="font-sans text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 메인 대제목 */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-3xl font-black tracking-[0.6em] text-slate-950 underline decoration-2 underline-offset-8">
          견 &nbsp; 적 &nbsp; 서
        </h1>
      </div>

      {/* 2. 상단 수신처 및 공급자 박스 */}
      <div className="grid grid-cols-12 border-2 border-slate-900 text-xs">
        {/* 좌측: 수신처 */}
        <div className="col-span-12 sm:col-span-5 border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 flex flex-col justify-between p-3.5 bg-white">
          <div className="space-y-1.5 text-center my-auto py-2">
            <h2 className="text-base font-black text-slate-900 tracking-widest mb-1.5">
              거 &nbsp; 래 &nbsp; 처
            </h2>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {custName}
            </h2>
            {custDept && (
              <h3 className="text-sm font-bold text-slate-700">
                {custDept}
              </h3>
            )}
            <p className="text-base font-black text-slate-900 tracking-widest pt-1">
              貴 &nbsp; 中
            </p>
          </div>

          <div className="border-t border-slate-300 pt-2 space-y-1 text-[11px] text-slate-700">
            <div className="flex"><span className="w-14 text-slate-500 font-semibold">담당자:</span> <span className="font-bold">{custContact || '-'} {custPhone ? `(${custPhone})` : ''}</span></div>
            <div className="flex"><span className="w-14 text-slate-500 font-semibold">작성자:</span> <span className="font-bold text-sky-900">{managerName}</span></div>
            <div className="flex"><span className="w-14 text-slate-500 font-semibold">작성일:</span> <span className="font-semibold">{todayKorean}</span></div>
          </div>
        </div>

        {/* 우측: 공급자 (경성문화사) */}
        <div className="col-span-12 sm:col-span-7 p-3.5 relative bg-slate-50/40 space-y-1 text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <div className="font-black text-slate-900 text-sm">{supplier.name}</div>
            <span className="text-[10px] text-slate-500 font-mono">{supplier.certTag}</span>
          </div>

          <div className="space-y-1 pt-1 text-slate-700 text-[11px]">
            <p>
              <strong className="text-slate-900">사업자번호 :</strong> {supplier.bizNum} &nbsp;&nbsp;|&nbsp;&nbsp; 
              <strong className="text-slate-900">대 표 :</strong> {supplier.ceo}
            </p>
            <p>
              <strong className="text-slate-900">주 소 :</strong> {supplier.address}
            </p>
            <p>
              <strong className="text-slate-900">전 화 :</strong> {supplier.phone} &nbsp;&nbsp;|&nbsp;&nbsp; 
              <strong className="text-slate-900">팩 스 :</strong> {supplier.fax}
            </p>
            <p>
              <strong className="text-slate-900">e-mail :</strong> {supplier.email}
            </p>
            {supplier.bank && (
              <p>
                <strong className="text-slate-900">입금계좌 :</strong> {supplier.bank}
              </p>
            )}
          </div>

          {/* 직인 날인 영역 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-3 top-5 w-16 h-16 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-3 top-7 w-14 h-14 rounded-full border-2 border-rose-600/90 text-rose-600 flex items-center justify-center font-black text-[10px] transform rotate-6 opacity-85 select-none pointer-events-none bg-rose-50/20">
              <div className="text-center leading-tight">
                <Stamp className="w-3.5 h-3.5 mx-auto mb-0.5" />
                <span>경성문화<br/>직인</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 품명 및 총 금액 배너 */}
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
              일금 {koreanTotalPrice} 원정
            </div>
          </div>

          <div className="pr-4 font-mono font-black text-slate-900 text-sm sm:text-base">
            ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">(단위:원/VAT포함)</span>
          </div>
        </div>
      </div>

      {/* 4. 세부 품목 명세 테이블 */}
      <div className="border-2 border-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-amber-100/80 text-slate-900 border-b-2 border-slate-900 text-[11px] font-black text-center">
              <th className="p-2 border-r border-slate-400 min-w-[140px]">품 &nbsp; 명</th>
              <th className="p-2 border-r border-slate-400 w-28">규 &nbsp; 격</th>
              {isPrintTemplate && <th className="p-2 border-r border-slate-400 w-16">페이지</th>}
              <th className="p-2 border-r border-slate-400 w-20">수 &nbsp; 량</th>
              <th className="p-2 border-r border-slate-400 w-24 text-right pr-3">단 &nbsp; 가</th>
              <th className="p-2 border-r border-slate-400 w-28 text-right pr-3">금 &nbsp; 액</th>
              <th className="p-2 w-32">비 &nbsp; 고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-slate-50/50">
                <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-300 text-slate-700">{it.spec || '-'}</td>
                {isPrintTemplate && (
                  <td className="p-2 border-r border-slate-300 text-center font-mono">
                    {it.pages ? `${it.pages}p` : '-'}
                  </td>
                )}
                <td className="p-2 border-r border-slate-300 text-center font-mono font-semibold">
                  {Number(it.quantity || 1).toLocaleString()} {it.unit || (isPrintTemplate ? '부' : '식')}
                </td>
                <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono">
                  {Number(it.unit_price || 0).toLocaleString()}
                </td>
                <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono font-bold text-slate-900">
                  {Number(it.amount || 0).toLocaleString()}
                </td>
                <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-7 text-transparent select-none">
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                {isPrintTemplate && <td className="border-r border-slate-300">&nbsp;</td>}
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-900 bg-slate-50/70 font-bold text-slate-900 divide-y divide-slate-200">
            <tr>
              <td colSpan={isPrintTemplate ? 5 : 4} className="p-2 text-right pr-4 font-bold text-slate-700">소 &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono font-bold">₩ {(calcData.rawSupplyPrice || supplyPrice).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={isPrintTemplate ? 5 : 4} className="p-2 text-right pr-4 font-bold text-slate-700">공 급 가 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black text-slate-950">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-slate-500 text-[11px]">
                {calcData.discountAmount > 0 ? '절사' : ''}
              </td>
            </tr>
            <tr>
              <td colSpan={isPrintTemplate ? 5 : 4} className="p-2 text-right pr-4 font-bold text-slate-700">부 &nbsp; 가 &nbsp; 세</td>
              <td className="p-2 text-right pr-3 font-mono font-bold text-slate-700">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-amber-100/60 font-black text-slate-950 border-t-2 border-slate-900">
              <td colSpan={isPrintTemplate ? 5 : 4} className="p-2.5 text-right pr-4 text-sm font-black">합 계 금 액 (VAT 포함)</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-rose-700">₩ {totalPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">원整</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 안내문 */}
      <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 text-xs text-slate-700 space-y-1">
        <p><strong className="text-slate-900">결제조건 :</strong> {quote.payment_terms || '납품 후 100% 현금/계좌이체'}</p>
        <p><strong className="text-slate-900">유효기간 :</strong> {quote.valid_days || '견적 후 30일간'}</p>
        {quote.estimate_note && (
          <p><strong className="text-slate-900">특이사항 :</strong> {quote.estimate_note}</p>
        )}
      </div>
    </div>
  );
}
