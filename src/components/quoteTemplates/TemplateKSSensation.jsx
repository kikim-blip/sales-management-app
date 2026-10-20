// src/components/quoteTemplates/TemplateKSSensation.jsx
// 2_B사: ㈜ 케이에스 센세이션 공식 견적서 템플릿 (관공서 정통 조달 결재형 서식)
import React from 'react';
import { Stamp } from 'lucide-react';

export default function TemplateKSSensation({
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
  const custDept = quote.dept || customer?.dept || '';
  const { items, supplyPrice, taxPrice, totalPrice, koreanTotalPrice } = calcData;

  return (
    <div className="font-serif text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 상단 로고 & 정통 명조 메인 타이틀 */}
      <div className="relative text-center pt-1 pb-1">
        {logoImage && (
          <div className="absolute left-0 top-0">
            <img src={logoImage} alt="로고" className="h-9 max-w-[130px] object-contain" />
          </div>
        )}
        <h1 className="text-3xl font-black tracking-[1em] text-slate-950 underline decoration-1 underline-offset-8">
          견 &nbsp; 적 &nbsp; 서
        </h1>
      </div>

      {/* 2. 상단 수신 및 공급자 정통 격자 테이블 */}
      <div className="grid grid-cols-12 gap-2 text-xs">
        {/* 좌측: 수신처 및 안내문 */}
        <div className="col-span-12 sm:col-span-6 flex flex-col justify-between py-1 pr-2 space-y-2">
          <div className="text-sm font-semibold tracking-wide">
            {todayKorean}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-950 border-b border-slate-400 pb-1">
            {custName} {custDept && <span className="text-sm">({custDept})</span>} &nbsp; 귀중
          </div>
          <p className="text-xs text-slate-700 tracking-wider">
            아래와 같이 견적합니다.
          </p>
          <div className="bg-slate-100 p-2 border border-slate-300 font-bold text-slate-900 text-sm">
            합계금: ₩ {totalPrice.toLocaleString()}원 정
          </div>
        </div>

        {/* 우측: 공급자 세로 결재 서식 */}
        <div className="col-span-12 sm:col-span-6 border-2 border-slate-800 text-[11px] relative bg-white">
          <div className="grid grid-cols-12 divide-x divide-slate-800 border-b divide-y-0">
            <div className="col-span-2 row-span-5 bg-slate-100 flex items-center justify-center font-bold text-center p-1 border-r border-slate-800 leading-tight">
              공<br/>급<br/>자
            </div>
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1.5 font-bold text-center">등록번호</div>
              <div className="col-span-7 p-1.5 font-mono font-bold">{supplier.bizNum}</div>
            </div>
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1.5 font-bold text-center">상 &nbsp; 호</div>
              <div className="col-span-4 p-1.5 font-bold">{supplier.name}</div>
              <div className="col-span-3 p-1.5 font-bold flex items-center justify-between">
                <span>대 표:</span>
                <span>{supplier.ceo} (인)</span>
              </div>
            </div>
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800 border-b border-slate-800">
              <div className="col-span-3 bg-slate-50 p-1.5 font-bold text-center">주 &nbsp; 소</div>
              <div className="col-span-7 p-1.5 text-[10.5px] leading-tight">{supplier.address}</div>
            </div>
            <div className="col-span-10 grid grid-cols-10 divide-x divide-slate-800">
              <div className="col-span-3 bg-slate-50 p-1.5 font-bold text-center">전 &nbsp; 화</div>
              <div className="col-span-7 p-1.5 font-mono">{supplier.contactPerson || supplier.phone}</div>
            </div>
          </div>

          {/* 도장 날인 위치 */}
          {stampImage ? (
            <img src={stampImage} alt="직인" className="absolute right-3 top-7 w-14 h-14 object-contain mix-blend-multiply pointer-events-none" />
          ) : (
            <div className="absolute right-3 top-7 w-12 h-12 rounded-full border-2 border-rose-600/80 text-rose-600 flex items-center justify-center font-bold text-[9px] transform rotate-3 select-none pointer-events-none bg-rose-50/10">
              케이에스<br/>직인
            </div>
          )}
        </div>
      </div>

      {/* 3. 건명 및 합계금액 배너 */}
      <div className="border border-slate-800 divide-y divide-slate-800 text-xs">
        <div className="grid grid-cols-12 bg-white">
          <div className="col-span-3 sm:col-span-2 bg-slate-100 p-2 font-bold text-center border-r border-slate-800">
            건 &nbsp; &nbsp; &nbsp; 명
          </div>
          <div className="col-span-9 sm:col-span-10 p-2 font-bold text-slate-900 text-sm">
            {quote.title}
          </div>
        </div>
        <div className="grid grid-cols-12 bg-slate-50">
          <div className="col-span-3 sm:col-span-2 bg-slate-100 p-2.5 font-bold text-center border-r border-slate-800">
            합 계 금 액
          </div>
          <div className="col-span-9 sm:col-span-10 p-2.5 flex items-center justify-between font-bold">
            <span className="text-sm">일 금: {koreanTotalPrice} 원정</span>
            <span className="font-mono text-base font-black">₩ {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 4. 세부 품목 명세 테이블 */}
      <div className="border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-800 text-[11px] font-bold text-center">
              <th className="p-2 border-r border-slate-400 min-w-[140px]">품 &nbsp; 목</th>
              <th className="p-2 border-r border-slate-400 w-28">규 &nbsp; 격</th>
              <th className="p-2 border-r border-slate-400 w-16">단위</th>
              <th className="p-2 border-r border-slate-400 w-16">수량</th>
              <th className="p-2 border-r border-slate-400 w-24 text-right pr-3">단가</th>
              <th className="p-2 border-r border-slate-400 w-28 text-right pr-3">금 &nbsp; 액</th>
              <th className="p-2 w-32">비 &nbsp; 고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {items.map((it, idx) => (
              <tr key={`item-${idx}`} className="hover:bg-slate-50">
                <td className="p-2 border-r border-slate-300 font-semibold">{it.name || quote.title}</td>
                <td className="p-2 border-r border-slate-300 text-slate-700">{it.spec || '-'}</td>
                <td className="p-2 border-r border-slate-300 text-center">{it.unit || '부'}</td>
                <td className="p-2 border-r border-slate-300 text-center font-mono">{Number(it.quantity || 1).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono">{Number(it.unit_price || 0).toLocaleString()}</td>
                <td className="p-2 border-r border-slate-300 text-right pr-3 font-mono font-bold">{Number(it.amount || 0).toLocaleString()}</td>
                <td className="p-2 text-slate-600 text-[11px]">{it.note || '-'}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-7 text-transparent select-none">
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td className="border-r border-slate-300">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-800 bg-slate-50 font-bold divide-y divide-slate-200">
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">합 &nbsp; &nbsp; &nbsp; &nbsp; 계</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {(calcData.rawSupplyPrice || supplyPrice).toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">공 &nbsp; 급 &nbsp; 가 &nbsp; 액</td>
              <td className="p-2 text-right pr-3 font-mono font-black">₩ {supplyPrice.toLocaleString()}</td>
              <td className="p-2 text-center text-[10px] text-slate-500">{calcData.discountAmount > 0 ? '절사' : ''}</td>
            </tr>
            <tr>
              <td colSpan={5} className="p-2 text-right pr-4 text-slate-700">부 가 세 (10%)</td>
              <td className="p-2 text-right pr-3 font-mono">₩ {taxPrice.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr className="bg-slate-200 font-black border-t border-slate-800">
              <td colSpan={5} className="p-2.5 text-right pr-4 text-sm">합 &nbsp; 계 &nbsp; 금 &nbsp; 액</td>
              <td className="p-2.5 text-right pr-3 font-mono text-base font-black text-slate-950">₩ {totalPrice.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. 안내 문구 및 계좌정보 */}
      <div className="border border-slate-300 p-2.5 bg-slate-50 text-[11px] text-slate-600 flex justify-between items-center">
        <span>본 견적서는 발행 후 1달간 유효하며 검인 없이 사용 가능 함.</span>
        {supplier.bank && <span className="font-semibold text-slate-800">입금계좌: {supplier.bank}</span>}
      </div>
    </div>
  );
}
