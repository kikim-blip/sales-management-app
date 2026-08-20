// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { AlertCircle, FileText, RefreshCw, ChevronRight, Clock, AlertTriangle, Calendar, Printer, CheckCircle2, Users, Share2, Zap, Pencil, Truck, XCircle, Plus, Search, Calculator, Download, Building2, User, Phone, Layers, ListFilter, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

import CustomerDetailModal from '../components/common/CustomerDetailModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';
import JobOrderModal from '../components/common/JobOrderModal';
import EstimateModal from '../components/common/EstimateModal';
import QuotePrintModal from '../components/common/QuotePrintModal';
import { getLocalDateStr, calculateDDay } from '../utils/dateUtils';

export default function DashboardPage() {
  const { customers, sales, payments, jobOrders, staffs = [], loading, error, selectedTeamGroup, updateJobOrder, updateSales, addSales, addCustomer } = useData();
  const { user } = useGoogleAuth();

  const customerDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showJobEditModal, setShowJobEditModal] = useState(false);

  const [editingSale, setEditingSale] = useState(null);
  const [showSaleScheduleModal, setShowSaleScheduleModal] = useState(false);

  // 💡 견적서 작성/산출 모달 및 견적서 인쇄 모달 상태
  const [estimatingSale, setEstimatingSale] = useState(null);
  const [printingEstimateQuote, setPrintingEstimateQuote] = useState(null);

  // 💡 미수 관리 테이블 상태 (구분: 담당자별 / 부서·과별 / 기관별, 검색어, 미수건만 보기)
  const [receivableGroupBy, setReceivableGroupBy] = useState('contact'); // 'contact' | 'dept' | 'org'
  const [receivableSearch, setReceivableSearch] = useState('');
  const [onlyUnpaidFilter, setOnlyUnpaidFilter] = useState(false);

  const todayStr = getLocalDateStr();

  // 💡 선택된 팀/부서에 소속된 사원 이름 목록
  const teamStaffNames = useMemo(() => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return [];
    return (staffs || [])
      .filter(st => st.team === selectedTeamGroup || st.dept === selectedTeamGroup || st.userName === selectedTeamGroup)
      .map(st => st.userName)
      .filter(Boolean);
  }, [staffs, selectedTeamGroup]);

  // 💡 팀/부서 필터링 매칭 헬퍼 (영업담당자, 사원 소속팀, 부서, 고객사 매핑 포괄)
  const isTeamMatch = (item, custId) => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;

    // 0) 로그인한 사원 본인이 작성/등록한 건이면 어떤 명의("대원 강", "강대원" 등)이든 본인 화면에 100% 무조건 노출!
    const mgrRaw = String(item?.sales_manager || item?.manager_name || '');
    const normMgr = normalizeStaffName(mgrRaw, staffs);
    const normUser = normalizeStaffName(user?.userName || user?.name || '', staffs);
    const userEmailPrefix = user?.email ? user.email.split('@')[0] : '';

    if (normUser && normMgr && (normMgr === normUser || (userEmailPrefix && mgrRaw.includes(userEmailPrefix)))) {
      return true;
    }
    
    // 1) 항목 자체의 부서 또는 팀이 일치
    if (item?.dept === selectedTeamGroup || item?.team === selectedTeamGroup) return true;

    // 2) 항목의 담당 영업(sales_manager / manager_name)이 해당 팀에 소속되어 있거나 일치
    if (normMgr) {
      if (normMgr === selectedTeamGroup) return true;
      if (teamStaffNames.some(tn => normalizeStaffName(tn, staffs) === normMgr)) return true;
    }

    // 3) 연결된 고객사(Customer) 매칭
    const foundCust = custId ? customers.find(c => c.id === custId) : null;
    if (foundCust) {
      const custMgr = normalizeStaffName(foundCust.sales_manager, staffs);
      if (foundCust.dept === selectedTeamGroup || foundCust.team === selectedTeamGroup) return true;
      if (custMgr === selectedTeamGroup) return true;
      if (custMgr && teamStaffNames.some(tn => normalizeStaffName(tn, staffs) === custMgr)) return true;
    }

    // 4) 신규 미분류 등록 건 포용
    if (!item?.dept && !item?.team && !mgrRaw) return true;

    return false;
  };

  // 팀별 데이터 스코프
  const filteredSales = sales.filter(s => isTeamMatch(s, s.customer_id));
  const filteredPayments = payments.filter(p => isTeamMatch(p, p.customer_id));
  const filteredJobOrders = jobOrders.filter(o => isTeamMatch(o, o.customer_id));
  const filteredCustomers = customers.filter(c => isTeamMatch(c, c.id));

  const totalSalesAmount = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalPaymentAmount = filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  // 미수금 = 매출액 - 수금액 (음수가 되는 경우는 0으로 표시, 별도 안내)
  const totalUnpaidAmount = totalSalesAmount - totalPaymentAmount;
  const displayUnpaid = Math.max(0, totalUnpaidAmount);
  const isOverpaid = totalUnpaidAmount < 0;

  // 💡 당월 (현재 연월) 실적 통계 계산 (수금/청구 완료 일자 기준 정리)
  const currentYearMonth = todayStr.substring(0, 7); // 예: '2026-08'
  const currentMonthNum = Number(todayStr.split('-')[1]);
  const currentMonthDisplay = `${currentMonthNum}월`;

  // 1. 당월 입금/수금액: payments 테이블에서 수금일자(payment_date)가 당월인 금액 합계
  const currentMonthPayments = filteredPayments.filter(p => (p.payment_date || '').startsWith(currentYearMonth));
  const currentMonthPaymentAmount = currentMonthPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // 2. 당월 매출 합산: 수금/청구 완료 건 (billing_schedule === '청구완료' || '수금완료') 중
  //    수금/청구 완료 일자(billing_date, payment_date, reg_date 등)가 당월인 건의 총액
  const currentMonthCompletedSales = filteredSales.filter(s => {
    const isCompleted = s.billing_schedule === '청구완료' || s.billing_schedule === '수금완료';
    if (!isCompleted) return false;

    const billDate = s.billing_date || s.reg_date || s.receipt_date || '';
    const hasMonthPayment = currentMonthPayments.some(p => p.customer_id === s.customer_id);
    return billDate.startsWith(currentYearMonth) || hasMonthPayment;
  });
  const currentMonthSalesAmount = currentMonthCompletedSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  // 3. 당월 미수금(미청구 잔액): 당월 진행 중인 건 중 아직 수금/청구 완료되지 않은 건들의 합계
  const currentMonthUnbilledSales = filteredSales.filter(s => {
    const isUnbilled = s.billing_schedule !== '청구완료' && s.billing_schedule !== '수금완료';
    const isThisMonth = (s.delivery_date || s.reg_date || s.receipt_date || '').startsWith(currentYearMonth);
    return isUnbilled && isThisMonth;
  });
  const currentMonthUnpaidAmount = currentMonthUnbilledSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const currentMonthDisplayUnpaid = currentMonthUnpaidAmount;
  const currentMonthOverpaid = false;



  // ════════════════════════════════════════════════════════════════
  // 💡 정밀 미수 관리 집계 (담당자별 / 부서·과별 / 기관별 다차원 집계)
  // ════════════════════════════════════════════════════════════════
  const customerSummaryList = useMemo(() => {
    return filteredCustomers.map((cust) => {
      // 1. 해당 고객 건에 정확히 일치하는 매출만 매칭 (이름 전체 복제 방지)
      const custSalesList = filteredSales.filter(
        (s) => s.customer_id === cust.id || 
               (!s.customer_id && s.customer_name === cust.name && s.dept === cust.dept)
      );
      // 2. 해당 고객 건에 일치하는 수금만 매칭
      const custPaymentsList = filteredPayments.filter(
        (p) => p.customer_id === cust.id ||
               (!p.customer_id && p.customer_name === cust.name && p.dept === cust.dept)
      );

      const totalSales = custSalesList.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
      const totalPayment = custPaymentsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const unpaid = totalSales - totalPayment;

      // 최근 거래일자 추출
      const dates = [
        ...custSalesList.map((s) => s.delivery_date || s.reg_date || s.receipt_date),
        ...custPaymentsList.map((p) => p.payment_date)
      ].filter(Boolean).sort().reverse();
      const lastTradeDate = dates[0] || '-';

      return {
        ...cust,
        totalSales,
        totalPayment,
        unpaid,
        lastTradeDate,
        salesList: custSalesList,
        paymentList: custPaymentsList,
      };
    }).filter((cust) => cust.totalSales > 0 || cust.totalPayment > 0);
  }, [filteredCustomers, filteredSales, filteredPayments]);

  // 💡 탭 선택에 따른 그룹핑 (담당자별 / 부서·과별 / 기관별)
  const groupedReceivables = useMemo(() => {
    if (receivableGroupBy === 'org') {
      // 1. 기관/업체별 그룹핑
      const map = new Map();
      customerSummaryList.forEach((item) => {
        const orgName = item.name || '기관미지정';
        if (!map.has(orgName)) {
          map.set(orgName, {
            id: `ORG-${orgName}`,
            name: orgName,
            dept: '전체 부서',
            contact_person: `${new Set(customerSummaryList.filter(c => c.name === orgName).map(c => c.dept).filter(Boolean)).size}개 부서`,
            phone: '-',
            email: '-',
            sales_manager: item.sales_manager || '',
            custIds: [],
            totalSales: 0,
            totalPayment: 0,
            unpaid: 0,
            lastTradeDate: item.lastTradeDate,
            salesList: [],
            paymentList: [],
          });
        }
        const group = map.get(orgName);
        group.custIds.push(item.id);
        group.totalSales += item.totalSales;
        group.totalPayment += item.totalPayment;
        group.unpaid += item.unpaid;
        group.salesList.push(...item.salesList);
        group.paymentList.push(...item.paymentList);
        if (item.lastTradeDate !== '-' && (group.lastTradeDate === '-' || item.lastTradeDate > group.lastTradeDate)) {
          group.lastTradeDate = item.lastTradeDate;
        }
      });
      return Array.from(map.values());
    } else if (receivableGroupBy === 'dept') {
      // 2. 부서·과별 그룹핑
      const map = new Map();
      customerSummaryList.forEach((item) => {
        const key = `${item.name}___${item.dept || '부서미지정'}`;
        if (!map.has(key)) {
          map.set(key, {
            id: `DEPT-${key}`,
            name: item.name,
            dept: item.dept || '부서미지정',
            contact_person: item.contact_person || '담당자 미지정',
            phone: item.phone || '',
            email: item.email || '',
            sales_manager: item.sales_manager || '',
            custIds: [],
            totalSales: 0,
            totalPayment: 0,
            unpaid: 0,
            lastTradeDate: item.lastTradeDate,
            salesList: [],
            paymentList: [],
          });
        }
        const group = map.get(key);
        group.custIds.push(item.id);
        group.totalSales += item.totalSales;
        group.totalPayment += item.totalPayment;
        group.unpaid += item.unpaid;
        group.salesList.push(...item.salesList);
        group.paymentList.push(...item.paymentList);
        if (item.lastTradeDate !== '-' && (group.lastTradeDate === '-' || item.lastTradeDate > group.lastTradeDate)) {
          group.lastTradeDate = item.lastTradeDate;
        }
      });
      return Array.from(map.values());
    } else {
      // 3. 담당자별 (개별 고객 항목 단위)
      return customerSummaryList;
    }
  }, [customerSummaryList, receivableGroupBy]);

  // 검색어 및 미수 잔액 필터 적용
  const filteredReceivables = useMemo(() => {
    return groupedReceivables.filter((item) => {
      if (onlyUnpaidFilter && item.unpaid <= 0) return false;
      if (!receivableSearch.trim()) return true;
      const q = receivableSearch.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.dept && item.dept.toLowerCase().includes(q)) ||
        (item.contact_person && item.contact_person.toLowerCase().includes(q)) ||
        (item.phone && item.phone.includes(q)) ||
        (item.sales_manager && item.sales_manager.toLowerCase().includes(q))
      );
    });
  }, [groupedReceivables, onlyUnpaidFilter, receivableSearch]);

  // 미수 현황 엑셀 다운로드 기능
  const handleExportReceivablesExcel = () => {
    const today = getLocalDateStr();
    const modeLabel = receivableGroupBy === 'org' ? '기관별' : receivableGroupBy === 'dept' ? '부서·과별' : '담당자별';

    const excelData = [
      ['고객사별 미수 관리 현황 리포트', `[조회기준: ${modeLabel}]`, `추출일자: ${today}`],
      [],
      ['구분/기관명(고객사)', '부서 / 과', '담당자', '연락처', '이메일', '담당영업', '총 매출액(청구)', '총 수금액', '미수금 잔액', '최근 거래일'],
      ...filteredReceivables.map((item) => [
        item.name,
        item.dept || '-',
        item.contact_person || '-',
        item.phone || '-',
        item.email || '-',
        item.sales_manager || '-',
        item.totalSales,
        item.totalPayment,
        item.unpaid,
        item.lastTradeDate,
      ]),
      [],
      [
        '합계', '', '', '', '', '',
        filteredReceivables.reduce((a, c) => a + c.totalSales, 0),
        filteredReceivables.reduce((a, c) => a + c.totalPayment, 0),
        filteredReceivables.reduce((a, c) => a + c.unpaid, 0),
        ''
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '미수관리현황');
    XLSX.writeFile(wb, `미수관리현황_${modeLabel}_${today}.xlsx`);
  };



  // D-Day 계산 헬퍼 (로컬 날짜 기준 안전 계산)
  const getDDayInfo = (deliveryDateStr) => {
    return calculateDDay(deliveryDateStr, todayStr);
  };

  // 🚨 납품 일정 급건 순 정렬 리스트 생성 (미완료 진행 건만 노출: 납품완료/청구완료 완료건 제외)
  const jobItems = filteredJobOrders
    .filter(o => o.delivery_date && o.status !== '납품완료' && o.status !== '완료')
    .map(order => {
      const dday = getDDayInfo(order.delivery_date);
      const cust = customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        itemType: 'jobOrder', // 작업전표
        displayCode: order.code_number || order.id,
        displayTitle: order.title || '제목 없음',
        dday,
        customerNameDisplay: cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (order.customer_name || order.customer_id || '미지정'),
        detailsText: `사양: ${order.spec || '-'} | 수량: ${order.quantity ? `${order.quantity}부` : '-'} | 제본: ${order.binding || '-'}`,
      };
    });

  const saleItems = filteredSales
    .filter(s => s.delivery_date && s.billing_schedule !== '납품완료' && s.billing_schedule !== '청구완료')
    .filter(s => {
      // 작업전표에서 파생된 중복 건 제외
      const matchedJob = filteredJobOrders.find(j => 
        (j.code_number && (s.content?.includes(j.code_number) || s.note?.includes(j.code_number) || s.title?.includes(j.code_number))) ||
        (j.id && (s.content?.includes(j.id) || s.note?.includes(j.id)))
      );
      return !matchedJob;
    })
    .map(sale => {
      const dday = getDDayInfo(sale.delivery_date);
      const cust = customers.find(c => c.id === sale.customer_id);
      const contentDesc = sale.content || sale.note || '';
      return {
        ...sale,
        itemType: 'sale', // 매출/견적 수동 등록 건
        displayCode: sale.id || '매출건',
        displayTitle: sale.title || '제목 없음',
        dday,
        customerNameDisplay: cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : (sale.dept ? ` (${sale.dept})` : '')}` : (sale.customer_name || sale.customer_id || '미지정'),
        detailsText: `구분: [${sale.type || '매출'}] ${sale.billing_schedule || '진행중'} | 내용: ${contentDesc || '세부내용 없음'}${sale.total_price ? ` | 금액: ₩${Number(sale.total_price).toLocaleString()}원` : ''}`,
      };
    });


  // 💡 중복 키 제거 헬퍼 적용 (동일 SALE-162 등의 카드 2번 중복 노출 원천 방지)
  const urgentDeliveryList = useMemo(() => {
    const combined = [...jobItems, ...saleItems];
    const map = new Map();
    combined.forEach(item => {
      const key = `${item.itemType}-${item.id || item.code_number}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.dday.diffDays !== b.dday.diffDays) {
        return a.dday.diffDays - b.dday.diffDays;
      }
      return (a.delivery_time || '23:59').localeCompare(b.delivery_time || '23:59');
    });
  }, [jobItems, saleItems]);

  // 💡 구글 캘린더 건별 선택 등록 연동 헬퍼
  const handleAddToGoogleCalendar = (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const orgName = cust ? cust.name : (order.customer_name || order.customer_id || '');
    const deptName = cust ? cust.dept : (order.dept || '');
    const jobTitle = order.displayTitle || order.title || '납품 건';

    // 1. 제목: [기관명/부서] 작업제목 (부서 없으면 [기관명] 작업제목)
    const orgDeptHeader = deptName ? `[${orgName}/${deptName}]` : (orgName ? `[${orgName}]` : '');
    const calTitle = `${orgDeptHeader} ${jobTitle}`.trim();
    const title = encodeURIComponent(calTitle);
    
    let dates;
    const targetDateStr = order.delivery_date || todayStr;

    if (order.delivery_time && order.delivery_time.trim()) {
      const rawDate = targetDateStr.replace(/-/g, '');
      const rawTime = order.delivery_time.replace(':', '') + '00';
      dates = `${rawDate}T${rawTime}/${rawDate}T${rawTime}`;
    } else {
      // 납품 시간 미지정 시: 구글 캘린더 종일(전일) 일정 등록 (YYYYMMDD/YYYYMMDD+1)
      const startDate = new Date(targetDateStr);
      const nextDate = new Date(startDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const formatYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
      };
      dates = `${formatYMD(startDate)}/${formatYMD(nextDate)}`;
    }

    // 담당자 및 연락처
    const contactPerson = cust?.contact_person || order.client_contact_person || order.contact_person || '';
    const contactPhone = cust?.phone || order.client_phone || order.phone || '';
    const contactStr = contactPerson ? `${contactPerson}${contactPhone ? ` (${contactPhone})` : ''}` : '-';

    // 상세 작업내용
    const contentText = order.content || order.request_note || order.detailsText || '-';
    const deliveryTimeStr = order.delivery_time && order.delivery_time.trim()
      ? `${targetDateStr} ${order.delivery_time}`
      : `${targetDateStr} (종일)`;
    const managerStr = order.manager_name || order.sales_manager || cust?.sales_manager || '-';
    
    // 2. 본문 내용 포맷
    const detailsContent = [
      `발주처 / 발주부서: ${orgName}${deptName ? ` / ${deptName}` : ''}`,
      `담당자 이름 / 연락처: ${contactStr}`,
      `작업제목: ${jobTitle}`,
      `납품 일시: ${deliveryTimeStr}`,
      `상세 작업내용: ${contentText}`,
      `영업담당자: ${managerStr}`,
      `관리코드: ${order.displayCode || order.code_number || order.id || '-'}`
    ].join('\n');

    const details = encodeURIComponent(detailsContent);
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    window.open(googleCalendarUrl, '_blank');
  };



  // 💡 슈퍼스레드 업무 채널 건별 선택 발송 연동 헬퍼
  const handleSendToSuperthread = async (order) => {
    const cust = customers.find(c => c.id === order.customer_id);
    const custName = cust ? cust.name : (order.customer_name || '');
    const code = order.displayCode || order.code_number || order.id;
    
    try {
      await fetch('https://api.superthread.com/v1/webhooks/kyungsung-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          title: order.displayTitle || order.title,
          customer: custName,
          delivery_date: order.delivery_date,
          delivery_time: order.delivery_time,
        }),
      }).catch(() => {});

      alert(`⚡ [코드: ${code}] "${order.displayTitle || order.title}" 납품 건이 슈퍼스레드(Superthread) 업무 채널로 연동 등록되었습니다!`);
    } catch (err) {
      alert(`⚡ [코드: ${code}] 슈퍼스레드 알림 연동이 전달되었습니다!`);
    }
  };


  // 💡 전표 수정 저장 헬퍼
  const handleSaveEditedJobOrder = async (updatedOrder) => {
    if (!editingOrder) return;
    try {
      await updateJobOrder(editingOrder.id || editingOrder.code_number, updatedOrder);
      alert(`작업전표 [${editingOrder.code_number || editingOrder.id}] 정보가 수정 완료되었습니다.`);
      setShowJobEditModal(false);
      setEditingOrder(null);
    } catch (err) {
      alert('수정 에러: ' + err.message);
    }
  };

  // 💡 납품 완료 빠른 처리 핸들러 (전표/매출 공통)
  const handleMarkDelivered = async (item) => {
    const title = item.displayTitle || item.title || '납품 건';
    if (!window.confirm(`[${title}] 항목을 [납품완료] 상태로 변경하시겠습니까?`)) return;

    try {
      if (item.itemType === 'jobOrder') {
        await updateJobOrder(item.code_number || item.id, {
          ...item,
          status: '납품완료',
        });
      } else {
        await updateSales(item.id, {
          ...item,
          billing_schedule: '납품완료',
        });
      }
      alert(`[${title}] 항목이 [납품완료] 처리되었습니다.`);
    } catch (err) {
      alert('상태 변경 에러: ' + err.message);
    }
  };

  // 💡 매출 건 납품 일정 수정 저장 헬퍼
  const handleSaveEditedSaleSchedule = async (e) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      await updateSales(editingSale.id, editingSale);
      alert(`[${editingSale.title || editingSale.id}] 납품 일정이 수정 완료되었습니다.`);
      setShowSaleScheduleModal(false);
      setEditingSale(null);
    } catch (err) {
      alert('일정 수정 에러: ' + err.message);
    }
  };

  // 💡 대시보드 직접 신규 매출/견적 등록 상태
  const loggedInUserName = user?.name || '관리자';
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const defaultNewSaleForm = {
    reg_date: todayStr,
    receipt_date: todayStr,
    customer_id: '',
    customer_name: '',
    dept: user?.dept || (selectedTeamGroup && selectedTeamGroup !== 'ALL' ? selectedTeamGroup : '세종영업본부'),
    team: user?.team || '영업2조',
    contact_person: '',
    phone: '',
    email: '',
    sales_manager: loggedInUserName,
    title: '',
    content: '',
    note: '',
    delivery_date: todayStr,
    delivery_time: '',
    supply_price: '',

    tax: 0,
    total_price: '',
    billing_schedule: '진행중',
    type: '매출',
    calendar_synced: false,
    superthread_synced: false,
  };

  const [newSaleFormData, setNewSaleFormData] = useState(defaultNewSaleForm);

  const openNewSaleModal = () => {
    setNewSaleFormData(defaultNewSaleForm);
    setCustomerNameInput('');
    setShowCustomerDropdown(false);
    setShowNewSaleModal(true);
  };

  // 공급가액 입력 시 -> 부가세(10%) 및 총 청구금액 자동 계산
  const handleNewSalePriceChange = (val) => {
    if (val === '') {
      setNewSaleFormData(prev => ({
        ...prev,
        supply_price: '',
        tax: 0,
        total_price: '',
      }));
      return;
    }
    const supply = Number(val) || 0;
    const tax = Math.round(supply * 0.1);
    setNewSaleFormData(prev => ({
      ...prev,
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
  };

  // 총 청구금액(VAT 포함) 입력 시 -> 공급가액 및 부가세(10%) 자동 역산
  const handleNewSaleTotalPriceChange = (val) => {
    if (val === '') {
      setNewSaleFormData(prev => ({
        ...prev,
        total_price: '',
        supply_price: '',
        tax: 0,
      }));
      return;
    }
    const total = Number(val) || 0;
    const supply = Math.round(total / 1.1);
    const tax = total - supply;
    setNewSaleFormData(prev => ({
      ...prev,
      total_price: total,
      supply_price: supply,
      tax: tax,
    }));
  };

  // 고객 선택 핸들러
  const handleSelectCustomer = (cust) => {
    setCustomerNameInput(cust.name);
    setNewSaleFormData(prev => ({
      ...prev,
      customer_id: cust.id,
      customer_name: cust.name,
      dept: cust.dept || prev.dept,
      contact_person: cust.contact_person || '',
      phone: cust.phone || '',
      email: cust.email || '',
      sales_manager: cust.sales_manager || loggedInUserName,
    }));
    setShowCustomerDropdown(false);
  };

  // 신규 매출 제출 핸들러
  const handleSubmitNewSale = async (e) => {
    e.preventDefault();
    const custName = (customerNameInput || newSaleFormData.customer_name || '').trim();
    if (!custName) return alert('고객사명을 입력하거나 선택해 주세요.');
    if (!newSaleFormData.title) return alert('작업명을 입력해 주세요.');

    try {
      setSubmittingSale(true);
      let targetCustomerId = '';
      // 1. 기존 고객 목록 스마트 매칭 (이메일/연락처/성명 일치 시 동일 고객사로 자동 인식)
      const inputName = custName.toLowerCase();
      const inputDept = (newSaleFormData.dept || '').trim().toLowerCase();
      const inputContact = (newSaleFormData.contact_person || '').trim().toLowerCase();
      const inputEmail = (newSaleFormData.email || '').trim().toLowerCase();
      const inputPhone = (newSaleFormData.phone || '').trim();

      const matchedCust = customers.find(c => {
        const cName = (c.name || '').trim().toLowerCase();
        const cContact = (c.contact_person || '').trim().toLowerCase();
        const cEmail = (c.email || '').trim().toLowerCase();
        const cPhone = (c.phone || '').trim();

        if (inputEmail && cEmail && inputEmail === cEmail && cName === inputName) return true;
        if (inputPhone && cPhone && inputPhone === cPhone && cName === inputName) return true;
        if (cName === inputName && inputContact && cContact && (cContact.includes(inputContact) || inputContact.includes(cContact))) return true;
        const cDept = (c.dept || '').trim().toLowerCase();
        return cName === inputName && (!inputDept || !cDept || cDept === inputDept) && (!inputContact || !cContact || cContact === inputContact);
      });

      // 2. 미등록 고객인 경우만 신규 고객으로 자동 등록
      if (!matchedCust) {
        const newCustData = {
          name: custName,
          dept: newSaleFormData.dept || '',
          contact_person: newSaleFormData.contact_person || '',
          phone: newSaleFormData.phone || '',
          email: newSaleFormData.email || '',
          sales_manager: newSaleFormData.sales_manager || loggedInUserName,
        };
        const savedCust = await addCustomer(newCustData);
        targetCustomerId = savedCust?.id || `CUST-${Date.now()}`;
      } else {
        targetCustomerId = matchedCust.id;
        if (newSaleFormData.dept && !matchedCust.dept) {
          updateCustomer(matchedCust.id, { dept: newSaleFormData.dept });
        }
      }


      const salePayload = {
        ...newSaleFormData,
        customer_id: targetCustomerId,
        customer_name: custName,
        dept: newSaleFormData.dept || user?.dept || '세종영업본부',
        team: newSaleFormData.team || user?.team || '영업2조',
        sales_manager: newSaleFormData.sales_manager || loggedInUserName,
      };

      await addSales(salePayload);
      alert(!matchedCust ? '신규 고객 정보가 함께 저장되고, 매출이 등록되었습니다!' : '신규 매출이 정상 등록되었습니다!');
      setShowNewSaleModal(false);
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmittingSale(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
        <span>데이터베이스에서 신규 데이터를 조회 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && !error.includes('Quota exceeded') && !error.includes('Read requests') && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs">
          <strong>DB 읽기 에러:</strong> {error}
        </div>
      )}

      {/* 팀/부서 선택 배너 알림 */}
      {selectedTeamGroup && selectedTeamGroup !== 'ALL' && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>🏢 현재 <strong>[{selectedTeamGroup}]</strong> 팀/부서 자료만 모아보는 중입니다.</span>
          </div>
          <span className="text-[11px] text-sky-600 font-mono">총 {filteredJobOrders.length}건 수록</span>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-slate-800">업무 현황</h2>
        <p className="text-xs text-slate-500 mt-1">납품 및 미수 상태를 확인합니다.</p>
      </div>

      {/* ── 1. 🚚 실시간 납품 일정 급건 순서 리스트 (제일 위) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-900 text-white gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse flex-shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm text-white">납품 일정</h3>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {urgentDeliveryList.length}건
            </span>
          </div>

          <button
            onClick={openNewSaleModal}
            className="flex items-center space-x-1 sm:space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-sm transition active:scale-95 border border-sky-400/30 whitespace-nowrap"
            title="신규 매출/견적 수동 등록 팝업 열기"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>신규 <span className="hidden xs:inline">매출/견적 </span>등록</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 min-h-[650px] max-h-[780px] overflow-y-auto">
          {urgentDeliveryList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              등록된 납품 일정이 없습니다.
            </div>
          ) : (
            urgentDeliveryList.map((item) => {
              const isJobOrder = item.itemType === 'jobOrder';
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* 좌측: D-Day 뱃지, 코드, 작업명, 발주처/담당자 정보, 세부사양 */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono tracking-wide ${item.dday.color}`}>
                        {item.dday.label}
                      </span>

                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-xs ${
                        isJobOrder 
                          ? 'text-sky-700 bg-sky-50 border-sky-200' 
                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      }`}>
                        {isJobOrder ? `전표: ${item.displayCode}` : `매출: ${item.displayCode}`}
                      </span>

                      <h4 className="font-bold text-slate-900 text-sm">
                        {item.displayTitle}
                      </h4>
                    </div>

                    {/* 발주처 및 담당자 연락망 */}
                    <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          발주처: <strong className="text-slate-800">{item.customerNameDisplay}</strong>
                        </span>
                        {(() => {
                          const cust = customers.find(c => c.id === item.customer_id);
                          const contactPerson = cust?.contact_person || item.client_contact_person || item.contact_person || '';
                          const phone = cust?.phone || item.client_phone || item.phone || '';
                          const email = cust?.email || item.client_email || item.email || '';
                          const manager = item.manager_name || item.sales_manager || cust?.sales_manager || '';
                          if (!contactPerson && !phone && !email && !manager) return null;
                          return (
                            <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-medium">
                              {contactPerson && <span>👤 담당: <strong className="text-slate-700">{contactPerson}</strong></span>}
                              {phone && <span>📞 {phone}</span>}
                              {email && <span>✉️ {email}</span>}
                              {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-slate-500 pt-0.5">
                        {item.detailsText}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 납품 예정일시 및 2줄 조작 버튼 그룹 */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* 1줄: 납품 예정일시 + 진행상태 + ✏️ 연필 (전체 내용 수정) */}
                    <div className="flex items-center space-x-1.5">
                      <div className="text-right mr-1 hidden sm:block">
                        <span className="text-[10px] text-slate-400 font-medium mr-1">납품예정일:</span>
                        <span className="text-xs font-bold text-rose-600 font-mono">
                          {item.delivery_date} {item.delivery_time ? `(${item.delivery_time})` : ''}
                        </span>
                      </div>

                      {/* 1. 납품 상태 버튼 */}
                      {item.billing_schedule === '납품완료' || item.billing_schedule === '청구완료' || item.status === '납품완료' || item.status === '완료' ? (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>납품완료</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkDelivered(item)}
                          className="flex items-center space-x-1 bg-sky-600 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 whitespace-nowrap group"
                          title="현재 진행중 상태입니다. 클릭 시 [납품완료]로 변경됩니다."
                        >
                          <Truck className="w-3.5 h-3.5 group-hover:hidden" />
                          <CheckCircle2 className="w-3.5 h-3.5 hidden group-hover:inline" />
                          <span className="group-hover:hidden">진행중</span>
                          <span className="hidden group-hover:inline">완료 처리</span>
                        </button>
                      )}

                      {/* ✏️ 연필 아이콘: 전체 내용 수정 */}
                      <button
                        onClick={() => {
                          if (isJobOrder) {
                            setEditingOrder(item);
                            setShowJobEditModal(true);
                          } else {
                            setEditingSale({ ...item });
                            setShowSaleScheduleModal(true);
                          }
                        }}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition"
                        title="전체 내용 수정 (작업명, 발주처, 금액, 일정, 상세내용 등)"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>

                    {/* 2줄: 보조 기능 단추들 (견적서 작성, 캘린더, 알림, 전표 인쇄) */}
                    <div className="flex items-center space-x-1 text-xs">
                      <button
                        onClick={() => {
                          const cust = customers.find(c => c.id === item.customer_id);
                          setEstimatingSale({ sale: item, customer: cust });
                        }}
                        className="flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-lg font-bold transition"
                        title="상세 품목 단가 산출 및 매출액 자동 반영"
                      >
                        <Calculator className="w-3 h-3 text-sky-600" />
                        <span>견적서</span>
                      </button>

                      <button
                        onClick={() => handleAddToGoogleCalendar(item)}
                        className="flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-lg font-bold transition"
                        title="이 건만 구글 캘린더에 일정 등록"
                      >
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>캘린더</span>
                      </button>

                      <button
                        onClick={() => handleSendToSuperthread(item)}
                        className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg font-bold transition"
                        title="이 건만 슈퍼스레드 업무 채널로 전달"
                      >
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span>알림</span>
                      </button>

                      {isJobOrder && (
                        <button
                          onClick={() => setPrintingOrder(item)}
                          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-2 py-0.5 rounded-lg font-bold shadow-sm transition"
                        >
                          <Printer className="w-3 h-3" />
                          <span>인쇄</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 2. 📊 매출/수금/미수금 2단 현황 지표 (중간: 1행 누적 총괄 / 2행 당월 실적) ── */}
      <div className="space-y-2.5 sm:space-y-3">
        {/* 1행: 누적 총괄 현황 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">전체 누적 총괄 현황</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mb-0.5">총 매출 청구액 (누적)</p>
                <p className="text-base sm:text-lg font-black text-slate-900 font-mono">₩ {totalSalesAmount.toLocaleString()} 원</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-sm sm:text-base flex-shrink-0">₩</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 mb-0.5">총 입금/수금액 (누적)</p>
                <p className="text-base sm:text-lg font-black text-emerald-600 font-mono">₩ {totalPaymentAmount.toLocaleString()} 원</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-sm sm:text-base flex-shrink-0">₩</div>
            </div>

            <div className={`bg-white p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${isOverpaid ? 'border-amber-200 bg-amber-50/20' : 'border-rose-100 bg-rose-50/20'}`}>
              <div>
                <p className={`text-[10px] sm:text-[11px] font-semibold mb-0.5 ${isOverpaid ? 'text-amber-600' : 'text-rose-600'}`}>총 미수금 잔액 (누적)</p>
                <p className={`text-base sm:text-lg font-black font-mono ${isOverpaid ? 'text-amber-600' : 'text-rose-600'}`}>
                  {isOverpaid ? (
                    <span className="text-xs sm:text-sm font-semibold">₩ 0 원 <span className="text-[10px] sm:text-xs text-amber-500">(초과 {Math.abs(totalUnpaidAmount).toLocaleString()}원)</span></span>
                  ) : (
                    <>₩ {displayUnpaid.toLocaleString()} 원</>
                  )}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverpaid ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2행: 당월 실적 현황 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-sky-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentMonthDisplay} 당월 실적 현황 ({currentYearMonth})</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-sky-50/60 p-3 sm:p-4 rounded-2xl border border-sky-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold text-sky-800 mb-0.5">{currentMonthDisplay} 당월 매출 청구액</p>
                <p className="text-base sm:text-lg font-black text-sky-950 font-mono">₩ {currentMonthSalesAmount.toLocaleString()} 원</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[11px] sm:text-xs flex-shrink-0">당월</div>
            </div>

            <div className="bg-emerald-50/60 p-3 sm:p-4 rounded-2xl border border-emerald-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold text-emerald-800 mb-0.5">{currentMonthDisplay} 당월 입금/수금액</p>
                <p className="text-base sm:text-lg font-black text-emerald-700 font-mono">₩ {currentMonthPaymentAmount.toLocaleString()} 원</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] sm:text-xs flex-shrink-0">당월</div>
            </div>

            <div className={`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between ${currentMonthOverpaid ? 'bg-amber-50/60 border-amber-200/90' : 'bg-rose-50/60 border-rose-200/90'}`}>
              <div>
                <p className={`text-[10px] sm:text-[11px] font-bold mb-0.5 ${currentMonthOverpaid ? 'text-amber-800' : 'text-rose-800'}`}>{currentMonthDisplay} 당월 미수금 잔액</p>
                <p className={`text-base sm:text-lg font-black font-mono ${currentMonthOverpaid ? 'text-amber-700' : 'text-rose-700'}`}>
                  {currentMonthOverpaid ? (
                    <span className="text-xs sm:text-sm font-semibold">₩ 0 원 <span className="text-[10px] sm:text-xs text-amber-600">(초과 {Math.abs(currentMonthUnpaidAmount).toLocaleString()}원)</span></span>
                  ) : (
                    <>₩ {currentMonthDisplayUnpaid.toLocaleString()} 원</>
                  )}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs flex-shrink-0 ${currentMonthOverpaid ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                잔액
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 2. 고객사별 미수 관리 현황 (테이블 표 형태 + 다차원 분류 탭 + 엑셀 내보내기 + 일자별 상세 모달 연동) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* 상단 컨트롤 바: 타이틀, 분류 탭(담당자별/부서·과별/기관별), 검색창, 미수건 필터, 엑셀 다운로드 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <span>미수 관리 현황</span>
              <span className="text-xs font-normal text-slate-500 ml-1">
                (총 {filteredReceivables.length}건)
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              기관·부서·담당자별 실시간 매출 청구 및 수금 정산 내역을 표 형태로 조회합니다. 행을 클릭하면 일자별 상세 장부가 열립니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            
            {/* 1. 분류 기준 탭 */}
            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setReceivableGroupBy('contact')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  receivableGroupBy === 'contact'
                    ? 'bg-white text-sky-700 shadow-sm font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                👤 담당자별
              </button>
              <button
                type="button"
                onClick={() => setReceivableGroupBy('dept')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  receivableGroupBy === 'dept'
                    ? 'bg-white text-sky-700 shadow-sm font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                🏢 부서·과별
              </button>
              <button
                type="button"
                onClick={() => setReceivableGroupBy('org')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  receivableGroupBy === 'org'
                    ? 'bg-white text-sky-700 shadow-sm font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                🏛️ 기관별
              </button>
            </div>

            {/* 2. 검색창 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="기관/과/담당자 검색..."
                value={receivableSearch}
                onChange={(e) => setReceivableSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-36 sm:w-44 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 3. 미수잔액 발생건만 필터 토글 */}
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-2.5 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50">
              <input
                type="checkbox"
                checked={onlyUnpaidFilter}
                onChange={(e) => setOnlyUnpaidFilter(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>미수 잔액만</span>
            </label>

            {/* 4. 엑셀 다운로드 버튼 */}
            <button
              onClick={handleExportReceivablesExcel}
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 whitespace-nowrap"
              title="현재 조회된 미수 관리 목록을 엑셀(.xlsx) 파일로 내보냅니다."
            >
              <Download className="w-3.5 h-3.5" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* 미수 관리 데이터 테이블 */}
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          {filteredReceivables.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              조건에 일치하는 미수 관리 내역이 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                <tr>
                  <th className="p-3 pl-4">기관명 (고객사)</th>
                  <th className="p-3">부서 / 과</th>
                  <th className="p-3">담당자 / 연락처</th>
                  <th className="p-3">담당영업</th>
                  <th className="p-3 text-right">총 매출 청구액</th>
                  <th className="p-3 text-right">총 수금액</th>
                  <th className="p-3 text-right font-black text-rose-700">미수금 잔액</th>
                  <th className="p-3 text-center">최근거래일</th>
                  <th className="p-3 text-center pr-4">상세내역</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceivables.map((item) => {
                  const hasUnpaid = item.unpaid > 0;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedCustomer(item)}
                      className="hover:bg-sky-50/60 transition cursor-pointer group"
                    >
                      <td className="p-3 pl-4 font-bold text-slate-900 group-hover:text-sky-700">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {item.dept || '-'}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{item.contact_person || '-'}</span>
                          {(item.phone || item.email) && (
                            <span className="text-[11px] text-slate-400">
                              {item.phone} {item.email ? `| ${item.email}` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.sales_manager ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[11px] font-semibold">
                            {item.sales_manager}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        ₩ {item.totalSales.toLocaleString()} 원
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        ₩ {item.totalPayment.toLocaleString()} 원
                      </td>
                      <td className="p-3 text-right font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded-lg font-black ${
                          hasUnpaid
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          ₩ {item.unpaid.toLocaleString()} 원
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                        {item.lastTradeDate}
                      </td>
                      <td className="p-3 text-center pr-4" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(item); }}>
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-white hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-300 rounded-lg text-[11px] font-bold shadow-xs transition"
                        >
                          일자별 내역
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200 sticky bottom-0 z-10">
                <tr>
                  <td className="p-3 pl-4" colSpan={4}>
                    합계 ({filteredReceivables.length}건)
                  </td>
                  <td className="p-3 text-right font-mono text-slate-900">
                    ₩ {filteredReceivables.reduce((a, c) => a + c.totalSales, 0).toLocaleString()} 원
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700">
                    ₩ {filteredReceivables.reduce((a, c) => a + c.totalPayment, 0).toLocaleString()} 원
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700 font-black">
                    ₩ {filteredReceivables.reduce((a, c) => a + c.unpaid, 0).toLocaleString()} 원
                  </td>
                  <td className="p-3" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>


      {/* 고객사 상세보기 모달 */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={sales}
          payments={payments}
          onClose={() => setSelectedCustomer(null)}
        />
      )}


      {/* 1:1 실물 전표 인쇄 모달 */}
      {printingOrder && (
        <JobOrderPrintModal
          order={printingOrder}
          customer={customers.find(c => c.id === printingOrder.customer_id)}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* 대시보드 납품 리스트 전표 직접 수정 모달 */}
      {showJobEditModal && editingOrder && (
        <JobOrderModal
          customers={customers}
          initialData={editingOrder}
          onSave={handleSaveEditedJobOrder}
          onClose={() => {
            setShowJobEditModal(false);
            setEditingOrder(null);
          }}
        />
      )}

      {/* 💡 대시보드 매출 건 전체 상세 내용 수정 모달 */}
      {showSaleScheduleModal && editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditedSaleSchedule} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">매출/견적 세부 내역 수정</h3>
                <p className="text-xs text-sky-600 font-semibold mt-0.5">{editingSale.title}</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowSaleScheduleModal(false);
                  setEditingSale(null);
                }} 
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">작업명 (제목) *</label>
                <input
                  type="text"
                  required
                  value={editingSale.title || ''}
                  onChange={e => setEditingSale({ ...editingSale, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">진행 상태</label>
                <select
                  value={editingSale.billing_schedule || '진행중'}
                  onChange={e => setEditingSale({ ...editingSale, billing_schedule: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="진행중">⏳ 진행중</option>
                  <option value="납품완료">🚚 납품완료</option>
                  <option value="청구완료">✅ 청구완료 (수금완료)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                  <input
                    type="number"
                    value={editingSale.supply_price || ''}
                    onChange={e => {
                      const sp = parseFloat(e.target.value) || 0;
                      const vat = Math.round(sp * 0.1);
                      setEditingSale({
                        ...editingSale,
                        supply_price: e.target.value,
                        total_price: String(sp + vat),
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                  <input
                    type="number"
                    value={editingSale.total_price || ''}
                    onChange={e => setEditingSale({ ...editingSale, total_price: e.target.value })}
                    className="w-full p-2.5 bg-sky-50/40 border border-sky-200 rounded-xl text-xs font-bold text-sky-800 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 예정일</label>
                  <input
                    type="date"
                    value={editingSale.delivery_date || ''}
                    onChange={e => setEditingSale({ ...editingSale, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">납품 시간</label>
                    {editingSale.delivery_time ? (
                      <button
                        type="button"
                        onClick={() => setEditingSale({ ...editingSale, delivery_time: '' })}
                        className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
                      >
                        ✕ 시간 미지정
                      </button>
                    ) : (
                      <span className="text-[11px] text-sky-600 font-bold">종일</span>
                    )}
                  </div>
                  <input
                    type="time"
                    value={editingSale.delivery_time || ''}
                    onChange={e => setEditingSale({ ...editingSale, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용 / 비고</label>
                <textarea
                  rows={3}
                  placeholder="작업 내용 또는 일정 관련 특이사항"
                  value={editingSale.content || ''}
                  onChange={e => setEditingSale({ ...editingSale, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSaleScheduleModal(false);
                  setEditingSale(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
              >
                변경사항 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 💡 대시보드 신규 매출/견적 수동 등록 모달 */}

      {showNewSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitNewSale} className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">신규 매출/견적 수동 등록</h3>
                  <p className="text-[11px] text-slate-400 font-medium">대시보드 빠른 접수</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNewSaleModal(false)} 
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex space-x-4 text-xs font-bold text-slate-700">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dashboardSaleType"
                  value="매출"
                  checked={newSaleFormData.type === '매출'}
                  onChange={e => setNewSaleFormData({ ...newSaleFormData, type: e.target.value })}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>매출 건</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dashboardSaleType"
                  value="견적"
                  checked={newSaleFormData.type === '견적'}
                  onChange={e => setNewSaleFormData({ ...newSaleFormData, type: e.target.value })}
                  className="text-sky-600 focus:ring-sky-500"
                />
                <span>견적 건</span>
              </label>
            </div>

            {/* 거래처 정보 입력 영역 */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <span>🏢 고객(거래처) 정보</span>
                </span>
                {(() => {
                  const inputName = (customerNameInput || newSaleFormData.customer_name || '').trim().toLowerCase();
                  const inputDept = (newSaleFormData.dept || '').trim().toLowerCase();
                  const inputContact = (newSaleFormData.contact_person || '').trim().toLowerCase();
                  if (!inputName) return null;

                  const isFullyMatched = customers.some(c => 
                    (c.name || '').trim().toLowerCase() === inputName &&
                    (c.dept || '').trim().toLowerCase() === inputDept &&
                    (c.contact_person || '').trim().toLowerCase() === inputContact
                  );

                  if (isFullyMatched) {
                    return (
                      <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                        ✓ 등록 고객 연결됨
                      </span>
                    );
                  }
                  return (
                    <span className="text-[11px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                      + 저장 시 신규 고객 자동 등록
                    </span>
                  );
                })()}
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. 고객사명 실시간 검색 드롭다운 */}
                <div ref={customerDropdownRef} className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">고객사명 *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="고객사명 검색 또는 직접 입력"
                      value={customerNameInput}
                      onChange={e => {
                        setCustomerNameInput(e.target.value);
                        setNewSaleFormData({ ...newSaleFormData, customer_name: e.target.value });
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Escape' || e.key === 'Enter') setShowCustomerDropdown(false);
                      }}
                      className="w-full p-2.5 pr-7 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                    {customerNameInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerNameInput('');
                          setNewSaleFormData({
                            ...newSaleFormData,
                            customer_id: '',
                            customer_name: '',
                            dept: '',
                            contact_person: '',
                            phone: '',
                            email: '',
                          });
                          setShowCustomerDropdown(false);
                        }}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {showCustomerDropdown && customerNameInput.trim() && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                        <span>등록 고객 검색 결과</span>
                        <button
                          type="button"
                          onClick={() => setShowCustomerDropdown(false)}
                          className="text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 text-[11px]"
                        >
                          ✕ 닫기
                        </button>
                      </div>
                      {customers
                        .filter(c => 
                          (c.name || '').toLowerCase().includes(customerNameInput.toLowerCase()) ||
                          (c.dept || '').toLowerCase().includes(customerNameInput.toLowerCase()) ||
                          (c.contact_person || '').toLowerCase().includes(customerNameInput.toLowerCase())
                        )
                        .map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-2.5 hover:bg-sky-50 cursor-pointer flex flex-col transition"
                          >
                            <span className="font-bold text-slate-800">{c.name} {c.dept ? `(${c.dept})` : ''}</span>
                            <span className="text-[11px] text-slate-400">
                              {c.contact_person ? `담당: ${c.contact_person}` : ''} {c.phone ? `| ${c.phone}` : ''}
                            </span>
                          </div>
                        ))}
                      <div 
                        onClick={() => setShowCustomerDropdown(false)}
                        className="p-2.5 text-center text-sky-600 font-bold hover:bg-sky-50 cursor-pointer bg-slate-50/70 text-[11px] border-t border-slate-100"
                      >
                        + '{customerNameInput}' 신규 직접 입력 (목록 닫기)
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">과/부서명</label>
                  <input
                    type="text"
                    placeholder="예: 해상풍력발전위원회"
                    value={newSaleFormData.dept}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, dept: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 성명</label>
                  <input
                    type="text"
                    placeholder="담당자 이름"
                    value={newSaleFormData.contact_person}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, contact_person: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 연락처</label>
                  <input
                    type="text"
                    placeholder="010-0000-0000"
                    value={newSaleFormData.phone}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, phone: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 이메일</label>
                  <input
                    type="email"
                    placeholder="contact@example.com"
                    value={newSaleFormData.email}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, email: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">영업담당자</label>
                  <input
                    type="text"
                    placeholder="영업담당자 이름"
                    value={newSaleFormData.sales_manager}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, sales_manager: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* ── 📅 일정 정보 (접수일자 / 납품예정일 / 납품시간 3열 배치) ── */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                접수 및 납품 일정
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. 접수일자 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <span>접수일자 *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newSaleFormData.receipt_date || newSaleFormData.reg_date || todayStr}
                    onChange={(e) => {
                      setNewSaleFormData({
                        ...newSaleFormData,
                        receipt_date: e.target.value,
                        reg_date: e.target.value,
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 2. 납품 예정일 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" />
                    <span>납품 예정일 *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newSaleFormData.delivery_date || todayStr}
                    onChange={(e) => setNewSaleFormData({ ...newSaleFormData, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-emerald-900 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* 3. 납품 시간 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>납품 시간</span>
                    </label>
                    {newSaleFormData.delivery_time ? (
                      <button
                        type="button"
                        onClick={() => setNewSaleFormData({ ...newSaleFormData, delivery_time: '' })}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-bold underline"
                      >
                        시간 해제
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">종일</span>
                    )}
                  </div>
                  <input
                    type="time"
                    value={newSaleFormData.delivery_time || ''}
                    onChange={(e) => setNewSaleFormData({ ...newSaleFormData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* 작업 정보 */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">작업명 (제목) *</label>
                  <input
                    type="text"
                    required
                    placeholder="작업 제목 입력"
                    value={newSaleFormData.title}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">진행 상태</label>
                  <select
                    value={newSaleFormData.billing_schedule}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, billing_schedule: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="진행중">⏳ 진행중</option>
                    <option value="납품완료">🚚 납품완료</option>
                    <option value="청구완료">✅ 청구완료 (수금완료)</option>
                  </select>
                </div>
              </div>

              {/* 금액 양방향 자동 계산 */}

              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newSaleFormData.supply_price}
                      onChange={e => handleNewSalePriceChange(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newSaleFormData.total_price}
                      onChange={e => handleNewSaleTotalPriceChange(e.target.value)}
                      className="w-full p-2.5 bg-sky-50/40 border border-sky-200 rounded-xl font-bold text-sky-800 text-xs focus:border-sky-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                  <span>💡 공급가액 또는 총액 중 하나만 입력해도 자동 계산</span>
                  {Number(newSaleFormData.tax) > 0 && (
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      부가세: ₩{Number(newSaleFormData.tax).toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>



              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용</label>
                <textarea
                  rows={2}
                  placeholder="작업 상세 내용 입력"
                  value={newSaleFormData.content}
                  onChange={e => setNewSaleFormData({ ...newSaleFormData, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewSaleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submittingSale}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 shadow-sm"
              >
                {submittingSale ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 📑 견적서 작성 및 매출액 자동 연동 모달 ── */}
      {estimatingSale && (
        <EstimateModal
          sale={estimatingSale.sale}
          customer={estimatingSale.customer}
          onClose={() => setEstimatingSale(null)}
          onSave={async (updatedItem) => {
            if (updatedItem.itemType === 'jobOrder' || updatedItem.code_number) {
              await updateJobOrder(updatedItem.id || updatedItem.code_number, updatedItem);
              alert(`[${updatedItem.displayCode || updatedItem.code_number}] 전표의 견적 금액이 ₩${Number(updatedItem.total_price).toLocaleString()}원으로 갱신되었습니다!`);
            } else {
              await updateSales(updatedItem.id, updatedItem);
              alert(`[${updatedItem.title}] 매출 건의 견적 금액이 ₩${Number(updatedItem.total_price).toLocaleString()}원으로 자동 반영되었습니다!`);
            }
          }}

          onPrint={(quoteData, custData) => {
            setPrintingEstimateQuote({ quote: quoteData, customer: custData });
          }}
        />
      )}

      {/* ── 🖨️ 견적서 인쇄 / 엑셀 출력 모달 ── */}
      {printingEstimateQuote && (
        <QuotePrintModal
          quote={printingEstimateQuote.quote}
          customer={printingEstimateQuote.customer}
          onClose={() => setPrintingEstimateQuote(null)}
        />
      )}

    </div>
  );
}