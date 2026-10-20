// src/components/quoteTemplates/TemplateSpacePlan.jsx
// 5_E사: 공간기획 공식 견적서 템플릿 (여성기업 인증 표기형)
import React from 'react';
import { Stamp, Award } from 'lucide-react';

export default function TemplateSpacePlan({
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
      {/* 1. 타이틀 */}
      <div className="text-center pt-2 pb-1">
        <h1 className="text-3xl font-black tracking-[0.8em] text-slate-900 underline decoration-2 underline-offset-8">
          견 &nbsp; 적 &nbsp; 서
        </h1>
      </div>

      {/* 2. 상단 수신 & 공급자 */}
      <div className="grid grid-cols-12 gap-3 text-xs">
        {/* 좌측 */}
        <div className="col-span-12 sm:col-span-5 flex flex-col justify-between py-1 space-y-1.5">
          <div className="flex items-baseline space-x-2 border-b border-slate-300 pb-1.5">
            <span className="text-base font-black text-slate-950">{custName}</span>
            <span className="text-sm font-bold text-slate-700">貴中</span>
          </div>
          <div className="text-[11px] text-slate-700 space-y-1">
            <p><span className="w-14 inline-block text-slate-500 font-semibold">담당자:</span> {custContact}</p>
            <p><span className="w-14 inline-block text-slate-500 font-semibold">작성자:</span> {supplier.contactPerson || managerName}</p>
            <p><span className="w-14 inline-block text-slate-500 font-semibold">작성일:</span> {todayKorean}</p>
          </div>
        </div>

        {/* 우측 공급사 */}
        <div className="col-span-12 sm:col-span-7 border-2 border-amber-800/80 p-3 bg-amber-50/20 text-[11px] space-y-1 relative">
          <div className="flex justify-between items-center border-b border-amber-300/80 pb-1">
            <div className="text-base font-black text-slate-900 tracking-wider">
              {supplier.name}
            </div>
            <div className="flex items-center text-[10.5px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              <Award className="w-3 h-3 mr-1" />
              <span>여성기업등록</span>
            </div>
          </div>

          <div className="pt-1 text-slate-700 space-y-0.5">
            <p>
              <strong className="text-slate-900">사업자번호 :</strong> {supplier.bizNum} &nbsp;&nbsp;|&nbsp;&nbsp; 
              <strong className="text-slate-900">대표 :</strong> {supplier.ceo} (인)
            </p>
            <p><strong className="text-slate-900">주 소 :</strong> {supplier.address}</p>
            <p>
              <strong className="text-slate-900">전 화 :</strong> {supplier.phone} &nbsp;|&nbsp; 
              <strong className="text-slate-900">e-mail :</strong> {supplier.email}
            </p>
          </div>

          {/* 도장 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-3 top-7 w-14 h-14 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-3 top-7 w-12 h-12 rounded-full border-2 border-rose-600/80 text-rose-600 flex items-center justify-center font-bold text-[9px] transform rotate-3 select-none pointer-events-none">
              공간기획<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 품명 및 금액 배너 */}
      <div className="border border-slate-700 divide-y divide-slate-700 text-xs">
        <div className="flex bg-slate-50">
          <div className="w-20 bg-slate-200 font-bold text-center py-2 text-slate-800 border-r border-slate-700">
            품 &nbsp; 명
          </div>
          <div className="p-2 font-bold text-slate-900 text-sm flex-1">
            {quote.title}
          </div>
        </div>
        <div className="flex items-center justify-between bg-amber-50/60 p-2 font-bold">
          <div className="flex items-center space-x-2">
            <span className="w-16 text-center text-slate-700">금 &nbsp; 액</span>
            <span className="text-sm font-black text-slate-950">일금 {koreanTotalPrice}원정</span>
          </div>
          <div className="font-mono text-base font-black text-slate-950 pr-2">
            ₩ {totalPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">(단위:원/VAT포함)</span>
          </div>
        </div>
      </div>

      {/* 4. 테이블 */}
      <div className="border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-amber-100/60 text-slate-900 border-b border-slate-700 text-[11px] font-bold text-center">
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
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">합 계 금 액</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">공 급 가 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">절사</td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">부 &nbsp; 가 &nbsp; 세</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-amber-100/60 font-black border-t border-slate-700">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm text-slate-950">합 계 금 액 (VAT 포함)</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-amber-950">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 계좌 표기 */}
      <div className="p-2.5 border border-slate-300 bg-white text-center font-bold text-slate-800 text-xs">
        {supplier.bank || '기업은행 221-377824-04-014 박지혜(공간기획)'}
      </div>
    </div>
  );
}
