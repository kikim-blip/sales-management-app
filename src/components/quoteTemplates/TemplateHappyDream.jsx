// src/components/quoteTemplates/TemplateHappyDream.jsx
// 7_G사: (주)행복드림 공식 견적서 템플릿 (여성장애인기업 관공서 정통 서식)
import React from 'react';
import { Stamp } from 'lucide-react';

export default function TemplateHappyDream({
  quote,
  customer,
  supplier,
  calcData,
  todayKorean,
  managerName,
  stampImage,
}) {
  const custName = customer?.name || quote.customer_name || '거래처';
  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;

  return (
    <div className="font-serif text-slate-900 text-xs space-y-3.5 print:text-black">
      {/* 1. 상단 여성장애인기업 공식 인증 슬로건 2줄 배너 */}
      <div className="text-center space-y-0.5 border-b-2 border-slate-800 pb-2">
        <p className="text-[11px] font-bold text-slate-800 tracking-wide">
          고객감동 실현, 서비스 품질인증(AAA+)으로 이어가는 ㈜행복드림여성장애인기업
        </p>
        <p className="text-[10px] text-slate-600">
          혁신을 통한 여성기업의 새로운 비젼! 사회속으로 발돋움하는 여성장애인, 당신의 꿈을 응원합니다.
        </p>
      </div>

      {/* 2. 메인 타이틀 */}
      <div className="text-center py-0.5">
        <h1 className="text-2xl font-black tracking-[1em] text-slate-950">
          견 &nbsp; 적 &nbsp; 서
        </h1>
      </div>

      {/* 3. 상단 수신 & 정통 관공서 세로형 공급자 격자 박스 */}
      <div className="grid grid-cols-12 gap-2 text-xs">
        {/* 좌측 */}
        <div className="col-span-12 sm:col-span-5 flex flex-col justify-between py-1 space-y-2">
          <div className="text-xs text-slate-700 font-sans">{todayKorean}</div>
          <div className="text-base font-bold text-slate-950 border-b border-slate-400 pb-1">
            {custName} &nbsp; <span className="font-serif text-sm">貴下</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 text-purple-900 p-1.5 font-sans font-bold text-[10.5px] text-center rounded">
            사회적기업 ★ 여성장애인기업 ★ 중소기업
          </div>
        </div>

        {/* 우측 세로 공급자 격자 */}
        <div className="col-span-12 sm:col-span-7 border-2 border-slate-900 text-[10px] relative bg-white">
          <div className="grid grid-cols-12 divide-x divide-slate-800 border-b divide-y-0">
            {/* 세로 타이틀 */}
            <div className="col-span-2 row-span-5 bg-slate-100 flex items-center justify-center font-bold text-center p-1 border-r border-slate-800 leading-tight tracking-widest">
              공<br/>급<br/>자
            </div>
            
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1 font-bold text-center">등록번호</div>
              <div className="col-span-7 p-1 font-mono font-bold">{supplier.bizNum}</div>
            </div>
            
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1 font-bold text-center">상 &nbsp; &nbsp; 호</div>
              <div className="col-span-4 p-1 font-bold leading-tight">{supplier.name}<br/><span className="text-[9px] text-purple-700">(여성장애인기업)</span></div>
              <div className="col-span-3 p-1 font-bold flex items-center justify-between">
                <span>대 표:</span>
                <span className="text-[9.5px]">{supplier.ceo}</span>
              </div>
            </div>

            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1 font-bold text-center">사업장소재지</div>
              <div className="col-span-7 p-1 text-[9.5px] leading-tight">{supplier.address}</div>
            </div>

            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1 font-bold text-center">대표전화</div>
              <div className="col-span-3 p-1 font-mono">{supplier.phone}</div>
              <div className="col-span-1 bg-slate-50 p-1 font-bold text-center">팩스</div>
              <div className="col-span-3 p-1 font-mono">{supplier.fax}</div>
            </div>

            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800">
              <div className="col-span-3 bg-slate-50 p-1 font-bold text-center">업 &nbsp; &nbsp; 태</div>
              <div className="col-span-3 p-1 text-[9px]">{supplier.bizType}</div>
              <div className="col-span-1 bg-slate-50 p-1 font-bold text-center">종목</div>
              <div className="col-span-3 p-1 text-[9px] leading-tight">{supplier.bizItem}</div>
            </div>
          </div>

          {/* 도장 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-2 top-4 w-12 h-12 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-2 top-4 w-11 h-11 rounded-full border border-rose-600 text-rose-600 flex items-center justify-center font-bold text-[8px] transform rotate-3 select-none pointer-events-none">
              행복드림<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 4. 금액 배너 */}
      <div className="border border-slate-800 p-2 text-center bg-slate-50 font-bold flex justify-between items-center text-xs">
        <span className="text-slate-700">금 &nbsp; 액 :</span>
        <span className="text-sm font-black text-slate-950">
          일금 &ldquo; {koreanTotalPrice} &rdquo; 원정
        </span>
        <span className="font-mono text-sm font-black text-slate-900">
          ₩ {totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">( VAT포함가 )</span>
        </span>
      </div>

      {/* 5. 품목 테이블 */}
      <div className="border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 text-[11px] font-bold text-center">
              <th className="p-2 border-r border-slate-400 min-w-[130px]">품 &nbsp; 명</th>
              <th className="p-2 border-r border-slate-400 w-24">규격</th>
              <th className="p-2 border-r border-slate-400 w-16">면수</th>
              <th className="p-2 border-r border-slate-400 w-16">수량</th>
              <th className="p-2 border-r border-slate-400 w-24 text-right pr-3">단가</th>
              <th className="p-2 border-r border-slate-400 w-28 text-right pr-3">금액</th>
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
          <tfoot className="border-t border-slate-800 bg-slate-50 font-bold divide-y divide-slate-200 font-sans">
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">소 &nbsp; &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">공 &nbsp; 급 &nbsp; 가 &nbsp; 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black">₩ {supplyPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">부가세 (10%)</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-200 font-black border-t border-slate-800">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm text-slate-950">합 &nbsp; 계 &nbsp; 금 &nbsp; 액</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-slate-950">₩ {totalPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-xs text-purple-900 font-bold">*물류비 포함*</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 6. 계좌정보 */}
      {supplier.bank && (
        <div className="p-2 border border-slate-300 text-[11px] text-slate-700 flex justify-between bg-white font-sans">
          <span>* 특이사항: {quote.estimate_note || '발주 후 제작 진행'}</span>
          <span className="font-semibold text-slate-900">입금계좌: {supplier.bank}</span>
        </div>
      )}
    </div>
  );
}
