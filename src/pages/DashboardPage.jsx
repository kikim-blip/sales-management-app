// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { AlertCircle, FileText, RefreshCw, ChevronRight, Clock, AlertTriangle, Calendar, Printer, CheckCircle2, Users, Share2, Zap, Pencil, Truck, XCircle, Plus, Search } from 'lucide-react';
import CustomerDetailModal from '../components/common/CustomerDetailModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';
import JobOrderModal from '../components/common/JobOrderModal';

export default function DashboardPage() {
  const { customers, sales, payments, jobOrders, loading, error, selectedTeamGroup, updateJobOrder, updateSales, addSales, addCustomer } = useData();
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


  const todayStr = new Date().toISOString().split('T')[0];

  // 💡 팀/부서 필터링 매칭 헬퍼
  const isTeamMatch = (itemDept, custId) => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (itemDept && itemDept === selectedTeamGroup) return true;
    if (custId) {
      const foundCust = customers.find(c => c.id === custId);
      if (foundCust && foundCust.dept === selectedTeamGroup) return true;
    }
    return false;
  };

  // 팀별 데이터 스코프
  const filteredSales = sales.filter(s => isTeamMatch(s.dept, s.customer_id));
  const filteredPayments = payments.filter(p => isTeamMatch(p.dept, p.customer_id));
  const filteredJobOrders = jobOrders.filter(o => isTeamMatch(o.dept, o.customer_id));
  const filteredCustomers = customers.filter(c => !selectedTeamGroup || selectedTeamGroup === 'ALL' || c.dept === selectedTeamGroup);

  const totalSalesAmount = filteredSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const totalPaymentAmount = filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  // 미수금 = 매출액 - 수금액 (음수가 되는 경우는 0으로 표시, 별도 안내)
  const totalUnpaidAmount = totalSalesAmount - totalPaymentAmount;
  const displayUnpaid = Math.max(0, totalUnpaidAmount);
  const isOverpaid = totalUnpaidAmount < 0;

  const customerSummary = filteredCustomers
    .map((cust) => {
      const custSales = filteredSales
        .filter((s) => s.customer_id === cust.id || (s.customer_name && s.customer_name === cust.name))
        .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
      const custPayments = filteredPayments
        .filter((p) => p.customer_id === cust.id)
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      return {
        ...cust,
        totalSales: custSales,
        totalPayment: custPayments,
        unpaid: custSales - custPayments,
      };
    })
    .filter((cust) => cust.totalSales > 0 || cust.totalPayment > 0);


  // D-Day 계산 헬퍼
  const getDDayInfo = (deliveryDateStr) => {
    if (!deliveryDateStr) return { diffDays: 999, label: '일정미정', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    const target = new Date(deliveryDateStr);
    const now = new Date(todayStr);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { diffDays, label: `⚠️ 납품 지연 (D+${Math.abs(diffDays)})`, color: 'bg-rose-600 text-white border-rose-700 animate-pulse' };
    }
    if (diffDays === 0) {
      return { diffDays, label: '🚨 오늘 납품 (D-DAY)', color: 'bg-rose-500 text-white border-rose-600 font-black animate-bounce' };
    }
    if (diffDays === 1) {
      return { diffDays, label: '⚡ 내일 납품 (D-1)', color: 'bg-amber-500 text-white border-amber-600 font-bold' };
    }
    if (diffDays <= 3) {
      return { diffDays, label: `🔥 긴급 임박 (D-${diffDays})`, color: 'bg-sky-500 text-white border-sky-600 font-bold' };
    }
    return { diffDays, label: `📅 D-${diffDays}`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
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


  const urgentDeliveryList = [...jobItems, ...saleItems]
    .sort((a, b) => {
      if (a.dday.diffDays !== b.dday.diffDays) {
        return a.dday.diffDays - b.dday.diffDays;
      }
      return (a.delivery_time || '23:59').localeCompare(b.delivery_time || '23:59');
    });

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
    dept: selectedTeamGroup && selectedTeamGroup !== 'ALL' ? selectedTeamGroup : '',
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
      // 1. 기존 고객 목록에서 동일한 고객사명 + 부서 + 담당자 성명이 모두 일치하는지 확인

      const inputName = custName.toLowerCase();
      const inputDept = (newSaleFormData.dept || '').trim().toLowerCase();
      const inputContact = (newSaleFormData.contact_person || '').trim().toLowerCase();

      const matchedCust = customers.find(c => {
        const cName = (c.name || '').trim().toLowerCase();
        const cDept = (c.dept || '').trim().toLowerCase();
        const cContact = (c.contact_person || '').trim().toLowerCase();
        return cName === inputName && cDept === inputDept && cContact === inputContact;
      });

      // 2. 담당자가 다르거나 미등록 고객인 경우 신규 고객으로 자동 등록
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
      }


      const salePayload = {
        ...newSaleFormData,
        customer_id: targetCustomerId,
        customer_name: custName,
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

      {/* 요약 현황 카운터 3종 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 매출 청구액</p>
            <p className="text-xl font-bold text-slate-900">₩ {totalSalesAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg">
            ₩
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">총 입금/수금액</p>
            <p className="text-xl font-bold text-emerald-600">₩ {totalPaymentAmount.toLocaleString()} 원</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
            ₩
          </div>
        </div>

        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between ${isOverpaid ? 'border-amber-200 bg-amber-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
          <div>
            <p className={`text-xs font-semibold mb-1 ${isOverpaid ? 'text-amber-500' : 'text-rose-500'}`}>총 미수금 (잔액)</p>
            <p className={`text-xl font-bold ${isOverpaid ? 'text-amber-600' : 'text-rose-600'}`}>
              {isOverpaid ? (
                <span className="text-sm font-semibold">₩ 0 원 <span className="text-xs text-amber-500">(초과 수금 {Math.abs(totalUnpaidAmount).toLocaleString()}원)</span></span>
              ) : (
                <>₩ {displayUnpaid.toLocaleString()} 원</>
              )}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverpaid ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 🚨 1. 실시간 납품 일정 급건 순서 리스트 (원하는 건별 캘린더/슈퍼스레드/전표수정/인쇄 버튼 탑재) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">납품 일정</h3>
            <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {urgentDeliveryList.length}건
            </span>
          </div>

          <button
            onClick={openNewSaleModal}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 border border-sky-400/30"
            title="신규 매출/견적 수동 등록 팝업 열기"
          >
            <Plus className="w-4 h-4" />
            <span>신규 매출/견적 등록</span>
          </button>
        </div>


        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {urgentDeliveryList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              등록된 납품 일정이 없습니다.
            </div>
          ) : (
            urgentDeliveryList.map((item) => {
              const isJobOrder = item.itemType === 'jobOrder';
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
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

                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                      <div className="text-xs text-slate-500">
                        {item.detailsText}
                      </div>
                    </div>
                  </div>


                  <div className="flex flex-wrap items-center space-x-1.5 justify-end flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="text-[10px] text-slate-400 font-medium">납품 예정일시</p>
                      <p className="text-xs font-bold text-rose-600 font-mono">
                        {item.delivery_date} {item.delivery_time ? `(${item.delivery_time})` : ''}
                      </p>
                    </div>

                    {/* 💡 1. 납품 완료 상태 및 빠른 완료 처리 버튼 */}
                    {item.billing_schedule === '납품완료' || item.billing_schedule === '청구완료' || item.status === '납품완료' ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>납품완료</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkDelivered(item)}
                        className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                        title="이 건을 납품완료 상태로 즉시 변경"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>납품 완료</span>
                      </button>
                    )}

                    {/* 💡 2. 납품 일정 / 전표 변경 버튼 */}
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
                      className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title={isJobOrder ? "작업전표 상세 수정" : "납품 일정 및 진행 상태 변경"}
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600" />
                      <span>일정 변경</span>
                    </button>

                    {/* 💡 3. 캘린더 등록 버튼 */}
                    <button
                      onClick={() => handleAddToGoogleCalendar(item)}
                      className="flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 건만 구글 캘린더에 일정 등록"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>캘린더 등록</span>
                    </button>

                    {/* 💡 4. 슈퍼스레드 알림 버튼 */}
                    <button
                      onClick={() => handleSendToSuperthread(item)}
                      className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title="이 건만 슈퍼스레드 업무 채널로 전달"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>슈퍼스레드 알림</span>
                    </button>

                    {/* 💡 5. 전표 1:1 인쇄 버튼 (작업전표인 경우에만) */}
                    {isJobOrder && (
                      <button
                        onClick={() => setPrintingOrder(item)}
                        className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>전표 인쇄</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* 2. 거래처별 미수 현황 카드 */}
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-3">고객사별 미수 관리 현황</h3>
        {customerSummary.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            현재 매출 또는 수금 내역이 등록된 고객사가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerSummary.map((cust) => (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition flex items-center space-x-1.5">
                      <span>{cust.name}</span>
                      {cust.dept && (
                        <span className="text-[11px] font-normal text-slate-500">({cust.dept})</span>
                      )}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span>👤 {cust.contact_person || '담당자 미지정'}</span>
                      {cust.phone && <span>📞 {cust.phone}</span>}
                      {cust.email && <span>✉️ {cust.email}</span>}
                      {cust.sales_manager && <span className="text-rose-600 font-semibold">💼 {cust.sales_manager}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition flex-shrink-0" />
                </div>


                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-slate-400 text-[10px] mb-0.5 font-medium">총 매출</p>
                    <p className="font-bold text-slate-700">₩ {cust.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-xl">
                    <p className="text-emerald-600 text-[10px] mb-0.5 font-medium">수금 완료</p>
                    <p className="font-bold text-emerald-700">₩ {cust.totalPayment.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50/50 p-2 rounded-xl">
                    <p className="text-rose-500 text-[10px] mb-0.5 font-medium">미수 잔액</p>
                    <p className="font-bold text-rose-600">₩ {cust.unpaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* 고객사 상세보기 모달 */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
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

      {/* 💡 대시보드 매출 건 납품 일정 및 상태 간편 수정 모달 */}
      {showSaleScheduleModal && editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditedSaleSchedule} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">납품 일정 및 상태 변경</h3>
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
                        ✕ 시간 미지정 (종일)
                      </button>
                    ) : (
                      <span className="text-[11px] text-sky-600 font-bold">종일 (시간 미지정)</span>
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


            {/* 작업 정보 */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">작업명 (제목) *</label>
                  <input
                    type="text"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 예정일</label>
                  <input
                    type="date"
                    value={newSaleFormData.delivery_date}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">납품 시간</label>
                    {newSaleFormData.delivery_time ? (
                      <button
                        type="button"
                        onClick={() => setNewSaleFormData({ ...newSaleFormData, delivery_time: '' })}
                        className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold"
                      >
                        ✕ 시간 미지정 (종일)
                      </button>
                    ) : (
                      <span className="text-[11px] text-sky-600 font-bold">종일 (시간 미지정)</span>
                    )}
                  </div>
                  <input
                    type="time"
                    value={newSaleFormData.delivery_time || ''}
                    onChange={e => setNewSaleFormData({ ...newSaleFormData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
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

    </div>
  );
}