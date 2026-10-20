// src/components/quoteTemplates/TemplateComparisonTable.jsx
// 관공서 제출용 종합 견적 비교대조표 (7개사 총괄)
import React from 'react';

export default function TemplateComparisonTable({
  quote,
  customer,
  suppliers,
  summaryData,
  todayKorean,
}) {
  const custName = customer?.name || quote.customer_name || '거래처';

  // 기본 당사 품목 리스트
  const baseItems = summaryData[0]?.items || [];

  return (
    <div className="font-sans text-slate-900 text-xs space-y-4 print:text-black">
      {/* 1. 대제목 */}
      <div className="border-b-2 border-slate-900 pb-2">
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center">
          <span className="text-sky-700 mr-2">■</span> 종합 견적 비교대조표 <span className="text-sm font-semibold text-slate-600 ml-2">({quote.title})</span>
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-700 pt-2 font-medium">
          <p><strong className="text-slate-900">수요기관 :</strong> {custName}</p>
          <p><strong className="text-slate-900">견적일자 :</strong> {todayKorean}</p>
          <p><strong className="text-slate-900">납품기한 :</strong> {quote.delivery_terms || '발주일로부터 14일 이내'}</p>
          <p><strong className="text-slate-900">결제조건 :</strong> {quote.payment_terms || '전자세금계산서 청구 익월말 현금'}</p>
        </div>
      </div>

      {/* 2. 공급사별 총 견적금액 집계 및 비교 테이블 */}
      <div className="space-y-1.5">
        <h3 className="font-bold text-slate-900 text-xs">
          [ 1. 공급사별 총 견적금액 집계 및 비교 (VAT 포함) ]
        </h3>
        <div className="border-2 border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-[10.5px] font-bold text-center">
                <th className="p-2 border-r border-slate-700 w-10">No</th>
                <th className="p-2 border-r border-slate-700 w-16">구분</th>
                <th className="p-2 border-r border-slate-700 min-w-[120px]">공급사명 (상호)</th>
                <th className="p-2 border-r border-slate-700 w-14">대표자</th>
                <th className="p-2 border-r border-slate-700 w-24">사업자번호</th>
                <th className="p-2 border-r border-slate-700 w-24 text-right pr-2">공급가액</th>
                <th className="p-2 border-r border-slate-700 w-20 text-right pr-2">부가세</th>
                <th className="p-2 border-r border-slate-700 w-28 text-right pr-2">총 견적금액</th>
                <th className="p-2 border-r border-slate-700 w-20 text-right pr-2">당사대비</th>
                <th className="p-2 border-r border-slate-700 w-16 text-center">비율</th>
                <th className="p-2 min-w-[130px]">기업 특성 및 비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-[11px]">
              {summaryData.map((row, idx) => {
                const isBase = idx === 0;
                return (
                  <tr
                    key={`sup-${row.supplier.id}`}
                    className={isBase ? 'bg-sky-50/80 font-bold text-sky-950' : 'hover:bg-slate-50'}
                  >
                    <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-300 text-center font-semibold">
                      {isBase ? '1_당사' : row.supplier.code}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold">
                      {row.supplier.name}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center">{row.supplier.ceo}</td>
                    <td className="p-2 border-r border-slate-300 font-mono text-center text-[10px]">{row.supplier.bizNum}</td>
                    <td className="p-2 border-r border-slate-300 text-right pr-2 font-mono">
                      ₩ {row.supplyPrice.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right pr-2 font-mono text-slate-600">
                      ₩ {row.taxPrice.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right pr-2 font-mono font-black text-sm">
                      ₩ {row.totalPrice.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right pr-2 font-mono text-[10.5px]">
                      {isBase ? '-' : `+₩ ${row.diff.toLocaleString()}`}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                      {isBase ? '100%' : `${Math.round(row.ratio * 100)}%`}
                    </td>
                    <td className="p-2 text-[10.5px] text-slate-600">
                      {row.supplier.tag} {row.supplier.certTag ? `(${row.supplier.certTag})` : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 품목별 세부 단가 비교 테이블 */}
      <div className="space-y-1.5 pt-2">
        <h3 className="font-bold text-slate-900 text-xs">
          [ 2. 품목별 세부 견적 단가 비교 (VAT 별도) ]
        </h3>
        <div className="border border-slate-400 overflow-x-auto">
          <table className="w-full text-left text-[10.5px] border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold text-center">
                <th className="p-1.5 border-r border-slate-300 w-8">No</th>
                <th className="p-1.5 border-r border-slate-300 min-w-[110px]">품 &nbsp; 명</th>
                <th className="p-1.5 border-r border-slate-300 w-20">규 &nbsp; 격</th>
                <th className="p-1.5 border-r border-slate-300 w-12">수량</th>
                {summaryData.map((s) => (
                  <th key={`head-${s.supplier.id}`} className="p-1.5 border-r border-slate-300 text-right pr-2 min-w-[70px]">
                    {s.supplier.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {baseItems.map((it, itemIdx) => (
                <tr key={`item-${itemIdx}`} className="hover:bg-slate-50">
                  <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">{itemIdx + 1}</td>
                  <td className="p-1.5 border-r border-slate-200 font-sans font-semibold text-slate-900">{it.name || quote.title}</td>
                  <td className="p-1.5 border-r border-slate-200 font-sans text-center text-slate-600">{it.spec || '-'}</td>
                  <td className="p-1.5 border-r border-slate-200 text-center">{Number(it.quantity || 1).toLocaleString()}</td>
                  {summaryData.map((s) => {
                    const sItem = s.items[itemIdx];
                    const unitPrice = sItem ? sItem.unit_price : 0;
                    const isBase = s.supplier.id === 1;
                    return (
                      <td
                        key={`cell-${s.supplier.id}-${itemIdx}`}
                        className={`p-1.5 border-r border-slate-200 text-right pr-2 ${
                          isBase ? 'font-bold text-sky-900 bg-sky-50/40' : 'text-slate-800'
                        }`}
                      >
                        {Number(unitPrice).toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
