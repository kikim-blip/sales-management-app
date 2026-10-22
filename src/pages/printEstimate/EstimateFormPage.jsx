// src/pages/printEstimate/EstimateFormPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Save, Download, ArrowLeft, Check,
  FileCheck2, ShoppingCart, Printer, Search, X,
  ShieldCheck, Building2, Calculator, Info, FileText,
  Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Sparkles,
  TrendingDown, TrendingUp, Layers, BookOpen, Package, Truck, Wrench
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import {
  getMasterPapers,
  saveEstimate,
  createEstimateVersion,
  exportEstimateDetailToExcel,
  getGovernmentMasterRates,
} from '../../services/printEstimateStorage';
import {
  calculateFullCost,
  calculateDeviation,
  calculateDamjiCost
} from '../../utils/printCalculators/multiPartCalculator';
import {
  calculateGovernmentCost,
  GOVERNMENT_STD_RATES
} from '../../utils/printCalculators/governmentCostCalculator';
import EstimatePrintViewModal from './EstimatePrintViewModal';
import GovernmentCostModal from './GovernmentCostModal';

export default function EstimateFormPage({ initialEstimate = null, onBack, onSaved }) {
  const { customers, contacts, addJobOrder, addSales } = useData();
  const { user } = useGoogleAuth();
  const [papers] = useState(() => getMasterPapers());
  const [govMasterRates] = useState(() => getGovernmentMasterRates());

  // ── 0. 견적 모드 (기본: 'GOVERNMENT' 조달·공공기관 표준인쇄원가, 필요시 'COMMERCIAL' 사기업 실무견적) ──
  const [costingMode, setCostingMode] = useState(initialEstimate?.costingMode || 'GOVERNMENT');

  // 조달·공공 표준 원가 법정 가산율 (단가 마스터 연동)
  const [manageRate, setManageRate] = useState(initialEstimate?.manageRate ?? govMasterRates?.defaultManageRate ?? 5);
  const [profitRate, setProfitRate] = useState(initialEstimate?.profitRate ?? govMasterRates?.defaultProfitRate ?? 10);
  const [contractRate, setContractRate] = useState(initialEstimate?.contractRate ?? govMasterRates?.defaultContractRate ?? 88);
  const [showGovPrintModal, setShowGovPrintModal] = useState(false);

  // ── 1. 기본 선택 정보 ──
  const [estimateNo] = useState(initialEstimate?.estimateNo || '');
  const [regDate, setRegDate] = useState(initialEstimate?.regDate || new Date().toISOString().slice(0, 10));

  const [proofDate, setProofDate] = useState(initialEstimate?.proofDate || '');
  const [deliveryDate, setDeliveryDate] = useState(initialEstimate?.deliveryDate || '');
  const [writerTitle, setWriterTitle] = useState(initialEstimate?.writerTitle || '담당자');
  const [writerName, setWriterName] = useState(initialEstimate?.writerName || user?.userName || user?.name || '');
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
  const [printType, setPrintType] = useState(initialEstimate?.printType || '옵셋인쇄');
  const [printCategory, setPrintCategory] = useState(initialEstimate?.printCategory || '책자');
  const [quantity, setQuantity] = useState(initialEstimate?.quantity || 1000);
  const [paperCut, setPaperCut] = useState(initialEstimate?.paperCut || '국배판(A4)');

  // 용지대 포함 여부 (includePaper 플래그: true면 자사 구입, false면 거래처 입고/사급)
  const [includePaper, setIncludePaper] = useState(initialEstimate?.includePaper ?? true);

  // 제본 방식 상세 (4종 무선 산식: 무선단본, 무선 2탑, 무선날개, 책속책, 중철, 양장, 스프링)
  const [bindingType, setBindingType] = useState(initialEstimate?.bindingType || '무선제본');
  const [bindingDetailType, setBindingDetailType] = useState(
    initialEstimate?.bindingDetailType ||
    (initialEstimate?.bindingType?.includes('2탑') ? '무선 2탑 제본' :
     initialEstimate?.bindingType?.includes('날개') ? '무선날개제본' :
     initialEstimate?.bindingType?.includes('책속책') ? '책속책제본' :
     initialEstimate?.bindingType?.includes('중철') ? '중철제본' :
     initialEstimate?.bindingType?.includes('양장') ? '양장제본' : '무선제본')
  );
  const [bindingDirection, setBindingDirection] = useState(initialEstimate?.bindingDirection || '좌철');
  const [foldType, setFoldType] = useState(initialEstimate?.foldType || '3단 접지'); // 리플렛 접지 방식

  // 출판사 제본 댐지대 (정합비: 부수 / 7.5 × 110원)
  const [hasDamji, setHasDamji] = useState(initialEstimate?.hasDamji ?? false);

  // 2탑 제본 / 무선날개 / 책속책 세부 면수
  const [cover2Pages, setCover2Pages] = useState(initialEstimate?.cover2Pages ?? 4); // 2탑 해설 표지
  const [body2Pages, setBody2Pages] = useState(initialEstimate?.body2Pages ?? 0);   // 2탑 해설 본문
  const [adPages, setAdPages] = useState(initialEstimate?.adPages ?? 2);           // 무선날개 광고/날개면
  const [innerCoverPages, setInnerCoverPages] = useState(initialEstimate?.innerCoverPages ?? 4); // 책속책 속표지
  const [innerBodyPages, setInnerBodyPages] = useState(initialEstimate?.innerBodyPages ?? 0);   // 책속책 속본문

  // 무선제본 계수 및 기본단가 미세조정 (실무 기본값: 계수 0.8 / 기본 130원)
  const [bindingCoefficient, setBindingCoefficient] = useState(initialEstimate?.bindingCoefficient ?? 0.8);
  const [bindingBasePrice, setBindingBasePrice] = useState(initialEstimate?.bindingBasePrice ?? 130);

  // ── 3. 후가공 옵션 체크박스 및 단가 (실무 기준 단가) ──
  const [hasCoating, setHasCoating] = useState(initialEstimate?.hasCoating ?? true);
  const [coatingType, setCoatingType] = useState(initialEstimate?.coatingType || '무광코팅');

  // 박 가공
  const [hasHoloFoil, setHasHoloFoil] = useState(initialEstimate?.hasHoloFoil ?? false); // 홀박 (30원/부)
  const [holoFoilUnitPrice, setHoloFoilUnitPrice] = useState(initialEstimate?.holoFoilUnitPrice ?? 30);

  const [hasHotFoil, setHasHotFoil] = useState(initialEstimate?.hasHotFoil ?? initialEstimate?.hasFoil ?? false); // 열박 (기본 10만 + 부당가)
  const [hotFoilBasePrice, setHotFoilBasePrice] = useState(initialEstimate?.hotFoilBasePrice ?? 100000);
  const [hotFoilUnitPrice, setHotFoilUnitPrice] = useState(initialEstimate?.hotFoilUnitPrice ?? 0);

  // 판대 / 목형
  const [hasDie, setHasDie] = useState(initialEstimate?.hasDie ?? initialEstimate?.hasDiecut ?? false); // 목형대 (200,000원)
  const [hasCopper, setHasCopper] = useState(initialEstimate?.hasCopper ?? false); // 형압 동판대 (35,000원)
  const [hasResin, setHasResin] = useState(initialEstimate?.hasResin ?? false);   // 수지판대 (60,000원)

  // 톰슨 / 에폭시 / 미니필라스 / 스티커
  const [hasThomson, setHasThomson] = useState(initialEstimate?.hasThomson ?? false); // 톰슨 타발 (26,000원/R)
  const [hasEpoxy, setHasEpoxy] = useState(initialEstimate?.hasEpoxy ?? false); // 에폭시 (130원/장)
  const [hasMinipillar, setHasMinipillar] = useState(initialEstimate?.hasMinipillar ?? false); // 미니필라스 (95원/장)
  const [hasStickerMerge, setHasStickerMerge] = useState(initialEstimate?.hasStickerMerge ?? false); // 스티커정합 (10원/부)

  // 특수 인쇄 옵션
  const [isBetaPrint, setIsBetaPrint] = useState(initialEstimate?.isBetaPrint || false);
  const [isSpotColor, setIsSpotColor] = useState(initialEstimate?.isSpotColor || false);
  const [hasCoverSpecial, setHasCoverSpecial] = useState(initialEstimate?.hasCoverSpecial || false);
  const [hasSupplement, setHasSupplement] = useState(initialEstimate?.hasSupplement || false);
  const [hasTypesetDiscount, setHasTypesetDiscount] = useState(initialEstimate?.hasTypesetDiscount ?? true); // 경인쇄 조판생략 감액 여부

  // ── 4. 표지 선택정보 ──
  const [coverPaperName, setCoverPaperName] = useState(initialEstimate?.coverPaperName || '아트지');
  const [coverWeight, setCoverWeight] = useState(initialEstimate?.coverWeight || 200);
  const [coverUnitPrice, setCoverUnitPrice] = useState(initialEstimate?.coverUnitPrice || 94000);
  const [coverPages, setCoverPages] = useState(initialEstimate?.coverPages ?? 4);
  const [coverColor, setCoverColor] = useState(initialEstimate?.coverColor || '4도');
  const [coverSide, setCoverSide] = useState(initialEstimate?.coverSide || '단면');
  const [coverTypesetPages, setCoverTypesetPages] = useState(initialEstimate?.coverTypesetPages ?? 1);
  const [coverBlankPages, setCoverBlankPages] = useState(initialEstimate?.coverBlankPages ?? 0);
  const [coverTypesetRate, setCoverTypesetRate] = useState(initialEstimate?.coverTypesetRate ?? 0);

  // ── 5. 본문 선택정보 ──
  const [bodyPaperName, setBodyPaperName] = useState(initialEstimate?.bodyPaperName || '백상지');
  const [bodyWeight, setBodyWeight] = useState(initialEstimate?.bodyWeight || 80);
  const [bodyUnitPrice, setBodyUnitPrice] = useState(initialEstimate?.bodyUnitPrice || 46136);
  const [bodyPages, setBodyPages] = useState(initialEstimate?.bodyPages ?? 64);
  const [bodyColor, setBodyColor] = useState(initialEstimate?.bodyColor || '1도');
  const [bodySide, setBodySide] = useState(initialEstimate?.bodySide || '양면');
  const [bodyTypesetPages, setBodyTypesetPages] = useState(initialEstimate?.bodyTypesetPages ?? 0);
  const [bodyBlankPages, setBodyBlankPages] = useState(initialEstimate?.bodyBlankPages ?? 0);
  const [bodyTypesetRate, setBodyTypesetRate] = useState(initialEstimate?.bodyTypesetRate ?? 0);

  // ── 6. 화보/부속 선택정보 ──
  const [suppPaperName, setSuppPaperName] = useState(initialEstimate?.suppPaperName || '스노우지');
  const [suppWeight, setSuppWeight] = useState(initialEstimate?.suppWeight || 120);
  const [suppUnitPrice, setSuppUnitPrice] = useState(initialEstimate?.suppUnitPrice || 57000);
  const [suppPages, setSuppPages] = useState(initialEstimate?.suppPages ?? 8);
  const [suppColor, setSuppColor] = useState(initialEstimate?.suppColor || '4도');
  const [suppSide, setSuppSide] = useState(initialEstimate?.suppSide || '양면');

  // ── 7. 기타 선택정보 ──
  const [discountOrAdd, setDiscountOrAdd] = useState(initialEstimate?.discountOrAdd || 0);
  const [discountReason, setDiscountReason] = useState(initialEstimate?.discountReason || '');
  const [deliveryCost, setDeliveryCost] = useState(initialEstimate?.deliveryCost ?? 50000);
  const [packagingCost, setPackagingCost] = useState(initialEstimate?.packagingCost ?? (Math.ceil((initialEstimate?.quantity || 1000) / 50) * 1000));
  const [notes, setNotes] = useState(initialEstimate?.notes || '');

  // ── 8. 사용자 정의 추가 항목 (각 카테고리별 커스텀 아이템) ──
  const [customItems, setCustomItems] = useState(() => {
    if (Array.isArray(initialEstimate?.customItems)) return initialEstimate.customItems;
    if (Array.isArray(initialEstimate?.items)) {
      return initialEstimate.items.filter(it => it.isCustom);
    }
    return [];
  });

  // 커스텀 항목 추가 모달 상태
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('OTHER');
  const [customName, setCustomName] = useState('');
  const [customSpec, setCustomSpec] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customUnit, setCustomUnit] = useState('식');
  const [customPrice, setCustomPrice] = useState(0);

  // UI 상태
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ── 거래처 실시간 검색 결과 (과명, 이름, 전화번호 즉시 매칭) ──
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

  // ── 표지/본문 지종 변경 시 단가 자동 매칭 ──
  const handleCoverPaperChange = (name) => {
    setCoverPaperName(name);
    const found = papers.find(p => p.name.includes(name) || p.type.includes(name));
    if (found) {
      setCoverWeight(found.weight);
      setCoverUnitPrice(found.unitPrice);
    }
  };

  const handleBodyPaperChange = (name) => {
    setBodyPaperName(name);
    const found = papers.find(p => p.name.includes(name) || p.type.includes(name));
    if (found) {
      setBodyWeight(found.weight);
      setBodyUnitPrice(found.unitPrice);
    }
  };

  // ── 인쇄 방식 변경 핸들러 (jne.go.kr 규칙 정밀 반영) ──
  const handlePrintTypeChange = (newType) => {
    setPrintType(newType);

    if (newType === '경인쇄') {
      // 1. 경인쇄는 책자만 선택 가능 (jne.go.kr 규정: 화보집/리플렛/포스터/전단 비활성화)
      if (printCategory !== '책자') {
        setPrintCategory('책자');
        if (bodyPages === 0) setBodyPages(64);
        setCoverPages(4);
        setBindingType('무선제본');
        setBindingDetailType('무선제본');
      }
      // 2. 경인쇄 본문 도수는 1도(먹) 고정
      setBodyColor('1도');
      // 3. 경인쇄는 베다인쇄, 특수별색, 화보 비활성화 및 초기화
      setIsBetaPrint(false);
      setIsSpotColor(false);
      setHasSupplement(false);
    } else if (newType === '디지털인쇄') {
      // 디지털인쇄는 CTP 0판/0원, 베다/별색 가산 비활성화
      setIsBetaPrint(false);
      setIsSpotColor(false);
    }
  };

  // ── 인쇄물 종류 변경 핸들러 (jne.go.kr 규칙 정밀 반영) ──
  const handlePrintCategoryChange = (newCat) => {
    // 경인쇄일 때는 책자 이외 선택 불가
    if (printType === '경인쇄' && newCat !== '책자') {
      alert('경인쇄(마스터인쇄) 방식은 [책자] 인쇄물만 제작 가능합니다.\n(화보집, 리플렛, 포스터, 전단은 옵셋인쇄 또는 디지털인쇄를 선택해주세요)');
      return;
    }

    setPrintCategory(newCat);

    if (newCat === '리플렛') {
      // 리플렛: 본문(내지) 없음(0면), 화보 없음, 표지(리플렛 기본 6면, 양면)
      setBodyPages(0);
      setHasSupplement(false);
      setCoverPages(6);
      setCoverSide('양면');
      setBindingType('접지');
      setBindingDetailType('3단 접지');
      setFoldType('3단 접지');
    } else if (newCat === '포스터') {
      // 포스터: 본문 없음(0면), 화보 없음, 단면 인쇄 고정, 제본 없음(재단 15,000원)
      setBodyPages(0);
      setHasSupplement(false);
      setCoverPages(1);
      setCoverSide('단면');
      setBindingType('해당없음(재단)');
      setBindingDetailType('해당없음(재단)');
    } else if (newCat === '전단') {
      // 전단: 본문 없음(0면), 화보 없음, 제본 없음
      setBodyPages(0);
      setHasSupplement(false);
      setCoverPages(2);
      setBindingType('해당없음(재단)');
      setBindingDetailType('해당없음(재단)');
    } else {
      // 책자 / 화보집
      if (bodyPages === 0) setBodyPages(64);
      if (coverPages < 4) setCoverPages(4);
      if (bindingType === '해당없음(재단)' || bindingType === '접지') {
        setBindingType('무선제본');
        setBindingDetailType('무선제본');
      }
      if (newCat === '화보집') {
        setCoverColor('4도');
        if (printType !== '경인쇄') {
          setBodyColor('4도');
        }
      }
    }
  };

  // ── 제본 방식 변경 시 계수/기본단가 자동 설정 ──
  const handleBindingDetailChange = (type) => {
    setBindingDetailType(type);
    setBindingType(type);
    if (type === '무선 2탑 제본' || type === '무선제본') {
      setBindingCoefficient(0.8);
      setBindingBasePrice(130);
    } else if (type === '무선날개제본') {
      setBindingCoefficient(0.45);
      setBindingBasePrice(30);
    } else if (type === '책속책제본') {
      setBindingCoefficient(0.35);
      setBindingBasePrice(35);
    }
  };

  // ── 총 면수 자동 계산 ──
  const totalPages = coverPages + bodyPages +
    (hasSupplement ? suppPages : 0) +
    (bindingDetailType === '무선 2탑 제본' ? body2Pages : 0) +
    (bindingDetailType === '책속책제본' ? innerBodyPages : 0);

  // ── 🏢 사기업 실무 견적 정밀 계산 엔진 (6대 공정) ──
  const costReport = useMemo(() => {
    return calculateFullCost({
      general: {
        quantity,
        paperCut,
        printType,
        printCategory,
        bindingType,
        bindingDetailType,
        bindingDirection,
        foldType,
        includePaper,
        hasDamji,
        ctpUnitPrice: 6500,
        bindingCoefficient,
        bindingBasePrice,
      },
      cover: {
        pages: coverPages,
        blankPages: coverBlankPages,
        typesetPages: coverTypesetPages,
        typesetRate: coverTypesetRate,
        typesetUnitPrice: 25000,
        colorCount: coverColor === '4도' ? 4 : coverColor === '2도' ? 2 : coverColor === '5도' ? 5 : 1,
        isDoubleSided: coverSide === '양면',
        paperName: coverPaperName,
        paperWeight: coverWeight,
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
        paperName: bodyPaperName,
        paperWeight: bodyWeight,
        paperUnitPrice: bodyUnitPrice,
      },
      supplement: {
        pages: suppPages,
        colorCount: suppColor === '4도' ? 4 : 2,
        isDoubleSided: suppSide === '양면',
        paperName: suppPaperName,
        paperWeight: suppWeight,
        paperUnitPrice: suppUnitPrice,
      },
      body2: {
        pages: body2Pages,
        colorCount: 1,
        isDoubleSided: true,
        paperName: bodyPaperName,
        paperWeight: bodyWeight,
        paperUnitPrice: bodyUnitPrice,
      },
      cover2: {
        pages: cover2Pages,
      },
      ad: {
        pages: adPages,
      },
      innerCover: {
        pages: innerCoverPages,
      },
      innerBody: {
        pages: innerBodyPages,
      },
      options: {
        hasCoating,
        coatingType,
        hasSupplement,
        isBetaPrint,
        isSpotColor,
        hasHoloFoil,
        holoFoilUnitPrice,
        hasHotFoil,
        hotFoilBasePrice,
        hotFoilUnitPrice,
        hasDie,
        dieCost: 200000,
        hasCopper,
        copperCost: 35000,
        hasResin,
        resinCost: 60000,
        hasThomson,
        thomsonUnitPrice: 26000,
        hasEpoxy,
        epoxyUnitPrice: 130,
        hasMinipillar,
        minipillarUnitPrice: 95,
        hasStickerMerge,
      },
      extra: {
        deliveryCost,
        packagingCost,
        discountOrAdd,
        discountReason,
      },
      customItems,
    });
  }, [
    quantity, paperCut, printType, printCategory, bindingType, foldType, bindingDetailType, bindingDirection, foldType,
    includePaper, hasDamji, bindingCoefficient, bindingBasePrice,
    coverPages, coverBlankPages, coverTypesetPages, coverTypesetRate, coverColor, coverSide, coverPaperName, coverWeight, coverUnitPrice,
    bodyPages, bodyBlankPages, bodyTypesetPages, bodyTypesetRate, bodyColor, bodySide, bodyPaperName, bodyWeight, bodyUnitPrice,
    hasSupplement, suppPages, suppColor, suppSide, suppPaperName, suppWeight, suppUnitPrice,
    body2Pages, cover2Pages, adPages, innerCoverPages, innerBodyPages,
    hasCoating, coatingType, isBetaPrint, isSpotColor,
    hasHoloFoil, holoFoilUnitPrice, hasHotFoil, hotFoilBasePrice, hotFoilUnitPrice,
    hasDie, hasCopper, hasResin, hasThomson, hasEpoxy, hasMinipillar, hasStickerMerge,
    deliveryCost, packagingCost, discountOrAdd, discountReason, customItems
  ]);

  // ── 🏛️ 조달청 공인 표준원가 실시간 연산 엔진 (14단계 법정 산식) ──
  const governmentReport = useMemo(() => {
    return calculateGovernmentCost({
      general: {
        quantity,
        paperCut,
        printType,
        printCategory,
        bindingType,
        foldType,
      },
      cover: {
        pages: coverPages,
        blankPages: coverBlankPages,
        typesetPages: coverTypesetPages,
        typesetRate: coverTypesetRate,
        typesetUnitPrice: 25000,
        colorCount: coverColor === '4도' ? 4 : coverColor === '2도' ? 2 : coverColor === '5도' ? 5 : 1,
        color: coverColor,
        paperName: coverPaperName,
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
        color: bodyColor,
        paperName: bodyPaperName,
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
        hasFoil: hasHotFoil || hasHoloFoil,
        foilCost: hotFoilCostEstimate(hotFoilBasePrice, hotFoilUnitPrice, quantity, hasHoloFoil),
        hasDiecut: hasDie || hasThomson,
        diecutCost: (hasDie ? 200000 : 0) + (hasThomson ? 50000 : 0),
        hasTypesetDiscount,
      },
      rates: {
        manageRate,
        profitRate,
        contractRate,
        masterRates: govMasterRates,
      },
    });
  }, [
    quantity, paperCut, printType, printCategory, bindingType, foldType,
    coverPages, coverBlankPages, coverTypesetPages, coverTypesetRate, coverColor, coverSide, coverUnitPrice, coverWeight, coverPaperName,
    bodyPages, bodyBlankPages, bodyTypesetPages, bodyTypesetRate, bodyColor, bodySide, bodyUnitPrice, bodyWeight, bodyPaperName,
    hasSupplement, suppPages, suppColor, suppSide, suppUnitPrice, suppWeight,
    hasCoating, coatingType, isBetaPrint, isSpotColor, hasHotFoil, hasHoloFoil, hotFoilBasePrice, hotFoilUnitPrice, hasDie, hasThomson,
    hasTypesetDiscount, manageRate, profitRate, contractRate, govMasterRates
  ]);

  function hotFoilCostEstimate(base, perUnit, q, holo) {
    let sum = 0;
    if (base) sum += base;
    if (perUnit) sum += perUnit * q;
    if (holo) sum += 30 * q;
    return sum || 120000;
  }

  // 현재 모드에 따른 최종 총액 및 부당단가
  const activeSubtotal = costingMode === 'GOVERNMENT' ? governmentReport.step11_supplyPrice : costReport.subtotal;
  const activeVat = costingMode === 'GOVERNMENT' ? governmentReport.step12_vat : costReport.vat;
  const activeTotalAmount = costingMode === 'GOVERNMENT' ? governmentReport.step14_contractAmount : costReport.totalAmount;
  const activeUnitPrice = costingMode === 'GOVERNMENT' ? governmentReport.perBookContractPrice : costReport.perBookPrice;

  // ── 커스텀 항목 추가 핸들러 ──
  const handleOpenAddCustomModal = (category) => {
    setCustomCategory(category);
    setCustomName('');
    setCustomSpec('');
    setCustomQty(1);
    setCustomUnit('식');
    setCustomPrice(0);
    setShowCustomModal(true);
  };

  const handleSaveCustomItem = () => {
    if (!customName.trim()) {
      alert('항목명을 입력해주세요.');
      return;
    }
    const newItem = {
      id: `custom_${Date.now()}`,
      category: customCategory,
      name: customName.trim(),
      spec: customSpec.trim(),
      quantity: Number(customQty) || 1,
      unit: customUnit || '식',
      unitPrice: Number(customPrice) || 0,
      amount: (Number(customQty) || 1) * (Number(customPrice) || 0),
      isCustom: true,
    };
    setCustomItems(prev => [...prev, newItem]);
    setShowCustomModal(false);
    triggerToast(`[${newItem.name}] 항목이 추가되었습니다.`);
  };

  const handleDeleteCustomItem = (id) => {
    setCustomItems(prev => prev.filter(it => it.id !== id));
    triggerToast('항목이 삭제되었습니다.');
  };

  // ── 저장 핸들러 ──
  const handleSave = (isDraft = false) => {
    if (!productName.trim()) {
      alert('인쇄물 명칭(품명)을 입력해주세요.');
      return;
    }

    const items = costReport.allItems;
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
      includePaper,
      bindingType,
      bindingDetailType,
      bindingDirection,
      hasDamji,
      bindingCoefficient,
      bindingBasePrice,
      cover2Pages,
      body2Pages,
      adPages,
      innerCoverPages,
      innerBodyPages,
      hasCoating,
      coatingType,
      hasHoloFoil,
      holoFoilUnitPrice,
      hasHotFoil,
      hotFoilBasePrice,
      hotFoilUnitPrice,
      hasDie,
      hasCopper,
      hasResin,
      hasThomson,
      hasEpoxy,
      hasMinipillar,
      hasStickerMerge,
      isBetaPrint,
      isSpotColor,
      hasCoverSpecial,
      hasSupplement,
      hasTypesetDiscount,
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
      customItems,
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
      triggerToast(costingMode === 'GOVERNMENT' ? '🏛️ 조달청 공공 표준원가 견적서가 저장되었습니다.' : '🏢 사기업 실무 견적서가 저장되었습니다.');
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
      binding_type: `${bindingDetailType} (${bindingDirection})`,
      paper_spec: includePaper
        ? `표지: ${coverPaperName} ${coverWeight}g / 본문: ${bodyPaperName} ${bodyWeight}g`
        : `거래처 사급/입고 (표지: ${coverPaperName} / 본문: ${bodyPaperName})`,
      post_process: hasCoating ? coatingType : '없음',
      order_price: activeTotalAmount,
      special_notes: costingMode === 'GOVERNMENT'
        ? `[조달청 공공 표준원가 연계 - 계약금액 ₩${activeTotalAmount.toLocaleString()}]\n예정가격: ₩${governmentReport.step13_targetTotal.toLocaleString()}원 / 권당: ₩${activeUnitPrice.toLocaleString()}원\n${notes || ''}`
        : `[실무 인쇄 견적서 연계]\n부당단가: ${activeUnitPrice.toLocaleString()}원 (용지대: ${includePaper ? '포함' : '거래처 사급/입고'})\n${notes || ''}`,
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
      spec: `${paperCut} ${totalPages}p ${bindingDetailType}`,
      quantity,
      unit_price: activeUnitPrice,
      supply_amount: activeSubtotal,
      vat: activeVat,
      total_amount: activeTotalAmount,
      contact_person: contactName || '',
      manager: writerName || user?.userName || '영업담당',
      status: '미수',
      remarks: costingMode === 'GOVERNMENT' ? `[조달청 공공 표준원가 연계]` : `[실무 인쇄 견적 연계]`,
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

  // ── 편차율 렌더 뱃지 헬퍼 ──
  const renderDeviationBadge = (dev) => {
    if (dev === undefined || dev === null || dev === 0) return null;
    if (dev < 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          <TrendingDown className="w-3 h-3 mr-0.5" />
          표준대비 {dev}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        표준대비 +{dev}%
      </span>
    );
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

      {/* ── 최상단 헤더 바 & 견적 모드 전환 탭 ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
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
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              인쇄 견적서 작성
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                costingMode === 'GOVERNMENT'
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {costingMode === 'GOVERNMENT' ? '국가계약법 14단계 표준원가' : '사기업 6대 실무 공정'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {estimateNo || '신규 견적'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 견적 모드 전환 토글 (조달·공공 표준 기본) ── */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setCostingMode('GOVERNMENT')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs transition ${
              costingMode === 'GOVERNMENT'
                ? 'bg-teal-700 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>조달·공공기관 표준인쇄원가 (기본)</span>
          </button>

          <button
            type="button"
            onClick={() => setCostingMode('COMMERCIAL')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs transition ${
              costingMode === 'COMMERCIAL'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>사기업 실무견적</span>
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportEstimateDetailToExcel({
              estimateNo, clientName, contactName, productName, quantity, unit: '부',
              sizeWidth: 0, sizeHeight: 0, paperCut, pages: totalPages,
              colors: `표지 ${coverColor} / 본문 ${bodyColor}`, bindingType: bindingDetailType,
              paperType: includePaper ? `표지: ${coverPaperName} / 본문: ${bodyPaperName}` : `거래처 사급/입고 (0원)`,
              subtotal: activeSubtotal, vat: activeVat, totalAmount: activeTotalAmount, unitPrice: activeUnitPrice,
              items: costReport.allItems, notes
            })}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>엑셀</span>
          </button>

          {costingMode === 'GOVERNMENT' ? (
            <button
              type="button"
              onClick={() => setShowGovPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-black rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>공공 원가계산서/규격서 인쇄</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-black rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>실무 견적서 인쇄</span>
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

          {initialEstimate?.id && (
            <button
              type="button"
              onClick={() => {
                setSaveAsNewVersion(true);
                setTimeout(() => handleSave(), 50);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-black rounded-xl border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 transition shadow-sm"
              title="새로운 버전(차수)으로 분기 저장"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>차수 분기 저장</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>견적서 저장</span>
          </button>
        </div>
      </div>

      {/* ── 🏛️ 조달·공공기관 표준 원가 법정 가산율 패널 (공공기관 모드 활성화 시 표시) ── */}
      {costingMode === 'GOVERNMENT' && (
        <div className="bg-gradient-to-r from-teal-50 via-teal-50/70 to-emerald-50 rounded-2xl border-2 border-teal-300 p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-teal-200 gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-black text-teal-950">
                  조달청 인쇄요금 원가계산 기준 (국가계약법 시행규칙 제6조)
                </span>
                <span className="text-xs text-teal-700 ml-2 hidden sm:inline">
                  (조달청 공인 표준 산식)
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

      {/* ── 1. 기본 선택 정보 ── */}
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

      {/* ── 2. 규격 및 실무 공정 핵심 옵션 ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>
              {costingMode === 'GOVERNMENT'
                ? '규격 및 공공 표준 공정 선택 (조달청 기준)'
                : '규격 및 실무 공정 선택'}
            </span>
          </span>
          {/* 용지대 포함/사급 토글 스위치 */}
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-sky-50 transition">
            <input
              type="checkbox"
              checked={includePaper}
              onChange={e => setIncludePaper(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
            <span className="text-xs font-black">
              {includePaper ? (
                <span className="text-emerald-700 font-black">✓ 용지대 포함 (자사 구입 인쇄)</span>
              ) : (
                <span className="text-amber-700 font-black">✕ 용지대 제외 (거래처 입고/사급 0원)</span>
              )}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* 1. 인쇄 방식 선택 (시험지인쇄 삭제, 옵셋/경인쇄/디지털인쇄 3종) */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">인쇄 방식:</span>
              {printType === '디지털인쇄' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  ⚡ CTP 판비 0원 (무판 Direct)
                </span>
              )}
              {printType === '경인쇄' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  🖨️ 책자 전용 / 본문 1도 고정
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 pt-0.5">
              {['옵셋인쇄', '경인쇄', '디지털인쇄'].map(t => (
                <label key={t} className="flex items-center space-x-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="printType"
                    value={t}
                    checked={printType === t}
                    onChange={e => handlePrintTypeChange(e.target.value)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className={printType === t ? 'font-black text-sky-700' : 'text-slate-600'}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. 인쇄물 종류 선택 (jne.go.kr 규칙: 경인쇄 선택 시 책자만 가능) */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">인쇄물 종류:</span>
              {printType === '경인쇄' && (
                <span className="text-[10px] text-amber-700 font-bold">
                  ※ 경인쇄는 책자만 선택 가능
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              {['책자', '화보집', '리플렛', '포스터', '전단'].map(c => {
                const isCatDisabled = printType === '경인쇄' && c !== '책자';
                return (
                  <label
                    key={c}
                    className={`flex items-center space-x-1.5 font-medium ${
                      isCatDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title={isCatDisabled ? '경인쇄는 책자만 지원됩니다' : ''}
                  >
                    <input
                      type="radio"
                      name="printCategory"
                      value={c}
                      disabled={isCatDisabled}
                      checked={printCategory === c}
                      onChange={() => handlePrintCategoryChange(c)}
                      className="text-sky-600 focus:ring-sky-500 disabled:opacity-40"
                    />
                    <span className={printCategory === c ? 'font-black text-sky-700' : 'text-slate-600'}>
                      {c}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* 경인쇄 전용 옵션 및 고시 요금 안내 패널 */}
        {printType === '경인쇄' && (
          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white">
                  경인쇄(마스터) 표준요금제
                </span>
                <span className="font-bold text-amber-950">
                  50부 기본단가 + 10부 초과요금 고시 산식 적용 중
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                표지(기본/지질/도수/코팅 가산매수) 및 본문 흑백 고시 단가로 자동 산출됩니다.
              </p>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3.5 py-2 rounded-lg border border-amber-300 shadow-sm hover:bg-amber-100/50 transition">
              <input
                type="checkbox"
                checked={hasTypesetDiscount}
                onChange={e => setHasTypesetDiscount(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <div className="text-left">
                <span className="font-bold text-amber-950 block">
                  원고 파일 제공 시 조판생략 감액 적용
                </span>
                <span className="text-[10px] text-amber-700">
                  {hasTypesetDiscount
                    ? `✓ 감액 적용: 본문 ${bodyPages}면 × -${(governmentReport?.lightReport?.unitDiscount || 2450).toLocaleString()}원 = -${Math.abs(governmentReport?.lightReport?.discountAmount || 0).toLocaleString()}원`
                    : '미적용 (조판비 정상 청구)'}
                </span>
              </div>
            </label>
          </div>
        )}

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
              <option value="국배판(A4)">국배판 (A4 / 국8절)</option>
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
              {totalPages} <span className="text-[11px] font-normal text-slate-500">Page</span>
            </div>
          </div>

          {/* 제본 또는 접지 형태 선택 (인쇄물 종류에 따라 분기) */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              {printCategory === '리플렛' ? '접지 형태 (리플렛)' : (printCategory === '포스터' || printCategory === '전단') ? '마감 형태 (낱장)' : '제본 형태 (실무 4종 산식)'}
            </label>

            {printCategory === '리플렛' ? (
              <select
                value={foldType}
                onChange={e => {
                  setFoldType(e.target.value);
                  setBindingDetailType(e.target.value);
                }}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-teal-800"
              >
                <option value="2단 접지">2단 접지 (반접기 4면)</option>
                <option value="3단 접지">3단 접지 (기본 6면)</option>
                <option value="4단 접지">4단 접지 (8면)</option>
                <option value="대문접지">대문접지 (6면/8면)</option>
                <option value="병풍접지">병풍접지 (6면/8면)</option>
              </select>
            ) : (printCategory === '포스터' || printCategory === '전단') ? (
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 font-bold text-slate-600 text-center">
                해당없음 (정밀재단 ₩15,000원)
              </div>
            ) : (
              <div className="flex space-x-1">
                <select
                  value={bindingDetailType}
                  onChange={e => handleBindingDetailChange(e.target.value)}
                  className="w-2/3 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                >
                  <option value="무선제본">무선제본 (단본)</option>
                  <option value="무선 2탑 제본">무선 2탑 제본 (본책+해설)</option>
                  <option value="무선날개제본">무선날개제본</option>
                  <option value="책속책제본">책속책제본</option>
                  <option value="중철제본">중철제본</option>
                  <option value="양장제본">양장제본 (하드커버)</option>
                  <option value="와이어스프링">와이어 스프링</option>
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
            )}
          </div>
        </div>

        {/* 제본/접지 세부 설정 패널 */}
        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-indigo-950 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>실무 제본/접지 산식: <strong>{costReport.sections.binding.formula}</strong></span>
            </span>

            {/* 책자/화보집인 경우에만 댐지대 표시 */}
            {(printCategory === '책자' || printCategory === '화보집') && (
              <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded-lg border border-indigo-300 hover:bg-indigo-100/50 transition">
                <input
                  type="checkbox"
                  checked={hasDamji}
                  onChange={e => setHasDamji(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-bold text-indigo-900">
                  출판사 댐지대(정합비) 포함 ({Math.round(quantity / 7.5).toLocaleString()}부 × 110원 = ₩{calculateDamjiCost(quantity).toLocaleString()}원)
                </span>
              </label>
            )}
          </div>

          {/* 2탑 제본인 경우 해설 면수 입력 */}
          {bindingDetailType === '무선 2탑 제본' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2.5 rounded-lg border border-indigo-200 animate-in fade-in">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">해설 표지 면수</label>
                <input
                  type="number"
                  value={cover2Pages}
                  onChange={e => setCover2Pages(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">해설 본문 면수</label>
                <input
                  type="number"
                  value={body2Pages}
                  onChange={e => setBody2Pages(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-indigo-700"
                />
              </div>
              <div className="col-span-2 flex items-center text-[11px] text-slate-600">
                <span>[{(coverPages + cover2Pages)}×2 + {bodyPages} + {body2Pages}] × {bindingCoefficient} + {bindingBasePrice}원/부 공식으로 자동 연산됩니다.</span>
              </div>
            </div>
          )}

          {/* 무선날개제본인 경우 광고/날개 면수 입력 */}
          {bindingDetailType === '무선날개제본' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2.5 rounded-lg border border-indigo-200 animate-in fade-in">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">날개/광고 면수</label>
                <input
                  type="number"
                  value={adPages}
                  onChange={e => setAdPages(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-indigo-700"
                />
              </div>
              <div className="col-span-3 flex items-center text-[11px] text-slate-600">
                <span>{`{(${coverPages} + ${adPages}) × 2} + ${bodyPages} × ${bindingCoefficient} + ${bindingBasePrice}원/부 공식으로 자동 연산됩니다.`}</span>
              </div>
            </div>
          )}

          {/* 책속책제본인 경우 속표지/속본문 면수 입력 */}
          {bindingDetailType === '책속책제본' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2.5 rounded-lg border border-indigo-200 animate-in fade-in">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">책속 속표지 면수</label>
                <input
                  type="number"
                  value={innerCoverPages}
                  onChange={e => setInnerCoverPages(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">책속 속본문 면수</label>
                <input
                  type="number"
                  value={innerBodyPages}
                  onChange={e => setInnerBodyPages(Number(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-indigo-700"
                />
              </div>
              <div className="col-span-2 flex items-center text-[11px] text-slate-600">
                <span>[({coverPages}+{innerCoverPages})×2 + {bodyPages} + {innerBodyPages}] × {bindingCoefficient} + {bindingBasePrice}원/부 공식으로 자동 연산됩니다.</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 후가공 세부 옵션 체크리스트 ── */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
          <div className="font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="flex items-center space-x-1">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              <span>후가공 세부 공정 (실무 단가):</span>
            </span>
            {hasCoating && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">코팅 종류:</span>
                <select
                  value={coatingType}
                  onChange={e => setCoatingType(e.target.value)}
                  className="p-1 border border-slate-300 rounded bg-white font-bold text-sky-700 text-[11px]"
                >
                  <option value="무광코팅">무광 라미네이팅 (57,000원/R)</option>
                  <option value="유광코팅">유광 라미네이팅 (48,000원/R)</option>
                  <option value="UV코팅">UV 코팅 (40,530원/R)</option>
                  <option value="부분UV코팅">부분 UV 코팅 (42,980원/R)</option>
                  <option value="엠보코팅">엠보 코팅 (100,000원/R)</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasCoating}
                onChange={e => setHasCoating(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>표지 코팅</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasHoloFoil}
                onChange={e => setHasHoloFoil(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>홀박 (30원/부)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasHotFoil}
                onChange={e => setHasHotFoil(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>열박 (기본 10만)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasDie}
                onChange={e => setHasDie(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>목형대 (20만)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasCopper}
                onChange={e => setHasCopper(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>형압 동판대 (3.5만)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasResin}
                onChange={e => setHasResin(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>수지판대 (6만)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasThomson}
                onChange={e => setHasThomson(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>톰슨 타발 (2.6만/R)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasEpoxy}
                onChange={e => setHasEpoxy(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>에폭시 (130원/장)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasMinipillar}
                onChange={e => setHasMinipillar(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>미니필라스 (95원/장)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer font-medium p-1 bg-white rounded border border-slate-200">
              <input
                type="checkbox"
                checked={hasStickerMerge}
                onChange={e => setHasStickerMerge(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>스티커정합 (10원/부)</span>
            </label>

            {/* 화보 삽입 (경인쇄 또는 리플렛/포스터/전단은 비활성화) */}
            <label className={`flex items-center space-x-1.5 p-1 rounded border ${
              (printType === '경인쇄' || printCategory === '리플렛' || printCategory === '포스터' || printCategory === '전단')
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                : 'cursor-pointer font-bold text-sky-700 bg-sky-50 border-sky-200'
            }`}>
              <input
                type="checkbox"
                disabled={printType === '경인쇄' || printCategory === '리플렛' || printCategory === '포스터' || printCategory === '전단'}
                checked={hasSupplement}
                onChange={e => setHasSupplement(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>화보 삽입 {printType === '경인쇄' ? '(경인쇄불가)' : ''}</span>
            </label>

            {/* 베다 인쇄 (+60%) (경인쇄 및 디지털인쇄 비활성화) */}
            <label className={`flex items-center space-x-1.5 p-1 rounded border ${
              (printType === '경인쇄' || printType === '디지털인쇄')
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                : 'cursor-pointer font-medium bg-white border-slate-200'
            }`}>
              <input
                type="checkbox"
                disabled={printType === '경인쇄' || printType === '디지털인쇄'}
                checked={isBetaPrint}
                onChange={e => setIsBetaPrint(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>베다 인쇄 (+60%)</span>
            </label>

            {/* 특수 별색 (+100%) (경인쇄 및 디지털인쇄 비활성화) */}
            <label className={`flex items-center space-x-1.5 p-1 rounded border ${
              (printType === '경인쇄' || printType === '디지털인쇄')
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                : 'cursor-pointer font-medium bg-white border-slate-200'
            }`}>
              <input
                type="checkbox"
                disabled={printType === '경인쇄' || printType === '디지털인쇄'}
                checked={isSpotColor}
                onChange={e => setIsSpotColor(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span>특수 별색 (+100%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── 3. [표지 / 낱장 사양 정보] (인쇄물 종류에 따라 표지/리플렛/포스터 동적 전환) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>
              {printCategory === '리플렛'
                ? '리플렛 사양 정보 (LEAFLET)'
                : printCategory === '포스터'
                ? '포스터 사양 정보 (POSTER)'
                : printCategory === '전단'
                ? '전단 사양 정보 (FLYER)'
                : '표지 사양 정보 (COVER)'}
            </span>
          </span>
          <span className="text-xs font-black text-sky-700">
            {printCategory === '리플렛' ? '리플렛' : (printCategory === '포스터' || printCategory === '전단') ? '출력' : '표지'} 소계: ₩ {(costReport.coverCalc.totalCost + (hasCoating ? costReport.coatingCost : 0)).toLocaleString()} 원
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
                <option value="백상지">백상지(모조)</option>
                <option value="레자크">레자크</option>
                <option value="마닐라">마닐라(SC)</option>
              </select>
              <select
                value={coverWeight}
                onChange={e => setCoverWeight(Number(e.target.value))}
                className="w-1/3 p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value={100}>100g</option>
                <option value={120}>120g</option>
                <option value={150}>150g</option>
                <option value={180}>180g</option>
                <option value={200}>200g</option>
                <option value={250}>250g</option>
                <option value={300}>300g</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              {printCategory === '리플렛' ? '접지 총면수 (Page)' : (printCategory === '포스터' || printCategory === '전단') ? '인쇄면수 (Page)' : '표지면수 (Page)'}
            </label>
            <input
              type="number"
              value={coverPages}
              onChange={e => setCoverPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 text-center"
            />
          </div>

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
                disabled={printCategory === '리플렛' || printCategory === '포스터'}
                onChange={e => setCoverSide(e.target.value)}
                className={`w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-medium ${
                  (printCategory === '리플렛' || printCategory === '포스터') ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                }`}
              >
                <option value="단면">단면</option>
                <option value="양면">양면</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">조판면수 (Page)</label>
            <input
              type="number"
              value={coverTypesetPages}
              onChange={e => setCoverTypesetPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">
              연당단가 (원/R) {!includePaper && <span className="text-amber-600 font-normal">(사급 제외)</span>}
            </label>
            <input
              type="number"
              disabled={!includePaper}
              value={coverUnitPrice}
              onChange={e => setCoverUnitPrice(Number(e.target.value) || 0)}
              className={`w-full p-2 border border-slate-300 rounded-lg font-black text-right ${
                includePaper ? 'bg-white text-sky-700' : 'bg-slate-100 text-slate-400 line-through'
              }`}
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">인쇄되지 않는 면 (백면)</label>
            <input
              type="number"
              value={coverBlankPages}
              onChange={e => setCoverBlankPages(Number(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
            />
          </div>

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

        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-4">
            <span>소요연수: <strong className="text-slate-800">{costReport.coverCalc.totalReams.toFixed(2)} R</strong></span>
            <span>
              CTP:&nbsp;
              {printType === '디지털인쇄' ? (
                <strong className="text-purple-700">0판 (무판 0원)</strong>
              ) : (
                <strong className="text-slate-800">{costReport.coverCalc.totalPlates} 판 (₩{costReport.coverCalc.ctpCost.toLocaleString()}원)</strong>
              )}
            </span>
            <span>인쇄비: <strong className="text-slate-800">₩{costReport.coverCalc.printCost.toLocaleString()}원</strong></span>
            <span>용지비: <strong className="text-slate-800">{includePaper ? `₩${costReport.coverCalc.paperCost.toLocaleString()}원` : '사급(0원)'}</strong></span>
          </div>
          {hasCoating && (
            <span className="text-amber-800 font-bold">코팅비: ₩{costReport.coatingCost.toLocaleString()}원</span>
          )}
        </div>
      </div>

      {/* ── 4. [본문 선택정보] (리플렛, 포스터, 전단은 본문 제외) ── */}
      {(printCategory === '리플렛' || printCategory === '포스터' || printCategory === '전단') ? (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-5 text-center space-y-1.5 text-xs animate-in fade-in">
          <div className="font-black text-slate-700 flex items-center justify-center space-x-1.5">
            <Info className="w-4 h-4 text-sky-600" />
            <span>[{printCategory}] 인쇄물은 본문(내지)이 포함되지 않는 {printCategory === '리플렛' ? '접지' : '낱장'} 규격입니다.</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            상단의 [{printCategory} 사양 정보]에서 설정된 규격/면수({coverPages}면) 및 {printCategory === '리플렛' ? foldType : '정밀재단'} 공정으로 원가가 자동 집계됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                본문 선택정보 (BODY / 내지)
              </span>
              {printType === '경인쇄' && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  먹 1도 인쇄 전용 (도수 고정)
                </span>
              )}
            </div>
            <span className="text-xs font-black text-sky-700">
              본문 소계: ₩ {costReport.bodyCalc.totalCost.toLocaleString()} 원
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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

            <div>
              <label className="font-bold text-slate-600 block mb-1">본문면수 (Page)</label>
              <input
                type="number"
                value={bodyPages}
                onChange={e => setBodyPages(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 text-center"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">인쇄형태 (도수 / 면)</label>
              <div className="flex space-x-1">
                <select
                  value={bodyColor}
                  disabled={printType === '경인쇄'}
                  onChange={e => setBodyColor(e.target.value)}
                  className={`w-1/2 p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 ${
                    printType === '경인쇄' ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                  }`}
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

            <div>
              <label className="font-bold text-slate-600 block mb-1">조판면수 (Page)</label>
              <input
                type="number"
                value={bodyTypesetPages}
                onChange={e => setBodyTypesetPages(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">
                연당단가 (원/R) {!includePaper && <span className="text-amber-600 font-normal">(사급 제외)</span>}
              </label>
              <input
                type="number"
                disabled={!includePaper}
                value={bodyUnitPrice}
                onChange={e => setBodyUnitPrice(Number(e.target.value) || 0)}
                className={`w-full p-2 border border-slate-300 rounded-lg font-black text-right ${
                  includePaper ? 'bg-white text-sky-700' : 'bg-slate-100 text-slate-400 line-through'
                }`}
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">인쇄되지 않는 면 (백면)</label>
              <input
                type="number"
                value={bodyBlankPages}
                onChange={e => setBodyBlankPages(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-center"
              />
            </div>

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

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-4">
              <span>대수: <strong className="text-slate-800">{costReport.bodyCalc.signatures} 대</strong></span>
              <span>소요연수: <strong className="text-slate-800">{costReport.bodyCalc.totalReams.toFixed(2)} R</strong></span>
              <span>
                CTP:&nbsp;
                {printType === '디지털인쇄' ? (
                  <strong className="text-purple-700">0판 (무판 0원)</strong>
                ) : (
                  <strong className="text-slate-800">{costReport.bodyCalc.totalPlates} 판 (₩{costReport.bodyCalc.ctpCost.toLocaleString()}원)</strong>
                )}
              </span>
              <span>인쇄비: <strong className="text-slate-800">₩{costReport.bodyCalc.printCost.toLocaleString()}원</strong></span>
              <span>용지비: <strong className="text-slate-800">{includePaper ? `₩${costReport.bodyCalc.paperCost.toLocaleString()}원` : '사급(0원)'}</strong></span>
            </div>
            {costReport.bodyCalc.typesetCost > 0 && (
              <span className="text-emerald-800 font-bold">조판료: ₩{costReport.bodyCalc.typesetCost.toLocaleString()}원</span>
            )}
          </div>
        </div>
      )}

      {/* ── 5. [화보 / 간지 선택정보] ── */}
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
                disabled={!includePaper}
                value={suppUnitPrice}
                onChange={e => setSuppUnitPrice(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-black text-sky-700 text-right"
              />
            </div>
          </div>

          {costReport.supplementCalc && (
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-4">
                <span>소요연수: <strong className="text-slate-800">{costReport.supplementCalc.totalReams.toFixed(2)} R</strong></span>
                <span>
                  CTP:&nbsp;
                  {printType === '디지털인쇄' ? (
                    <strong className="text-purple-700">0판 (무판 0원)</strong>
                  ) : (
                    <strong className="text-slate-800">{costReport.supplementCalc.totalPlates} 판 (₩{costReport.supplementCalc.ctpCost.toLocaleString()}원)</strong>
                  )}
                </span>
                <span>인쇄비: <strong className="text-slate-800">₩{costReport.supplementCalc.printCost.toLocaleString()}원</strong></span>
                <span>용지비: <strong className="text-slate-800">{includePaper ? `₩${costReport.supplementCalc.paperCost.toLocaleString()}원` : '사급(0원)'}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. 기타 선택정보 ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
          <span>기타 선택정보 (물류, 포장 및 특약 메모)</span>
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

      {/* ── 7. 공정별 세부 산출 내역표 (모드별 완벽 분리) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>
              {costingMode === 'GOVERNMENT'
                ? (printType === '경인쇄'
                    ? '■ 🏛️ 조달청 공공 표준 경인쇄(마스터) 7단계 고시 원가 상세표'
                    : '■ 🏛️ 조달청 공공 표준 옵셋·디지털 인쇄원가 14단계 법정 산출 상세표')
                : '■ 🏢 사기업 6대 실무 공정별 원가 명세'}
            </span>
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            {costingMode === 'GOVERNMENT'
              ? (printType === '경인쇄'
                  ? '조달청 및 공공기관 경인쇄(마스터) 고시 기준 요율 체계'
                  : '국가를 당사자로 하는 계약에 관한 법률 시행규칙 제6조 적용')
              : '사기업 실무 견적 공식 및 세부 내역'}
          </span>
        </div>

        {costingMode === 'GOVERNMENT' ? (
          governmentReport.isLightPrint && governmentReport.lightReport ? (
            /* 🖨️ 조달·공공 표준 경인쇄 7단계 고시 원가 집계 테이블 */
            <div className="overflow-x-auto space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <span className="p-1 bg-amber-600 text-white rounded">
                    <Printer className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    경인쇄 고시 기준: 50부 기본료 + 10부 초과가산료 체계
                    (총 {quantity.toLocaleString()}부 / 본문 {governmentReport.lightReport.bodyPages}면 / {paperCut})
                  </span>
                </div>
                <div className="text-[11px] font-medium">
                  {governmentReport.lightReport.hasTypesetDiscount ? (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      ✓ 조판생략 감액(-{governmentReport.lightReport.unitDiscount.toLocaleString()}원/면) 적용됨
                    </span>
                  ) : (
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      조판생략 감액 미적용
                    </span>
                  )}
                </div>
              </div>

              <table className="w-full text-xs border border-slate-300 rounded-lg">
                <thead className="bg-amber-100/70 text-amber-950 font-bold border-b border-amber-300 text-center">
                  <tr>
                    <th className="p-2.5 w-16">단계</th>
                    <th className="p-2.5 w-32 text-left">고시 원가 항목</th>
                    <th className="p-2.5 text-left">산출 공식 및 공인 기준</th>
                    <th className="p-2.5 w-32 text-right">금액 (원)</th>
                    <th className="p-2.5 w-28 text-right">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {/* 1. 기본사항 */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 text-center font-bold text-slate-500 align-top">1</td>
                    <td className="p-3 font-bold text-slate-900 align-top">
                      1. 기본사항
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">표지 + 본문 흑백</div>
                    </td>
                    <td className="p-3 text-slate-700 space-y-2">
                      {/* 표지 상세 */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-900 pb-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                          <span>□ 표지 요금 (8절 기준요금제)</span>
                          <span className="text-blue-700 font-bold">
                            ₩ {governmentReport.lightReport.totalCoverCost.toLocaleString()}원
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>
                            • 50부 요금: {governmentReport.lightReport.coverBasePrice50.toLocaleString()}원 × {governmentReport.lightReport.totalCoverSheets}매
                            (기본 {governmentReport.lightReport.baseCoverSheets}매 + 가산 {governmentReport.lightReport.extraSheets}매) = {governmentReport.lightReport.cover50Cost.toLocaleString()}원
                          </div>
                          <div className="pl-3 text-[10px] text-slate-500">
                            ※ 가산매수: {governmentReport.lightReport.extraSheetsDesc}
                          </div>
                          <div>
                            • 10부마다 요금: {governmentReport.lightReport.extraSteps > 0
                              ? `${governmentReport.lightReport.coverExtra10Price.toLocaleString()}원 × ${governmentReport.lightReport.extraSteps}스텝(10부) × ${governmentReport.lightReport.totalCoverSheets}매 = ${governmentReport.lightReport.cover10Cost.toLocaleString()}원`
                              : '초과 부수 없음 (0원)'}
                          </div>
                        </div>
                      </div>

                      {/* 본문 상세 */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-900 pb-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                          <span>□ 본문 흑백 요금 ({paperCut} 기준)</span>
                          <span className="text-blue-700 font-bold">
                            ₩ {governmentReport.lightReport.totalBodyCost.toLocaleString()}원
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>
                            • 50부 요금: {governmentReport.lightReport.bodyBasePrice50.toLocaleString()}원 × {governmentReport.lightReport.bodyPages}면 = {governmentReport.lightReport.body50Cost.toLocaleString()}원
                          </div>
                          <div>
                            • 10부마다 요금: {governmentReport.lightReport.extraSteps > 0
                              ? `${governmentReport.lightReport.bodyExtra10Price.toLocaleString()}원 × ${governmentReport.lightReport.extraSteps}스텝(10부) × ${governmentReport.lightReport.bodyPages}면 = ${governmentReport.lightReport.body10Cost.toLocaleString()}원`
                              : '초과 부수 없음 (0원)'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 align-top text-xs">
                      {governmentReport.lightReport.basicTotal.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-slate-500 align-top">표지+본문</td>
                  </tr>

                  {/* 2. 계산가감 */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 text-center font-bold text-slate-500 align-top">2</td>
                    <td className="p-3 font-bold text-slate-900 align-top">
                      2. 계산가감
                      <div className="text-[10px] text-rose-600 font-normal mt-0.5">조판생략 감액</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      <div>□ 원고 파일 제공 시 조판비 감액 (글자크기/행간/규격 변환 파일 제공 시)</div>
                      <div className="text-slate-600 mt-1">
                        {governmentReport.lightReport.hasTypesetDiscount ? (
                          <span>
                            감액 산식: -{governmentReport.lightReport.unitDiscount.toLocaleString()}원 × 본문 {governmentReport.lightReport.bodyPages}면 = <strong className="text-rose-700">{governmentReport.lightReport.discountAmount.toLocaleString()}원</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400">조판생략 감액 미적용 (원고 미제공 또는 조판작업 포함)</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-rose-700 align-top text-xs">
                      {governmentReport.lightReport.discountAmount.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-rose-600 align-top">감액 항목</td>
                  </tr>

                  {/* 3. 기타추가 */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 text-center font-bold text-slate-500 align-top">3</td>
                    <td className="p-3 font-bold text-slate-900 align-top">
                      3. 기타추가
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">특수 후가공 실비</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      {governmentReport.lightReport.extraCost > 0 ? (
                        <span>특수 후가공 실비 (박, 톰슨 등 가공비 실비)</span>
                      ) : (
                        <span className="text-slate-400">해당사항 없음 (0원)</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 align-top text-xs">
                      {governmentReport.lightReport.extraCost.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-slate-500 align-top">후가공 실비</td>
                  </tr>

                  {/* 4. 소계 */}
                  <tr className="bg-slate-100 font-bold border-t border-b border-slate-300">
                    <td className="p-3 text-center text-slate-700">4</td>
                    <td className="p-3 text-slate-950 font-black">4. 소계</td>
                    <td className="p-3 text-slate-700">
                      직접제조원가 / 공급가액 (1.기본사항 + 2.계산가감 + 3.기타추가)
                    </td>
                    <td className="p-3 text-right font-black text-slate-950 text-xs">
                      {governmentReport.lightReport.subtotal.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-slate-700 font-bold">공급가액</td>
                  </tr>

                  {/* 5. 부가가치세 */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3 text-center font-bold text-slate-500">5</td>
                    <td className="p-3 font-bold text-slate-900">5. 부가가치세</td>
                    <td className="p-3 text-slate-600">소계(공급가액 4) × 10%</td>
                    <td className="p-3 text-right font-bold text-slate-900 text-xs">
                      {governmentReport.lightReport.vat.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-slate-500">VAT 10%</td>
                  </tr>

                  {/* 6. 합계 */}
                  <tr className="bg-blue-50/80 font-bold border-t border-b border-blue-200">
                    <td className="p-3 text-center text-blue-900 font-black">6</td>
                    <td className="p-3 text-blue-950 font-black text-xs">6. 예정가격 (합계)</td>
                    <td className="p-3 text-blue-900 font-semibold">
                      소계(4) + 부가가치세(5) (권당 {governmentReport.lightReport.perBookTargetPrice.toLocaleString()}원)
                    </td>
                    <td className="p-3 text-right font-black text-blue-900 text-sm">
                      {governmentReport.lightReport.targetTotal.toLocaleString()}원
                    </td>
                    <td className="p-3 text-right text-blue-800 font-bold">공공 예정가</td>
                  </tr>

                  {/* 7. 계약금액 */}
                  <tr className="bg-amber-100/90 font-bold border-t-2 border-amber-500">
                    <td className="p-3.5 text-center text-amber-950 font-black text-sm">7</td>
                    <td className="p-3.5 text-amber-950 font-black text-sm">7. 최종 계약금액</td>
                    <td className="p-3.5 text-amber-950 font-bold">
                      예정가격(6) × 100% (조달청 고시 기준, 천원단위 이하 절사)
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-950 text-base">
                      ₩ {governmentReport.lightReport.contractAmount.toLocaleString()}원
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-900">
                      부당 {governmentReport.lightReport.perBookContractPrice.toLocaleString()}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* 🏛️ 공공·조달 14단계 법정 원가 집계 테이블 (옵셋/디지털) */
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

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">2</td>
                    <td className="p-2.5 font-bold text-slate-800">2. 조판료</td>
                    <td className="p-2.5 text-slate-600">
                      표지({governmentReport.coverCalc?.typesetPages}p×{governmentReport.coverCalc?.typesetRate}%) + 본문({governmentReport.bodyCalc?.typesetPages}p×{governmentReport.bodyCalc?.typesetRate}%) 전자조판료
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step2_typesetCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">기본 15,390원/p</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">3</td>
                    <td className="p-2.5 font-bold text-slate-800">3. 인쇄판료 (CTP)</td>
                    <td className="p-2.5 text-slate-600">
                      {printType === '디지털인쇄' ? (
                        <span className="text-purple-700 font-bold">디지털 Direct 무판 인쇄 (CTP 인쇄판대 0원 면제)</span>
                      ) : (
                        `총 ${(governmentReport.coverCalc?.plates || 0) + (governmentReport.bodyCalc?.plates || 0) + (governmentReport.supplementCalc?.plates || 0)}판 (대수 × 면수 × 색도수) × 공인 판당단가 ${(governmentReport.coverCalc?.plateUnitPrice || 0).toLocaleString()}원`
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step3_ctpCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">{printType === '디지털인쇄' ? '무판 Direct' : '조달 CTP 단가'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">4</td>
                    <td className="p-2.5 font-bold text-slate-800">4. 인쇄료</td>
                    <td className="p-2.5 text-slate-600">
                      {printType === '디지털인쇄' ? (
                        `디지털 페이지 출력단가 (원색 120원/p, 단색 35원/p) × ${quantity.toLocaleString()}부`
                      ) : (
                        `기준통수 × 통당단가 × 인쇄면수 × 할증(지질, 특수별색, 베다바탕 가산율)`
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step4_printCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">{printType === '디지털인쇄' ? '디지털 출력비' : '통수 구간제'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">5</td>
                    <td className="p-2.5 font-bold text-slate-800">5. 제본 / 접지료</td>
                    <td className="p-2.5 text-slate-600">
                      {printCategory === '포스터' || printCategory === '전단' ? (
                        `포스터/전단 낱장: 제본 없음 (기본 정밀재단 15,000원)`
                      ) : printCategory === '리플렛' ? (
                        `리플렛 접지: ${foldType} 가공비 (${quantity.toLocaleString()}부 × 접지단가)`
                      ) : (
                        `${bindingType} : ${quantity.toLocaleString()}부 × ${Math.max(100, governmentReport.totalPages)}면(100면 기본) × 면당 0.825원`
                      )}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step5_bindingCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">공인 단가</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">6</td>
                    <td className="p-2.5 font-bold text-slate-800">6. 기타추가</td>
                    <td className="p-2.5 text-slate-600">
                      표지 코팅({governmentReport.coatingCost.toLocaleString()}원) + 박({governmentReport.foilCost.toLocaleString()}원) + 톰슨({governmentReport.diecutCost.toLocaleString()}원)
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step6_extraCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">후가공 실비</td>
                  </tr>

                  <tr className="bg-slate-100 font-bold border-t border-b border-slate-300">
                    <td className="p-2.5 text-center text-slate-700">7</td>
                    <td className="p-2.5 text-slate-900 font-black">7. 순제조원가 (소계)</td>
                    <td className="p-2.5 text-slate-700">직접비 합계 (1 + 2 + 3 + 4 + 5 + 6)</td>
                    <td className="p-2.5 text-right font-black text-slate-950 text-xs">{governmentReport.step7_subtotal.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-700 font-bold">순제조비</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">8</td>
                    <td className="p-2.5 font-bold text-teal-800">8. 일반관리비</td>
                    <td className="p-2.5 text-teal-900">
                      순제조원가({governmentReport.step7_subtotal.toLocaleString()}원) × {manageRate}% (법정한도 14% 이내)
                    </td>
                    <td className="p-2.5 text-right font-bold text-teal-900">{governmentReport.step8_manageCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right font-semibold text-teal-800">법정 {manageRate}%</td>
                  </tr>

                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5 text-center text-slate-600">9</td>
                    <td className="p-2.5 text-slate-800 font-bold">9. 계 (소계 + 일반관리비)</td>
                    <td className="p-2.5 text-slate-600">순제조원가(7) + 일반관리비(8)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step9_manufacturingTotal.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-600">총제조원가</td>
                  </tr>

                  <tr className="hover:bg-teal-50/50 bg-teal-50/30">
                    <td className="p-2.5 text-center font-bold text-teal-800">10</td>
                    <td className="p-2.5 font-black text-teal-900">10. 이윤 (법정산식)</td>
                    <td className="p-2.5 text-teal-900">
                      (총제조원가 9 - 용지비 1: {governmentReport.profitBase.toLocaleString()}원) × {profitRate}% (법정한도 25% 이내)
                    </td>
                    <td className="p-2.5 text-right font-black text-teal-900">{governmentReport.step10_profitCost.toLocaleString()}원</td>
                    <td className="p-2.5 text-right font-bold text-rose-700">용지비 공제 적용</td>
                  </tr>

                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2.5 text-center text-slate-600">11</td>
                    <td className="p-2.5 text-slate-900 font-bold">11. 공급가액</td>
                    <td className="p-2.5 text-slate-600">총제조원가(9) + 법정이윤(10)</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step11_supplyPrice.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-600">과세표준액</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-center font-bold text-slate-500">12</td>
                    <td className="p-2.5 font-bold text-slate-800">12. 부가가치세</td>
                    <td className="p-2.5 text-slate-600">공급가액(11) × 10%</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{governmentReport.step12_vat.toLocaleString()}원</td>
                    <td className="p-2.5 text-right text-slate-500">VAT 10%</td>
                  </tr>

                  <tr className="bg-blue-50/80 font-bold border-t border-b border-blue-200">
                    <td className="p-3 text-center text-blue-900 font-black">13</td>
                    <td className="p-3 text-blue-950 font-black text-xs">13. 예정가격 (합계)</td>
                    <td className="p-3 text-blue-900 font-semibold">공급가액(11) + 부가가치세(12) (권당 {governmentReport.perBookTargetPrice.toLocaleString()}원)</td>
                    <td className="p-3 text-right font-black text-blue-900 text-sm">{governmentReport.step13_targetTotal.toLocaleString()}원</td>
                    <td className="p-3 text-right text-blue-800 font-bold">관공서 예정가</td>
                  </tr>

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
          )
        ) : (
          /* 🏢 사기업 실무 견적: 6대 공정별 아코디언 / 테이블 카드 */
          <div className="space-y-4">
            {Object.entries(costReport.sections).map(([secKey, section]) => {
              if (secKey === 'paper' && !includePaper) {
                // 용지대 제외 시 간략 카드
                return (
                  <div key={secKey} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <div className="p-3.5 flex items-center justify-between bg-slate-100/80">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-700">{section.title}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          거래처 사급/입고 (0원 처리)
                        </span>
                      </div>
                      <span className="font-bold text-slate-500 text-xs">소계: 0원</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={secKey} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {/* 섹션 헤더 */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-black text-slate-800 text-xs sm:text-sm">{section.title}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">({section.items.length}개 항목)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleOpenAddCustomModal(section.category)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
                      >
                        <Plus className="w-3 h-3 text-sky-600" />
                        <span>항목 추가</span>
                      </button>
                      <span className="font-black text-sky-800 text-xs sm:text-sm">
                        소계: ₩ {section.total.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 세부 항목 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/50 text-slate-600 font-bold border-b border-slate-200 text-left">
                        <tr>
                          <th className="p-2.5 w-10 text-center">No</th>
                          <th className="p-2.5 w-44">항목명</th>
                          <th className="p-2.5">규격 / 산출 공식</th>
                          <th className="p-2.5 w-20 text-center">수량</th>
                          <th className="p-2.5 w-14 text-center">단위</th>
                          <th className="p-2.5 w-24 text-right">단가</th>
                          <th className="p-2.5 w-28 text-right">금액</th>
                          <th className="p-2.5 w-28 text-center">편차율(%)</th>
                          <th className="p-2.5 w-12 text-center">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {section.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70">
                            <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {item.name}
                              {item.isCustom && (
                                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                                  커스텀
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-600 text-[11px]">
                              <span>{item.spec}</span>
                              {item.formula && (
                                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                  ↳ {item.formula}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-medium">{item.quantity?.toLocaleString()}</td>
                            <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                            <td className="p-2.5 text-right font-medium text-slate-700">
                              {item.unitPrice?.toLocaleString()}원
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900">
                              {item.amount?.toLocaleString()}원
                            </td>
                            <td className="p-2.5 text-center">
                              {renderDeviationBadge(item.deviation)}
                            </td>
                            <td className="p-2.5 text-center">
                              {item.isCustom ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="항목 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
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
                {costingMode === 'GOVERNMENT' ? '공급가액 (11단계)' : '공급가액 (6대 공정 합계)'}
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
                {costingMode === 'GOVERNMENT' ? '계약 부당단가' : '권당(부당) 단가'}
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
                {costingMode === 'COMMERCIAL' && costReport.overallMarginRate !== 0 && (
                  <span className="text-xs font-bold text-slate-500">
                    ({renderDeviationBadge(costReport.overallMarginRate)})
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

      {/* ── 커스텀 항목 추가 모달 ── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                [ {customCategory} ] 공정 커스텀 항목 추가
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">공정 구분</label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="PREPRESS">1. 기획/제판 (PREPRESS)</option>
                  <option value="PRINT">2. 인쇄 (PRINT)</option>
                  <option value="BINDING">3. 제본 (BINDING)</option>
                  <option value="FINISHING">4. 후가공 (FINISHING)</option>
                  <option value="PAPER">5. 용지대 (PAPER)</option>
                  <option value="OTHER">6. 기타 (OTHER)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">항목명 *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="예: 특수 포장비, 감리비, 교정 출력비"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">규격 / 산출 기준</label>
                <input
                  type="text"
                  value={customSpec}
                  onChange={e => setCustomSpec(e.target.value)}
                  placeholder="예: 4절 2교정, 에어캡 개별포장 등"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">수량</label>
                  <input
                    type="number"
                    value={customQty}
                    onChange={e => setCustomQty(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-right"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">단위</label>
                  <select
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="식">식</option>
                    <option value="부">부</option>
                    <option value="R">R</option>
                    <option value="판">판</option>
                    <option value="장">장</option>
                    <option value="EA">EA</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">단가 (원)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={e => setCustomPrice(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-right font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-bold">
                <span className="text-slate-600">합산 금액:</span>
                <span className="text-sky-700 text-sm">
                  ₩ {((Number(customQty) || 0) * (Number(customPrice) || 0)).toLocaleString()} 원
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCustomItem}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
              >
                항목 추가하기
              </button>
            </div>
          </div>
        </div>
      )}

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
            bindingType: `${bindingDetailType} (${bindingDirection})`,
            paperType: includePaper
              ? `표지: ${coverPaperName} ${coverWeight}g / 본문: ${bodyPaperName} ${bodyWeight}g`
              : `거래처 사급/입고 (표지: ${coverPaperName} / 본문: ${bodyPaperName})`,
            finishingOptions: hasCoating ? coatingType : '없음',
            subtotal: activeSubtotal,
            vat: activeVat,
            totalAmount: activeTotalAmount,
            unitPrice: activeUnitPrice,
            notes,
            items: costReport.allItems,
            authorName: writerName || user?.userName || '영업담당',
            createdAt: regDate,
            governmentReport: costingMode === 'GOVERNMENT' ? governmentReport : null,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* 🏛️ 조달청 공공 인쇄원가계산서 / 규격서 모달 */}
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
            hasTypesetDiscount,
            hasFoil: hasHotFoil || hasHoloFoil,
            hasDiecut: hasDie || hasThomson,
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
