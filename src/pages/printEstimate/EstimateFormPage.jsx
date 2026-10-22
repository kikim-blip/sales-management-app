// src/pages/printEstimate/EstimateFormPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Save, Download, Plus, Trash2, ArrowLeft,
  TrendingUp, TrendingDown, Check,
  FileCheck2, ShoppingCart, Printer
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  getMasterPapers,
  saveEstimate,
  createEstimateVersion,
  exportEstimateDetailToExcel
} from '../../services/printEstimateStorage';
import { calculatePrepress } from '../../utils/printCalculators/prepressCalculator';
import { calculatePrint } from '../../utils/printCalculators/printCalculator';
import { calculateBinding } from '../../utils/printCalculators/bindingCalculator';
import { calculateFinishingItem } from '../../utils/printCalculators/finishingCalculator';
import { calculatePaperReam } from '../../utils/printCalculators/paperCalculator';
import EstimatePrintViewModal from './EstimatePrintViewModal';

export default function EstimateFormPage({ initialEstimate = null, onBack, onSaved }) {
  const { customers, addJobOrder, addSales } = useData();
  const { user } = useGoogleAuth();

  const [papers] = useState(() => getMasterPapers());

  // ─── 폼 기본 정보 ─────────────────────────────────────────────
  const [estimateNo, setEstimateNo] = useState(initialEstimate?.estimateNo || '');
  const [clientId, setClientId] = useState(initialEstimate?.clientId || '');
  const [clientName, setClientName] = useState(initialEstimate?.clientName || '');
  const [contactName, setContactName] = useState(initialEstimate?.contactName || '');
  const [phone, setPhone] = useState(initialEstimate?.phone || '');
  const [productName, setProductName] = useState(initialEstimate?.productName || '');
  const [projectName, setProjectName] = useState(initialEstimate?.projectName || '');
  const [quantity, setQuantity] = useState(initialEstimate?.quantity || 1000);
  const [unit, setUnit] = useState(initialEstimate?.unit || '부');

  // 판형 & 규격
  const [paperCut, setPaperCut] = useState(initialEstimate?.paperCut || '국16절');
  const [sizeWidth, setSizeWidth] = useState(initialEstimate?.sizeWidth || 182);
  const [sizeHeight, setSizeHeight] = useState(initialEstimate?.sizeHeight || 257);
  const [pages, setPages] = useState(initialEstimate?.pages || 32);
  const [colors, setColors] = useState(initialEstimate?.colors || '4도/4도 (양면 8도)');
  const [bindingType, setBindingType] = useState(initialEstimate?.bindingType || '무선제본');
  const [deliveryDate, setDeliveryDate] = useState(initialEstimate?.deliveryDate || '');
  const [notes, setNotes] = useState(initialEstimate?.notes || '');

  // ─── 6대 공정 세부 상태 ───────────────────────────────────────

  // 1. 제판 (CTP)
  const [prepressActive, setPrepressActive] = useState(true);
  const [ctpPlateCount, setCtpPlateCount] = useState(initialEstimate?.ctpPlateCount || 4); // 대수
  const [ctpColorCount, setCtpColorCount] = useState(initialEstimate?.ctpColorCount || 8); // 도수
  const [ctpUnitPrice, setCtpUnitPrice] = useState(initialEstimate?.ctpUnitPrice ?? 6500);

  // 2. 인쇄 (PRINT)
  const [printActive, setPrintActive] = useState(true);
  const [printColorCount, setPrintColorCount] = useState(initialEstimate?.printColorCount || 4);
  const [printUnitPrice, setPrintUnitPrice] = useState(initialEstimate?.printUnitPrice ?? 30000);
  const [wasteRate, setWasteRate] = useState(initialEstimate?.wasteRate || 10); // 손지율 %

  // 3. 제본 (BINDING)
  const [bindingActive, setBindingActive] = useState(true);
  const [coverPages, setCoverPages] = useState(initialEstimate?.coverPages || 4);
  const [bodyPages, setBodyPages] = useState(initialEstimate?.bodyPages || 28);
  const [bindingBaseFee, setBindingBaseFee] = useState(initialEstimate?.bindingBaseFee ?? 200000);
  const [bindingUnitPrice, setBindingUnitPrice] = useState(initialEstimate?.bindingUnitPrice || '');

  // 4. 후가공 (FINISHING)
  const [finishingActive, setFinishingActive] = useState(true);
  const [finishingItems, setFinishingItems] = useState(() => {
    if (initialEstimate?.finishingItems) return initialEstimate.finishingItems;
    return [
      { id: 'f1', type: '무광코팅_국전지', name: '표지 무광 라미네이팅', quantity: 2, unitPrice: 46000, baseFee: 0, enabled: true },
    ];
  });

  // 5. 용지대 (PAPER)
  const [paperActive, setPaperActive] = useState(true);
  const [selectedPaperId, setSelectedPaperId] = useState(initialEstimate?.selectedPaperId || papers[0]?.id || 'P01');
  const [paperReams, setPaperReams] = useState(initialEstimate?.paperReams || 0);
  const [paperUnitPrice, setPaperUnitPrice] = useState(initialEstimate?.paperUnitPrice ?? 57000);
  const [autoReam, setAutoReam] = useState(true);

  // 6. 기타 (OTHER)
  const [otherActive, setOtherActive] = useState(true);
  const [otherItems, setOtherItems] = useState(() => {
    if (initialEstimate?.otherItems) return initialEstimate.otherItems;
    return [
      { id: 'o1', name: '기획 디자인 및 편집비', amount: 150000, enabled: false },
      { id: 'o2', name: '물류 및 박스 배송비', amount: 50000, enabled: true },
    ];
  });

  // 모달 및 UI 상태
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ─── 거래처 선택 시 자동 입력 ──────────────────────────────────
  const handleSelectCustomer = (cId) => {
    setClientId(cId);
    const found = customers.find(c => String(c.id || c.code_number) === String(cId));
    if (found) {
      setClientName(found.name || found.client_name || '');
      setContactName(found.contact_name || found.representative || '');
      setPhone(found.phone || found.tel || '');
    }
  };

  // ─── 규격 변경 시 자동 크기 매칭 ────────────────────────────────
  const handleCutChange = (cut) => {
    setPaperCut(cut);
    if (cut === '국16절' || cut === 'A4') {
      setSizeWidth(210);
      setSizeHeight(297);
    } else if (cut === 'A5') {
      setSizeWidth(148);
      setSizeHeight(210);
    } else if (cut === '16절' || cut === 'B5') {
      setSizeWidth(182);
      setSizeHeight(257);
    } else if (cut === 'B6') {
      setSizeWidth(128);
      setSizeHeight(182);
    } else if (cut === '국8절') {
      setSizeWidth(297);
      setSizeHeight(420);
    }
  };

  // ─── 용지 변경 시 단가 자동 세팅 ───────────────────────────────
  const handlePaperChange = (pId) => {
    setSelectedPaperId(pId);
    const p = papers.find(x => x.id === pId);
    if (p) {
      setPaperUnitPrice(p.unitPrice);
    }
  };

  // ─── 6대 공정 실시간 연산 ─────────────────────────────────────

  // 1. 제판 CTP 계산
  const prepressResult = useMemo(() => {
    if (!prepressActive) return { amount: 0, stdAmount: 0, marginRate: 0, formula: '미적용' };
    return calculatePrepress({
      plateCount: ctpPlateCount,
      platePerForm: 1,
      colorCount: ctpColorCount,
      unitPrice: ctpUnitPrice,
    });
  }, [prepressActive, ctpPlateCount, ctpColorCount, ctpUnitPrice]);

  // 용지 연수 자동 산출
  const reamCalc = useMemo(() => {
    let cuts = 16;
    if (paperCut.includes('8절')) cuts = 8;
    else if (paperCut.includes('4절')) cuts = 4;
    else if (paperCut.includes('2절')) cuts = 2;
    else if (paperCut.includes('전지')) cuts = 1;
    else if (paperCut.includes('32절')) cuts = 32;

    return calculatePaperReam({
      quantity,
      pages,
      cutDivision: cuts,
      wasteRate,
    });
  }, [quantity, pages, paperCut, wasteRate]);

  const effectiveReams = autoReam ? reamCalc.totalReams : (Number(paperReams) || 1);

  // 2. 인쇄 계산
  const printResult = useMemo(() => {
    if (!printActive) return { amount: 0, stdAmount: 0, marginRate: 0, formula: '미적용' };
    return calculatePrint({
      reamCount: effectiveReams,
      colorCount: printColorCount,
      quantity,
      unitPrice: printUnitPrice,
      calcMode: 'ream',
    });
  }, [printActive, effectiveReams, printColorCount, quantity, printUnitPrice]);

  // 3. 제본 계산
  const bindingResult = useMemo(() => {
    if (!bindingActive) return { amount: 0, stdAmount: 0, marginRate: 0, formula: '미적용' };
    return calculateBinding({
      bindingType,
      coverPages,
      bodyPages,
      quantity,
      paperSize: paperCut,
      baseFee: bindingBaseFee,
      unitPrice: bindingUnitPrice ? Number(bindingUnitPrice) : null,
    });
  }, [bindingActive, bindingType, coverPages, bodyPages, quantity, paperCut, bindingBaseFee, bindingUnitPrice]);

  // 4. 후가공 계산
  const finishingResult = useMemo(() => {
    if (!finishingActive) return { amount: 0, items: [] };
    let total = 0;
    const list = finishingItems.filter(f => f.enabled).map(f => {
      const res = calculateFinishingItem(f);
      total += res.amount;
      return res;
    });
    return { amount: total, items: list };
  }, [finishingActive, finishingItems]);

  // 5. 용지대 계산
  const paperResult = useMemo(() => {
    if (!paperActive) return { amount: 0, formula: '미적용' };
    const p = papers.find(x => x.id === selectedPaperId) || papers[0];
    const amount = Math.round(effectiveReams * (Number(paperUnitPrice) || 50000));
    return {
      paperName: p?.name || '용지',
      weight: p?.weight || 100,
      sizeName: p?.sizeName || '국전지',
      reams: effectiveReams,
      unitPrice: paperUnitPrice,
      amount,
      formula: `${effectiveReams.toFixed(2)}R × ${(Number(paperUnitPrice) || 0).toLocaleString()}원`,
    };
  }, [paperActive, selectedPaperId, effectiveReams, paperUnitPrice, papers]);

  // 6. 기타 비용 계산
  const otherResult = useMemo(() => {
    if (!otherActive) return { amount: 0, items: [] };
    const activeOnes = otherItems.filter(o => o.enabled);
    const total = activeOnes.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    return { amount: total, items: activeOnes };
  }, [otherActive, otherItems]);

  // ─── 최종 견적 합계 및 마진 계산 ──────────────────────────────
  const subtotal = prepressResult.amount + printResult.amount + bindingResult.amount + finishingResult.amount + paperResult.amount + otherResult.amount;
  const vat = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + vat;
  const perBookPrice = quantity > 0 ? Math.round(totalAmount / quantity) : 0;

  // 표준 원가 대비 편차 분석
  const totalStdAmount = (prepressResult.stdAmount || 0) + (printResult.stdAmount || 0) + (bindingResult.stdAmount || 0) + paperResult.amount;
  const overallMarginRate = totalStdAmount > 0 ? Math.round(((subtotal - totalStdAmount) / totalStdAmount) * 100) : 0;

  // ─── 공정별 세부 항목 리스트 패키징 ───────────────────────────
  const compileEstimateItems = useCallback(() => {
    const items = [];
    if (prepressActive && prepressResult.amount > 0) {
      items.push({
        category: '제판(CTP)',
        name: 'CTP 인쇄판 출력',
        spec: `${ctpPlateCount}대 × ${ctpColorCount}도 (${prepressResult.totalPlates}판)`,
        quantity: prepressResult.totalPlates,
        unit: '판',
        unitPrice: ctpUnitPrice,
        amount: prepressResult.amount,
        formula: prepressResult.formula,
      });
    }
    if (printActive && printResult.amount > 0) {
      items.push({
        category: '인쇄(PRINT)',
        name: '매엽 옵셋 인쇄',
        spec: `${effectiveReams.toFixed(2)}R (${printColorCount}도)`,
        quantity: parseFloat(effectiveReams.toFixed(2)),
        unit: 'R',
        unitPrice: printUnitPrice,
        amount: printResult.amount,
        formula: printResult.formula,
      });
    }
    if (bindingActive && bindingResult.amount > 0) {
      items.push({
        category: '제본(BINDING)',
        name: bindingType,
        spec: `${paperCut} (${pages}면)`,
        quantity,
        unit: '부',
        unitPrice: bindingResult.unitPrice,
        amount: bindingResult.amount,
        formula: bindingResult.formula,
      });
    }
    if (finishingActive && finishingResult.items.length > 0) {
      finishingResult.items.forEach(f => {
        items.push({
          category: '후가공(FINISH)',
          name: f.name,
          spec: f.unit,
          quantity: f.quantity,
          unit: f.unit,
          unitPrice: f.unitPrice,
          amount: f.amount,
          formula: f.formula,
        });
      });
    }
    if (paperActive && paperResult.amount > 0) {
      items.push({
        category: '용지대(PAPER)',
        name: `${paperResult.paperName} ${paperResult.weight}g`,
        spec: `${paperResult.sizeName} (${effectiveReams.toFixed(2)}R)`,
        quantity: parseFloat(effectiveReams.toFixed(2)),
        unit: 'R',
        unitPrice: paperUnitPrice,
        amount: paperResult.amount,
        formula: paperResult.formula,
      });
    }
    if (otherActive && otherResult.items.length > 0) {
      otherResult.items.forEach(o => {
        items.push({
          category: '기타(OTHER)',
          name: o.name,
          spec: '실비',
          quantity: 1,
          unit: '식',
          unitPrice: o.amount,
          amount: o.amount,
          formula: '',
        });
      });
    }
    return items;
  }, [
    prepressActive, prepressResult, ctpPlateCount, ctpColorCount, ctpUnitPrice,
    printActive, printResult, effectiveReams, printColorCount, printUnitPrice,
    bindingActive, bindingResult, bindingType, paperCut, pages, quantity,
    finishingActive, finishingResult,
    paperActive, paperResult, paperUnitPrice,
    otherActive, otherResult
  ]);

  // ─── 저장 처리 (신규 / 수정 / 새 버전 분기) ───────────────────
  const handleSave = (isDraft = false) => {
    if (!productName.trim()) {
      alert('품명을 입력해주세요.');
      return;
    }

    const items = compileEstimateItems();
    const estimateData = {
      id: initialEstimate?.id,
      groupId: initialEstimate?.groupId,
      version: initialEstimate?.version || 1,
      estimateNo,
      clientId,
      clientName,
      contactName,
      phone,
      productName,
      projectName,
      quantity,
      unit,
      paperCut,
      sizeWidth,
      sizeHeight,
      pages,
      colors,
      bindingType,
      paperType: `${paperResult.paperName} ${paperResult.weight}g`,
      finishingOptions: finishingResult.items.map(f => f.name).join(', '),
      deliveryDate,
      notes,
      subtotal,
      vat,
      totalAmount,
      unitPrice: perBookPrice,
      status: isDraft ? '임시저장' : (initialEstimate?.status || '작성완료'),
      authorName: user?.userName || user?.name || '담당자',
      items,
      // 세부 상태 보존
      ctpPlateCount, ctpColorCount, ctpUnitPrice,
      printColorCount, printUnitPrice, wasteRate,
      coverPages, bodyPages, bindingBaseFee, bindingUnitPrice,
      finishingItems,
      selectedPaperId, paperReams, paperUnitPrice,
      otherItems,
    };

    let saved = null;
    if (saveAsNewVersion && initialEstimate?.id) {
      saved = createEstimateVersion(initialEstimate.id, estimateData);
      triggerToast(`${saved.version}차 견적으로 신규 저장되었습니다!`);
    } else {
      saved = saveEstimate(estimateData);
      triggerToast('견적서가 안전하게 저장되었습니다.');
    }

    if (onSaved) onSaved(saved);
  };

  // ─── ★ 작업전표(JobOrder) 즉시 등록 연계 ───────────────────────
  const handleConvertToJobOrder = async () => {
    if (!productName.trim()) {
      alert('품명을 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`[${productName}] 견적 내용을 기반으로 작업전표를 자동 생성하시겠습니까?`)) {
      return;
    }

    const newJob = {
      order_date: new Date().toISOString().slice(0, 10),
      delivery_date: deliveryDate || new Date().toISOString().slice(0, 10),
      client_name: clientName || '일반거래처',
      client_id: clientId || '',
      contact_name: contactName || '',
      phone: phone || '',
      product_name: productName,
      quantity,
      unit,
      size_spec: `${paperCut} (${sizeWidth}×${sizeHeight}mm)`,
      pages,
      color_spec: colors,
      binding_type: bindingType,
      paper_spec: `${paperResult.paperName} ${paperResult.weight}g`,
      post_process: finishingResult.items.map(f => f.name).join(', '),
      order_price: totalAmount,
      special_notes: `[인쇄견적서 ${estimateNo || 'EST'} 연계]\n부당단가: ${perBookPrice.toLocaleString()}원\n${notes || ''}`,
      status: '접수완료',
      author: user?.userName || user?.name || '영업담당',
    };

    try {
      if (addJobOrder) {
        await addJobOrder(newJob);
        alert('★ 작업전표가 성공적으로 등록되었습니다!\n작업전표 메뉴에서 상세 일정을 확인하실 수 있습니다.');
      } else {
        alert('작업전표 등록 기능이 연결되었습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('작업전표 등록 중 오류가 발생했습니다: ' + e.message);
    }
  };

  // ─── ★ 매출(Sales) 즉시 등록 연계 ─────────────────────────────
  const handleConvertToSale = async () => {
    if (!productName.trim()) {
      alert('품명을 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`[${productName}] 합계 ₩${totalAmount.toLocaleString()}원을 매출관리 DB에 즉시 등록하시겠습니까?`)) {
      return;
    }

    const newSale = {
      date: new Date().toISOString().slice(0, 10),
      client_name: clientName || '일반거래처',
      client_id: clientId || '',
      product_name: productName,
      spec: `${paperCut} ${pages}p ${bindingType}`,
      quantity,
      unit_price: perBookPrice,
      supply_amount: subtotal,
      vat,
      total_amount: totalAmount,
      contact_person: contactName || '',
      manager: user?.userName || user?.name || '영업담당',
      status: '미수',
      remarks: `[인쇄견적서 ${estimateNo || 'EST'} 연계]`,
    };

    try {
      if (addSales) {
        await addSales(newSale);
        alert('★ 매출이 성공적으로 등록되었습니다!\n매출관리 메뉴에서 확인하실 수 있습니다.');
      } else {
        alert('매출 등록 기능이 연결되었습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('매출 등록 중 오류가 발생했습니다: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 상단 네비게이션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="목록으로 이동"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-800">
                {initialEstimate ? '인쇄 견적서 수정 / 상세' : '새 인쇄 견적서 작성'}
              </h2>
              {initialEstimate?.version && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-700">
                  {initialEstimate.version}차 견적
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              6대 인쇄 공정(CTP/인쇄/제본/후가공/용지/기타) 표준 단가 기반 실시간 원가 산출
            </p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEstimateDetailToExcel({
              estimateNo, clientName, contactName, productName, quantity, unit,
              sizeWidth, sizeHeight, paperCut, pages, colors, bindingType,
              paperType: `${paperResult.paperName} ${paperResult.weight}g`,
              subtotal, vat, totalAmount, unitPrice: perBookPrice,
              items: compileEstimateItems(), notes
            })}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>A4 인쇄</span>
          </button>

          <button
            type="button"
            onClick={handleConvertToJobOrder}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
            title="견적 내용을 작업전표로 바로 보내기"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>작업전표 등록</span>
          </button>

          <button
            type="button"
            onClick={handleConvertToSale}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition shadow-sm"
            title="견적 내용을 매출로 즉시 등록"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>매출 등록</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>견적서 저장</span>
          </button>
        </div>
      </div>

      {/* ── 1. 기본 인쇄물 정보 입력 카드 ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>기본 정보 및 인쇄 규격</span>
          </span>

          {initialEstimate && (
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsNewVersion}
                onChange={e => setSaveAsNewVersion(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sky-700">새 버전({(initialEstimate.version || 1) + 1}차)으로 신규 생성</span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* 거래처 선택 (기존 고객 DB 자동 연계) */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              거래처 선택 <span className="text-rose-500">*</span>
            </label>
            <div className="flex space-x-2">
              <select
                value={clientId}
                onChange={e => handleSelectCustomer(e.target.value)}
                className="w-1/2 text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500 font-medium"
              >
                <option value="">-- 등록 거래처 선택 --</option>
                {customers.map(c => (
                  <option key={c.id || c.code_number} value={c.id || c.code_number}>
                    {c.name || c.client_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-1/2 text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                placeholder="또는 직접 거래처명 입력"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">담당자명</label>
            <input
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              placeholder="예: 홍길동 주무관"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">연락처</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              placeholder="010-0000-0000"
            />
          </div>

          {/* 품명 & 프로젝트 */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              품명 (인쇄물 제목) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
              placeholder="예: 2026년도 상반기 정책 홍보 브로슈어"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">제작 부수 (수량)</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value) || 0)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-black text-sky-700 text-right"
                placeholder="1000"
                required
              />
              <span className="text-xs font-bold text-slate-500">{unit}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">납기 희망일</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white text-slate-700"
            />
          </div>

          {/* 규격 & 판형 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">판형 (절수)</label>
            <select
              value={paperCut}
              onChange={e => handleCutChange(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
            >
              <option value="국16절">국16절 (A4)</option>
              <option value="A5">국32절 (A5)</option>
              <option value="16절">4×6 16절 (B5)</option>
              <option value="B6">4×6 32절 (B6)</option>
              <option value="국8절">국8절 (A3)</option>
              <option value="8절">4×6 8절</option>
              <option value="기타/변형">기타 변형 판형</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">재단 규격 (가로×세로 mm)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={sizeWidth}
                onChange={e => setSizeWidth(Number(e.target.value) || 0)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white text-center font-medium"
              />
              <span className="text-xs text-slate-400">×</span>
              <input
                type="number"
                value={sizeHeight}
                onChange={e => setSizeHeight(Number(e.target.value) || 0)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white text-center font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">총 페이지 수 (면수)</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={pages}
                onChange={e => {
                  const p = Number(e.target.value) || 0;
                  setPages(p);
                  setBodyPages(Math.max(0, p - coverPages));
                }}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-right"
              />
              <span className="text-xs text-slate-500">p</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">인쇄 색도</label>
            <select
              value={colors}
              onChange={e => setColors(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="4도/4도 (양면 8도)">4도/4도 (양면 올컬러 8도)</option>
              <option value="4도/0도 (단면 4도)">4도/0도 (단면 컬러 4도)</option>
              <option value="1도/1도 (양면 2도)">1도/1도 (양면 먹1도)</option>
              <option value="1도/0도 (단면 1도)">1도/0도 (단면 먹1도)</option>
              <option value="4도/1도 (별색/단면혼합)">4도/1도 (혼합)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 2. 6대 공정 인터랙티브 계산 섹션 ── */}
      <div className="space-y-4">
        {/* 공정 1: 기획 / CTP 제판 */}
        <div className={`rounded-2xl border transition ${prepressActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prepressActive}
                onChange={e => setPrepressActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">1. 기획 및 CTP 제판 (PREPRESS)</span>
            </label>
            <span className="text-xs font-black text-sky-700">
              ₩ {prepressResult.amount.toLocaleString()} 원
            </span>
          </div>

          {prepressActive && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">인쇄 대수 (대)</label>
                <input
                  type="number"
                  value={ctpPlateCount}
                  onChange={e => setCtpPlateCount(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">판수 / 색도 (도)</label>
                <input
                  type="number"
                  value={ctpColorCount}
                  onChange={e => setCtpColorCount(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">판당 단가 (원)</label>
                <input
                  type="number"
                  value={ctpUnitPrice}
                  onChange={e => setCtpUnitPrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-sky-700"
                />
              </div>
              <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500">산출식 / 총 판수</span>
                <span className="font-bold text-slate-800 text-[11px]">{prepressResult.formula} ({prepressResult.totalPlates}판)</span>
              </div>
            </div>
          )}
        </div>

        {/* 공정 2: 인쇄 (PRINT) */}
        <div className={`rounded-2xl border transition ${printActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printActive}
                onChange={e => setPrintActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">2. 매엽 오프셋 인쇄비 (PRINT)</span>
            </label>
            <span className="text-xs font-black text-sky-700">
              ₩ {printResult.amount.toLocaleString()} 원
            </span>
          </div>

          {printActive && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  인쇄 연수 (R) {autoReam ? '(자동산출)' : '(수기입력)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={effectiveReams}
                  disabled={autoReam}
                  onChange={e => setPaperReams(Number(e.target.value))}
                  className={`w-full p-2 border rounded-lg font-bold ${autoReam ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">인쇄 색도 (1~8도)</label>
                <input
                  type="number"
                  value={printColorCount}
                  onChange={e => setPrintColorCount(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">연당 단가 (원)</label>
                <input
                  type="number"
                  value={printUnitPrice}
                  onChange={e => setPrintUnitPrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-sky-700"
                />
              </div>
              <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500">손지율 / 산출식</span>
                <span className="font-bold text-slate-800 text-[11px]">{printResult.wasteRate}% / {printResult.formula}</span>
              </div>
            </div>
          )}
        </div>

        {/* 공정 3: 제본 (BINDING) */}
        <div className={`rounded-2xl border transition ${bindingActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bindingActive}
                onChange={e => setBindingActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">3. 제본비 (BINDING)</span>
            </label>
            <span className="text-xs font-black text-sky-700">
              ₩ {bindingResult.amount.toLocaleString()} 원
            </span>
          </div>

          {bindingActive && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">제본 방식</label>
                <select
                  value={bindingType}
                  onChange={e => setBindingType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                >
                  <option value="무선제본">무선제본 (일반)</option>
                  <option value="무선날개제본">무선 날개 제본</option>
                  <option value="중철제본">중철제본</option>
                  <option value="환양장제본">환양장 (하드커버)</option>
                  <option value="스프링제본">트윈 와이어 스프링</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">표지/본문 면수</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={coverPages}
                    onChange={e => setCoverPages(Number(e.target.value) || 0)}
                    className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white text-center"
                    placeholder="표지 4p"
                  />
                  <span className="text-slate-400">+</span>
                  <input
                    type="number"
                    value={bodyPages}
                    onChange={e => setBodyPages(Number(e.target.value) || 0)}
                    className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white text-center"
                    placeholder="본문"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">제본 기본료 (원)</label>
                <input
                  type="number"
                  value={bindingBaseFee}
                  onChange={e => setBindingBaseFee(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-700"
                />
              </div>
              <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500">부당 제본단가</span>
                <span className="font-bold text-sky-700 text-[11px]">부당 {bindingResult.unitPrice?.toLocaleString()}원</span>
              </div>
            </div>
          )}
        </div>

        {/* 공정 4: 후가공 (FINISHING) */}
        <div className={`rounded-2xl border transition ${finishingActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={finishingActive}
                onChange={e => setFinishingActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">4. 후가공 (FINISHING)</span>
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setFinishingItems([...finishingItems, {
                  id: `f_${Date.now()}`,
                  type: '박_기본료',
                  name: '금박/은박 가공',
                  quantity: 1,
                  unitPrice: 100000,
                  baseFee: 0,
                  enabled: true
                }])}
                className="flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>후가공 추가</span>
              </button>
              <span className="text-xs font-black text-sky-700">
                ₩ {finishingResult.amount.toLocaleString()} 원
              </span>
            </div>
          </div>

          {finishingActive && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {finishingItems.map((item, idx) => (
                <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={e => {
                      const next = [...finishingItems];
                      next[idx].enabled = e.target.checked;
                      setFinishingItems(next);
                    }}
                    className="rounded text-sky-600"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => {
                      const next = [...finishingItems];
                      next[idx].name = e.target.value;
                      setFinishingItems(next);
                    }}
                    className="flex-1 p-1.5 border border-slate-300 rounded bg-white font-medium"
                    placeholder="후가공 항목명"
                  />
                  <div className="flex items-center space-x-1 w-24">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const next = [...finishingItems];
                        next[idx].quantity = Number(e.target.value) || 0;
                        setFinishingItems(next);
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-right"
                      placeholder="수량"
                    />
                  </div>
                  <div className="flex items-center space-x-1 w-28">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => {
                        const next = [...finishingItems];
                        next[idx].unitPrice = Number(e.target.value) || 0;
                        setFinishingItems(next);
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white font-bold text-sky-700 text-right"
                      placeholder="단가"
                    />
                    <span className="text-[10px] text-slate-400">원</span>
                  </div>
                  <div className="w-24 text-right font-black text-slate-800">
                    {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}원
                  </div>
                  <button
                    type="button"
                    onClick={() => setFinishingItems(finishingItems.filter(f => f.id !== item.id))}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 공정 5: 용지대 (PAPER) */}
        <div className={`rounded-2xl border transition ${paperActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paperActive}
                onChange={e => setPaperActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">5. 용지대 (PAPER)</span>
            </label>
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-500 flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReam}
                  onChange={e => setAutoReam(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>부수/페이지 기반 연수(R) 자동계산</span>
              </label>
              <span className="text-xs font-black text-sky-700">
                ₩ {paperResult.amount.toLocaleString()} 원
              </span>
            </div>
          </div>

          {paperActive && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">지종 및 규격 선택</label>
                <select
                  value={selectedPaperId}
                  onChange={e => handlePaperChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.weight}g ({p.sizeName}) - {(p.unitPrice || 0).toLocaleString()}원/R
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">소요 연수 (손지포함)</label>
                <input
                  type="number"
                  step="0.01"
                  value={effectiveReams}
                  disabled={autoReam}
                  onChange={e => setPaperReams(Number(e.target.value))}
                  className={`w-full p-2 border rounded-lg font-black ${autoReam ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-900'}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">연당 단가 (원/R)</label>
                <input
                  type="number"
                  value={paperUnitPrice}
                  onChange={e => setPaperUnitPrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-sky-700"
                />
              </div>
              <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500">정미연수 / 손지연수</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  정미 {reamCalc.netReams}R + 손지 {reamCalc.wasteReams}R
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 공정 6: 기타 (OTHER) */}
        <div className={`rounded-2xl border transition ${otherActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'} p-5 shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={otherActive}
                onChange={e => setOtherActive(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="text-sm font-black text-slate-800">6. 기타 비용 (디자인/조판/물류)</span>
            </label>
            <span className="text-xs font-black text-sky-700">
              ₩ {otherResult.amount.toLocaleString()} 원
            </span>
          </div>

          {otherActive && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
              {otherItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={e => {
                        const next = [...otherItems];
                        next[idx].enabled = e.target.checked;
                        setOtherItems(next);
                      }}
                      className="rounded text-sky-600"
                    />
                    <span className="font-bold text-slate-700">{item.name}</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={e => {
                        const next = [...otherItems];
                        next[idx].amount = Number(e.target.value) || 0;
                        setOtherItems(next);
                      }}
                      className="w-28 p-1.5 border border-slate-300 rounded bg-white font-bold text-sky-700 text-right"
                    />
                    <span className="text-slate-400">원</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 비고란 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-700 block">견적서 특이사항 및 비고 메모</label>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500"
          placeholder="견적 조건, 유효기간, 납기 특약 등 견적서 하단에 출력될 내용을 입력합니다."
        />
      </div>

      {/* ── 하단 고정 종합 견적 및 마진 요약 바 ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* 금액 요약 */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">공급가액</span>
              <span className="text-sm font-bold text-slate-800">
                ₩ {subtotal.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-medium">부가세 (10%)</span>
              <span className="text-sm font-bold text-slate-600">
                ₩ {vat.toLocaleString()}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">부당 단가</span>
              <span className="text-base font-black text-sky-600">
                {perBookPrice.toLocaleString()} <span className="text-xs font-bold text-slate-500">원/{unit}</span>
              </span>
            </div>

            <div className="pl-3 border-l border-slate-200">
              <span className="text-[11px] text-slate-500 block font-bold text-sky-800">최종 견적합계 (VAT포함)</span>
              <span className="text-xl sm:text-2xl font-black text-sky-700">
                ₩ {totalAmount.toLocaleString()}
              </span>
            </div>

            {/* 마진율 분석 뱃지 */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">표준가 대비:</span>
              <span className={`text-xs font-black flex items-center ${overallMarginRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {overallMarginRate >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {overallMarginRate >= 0 ? `+${overallMarginRate}%` : `${overallMarginRate}%`}
              </span>
            </div>
          </div>

          {/* 저장 및 액션 버튼 */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-black rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>견적서 확정 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* 견적서 인쇄 모달 */}
      {showPrintModal && (
        <EstimatePrintViewModal
          estimate={{
            estimateNo: estimateNo || 'EST-DRAFT',
            version: initialEstimate?.version || 1,
            isFinal: initialEstimate?.isFinal || false,
            clientName,
            contactName,
            phone,
            productName,
            quantity,
            unit,
            paperCut,
            sizeWidth,
            sizeHeight,
            pages,
            colors,
            bindingType,
            paperType: `${paperResult.paperName} ${paperResult.weight}g`,
            finishingOptions: finishingResult.items.map(f => f.name).join(', '),
            subtotal,
            vat,
            totalAmount,
            unitPrice: perBookPrice,
            notes,
            items: compileEstimateItems(),
            authorName: user?.userName || user?.name || '영업담당',
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
