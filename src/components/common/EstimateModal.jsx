// src/components/common/EstimateModal.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Calculator, Printer, Save, FileText, CheckCircle2, DollarSign } from 'lucide-react';

export default function EstimateModal({ sale, customer, onClose, onSave, onPrint }) {
  if (!sale) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 기존에 저장된 estimate_items가 있으면 파싱하거나 기본 1개 행 생성
  const getInitialItems = () => {
    if (Array.isArray(sale.estimate_items) && sale.estimate_items.length > 0) {
      return sale.estimate_items;
    }
    if (typeof sale.estimate_items === 'string' && sale.estimate_items.startsWith('[')) {
      try {
        const parsed = JSON.parse(sale.estimate_items);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    // 기본 초기 행 (기존 작업명 및 공급가액 반영)
    return [
      {
        id: 'item-1',
        name: sale.title || '작업 품목',
        spec: sale.spec || '',
        quantity: 1,
        unit: '식',
        unit_price: Number(sale.supply_price) || 0,
        amount: Number(sale.supply_price) || 0,
        note: sale.content || '',
      }
    ];
  };

  const [items, setItems] = useState(getInitialItems());
  const [includeVat, setIncludeVat] = useState(true);
  const [estimateDate, setEstimateDate] = useState(sale.estimate_date || sale.reg_date || todayStr);
  const [validDays, setValidDays] = useState(sale.valid_days || '견적 후 30일간');
  const [paymentTerms, setPaymentTerms] = useState(sale.payment_terms || '납품 후 100% 현금/계좌이체');
  const [estimateNote, setEstimateNote] = useState(sale.estimate_note || sale.content || '');
  const [saving, setSaving] = useState(false);

  // 품목 항목 수정
  const handleItemChange = (index, field, value) => {
    const nextItems = [...items];
    const item = { ...nextItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(field === 'quantity' ? value : item.quantity) || 0;
      const p = Number(field === 'unit_price' ? value : item.unit_price) || 0;
      item.amount = q * p;
    }

    nextItems[index] = item;
    setItems(nextItems);
  };

  // 품목 행 추가
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        spec: '',
        quantity: 1,
        unit: '부',
        unit_price: 0,
        amount: 0,
        note: '',
      }
    ]);
  };

  // 품목 행 삭제
  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      alert('최소 1개 이상의 품목이 필요합니다.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // 합계 계산
  const totalSupplyPrice = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalTax = includeVat ? Math.round(totalSupplyPrice * 0.1) : 0;
  const totalPrice = totalSupplyPrice + totalTax;

  // 견적서 저장 및 매출액 반영
  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedPayload = {
        ...sale,
        supply_price: totalSupplyPrice,
        tax: totalTax,
        total_price: totalPrice,
        estimate_date: estimateDate,
        valid_days: validDays,
        payment_terms: paymentTerms,
        estimate_note: estimateNote,
        estimate_items: JSON.stringify(items),
      };

      if (onSave) {
        await onSave(updatedPayload);
      }
      onClose();
    } catch (err) {
      alert('견적서 저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const custName = customer ? customer.name : (sale.customer_name || sale.customer_id || '고객사 미지정');
  const custDept = customer ? customer.dept : (sale.dept || '');
  const contactPerson = customer ? customer.contact_person : (sale.contact_person || '');
  const contactPhone = customer ? customer.phone : (sale.phone || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black border border-sky-400/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <span>견적서 작성 및 단가 산출</span>
                <span className="text-xs font-mono font-bold bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
                  {sale.code_number || sale.id}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                품목별 수량과 단가를 입력하면 매출액(공급가/VAT)이 자동 계산 및 즉시 반영됩니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 영역 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* 1. 견적 기본 정보 요약 박스 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">수신 거래처</span>
              <strong className="text-slate-800 text-sm">{custName} {custDept ? `(${custDept})` : ''}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">고객 담당자</span>
              <strong className="text-slate-800">{contactPerson || '미지정'} {contactPhone ? `(${contactPhone})` : ''}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">작업명 (견적명)</span>
              <strong className="text-slate-800">{sale.title || '작업명 미지정'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">영업담당자</span>
              <strong className="text-rose-600 font-bold">{sale.sales_manager || sale.manager_name || '김광일'}</strong>
            </div>
          </div>

          {/* 2. 견적서 설정 (견적일자, 유효기간, 부가세 설정) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">견적 발행일자</label>
              <input
                type="date"
                value={estimateDate}
                onChange={e => setEstimateDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">견적 유효기간</label>
              <input
                type="text"
                placeholder="예: 견적 후 30일간"
                value={validDays}
                onChange={e => setValidDays(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">결제 조건</label>
              <input
                type="text"
                placeholder="예: 납품 후 현금/계좌이체"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* 3. 품목별 단가 산출 테이블 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-1.5">
                <span>📋 견적 세부 품목 명세서</span>
                <span className="text-xs font-normal text-slate-400">({items.length}개 품목)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold hover:bg-sky-100 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 품목 추가</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5 min-w-[150px]">품목 / 작업명 *</th>
                    <th className="p-2.5 min-w-[120px]">규격 / 사양</th>
                    <th className="p-2.5 w-20 text-center">수량</th>
                    <th className="p-2.5 w-16 text-center">단위</th>
                    <th className="p-2.5 w-28 text-right">단가 (원)</th>
                    <th className="p-2.5 w-32 text-right">공급가액 (원)</th>
                    <th className="p-2.5 min-w-[100px]">비고</th>
                    <th className="p-2.5 w-10 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                      <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          required
                          placeholder="품목명 입력"
                          value={item.name}
                          onChange={e => handleItemChange(index, 'name', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:border-sky-500"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="규격/사양"
                          value={item.spec}
                          onChange={e => handleItemChange(index, 'spec', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-right font-semibold"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        ₩ {(Number(item.amount) || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          placeholder="비고"
                          value={item.note}
                          onChange={e => handleItemChange(index, 'note', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="text-slate-300 hover:text-rose-600 transition"
                          title="품목 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 견적 합계 및 세액 계산 요약 바 */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">부가가치세 (VAT 10%):</span>
                <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={e => setIncludeVat(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-slate-200">10% 과세 적용</span>
                </label>
              </div>

              <div className="flex items-center space-x-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 mr-2">공급가액 합계:</span>
                  <strong className="text-white font-mono text-sm">₩ {totalSupplyPrice.toLocaleString()} 원</strong>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">세액 (10%):</span>
                  <strong className="text-sky-300 font-mono text-sm">₩ {totalTax.toLocaleString()} 원</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>최종 총 견적금액 (VAT 포함)</span>
              </span>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  ₩ {totalPrice.toLocaleString()} 원
                </span>
              </div>
            </div>
          </div>

          {/* 5. 견적 특이사항 / 비고 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">견적서 비고 및 요청 특이사항</label>
            <textarea
              rows={2}
              placeholder="예: 2도 인쇄 기준 단가이며, 시안 확정 후 3일 이내 납품 조건입니다."
              value={estimateNote}
              onChange={e => setEstimateNote(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
            />
          </div>

        </div>

        {/* 모달 하단 액션 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            {onPrint && (
              <button
                type="button"
                onClick={() => {
                  const updatedPayload = {
                    ...sale,
                    supply_price: totalSupplyPrice,
                    tax: totalTax,
                    total_price: totalPrice,
                    estimate_date: estimateDate,
                    estimate_note: estimateNote,
                    estimate_items: items,
                  };
                  onPrint(updatedPayload, customer);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Printer className="w-4 h-4" />
                <span>인쇄 / 엑셀 미리보기</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200/70 transition"
            >
              취소
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '저장 중...' : '견적서 저장 및 매출액 즉시 반영'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
