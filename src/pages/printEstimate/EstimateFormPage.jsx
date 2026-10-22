// src/pages/printEstimate/EstimateFormPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Save, Download, ArrowLeft, Check,
  FileCheck2, ShoppingCart, Printer, Search, X,
  ShieldCheck, Building2, Calculator, Info, FileText
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  getMasterPapers,
  saveEstimate,
  createEstimateVersion,
  exportEstimateDetailToExcel
} from '../../services/printEstimateStorage';
import { calculateFullCost } from '../../utils/printCalculators/multiPartCalculator';
import { calculateGovernmentCost, GOVERNMENT_STD_RATES } from '../../utils/printCalculators/governmentCostCalculator';
import EstimatePrintViewModal from './EstimatePrintViewModal';
import GovernmentCostModal from './GovernmentCostModal';

export default function EstimateFormPage({ initialEstimate = null, onBack, onSaved }) {
  const { customers, contacts, addJobOrder, addSales } = useData();
  const { user } = useGoogleAuth();
  const [papers] = useState(() => getMasterPapers());

  // ── 0. 계산 모드 분리 ('COMMERCIAL' 사기업 실무 vs 'GOVERNMENT' 조달·교육청 표준원가) ──
  const [costingMode, setCostingMode] = useState(initialEstimate?.costingMode || 'COMMERCIAL');

  // 조달·공공 표준 원가 법정 가산율
  const [manageRate, setManageRate] = useState(initialEstimate?.manageRate ?? GOVERNMENT_STD_RATES.defaultManageRate); // 기본 5%
  const [profitRate, setProfitRate] = useState(initialEstimate?.profitRate ?? GOVERNMENT_STD_RATES.defaultProfitRate); // 기본 10%
  const [contractRate, setContractRate] = useState(initialEstimate?.contractRate ?? GOVERNMENT_STD_RATES.defaultContractRate); // 기본 88%
  const [showGovPrintModal, setShowGovPrintModal] = useState(false);

  // ── 1. 기본 선택 정보 ──
  const [estimateNo] = useState(initialEstimate?.estimateNo || '');
  const [regDate, setRegDate] = useState(initialEstimate?.regDate || new Date().toISOString().slice(0, 10));

  const [proofDate, setProofDate] = useState(initialEstimate?.proofDate || '');
  const [deliveryDate, setDeliveryDate] = useState(initialEstimate?.deliveryDate || '');
  const [writerTitle, setWriterTitle] = useState(initialEstimate?.writerTitle || '담당자');
  const [writerName, setWriterName] = useState(initialEstimate?.writerName || user?.userName || user?.name || '김광일');
  const [productName, setProductName] = useState(initialEstimate?.productName || '');
  const [clientId, setClientId] = useState(initialEstimate?.clientId || '');
  const [clientName, setClientName] = useState(initialEstimate?.clientName || '');
  const [clientDept, setClientDept] = useState(initialEstimate?.clientDept || '');
  const [contactName, setContactName] = useState(initialEstimate?.contactName || '');
  const [phone, setPhone] = useState(initialEstimate?.phone || '');

  // 거래처 실시간 검색창 상태
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // ── 2. 규격 선택 정보 ──
  const [printType, setPrintType] = useState(initialEstimate?.printType || '옵셋인쇄'); // 옵셋인쇄 | 경인쇄 | 시험지인쇄 | 디지털인쇄
  const [printCategory, setPrintCategory] = useState(initialEstimate?.printCategory || '책자'); // 책자 | 화보집 | 리플렛 | 포스터 | 전단
  const [quantity, setQuantity] = useState(initialEstimate?.quantity || 1000);
  const [paperCut, setPaperCut] = useState(initialEstimate?.paperCut || '국배판(A4)');
  const [bindingType, setBindingType] = useState(initialEstimate?.bindingType || '무사무선'); // 무사무선 | 중철 | 양장 | 스프링 | 좌철
  const [bindingDirection, setBindingDirection] = useState(initialEstimate?.bindingDirection || '좌철');

  // 옵션 선택 체크박스
  const [hasCoating, setHasCoating] = useState(initialEstimate?.hasCoating ?? true);
  const [coatingType, setCoatingType] = useState(initialEstimate?.coatingType || '무광코팅');
  const [hasCoverSpecial, setHasCoverSpecial] = useState(initialEstimate?.hasCoverSpecial || false);
  const [hasSupplement, setHasSupplement] = useState(initialEstimate?.hasSupplement || false);
  const [hasAddBody, setHasAddBody] = useState(initialEstimate?.hasAddBody || false);
  const [isProcessGuide, setIsProcessGuide] = useState(initialEstimate?.isProcessGuide || false);
  const [isPrimaryPrint, setIsPrimaryPrint] = useState(initialEstimate?.isPrimaryPrint || false);
  const [isSpotColor, setIsSpotColor] = useState(initialEstimate?.isSpotColor || false);
  const [isBetaPrint, setIsBetaPrint] = useState(initialEstimate?.isBetaPrint || false);
  const [hasFoil, setHasFoil] = useState(initialEstimate?.hasFoil || false);
  const [hasDiecut, setHasDiecut] = useState(initialEstimate?.hasDiecut || false);

  // ── 3. 표지 선택정보 ──
  const [coverPaperName, setCoverPaperName] = useState(initialEstimate?.coverPaperName || '아트지');
  const [coverWeight, setCoverWeight] = useState(initialEstimate?.coverWeight || 200);
  const [coverUnitPrice, setCoverUnitPrice] = useState(initialEstimate?.coverUnitPrice || 94000);
  const [coverPages, setCoverPages] = useState(initialEstimate?.coverPages ?? 4);
  const [coverColor, setCoverColor] = useState(initialEstimate?.coverColor || '4도');
  const [coverSide, setCoverSide] = useState(initialEstimate?.coverSide || '단면'); // 단면 | 양면
  const [coverTypesetPages, setCoverTypesetPages] = useState(initialEstimate?.coverTypesetPages ?? 1);
  const [coverBlankPages, setCoverBlankPages] = useState(initialEstimate?.coverBlankPages ?? 0);
  const [coverTypesetRate, setCoverTypesetRate] = useState(initialEstimate?.coverTypesetRate ?? 0);

  // ── 4. 본문 선택정보 ──
  const [bodyPaperName, setBodyPaperName] = useState(initialEstimate?.bodyPaperName || '백상지');
  const [bodyWeight, setBodyWeight] = useState(initialEstimate?.bodyWeight || 80);
  const [bodyUnitPrice, setBodyUnitPrice] = useState(initialEstimate?.bodyUnitPrice || 46136);
  const [bodyPages, setBodyPages] = useState(initialEstimate?.bodyPages ?? 64);
  const [bodyColor, setBodyColor] = useState(initialEstimate?.bodyColor || '1도');
  const [bodySide, setBodySide] = useState(initialEstimate?.bodySide || '양면'); // 양면 | 단면
  const [bodyTypesetPages, setBodyTypesetPages] = useState(initialEstimate?.bodyTypesetPages ?? 0);
  const [bodyBlankPages, setBodyBlankPages] = useState(initialEstimate?.bodyBlankPages ?? 0);
  const [bodyTypesetRate, setBodyTypesetRate] = useState(initialEstimate?.bodyTypesetRate ?? 0);

  // ── 5. 화보/부속 선택정보 (화보사용 옵션 시 활성화) ──
  const [suppPaperName, setSuppPaperName] = useState(initialEstimate?.suppPaperName || '스노우지');
  const [suppWeight, setSuppWeight] = useState(initialEstimate?.suppWeight || 120);
  const [suppUnitPrice, setSuppUnitPrice] = useState(initialEstimate?.suppUnitPrice || 57000);
  const [suppPages, setSuppPages] = useState(initialEstimate?.suppPages ?? 8);
  const [suppColor, setSuppColor] = useState(initialEstimate?.suppColor || '4도');
  const [suppSide, setSuppSide] = useState(initialEstimate?.suppSide || '양면');

  // ── 6. 기타 선택정보 ──
  const [discountOrAdd, setDiscountOrAdd] = useState(initialEstimate?.discountOrAdd || 0);
  const [discountReason, setDiscountReason] = useState(initialEstimate?.discountReason || '');
  const [deliveryCost, setDeliveryCost] = useState(initialEstimate?.deliveryCost ?? 50000);
  const [packagingCost, setPackagingCost] = useState(initialEstimate?.packagingCost ?? 20000);
  const [notes, setNotes] = useState(initialEstimate?.notes || '');

  // UI 상태
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ── 거래처 실시간 검색 결과 (고객사명, 과/부서명, 담당자명, 연락처 통합 매칭) ──
  const customerSearchResults = useMemo(() => {
    if (!customerSearchInput.trim()) return [];
    const q = customerSearchInput.trim().toLowerCase();
    const results = [];

    (customers || []).forEach(c => {
      const custContacts = (contacts || []).filter(ct => String(ct.customer_id) === String(c.id));
      const cMatch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.dept || '').toLowerCase().includes(q) ||
        (c.sales_manager || '').toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.mobile || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q);

      if (cMatch) {
        if (custContacts.length === 0) {
          results.push({ ...c });
        } else {
          custContacts.forEach(ct => {
            results.push({
              ...c,
              dept: ct.dept || c.dept,
              contact_person: ct.name || c.contact_person,
              phone: ct.phone || ct.mobile || c.phone,
              email: ct.email || c.email,
              contact_id: ct.id,
            });
          });
        }
      } else {
        const matchedContacts = custContacts.filter(ct =>
          (ct.name || '').toLowerCase().includes(q) ||
          (ct.dept || '').toLowerCase().includes(q) ||
          (ct.phone || '').includes(q) ||
          (ct.mobile || '').includes(q) ||
          (ct.email || '').toLowerCase().includes(q)
        );
        matchedContacts.forEach(ct => {
          results.push({
            ...c,
            dept: ct.dept || c.dept,
            contact_person: ct.name,
            phone: ct.phone || ct.mobile || c.phone,
            email: ct.email || c.email,
            contact_id: ct.id,
          });
        });
      }
    });

    return results.slice(0, 30);
  }, [customerSearchInput, customers, contacts]);

  const handleSelectSearchResult = (c) => {
    setClientId(c.id || c.code_number || '');
    setClientName(c.name || '');
    setClientDept(c.dept || '');
    setContactName(c.contact_person || '');
    setPhone(c.phone || c.mobile || '');
    setCustomerSearchInput('');
    setShowCustomerDropdown(false);
  };

  // ── 표지 지종 변경 시 단가 자동 매칭 ──
  const handleCoverPaperChange = (name) => {
    setCoverPaperName(name);
    const found = papers.find(p => p.name.includes(name) || p.type.includes(name));
    if (found) {
      setCoverWeight(found.weight);
      setCoverUnitPrice(found.unitPrice);
    }
  };

  // ── 본문 지종 변경 시 단가 자동 매칭 ──
  const handleBodyPaperChange = (name) => {
    setBodyPaperName(name);
    const found = papers.find(p => p.name.includes(name) || p.type.includes(name));
    if (found) {
      setBodyWeight(found.weight);
      setBodyUnitPrice(found.unitPrice);
    }
  };

  // ── 총 면수 자동 계산 ──
  const totalPages = coverPages + bodyPages + (hasSupplement ? suppPages : 0);

  // ── 정밀 멀티파트 원가 실시간 계산 ──
  const costReport = useMemo(() => {
    return calculateFullCost({
      general: {
        quantity,
        paperCut,
        printType,
        printCategory,
        bindingType,
        ctpUnitPrice: 6500,
      },
      cover: {
        pages: coverPages,
        blankPages: coverBlankPages,
        typesetPages: coverTypesetPages,
        typesetRate: coverTypesetRate,
        typesetUnitPrice: 25000,
        colorCount: coverColor === '4도' ? 4 : coverColor === '2도' ? 2 : coverColor === '5도' ? 5 : 1,
        isDoubleSided: coverSide === '양면',
        paperUnitPrice: coverUnitPrice,
      },
      body: {
        pages: bodyPages,
        blankPages: bodyBlankPages,
        typesetPages: bodyTypesetPages,
        typesetRate: bodyTypesetRate,
        typesetUnitPrice: 15000,
        colorCount: bodyColor === '4도' ? 4 : bodyColor === '2도' ? 2 : 1,
        isDoubleSided: bodySide === '양면',
        paperUnitPrice: bodyUnitPrice,
      },
      supplement: {
        pages: suppPages,
        colorCount: suppColor === '4도' ? 4 : 2,
        isDoubleSided: suppSide === '양면',
        paperUnitPrice: suppUnitPrice,
      },
      options: {
        hasCoating,
        coatingType,
        hasSupplement,
        isBetaPrint,
        isSpotColor,
        hasFoil,
        foilCost: 120000,
        hasDiecut,
        diecutCost: 200000,
      },
      extra: {
        deliveryCost,
        packagingCost,
        discountOrAdd,
      },
    });
  }, [
    quantity, paperCut, printType, printCategory, bindingType,
    coverPages, coverBlankPages, coverTypesetPages, coverTypesetRate, coverColor, coverSide, coverUnitPrice,
    bodyPages, bodyBlankPages, bodyTypesetPages, bodyTypesetRate, bodyColor, bodySide, bodyUnitPrice,
    hasSupplement, suppPages, suppColor, suppSide, suppUnitPrice,
    hasCoating, coatingType, isBetaPrint, isSpotColor, hasFoil, hasDiecut,
    deliveryCost, packagingCost, discountOrAdd
  ]);

  // ── 🏛️ 조달청 / 교육청 공인 표준원가 실시간 연산 엔진 (14단계 법정 산식) ──
  const governmentReport = useMemo(() => {
    return calculateGovernmentCost({
      general: {
        quantity,
        paperCut,
        printType,
        printCategory,
        bindingType,
      },
      cover: {
        pages: coverPages,
        blankPages: coverBlankPages,
        typesetPages: coverTypesetPages,
        typesetRate: coverTypesetRate,
        typesetUnitPrice: 25000,
        colorCount: coverColor === '4도' ? 4 : coverColor === '2도' ? 2 : coverColor === '5도' ? 5 : 1,
        isDoubleSided: coverSide === '양면',
        paperUnitPrice: coverUnitPrice,
        paperWeight: coverWeight,
      },
      body: {
        pages: bodyPages,
        blankPages: bodyBlankPages,
        typesetPages: bodyTypesetPages,
        typesetRate: bodyTypesetRate,
        typesetUnitPrice: 15390,
        colorCount: bodyColor === '4도' ? 4 : bodyColor === '2도' ? 2 : 1,
        isDoubleSided: bodySide === '양면',
        paperUnitPrice: bodyUnitPrice,
        paperWeight: bodyWeight,
      },
      supplement: {
        pages: suppPages,
        colorCount: suppColor === '4도' ? 4 : 2,
        isDoubleSided: suppSide === '양면',
        paperUnitPrice: suppUnitPrice,
        paperWeight: suppWeight,
      },
      options: {
        hasCoating,
        coatingType,
        hasSupplement,
        isBetaPrint,
        isSpotColor,
        hasFoil,
        foilCost: 120000,
        hasDiecut,
        diecutCost: 200000,
      },
      rates: {
        manageRate,
        profitRate,
        contractRate,
      },
    });
  }, [
    quantity, paperCut, printType, printCategory, bindingType,
    coverPages, coverBlankPages, coverTypesetPages, coverTypesetRate, coverColor, coverSide, coverUnitPrice, coverWeight,
    bodyPages, bodyBlankPages, bodyTypesetPages, bodyTypesetRate, bodyColor, bodySide, bodyUnitPrice, bodyWeight,
    hasSupplement, suppPages, suppColor, suppSide, suppUnitPrice, suppWeight,
    hasCoating, coatingType, isBetaPrint, isSpotColor, hasFoil, hasDiecut,
    manageRate, profitRate, contractRate
  ]);

  // 현재 선택된 모드에 따른 최종 견적 총액 및 공급가
  const activeSubtotal = costingMode === 'GOVERNMENT' ? governmentReport.step11_supplyPrice : costReport.subtotal;
  const activeVat = costingMode === 'GOVERNMENT' ? governmentReport.step12_vat : costReport.vat;
  const activeTotalAmount = costingMode === 'GOVERNMENT' ? governmentReport.step14_contractAmount : costReport.totalAmount;
  const activeUnitPrice = costingMode === 'GOVERNMENT' ? governmentReport.perBookContractPrice : costReport.perBookPrice;

  // ── 견적서 항목 리스트 컴파일 (인쇄 / 엑셀 / 전표 연동용) ──
  const compileDetailedItems = useCallback(() => {
    const items = [];
    const c = costReport;

    // 1. 조판/편집비
    if (c.totalTypesetCost > 0) {
      items.push({
        category: '조판/편집',
        name: '기획 조판 및 편집료',
        spec: `표지 ${coverTypesetPages}p(${coverTypesetRate}%) + 본문 ${bodyTypesetPages}p(${bodyTypesetRate}%)`,
        quantity: 1,
        unit: '식',
        unitPrice: c.totalTypesetCost,
        amount: c.totalTypesetCost,
        formula: '조판면수 × 면당단가 × 편집율',
      });
    }

    // 2. 제판 (CTP)
    items.push({
      category: '제판(CTP)',
      name: '표지 CTP 출력',
      spec: `${c.coverCalc.signatures}대 × ${c.coverCalc.effectiveColors}도 (${c.coverCalc.totalPlates}판)`,
      quantity: c.coverCalc.totalPlates,
      unit: '판',
      unitPrice: 6500,
      amount: c.coverCalc.ctpCost,
      formula: `${c.coverCalc.signatures}대 × ${c.coverCalc.effectiveColors}도 × 6,500원`,
    });

    if (bodyPages > 0) {
      items.push({
        category: '제판(CTP)',
        name: '본문 CTP 출력',
        spec: `${c.bodyCalc.signatures}대 × ${c.bodyCalc.effectiveColors}도 (${c.bodyCalc.totalPlates}판)`,
        quantity: c.bodyCalc.totalPlates,
        unit: '판',
        unitPrice: 6500,
        amount: c.bodyCalc.ctpCost,
        formula: `${c.bodyCalc.signatures}대 × ${c.bodyCalc.effectiveColors}도 × 6,500원`,
      });
    }

    if (hasSupplement && c.supplementCalc) {
      items.push({
        category: '제판(CTP)',
        name: '화보 CTP 출력',
        spec: `${c.supplementCalc.signatures}대 × ${c.supplementCalc.effectiveColors}도 (${c.supplementCalc.totalPlates}판)`,
        quantity: c.supplementCalc.totalPlates,
        unit: '판',
        unitPrice: 6500,
        amount: c.supplementCalc.ctpCost,
        formula: `${c.supplementCalc.signatures}대 × ${c.supplementCalc.effectiveColors}도 × 6,500원`,
      });
    }

    // 3. 인쇄비
    items.push({
      category: '인쇄비',
      name: `표지 인쇄 (${coverColor} ${coverSide})`,
      spec: `${c.coverCalc.totalReams.toFixed(2)}R (손지 ${c.coverCalc.wasteRate}%)`,
      quantity: parseFloat(c.coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: Math.round(c.coverCalc.printCost / Math.max(0.01, c.coverCalc.totalReams)),
      amount: c.coverCalc.printCost,
      formula: `${c.coverCalc.totalReams.toFixed(2)}R × 인쇄비`,
    });

    if (bodyPages > 0) {
      items.push({
        category: '인쇄비',
        name: `본문 인쇄 (${bodyColor} ${bodySide})`,
        spec: `${c.bodyCalc.totalReams.toFixed(2)}R (손지 ${c.bodyCalc.wasteRate}%)`,
        quantity: parseFloat(c.bodyCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: Math.round(c.bodyCalc.printCost / Math.max(0.01, c.bodyCalc.totalReams)),
        amount: c.bodyCalc.printCost,
        formula: `${c.bodyCalc.totalReams.toFixed(2)}R × 인쇄비`,
      });
    }

    if (hasSupplement && c.supplementCalc) {
      items.push({
        category: '인쇄비',
        name: `화보 인쇄 (${suppColor} ${suppSide})`,
        spec: `${c.supplementCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(c.supplementCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: Math.round(c.supplementCalc.printCost / Math.max(0.01, c.supplementCalc.totalReams)),
        amount: c.supplementCalc.printCost,
        formula: '',
      });
    }

    // 4. 용지대
    items.push({
      category: '용지대',
      name: `표지 용지 (${coverPaperName} ${coverWeight}g)`,
      spec: `${c.coverCalc.totalReams.toFixed(2)}R`,
      quantity: parseFloat(c.coverCalc.totalReams.toFixed(2)),
      unit: 'R',
      unitPrice: coverUnitPrice,
      amount: c.coverCalc.paperCost,
      formula: `${c.coverCalc.totalReams.toFixed(2)}R × ${coverUnitPrice.toLocaleString()}원`,
    });

    if (bodyPages > 0) {
      items.push({
        category: '용지대',
        name: `본문 용지 (${bodyPaperName} ${bodyWeight}g)`,
        spec: `${c.bodyCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(c.bodyCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: bodyUnitPrice,
        amount: c.bodyCalc.paperCost,
        formula: `${c.bodyCalc.totalReams.toFixed(2)}R × ${bodyUnitPrice.toLocaleString()}원`,
      });
    }

    if (hasSupplement && c.supplementCalc) {
      items.push({
        category: '용지대',
        name: `화보 용지 (${suppPaperName} ${suppWeight}g)`,
        spec: `${c.supplementCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(c.supplementCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: suppUnitPrice,
        amount: c.supplementCalc.paperCost,
        formula: '',
      });
    }

    // 5. 제본비
    items.push({
      category: '제본비',
      name: `${bindingType} (${bindingDirection})`,
      spec: `총 ${totalPages}p × ${quantity.toLocaleString()}부`,
      quantity,
      unit: '부',
      unitPrice: c.bindingUnitPrice,
      amount: c.bindingCost,
      formula: `부당 ${c.bindingUnitPrice}원 × ${quantity}부`,
    });

    // 6. 후가공
    if (hasCoating && c.coatingCost > 0) {
      items.push({
        category: '후가공',
        name: `표지 ${coatingType}`,
        spec: `${c.coverCalc.totalReams.toFixed(2)}R`,
        quantity: parseFloat(c.coverCalc.totalReams.toFixed(2)),
        unit: 'R',
        unitPrice: Math.round(c.coatingCost / Math.max(0.01, c.coverCalc.totalReams)),
        amount: c.coatingCost,
        formula: '',
      });
    }
    if (hasFoil) {
      items.push({
        category: '후가공',
        name: '표지 박 가공 (금박/은박)',
        spec: '동판 제작 및 열박',
        quantity: 1,
        unit: '식',
        unitPrice: 120000,
        amount: 120000,
        formula: '',
      });
    }
    if (hasDiecut) {
      items.push({
        category: '후가공',
        name: '톰슨(도무송) 타발',
        spec: '목형 제작 및 가공',
        quantity: 1,
        unit: '식',
        unitPrice: 200000,
        amount: 200000,
        formula: '',
      });
    }

    // 7. 기타 및 운송비
    if (deliveryCost > 0) {
      items.push({
        category: '운송/포장',
        name: '화물/용달 납품 배송비',
        spec: '지정 장소 직납',
        quantity: 1,
        unit: '식',
        unitPrice: deliveryCost,
        amount: deliveryCost,
        formula: '',
      });
    }
    if (packagingCost > 0) {
      items.push({
        category: '운송/포장',
        name: '밴딩 및 박스 포장비',
        spec: `${Math.ceil(quantity / 50)} BOX`,
        quantity: Math.ceil(quantity / 50),
        unit: '박스',
        unitPrice: 1000,
        amount: packagingCost,
        formula: '',
      });
    }
    if (discountOrAdd !== 0) {
      items.push({
        category: '기타가감',
        name: discountReason || '조정 가감금액',
        spec: '합의 조정',
        quantity: 1,
        unit: '식',
        unitPrice: discountOrAdd,
        amount: discountOrAdd,
        formula: '',
      });
    }

    return items;
  }, [
    costReport, coverPages, bodyPages, hasSupplement, coverTypesetPages, coverTypesetRate,
    bodyTypesetPages, bodyTypesetRate, coverColor, coverSide, bodyColor, bodySide,
    coverPaperName, coverWeight, coverUnitPrice, bodyPaperName, bodyWeight, bodyUnitPrice,
    suppPaperName, suppWeight, suppUnitPrice, suppColor, suppSide,
    bindingType, bindingDirection, totalPages, quantity,
    hasCoating, coatingType, hasFoil, hasDiecut, deliveryCost, packagingCost, discountOrAdd, discountReason
  ]);

  // ── 저장 핸들러 ──
  const handleSave = (isDraft = false) => {
    if (!productName.trim()) {
      alert('인쇄물 명칭(품명)을 입력해주세요.');
      return;
    }

    const items = compileDetailedItems();
    const estimateData = {
      id: initialEstimate?.id,
      groupId: initialEstimate?.groupId,
      version: initialEstimate?.version || 1,
      costingMode,
      estimateNo,
      regDate,
      proofDate,
      deliveryDate,
      writerTitle,
      writerName,
      productName,
      clientId,
      clientName,
      clientDept,
      contactName,
      phone,
      printType,
      printCategory,
      quantity,
      paperCut,
      bindingType,
      bindingDirection,
      hasCoating,
      coatingType,
      hasCoverSpecial,
      hasSupplement,
      hasAddBody,
      isProcessGuide,
      isPrimaryPrint,
      isSpotColor,
      isBetaPrint,
      hasFoil,
      hasDiecut,
      coverPaperName,
      coverWeight,
      coverUnitPrice,
      coverPages,
      coverColor,
      coverSide,
      coverTypesetPages,
      coverBlankPages,
      coverTypesetRate,
      bodyPaperName,
      bodyWeight,
      bodyUnitPrice,
      bodyPages,
      bodyColor,
      bodySide,
      bodyTypesetPages,
      bodyBlankPages,
      bodyTypesetRate,
      suppPaperName,
      suppWeight,
      suppUnitPrice,
      suppPages,
      suppColor,
      suppSide,
      discountOrAdd,
      discountReason,
      deliveryCost,
      packagingCost,
      notes,
      manageRate,
      profitRate,
      contractRate,
      subtotal: activeSubtotal,
      vat: activeVat,
      totalAmount: activeTotalAmount,
      targetTotal: costingMode === 'GOVERNMENT' ? governmentReport.step13_targetTotal : costReport.totalAmount,
      unitPrice: activeUnitPrice,
      status: isDraft ? '임시저장' : (initialEstimate?.status || '작성완료'),
      authorName: writerName || user?.userName || '영업담당',
      items,
      pages: totalPages,
      governmentReport: costingMode === 'GOVERNMENT' ? governmentReport : null,
      commercialReport: costReport,
    };

    let saved = null;
    if (saveAsNewVersion && initialEstimate?.id) {
      saved = createEstimateVersion(initialEstimate.id, estimateData);
      triggerToast(`${saved.version}차 견적으로 신규 저장되었습니다!`);
    } else {
      saved = saveEstimate(estimateData);
      triggerToast(costingMode === 'GOVERNMENT' ? '🏛️ 조달·교육청 표준원가 견적서가 저장되었습니다.' : '🏢 인쇄소 실무 견적서가 저장되었습니다.');
    }

    if (onSaved) onSaved(saved);
  };

  // ── 작업전표 즉시 등록 ──
  const handleConvertToJobOrder = async () => {
    if (!productName.trim()) {
      alert('품명을 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`[${productName}] 원가 견적 내용을 기반으로 작업전표를 등록하시겠습니까?`)) {
      return;
    }

    const newJob = {
      order_date: regDate || new Date().toISOString().slice(0, 10),
      delivery_date: deliveryDate || new Date().toISOString().slice(0, 10),
      client_name: clientDept ? `${clientName} (${clientDept})` : (clientName || '일반거래처'),
      client_id: clientId || '',
      contact_name: contactName || '',
      phone: phone || '',
      product_name: productName,
      quantity,
      unit: '부',
      size_spec: paperCut,
      pages: totalPages,
      color_spec: `표지: ${coverColor}(${coverSide}) / 본문: ${bodyColor}(${bodySide})`,
      binding_type: `${bindingType} (${bindingDirection})`,
      paper_spec: `표지: ${coverPaperName} ${coverWeight}g / 본문: ${bodyPaperName} ${bodyWeight}g`,
      post_process: hasCoating ? coatingType : '없음',
      order_price: activeTotalAmount,
      special_notes: costingMode === 'GOVERNMENT'
        ? `[조달·교육청 표준원가 연계 - 계약금액 ₩${activeTotalAmount.toLocaleString()}]\n예정가격: ₩${governmentReport.step13_targetTotal.toLocaleString()}원 / 권당: ₩${activeUnitPrice.toLocaleString()}원\n${notes || ''}`
        : `[인쇄원가계산서 연계]\n부당단가: ${activeUnitPrice.toLocaleString()}원\n${notes || ''}`,
      status: '접수완료',
      author: writerName || user?.userName || '영업담당',
    };

    try {
      if (addJobOrder) {
        await addJobOrder(newJob);
        alert('★ 작업전표가 성공적으로 등록되었습니다!\n작업전표 메뉴에서 일정을 확인하실 수 있습니다.');
      }
    } catch (e) {
      alert('작업전표 등록 중 오류가 발생했습니다: ' + e.message);
    }
  };

  // ── 매출 즉시 등록 ──
  const handleConvertToSale = async () => {
    if (!productName.trim()) {
      alert('품명을 먼저 입력해주세요.');
      return;
    }

    if (!window.confirm(`[${productName}] 총 ₩${activeTotalAmount.toLocaleString()}원을 매출관리 DB에 등록하시겠습니까?`)) {
      return;
    }

    const newSale = {
      date: regDate || new Date().toISOString().slice(0, 10),
      client_name: clientDept ? `${clientName} (${clientDept})` : (clientName || '일반거래처'),
      client_id: clientId || '',
      product_name: productName,
      spec: `${paperCut} ${totalPages}p ${bindingType}`,
      quantity,
      unit_price: activeUnitPrice,
      supply_amount: activeSubtotal,
      vat: activeVat,
      total_amount: activeTotalAmount,
      contact_person: contactName || '',
      manager: writerName || user?.userName || '영업담당',
      status: '미수',
      remarks: costingMode === 'GOVERNMENT' ? `[조달·교육청 표준원가 연계]` : `[인쇄원가계산 연계]`,
    };

    try {
      if (addSales) {
        await addSales(newSale);
        alert('★ 매출이 성공적으로 등록되었습니다!\n매출관리 메뉴에서 확인하실 수 있습니다.');
      }
    } catch (e) {
      alert('매출 등록 중 오류가 발생했습니다: ' + e.message);
    }
  };

  return (
    <div className="space-y-5 pb-32">
      {/* 토스트 */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 계산 모드 선택 스위처 (사기업 실무 vs 공공·조달 표준원가) ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">인쇄 견적 계산 엔진 분리</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              costingMode === 'GOVERNMENT'
                ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-300'
                : 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
            }`}>
              {costingMode === 'GOVERNMENT' ? '🏛️ 조달·교육청 표준원가 모드 활성' : '🏢 인쇄소 실무 견적 모드 활성'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {costingMode === 'GOVERNMENT'
              ? '조달청 고시 및 전남교육청(print.jne.go.kr) 기준 14단계 공인 원가계산 (일반관리비 5%, 법정이윤 10%, 낙찰하한율 88%, 원가계산서/규격서 공문서 출력)'
              : '비피앤피 / 갑우문화사 상업 인쇄소 6대 실무 공정(CTP 판당 6,500원, 인쇄/제본/코팅 실무원가, 마진율 비교) 기반 견적서 산출'}
          </p>
        </div>

        {/* 모드 전환 토글 탭 */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl self-start md:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setCostingMode('COMMERCIAL')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              costingMode === 'COMMERCIAL'
                ? 'bg-white text-blue-700 shadow-md ring-1 ring-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>🏢 인쇄소 실무 견적 (사기업)</span>
          </button>

          <button
            type="button"
            onClick={() => setCostingMode('GOVERNMENT')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              costingMode === 'GOVERNMENT'
                ? 'bg-teal-600 text-white shadow-md ring-1 ring-teal-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-teal-200" />
            <span>🏛️ 조달·교육청 표준원가 (공공기관)</span>
          </button>
        </div>
      </div>

      {/* ── 🏛️ 조달·공공 표준 원가 법정 가산율 패널 (공공기관 모드 활성화 시 표시) ── */}
      {costingMode === 'GOVERNMENT' && (
        <div className="bg-gradient-to-r from-teal-50 via-teal-50/70 to-emerald-50 rounded-2xl border-2 border-teal-300 p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-teal-200 gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-black text-teal-950">
                  조달청 및 전라남도교육청 인쇄요금 원가계산 기준 (2018. 3. 1.)
                </span>
                <span className="text-xs text-teal-700 ml-2 hidden sm:inline">
                  (국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowGovPrintModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-black rounded-lg bg-teal-700 text-white hover:bg-teal-800 shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>공공 원가계산서 / 규격서 인쇄</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">일반관리비율 (Manage Rate)</label>
                <span className="font-black text-teal-800">{manageRate}%</span>
              </div>
              <input
                type="number"
                min={0}
                max={14}
                step={0.5}
                value={manageRate}
                onChange={e => setManageRate(Number(e.target.value))}
                className="w-full p-1.5 border border-slate-300 rounded-lg text-right font-black text-teal-700 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">순제조원가의 14% 한도 (기본 5%)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">이윤율 (Profit Rate)</label>
                <span className="font-black text-teal-800">{profitRate}%</span>
              </div>
              <input
                type="number"
                min={0}
                max={25}
                step={0.5}
                value={profitRate}
                onChange={e => setProfitRate(Number(e.target.value))}
                className="w-full p-1.5 border border-slate-300 rounded-lg text-right font-black text-teal-700 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">(순제조+관리비 - 용지대)의 25% 이내 (기본 10%)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">낙찰하한율 / 사정율 (Contract)</label>
                <span className="font-black text-teal-800">{contractRate}%</span>
              </div>
              <input
                type="number"
                min={50}
                max={100}
                step={0.1}
                value={contractRate}
                onChange={e => setContractRate(Number(e.target.value))}
                className="w-full p-1.5 border border-slate-300 rounded-lg text-right font-black text-teal-700 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">조달청 일반인쇄 계약율 (기본 88%, 천원절사)</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
              <label className="font-bold text-slate-700 block mb-1">작성자 직급 / 직위</label>
              <input
                type="text"
                value={writerTitle}
                onChange={e => setWriterTitle(e.target.value)}
                placeholder="예: 주무관, 담당자, 과장"
                className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">공문서 상단 작성자 날인 직명</span>
            </div>
          </div>

          <div className="bg-teal-100/70 p-2.5 rounded-xl text-[11px] text-teal-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>법정 이윤 산출 규칙:</strong> 국가계약법령에 따라 용지비(<strong>{governmentReport.step1_paperCost.toLocaleString()}원</strong>)를 공제한 순가공비 및 관리비(<strong>{governmentReport.profitBase.toLocaleString()}원</strong>)에 대해 이윤({profitRate}%)이 적용됩니다.
              </span>
            </div>
            <span className="font-black text-teal-900 shrink-0">
              법정이윤: ₩ {governmentReport.step10_profitCost.toLocaleString()}원
            </span>
          </div>
        </div>
      )}

      {/* 헤더 바 */}
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
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                인쇄원가계산 ({costingMode === 'GOVERNMENT' ? '🏛️ 조달·교육청 표준' : '🏢 인쇄소 실무'}) - {printType}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                costingMode === 'GOVERNMENT'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-sky-100 text-sky-800'
              }`}>
                {costingMode === 'GOVERNMENT' ? '조달 공인 14단계 원가' : '표지/내지 분리 실무원가'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {costingMode === 'GOVERNMENT'
                ? '전라남도교육청 및 조달청 인쇄요금 표준기준에 따른 엄격한 법정 예정가격 및 계약금액 산출'
                : '비피앤피/갑우문화사 인쇄소 6대 실무 공정(CTP, 인쇄, 제본, 후가공, 용지) 원가 산출'}
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEstimateDetailToExcel({
              estimateNo, clientName, contactName, productName, quantity, unit: '부',
              sizeWidth: 0, sizeHeight: 0, paperCut, pages: totalPages,
              colors: `표지 ${coverColor} / 본문 ${bodyColor}`, bindingType,
              paperType: `표지: ${coverPaperName} / 본문: ${bodyPaperName}`,
              subtotal: activeSubtotal, vat: activeVat, totalAmount: activeTotalAmount, unitPrice: activeUnitPrice,
              items: compileDetailedItems(), notes
            })}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>

          {costingMode === 'GOVERNMENT' ? (
            <button
              type="button"
              onClick={() => setShowGovPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>공공 원가계산서/규격서</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 견적서 인쇄</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleConvertToJobOrder}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>작업전표 등록</span>
          </button>

          <button
            type="button"
            onClick={handleConvertToSale}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>매출 등록</span>
          </button>
        </div>
      </div>

      {/* ── 1. 기본 선택 정보 (이미지 2 상단 형태) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            <span>기본 선택 정보</span>
          </span>
          {initialEstimate && (
            <label className="flex items-center space-x-1.5 text-xs font-bold text-sky-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsNewVersion}
                onChange={e => setSaveAsNewVersion(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>새 버전({(initialEstimate.version || 1) + 1}차)으로 저장</span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">작성일자</label>
            <input
              type="date"
              value={regDate}
              onChange={e => setRegDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">작성자 (직급 / 성명)</label>
            <div className="flex space-x-1">
              <select
                value={writerTitle}
                onChange={e => setWriterTitle(e.target.value)}
                className="w-24 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="주무관">주무관</option>
                <option value="담당자">담당자</option>
                <option value="팀장">팀장</option>
                <option value="부장">부장</option>
                <option value="대표">대표</option>
              </select>
              <input
                type="text"
                value={writerName}
                onChange={e => setWriterName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                placeholder="성명 입력"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">교정기한</label>
            <input
              type="date"
              value={proofDate}
              onChange={e => setProofDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-700"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">납품기한</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-700"
            />
          </div>

          {/* 실시간 거래처 검색 바 */}
          <div className="sm:col-span-4 bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-sky-800 flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-sky-600" />
                <span>기존 등록 고객 실시간 검색 (과/부서명, 고객사명, 담당자명, 연락처로 조회)</span>
              </label>
              {clientName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  선택됨: {clientName} {clientDept ? `(${clientDept})` : ''}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="과명, 고객사명, 담당자명, 전화번호 검색... (예: 환경, 기후, 홍길동, 010...)"
                value={customerSearchInput}
                onChange={e => {
                  setCustomerSearchInput(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => {
                  if (customerSearchInput.trim()) setShowCustomerDropdown(true);
                }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-sky-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              {customerSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchInput('');
                    setShowCustomerDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 검색 결과 드롭다운 */}
              {showCustomerDropdown && customerSearchInput.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                  <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                    <span>검색 결과 ({customerSearchResults.length}건)</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomerDropdown(false)}
                      className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 rounded hover:bg-slate-100"
                    >
                      ✕ 닫기
                    </button>
                  </div>
                  {customerSearchResults.length > 0 ? (
                    customerSearchResults.map((c, idx) => (
                      <button
                        key={`${c.id}-${c.contact_id || idx}`}
                        type="button"
                        onClick={() => handleSelectSearchResult(c)}
                        className="w-full text-left p-2.5 hover:bg-sky-50 cursor-pointer flex flex-col transition"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{c.name}</span>
                          {c.dept && (
                            <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                              {c.dept}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-3">
                          {c.contact_person && <span>👤 담당: <strong className="text-slate-700">{c.contact_person}</strong></span>}
                          {c.phone && <span>📞 {c.phone}</span>}
                          {c.sales_manager && <span>영업담당: {c.sales_manager}</span>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-[11px]">
                      일치하는 등록 고객이 없습니다. 아래 항목에 직접 입력하실 수 있습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4단 상세 입력 필드 (자동 채워짐 & 직접 편집 가능) */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              거래처명 (고객사) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-slate-900"
              placeholder="예: 금강유역환경청"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">과 / 부서명</label>
            <input
              type="text"
              value={clientDept}
              onChange={e => setClientDept(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-sky-700"
              placeholder="예: 환경관리과"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">거래처 담당자</label>
            <input
              type="text"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              placeholder="예: 홍길동 주무관"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">연락처</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              placeholder="010-0000-0000"
            />
          </div>

          {/* 인쇄명 */}
          <div className="sm:col-span-4">
            <label className="font-bold text-slate-700 block mb-1">
              인쇄명 (품명) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-black text-slate-900 text-sm"
              placeholder="예: 2026학년도 상반기 학교회계 예산편성 길라잡이"
              required
            />
          </div>
        </div>
      </div>

      {/* ── 2. 규격 선택 정보 (이미지 2의 두 번째 박스) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>규격 선택 정보</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* 인쇄 방식 라디오 */}
          <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-600 w-20">인쇄 방식:</span>
            {['옵셋인쇄', '경인쇄', '시험지인쇄', '디지털인쇄'].map(t => (
              <label key={t} className="flex items-center space-x-1 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="printType"
                  value={t}
                  checked={printType === t}
                  onChange={e => setPrintType(e.target.value)}
                  className="text-sky-600"
                />
                <span className={printType === t ? 'font-bold text-sky-700' : 'text-slate-600'}>{t}</span>
              </label>
            ))}
          </div>

          {/* 인쇄물 종류 라디오 */}
          <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-600 w-20">인쇄물 종류:</span>
            {['책자', '화보집', '리플렛', '포스터', '전단'].map(c => (
              <label key={c} className="flex items-center space-x-1 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="printCategory"
                  value={c}
                  checked={printCategory === c}
                  onChange={e => setPrintCategory(e.target.value)}
                  className="text-sky-600"
                />
                <span className={printCategory === c ? 'font-bold text-sky-700' : 'text-slate-600'}>{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <label className="font-bold text-slate-600 block mb-1">제작수량 (부수)</label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-sky-700 text-right"
              />
              <span className="font-bold text-slate-500">부</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄물 사이즈 (판형)</label>
            <select
              value={paperCut}
              onChange={e => setPaperCut(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
            >
              <option value="국배판(A4)">국배판 (A4 / 10절)</option>
              <option value="4×6배판(B5)">4×6배판 (B5 / 16절)</option>
              <option value="국판(A5)">국판 (A5 / 국16절)</option>
              <option value="크라운판(18절)">크라운판 (18절)</option>
              <option value="4×6판(32절)">4×6판 (32절/B6)</option>
              <option value="타블로이드(8절)">타블로이드 (8절/A3)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">총 면수 (Page)</label>
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 font-black text-slate-900 text-center">
              {totalPages} <span className="text-[11px] font-normal text-slate-500">Page (표지 {coverPages}p + 본문 {bodyPages}p{hasSupplement ? ` + 화보 ${suppPages}p` : ''})</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">제본 형태</label>
            <div className="flex space-x-1">
              <select
                value={bindingType}
                onChange={e => setBindingType(e.target.value)}
                className="w-2/3 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="무사무선">무사무선 (일반)</option>
                <option value="무선날개">무선 날개</option>
                <option value="중철제본">중철</option>
                <option value="환양장">환양장(하드커버)</option>
                <option value="와이어스프링">와이어 스프링</option>
                <option value="접지(리플렛)">접지</option>
              </select>
              <select
                value={bindingDirection}
                onChange={e => setBindingDirection(e.target.value)}
                className="w-1/3 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="좌철">좌철</option>
                <option value="우철">우철</option>
                <option value="상철">상철</option>
              </select>
            </div>
          </div>
        </div>

        {/* 옵션 선택 체크박스 바 (이미지 2의 '옵션선택') */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center justify-between">
            <span>■ 옵션 선택:</span>
            {hasCoating && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">코팅 종류:</span>
                <select
                  value={coatingType}
                  onChange={e => setCoatingType(e.target.value)}
                  className="p-1 border border-slate-300 rounded bg-white font-bold text-sky-700 text-[11px]"
                >
                  <option value="무광코팅">무광 라미네이팅</option>
                  <option value="유광코팅">유광 라미네이팅</option>
                  <option value="UV코팅">UV 코팅</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasCoating}
                onChange={e => setHasCoating(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>코팅</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasCoverSpecial}
                onChange={e => setHasCoverSpecial(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>표지 식재</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-sky-700">
              <input
                type="checkbox"
                checked={hasSupplement}
                onChange={e => setHasSupplement(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>화보사용 (컬러 화보 별도 삽입)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasAddBody}
                onChange={e => setHasAddBody(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>본문추가 (해설집/본문2)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isProcessGuide}
                onChange={e => setIsProcessGuide(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>작업설</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isPrimaryPrint}
                onChange={e => setIsPrimaryPrint(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>원색인쇄</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isSpotColor}
                onChange={e => setIsSpotColor(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>특수별색</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isBetaPrint}
                onChange={e => setIsBetaPrint(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>베다인쇄 (솔리드 베다 할증)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasFoil}
                onChange={e => setHasFoil(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>금박/은박</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasDiecut}
                onChange={e => setHasDiecut(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>톰슨(도무송)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── 3. [표지 선택정보] (이미지 2의 표지 선택정보 박스) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>표지 선택정보 (COVER)</span>
          </span>
          <span className="text-xs font-black text-sky-700">
            표지 소계: ₩ {(costReport.coverCalc.totalCost + (hasCoating ? costReport.coatingCost : 0)).toLocaleString()} 원
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* 용지 종류 & 평량 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">용지종류 / 평량</label>
            <div className="flex space-x-1">
              <select
                value={coverPaperName}
                onChange={e => handleCoverPaperChange(e.target.value)}
                className="w-2/3 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="아트지">아트지</option>
                <option value="스노우지">스노우지</option>
                <option value="랑데뷰">랑데뷰(고급)</option>
                <option value="아르떼">아르떼(고급)</option>
                <option value="레자크">레자크</option>
                <option value="마닐라">마닐라(SC)</option>
              </select>
              <select
                value={coverWeight}
                onChange={e => setCoverWeight(Number(e.target.value))}
                className="w-1/3 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value={150}>150g</option>
                <option value={180}>180g</option>
                <option value={200}>200g</option>
                <option value={250}>250g</option>
                <option value={300}>300g</option>
              </select>
            </div>
          </div>

          {/* 표지 면수 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">표지면수 (Page)</label>
            <input
              type="number"
              value={coverPages}
              onChange={e => setCoverPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 text-center"
            />
          </div>

          {/* 인쇄 형태 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄형태 (도수 / 면)</label>
            <div className="flex space-x-1">
              <select
                value={coverColor}
                onChange={e => setCoverColor(e.target.value)}
                className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="4도">4도 (칼라)</option>
                <option value="5도">5도 (별색포함)</option>
                <option value="2도">2도</option>
                <option value="1도">1도 (먹)</option>
              </select>
              <select
                value={coverSide}
                onChange={e => setCoverSide(e.target.value)}
                className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="단면">단면</option>
                <option value="양면">양면</option>
              </select>
            </div>
          </div>

          {/* 조판면수 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">조판면수 (Page)</label>
            <input
              type="number"
              value={coverTypesetPages}
              onChange={e => setCoverTypesetPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

          {/* 연당단가 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">연당단가 (원/R)</label>
            <input
              type="number"
              value={coverUnitPrice}
              onChange={e => setCoverUnitPrice(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-sky-700 text-right"
            />
          </div>

          {/* 인쇄되지 않는 면 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄되지 않는 면 (백면)</label>
            <input
              type="number"
              value={coverBlankPages}
              onChange={e => setCoverBlankPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

          {/* 조판 및 편집율 슬라이더 */}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-center mb-1 font-bold text-slate-600">
              <span>조판 및 편집율:</span>
              <span className="text-sky-700">{coverTypesetRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={coverTypesetRate}
              onChange={e => setCoverTypesetRate(Number(e.target.value))}
              className="w-full accent-sky-600"
            />
          </div>
        </div>

        {/* 표지 실시간 연산 산출 결과 바 */}
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span>소요연수: <strong className="text-slate-800">{costReport.coverCalc.totalReams.toFixed(2)} R</strong></span>
            <span>CTP: <strong className="text-slate-800">{costReport.coverCalc.totalPlates} 판</strong> (₩{costReport.coverCalc.ctpCost.toLocaleString()}원)</span>
            <span>인쇄비: <strong className="text-slate-800">₩{costReport.coverCalc.printCost.toLocaleString()}원</strong></span>
            <span>용지비: <strong className="text-slate-800">₩{costReport.coverCalc.paperCost.toLocaleString()}원</strong></span>
          </div>
          {hasCoating && (
            <span className="text-amber-800 font-bold">코팅비: ₩{costReport.coatingCost.toLocaleString()}원</span>
          )}
        </div>
      </div>

      {/* ── 4. [본문 선택정보] (이미지 2의 본문 선택정보 박스) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>본문 선택정보 (BODY / 내지)</span>
          </span>
          <span className="text-xs font-black text-sky-700">
            본문 소계: ₩ {costReport.bodyCalc.totalCost.toLocaleString()} 원
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {/* 용지 종류 & 평량 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">용지종류 / 평량</label>
            <div className="flex space-x-1">
              <select
                value={bodyPaperName}
                onChange={e => handleBodyPaperChange(e.target.value)}
                className="w-2/3 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="백상지">백상지 (모조)</option>
                <option value="미색모조">미색 모조지</option>
                <option value="스노우지">스노우지</option>
                <option value="뉴플러스지">뉴플러스지</option>
                <option value="아트지">아트지</option>
              </select>
              <select
                value={bodyWeight}
                onChange={e => setBodyWeight(Number(e.target.value))}
                className="w-1/3 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value={70}>70g</option>
                <option value={80}>80g</option>
                <option value={100}>100g</option>
                <option value={120}>120g</option>
                <option value={150}>150g</option>
              </select>
            </div>
          </div>

          {/* 본문 면수 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">본문면수 (Page)</label>
            <input
              type="number"
              value={bodyPages}
              onChange={e => setBodyPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 text-center"
            />
          </div>

          {/* 인쇄 형태 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄형태 (도수 / 면)</label>
            <div className="flex space-x-1">
              <select
                value={bodyColor}
                onChange={e => setBodyColor(e.target.value)}
                className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="1도">1도 (먹단색)</option>
                <option value="2도">2도 (2도인쇄)</option>
                <option value="4도">4도 (올칼라)</option>
              </select>
              <select
                value={bodySide}
                onChange={e => setBodySide(e.target.value)}
                className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="양면">양면</option>
                <option value="단면">단면</option>
              </select>
            </div>
          </div>

          {/* 조판면수 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">조판면수 (Page)</label>
            <input
              type="number"
              value={bodyTypesetPages}
              onChange={e => setBodyTypesetPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

          {/* 연당단가 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">연당단가 (원/R)</label>
            <input
              type="number"
              value={bodyUnitPrice}
              onChange={e => setBodyUnitPrice(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-sky-700 text-right"
            />
          </div>

          {/* 인쇄되지 않는 면 */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄되지 않는 면 (백면)</label>
            <input
              type="number"
              value={bodyBlankPages}
              onChange={e => setBodyBlankPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

          {/* 조판 및 편집율 슬라이더 */}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-center mb-1 font-bold text-slate-600">
              <span>조판 및 편집율:</span>
              <span className="text-sky-700">{bodyTypesetRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={bodyTypesetRate}
              onChange={e => setBodyTypesetRate(Number(e.target.value))}
              className="w-full accent-sky-600"
            />
          </div>
        </div>

        {/* 본문 실시간 연산 산출 결과 바 */}
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span>대수: <strong className="text-slate-800">{costReport.bodyCalc.signatures} 대</strong></span>
            <span>소요연수: <strong className="text-slate-800">{costReport.bodyCalc.totalReams.toFixed(2)} R</strong></span>
            <span>CTP: <strong className="text-slate-800">{costReport.bodyCalc.totalPlates} 판</strong> (₩{costReport.bodyCalc.ctpCost.toLocaleString()}원)</span>
            <span>인쇄비: <strong className="text-slate-800">₩{costReport.bodyCalc.printCost.toLocaleString()}원</strong></span>
            <span>용지비: <strong className="text-slate-800">₩{costReport.bodyCalc.paperCost.toLocaleString()}원</strong></span>
          </div>
          {costReport.bodyCalc.typesetCost > 0 && (
            <span className="text-emerald-800 font-bold">조판료: ₩{costReport.bodyCalc.typesetCost.toLocaleString()}원</span>
          )}
        </div>
      </div>

      {/* ── 5. [화보 / 간지 선택정보] (화보사용 옵션 시 활성화) ── */}
      {hasSupplement && (
        <div className="bg-white rounded-2xl border border-sky-300 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-sky-100">
            <span className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>화보 / 별색 삽입면 선택정보 (SUPPLEMENT)</span>
            </span>
            <span className="text-xs font-black text-sky-700">
              화보 소계: ₩ {(costReport.supplementCalc?.totalCost || 0).toLocaleString()} 원
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">용지종류 / 평량</label>
              <div className="flex space-x-1">
                <input
                  type="text"
                  value={suppPaperName}
                  onChange={e => setSuppPaperName(e.target.value)}
                  className="w-2/3 p-2 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  value={suppWeight}
                  onChange={e => setSuppWeight(Number(e.target.value))}
                  className="w-1/3 p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">화보 면수 (Page)</label>
              <input
                type="number"
                value={suppPages}
                onChange={e => setSuppPages(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-center"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">인쇄형태</label>
              <div className="flex space-x-1">
                <select
                  value={suppColor}
                  onChange={e => setSuppColor(e.target.value)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="4도">4도</option>
                  <option value="2도">2도</option>
                </select>
                <select
                  value={suppSide}
                  onChange={e => setSuppSide(e.target.value)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="양면">양면</option>
                  <option value="단면">단면</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">연당단가 (원/R)</label>
              <input
                type="number"
                value={suppUnitPrice}
                onChange={e => setSuppUnitPrice(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-sky-700 text-right"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 6. 기타 선택정보 (가감금액, 배송비, 포장비) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          <span>기타 선택정보 (가감금액 및 물류 포장)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">기타 가감금액 (원)</label>
            <input
              type="number"
              value={discountOrAdd}
              onChange={e => setDiscountOrAdd(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-right text-slate-800"
              placeholder="+할증 또는 -할인 금액"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">기타 가감사유</label>
            <input
              type="text"
              value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              placeholder="예: 긴급 인쇄 할증 또는 단골 할인"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">택배 / 화물 배송비 (원)</label>
            <input
              type="number"
              value={deliveryCost}
              onChange={e => setDeliveryCost(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">박스 포장대 (원)</label>
            <input
              type="number"
              value={packagingCost}
              onChange={e => setPackagingCost(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-right"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="font-bold text-slate-600 block mb-1">견적 특이사항 / 메모</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs"
              placeholder="견적서 하단에 출력될 특약사항 및 전달 메시지를 입력합니다."
            />
          </div>
        </div>
      </div>

      {/* ── 7. 공정별 세부 산출 내역표 (원가 집계 테이블 - 모드별 분기) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>
            {costingMode === 'GOVERNMENT'
              ? '■ 🏛️ 조달청·교육청 표준 인쇄원가 14단계 법정 산출 상세표'
              : '■ 🏢 인쇄소 상업 실무 견적 공정별 원가 상세표'}
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            {costingMode === 'GOVERNMENT'
              ? '국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조 적용'
              : '비피앤피 / 갑우문화사 실무 견적 기준'}
          </span>
        </div>

        {costingMode === 'GOVERNMENT' ? (
          /* 🏛️ 공공·조달 14단계 법정 원가 집계 테이블 */
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 rounded-lg">
              <thead className="bg-teal-50 text-teal-900 font-bold border-b border-teal-200 text-center">
                <tr>
                  <th className="p-2 w-16">단계</th>
                  <th className="p-2 w-28 text-left">법정 원가 항목</th>
                  <th className="p-2 text-left">산출 공식 및 공인 기준</th>
                  <th className="p-2 w-28 text-right">금액 (원)</th>
                  <th className="p-2 w-28 text-right">비고 / 법정요율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {/* 1. 용지료 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">1</td>
                  <td className="p-2.5 font-bold text-slate-800">1. 용지료</td>
                  <td className="p-2.5 text-slate-600">
                    표지({governmentReport.coverCalc?.totalReams}R) + 본문({governmentReport.bodyCalc?.totalReams}R)
                    {governmentReport.supplementCalc ? ` + 화보(${governmentReport.supplementCalc.totalReams}R)` : ''} (손지율 포함)
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step1_paperCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">직접재료비</td>
                </tr>

                {/* 2. 조판료 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">2</td>
                  <td className="p-2.5 font-bold text-slate-800">2. 조판료</td>
                  <td className="p-2.5 text-slate-600">
                    표지({governmentReport.coverCalc?.typesetPages}p×{governmentReport.coverCalc?.typesetRate}%) + 본문({governmentReport.bodyCalc?.typesetPages}p×{governmentReport.bodyCalc?.typesetRate}%) 전자조판료
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step2_typesetCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">기본 15,390원/p</td>
                </tr>

                {/* 3. 인쇄판료 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">3</td>
                  <td className="p-2.5 font-bold text-slate-800">3. 인쇄판료 (CTP)</td>
                  <td className="p-2.5 text-slate-600">
                    총 {(governmentReport.coverCalc?.plates || 0) + (governmentReport.bodyCalc?.plates || 0) + (governmentReport.supplementCalc?.plates || 0)}판 (대수 × 면수 × 색도수) × 공인 판당단가 {governmentReport.coverCalc?.plateUnitPrice?.toLocaleString()}원
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step3_ctpCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">조달 CTP 단가</td>
                </tr>

                {/* 4. 인쇄료 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">4</td>
                  <td className="p-2.5 font-bold text-slate-800">4. 인쇄료</td>
                  <td className="p-2.5 text-slate-600">
                    기준통수 × 통당단가 × 인쇄면수 × 할증(지질, 특수별색, 베다바탕 가산율)
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step4_printCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">통수 구간제</td>
                </tr>

                {/* 5. 제본료 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">5</td>
                  <td className="p-2.5 font-bold text-slate-800">5. 제본료</td>
                  <td className="p-2.5 text-slate-600">
                    {bindingType} : {quantity.toLocaleString()}부 × {Math.max(100, governmentReport.totalPages)}면(100면 기본) × 면당 0.825원
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step5_bindingCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">공인 단가</td>
                </tr>

                {/* 6. 기타추가 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">6</td>
                  <td className="p-2.5 font-bold text-slate-800">6. 기타추가</td>
                  <td className="p-2.5 text-slate-600">
                    표지 코팅({governmentReport.coatingCost.toLocaleString()}원) + 박({governmentReport.foilCost.toLocaleString()}원) + 톰슨({governmentReport.diecutCost.toLocaleString()}원)
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step6_extraCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">후가공 실비</td>
                </tr>

                {/* 7. 소계 (순제조원가) */}
                <tr className="bg-slate-100 font-bold border-t border-b border-slate-300">
                  <td className="p-2.5 text-center text-slate-700">7</td>
                  <td className="p-2.5 text-slate-900 font-black">7. 순제조원가 (소계)</td>
                  <td className="p-2.5 text-slate-700">직접비 합계 (1 + 2 + 3 + 4 + 5 + 6)</td>
                  <td className="p-2.5 text-right font-black text-slate-950 text-xs">{governmentReport.step7_subtotal.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-700 font-bold">순제조비</td>
                </tr>

                {/* 8. 일반관리비 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">8</td>
                  <td className="p-2.5 font-bold text-teal-800">8. 일반관리비</td>
                  <td className="p-2.5 text-teal-900">
                    순제조원가({governmentReport.step7_subtotal.toLocaleString()}원) × {manageRate}% (법정한도 14% 이내)
                  </td>
                  <td className="p-2.5 text-right font-bold text-teal-900">{governmentReport.step8_manageCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right font-semibold text-teal-800">법정 {manageRate}%</td>
                </tr>

                {/* 9. 계 */}
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2.5 text-center text-slate-600">9</td>
                  <td className="p-2.5 text-slate-800 font-bold">9. 계 (소계 + 일반관리비)</td>
                  <td className="p-2.5 text-slate-600">순제조원가(7) + 일반관리비(8)</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step9_manufacturingTotal.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-600">총제조원가</td>
                </tr>

                {/* 10. 이윤 */}
                <tr className="hover:bg-teal-50/50 bg-teal-50/30">
                  <td className="p-2.5 text-center font-bold text-teal-800">10</td>
                  <td className="p-2.5 font-black text-teal-900">10. 이윤 (법정산식)</td>
                  <td className="p-2.5 text-teal-900">
                    (총제조원가 9 - 용지비 1: {governmentReport.profitBase.toLocaleString()}원) × {profitRate}% (법정한도 25% 이내)
                  </td>
                  <td className="p-2.5 text-right font-black text-teal-900">{governmentReport.step10_profitCost.toLocaleString()}원</td>
                  <td className="p-2.5 text-right font-bold text-rose-700">용지비 공제 적용</td>
                </tr>

                {/* 11. 공급가액 */}
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2.5 text-center text-slate-600">11</td>
                  <td className="p-2.5 text-slate-900 font-bold">11. 공급가액</td>
                  <td className="p-2.5 text-slate-600">총제조원가(9) + 법정이윤(10)</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step11_supplyPrice.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-600">과세표준액</td>
                </tr>

                {/* 12. 부가가치세 */}
                <tr className="hover:bg-slate-50/70">
                  <td className="p-2.5 text-center font-bold text-slate-500">12</td>
                  <td className="p-2.5 font-bold text-slate-800">12. 부가가치세</td>
                  <td className="p-2.5 text-slate-600">공급가액(11) × 10%</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step12_vat.toLocaleString()}원</td>
                  <td className="p-2.5 text-right text-slate-500">VAT 10%</td>
                </tr>

                {/* 13. 합계 (예정가격) */}
                <tr className="bg-blue-50/80 font-bold border-t border-b border-blue-200">
                  <td className="p-3 text-center text-blue-900 font-black">13</td>
                  <td className="p-3 text-blue-950 font-black text-xs">13. 예정가격 (합계)</td>
                  <td className="p-3 text-blue-900 font-semibold">공급가액(11) + 부가가치세(12) (권당 {governmentReport.perBookTargetPrice.toLocaleString()}원)</td>
                  <td className="p-3 text-right font-black text-blue-900 text-sm">{governmentReport.step13_targetTotal.toLocaleString()}원</td>
                  <td className="p-3 text-right text-blue-800 font-bold">관공서 예정가</td>
                </tr>

                {/* 14. 계약금액 / 낙찰금액 */}
                <tr className="bg-teal-100/90 font-bold border-t-2 border-teal-500">
                  <td className="p-3.5 text-center text-teal-950 font-black text-sm">14</td>
                  <td className="p-3.5 text-teal-950 font-black text-sm">14. 최종 계약금액</td>
                  <td className="p-3.5 text-teal-950 font-bold">
                    예정가격(13) × {contractRate}% 낙찰하한율 (천원 단위 이하 절사 반영)
                  </td>
                  <td className="p-3.5 text-right font-black text-teal-950 text-base">
                    ₩ {governmentReport.step14_contractAmount.toLocaleString()}원
                  </td>
                  <td className="p-3.5 text-right font-black text-teal-900">
                    부당 {governmentReport.perBookContractPrice.toLocaleString()}원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* 🏢 사기업 실무 견적 공정별 내역 테이블 */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2 w-10">No</th>
                  <th className="p-2 w-24">구분</th>
                  <th className="p-2 text-left">세부 항목명</th>
                  <th className="p-2">규격 / 산출 기준</th>
                  <th className="p-2 w-16">수량</th>
                  <th className="p-2 w-12">단위</th>
                  <th className="p-2 text-right w-24">단가</th>
                  <th className="p-2 text-right w-28">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compileDetailedItems().map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="p-2 text-slate-400">{idx + 1}</td>
                    <td className="p-2 font-semibold text-slate-600">{it.category}</td>
                    <td className="p-2 text-left font-bold text-slate-800">{it.name}</td>
                    <td className="p-2 text-slate-500 text-[11px]">{it.spec}</td>
                    <td className="p-2 font-medium">{it.quantity?.toLocaleString()}</td>
                    <td className="p-2 text-slate-500">{it.unit}</td>
                    <td className="p-2 text-right">{it.unitPrice?.toLocaleString()}원</td>
                    <td className="p-2 text-right font-bold text-slate-900">{it.amount?.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                <tr>
                  <td colSpan={7} className="p-2.5 text-right text-slate-700">공급가액 합계</td>
                  <td className="p-2.5 text-right text-slate-900">{costReport.subtotal.toLocaleString()}원</td>
                </tr>
                <tr>
                  <td colSpan={7} className="p-2 text-right text-slate-700">부가가치세 (10%)</td>
                  <td className="p-2 text-right text-slate-900">{costReport.vat.toLocaleString()}원</td>
                </tr>
                <tr className="bg-sky-50 text-sky-900 text-sm font-black border-t-2 border-slate-400">
                  <td colSpan={7} className="p-3 text-right">총 인쇄 견적금액 (부당 {costReport.perBookPrice.toLocaleString()}원)</td>
                  <td className="p-3 text-right text-sky-700">{costReport.totalAmount.toLocaleString()}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── 하단 고정 종합 견적 바 ── */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t shadow-2xl py-3 px-4 sm:px-8 transition-colors ${
        costingMode === 'GOVERNMENT'
          ? 'bg-slate-900/95 border-teal-500 text-white'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div>
              <span className={`text-[11px] block font-medium ${costingMode === 'GOVERNMENT' ? 'text-slate-400' : 'text-slate-500'}`}>
                {costingMode === 'GOVERNMENT' ? '공급가액 (11단계)' : '공급가액'}
              </span>
              <span className={`text-sm font-bold ${costingMode === 'GOVERNMENT' ? 'text-teal-300' : 'text-slate-800'}`}>
                ₩ {activeSubtotal.toLocaleString()}
              </span>
            </div>

            <div>
              <span className={`text-[11px] block font-medium ${costingMode === 'GOVERNMENT' ? 'text-slate-400' : 'text-slate-500'}`}>
                부가세 (10%)
              </span>
              <span className={`text-sm font-bold ${costingMode === 'GOVERNMENT' ? 'text-slate-300' : 'text-slate-600'}`}>
                ₩ {activeVat.toLocaleString()}
              </span>
            </div>

            <div className="pl-3 border-l border-slate-400/40">
              <span className={`text-[11px] block font-medium ${costingMode === 'GOVERNMENT' ? 'text-slate-400' : 'text-slate-500'}`}>
                {costingMode === 'GOVERNMENT' ? '계약 부당단가' : '부당 단가'}
              </span>
              <span className={`text-base font-black ${costingMode === 'GOVERNMENT' ? 'text-emerald-400' : 'text-sky-600'}`}>
                {activeUnitPrice.toLocaleString()} <span className="text-xs font-bold text-slate-400">원/부</span>
              </span>
            </div>

            <div className="pl-3 border-l border-slate-400/40">
              <span className={`text-[11px] block font-bold ${costingMode === 'GOVERNMENT' ? 'text-teal-300' : 'text-sky-800'}`}>
                {costingMode === 'GOVERNMENT' ? '최종 계약금액 (88% 낙찰하한율, 절사)' : '최종 견적합계 (VAT포함)'}
              </span>
              <div className="flex items-baseline space-x-2">
                <span className={`text-xl sm:text-2xl font-black ${costingMode === 'GOVERNMENT' ? 'text-teal-300' : 'text-sky-700'}`}>
                  ₩ {activeTotalAmount.toLocaleString()}
                </span>
                {costingMode === 'GOVERNMENT' && (
                  <span className="text-xs text-slate-400">
                    (예정가격: ₩{governmentReport.step13_targetTotal.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {costingMode === 'GOVERNMENT' ? (
              <button
                type="button"
                onClick={() => setShowGovPrintModal(true)}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-teal-500 bg-teal-800/60 hover:bg-teal-700 text-teal-200 transition"
              >
                <FileText className="w-4 h-4" />
                <span>공문서 규격서</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSave(true)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                costingMode === 'GOVERNMENT'
                  ? 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className={`flex items-center space-x-1.5 px-5 py-2.5 text-xs font-black rounded-xl transition shadow-md ${
                costingMode === 'GOVERNMENT'
                  ? 'bg-teal-500 hover:bg-teal-600 text-slate-950 font-black'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{costingMode === 'GOVERNMENT' ? '🏛️ 조달 표준원가 확정 저장' : '🏢 견적서 확정 저장'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 인쇄 모달 (사기업 실무 견적) */}
      {showPrintModal && (
        <EstimatePrintViewModal
          estimate={{
            estimateNo: estimateNo || 'EST-DRAFT',
            version: initialEstimate?.version || 1,
            isFinal: initialEstimate?.isFinal || false,
            costingMode,
            clientName,
            clientDept,
            contactName,
            phone,
            productName,
            quantity,
            unit: '부',
            paperCut,
            sizeWidth: 0,
            sizeHeight: 0,
            pages: totalPages,
            colors: `표지: ${coverColor}(${coverSide}) / 본문: ${bodyColor}(${bodySide})`,
            bindingType: `${bindingType} (${bindingDirection})`,
            paperType: `표지: ${coverPaperName} ${coverWeight}g / 본문: ${bodyPaperName} ${bodyWeight}g`,
            finishingOptions: hasCoating ? coatingType : '없음',
            subtotal: activeSubtotal,
            vat: activeVat,
            totalAmount: activeTotalAmount,
            unitPrice: activeUnitPrice,
            notes,
            items: compileDetailedItems(),
            authorName: writerName || user?.userName || '영업담당',
            createdAt: regDate,
            governmentReport: costingMode === 'GOVERNMENT' ? governmentReport : null,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* 🏛️ 조달청·교육청 공공 인쇄원가계산서 / 규격서 모달 */}
      {showGovPrintModal && (
        <GovernmentCostModal
          estimate={{
            estimateNo: estimateNo || 'EST-GOV-DRAFT',
            version: initialEstimate?.version || 1,
            isFinal: initialEstimate?.isFinal || false,
            costingMode: 'GOVERNMENT',
            clientName,
            clientDept,
            contactName,
            phone,
            productName,
            quantity,
            paperCut,
            printType,
            bindingType,
            coverPaperName,
            coverWeight,
            coverUnitPrice,
            coverPages,
            coverColor,
            coverSide,
            bodyPaperName,
            bodyWeight,
            bodyUnitPrice,
            bodyPages,
            bodyColor,
            bodySide,
            hasSupplement,
            suppPaperName,
            suppWeight,
            suppUnitPrice,
            suppPages,
            suppColor,
            suppSide,
            hasCoating,
            coatingType,
            hasFoil,
            hasDiecut,
            notes,
            regDate,
            proofDate,
            deliveryDate,
            writerTitle,
            writerName,
            totalAmount: governmentReport.step14_contractAmount,
            governmentReport,
          }}
          onClose={() => setShowGovPrintModal(false)}
        />
      )}

    </div>
  );
}
